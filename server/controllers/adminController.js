const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");

/* ─── Dashboard Stats ─────────────────────────────────────────────────────── */

const getDashboardStats = asyncHandler(async (_req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
  const yearStart = new Date(todayStart.getFullYear(), 0, 1);

  // Build last 7 days labels
  const last7Days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(todayStart);
    date.setDate(todayStart.getDate() - (6 - index));
    return date;
  });

  // Build last 12 months labels
  const last12Months = Array.from({ length: 12 }).map((_, index) => {
    const date = new Date(todayStart.getFullYear(), todayStart.getMonth() - (11 - index), 1);
    return date;
  });

  const [
    totalUsers,
    newUsersThisMonth,
    lowStockCount,
    ordersToday,
    ordersThisMonth,
    revenueAggregate,
    recentOrders,
    lowStockProducts,
    allOrders,
    allUsers,
    topProductsAggregate
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: monthStart } }),
    Product.countDocuments({ $expr: { $lt: ["$stock", "$lowStockThreshold"] } }),
    Order.countDocuments({ createdAt: { $gte: todayStart } }),
    Order.countDocuments({ createdAt: { $gte: monthStart } }),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, revenue: { $sum: "$pricing.total" } } }
    ]),
    Order.find().sort({ createdAt: -1 }).limit(10).populate("user", "name email"),
    Product.find({ $expr: { $lt: ["$stock", "$lowStockThreshold"] } })
      .sort({ stock: 1 })
      .limit(10)
      .populate("category", "name"),
    Order.find({ createdAt: { $gte: last7Days[0] } }),
    User.find({ createdAt: { $gte: yearStart } }).select("createdAt"),
    Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.name", totalSold: { $sum: "$items.qty" }, revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ])
  ]);

  // Daily chart (last 7 days)
  const chartData = last7Days.map((date) => {
    const label = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    const dayOrders = allOrders.filter(
      (order) => new Date(order.createdAt).toDateString() === date.toDateString()
    );
    const revenue = dayOrders
      .filter((order) => order.paymentStatus === "paid")
      .reduce((sum, order) => sum + order.pricing.total, 0);

    return { date: label, orders: dayOrders.length, revenue: Number(revenue.toFixed(2)) };
  });

  // Monthly revenue chart (last 12 months)
  const monthlyRevenueData = await Order.aggregate([
    { $match: { paymentStatus: "paid", createdAt: { $gte: last12Months[0] } } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        revenue: { $sum: "$pricing.total" },
        orders: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  const monthlyChartData = last12Months.map((date) => {
    const label = date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    const match = monthlyRevenueData.find(
      (item) => item._id.year === date.getFullYear() && item._id.month === date.getMonth() + 1
    );
    return { month: label, revenue: match ? Number(match.revenue.toFixed(2)) : 0, orders: match?.orders || 0 };
  });

  // User growth per month (last 12 months)
  const userGrowth = last12Months.map((date) => {
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    const label = date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    const count = allUsers.filter(
      (user) => new Date(user.createdAt) >= date && new Date(user.createdAt) < nextMonth
    ).length;
    return { month: label, users: count };
  });

  // Status breakdown
  const statusBreakdown = ["placed", "confirmed", "packed", "out_for_delivery", "delivered", "cancelled"].map(
    (status) => ({
      name: status.replace(/_/g, " "),
      value: allOrders.filter((order) => order.status === status).length
    })
  );

  res.json({
    stats: {
      ordersToday,
      ordersThisMonth,
      totalRevenue: revenueAggregate[0]?.revenue || 0,
      totalUsers,
      newUsersThisMonth,
      lowStockCount
    },
    charts: {
      dailyOrders: chartData,
      dailyRevenue: chartData,
      monthlyRevenue: monthlyChartData,
      userGrowth,
      statusBreakdown,
      topProducts: topProductsAggregate
    },
    recentOrders,
    lowStockProducts
  });
});

/* ─── Orders ──────────────────────────────────────────────────────────────── */

const getAdminOrders = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (status && status !== "all") filter.status = status;
  if (search) filter.orderId = { $regex: search, $options: "i" };

  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("storeId", "name city")
      .populate("user", "name email"),
    Order.countDocuments(filter)
  ]);

  res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

/* ─── Users ───────────────────────────────────────────────────────────────── */

const getAdminUsers = asyncHandler(async (req, res) => {
  const { search, role, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (role && role !== "all") filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter)
  ]);

  res.json({ users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!["user", "admin"].includes(role)) {
    res.status(400);
    throw new Error("Invalid role. Must be 'user' or 'admin'.");
  }

  if (req.params.userId === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot change your own role.");
  }

  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { role },
    { new: true, select: "-password -refreshToken" }
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({ message: `Role updated to ${role}`, user });
});

const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.userId === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot delete your own account from admin panel.");
  }

  const user = await User.findByIdAndDelete(req.params.userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({ message: "User deleted successfully" });
});

/* ─── Inventory ───────────────────────────────────────────────────────────── */

const getInventoryAlerts = asyncHandler(async (_req, res) => {
  const products = await Product.find({
    $expr: { $lt: ["$stock", "$lowStockThreshold"] }
  })
    .sort({ stock: 1 })
    .populate("category", "name slug");

  res.json(products);
});

const restockProduct = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || Number(quantity) <= 0) {
    res.status(400);
    throw new Error("Quantity must be a positive number");
  }

  const product = await Product.findByIdAndUpdate(
    req.params.productId,
    { $inc: { stock: Number(quantity) } },
    { new: true }
  ).populate("category", "name");

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json({ message: `Restocked ${quantity} units`, product });
});

module.exports = {
  getDashboardStats,
  getAdminOrders,
  getAdminUsers,
  updateUserRole,
  deleteUser,
  getInventoryAlerts,
  restockProduct
};

const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const AdminAuditLog = require("../models/AdminAuditLog");
const asyncHandler = require("../middleware/asyncHandler");
const { logAdminAction } = require("../services/adminAuditService");
const { escapeRegex } = require("../utils/regex");

/* ─── Dashboard Stats (Full Aggregation Pipeline) ─────────────────────────── */

const getDashboardStats = asyncHandler(async (_req, res) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const last7DaysStart = new Date(todayStart);
  last7DaysStart.setDate(todayStart.getDate() - 6);
  const last12MonthsStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // All stats via parallel aggregation pipelines — no OOM risk
  const [
    summaryStats,
    dailyChartRaw,
    monthlyRevenueRaw,
    userGrowthRaw,
    statusBreakdownRaw,
    topProductsRaw,
    recentOrders,
    lowStockProducts
  ] = await Promise.all([
    // Summary counts + revenue
    Promise.all([
      User.countDocuments({ isActive: { $ne: false } }),
      User.countDocuments({ createdAt: { $gte: monthStart }, isActive: { $ne: false } }),
      Product.countDocuments({ $expr: { $lt: ["$stock", "$lowStockThreshold"] }, isDeleted: { $ne: true } }),
      Order.countDocuments({ createdAt: { $gte: todayStart }, status: { $ne: "pending_payment" } }),
      Order.countDocuments({ createdAt: { $gte: monthStart }, status: { $ne: "pending_payment" } }),
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, revenue: { $sum: "$pricing.total" } } }
      ])
    ]),

    // Daily orders + revenue — last 7 days (aggregation, not JS filter)
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: last7DaysStart },
          status: { $ne: "pending_payment" }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" }
          },
          orders: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$pricing.total", 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Monthly revenue — last 12 months
    Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          createdAt: { $gte: last12MonthsStart }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } },
            month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } }
          },
          revenue: { $sum: "$pricing.total" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]),

    // User growth — last 12 months
    User.aggregate([
      { $match: { createdAt: { $gte: last12MonthsStart } } },
      {
        $group: {
          _id: {
            year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } },
            month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } }
          },
          users: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]),

    // Order status breakdown
    Order.aggregate([
      { $match: { status: { $ne: "pending_payment" } } },
      { $group: { _id: "$status", value: { $sum: 1 } } }
    ]),

    // Top products by quantity sold (includes product name!)
    Order.aggregate([
      { $match: { status: { $nin: ["cancelled", "pending_payment"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          productName: { $first: "$items.name" },
          totalSold: { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]),

    // Recent orders
    Order.find({ status: { $ne: "pending_payment" } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("user", "name email")
      .select("orderId status pricing.total paymentMethod paymentStatus createdAt user"),

    // Low stock
    Product.find({
      $expr: { $lt: ["$stock", "$lowStockThreshold"] },
      isDeleted: { $ne: true }
    })
      .sort({ stock: 1 })
      .limit(10)
      .populate("category", "name")
      .select("name brand stock lowStockThreshold image category")
  ]);

  // Destructure summary parallel results
  const [
    totalUsers,
    newUsersThisMonth,
    lowStockCount,
    ordersToday,
    ordersThisMonth,
    revenueAggregate
  ] = summaryStats;

  // Build last 7 days axis labels
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(todayStart);
    d.setDate(todayStart.getDate() - (6 - i));
    return d;
  });

  const dailyChartMap = new Map(dailyChartRaw.map((row) => [row._id, row]));
  const dailyChart = last7Days.map((date) => {
    const key = date.toISOString().slice(0, 10);
    const row = dailyChartMap.get(key) || { orders: 0, revenue: 0 };
    return {
      date: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      orders: row.orders,
      revenue: Number((row.revenue || 0).toFixed(2))
    };
  });

  // Build last 12 months axis labels
  const last12Months = Array.from({ length: 12 }).map((_, i) => {
    return new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
  });

  const monthlyMap = new Map(
    monthlyRevenueRaw.map((row) => [`${row._id.year}-${row._id.month}`, row])
  );
  const monthlyChart = last12Months.map((date) => {
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const row = monthlyMap.get(key) || { revenue: 0, orders: 0 };
    return {
      month: date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      revenue: Number((row.revenue || 0).toFixed(2)),
      orders: row.orders || 0
    };
  });

  const userGrowthMap = new Map(
    userGrowthRaw.map((row) => [`${row._id.year}-${row._id.month}`, row])
  );
  const userGrowth = last12Months.map((date) => {
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const row = userGrowthMap.get(key) || { users: 0 };
    return {
      month: date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      users: row.users || 0
    };
  });

  const statusOrder = ["placed", "confirmed", "packed", "out_for_delivery", "delivered", "cancelled"];
  const statusMap = new Map(statusBreakdownRaw.map((row) => [row._id, row.value]));
  const statusBreakdown = statusOrder.map((status) => ({
    name: status.replace(/_/g, " "),
    value: statusMap.get(status) || 0
  }));

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
      dailyOrders: dailyChart,
      dailyRevenue: dailyChart,
      monthlyRevenue: monthlyChart,
      userGrowth,
      statusBreakdown,
      // topProducts now includes productName field — fixes the Admin dashboard ObjectId display bug
      topProducts: topProductsRaw.map((p) => ({
        _id: p._id,
        productName: p.productName,
        totalSold: p.totalSold,
        revenue: Number((p.revenue || 0).toFixed(2))
      }))
    },
    recentOrders,
    lowStockProducts
  });
});

/* ─── Admin Orders (Paginated) ─────────────────────────────────────────────── */

const getAdminOrders = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const filter = { status: { $ne: "pending_payment" } };

  if (status && status !== "all") filter.status = status;
  if (search) filter.orderId = { $regex: escapeRegex(search), $options: "i" };

  const safePage = Math.max(1, Number(page));
  const safeLimit = Math.min(100, Math.max(1, Number(limit)));
  const skip = (safePage - 1) * safeLimit;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate("storeId", "name city")
      .populate("user", "name email")
      .lean(),
    Order.countDocuments(filter)
  ]);

  res.json({ orders, total, page: safePage, pages: Math.ceil(total / safeLimit) });
});

/* ─── Admin Users (Paginated) ──────────────────────────────────────────────── */

const getAdminUsers = asyncHandler(async (req, res) => {
  const { search, role, page = 1, limit = 20 } = req.query;
  const filter = { isActive: { $ne: false } };

  if (role && role !== "all") filter.role = role;
  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { email: { $regex: safeSearch, $options: "i" } }
    ];
  }

  const safePage = Math.max(1, Number(page));
  const safeLimit = Math.min(100, Math.max(1, Number(limit)));
  const skip = (safePage - 1) * safeLimit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    User.countDocuments(filter)
  ]);

  res.json({ users, total, page: safePage, pages: Math.ceil(total / safeLimit) });
});

/* ─── Audit Logs ───────────────────────────────────────────────────────────── */

const getAdminAuditLogs = asyncHandler(async (req, res) => {
  const { action, targetType, actorId, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (action && action !== "all") filter.action = action;
  if (targetType && targetType !== "all") filter.targetType = targetType;
  if (actorId) filter.actor = actorId;

  const safeLimit = Math.min(Number(limit) || 20, 100);
  const safePage = Number(page) || 1;
  const skip = (safePage - 1) * safeLimit;

  const [logs, total] = await Promise.all([
    AdminAuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate("actor", "name email role")
      .lean(),
    AdminAuditLog.countDocuments(filter)
  ]);

  res.json({ logs, total, page: safePage, pages: Math.ceil(total / safeLimit) });
});

/* ─── User Role Update ─────────────────────────────────────────────────────── */

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

  const existingUser = await User.findById(req.params.userId).select("name email role");
  if (!existingUser) {
    res.status(404);
    throw new Error("User not found");
  }

  const previousRole = existingUser.role;
  existingUser.role = role;
  await existingUser.save();

  const user = await User.findById(existingUser._id).select("-password -refreshToken");

  try {
    await logAdminAction(req, {
      action: "user.role.updated",
      targetType: "user",
      targetId: user._id,
      meta: { email: user.email, previousRole, newRole: role }
    });
  } catch (auditError) {
    console.error("Failed to write admin audit log:", auditError.message);
  }

  res.json({ message: `Role updated to ${role}`, user });
});

/* ─── Soft Delete User ─────────────────────────────────────────────────────── */

const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.userId === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot deactivate your own account from admin panel.");
  }

  // Soft delete: set isActive = false (preserves order history)
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { isActive: false },
    { new: true }
  ).select("name email role");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  try {
    await logAdminAction(req, {
      action: "user.deactivated",
      targetType: "user",
      targetId: user._id,
      meta: { email: user.email, role: user.role, name: user.name }
    });
  } catch (auditError) {
    console.error("Failed to write admin audit log:", auditError.message);
  }

  res.json({ message: "User deactivated successfully" });
});

/* ─── Inventory ────────────────────────────────────────────────────────────── */

const getInventoryAlerts = asyncHandler(async (_req, res) => {
  const products = await Product.find({
    $expr: { $lt: ["$stock", "$lowStockThreshold"] },
    isDeleted: { $ne: true }
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

  try {
    await logAdminAction(req, {
      action: "inventory.restock",
      targetType: "product",
      targetId: product._id,
      meta: { productName: product.name, quantityAdded: Number(quantity), newStock: product.stock }
    });
  } catch (auditError) {
    console.error("Failed to write admin audit log:", auditError.message);
  }

  res.json({ message: `Restocked ${quantity} units`, product });
});

module.exports = {
  getDashboardStats,
  getAdminOrders,
  getAdminUsers,
  getAdminAuditLogs,
  updateUserRole,
  deleteUser,
  getInventoryAlerts,
  restockProduct
};

import { Request, Response } from "express";
import prisma from "../../infrastructure/database/prisma.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { logAdminAction } from "../../infrastructure/services/adminAuditService.js";
import { escapeRegex } from "../../utils/order.js";

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalUsers, newUsersThisMonth, ordersToday, ordersThisMonth, revenueResult, lowStockCount] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart }, isActive: true } }),
    prisma.order.count({ where: { createdAt: { gte: todayStart }, status: { not: "PENDING_PAYMENT" } } }),
    prisma.order.count({ where: { createdAt: { gte: monthStart }, status: { not: "PENDING_PAYMENT" } } }),
    prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { total: true } }),
    prisma.product.count({ where: { stock: { lt: prisma.product.fields.lowStockThreshold as any }, isDeleted: false } }),
  ]);

  // For low stock, we need a raw query approach
  const lowStockProducts = await prisma.$queryRawUnsafe<any[]>(
    `SELECT p.id, p.name, p.brand, p.stock, p."lowStockThreshold", p.image, c.name as "categoryName"
     FROM "Product" p
     LEFT JOIN "Category" c ON p."categoryId" = c.id
     WHERE p.stock < p."lowStockThreshold" AND p."isDeleted" = false
     ORDER BY p.stock ASC
     LIMIT 10`
  );

  // Last 7 days daily chart
  const last7DaysStart = new Date(todayStart);
  last7DaysStart.setDate(todayStart.getDate() - 6);

  const dailyOrders = await prisma.$queryRawUnsafe<any[]>(
    `SELECT DATE_TRUNC('day', "createdAt" AT TIME ZONE 'Asia/Kolkata') as date,
            COUNT(*)::int as orders,
            COALESCE(SUM(CASE WHEN "paymentStatus" = 'PAID' THEN total ELSE 0 END), 0)::float as revenue
     FROM "Order"
     WHERE "createdAt" >= $1 AND status != 'PENDING_PAYMENT'
     GROUP BY DATE_TRUNC('day', "createdAt" AT TIME ZONE 'Asia/Kolkata')
     ORDER BY date ASC`,
    last7DaysStart
  );

  // Monthly revenue — last 12 months
  const last12MonthsStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const monthlyRevenue = await prisma.$queryRawUnsafe<any[]>(
    `SELECT TO_CHAR("createdAt" AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM') as month,
            COALESCE(SUM(total), 0)::float as revenue,
            COUNT(*)::int as orders
     FROM "Order"
     WHERE "paymentStatus" = 'PAID' AND "createdAt" >= $1
     GROUP BY TO_CHAR("createdAt" AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM')
     ORDER BY month ASC`,
    last12MonthsStart
  );

  // User growth — last 12 months
  const userGrowth = await prisma.$queryRawUnsafe<any[]>(
    `SELECT TO_CHAR("createdAt" AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM') as month,
            COUNT(*)::int as users
     FROM "User"
     WHERE "createdAt" >= $1
     GROUP BY TO_CHAR("createdAt" AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM')
     ORDER BY month ASC`,
    last12MonthsStart
  );

  // Order status breakdown
  const statusBreakdown = await prisma.$queryRawUnsafe<any[]>(
    `SELECT status, COUNT(*)::int as value FROM "Order"
     WHERE status != 'PENDING_PAYMENT'
     GROUP BY status`
  );

  // Recent orders
  const recentOrders = await prisma.order.findMany({
    where: { status: { not: "PENDING_PAYMENT" } },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: { select: { name: true, email: true } } },
  });

  res.json({
    stats: {
      ordersToday,
      ordersThisMonth,
      totalRevenue: revenueResult._sum.total || 0,
      totalUsers,
      newUsersThisMonth,
      lowStockCount: lowStockProducts.length,
    },
    charts: {
      dailyOrders: dailyOrders.map((r: any) => ({
        date: new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        orders: r.orders,
        revenue: Number((r.revenue || 0).toFixed(2)),
      })),
      dailyRevenue: dailyOrders.map((r: any) => ({
        date: new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        orders: r.orders,
        revenue: Number((r.revenue || 0).toFixed(2)),
      })),
      monthlyRevenue: monthlyRevenue.map((r: any) => ({
        month: r.month,
        revenue: Number((r.revenue || 0).toFixed(2)),
        orders: r.orders,
      })),
      userGrowth: userGrowth.map((r: any) => ({ month: r.month, users: r.users })),
      statusBreakdown: statusBreakdown.map((r: any) => ({
        name: r.status.replace(/_/g, " ").toLowerCase(),
        value: r.value,
      })),
    },
    recentOrders,
    lowStockProducts,
  });
});

export const getAdminOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status, search, page = 1, limit = 20 } = req.query as Record<string, any>;
  const where: any = { status: { not: "PENDING_PAYMENT" } };

  if (status && status !== "all") where.status = status.toUpperCase();
  if (search) where.orderId = { contains: escapeRegex(search), mode: "insensitive" };

  const safePage = Math.max(1, Number(page));
  const safeLimit = Math.min(100, Math.max(1, Number(limit)));
  const skip = (safePage - 1) * safeLimit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: safeLimit,
      include: { store: { select: { name: true, city: true } }, user: { select: { name: true, email: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ orders, total, page: safePage, pages: Math.ceil(total / safeLimit) });
});

export const getAdminUsers = asyncHandler(async (req: Request, res: Response) => {
  const { search, role, page = 1, limit = 20 } = req.query as Record<string, any>;
  const where: any = { isActive: true };

  if (role && role !== "all") where.role = role.toUpperCase();
  if (search) {
    const s = escapeRegex(search);
    where.OR = [
      { name: { contains: s, mode: "insensitive" } },
      { email: { contains: s, mode: "insensitive" } },
    ];
  }

  const safePage = Math.max(1, Number(page));
  const safeLimit = Math.min(100, Math.max(1, Number(limit)));
  const skip = (safePage - 1) * safeLimit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, avatar: true, isVerified: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: safeLimit,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ users, total, page: safePage, pages: Math.ceil(total / safeLimit) });
});

export const getAdminAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { action, targetType, actorId, page = 1, limit = 20 } = req.query as Record<string, any>;
  const where: any = {};

  if (action && action !== "all") where.action = action;
  if (targetType && targetType !== "all") where.targetType = targetType;
  if (actorId) where.actorId = actorId;

  const safeLimit = Math.min(Number(limit) || 20, 100);
  const safePage = Number(page) || 1;
  const skip = (safePage - 1) * safeLimit;

  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: safeLimit,
      include: { actor: { select: { name: true, email: true, role: true } } },
    }),
    prisma.adminAuditLog.count({ where }),
  ]);

  res.json({ logs, total, page: safePage, pages: Math.ceil(total / safeLimit) });
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body;
  if (!["USER", "ADMIN"].includes(role)) {
    res.status(400); throw new Error("Invalid role. Must be 'USER' or 'ADMIN'.");
  }

  if (req.params.userId === (req as any).userId) {
    res.status(400); throw new Error("You cannot change your own role.");
  }

  const existingUser = await prisma.user.findUnique({ where: { id: req.params.userId }, select: { name: true, email: true, role: true } });
  if (!existingUser) { res.status(404); throw new Error("User not found"); }

  const previousRole = existingUser.role;
  await prisma.user.update({ where: { id: req.params.userId }, data: { role } });
  const user = await prisma.user.findUnique({ where: { id: req.params.userId }, select: { id: true, name: true, email: true, role: true, avatar: true, isVerified: true, isActive: true, createdAt: true } });

  try {
    await logAdminAction(req, {
      action: "user.role.updated",
      targetType: "user",
      targetId: user!.id,
      meta: { email: user!.email, previousRole, newRole: role },
    });
  } catch (auditError: any) {
    console.error("Failed to write admin audit log:", auditError.message);
  }

  res.json({ message: `Role updated to ${role}`, user });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  if (req.params.userId === (req as any).userId) {
    res.status(400); throw new Error("You cannot deactivate your own account from admin panel.");
  }

  const user = await prisma.user.update({
    where: { id: req.params.userId },
    data: { isActive: false },
    select: { id: true, name: true, email: true, role: true },
  });

  try {
    await logAdminAction(req, {
      action: "user.deactivated",
      targetType: "user",
      targetId: user.id,
      meta: { email: user.email, role: user.role, name: user.name },
    });
  } catch (auditError: any) {
    console.error("Failed to write admin audit log:", auditError.message);
  }

  res.json({ message: "User deactivated successfully" });
});

export const getInventoryAlerts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await prisma.$queryRawUnsafe<any[]>(
    `SELECT p.*, c.name as "categoryName", c.slug as "categorySlug"
     FROM "Product" p
     LEFT JOIN "Category" c ON p."categoryId" = c.id
     WHERE p.stock < p."lowStockThreshold" AND p."isDeleted" = false
     ORDER BY p.stock ASC`
  );
  res.json(products);
});

export const restockProduct = asyncHandler(async (req: Request, res: Response) => {
  const { quantity } = req.body;
  if (!quantity || Number(quantity) <= 0) {
    res.status(400); throw new Error("Quantity must be a positive number");
  }

  const product = await prisma.product.update({
    where: { id: req.params.productId },
    data: { stock: { increment: Number(quantity) } },
    include: { category: { select: { name: true } } },
  });

  if (!product) { res.status(404); throw new Error("Product not found"); }

  try {
    await logAdminAction(req, {
      action: "inventory.restock",
      targetType: "product",
      targetId: product.id,
      meta: { productName: product.name, quantityAdded: Number(quantity), newStock: product.stock },
    });
  } catch (auditError: any) {
    console.error("Failed to write admin audit log:", auditError.message);
  }

  res.json({ message: `Restocked ${quantity} units`, product });
});

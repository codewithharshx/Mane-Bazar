import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import prisma from "../../infrastructure/database/prisma.js";
import asyncHandler from "../middleware/asyncHandler.js";
import {
  acquireIdempotency,
  extractIdempotencyKey,
  hashPayload,
  markIdempotencyCompleted,
  markIdempotencyFailed,
} from "../../infrastructure/services/idempotencyService.js";
import {
  buildOrderPayload,
  persistSuccessfulOrder,
  cancelPendingOrder,
} from "../../infrastructure/services/orderService.js";
import {
  isCancellableStatus,
  canTransitionOrderStatus,
  getAllowedNextOrderStatuses,
} from "../../utils/order.js";
import { queuePlacementNotificationEmail } from "../../infrastructure/services/emailService.js";

export const createCODOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const idempotencyKey = extractIdempotencyKey(req);
  const requestHash = hashPayload({
    userId,
    storeId: req.body.storeId || "",
    items: req.body.items,
    deliveryAddress: req.body.deliveryAddress,
    deliverySlot: req.body.deliverySlot,
    couponCode: req.body.couponCode || "",
  });

  const lock = await acquireIdempotency({ userId, scope: "orders:cod", key: idempotencyKey, requestHash });
  if (lock.mode === "replay") return res.status(lock.responseCode || 200).json(lock.responseBody || {});
  if (lock.mode === "conflict" || lock.mode === "processing") {
    res.status(409); throw new Error(lock.message);
  }

  try {
    const orderPayload = await buildOrderPayload({
      userId,
      items: req.body.items,
      storeId: req.body.storeId,
      deliveryAddress: req.body.deliveryAddress,
      deliverySlot: req.body.deliverySlot,
      paymentMethod: "cod",
      paymentStatus: "pending",
      couponCode: req.body.couponCode || "",
    });
    const { order } = await persistSuccessfulOrder(orderPayload);
    const populatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: { include: { product: { select: { name: true, slug: true } } } }, user: { select: { name: true, email: true } } },
    });

    const responseBody = { message: "COD order placed successfully", order: populatedOrder };
    await markIdempotencyCompleted(lock.record, 201, responseBody);
    return res.status(201).json(responseBody);
  } catch (error: any) {
    await markIdempotencyFailed(lock.record, error.message);
    throw error;
  }
});

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId, status: { not: "PENDING_PAYMENT" } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { store: { select: { name: true, city: true } }, items: { include: { product: { select: { slug: true, name: true } } } } },
    }),
    prisma.order.count({ where: { userId, status: { not: "PENDING_PAYMENT" } } }),
  ]);

  res.json({ orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getOrderByOrderId = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const userRole = (req as any).user?.role;

  const order = await prisma.order.findFirst({
    where: { orderId: req.params.orderId },
    include: {
      store: { select: { name: true, city: true, address: true, phone: true } },
      items: { include: { product: { select: { slug: true } } } },
      user: { select: { name: true, email: true } },
    },
  });

  if (!order) { res.status(404); throw new Error("Order not found"); }
  if (userRole !== "ADMIN" && order.userId !== userId) {
    res.status(403); throw new Error("Not authorized to view this order");
  }
  res.json(order);
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, note = "" } = req.body;
  const order = await prisma.order.findFirst({ where: { orderId: req.params.orderId } });
  if (!order) { res.status(404); throw new Error("Order not found"); }

  if (order.status === status) {
    res.status(400); throw new Error("Order is already in the requested status");
  }

  if (!canTransitionOrderStatus(order.status, status)) {
    const allowed = getAllowedNextOrderStatuses(order.status);
    const guidance = allowed.length ? `Allowed next statuses: ${allowed.join(", ")}` : "No further transitions allowed";
    res.status(400); throw new Error(`Invalid status transition from '${order.status}' to '${status}'. ${guidance}`);
  }

  const updateData: any = {
    status,
    statusHistory: { create: { status, note: note || `Status updated to ${status}` } },
  };

  if (status === "DELIVERED" && order.paymentMethod === "COD") {
    updateData.paymentStatus = "PAID";
  }

  const updatedOrder = await prisma.order.update({ where: { id: order.id }, data: updateData });

  // Notify customer
  const customer = await prisma.user.findUnique({ where: { id: order.userId }, select: { name: true, email: true } });
  if (customer?.email) {
    queuePlacementNotificationEmail({
      to: customer.email,
      name: customer.name,
      orderId: order.orderId,
      status,
    }).catch((error: any) => console.error("Failed to queue order status notification:", error.message));
  }

  res.json({ message: "Order status updated successfully", order: updatedOrder });
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const userRole = (req as any).user?.role;

  const order = await prisma.order.findFirst({ where: { orderId: req.params.orderId } });
  if (!order) { res.status(404); throw new Error("Order not found"); }

  if (userRole !== "ADMIN" && order.userId !== userId) {
    res.status(403); throw new Error("Not authorized to cancel this order");
  }

  if (!isCancellableStatus(order.status)) {
    res.status(400); throw new Error("This order can no longer be cancelled");
  }

  const wasCountedAsSale = order.status !== "PENDING_PAYMENT";

  // Update order
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "CANCELLED",
      paymentStatus: order.paymentStatus === "PAID" ? "REFUND_PENDING" : order.paymentStatus,
      statusHistory: { create: { status: "CANCELLED", note: req.body.note || "Order cancelled" } },
    },
  });

  // Restore stock
  const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
  for (const item of items) {
    await prisma.product.update({ where: { id: item.productId }, data: { stock: { increment: item.qty } } });
  }

  if (wasCountedAsSale) {
    for (const item of items) {
      await prisma.product.update({ where: { id: item.productId }, data: { soldCount: { decrement: item.qty } } });
    }
  }

  // Restore coupon usage
  if (order.couponCode) {
    await prisma.coupon.updateMany({
      where: { code: order.couponCode, usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    });
  }

  const updatedOrder = await prisma.order.findFirst({ where: { id: order.id } });
  res.json({ message: "Order cancelled successfully", order: updatedOrder });
});

export const downloadInvoice = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const userRole = (req as any).user?.role;

  const order = await prisma.order.findFirst({
    where: { orderId: req.params.orderId },
    include: { user: { select: { name: true } } },
  });

  if (!order) { res.status(404); throw new Error("Order not found"); }
  if (userRole !== "ADMIN" && order.userId !== userId) {
    res.status(403); throw new Error("Not authorized to download this invoice");
  }

  if (!order.invoicePath || !fs.existsSync(order.invoicePath)) {
    res.status(404); throw new Error("Invoice not available");
  }

  res.download(order.invoicePath, path.basename(order.invoicePath));
});

import { Request, Response } from "express";
import prisma from "../../infrastructure/database/prisma.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { createRazorpayOrder, verifyRazorpaySignature } from "../../infrastructure/services/paymentService.js";
import {
  buildOrderPayload,
  createPendingPaymentOrder,
  confirmPendingOrder,
  cancelPendingOrder,
} from "../../infrastructure/services/orderService.js";
import {
  acquireIdempotency,
  extractIdempotencyKey,
  hashPayload,
  markIdempotencyCompleted,
  markIdempotencyFailed,
} from "../../infrastructure/services/idempotencyService.js";
import { generateInvoice } from "../../infrastructure/services/invoiceService.js";

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
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

  const lock = await acquireIdempotency({ userId, scope: "payments:create-order", key: idempotencyKey, requestHash });
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
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      couponCode: req.body.couponCode || "",
    });

    const razorpayOrder = await createRazorpayOrder({
      amount: orderPayload.pricing.total,
      receipt: orderPayload.orderId,
    });

    orderPayload.razorpayOrderId = razorpayOrder.id;
    const { order } = await createPendingPaymentOrder(orderPayload);

    const responseBody = {
      message: "Razorpay order created successfully",
      orderId: order.orderId,
      order: { id: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency, receipt: razorpayOrder.receipt },
      pricing: orderPayload.pricing,
    };

    await markIdempotencyCompleted(lock.record, 201, responseBody);
    return res.status(201).json(responseBody);
  } catch (error: any) {
    await markIdempotencyFailed(lock.record, error.message);
    throw error;
  }
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const idempotencyKey = extractIdempotencyKey(req);
  const requestHash = hashPayload({ userId, razorpayOrderId, razorpayPaymentId, razorpaySignature });

  const lock = await acquireIdempotency({ userId, scope: "payments:verify", key: idempotencyKey, requestHash });
  if (lock.mode === "replay") return res.status(lock.responseCode || 200).json(lock.responseBody || {});
  if (lock.mode === "conflict" || lock.mode === "processing") {
    res.status(409); throw new Error(lock.message);
  }

  try {
    const isValid = verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
    if (!isValid) { res.status(400); throw new Error("Razorpay signature verification failed"); }

    const { order, alreadyConfirmed } = await confirmPendingOrder({ razorpayOrderId, razorpayPaymentId, razorpaySignature });

    const responseBody = {
      message: alreadyConfirmed ? "Payment already confirmed" : "Payment verified and order confirmed",
      order,
    };
    await markIdempotencyCompleted(lock.record, 201, responseBody);
    return res.status(201).json(responseBody);
  } catch (error: any) {
    await markIdempotencyFailed(lock.record, error.message);
    throw error;
  }
});

export const handlePaymentFailed = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { razorpayOrderId, reason } = req.body;

  if (!razorpayOrderId) { res.status(400); throw new Error("razorpayOrderId is required"); }

  const order = await prisma.order.findFirst({ where: { razorpayOrderId } });
  if (order && order.userId !== userId) {
    res.status(403); throw new Error("Not authorized");
  }

  await cancelPendingOrder({ razorpayOrderId, reason: reason || "Payment cancelled by user" });
  return res.json({ message: "Payment cancelled, stock restored" });
});

export const generateOrderInvoice = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { orderId } = req.body;

  if (!orderId) { res.status(400); throw new Error("orderId is required"); }

  const order = await prisma.order.findFirst({
    where: { orderId },
    include: { user: { select: { name: true, email: true } }, items: true },
  });

  if (!order) { res.status(404); throw new Error("Order not found"); }
  if (order.userId !== userId) { res.status(403); throw new Error("Not authorized to generate invoice for this order"); }

  try {
    const invoicePath = await generateInvoice(order as any, order.user!);
    res.download(invoicePath, `${order.orderId}-invoice.pdf`);
  } catch (error: any) {
    res.status(500); throw new Error(`Failed to generate invoice: ${error.message}`);
  }
});

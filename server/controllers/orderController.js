/**
 * orderController.js  (Refactored)
 *
 * HTTP layer only — no direct business logic.
 * All order logic has been moved to services/orderService.js.
 */

const fs = require("fs");
const path = require("path");
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const {
  acquireIdempotency,
  extractIdempotencyKey,
  hashPayload,
  markIdempotencyCompleted,
  markIdempotencyFailed
} = require("../services/idempotencyService");
const {
  buildOrderPayload,
  persistSuccessfulOrder,
  adjustSoldCount,
  adjustStock
} = require("../services/orderService");
const {
  isCancellableStatus,
  canTransitionOrderStatus,
  getAllowedNextOrderStatuses
} = require("../utils/order");
const { queuePlacementNotificationEmail } = require("../services/emailService");
const { sendDeliveryUpdate } = require("../services/whatsappService");

// ─── COD Order ───────────────────────────────────────────────────────────────
const createCODOrder = asyncHandler(async (req, res) => {
  const idempotencyKey = extractIdempotencyKey(req);
  const requestHash = hashPayload({
    userId: req.user._id.toString(),
    storeId: req.body.storeId || "",
    items: req.body.items,
    deliveryAddress: req.body.deliveryAddress,
    deliverySlot: req.body.deliverySlot,
    couponCode: req.body.couponCode || ""
  });

  const lock = await acquireIdempotency({
    userId: req.user._id,
    scope: "orders:cod",
    key: idempotencyKey,
    requestHash
  });

  if (lock.mode === "replay") {
    return res.status(lock.responseCode || 200).json(lock.responseBody || {});
  }

  if (lock.mode === "conflict" || lock.mode === "processing") {
    res.status(409);
    throw new Error(lock.message);
  }

  try {
    const orderPayload = await buildOrderPayload({
      userId: req.user._id,
      items: req.body.items,
      storeId: req.body.storeId,
      deliveryAddress: req.body.deliveryAddress,
      deliverySlot: req.body.deliverySlot,
      paymentMethod: "cod",
      paymentStatus: "pending",
      couponCode: req.body.couponCode || ""
    });

    const { order } = await persistSuccessfulOrder(orderPayload);
    const populatedOrder = await Order.findById(order._id)
      .populate("items.product", "name slug")
      .populate("user", "name email");

    const responseBody = {
      message: "COD order placed successfully",
      order: populatedOrder
    };

    await markIdempotencyCompleted(lock.record, 201, responseBody);
    return res.status(201).json(responseBody);
  } catch (error) {
    await markIdempotencyFailed(lock.record, error.message);
    throw error;
  }
});

// ─── Get My Orders (paginated) ────────────────────────────────────────────────
const getMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const filter = {
    user: req.user._id,
    status: { $ne: "pending_payment" } // Hide incomplete payment orders from user history
  };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("storeId", "name city")
      .populate("items.product", "slug name")
      .lean(),
    Order.countDocuments(filter)
  ]);

  res.json({
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// ─── Get Single Order ─────────────────────────────────────────────────────────
const getOrderByOrderId = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId })
    .populate("storeId", "name city address phone")
    .populate("items.product", "slug")
    .populate("user", "name email")
    .lean();

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (
    req.user.role !== "admin" &&
    order.user._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to view this order");
  }

  res.json(order);
});

// ─── Admin: Update Order Status ───────────────────────────────────────────────
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note = "" } = req.body;
  const order = await Order.findOne({ orderId: req.params.orderId });

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.status === status) {
    res.status(400);
    throw new Error("Order is already in the requested status");
  }

  if (!canTransitionOrderStatus(order.status, status)) {
    const allowedStatuses = getAllowedNextOrderStatuses(order.status);
    const guidance = allowedStatuses.length
      ? `Allowed next statuses: ${allowedStatuses.join(", ")}`
      : "No further transitions are allowed from the current status";
    res.status(400);
    throw new Error(`Invalid status transition from '${order.status}' to '${status}'. ${guidance}`);
  }

  order.status = status;
  order.statusHistory.push({
    status,
    updatedAt: new Date(),
    note: note || `Status updated to ${status}`
  });

  if (status === "delivered" && order.paymentMethod === "cod") {
    order.paymentStatus = "paid";
  }

  await order.save();

  const customer = await User.findById(order.user).select("name email phone");
  if (customer?.email) {
    queuePlacementNotificationEmail({
      to: customer.email,
      name: customer.name,
      orderId: order.orderId,
      status
    }).catch((error) => {
      console.error("Failed to queue order status notification:", error.message);
    });
  }

  // Send WhatsApp status update if phone available
  if (customer?.phone) {
    sendDeliveryUpdate(customer.phone, order, customer.name, status).catch((error) => {
      console.warn("Failed to send WhatsApp status update:", error.message);
    });
  }

  res.json({ message: "Order status updated successfully", order });
});

// ─── Cancel Order ─────────────────────────────────────────────────────────────
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId });

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (
    req.user.role !== "admin" &&
    order.user.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to cancel this order");
  }

  if (!isCancellableStatus(order.status)) {
    res.status(400);
    throw new Error("This order can no longer be cancelled");
  }

  const wasCountedAsSale = order.status !== "pending_payment";

  order.status = "cancelled";
  order.statusHistory.push({
    status: "cancelled",
    updatedAt: new Date(),
    note: req.body.note || "Order cancelled"
  });

  await adjustStock(order.items, "increment");
  if (wasCountedAsSale) {
    await adjustSoldCount(order.items, "decrement");
  }

  if (order.couponCode) {
    const coupon = await Coupon.findOne({ code: order.couponCode });
    if (coupon && coupon.usedCount > 0) {
      coupon.usedCount -= 1;
      await coupon.save();
    }
  }

  // FIX: Was incorrectly set to "failed" — now correctly "refund_pending"
  if (order.paymentStatus === "paid") {
    order.paymentStatus = "refund_pending";
  }

  await order.save();

  res.json({ message: "Order cancelled successfully", order });
});

// ─── Download Invoice (protected) ─────────────────────────────────────────────
const downloadInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId }).populate("user", "name");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (
    req.user.role !== "admin" &&
    order.user._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to download this invoice");
  }

  if (!order.invoicePath || !fs.existsSync(order.invoicePath)) {
    res.status(404);
    throw new Error("Invoice not available");
  }

  res.download(order.invoicePath, path.basename(order.invoicePath));
});

module.exports = {
  createCODOrder,
  getMyOrders,
  getOrderByOrderId,
  updateOrderStatus,
  cancelOrder,
  downloadInvoice
};

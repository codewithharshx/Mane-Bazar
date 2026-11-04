/**
 * paymentController.js  (Refactored)
 *
 * Fix: Stock-reserve-before-payment flow.
 *   1. createOrder  → validates cart, reserves stock, creates pending_payment order in DB,
 *                     creates Razorpay order. Returns rzp order details + our orderId.
 *   2. verifyPayment → verifies signature, confirms the pending_payment order (placed + paid).
 *   3. handlePaymentFailed → client signals failure; restores stock, cancels pending order.
 */

const asyncHandler = require("../middleware/asyncHandler");
const { createRazorpayOrder, verifyRazorpaySignature } = require("../services/paymentService");
const {
  buildOrderPayload,
  createPendingPaymentOrder,
  confirmPendingOrder,
  cancelPendingOrder
} = require("../services/orderService");
const {
  acquireIdempotency,
  extractIdempotencyKey,
  hashPayload,
  markIdempotencyCompleted,
  markIdempotencyFailed
} = require("../services/idempotencyService");
const { generateInvoice } = require("../services/invoiceService");
const Order = require("../models/Order");
const User = require("../models/User");

// ─── POST /api/payment/create-order ─────────────────────────────────────────
const createOrder = asyncHandler(async (req, res) => {
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
    scope: "payments:create-order",
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
    // 1. Validate cart and build order payload
    const orderPayload = await buildOrderPayload({
      userId: req.user._id,
      items: req.body.items,
      storeId: req.body.storeId,
      deliveryAddress: req.body.deliveryAddress,
      deliverySlot: req.body.deliverySlot,
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      couponCode: req.body.couponCode || ""
    });

    // 2. Create Razorpay order
    const razorpayOrder = await createRazorpayOrder({
      amount: orderPayload.pricing.total,
      receipt: orderPayload.orderId
    });

    // 3. Reserve stock: persist pending_payment order with razorpayOrderId
    orderPayload.razorpayOrderId = razorpayOrder.id;
    const { order } = await createPendingPaymentOrder(orderPayload);

    const responseBody = {
      message: "Razorpay order created successfully",
      orderId: order.orderId,       // Our internal order ID
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt
      },
      pricing: orderPayload.pricing
    };

    await markIdempotencyCompleted(lock.record, 201, responseBody);
    return res.status(201).json(responseBody);
  } catch (error) {
    await markIdempotencyFailed(lock.record, error.message);
    throw error;
  }
});

// ─── POST /api/payment/verify ────────────────────────────────────────────────
const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  } = req.body;

  const idempotencyKey = extractIdempotencyKey(req);
  const requestHash = hashPayload({
    userId: req.user._id.toString(),
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  });

  const lock = await acquireIdempotency({
    userId: req.user._id,
    scope: "payments:verify",
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
    // 1. Verify Razorpay signature
    const isValid = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    });

    if (!isValid) {
      res.status(400);
      throw new Error("Razorpay signature verification failed");
    }

    // 2. Confirm the pending_payment order (no stock deduction — already done)
    const { order, alreadyConfirmed } = await confirmPendingOrder({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    });

    const responseBody = {
      message: alreadyConfirmed
        ? "Payment already confirmed"
        : "Payment verified and order confirmed",
      order
    };

    await markIdempotencyCompleted(lock.record, 201, responseBody);
    return res.status(201).json(responseBody);
  } catch (error) {
    await markIdempotencyFailed(lock.record, error.message);
    throw error;
  }
});

// ─── POST /api/payment/payment-failed ────────────────────────────────────────
// Client calls this when Razorpay modal is dismissed or payment fails
const handlePaymentFailed = asyncHandler(async (req, res) => {
  const { razorpayOrderId, reason } = req.body;

  if (!razorpayOrderId) {
    res.status(400);
    throw new Error("razorpayOrderId is required");
  }

  // Security: ensure this order belongs to the requesting user
  const order = await Order.findOne({ razorpayOrderId });
  if (order && order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized");
  }

  await cancelPendingOrder({
    razorpayOrderId,
    reason: reason || "Payment cancelled by user"
  });

  return res.json({ message: "Payment cancelled, stock restored" });
});

// ─── POST /api/payment/invoice ──────────────────────────────────────────────
// Generate invoice with QR code for an order
const generateOrderInvoice = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    res.status(400);
    throw new Error("orderId is required");
  }

  const order = await Order.findOne({ orderId }).populate("user", "name email phone");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Security: ensure order belongs to requesting user
  if (order.user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to generate invoice for this order");
  }

  try {
    const invoicePath = await generateInvoice(order, order.user);

    res.download(invoicePath, `${order.orderId}-invoice.pdf`, (err) => {
      if (err) {
        console.error("Error downloading invoice:", err);
      }
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to generate invoice: ${error.message}`);
  }

});
module.exports = {
  createOrder,
  verifyPayment,
  handlePaymentFailed,
  generateOrderInvoice
};

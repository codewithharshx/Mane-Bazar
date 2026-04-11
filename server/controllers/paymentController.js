const asyncHandler = require("../middleware/asyncHandler");
const {
  createRazorpayOrder,
  verifyRazorpaySignature
} = require("../services/paymentService");
const {
  buildOrderPayload,
  persistSuccessfulOrder
} = require("./orderController");
const {
  acquireIdempotency,
  extractIdempotencyKey,
  hashPayload,
  markIdempotencyCompleted,
  markIdempotencyFailed
} = require("../services/idempotencyService");

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

    const razorpayOrder = await createRazorpayOrder({
      amount: orderPayload.pricing.total,
      receipt: orderPayload.orderId
    });

    const responseBody = {
      message: "Razorpay order created successfully",
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

const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    orderReceipt,
    storeId,
    items,
    deliveryAddress,
    deliverySlot,
    couponCode
  } = req.body;

  const idempotencyKey = extractIdempotencyKey(req);
  const requestHash = hashPayload({
    userId: req.user._id.toString(),
    razorpayOrderId,
    razorpayPaymentId,
    orderReceipt,
    storeId: storeId || "",
    items,
    deliveryAddress,
    deliverySlot,
    couponCode: couponCode || ""
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
    const isValid = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    });

    if (!isValid) {
      res.status(400);
      throw new Error("Razorpay signature verification failed");
    }

    const orderPayload = await buildOrderPayload({
      userId: req.user._id,
      items,
      storeId,
      deliveryAddress,
      deliverySlot,
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      couponCode: couponCode || "",
      forcedOrderId: orderReceipt || "",
      razorpayMeta: {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      }
    });

    const { order } = await persistSuccessfulOrder(orderPayload);
    const responseBody = {
      message: "Payment verified and order created successfully",
      order
    };

    await markIdempotencyCompleted(lock.record, 201, responseBody);
    return res.status(201).json(responseBody);
  } catch (error) {
    await markIdempotencyFailed(lock.record, error.message);
    throw error;
  }
});

module.exports = {
  createOrder,
  verifyPayment
};

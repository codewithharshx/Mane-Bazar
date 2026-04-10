const asyncHandler = require("../middleware/asyncHandler");
const {
  createRazorpayOrder,
  verifyRazorpaySignature
} = require("../services/paymentService");
const {
  buildOrderPayload,
  persistSuccessfulOrder
} = require("./orderController");

const createOrder = asyncHandler(async (req, res) => {
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

  res.status(201).json({
    message: "Razorpay order created successfully",
    order: {
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt
    },
    pricing: orderPayload.pricing
  });
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
  res.status(201).json({
    message: "Payment verified and order created successfully",
    order
  });
});

module.exports = {
  createOrder,
  verifyPayment
};

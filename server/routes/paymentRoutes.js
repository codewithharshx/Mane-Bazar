const express = require("express");
const { body } = require("express-validator");
const { createOrder, verifyPayment } = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");
const { checkoutRateLimiter } = require("../middleware/rateLimiter");
const validateRequest = require("../middleware/validateRequest");
const { normalizeDeliverySlot } = require("../utils/order");

const router = express.Router();

const paymentOrderValidation = [
  body("storeId").optional().isMongoId().withMessage("Store id is invalid"),
  body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
  body("items.*.productId").isMongoId().withMessage("Product id is invalid"),
  body("items.*.qty").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("deliveryAddress.label").trim().notEmpty().withMessage("Address label is required"),
  body("deliveryAddress.street").trim().notEmpty().withMessage("Street is required"),
  body("deliveryAddress.city").trim().notEmpty().withMessage("City is required"),
  body("deliveryAddress.pincode").trim().notEmpty().withMessage("Pincode is required"),
  body("deliverySlot.date").trim().notEmpty().withMessage("Delivery date is required"),
  body("deliverySlot.timeSlot")
    .custom((value) => Boolean(normalizeDeliverySlot(value)))
    .withMessage("Invalid delivery slot")
];

router.post(
  "/create-order",
  checkoutRateLimiter,
  protect,
  paymentOrderValidation,
  validateRequest,
  createOrder
);
router.post(
  "/verify",
  checkoutRateLimiter,
  protect,
  [
    ...paymentOrderValidation,
    body("razorpayOrderId").trim().notEmpty().withMessage("Razorpay order id is required"),
    body("razorpayPaymentId").trim().notEmpty().withMessage("Razorpay payment id is required"),
    body("razorpaySignature").trim().notEmpty().withMessage("Razorpay signature is required")
  ],
  validateRequest,
  verifyPayment
);

module.exports = router;

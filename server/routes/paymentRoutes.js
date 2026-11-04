const express = require("express");
const { body } = require("express-validator");
const { createOrder, verifyPayment, handlePaymentFailed, generateOrderInvoice } = require("../controllers/paymentController");
const { ensureVerified, protect } = require("../middleware/authMiddleware");
const { checkoutRateLimiter } = require("../middleware/rateLimiter");
const validateRequest = require("../middleware/validateRequest");
const { validateCheckoutPayload } = require("../middleware/validators");

const router = express.Router();

// ─── Razorpay Webhook ─────────────────────────────────────────────────────────
// IMPORTANT: This route uses raw body (not JSON) for signature verification.
// It is mounted with express.raw() in server.js BEFORE express.json() middleware.

// ─── Validation ───────────────────────────────────────────────────────────────
// ─── Create Razorpay Order (reserves stock) ───────────────────────────────────
router.post(
  "/create-order",
  checkoutRateLimiter,
  protect,
  ensureVerified,
  validateCheckoutPayload,
  validateRequest,
  createOrder
);

// ─── Verify Payment (confirms order) ──────────────────────────────────────────
router.post(
  "/verify",
  checkoutRateLimiter,
  protect,
  ensureVerified,
  [
    body("razorpayOrderId").trim().notEmpty().withMessage("Razorpay order id is required"),
    body("razorpayPaymentId").trim().notEmpty().withMessage("Razorpay payment id is required"),
    body("razorpaySignature").trim().notEmpty().withMessage("Razorpay signature is required")
  ],
  validateRequest,
  verifyPayment
);

// ─── Payment Failed / Cancelled ───────────────────────────────────────────────
// Client calls this when user dismisses Razorpay modal or payment fails
router.post(
  "/payment-failed",
  checkoutRateLimiter,
  protect,
  [body("razorpayOrderId").trim().notEmpty().withMessage("razorpayOrderId is required")],
  validateRequest,
  handlePaymentFailed
);

// ─── Generate Invoice with QR Code ─────────────────────────────────────────────
router.post(
  "/invoice",
  protect,
  ensureVerified,
  [body("orderId").trim().notEmpty().withMessage("orderId is required")],
  validateRequest,
  generateOrderInvoice
);

module.exports = router;


const express = require("express");
const { body, param } = require("express-validator");
const {
  cancelOrder,
  createCODOrder,
  downloadInvoice,
  getMyOrders,
  getOrderByOrderId,
  updateOrderStatus
} = require("../controllers/orderController");
const { adminOnly, ensureVerified, protect } = require("../middleware/authMiddleware");
const { checkoutRateLimiter } = require("../middleware/rateLimiter");
const validateRequest = require("../middleware/validateRequest");
const { validateCheckoutPayload } = require("../middleware/validators");

const router = express.Router();

router.post(
  "/cod",
  checkoutRateLimiter,
  protect,
  ensureVerified,
  validateCheckoutPayload,
  validateRequest,
  createCODOrder
);
router.get("/my-orders", protect, ensureVerified, getMyOrders);
router.get(
  "/:orderId",
  protect,
  ensureVerified,
  [param("orderId").trim().notEmpty().withMessage("Order id is required")],
  validateRequest,
  getOrderByOrderId
);
router.get(
  "/:orderId/invoice",
  protect,
  ensureVerified,
  [param("orderId").trim().notEmpty().withMessage("Order id is required")],
  validateRequest,
  downloadInvoice
);
router.put(
  "/:orderId/status",
  protect,
  adminOnly,
  [
    param("orderId").trim().notEmpty().withMessage("Order id is required"),
    body("status")
      .isIn([
        "placed",
        "confirmed",
        "packed",
        "out_for_delivery",
        "delivered",
        "cancelled"
      ])
      .withMessage("Invalid order status"),
    body("note")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage("note must be 200 characters or less")
  ],
  validateRequest,
  updateOrderStatus
);
router.put(
  "/:orderId/cancel",
  protect,
  ensureVerified,
  [param("orderId").trim().notEmpty().withMessage("Order id is required")],
  validateRequest,
  cancelOrder
);

module.exports = router;

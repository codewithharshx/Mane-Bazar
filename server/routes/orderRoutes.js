
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
const { adminOnly, protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { normalizeDeliverySlot } = require("../utils/order");

const router = express.Router();

const orderValidation = [
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

router.post("/cod", protect, orderValidation, validateRequest, createCODOrder);
router.get("/my-orders", protect, getMyOrders);
router.get(
  "/:orderId",
  protect,
  [param("orderId").trim().notEmpty().withMessage("Order id is required")],
  validateRequest,
  getOrderByOrderId
);
router.get(
  "/:orderId/invoice",
  protect,
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
      .withMessage("Invalid order status")
  ],
  validateRequest,
  updateOrderStatus
);
router.put(
  "/:orderId/cancel",
  protect,
  [param("orderId").trim().notEmpty().withMessage("Order id is required")],
  validateRequest,
  cancelOrder
);

module.exports = router;

const express = require("express");
const { body, param } = require("express-validator");
const {
  applyCoupon,
  createCoupon,
  deleteCoupon,
  getCoupons,
  updateCoupon
} = require("../controllers/couponController");
const { adminOnly, protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.post(
  "/apply",
  protect,
  [
    body("code").trim().notEmpty().withMessage("Coupon code is required"),
    body("subtotal").isFloat({ min: 0 }).withMessage("Subtotal must be valid")
  ],
  validateRequest,
  applyCoupon
);
router.get("/", protect, adminOnly, getCoupons);
router.post(
  "/",
  protect,
  adminOnly,
  [
    body("code").trim().notEmpty().withMessage("Coupon code is required"),
    body("discountType")
      .isIn(["percent", "flat"])
      .withMessage("Discount type must be percent or flat"),
    body("discountValue").isFloat({ min: 0 }).withMessage("Discount value must be valid"),
    body("maxUses").isInt({ min: 1 }).withMessage("Max uses must be at least 1"),
    body("expiresAt").isISO8601().withMessage("Expiry date must be valid")
  ],
  validateRequest,
  createCoupon
);
router.put(
  "/:id",
  protect,
  adminOnly,
  [
    param("id").isMongoId().withMessage("Invalid coupon id"),
    body("code").optional().trim().notEmpty().withMessage("Coupon code cannot be empty"),
    body("discountType")
      .optional()
      .isIn(["percent", "flat", "percentage"])
      .withMessage("Discount type must be percent or flat"),
    body("discountValue").optional().isFloat({ min: 0 }).withMessage("Discount value must be valid"),
    body("minOrderAmount").optional().isFloat({ min: 0 }).withMessage("minOrderAmount must be valid"),
    body("maxUses").optional().isInt({ min: 1 }).withMessage("maxUses must be at least 1"),
    body("expiresAt").optional().isISO8601().withMessage("Expiry date must be valid")
  ],
  validateRequest,
  updateCoupon
);
router.delete(
  "/:id",
  protect,
  adminOnly,
  [param("id").isMongoId().withMessage("Invalid coupon id")],
  validateRequest,
  deleteCoupon
);

module.exports = router;

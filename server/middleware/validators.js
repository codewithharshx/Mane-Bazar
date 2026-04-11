/**
 * Production-grade input validation utilities
 * Validates all critical inputs across the application
 */

const { body, param, validationResult } = require("express-validator");

// ─── Email Validation ─────────────────────────────────────────────────────

const validateEmail = () =>
  body("email")
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Invalid email address");

// ─── Password Validation ──────────────────────────────────────────────────
const validatePassword = () =>
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number");

// ─── Name Validation ─────────────────────────────────────────────────────
const validateName = () =>
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Name can only contain letters, spaces, hyphens, and apostrophes");

// ─── Phone Number Validation ────────────────────────────────────────────
const validatePhoneNumber = () =>
  body("phone")
    .trim()
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
    .withMessage("Invalid phone number format");

// ─── Pincode Validation ────────────────────────────────────────────────
const validatePincode = () =>
  body("pincode")
    .trim()
    .isLength({ min: 5, max: 10 })
    .withMessage("Pincode must be 5-10 characters")
    .matches(/^[0-9]{5,10}$/)
    .withMessage("Pincode can only contain numbers");

// ─── Address Validation ───────────────────────────────────────────────
const validateAddress = () => [
  body("street")
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage("Street address must be 5-100 characters"),
  body("city")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("City must be 2-50 characters"),
  body("state")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("State must be 2-50 characters"),
  validatePincode()
];

// ─── Product Quantity Validation ──────────────────────────────────────
const validateProductQty = () =>
  body("qty")
    .isInt({ min: 1, max: 999 })
    .withMessage("Quantity must be between 1 and 999");

// ─── Coupon Code Validation ───────────────────────────────────────────
const validateCouponCode = () =>
  body("couponCode")
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Invalid coupon code")
    .matches(/^[A-Z0-9]+$/)
    .withMessage("Coupon code must contain only uppercase letters and numbers");

// ─── Payment Status Validation ────────────────────────────────────────
const validatePaymentStatus = () =>
  body("paymentStatus")
    .isIn(["pending", "paid", "failed", "cancelled"])
    .withMessage("Invalid payment status");

// ─── Order Status Validation ──────────────────────────────────────────
const validateOrderStatus = () =>
  body("status")
    .isIn(["placed", "confirmed", "packed", "out_for_delivery", "delivered", "cancelled"])
    .withMessage("Invalid order status");

// ─── Validation Error Handler ────────────────────────────────────────
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  
  next();
};

// ─── Combined Validators ──────────────────────────────────────────────

const validateRegister = [
  validateName(),
  validateEmail(),
  validatePassword(),
  handleValidationErrors
];

const validateLogin = [
  validateEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors
];

const validateGoogleAuth = [
  body("credential")
    .trim()
    .notEmpty()
    .withMessage("Google credential is required"),
  handleValidationErrors
];

const validateOptionalRefreshToken = [
  body("refreshToken")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("refreshToken must be a non-empty string"),
  handleValidationErrors
];

const validateUpdateProfile = [
  validateName(),
  body("avatar")
    .optional()
    .isURL()
    .withMessage("Avatar must be a valid URL"),
  handleValidationErrors
];

const validateAddAddress = [
  body("label")
    .trim()
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Label must be 2-50 characters"),
  ...validateAddress(),
  validatePhoneNumber(),
  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean"),
  handleValidationErrors
];

const validateAddressIdParam = [
  param("addressId").isMongoId().withMessage("Invalid address id"),
  handleValidationErrors
];

const validateCreateOrder = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("Order must contain at least one item"),
  body("items.*.productId")
    .isMongoId()
    .withMessage("Invalid product ID"),
  body("items.*.qty")
    .isInt({ min: 1, max: 999 })
    .withMessage("Invalid quantity"),
  body("storeId")
    .isMongoId()
    .withMessage("Invalid store ID"),
  body("deliveryAddress")
    .isObject()
    .withMessage("Delivery address is required"),
  body("deliverySlot")
    .isObject()
    .withMessage("Delivery slot is required"),
  body("deliverySlot.date")
    .isISO8601()
    .withMessage("Invalid delivery date"),
  body("deliverySlot.timeSlot")
    .matches(/^[0-9]{2}:[0-9]{2}-[0-9]{2}:[0-9]{2}$/)
    .withMessage("Invalid time slot format"),
  validateCouponCode(),
  handleValidationErrors
];

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  validatePhoneNumber,
  validatePincode,
  validateAddress,
  validateProductQty,
  validateCouponCode,
  validatePaymentStatus,
  validateOrderStatus,
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateGoogleAuth,
  validateOptionalRefreshToken,
  validateUpdateProfile,
  validateAddressIdParam,
  validateAddAddress,
  validateCreateOrder
};

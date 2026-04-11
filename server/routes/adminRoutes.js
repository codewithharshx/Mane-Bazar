const express = require("express");
const { body, param, query } = require("express-validator");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  getDashboardStats,
  getAdminOrders,
  getAdminUsers,
  getAdminAuditLogs,
  updateUserRole,
  deleteUser,
  getInventoryAlerts,
  restockProduct
} = require("../controllers/adminController");

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// Dashboard
router.get("/dashboard", getDashboardStats);

// Orders
router.get(
  "/orders",
  [
    query("status")
      .optional()
      .isIn(["all", "placed", "confirmed", "packed", "out_for_delivery", "delivered", "cancelled"])
      .withMessage("Invalid status filter"),
    query("search").optional().isString().trim().isLength({ max: 120 }),
    query("page").optional().isInt({ min: 1 }).withMessage("page must be >= 1"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100")
  ],
  validateRequest,
  getAdminOrders
);

// Users
router.get(
  "/users",
  [
    query("role").optional().isIn(["all", "user", "admin"]).withMessage("Invalid role filter"),
    query("search").optional().isString().trim().isLength({ max: 120 }),
    query("page").optional().isInt({ min: 1 }).withMessage("page must be >= 1"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100")
  ],
  validateRequest,
  getAdminUsers
);
router.get(
  "/audit-logs",
  [
    query("action")
      .optional()
      .isIn(["all", "user.role.updated", "user.deleted", "inventory.restock"])
      .withMessage("Invalid action filter"),
    query("targetType")
      .optional()
      .isIn(["all", "user", "product"])
      .withMessage("Invalid target type filter"),
    query("actorId")
      .optional()
      .isMongoId()
      .withMessage("actorId must be a valid user id"),
    query("page").optional().isInt({ min: 1 }).withMessage("page must be >= 1"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100")
  ],
  validateRequest,
  getAdminAuditLogs
);
router.patch(
  "/users/:userId/role",
  [
    param("userId").isMongoId().withMessage("Invalid user id"),
    body("role").isIn(["user", "admin"]).withMessage("Role must be user or admin")
  ],
  validateRequest,
  updateUserRole
);
router.delete(
  "/users/:userId",
  [param("userId").isMongoId().withMessage("Invalid user id")],
  validateRequest,
  deleteUser
);

// Inventory
router.get("/inventory", getInventoryAlerts);
router.patch(
  "/inventory/:productId/restock",
  [
    param("productId").isMongoId().withMessage("Invalid product id"),
    body("quantity")
      .isInt({ min: 1, max: 100000 })
      .withMessage("quantity must be an integer between 1 and 100000")
  ],
  validateRequest,
  restockProduct
);

module.exports = router;

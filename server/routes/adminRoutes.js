const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getDashboardStats,
  getAdminOrders,
  getAdminUsers,
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
router.get("/orders", getAdminOrders);

// Users
router.get("/users", getAdminUsers);
router.patch("/users/:userId/role", updateUserRole);
router.delete("/users/:userId", deleteUser);

// Inventory
router.get("/inventory", getInventoryAlerts);
router.patch("/inventory/:productId/restock", restockProduct);

module.exports = router;

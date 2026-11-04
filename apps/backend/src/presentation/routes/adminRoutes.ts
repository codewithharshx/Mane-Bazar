import { Router } from "express";
import { z } from "zod";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { validateBody } from "../middleware/validateRequest.js";
import {
  getDashboardStats, getAdminOrders, getAdminUsers, getAdminAuditLogs,
  updateUserRole, deleteUser, getInventoryAlerts, restockProduct,
} from "../controllers/adminController.js";

const router = Router();

router.use(protect, adminOnly);

router.get("/dashboard", getDashboardStats);
router.get("/orders", getAdminOrders);
router.get("/users", getAdminUsers);
router.get("/audit-logs", getAdminAuditLogs);
router.patch("/users/:userId/role", validateBody(z.object({
  role: z.enum(["USER", "ADMIN"]),
})), updateUserRole);
router.delete("/users/:userId", deleteUser);
router.get("/inventory", getInventoryAlerts);
router.patch("/inventory/:productId/restock", validateBody(z.object({
  quantity: z.number().int().min(1).max(100000),
})), restockProduct);

export default router;

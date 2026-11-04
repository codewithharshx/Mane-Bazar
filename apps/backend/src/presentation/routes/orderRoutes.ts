import { Router } from "express";
import { z } from "zod";
import {
  createCODOrder, getMyOrders, getOrderByOrderId,
  updateOrderStatus, cancelOrder, downloadInvoice,
} from "../controllers/orderController.js";
import { protect, adminOnly, ensureVerified } from "../middleware/authMiddleware.js";
import { validateBody } from "../middleware/validateRequest.js";
import { checkoutRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

const checkoutSchema = z.object({
  storeId: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    qty: z.union([z.number().int().min(1), z.string().min(1)]),
  })).min(1),
  deliveryAddress: z.object({
    label: z.string().optional(),
    street: z.string().min(1),
    city: z.string().min(1),
    pincode: z.string().min(1),
    phone: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
  deliverySlot: z.object({
    date: z.string().min(1),
    timeSlot: z.string().min(1),
  }),
  couponCode: z.string().optional(),
});

router.post("/cod", checkoutRateLimiter, protect, ensureVerified, validateBody(checkoutSchema), createCODOrder);
router.get("/my-orders", protect, ensureVerified, getMyOrders);
router.get("/:orderId", protect, ensureVerified, getOrderByOrderId);
router.get("/:orderId/invoice", protect, ensureVerified, downloadInvoice);
router.put("/:orderId/status", protect, adminOnly, validateBody(z.object({
  status: z.enum(["PLACED", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]),
  note: z.string().max(200).optional(),
})), updateOrderStatus);
router.put("/:orderId/cancel", protect, ensureVerified, cancelOrder);

export default router;

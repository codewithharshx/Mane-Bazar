import { Router } from "express";
import { z } from "zod";
import { applyCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon } from "../controllers/couponController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { validateBody } from "../middleware/validateRequest.js";

const router = Router();

router.post("/apply", protect, validateBody(z.object({
  code: z.string().trim().min(1),
  subtotal: z.number().min(0),
})), applyCoupon);

router.get("/", protect, adminOnly, getCoupons);

router.post("/", protect, adminOnly, validateBody(z.object({
  code: z.string().trim().min(1),
  discountType: z.enum(["PERCENT", "FLAT"]),
  discountValue: z.number().min(0),
  maxUses: z.number().int().min(1),
  minOrderAmount: z.number().min(0).optional(),
  expiresAt: z.string().datetime(),
})), createCoupon);

router.put("/:id", protect, adminOnly, validateBody(z.object({
  code: z.string().trim().min(1).optional(),
  discountType: z.enum(["PERCENT", "FLAT"]).optional(),
  discountValue: z.number().min(0).optional(),
  minOrderAmount: z.number().min(0).optional(),
  maxUses: z.number().int().min(1).optional(),
  expiresAt: z.string().datetime().optional(),
})), updateCoupon);

router.delete("/:id", protect, adminOnly, deleteCoupon);

export default router;

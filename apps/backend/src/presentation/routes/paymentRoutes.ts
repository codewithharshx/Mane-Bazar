import { Router } from "express";
import { z } from "zod";
import { createOrder, verifyPayment, handlePaymentFailed, generateOrderInvoice } from "../controllers/paymentController.js";
import { protect, ensureVerified } from "../middleware/authMiddleware.js";
import { validateBody } from "../middleware/validateRequest.js";
import { checkoutRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/create-order", checkoutRateLimiter, protect, ensureVerified, validateBody(z.object({
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
})), createOrder);

router.post("/verify", checkoutRateLimiter, protect, ensureVerified, validateBody(z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
})), verifyPayment);

router.post("/payment-failed", checkoutRateLimiter, protect, validateBody(z.object({
  razorpayOrderId: z.string().min(1),
  reason: z.string().optional(),
})), handlePaymentFailed);

router.post("/invoice", protect, ensureVerified, validateBody(z.object({
  orderId: z.string().min(1),
})), generateOrderInvoice);

export default router;

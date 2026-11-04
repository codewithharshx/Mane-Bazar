import { Router } from "express";
import express from "express";
import { handleWebhook } from "../controllers/webhookController.js";

const router = Router();

// Razorpay webhook — needs raw body for HMAC signature verification
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

export default router;

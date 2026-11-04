import crypto from "crypto";
import { Request, Response } from "express";
import prisma from "../../infrastructure/database/prisma.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { confirmPendingOrder, cancelPendingOrder } from "../../infrastructure/services/orderService.js";

const verifyWebhookSignature = (rawBody: string, signature: string): boolean => {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured");
  }
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (typeof signature !== "string" || signature.length !== expectedSignature.length) return false;

  return crypto.timingSafeEqual(Buffer.from(expectedSignature, "hex"), Buffer.from(signature, "hex"));
};

export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers["x-razorpay-signature"] as string;
  if (!signature) { res.status(400); throw new Error("Missing webhook signature"); }

  const rawBody = (req as any).rawBody || req.body.toString("utf8");

  if (!verifyWebhookSignature(rawBody, signature)) {
    res.status(401); throw new Error("Invalid webhook signature");
  }

  let event: any;
  try { event = JSON.parse(rawBody); } catch { res.status(400); throw new Error("Invalid JSON in webhook body"); }

  const eventId = event.id;
  const eventType = event.event;
  const payload = event.payload?.payment?.entity || {};

  console.log(`[webhook] Received event: ${eventType} (id=${eventId})`);

  switch (eventType) {
    case "payment.captured": {
      const razorpayOrderId = payload.order_id;
      const razorpayPaymentId = payload.id;

      if (!razorpayOrderId || !razorpayPaymentId) {
        res.status(400); throw new Error("payment.captured missing required identifiers");
      }

      try {
        const existingPayment = await prisma.payment.findFirst({ where: { webhookEventId: eventId } });
        if (existingPayment) {
          console.log(`[webhook] Event ${eventId} already processed — skipping`);
          return res.status(200).json({ received: true });
        }
      } catch (error: any) {
        console.warn("[webhook] Failed to check webhook idempotency:", error.message);
      }

      try {
        const { order, alreadyConfirmed } = await confirmPendingOrder({
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature: "",
        });

        await prisma.payment.updateMany({ where: { razorpayOrderId }, data: { webhookEventId: eventId } }).catch(() => {});

        console.log(`[webhook] payment.captured: Order ${order.orderId} ${alreadyConfirmed ? "was already confirmed" : "confirmed via webhook"}`);
      } catch (error: any) {
        console.error("[webhook] Failed to confirm order:", error.message);
        res.status(500); throw new Error("Failed to process payment.captured webhook");
      }
      break;
    }

    case "payment.failed": {
      const razorpayOrderId = payload.order_id;
      if (!razorpayOrderId) { res.status(400); throw new Error("payment.failed missing order identifier"); }

      try {
        await cancelPendingOrder({
          razorpayOrderId,
          reason: `Payment failed via webhook: ${payload.error_description || "unknown reason"}`,
        });
        console.log(`[webhook] payment.failed: pending order for ${razorpayOrderId} cancelled`);
      } catch (error: any) {
        console.error("[webhook] Failed to cancel order:", error.message);
        res.status(500); throw new Error("Failed to process payment.failed webhook");
      }
      break;
    }

    default:
      console.log(`[webhook] Unhandled event type: ${eventType}`);
  }

  return res.status(200).json({ received: true });
});

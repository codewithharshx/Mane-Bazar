const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

const { __private__ } = require("../controllers/webhookController");

const { verifyWebhookSignature } = __private__;

test("verifyWebhookSignature returns true for valid signature", () => {
  const originalSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  process.env.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret";

  const rawBody = JSON.stringify({ event: "payment.captured", payload: { ok: true } });
  const signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  assert.equal(verifyWebhookSignature(rawBody, signature), true);

  process.env.RAZORPAY_WEBHOOK_SECRET = originalSecret;
});

test("verifyWebhookSignature returns false for invalid signature", () => {
  const originalSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  process.env.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret";

  const rawBody = JSON.stringify({ event: "payment.captured", payload: { ok: true } });

  assert.equal(verifyWebhookSignature(rawBody, "invalid-signature"), false);

  process.env.RAZORPAY_WEBHOOK_SECRET = originalSecret;
});

test("verifyWebhookSignature throws when secret is missing", () => {
  const originalSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  delete process.env.RAZORPAY_WEBHOOK_SECRET;

  const rawBody = JSON.stringify({ event: "payment.captured" });

  assert.throws(
    () => verifyWebhookSignature(rawBody, "irrelevant"),
    /RAZORPAY_WEBHOOK_SECRET is not configured/
  );

  process.env.RAZORPAY_WEBHOOK_SECRET = originalSecret;
});

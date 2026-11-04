const test = require("node:test");
const assert = require("node:assert/strict");
const {
  queueVerificationOtpEmail,
  __private__
} = require("../services/emailService");

test("renderTemplate injects dynamic placeholders", () => {
  const rendered = __private__.renderTemplate("Hello {{name}}, OTP: {{otp}}", {
    name: "Asha",
    otp: "123456"
  });

  assert.equal(rendered, "Hello Asha, OTP: 123456");
});

test("queueVerificationOtpEmail does not throw in non-production when transport is missing", async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "test";

  await assert.doesNotReject(async () => {
    await queueVerificationOtpEmail({
      to: "test@example.com",
      name: "User",
      otp: "123456",
      expiresMinutes: 10
    });
  });

  process.env.NODE_ENV = originalEnv;
});

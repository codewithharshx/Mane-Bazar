const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isOtpExpired,
  canAttemptOtp,
  canResendOtp
} = require("../services/otpPolicy");

test("isOtpExpired returns true when expiry is in past", () => {
  const expired = isOtpExpired(new Date(Date.now() - 1000));
  assert.equal(expired, true);
});

test("canAttemptOtp blocks after max attempts", () => {
  assert.equal(canAttemptOtp(4, 5), true);
  assert.equal(canAttemptOtp(5, 5), false);
});

test("canResendOtp enforces cooldown and hourly cap", () => {
  const now = new Date();
  const blockedByCooldown = canResendOtp({
    lastSentAt: new Date(now.getTime() - 20 * 1000),
    resendWindowStartedAt: new Date(now.getTime() - 10 * 60 * 1000),
    resendCount: 1,
    cooldownSeconds: 60,
    maxRetriesPerHour: 5,
    now
  });

  assert.equal(blockedByCooldown.allowed, false);
  assert.equal(blockedByCooldown.reason, "cooldown");

  const blockedByLimit = canResendOtp({
    lastSentAt: new Date(now.getTime() - 70 * 1000),
    resendWindowStartedAt: new Date(now.getTime() - 20 * 60 * 1000),
    resendCount: 5,
    cooldownSeconds: 60,
    maxRetriesPerHour: 5,
    now
  });

  assert.equal(blockedByLimit.allowed, false);
  assert.equal(blockedByLimit.reason, "hourly_limit");

  const allowed = canResendOtp({
    lastSentAt: new Date(now.getTime() - 70 * 1000),
    resendWindowStartedAt: new Date(now.getTime() - 20 * 60 * 1000),
    resendCount: 2,
    cooldownSeconds: 60,
    maxRetriesPerHour: 5,
    now
  });

  assert.equal(allowed.allowed, true);
});
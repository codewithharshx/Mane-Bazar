const test = require("node:test");
const assert = require("node:assert/strict");
const { generateOTP } = require("../utils/generateOTP");

test("generateOTP returns 6-digit numeric code", () => {
  const otp = generateOTP();
  assert.equal(/^\d{6}$/.test(otp), true);
});

test("generateOTP should not always repeat same value", () => {
  const samples = new Set(Array.from({ length: 25 }, () => generateOTP()));
  assert.equal(samples.size > 1, true);
});

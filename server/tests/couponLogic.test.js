const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const Coupon = require("../models/Coupon");
const { validateCouponCode } = require("../services/orderService");

let mongod;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

test.after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test.beforeEach(async () => {
  await Coupon.deleteMany({});
});

test("validateCouponCode supports percent discounts and caps by subtotal", async () => {
  await Coupon.create({
    code: "SAVE10",
    discountType: "percent",
    discountValue: 10,
    minOrderAmount: 0,
    maxUses: 10,
    usedCount: 0,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    isActive: true
  });

  const { discount } = await validateCouponCode({ code: "save10", subtotal: 1000 });
  assert.equal(discount, 100);
});

test("validateCouponCode supports flat discounts and avoids negative totals", async () => {
  await Coupon.create({
    code: "FLAT500",
    discountType: "flat",
    discountValue: 500,
    minOrderAmount: 0,
    maxUses: 10,
    usedCount: 0,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    isActive: true
  });

  const { discount } = await validateCouponCode({ code: "FLAT500", subtotal: 200 });
  assert.equal(discount, 200);
});

test("validateCouponCode accepts legacy percentage type via schema normalization", async () => {
  const coupon = await Coupon.create({
    code: "LEGACY",
    discountType: "percentage",
    discountValue: 25,
    minOrderAmount: 0,
    maxUses: 10,
    usedCount: 0,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    isActive: true
  });

  assert.equal(coupon.discountType, "percent");

  const { discount } = await validateCouponCode({ code: "LEGACY", subtotal: 400 });
  assert.equal(discount, 100);
});

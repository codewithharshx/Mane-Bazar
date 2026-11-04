const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

const Order = require("../models/Order");
const Payment = require("../models/Payment");
const { createPendingPaymentOrder } = require("../services/orderService");

let mongod;

test.before(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongod.getUri());
});

test.after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test.beforeEach(async () => {
  await Promise.all([Order.deleteMany({}), Payment.deleteMany({})]);
});

test("createPendingPaymentOrder rolls back order/payment on stock failure", async () => {
  const userId = new mongoose.Types.ObjectId();
  const missingProductId = new mongoose.Types.ObjectId();

  await assert.rejects(
    () =>
      createPendingPaymentOrder({
        orderId: "MB-20260418-TEST01",
        user: userId,
        storeId: null,
        items: [
          {
            product: missingProductId,
            name: "Test Item",
            price: 100,
            qty: 2,
            image: ""
          }
        ],
        pricing: {
          subtotal: 200,
          discount: 0,
          deliveryCharge: 40,
          tax: 10,
          total: 250
        },
        couponCode: "",
        paymentMethod: "razorpay",
        paymentStatus: "pending",
        razorpayOrderId: "order_test_123",
        razorpayPaymentId: "",
        razorpaySignature: "",
        deliveryAddress: {
          label: "Home",
          street: "Main Road",
          city: "Kasegaon",
          pincode: "415404",
          phone: "9999999999"
        },
        deliverySlot: {
          date: "2026-04-19",
          timeSlot: "Morning (7AM-11AM)"
        },
        status: "pending_payment",
        statusHistory: [
          {
            status: "pending_payment",
            updatedAt: new Date(),
            note: "Stock reserved, awaiting payment"
          }
        ]
      }),
    /Stock adjustment failed/
  );

  assert.equal(await Order.countDocuments(), 0);
  assert.equal(await Payment.countDocuments(), 0);
});

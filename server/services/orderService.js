/**
 * orderService.js
 *
 * Core order business logic — extracted from orderController to break the
 * controller→controller import anti-pattern.
 *
 * Consumed by: orderController, paymentController, webhookController
 */

const Coupon = require("../models/Coupon");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Product = require("../models/Product");
const Store = require("../models/Store");
const User = require("../models/User");
const mongoose = require("mongoose");
const { generateInvoice } = require("./invoiceService");
const {
  calculatePricing,
  generateOrderId,
  normalizeDeliverySlot,
  calculateDistance
} = require("../utils/order");
const {
  queueOrderConfirmationEmail
} = require("./emailService");
const {
  sendOrderConfirmation,
  sendDeliveryUpdate
} = require("./whatsappService");

const SLOT_LIMIT = 20;
// Minutes before a pending_payment order auto-expires
const PENDING_PAYMENT_TTL_MIN = 30;

// ─── Internal helpers ────────────────────────────────────────────────────────

const validateDeliverySlot = async ({ date, timeSlot }, session = null) => {
  const ordersInSlot = await Order.countDocuments({
    "deliverySlot.date": date,
    "deliverySlot.timeSlot": timeSlot,
    status: { $nin: ["cancelled", "pending_payment"] }
  }).session(session);

  if (ordersInSlot >= SLOT_LIMIT) {
    throw new Error("Selected delivery slot is full. Please choose another one.");
  }
};

const normalizeItemsFromProducts = (items, productsMap) =>
  items.map((item) => {
    const product = productsMap.get(item.productId);
    return {
      product: product._id,
      name: product.name,
      price: product.price,
      qty: Number(item.qty),
      image: product.images?.[0] || ""
    };
  });

/**
 * Atomically decrement stock for each item.
 * Uses $inc with a floor guard to prevent negative stock.
 */
const adjustStock = async (items, mode = "decrement", session = null) => {
  const bulkOps = items.map((item) => ({
    updateOne: {
      filter: {
        _id: item.product,
        ...(mode === "decrement" ? { stock: { $gte: item.qty } } : {})
      },
      update: {
        $inc: { stock: mode === "decrement" ? -item.qty : item.qty }
      }
    }
  }));

  const result = await Product.bulkWrite(bulkOps, { session });

  if (mode === "decrement" && result.modifiedCount < items.length) {
    throw new Error(
      "Stock adjustment failed: one or more products ran out of stock during checkout."
    );
  }
};

const adjustSoldCount = async (items, mode = "increment", session = null) => {
  const bulkOps = items.map((item) => ({
    updateOne: {
      filter: {
        _id: item.product,
        ...(mode === "decrement" ? { soldCount: { $gte: item.qty } } : {})
      },
      update: {
        $inc: { soldCount: mode === "increment" ? item.qty : -item.qty }
      }
    }
  }));

  const result = await Product.bulkWrite(bulkOps, { session });

  if (mode === "decrement" && result.modifiedCount < items.length) {
    throw new Error("Sold count adjustment failed");
  }
};

const executeInTransaction = async (work) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

// ─── Exported service functions ──────────────────────────────────────────────

/**
 * Validate and build an order payload object (does NOT persist to DB).
 * Used before creating a Razorpay order or a COD order.
 */
const buildOrderPayload = async ({
  userId,
  items,
  storeId,
  deliveryAddress,
  deliverySlot,
  paymentMethod,
  paymentStatus,
  razorpayMeta = {},
  couponCode = "",
  forcedOrderId = "",
  session = null
}) => {
  if (!items?.length) {
    throw new Error("At least one cart item is required");
  }

  const normalizedTimeSlot = normalizeDeliverySlot(deliverySlot?.timeSlot);
  if (!normalizedTimeSlot) {
    throw new Error("Invalid delivery slot");
  }

  const normalizedDeliverySlot = {
    ...deliverySlot,
    timeSlot: normalizedTimeSlot
  };

  await validateDeliverySlot(normalizedDeliverySlot, session);

  // Fetch products and validate availability
  const productIds = items.map((item) => item.productId);
  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true,
    isDeleted: { $ne: true }
  })
    .session(session)
    .populate("storeId", "name isOpen pincode deliveryRadiusKm location");

  if (products.length !== productIds.length) {
    throw new Error("One or more products are no longer available");
  }

  const productsMap = new Map(products.map((product) => [product._id.toString(), product]));

  // Multi-store guard
  const inferredStoreIds = new Set(
    products
      .map((product) => (product.storeId ? product.storeId._id.toString() : ""))
      .filter(Boolean)
  );

  if (storeId && inferredStoreIds.size && !inferredStoreIds.has(storeId.toString())) {
    throw new Error("Selected store does not match cart products");
  }

  if (inferredStoreIds.size > 1) {
    throw new Error("Cart contains items from multiple stores. Place separate orders per store.");
  }

  const resolvedStoreId = storeId || Array.from(inferredStoreIds)[0] || null;

  // Store open + delivery radius validation
  if (resolvedStoreId) {
    const store = await Store.findById(resolvedStoreId).session(session);
    if (!store) throw new Error("Store not found for this order");
    if (!store.isOpen) throw new Error("Store is currently closed.");

    if (store.location?.coordinates) {
      const [storeLng, storeLat] = store.location.coordinates;
      const userLat = deliveryAddress.lat;
      const userLng = deliveryAddress.lng;

      if (userLat && userLng) {
        const distance = calculateDistance(storeLat, storeLng, userLat, userLng);
        if (distance > 25) {
          throw new Error(
            "Delivery not available. Your location is outside our 25km delivery radius."
          );
        }
      } else {
        // No coordinates provided — log and allow (don't block order with fake coords)
        console.warn(
          `[orderService] No lat/lng for delivery address pincode=${deliveryAddress.pincode}. ` +
            "Skipping distance check."
        );
      }
    }
  }

  // Stock validation
  items.forEach((item) => {
    const product = productsMap.get(item.productId);
    if (!product) throw new Error("One or more products are no longer available");
    if (product.stock < Number(item.qty)) {
      throw new Error(`"${product.name}" does not have enough stock`);
    }
  });

  // Pricing
  const normalizedItems = normalizeItemsFromProducts(items, productsMap);
  const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryCharge = subtotal >= 499 ? 0 : 40;

  let appliedCoupon = null;
  let couponDiscount = 0;
  if (couponCode) {
    const { coupon, discount } = await validateCouponCode({ code: couponCode, subtotal });
    appliedCoupon = coupon;
    couponDiscount = discount;
  }

  const pricing = calculatePricing({ items: normalizedItems, couponDiscount, deliveryCharge });

  return {
    orderId: forcedOrderId || generateOrderId(),
    user: userId,
    storeId: resolvedStoreId,
    items: normalizedItems,
    pricing,
    couponCode: appliedCoupon?.code || "",
    paymentMethod,
    paymentStatus,
    razorpayOrderId: razorpayMeta.razorpayOrderId || "",
    razorpayPaymentId: razorpayMeta.razorpayPaymentId || "",
    razorpaySignature: razorpayMeta.razorpaySignature || "",
    deliveryAddress,
    deliverySlot: normalizedDeliverySlot,
    status: paymentMethod === "razorpay" && paymentStatus === "pending"
      ? "pending_payment"
      : "placed",
    statusHistory: [
      {
        status: paymentMethod === "razorpay" && paymentStatus === "pending"
          ? "pending_payment"
          : "placed",
        updatedAt: new Date(),
        note:
          paymentMethod === "razorpay" && paymentStatus === "pending"
            ? "Stock reserved, awaiting payment"
            : "Order placed successfully"
      }
    ],
    appliedCoupon
  };
};

/**
 * Persist a confirmed order to the database.
 * Decrements stock, redeems coupon, generates invoice, queues email, creates Payment record.
 */
const persistSuccessfulOrder = async (orderPayload) => {
  const { appliedCoupon, ...payload } = orderPayload;

  const order = await executeInTransaction(async (session) => {
    const created = await Order.create([payload], { session });
    const nextOrder = created[0];

    await adjustStock(nextOrder.items, "decrement", session);
    await adjustSoldCount(nextOrder.items, "increment", session);

    if (appliedCoupon) {
      const couponUpdate = await Coupon.updateOne(
        {
          _id: appliedCoupon._id,
          usedCount: { $lt: appliedCoupon.maxUses }
        },
        { $inc: { usedCount: 1 } },
        { session }
      );

      if (couponUpdate.modifiedCount !== 1) {
        throw new Error("Coupon usage limit reached");
      }
    }

    await Payment.create([
      {
        order: nextOrder._id,
        user: nextOrder.user,
        razorpayOrderId: nextOrder.razorpayOrderId,
        razorpayPaymentId: nextOrder.razorpayPaymentId,
        razorpaySignature: nextOrder.razorpaySignature,
        amount: nextOrder.pricing.total,
        currency: "INR",
        status: nextOrder.paymentStatus
      }
    ], { session });

    return nextOrder;
  });

  const user = await User.findById(order.user).select("name email").lean();

  if (user) {
    try {
      const invoicePath = await generateInvoice(order, user);
      await Order.findByIdAndUpdate(order._id, { invoicePath });
      order.invoicePath = invoicePath;
    } catch (error) {
      console.error("Failed to generate invoice:", error.message);
    }

    queueOrderConfirmationEmail({
      to: user.email,
      name: user.name,
      orderId: order.orderId,
      orderTotal: `INR ${order.pricing.total.toFixed(2)}`
    }).catch((error) => {
      console.error("Failed to queue order confirmation email:", error.message);
    });
  }

  return { order };
};

/**
 * Reserve stock and create a pending_payment order in the DB.
 * Called before opening the Razorpay payment dialog to avoid race conditions.
 */
const createPendingPaymentOrder = async (orderPayload) => {
  const { appliedCoupon, ...payload } = orderPayload;

  // Set 30-minute TTL expiry for auto-cleanup
  payload.pendingPaymentExpiry = new Date(Date.now() + PENDING_PAYMENT_TTL_MIN * 60 * 1000);

  const order = await executeInTransaction(async (session) => {
    const created = await Order.create([payload], { session });
    const nextOrder = created[0];

    // Reserve stock atomically
    await adjustStock(nextOrder.items, "decrement", session);

    if (appliedCoupon) {
      const couponUpdate = await Coupon.updateOne(
        {
          _id: appliedCoupon._id,
          usedCount: { $lt: appliedCoupon.maxUses }
        },
        { $inc: { usedCount: 1 } },
        { session }
      );

      if (couponUpdate.modifiedCount !== 1) {
        throw new Error("Coupon usage limit reached");
      }
    }

    await Payment.create([
      {
        order: nextOrder._id,
        user: nextOrder.user,
        razorpayOrderId: nextOrder.razorpayOrderId,
        amount: nextOrder.pricing.total,
        currency: "INR",
        status: "pending"
      }
    ], { session });

    return nextOrder;
  });

  return { order };
};

/**
 * Confirm a pending_payment order after successful Razorpay payment.
 */
const confirmPendingOrder = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const { order, alreadyConfirmed } = await executeInTransaction(async (session) => {
    const pendingOrder = await Order.findOne({
      razorpayOrderId,
      status: "pending_payment"
    }).session(session);

    if (!pendingOrder) {
      // Already confirmed (webhook vs. client race) — find and return
      const existing = await Order.findOne({ razorpayOrderId }).session(session);
      if (existing) return { order: existing, alreadyConfirmed: true };
      throw new Error("Pending payment order not found");
    }

    pendingOrder.status = "placed";
    pendingOrder.paymentStatus = "paid";
    pendingOrder.razorpayPaymentId = razorpayPaymentId;
    pendingOrder.razorpaySignature = razorpaySignature;
    pendingOrder.pendingPaymentExpiry = null;
    pendingOrder.statusHistory.push({
      status: "placed",
      updatedAt: new Date(),
      note: "Payment confirmed"
    });

    await pendingOrder.save({ session });
    await adjustSoldCount(pendingOrder.items, "increment", session);

    await Payment.findOneAndUpdate(
      { razorpayOrderId },
      {
        order: pendingOrder._id,
        user: pendingOrder.user,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        amount: pendingOrder.pricing.total,
        currency: "INR",
        status: "paid"
      },
      { session, upsert: true }
    );

    return { order: pendingOrder, alreadyConfirmed: false };
  });

  if (!alreadyConfirmed) {
    const user = await User.findById(order.user).select("name email phone").lean();
    if (user) {
      try {
        const invoicePath = await generateInvoice(order, user);
        await Order.findByIdAndUpdate(order._id, { invoicePath });
        order.invoicePath = invoicePath;
      } catch (error) {
        console.error("Failed to generate invoice:", error.message);
      }

      queueOrderConfirmationEmail({
        to: user.email,
        name: user.name,
        orderId: order.orderId,
        orderTotal: `INR ${order.pricing.total.toFixed(2)}`
      }).catch((error) => {
        console.error("Failed to queue order confirmation email:", error.message);
      });

      // Send WhatsApp notification
      if (user.phone) {
        try {
          sendOrderConfirmation(user.phone, order, user.name).catch((whatsappError) => {
            console.warn("Failed to send WhatsApp order confirmation:", whatsappError.message);
          });
        } catch (error) {
          console.warn("WhatsApp service error:", error.message);
        }
      }
    }
  }

  return { order, alreadyConfirmed };
};

/**
 * Cancel a pending_payment order and restore stock.
 * Called on payment failure or user abandonment.
 */
const cancelPendingOrder = async ({ razorpayOrderId, reason = "Payment failed or cancelled" }) => {
  const order = await executeInTransaction(async (session) => {
    const pendingOrder = await Order.findOne({
      razorpayOrderId,
      status: "pending_payment"
    }).session(session);

    if (!pendingOrder) return null; // Already cancelled or confirmed

    pendingOrder.status = "cancelled";
    pendingOrder.paymentStatus = "failed";
    pendingOrder.statusHistory.push({
      status: "cancelled",
      updatedAt: new Date(),
      note: reason
    });

    await pendingOrder.save({ session });

    // Restore reserved stock
    await adjustStock(pendingOrder.items, "increment", session);

    // Restore coupon usage
    if (pendingOrder.couponCode) {
      await Coupon.updateOne(
        { code: pendingOrder.couponCode, usedCount: { $gt: 0 } },
        { $inc: { usedCount: -1 } },
        { session }
      );
    }

    await Payment.findOneAndUpdate(
      { razorpayOrderId },
      { status: "failed" },
      { session }
    );

    return pendingOrder;
  });

  return order;
};

const cleanupExpiredPendingOrders = async ({ limit = 100 } = {}) => {
  const now = new Date();
  const expiredOrders = await Order.find({
    status: "pending_payment",
    pendingPaymentExpiry: { $lte: now }
  })
    .select("razorpayOrderId")
    .limit(Math.max(1, Number(limit) || 100))
    .lean();

  let cleaned = 0;
  let failed = 0;

  for (const order of expiredOrders) {
    try {
      await cancelPendingOrder({
        razorpayOrderId: order.razorpayOrderId,
        reason: "Payment reservation expired"
      });
      cleaned += 1;
    } catch (error) {
      failed += 1;
      console.error("[pending-payment-cleanup] failed:", error.message);
    }
  }

  return {
    scanned: expiredOrders.length,
    cleaned,
    failed
  };
};

// ─── Coupon validation (moved from couponController) ─────────────────────────

const validateCouponCode = async ({ code, subtotal }) => {
  const normalizedCode = String(code || "").toUpperCase().trim();
  const orderSubtotal = Number(subtotal || 0);

  if (!normalizedCode) {
    throw new Error("Coupon code is required");
  }

  if (!Number.isFinite(orderSubtotal) || orderSubtotal <= 0) {
    throw new Error("Subtotal must be greater than zero");
  }

  const coupon = await Coupon.findOne({ code: normalizedCode, isActive: true });

  if (!coupon) throw new Error("Invalid or expired coupon code");

  const now = new Date();
  if (coupon.expiresAt && coupon.expiresAt < now) {
    throw new Error("This coupon has expired");
  }

  if (coupon.minOrderAmount && orderSubtotal < coupon.minOrderAmount) {
    throw new Error(
      `Minimum order value of INR ${coupon.minOrderAmount} required for this coupon`
    );
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    throw new Error("This coupon has reached its usage limit");
  }

  const normalizedDiscountType = coupon.discountType === "percentage"
    ? "percent"
    : coupon.discountType;

  const rawDiscount =
    normalizedDiscountType === "percent"
      ? (orderSubtotal * coupon.discountValue) / 100
      : coupon.discountValue;

  const discount = Math.max(0, Math.min(Number(rawDiscount || 0), orderSubtotal));

  return { coupon, discount: Number(discount.toFixed(2)) };
};

module.exports = {
  buildOrderPayload,
  persistSuccessfulOrder,
  createPendingPaymentOrder,
  confirmPendingOrder,
  cancelPendingOrder,
  cleanupExpiredPendingOrders,
  adjustSoldCount,
  adjustStock,
  validateCouponCode
};

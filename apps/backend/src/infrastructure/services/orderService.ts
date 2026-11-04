import prisma from "../database/prisma.js";
import {
  calculatePricing,
  generateOrderId,
  normalizeDeliverySlot,
  calculateDistance,
} from "../../utils/order.js";
import { generateInvoice } from "./invoiceService.js";
import { queueOrderConfirmationEmail } from "./emailService.js";

const SLOT_LIMIT = 20;
const PENDING_PAYMENT_TTL_MIN = 30;

// ─── Internal helpers ────────────────────────────────────────────────────────

const validateDeliverySlot = async (date: string, timeSlot: string): Promise<void> => {
  const count = await prisma.order.count({
    where: {
      deliverySlotDate: date,
      deliverySlotTime: timeSlot,
      status: { notIn: ["CANCELLED", "PENDING_PAYMENT"] },
    },
  });
  if (count >= SLOT_LIMIT) {
    throw new Error("Selected delivery slot is full. Please choose another one.");
  }
};

const normalizeItemsFromProducts = (
  items: { productId: string; qty: number | string }[],
  productsMap: Map<string, any>
) =>
  items.map((item) => {
    const product = productsMap.get(item.productId);
    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      qty: Number(item.qty),
      image: product.images?.[0] || "",
    };
  });

const adjustStock = async (
  items: { productId: string; qty: number }[],
  mode: "decrement" | "increment"
): Promise<void> => {
  for (const item of items) {
    if (mode === "decrement") {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || product.stock < item.qty) {
        throw new Error("Stock adjustment failed: one or more products ran out of stock during checkout.");
      }
    }
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        stock: mode === "decrement" ? { decrement: item.qty } : { increment: item.qty },
      },
    });
  }
};

const adjustSoldCount = async (
  items: { productId: string; qty: number }[],
  mode: "increment" | "decrement"
): Promise<void> => {
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        soldCount: mode === "increment" ? { increment: item.qty } : { decrement: item.qty },
      },
    });
  }
};

// ─── Coupon validation ─────────────────────────────────────────────────────

const validateCouponCode = async ({
  code,
  subtotal,
}: {
  code: string;
  subtotal: number;
}) => {
  const normalizedCode = String(code || "").toUpperCase().trim();
  const orderSubtotal = Number(subtotal || 0);

  if (!normalizedCode) throw new Error("Coupon code is required");
  if (!Number.isFinite(orderSubtotal) || orderSubtotal <= 0) {
    throw new Error("Subtotal must be greater than zero");
  }

  const coupon = await prisma.coupon.findFirst({
    where: { code: normalizedCode, isActive: true },
  });

  if (!coupon) throw new Error("Invalid or expired coupon code");
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new Error("This coupon has expired");
  if (coupon.minOrderAmount && orderSubtotal < coupon.minOrderAmount) {
    throw new Error(`Minimum order value of INR ${coupon.minOrderAmount} required for this coupon`);
  }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    throw new Error("This coupon has reached its usage limit");
  }

  const rawDiscount =
    coupon.discountType === "PERCENT"
      ? (orderSubtotal * coupon.discountValue) / 100
      : coupon.discountValue;

  const discount = Math.max(0, Math.min(Number(rawDiscount || 0), orderSubtotal));
  return { coupon, discount: Number(discount.toFixed(2)) };
};

// ─── Exported service functions ──────────────────────────────────────────────

export interface OrderPayload {
  orderId: string;
  userId: string;
  storeId: string | null;
  items: { productId: string; name: string; price: number; qty: number; image: string }[];
  pricing: { subtotal: number; discount: number; deliveryCharge: number; tax: number; total: number };
  couponCode: string;
  paymentMethod: string;
  paymentStatus: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  deliveryAddress: {
    label?: string;
    street: string;
    city: string;
    pincode: string;
    phone?: string;
    lat?: number;
    lng?: number;
  };
  deliverySlot: { date: string; timeSlot: string };
  status: string;
  statusHistory: { status: string; note: string }[];
  appliedCoupon?: any;
  pendingPaymentExpiry?: Date;
}

export const buildOrderPayload = async ({
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
}: {
  userId: string;
  items: { productId: string; qty: number | string }[];
  storeId?: string;
  deliveryAddress: OrderPayload["deliveryAddress"];
  deliverySlot: { date: string; timeSlot: string };
  paymentMethod: string;
  paymentStatus: string;
  razorpayMeta?: { razorpayOrderId?: string; razorpayPaymentId?: string; razorpaySignature?: string };
  couponCode?: string;
  forcedOrderId?: string;
}): Promise<OrderPayload> => {
  if (!items?.length) throw new Error("At least one cart item is required");

  const normalizedTimeSlot = normalizeDeliverySlot(deliverySlot?.timeSlot);
  if (!normalizedTimeSlot) throw new Error("Invalid delivery slot");

  const normalizedDeliverySlot = { ...deliverySlot, timeSlot: normalizedTimeSlot };
  await validateDeliverySlot(normalizedDeliverySlot.date, normalizedDeliverySlot.timeSlot);

  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true, isDeleted: false },
    include: { store: { select: { id: true, isOpen: true, pincode: true, deliveryRadiusKm: true, lat: true, lng: true } } },
  });

  if (products.length !== productIds.length) {
    throw new Error("One or more products are no longer available");
  }

  const productsMap = new Map(products.map((p) => [p.id, p]));

  // Multi-store guard
  const inferredStoreIds = new Set(
    products.filter((p) => p.storeId).map((p) => p.storeId!)
  );

  if (storeId && inferredStoreIds.size && !inferredStoreIds.has(storeId)) {
    throw new Error("Selected store does not match cart products");
  }
  if (inferredStoreIds.size > 1) {
    throw new Error("Cart contains items from multiple stores. Place separate orders per store.");
  }

  const resolvedStoreId = storeId || Array.from(inferredStoreIds)[0] || null;

  // Store open + delivery radius validation
  if (resolvedStoreId) {
    const store = await prisma.store.findUnique({ where: { id: resolvedStoreId } });
    if (!store) throw new Error("Store not found for this order");
    if (!store.isOpen) throw new Error("Store is currently closed.");

    const userLat = deliveryAddress.lat;
    const userLng = deliveryAddress.lng;
    if (userLat && userLng) {
      const distance = calculateDistance(store.lat, store.lng, userLat, userLng);
      if (distance > 25) {
        throw new Error("Delivery not available. Your location is outside our 25km delivery radius.");
      }
    }
  }

  // Stock validation
  for (const item of items) {
    const product = productsMap.get(item.productId);
    if (!product) throw new Error("One or more products are no longer available");
    if (product.stock < Number(item.qty)) {
      throw new Error(`"${product.name}" does not have enough stock`);
    }
  }

  const normalizedItems = normalizeItemsFromProducts(items, productsMap);
  const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryCharge = subtotal >= 499 ? 0 : 40;

  let appliedCoupon: any = null;
  let couponDiscount = 0;
  if (couponCode) {
    const { coupon, discount } = await validateCouponCode({ code: couponCode, subtotal });
    appliedCoupon = coupon;
    couponDiscount = discount;
  }

  const pricing = calculatePricing({ items: normalizedItems, couponDiscount, deliveryCharge });

  const isPendingPayment = paymentMethod === "razorpay" && paymentStatus === "pending";
  const initialStatus = isPendingPayment ? "PENDING_PAYMENT" : "PLACED";

  return {
    orderId: forcedOrderId || generateOrderId(),
    userId,
    storeId: resolvedStoreId,
    items: normalizedItems,
    pricing,
    couponCode: appliedCoupon?.code || "",
    paymentMethod: paymentMethod.toUpperCase(),
    paymentStatus: paymentStatus.toUpperCase(),
    razorpayOrderId: razorpayMeta.razorpayOrderId || "",
    razorpayPaymentId: razorpayMeta.razorpayPaymentId || "",
    razorpaySignature: razorpayMeta.razorpaySignature || "",
    deliveryAddress,
    deliverySlot: normalizedDeliverySlot,
    status: initialStatus,
    statusHistory: [
      {
        status: initialStatus,
        note: isPendingPayment ? "Stock reserved, awaiting payment" : "Order placed successfully",
      },
    ],
    appliedCoupon,
  };
};

export const persistSuccessfulOrder = async (orderPayload: OrderPayload) => {
  const { appliedCoupon, ...payload } = orderPayload;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderId: payload.orderId,
        userId: payload.userId,
        storeId: payload.storeId,
        subtotal: payload.pricing.subtotal,
        discount: payload.pricing.discount,
        deliveryCharge: payload.pricing.deliveryCharge,
        tax: payload.pricing.tax,
        total: payload.pricing.total,
        couponCode: payload.couponCode || null,
        paymentMethod: payload.paymentMethod as any,
        paymentStatus: payload.paymentStatus as any,
        razorpayOrderId: payload.razorpayOrderId || null,
        razorpayPaymentId: payload.razorpayPaymentId || null,
        razorpaySignature: payload.razorpaySignature || null,
        deliveryLabel: payload.deliveryAddress.label || null,
        deliveryStreet: payload.deliveryAddress.street,
        deliveryCity: payload.deliveryAddress.city,
        deliveryPincode: payload.deliveryAddress.pincode,
        deliveryPhone: payload.deliveryAddress.phone || "",
        deliverySlotDate: payload.deliverySlot.date,
        deliverySlotTime: payload.deliverySlot.timeSlot,
        status: payload.status as any,
        pendingPaymentExpiry: payload.pendingPaymentExpiry || null,
        items: {
          create: payload.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            qty: item.qty,
            image: item.image || null,
          })),
        },
        statusHistory: {
          create: payload.statusHistory.map((sh) => ({
            status: sh.status as any,
            note: sh.note,
          })),
        },
      },
    });

    // Decrement stock
    for (const item of payload.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.qty } },
      });
    }

    // Increment sold count
    for (const item of payload.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { soldCount: { increment: item.qty } },
      });
    }

    // Redeem coupon
    if (appliedCoupon) {
      await tx.coupon.update({
        where: { id: appliedCoupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Create payment record
    await tx.payment.create({
      data: {
        orderId: created.id,
        userId: payload.userId,
        razorpayOrderId: payload.razorpayOrderId || null,
        razorpayPaymentId: payload.razorpayPaymentId || null,
        razorpaySignature: payload.razorpaySignature || null,
        amount: payload.pricing.total,
        currency: "INR",
        status: payload.paymentStatus as any,
      },
    });

    return created;
  });

  // Post-transaction: generate invoice + send emails
  const user = await prisma.user.findUnique({ where: { id: order.userId }, select: { name: true, email: true } });

  if (user) {
    try {
      // Re-fetch order with items for invoice
      const fullOrder = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
      if (fullOrder) {
        const invoicePath = await generateInvoice(fullOrder as any, user);
        await prisma.order.update({ where: { id: order.id }, data: { invoicePath } });
      }
    } catch (error: any) {
      console.error("Failed to generate invoice:", error.message);
    }

    queueOrderConfirmationEmail({
      to: user.email,
      name: user.name,
      orderId: order.orderId,
      orderTotal: `INR ${order.total.toFixed(2)}`,
    }).catch((error: any) => {
      console.error("Failed to queue order confirmation email:", error.message);
    });
  }

  return { order };
};

export const createPendingPaymentOrder = async (orderPayload: OrderPayload) => {
  const { appliedCoupon, ...payload } = orderPayload;
  payload.pendingPaymentExpiry = new Date(Date.now() + PENDING_PAYMENT_TTL_MIN * 60 * 1000);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderId: payload.orderId,
        userId: payload.userId,
        storeId: payload.storeId,
        subtotal: payload.pricing.subtotal,
        discount: payload.pricing.discount,
        deliveryCharge: payload.pricing.deliveryCharge,
        tax: payload.pricing.tax,
        total: payload.pricing.total,
        couponCode: payload.couponCode || null,
        paymentMethod: payload.paymentMethod as any,
        paymentStatus: payload.paymentStatus as any,
        razorpayOrderId: payload.razorpayOrderId || null,
        deliveryLabel: payload.deliveryAddress.label || null,
        deliveryStreet: payload.deliveryAddress.street,
        deliveryCity: payload.deliveryAddress.city,
        deliveryPincode: payload.deliveryAddress.pincode,
        deliveryPhone: payload.deliveryAddress.phone || "",
        deliverySlotDate: payload.deliverySlot.date,
        deliverySlotTime: payload.deliverySlot.timeSlot,
        status: "PENDING_PAYMENT" as any,
        pendingPaymentExpiry: payload.pendingPaymentExpiry,
        items: {
          create: payload.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            qty: item.qty,
            image: item.image || null,
          })),
        },
        statusHistory: {
          create: payload.statusHistory.map((sh) => ({
            status: sh.status as any,
            note: sh.note,
          })),
        },
      },
    });

    // Reserve stock
    for (const item of payload.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.qty } },
      });
    }

    // Redeem coupon
    if (appliedCoupon) {
      await tx.coupon.update({
        where: { id: appliedCoupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Create payment record
    await tx.payment.create({
      data: {
        orderId: created.id,
        userId: payload.userId,
        razorpayOrderId: payload.razorpayOrderId || null,
        amount: payload.pricing.total,
        currency: "INR",
        status: "PENDING",
      },
    });

    return created;
  });

  return { order };
};

export const confirmPendingOrder = async ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) => {
  const result = await prisma.$transaction(async (tx) => {
    const pendingOrder = await tx.order.findFirst({
      where: { razorpayOrderId, status: "PENDING_PAYMENT" },
    });

    if (!pendingOrder) {
      const existing = await tx.order.findFirst({ where: { razorpayOrderId } });
      if (existing) return { order: existing, alreadyConfirmed: true };
      throw new Error("Pending payment order not found");
    }

    const updated = await tx.order.update({
      where: { id: pendingOrder.id },
      data: {
        status: "PLACED",
        paymentStatus: "PAID",
        razorpayPaymentId,
        razorpaySignature,
        pendingPaymentExpiry: null,
        statusHistory: {
          create: { status: "PLACED", note: "Payment confirmed" },
        },
      },
    });

    // Increment sold count
    const items = await tx.orderItem.findMany({ where: { orderId: pendingOrder.id } });
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { soldCount: { increment: item.qty } },
      });
    }

    // Update payment record
    await tx.payment.upsert({
      where: { razorpayOrderId },
      create: {
        orderId: pendingOrder.id,
        userId: pendingOrder.userId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        amount: pendingOrder.total,
        currency: "INR",
        status: "PAID",
      },
      update: {
        razorpayPaymentId,
        razorpaySignature,
        amount: pendingOrder.total,
        status: "PAID",
      },
    });

    return { order: updated, alreadyConfirmed: false };
  });

  if (!result.alreadyConfirmed) {
    const user = await prisma.user.findUnique({
      where: { id: result.order.userId },
      select: { name: true, email: true },
    });
    if (user) {
      try {
        const fullOrder = await prisma.order.findUnique({ where: { id: result.order.id }, include: { items: true } });
        if (fullOrder) {
          const invoicePath = await generateInvoice(fullOrder as any, user);
          await prisma.order.update({ where: { id: result.order.id }, data: { invoicePath } });
        }
      } catch (error: any) {
        console.error("Failed to generate invoice:", error.message);
      }
      queueOrderConfirmationEmail({
        to: user.email,
        name: user.name,
        orderId: result.order.orderId,
        orderTotal: `INR ${result.order.total.toFixed(2)}`,
      }).catch((error: any) => {
        console.error("Failed to queue order confirmation email:", error.message);
      });
    }
  }

  return result;
};

export const cancelPendingOrder = async ({
  razorpayOrderId,
  reason = "Payment failed or cancelled",
}: {
  razorpayOrderId: string;
  reason?: string;
}) => {
  return prisma.$transaction(async (tx) => {
    const pendingOrder = await tx.order.findFirst({
      where: { razorpayOrderId, status: "PENDING_PAYMENT" },
    });

    if (!pendingOrder) return null;

    const updated = await tx.order.update({
      where: { id: pendingOrder.id },
      data: {
        status: "CANCELLED",
        paymentStatus: "FAILED",
        statusHistory: {
          create: { status: "CANCELLED", note: reason },
        },
      },
    });

    // Restore stock
    const items = await tx.orderItem.findMany({ where: { orderId: pendingOrder.id } });
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.qty } },
      });
    }

    // Restore coupon
    if (pendingOrder.couponCode) {
      await tx.coupon.updateMany({
        where: { code: pendingOrder.couponCode, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    }

    // Update payment
    await tx.payment.updateMany({
      where: { razorpayOrderId },
      data: { status: "FAILED" },
    });

    return updated;
  });
};

export const cleanupExpiredPendingOrders = async ({ limit = 100 } = {}) => {
  const now = new Date();
  const expiredOrders = await prisma.order.findMany({
    where: { status: "PENDING_PAYMENT", pendingPaymentExpiry: { lte: now } },
    select: { razorpayOrderId: true },
    take: Math.max(1, Number(limit) || 100),
  });

  let cleaned = 0;
  let failed = 0;

  for (const order of expiredOrders) {
    try {
      await cancelPendingOrder({
        razorpayOrderId: order.razorpayOrderId!,
        reason: "Payment reservation expired",
      });
      cleaned += 1;
    } catch (error: any) {
      failed += 1;
      console.error("[pending-payment-cleanup] failed:", error.message);
    }
  }

  return { scanned: expiredOrders.length, cleaned, failed };
};

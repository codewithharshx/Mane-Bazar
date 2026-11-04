import crypto from "crypto";

export const DELIVERY_SLOT_LABELS = {
  morning: "Morning (7AM-11AM)",
  afternoon: "Afternoon (12PM-3PM)",
  evening: "Evening (4PM-8PM)",
} as const;

export type DeliverySlotLabel = (typeof DELIVERY_SLOT_LABELS)[keyof typeof DELIVERY_SLOT_LABELS];

export const normalizeDeliverySlot = (input = ""): DeliverySlotLabel | "" => {
  const normalized = String(input)
    .trim()
    .replace(/â€["""]|[\u2013\u2014\u2012]/g, "-")
    .replace(/\s*-\s*/g, "-")
    .toLowerCase();

  if (normalized === "morning" || normalized === DELIVERY_SLOT_LABELS.morning.toLowerCase()) {
    return DELIVERY_SLOT_LABELS.morning;
  }
  if (
    normalized === "afternoon" ||
    normalized === DELIVERY_SLOT_LABELS.afternoon.toLowerCase()
  ) {
    return DELIVERY_SLOT_LABELS.afternoon;
  }
  if (normalized === "evening" || normalized === DELIVERY_SLOT_LABELS.evening.toLowerCase()) {
    return DELIVERY_SLOT_LABELS.evening;
  }
  return "";
};

export const generateOrderId = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `MB-${dateStr}-${suffix}`;
};

export const TAX_RATE = 0.05;

export const calculatePricing = ({
  items,
  couponDiscount = 0,
  deliveryCharge = 40,
}: {
  items: { price: number; qty: number }[];
  couponDiscount?: number;
  deliveryCharge?: number;
}) => {
  const subtotal = items.reduce((total, item) => total + item.price * item.qty, 0);
  const discount = Math.max(0, Math.min(couponDiscount, subtotal));
  const taxableAmount = subtotal - discount;
  const tax = Number((taxableAmount * TAX_RATE).toFixed(2));
  const total = Number((taxableAmount + tax + deliveryCharge).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    deliveryCharge: Number(deliveryCharge.toFixed(2)),
    tax,
    total,
  };
};

export const isCancellableStatus = (status: string): boolean =>
  ["PENDING_PAYMENT", "PLACED", "CONFIRMED"].includes(status);

export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = Object.freeze({
  PENDING_PAYMENT: ["PLACED", "CANCELLED"],
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
});

export const getAllowedNextOrderStatuses = (currentStatus: string): string[] =>
  ORDER_STATUS_TRANSITIONS[currentStatus] || [];

export const canTransitionOrderStatus = (currentStatus: string, nextStatus: string): boolean =>
  getAllowedNextOrderStatuses(currentStatus).includes(nextStatus);

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const escapeRegex = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

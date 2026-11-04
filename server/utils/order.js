const crypto = require("crypto");

const DELIVERY_SLOT_LABELS = {
  morning: "Morning (7AM-11AM)",
  afternoon: "Afternoon (12PM-3PM)",
  evening: "Evening (4PM-8PM)"
};

/**
 * Normalise a free-form delivery slot string to one of the three canonical labels.
 * Handles em-dashes (U+2013 / U+2014), curly quotes, and common abbreviations.
 */
const normalizeDeliverySlot = (input = "") => {
  const normalized = String(input)
    .trim()
    // Fix mojibake and actual Unicode dashes
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

/**
 * Generate a collision-resistant order ID using crypto random bytes.
 * Format: MB-YYYYMMDD-XXXXXX  (e.g. MB-20250414-3F9A12)
 * No DB query needed — random suffix makes collisions astronomically unlikely.
 */
const generateOrderId = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `MB-${dateStr}-${suffix}`;
};

const TAX_RATE = 0.05;

const calculatePricing = ({ items, couponDiscount = 0, deliveryCharge = 40 }) => {
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
    total
  };
};

const isCancellableStatus = (status) =>
  ["pending_payment", "placed", "confirmed"].includes(status);

const ORDER_STATUS_TRANSITIONS = Object.freeze({
  pending_payment: ["placed", "cancelled"],
  placed: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: []
});

const getAllowedNextOrderStatuses = (currentStatus) =>
  ORDER_STATUS_TRANSITIONS[currentStatus] || [];

const canTransitionOrderStatus = (currentStatus, nextStatus) =>
  getAllowedNextOrderStatuses(currentStatus).includes(nextStatus);

/**
 * Haversine distance between two lat/lng points. Returns km.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
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
}

module.exports = {
  TAX_RATE,
  DELIVERY_SLOT_LABELS,
  calculatePricing,
  generateOrderId,
  isCancellableStatus,
  getAllowedNextOrderStatuses,
  canTransitionOrderStatus,
  normalizeDeliverySlot,
  calculateDistance
};

const Order = require("../models/Order");

const DELIVERY_SLOT_LABELS = {
  morning: "Morning (7AM-11AM)",
  afternoon: "Afternoon (12PM-3PM)",
  evening: "Evening (4PM-8PM)"
};

const normalizeDeliverySlot = (input = "") => {
  const normalized = String(input)
    .trim()
    .replace(/â€“|â€”|–|—/g, "-")
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

const generateOrderId = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const prefix = `MB-${year}${month}${day}`;

  const count = await Order.countDocuments({
    orderId: { $regex: `^${prefix}` }
  });

  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
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

const isCancellableStatus = (status) => ["placed", "confirmed"].includes(status);

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) *
    Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const mockCoordinatesFromPincode = (pincode) => {
  // A pseudo hash of the pincode to generate mock coordinates around India (lat: ~20, lng: ~78)
  const numericPin = parseInt(pincode, 10);
  if (isNaN(numericPin)) return { lat: 28.6139, lng: 77.2090 }; // Default to Delhi if invalid
  
  const latOffset = (numericPin % 100) / 100;
  const lngOffset = (Math.floor(numericPin / 100) % 100) / 100;
  
  return {
    lat: 19.0 + (latOffset * 10), // ~19 - 29 (Mumbai to Delhi range)
    lng: 72.8 + (lngOffset * 10)  // ~72 - 82 
  };
};

module.exports = {
  TAX_RATE,
  DELIVERY_SLOT_LABELS,
  calculatePricing,
  generateOrderId,
  isCancellableStatus,
  normalizeDeliverySlot,
  calculateDistance,
  mockCoordinatesFromPincode
};

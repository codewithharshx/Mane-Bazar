const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    qty: {
      type: Number,
      required: true,
      min: 1
    },
    image: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

const pricingSchema = new mongoose.Schema(
  {
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    deliveryCharge: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true }
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },
    note: { type: String, default: "" }
  },
  { _id: false }
);

const deliveryAddressSchema = new mongoose.Schema(
  {
    label: String,
    street: String,
    city: String,
    pincode: String,
    phone: String
  },
  { _id: false }
);

const deliverySlotSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    timeSlot: {
      type: String,
      enum: [
        "Morning (7AM-11AM)",
        "Afternoon (12PM-3PM)",
        "Evening (4PM-8PM)"
      ],
      required: true
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", default: null },
    items: { type: [orderItemSchema], required: true },
    pricing: { type: pricingSchema, required: true },
    couponCode: { type: String, default: "" },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "cod"],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySignature: { type: String, default: "" },
    deliveryAddress: { type: deliveryAddressSchema, required: true },
    deliverySlot: { type: deliverySlotSchema, required: true },
    status: {
      type: String,
      enum: [
        "placed",
        "confirmed",
        "packed",
        "out_for_delivery",
        "delivered",
        "cancelled"
      ],
      default: "placed"
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    invoicePath: { type: String, default: "" }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

orderSchema.index({ storeId: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);

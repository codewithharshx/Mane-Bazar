const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    discountType: {
      type: String,
      enum: ["percent", "flat"],
      required: true,
      set: (value) => {
        const normalized = String(value || "").toLowerCase().trim();
        if (normalized === "percentage") return "percent";
        return normalized;
      }
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    minOrderAmount: {
      type: Number,
      default: 0
    },
    maxUses: {
      type: Number,
      required: true,
      min: 1
    },
    usedCount: {
      type: Number,
      default: 0
    },
    expiresAt: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

couponSchema.pre("validate", function normalizeCoupon(next) {
  if (this.discountType === "percent") {
    this.discountValue = Math.min(Math.max(Number(this.discountValue || 0), 0), 100);
  } else {
    this.discountValue = Math.max(Number(this.discountValue || 0), 0);
  }

  this.minOrderAmount = Math.max(Number(this.minOrderAmount || 0), 0);
  this.maxUses = Math.max(Number(this.maxUses || 0), 1);
  this.usedCount = Math.max(Number(this.usedCount || 0), 0);
  next();
});

module.exports = mongoose.model("Coupon", couponSchema);

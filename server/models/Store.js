const mongoose = require("mongoose");

const storeReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (value) => Array.isArray(value) && value.length === 2,
          message: "Location coordinates must be [lng, lat]"
        }
      }
    },
    phone: {
      type: String,
      default: "",
      trim: true
    },
    whatsapp: {
      type: String,
      default: "",
      trim: true
    },
    images: {
      type: [String],
      default: []
    },
    categories: {
      type: [String],
      default: []
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0
    },
    openingHours: {
      type: String,
      default: "Mon-Sun: 7:00 AM - 10:00 PM"
    },
    isOpen: {
      type: Boolean,
      default: true
    },
    deliveryRadiusKm: {
      type: Number,
      default: 8,
      min: 1
    },
    estimatedDeliveryMin: {
      type: Number,
      default: 10,
      min: 1
    },
    estimatedDeliveryMax: {
      type: Number,
      default: 30,
      min: 1
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    reviews: {
      type: [storeReviewSchema],
      default: []
    }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

storeSchema.index({ location: "2dsphere" });
storeSchema.index({ rating: -1 });
storeSchema.index({ city: 1, pincode: 1 });
storeSchema.index({ name: "text", categories: "text", city: "text" });

module.exports = mongoose.model("Store", storeSchema);

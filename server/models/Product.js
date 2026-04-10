const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
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

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    brand: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      default: null,
      index: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    mrp: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    stock: {
      type: Number,
      required: true,
      min: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    images: {
      type: [String],
      default: []
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    tags: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    },
    ratings: [ratingSchema]
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

productSchema.virtual("averageRating").get(function averageRating() {
  const ratings = Array.isArray(this.ratings) ? this.ratings : [];

  if (!ratings.length) {
    return 0;
  }

  const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);
  return Number((total / ratings.length).toFixed(1));
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

productSchema.index({ storeId: 1, category: 1, isActive: 1 });

module.exports = mongoose.model("Product", productSchema);

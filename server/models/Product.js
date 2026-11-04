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
    soldCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    image: {
      type: String,
      trim: true,
      default: ""
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
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false
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

productSchema.pre("validate", function syncPrimaryImage(next) {
  const primaryImage = typeof this.image === "string" ? this.image.trim() : "";
  const imageList = Array.isArray(this.images)
    ? this.images.map((value) => (typeof value === "string" ? value.trim() : "")).filter(Boolean)
    : [];

  if (!primaryImage && imageList.length) {
    this.image = imageList[0];
  }

  if (primaryImage) {
    this.image = primaryImage;
    if (!imageList.length || imageList[0] !== primaryImage) {
      this.images = [primaryImage, ...imageList.filter((value) => value !== primaryImage)];
      return next();
    }
  }

  this.images = imageList;
  next();
});

// Composite index for product list queries
productSchema.index({ storeId: 1, category: 1, isActive: 1, isDeleted: 1 });

// Text search index — replaces regex search across name/brand/tags
productSchema.index(
  { name: "text", brand: "text", tags: "text", description: "text" },
  {
    weights: { name: 10, brand: 5, tags: 3, description: 1 },
    name: "product_text_search"
  }
);

// Price range + category filter index
productSchema.index({ price: 1, isActive: 1, isDeleted: 1 });

// Popular products listing
productSchema.index({ soldCount: -1, isActive: 1, isDeleted: 1 });

module.exports = mongoose.model("Product", productSchema);

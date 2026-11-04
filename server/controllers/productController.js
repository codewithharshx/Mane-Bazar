const Category = require("../models/Category");
const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");
const { escapeRegex } = require("../utils/regex");

const normalizeImageValues = (payload = {}) => {
  const normalized = { ...payload };
  const image = typeof normalized.image === "string" ? normalized.image.trim() : "";
  const images = Array.isArray(normalized.images)
    ? normalized.images.map((value) => (typeof value === "string" ? value.trim() : "")).filter(Boolean)
    : typeof normalized.images === "string"
      ? normalized.images.split(",").map((value) => value.trim()).filter(Boolean)
      : [];

  if (image) {
    normalized.image = image;
    normalized.images = [image, ...images.filter((value) => value !== image)];
    return normalized;
  }

  if (images.length) {
    normalized.image = images[0];
    normalized.images = images;
  }

  return normalized;
};

const buildProductFilter = async (query) => {
  // Base filter: only active, non-deleted products
  const filter = { isActive: true, isDeleted: { $ne: true } };
  let useTextSearch = false;

  if (query.search) {
    // Use MongoDB text index instead of slow $regex
    filter.$text = { $search: query.search };
    useTextSearch = true;
  }

  if (query.brand) {
    filter.brand = { $regex: `^${escapeRegex(query.brand)}$`, $options: "i" };
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  if (query.category) {
    const category = await Category.findOne({ slug: query.category });
    if (category) filter.category = category._id;
  }

  if (query.store) {
    filter.storeId = query.store;
  }

  return { filter, useTextSearch };
};

// ─── GET /api/products ────────────────────────────────────────────────────────
const getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
  const skip = (page - 1) * limit;

  const { filter, useTextSearch } = await buildProductFilter(req.query);

  // Determine sort
  let sort = { createdAt: -1 };
  if (useTextSearch && !req.query.sort) {
    // When searching, sort by text score relevance
    sort = { score: { $meta: "textScore" } };
  } else {
    switch (req.query.sort) {
      case "price_asc":   sort = { price: 1 };    break;
      case "price_desc":  sort = { price: -1 };   break;
      case "name_asc":    sort = { name: 1 };     break;
      case "popular":
      case "bestsellers":
        sort = { soldCount: -1, createdAt: -1 };
        break;
      default: break;
    }
  }

  // Projection: include text score only when doing text search
  const projection = useTextSearch ? { score: { $meta: "textScore" } } : {};

  const [products, total] = await Promise.all([
    Product.find(filter, projection)
      .populate("category", "name slug")
      .populate("storeId", "name city rating isOpen")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter)
  ]);

  const pages = Math.ceil(total / limit);

  res.json({
    data: products,
    page,
    pages,
    total,
    products,
    pagination: {
      page,
      limit,
      total,
      pages
    }
  });
});

// ─── GET /api/products/:slug ──────────────────────────────────────────────────
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isDeleted: { $ne: true } })
    .populate("category", "name slug")
    .populate("storeId", "name city address phone whatsapp rating totalReviews")
    .populate("ratings.user", "name avatar");

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json(product);
});

// ─── GET /api/products/category/:slug ────────────────────────────────────────
const getProductsByCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true });
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
  const skip = (page - 1) * limit;

  const filter = { category: category._id, isActive: true, isDeleted: { $ne: true } };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .populate("storeId", "name city rating isOpen")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter)
  ]);

  const pages = Math.ceil(total / limit);

  res.json({
    data: products,
    page,
    pages,
    total,
    category,
    products,
    pagination: { page, limit, total, pages }
  });
});

// ─── POST /api/products (Admin) ───────────────────────────────────────────────
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(normalizeImageValues(req.body));
  const populated = await product.populate([
    { path: "category", select: "name slug" },
    { path: "storeId", select: "name city" }
  ]);
  res.status(201).json(populated);
});

// ─── PUT /api/products/:id (Admin) ────────────────────────────────────────────
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    normalizeImageValues(req.body),
    { new: true, runValidators: true }
  ).populate([
    { path: "category", select: "name slug" },
    { path: "storeId", select: "name city" }
  ]);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json(product);
});

// ─── DELETE /api/products/:id (Admin) — Soft Delete ──────────────────────────
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true, isActive: false },
    { new: true }
  );

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json({ message: "Product deleted successfully" });
});

// ─── POST /api/products/:id/reviews ──────────────────────────────────────────
const createReview = asyncHandler(async (req, res) => {
  const { rating, review } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const existing = product.ratings.find(
    (item) => item.user.toString() === req.user._id.toString()
  );

  if (existing) {
    existing.rating = rating;
    existing.review = review || existing.review;
  } else {
    product.ratings.push({ user: req.user._id, rating, review });
  }

  await product.save();
  res.json({ message: "Review saved successfully" });
});

module.exports = {
  getProducts,
  getProductBySlug,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  createReview
};

const Category = require("../models/Category");
const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");

const buildProductFilter = async (query) => {
  const filter = { isActive: true };

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { brand: { $regex: query.search, $options: "i" } },
      { tags: { $elemMatch: { $regex: query.search, $options: "i" } } }
    ];
  }

  if (query.brand) {
    filter.brand = { $regex: `^${query.brand}$`, $options: "i" };
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) {
      filter.price.$gte = Number(query.minPrice);
    }
    if (query.maxPrice) {
      filter.price.$lte = Number(query.maxPrice);
    }
  }

  if (query.category) {
    const category = await Category.findOne({ slug: query.category });
    if (category) {
      filter.category = category._id;
    }
  }

  if (query.store) {
    filter.storeId = query.store;
  }

  return filter;
};

const getProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 12), 50);
  const skip = (page - 1) * limit;
  const filter = await buildProductFilter(req.query);

  let sort = { createdAt: -1 };
  switch (req.query.sort) {
    case "price_asc":
      sort = { price: 1 };
      break;
    case "price_desc":
      sort = { price: -1 };
      break;
    case "name_asc":
      sort = { name: 1 };
      break;
    default:
      break;
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .populate("storeId", "name city rating isOpen")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter)
  ]);

  res.json({
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate("category", "name slug")
    .populate("storeId", "name city address phone whatsapp rating totalReviews")
    .populate("ratings.user", "name avatar");

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json(product);
});

const getProductsByCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true });
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  const products = await Product.find({ category: category._id, isActive: true })
    .populate("category", "name slug")
    .populate("storeId", "name city rating isOpen")
    .sort({ createdAt: -1 });

  res.json({ category, products });
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  const populated = await product.populate([
    { path: "category", select: "name slug" },
    { path: "storeId", select: "name city" }
  ]);
  res.status(201).json(populated);
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate([
    { path: "category", select: "name slug" },
    { path: "storeId", select: "name city" }
  ]);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json(product);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  await product.deleteOne();
  res.json({ message: "Product deleted successfully" });
});

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
    product.ratings.push({
      user: req.user._id,
      rating,
      review
    });
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

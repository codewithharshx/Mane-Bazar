const Product = require("../models/Product");
const Store = require("../models/Store");
const asyncHandler = require("../middleware/asyncHandler");
const { escapeRegex } = require("../utils/regex");

const toObjectIdOrNull = (value) => {
  if (!value) return null;
  return value;
};

const parsePageParams = (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 12), 1), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const buildStoreFilter = (query) => {
  const filter = {};
  const safeCity = query.city ? escapeRegex(query.city) : "";
  const safeCategory = query.category ? escapeRegex(query.category) : "";
  const safeSearch = query.search ? escapeRegex(query.search) : "";

  if (query.city) {
    filter.city = { $regex: safeCity, $options: "i" };
  }
  if (query.pincode) {
    filter.pincode = query.pincode;
  }
  if (query.category) {
    filter.categories = { $in: [new RegExp(`^${safeCategory}$`, "i")] };
  }
  if (query.search) {
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { categories: { $elemMatch: { $regex: safeSearch, $options: "i" } } },
      { city: { $regex: safeSearch, $options: "i" } },
      { address: { $regex: safeSearch, $options: "i" } }
    ];
  }
  if (typeof query.isOpen === "string") {
    filter.isOpen = query.isOpen === "true";
  }

  return filter;
};

const getStores = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePageParams(req.query);
  const filter = buildStoreFilter(req.query);

  const sort = req.query.sort === "rating" ? { rating: -1, createdAt: -1 } : { createdAt: -1 };

  const [stores, total] = await Promise.all([
    Store.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("owner", "name email"),
    Store.countDocuments(filter)
  ]);

  res.json({
    stores,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

const getNearbyStores = asyncHandler(async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    res.status(400);
    throw new Error("lat and lng query params are required");
  }

  const radiusKm = Math.max(Number(req.query.radius || 10), 1);
  const { page, limit, skip } = parsePageParams(req.query);
  const filter = buildStoreFilter(req.query);

  const aggregate = [
    {
      $geoNear: {
        near: { type: "Point", coordinates: [lng, lat] },
        distanceField: "distanceMeters",
        maxDistance: radiusKm * 1000,
        spherical: true,
        query: filter
      }
    },
    {
      $addFields: {
        distanceKm: {
          $round: [{ $divide: ["$distanceMeters", 1000] }, 2]
        }
      }
    }
  ];

  const [totalResult, stores] = await Promise.all([
    Store.aggregate([...aggregate, { $count: "count" }]),
    Store.aggregate([...aggregate, { $skip: skip }, { $limit: limit }])
  ]);

  const total = totalResult[0]?.count || 0;

  res.json({
    stores,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

const getStoreById = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.storeId)
    .populate("owner", "name email")
    .populate("reviews.user", "name avatar");

  if (!store) {
    res.status(404);
    throw new Error("Store not found");
  }

  const starBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: store.reviews.filter((item) => item.rating === star).length
  }));

  res.json({
    ...store.toObject(),
    starBreakdown
  });
});

const createStore = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    location: {
      type: "Point",
      coordinates: [Number(req.body.lng), Number(req.body.lat)]
    }
  };
  delete payload.lat;
  delete payload.lng;

  const store = await Store.create(payload);
  res.status(201).json(store);
});

const updateStore = asyncHandler(async (req, res) => {
  const update = { ...req.body };
  if (req.body.lat !== undefined && req.body.lng !== undefined) {
    update.location = {
      type: "Point",
      coordinates: [Number(req.body.lng), Number(req.body.lat)]
    };
  }
  delete update.lat;
  delete update.lng;

  const store = await Store.findByIdAndUpdate(req.params.storeId, update, {
    new: true,
    runValidators: true
  });

  if (!store) {
    res.status(404);
    throw new Error("Store not found");
  }

  res.json(store);
});

const deleteStore = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.storeId);
  if (!store) {
    res.status(404);
    throw new Error("Store not found");
  }

  await store.deleteOne();
  res.json({ message: "Store deleted successfully" });
});

const createStoreReview = asyncHandler(async (req, res) => {
  const { rating, review = "" } = req.body;
  const store = await Store.findById(req.params.storeId);

  if (!store) {
    res.status(404);
    throw new Error("Store not found");
  }

  const existing = store.reviews.find(
    (item) => item.user.toString() === req.user._id.toString()
  );

  if (existing) {
    existing.rating = rating;
    existing.review = review || existing.review;
  } else {
    store.reviews.push({ user: req.user._id, rating, review });
  }

  store.totalReviews = store.reviews.length;
  store.rating = store.totalReviews
    ? Number(
        (
          store.reviews.reduce((sum, item) => sum + item.rating, 0) /
          store.totalReviews
        ).toFixed(1)
      )
    : 0;

  await store.save();
  res.json({
    message: "Store review saved successfully",
    rating: store.rating,
    totalReviews: store.totalReviews
  });
});

const getStoreProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePageParams(req.query);
  const filter = {
    storeId: toObjectIdOrNull(req.params.storeId),
    isActive: true
  };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
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

module.exports = {
  getStores,
  getNearbyStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  createStoreReview,
  getStoreProducts
};

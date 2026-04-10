const Coupon = require("../models/Coupon");
const asyncHandler = require("../middleware/asyncHandler");

const computeCouponDiscount = (coupon, subtotal) => {
  if (coupon.discountType === "percent") {
    return Number(((subtotal * coupon.discountValue) / 100).toFixed(2));
  }

  return Math.min(subtotal, coupon.discountValue);
};

const validateCoupon = async ({ code, subtotal }) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

  if (!coupon || !coupon.isActive) {
    throw new Error("Coupon is invalid or inactive");
  }

  if (coupon.expiresAt < new Date()) {
    throw new Error("Coupon has expired");
  }

  if (coupon.usedCount >= coupon.maxUses) {
    throw new Error("Coupon usage limit reached");
  }

  if (subtotal < coupon.minOrderAmount) {
    throw new Error(`Minimum order amount is Rs. ${coupon.minOrderAmount}`);
  }

  return {
    coupon,
    discount: computeCouponDiscount(coupon, subtotal)
  };
};

const applyCoupon = asyncHandler(async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const { coupon, discount } = await validateCoupon({
      code,
      subtotal: Number(subtotal)
    });

    res.json({
      message: "Coupon applied successfully",
      code: coupon.code,
      discount,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const getCoupons = asyncHandler(async (_req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json(coupons);
});

const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create({
    ...req.body,
    code: req.body.code.toUpperCase().trim()
  });
  res.status(201).json(coupon);
});

const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }

  res.json(coupon);
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }

  await coupon.deleteOne();
  res.json({ message: "Coupon deleted successfully" });
});

module.exports = {
  applyCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon
};

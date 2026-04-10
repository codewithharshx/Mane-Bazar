const Category = require("../models/Category");
const asyncHandler = require("../middleware/asyncHandler");

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  res.json(categories);
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json(category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  res.json(category);
});

module.exports = {
  getCategories,
  createCategory,
  updateCategory
};

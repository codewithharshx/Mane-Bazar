const express = require("express");
const { body, param } = require("express-validator");
const {
  createCategory,
  getCategories,
  updateCategory
} = require("../controllers/categoryController");
const { adminOnly, protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.get("/", getCategories);
router.post(
  "/",
  protect,
  adminOnly,
  [
    body("name").trim().notEmpty().withMessage("Category name is required"),
    body("slug").trim().notEmpty().withMessage("Category slug is required")
  ],
  validateRequest,
  createCategory
);
router.put(
  "/:id",
  protect,
  adminOnly,
  [
    param("id").isMongoId().withMessage("Invalid category id"),
    body("name").optional().trim().notEmpty().withMessage("Category name cannot be empty"),
    body("slug").optional().trim().notEmpty().withMessage("Category slug cannot be empty")
  ],
  validateRequest,
  updateCategory
);

module.exports = router;

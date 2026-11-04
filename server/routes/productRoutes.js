const express = require("express");
const { body, param } = require("express-validator");
const {
  createProduct,
  createReview,
  deleteProduct,
  getProductBySlug,
  getProducts,
  getProductsByCategory,
  updateProduct
} = require("../controllers/productController");
const { adminOnly, protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.get("/", getProducts);
router.get("/category/:slug", getProductsByCategory);
router.get("/:slug", getProductBySlug);
router.post(
  "/",
  protect,
  adminOnly,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("brand").trim().notEmpty().withMessage("Brand is required"),
    body("category").isMongoId().withMessage("Valid category is required"),
    body("storeId").optional().isMongoId().withMessage("Valid store id is required"),
    body("slug").trim().notEmpty().withMessage("Slug is required"),
    body("price").isFloat({ min: 0 }).withMessage("Price must be valid"),
    body("mrp").isFloat({ min: 0 }).withMessage("MRP must be valid"),
    body("discount").isFloat({ min: 0, max: 100 }).withMessage("Discount must be valid"),
    body("stock").isInt({ min: 0 }).withMessage("Stock must be valid"),
    body("image").optional({ checkFalsy: true }).isURL({ require_protocol: true }).withMessage("Image must be a valid URL"),
    body("description").trim().notEmpty().withMessage("Description is required")
  ],
  validateRequest,
  createProduct
);
router.put(
  "/:id",
  protect,
  adminOnly,
  [
    param("id").isMongoId().withMessage("Invalid product id"),
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("brand").optional().trim().notEmpty().withMessage("Brand cannot be empty"),
    body("category").optional().isMongoId().withMessage("Valid category is required"),
    body("storeId").optional().isMongoId().withMessage("Valid store id is required"),
    body("slug").optional().trim().notEmpty().withMessage("Slug cannot be empty"),
    body("price").optional().isFloat({ min: 0 }).withMessage("Price must be valid"),
    body("mrp").optional().isFloat({ min: 0 }).withMessage("MRP must be valid"),
    body("discount").optional().isFloat({ min: 0, max: 100 }).withMessage("Discount must be valid"),
    body("stock").optional().isInt({ min: 0 }).withMessage("Stock must be valid"),
    body("image").optional({ checkFalsy: true }).isURL({ require_protocol: true }).withMessage("Image must be a valid URL")
  ],
  validateRequest,
  updateProduct
);
router.delete(
  "/:id",
  protect,
  adminOnly,
  [param("id").isMongoId().withMessage("Invalid product id")],
  validateRequest,
  deleteProduct
);
router.post(
  "/:id/reviews",
  protect,
  [
    param("id").isMongoId().withMessage("Invalid product id"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be 1-5")
  ],
  validateRequest,
  createReview
);

module.exports = router;

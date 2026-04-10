const express = require("express");
const { body, param, query } = require("express-validator");
const {
  createStore,
  createStoreReview,
  deleteStore,
  getNearbyStores,
  getStoreById,
  getStoreProducts,
  getStores,
  updateStore
} = require("../controllers/storeController");
const { adminOnly, protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.get("/", getStores);
router.get(
  "/nearby",
  [
    query("lat").isFloat({ min: -90, max: 90 }).withMessage("lat must be valid"),
    query("lng").isFloat({ min: -180, max: 180 }).withMessage("lng must be valid")
  ],
  validateRequest,
  getNearbyStores
);
router.get(
  "/:storeId",
  [param("storeId").isMongoId().withMessage("Invalid store id")],
  validateRequest,
  getStoreById
);
router.get(
  "/:storeId/products",
  [param("storeId").isMongoId().withMessage("Invalid store id")],
  validateRequest,
  getStoreProducts
);
router.post(
  "/:storeId/reviews",
  protect,
  [
    param("storeId").isMongoId().withMessage("Invalid store id"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be 1-5")
  ],
  validateRequest,
  createStoreReview
);

router.post(
  "/",
  protect,
  adminOnly,
  [
    body("name").trim().notEmpty().withMessage("Store name is required"),
    body("slug").trim().notEmpty().withMessage("Store slug is required"),
    body("address").trim().notEmpty().withMessage("Store address is required"),
    body("city").trim().notEmpty().withMessage("Store city is required"),
    body("pincode").trim().notEmpty().withMessage("Store pincode is required"),
    body("lat").isFloat({ min: -90, max: 90 }).withMessage("lat must be valid"),
    body("lng").isFloat({ min: -180, max: 180 }).withMessage("lng must be valid")
  ],
  validateRequest,
  createStore
);

router.put(
  "/:storeId",
  protect,
  adminOnly,
  [param("storeId").isMongoId().withMessage("Invalid store id")],
  validateRequest,
  updateStore
);

router.delete(
  "/:storeId",
  protect,
  adminOnly,
  [param("storeId").isMongoId().withMessage("Invalid store id")],
  validateRequest,
  deleteStore
);

module.exports = router;

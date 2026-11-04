import { Router } from "express";
import { z } from "zod";
import {
  getStores, getNearbyStores, getStoreById, getStoreProducts,
  createStore, updateStore, deleteStore, createStoreReview,
} from "../controllers/storeController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { validateBody } from "../middleware/validateRequest.js";

const router = Router();

router.get("/", getStores);
router.get("/nearby", getNearbyStores);
router.get("/:storeId", getStoreById);
router.get("/:storeId/products", getStoreProducts);
router.post("/:storeId/reviews", protect, validateBody(z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().optional(),
})), createStoreReview);

router.post("/", protect, adminOnly, validateBody(z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  address: z.string().trim().min(1),
  city: z.string().trim().min(1),
  pincode: z.string().trim().min(1),
  lat: z.number(),
  lng: z.number(),
  description: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
})), createStore);

router.put("/:storeId", protect, adminOnly, validateBody(z.object({
  name: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
  address: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  pincode: z.string().trim().min(1).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
})), updateStore);

router.delete("/:storeId", protect, adminOnly, deleteStore);

export default router;

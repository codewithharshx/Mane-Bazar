import { Router } from "express";
import { z } from "zod";
import {
  getProducts, getProductBySlug, getProductsByCategory,
  createProduct, updateProduct, deleteProduct, createReview,
} from "../controllers/productController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { validateBody } from "../middleware/validateRequest.js";

const router = Router();

router.get("/", getProducts);
router.get("/category/:slug", getProductsByCategory);
router.get("/:slug", getProductBySlug);

router.post("/", protect, adminOnly, validateBody(z.object({
  name: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  categoryId: z.string().min(1),
  storeId: z.string().optional(),
  slug: z.string().trim().min(1),
  price: z.number().min(0),
  mrp: z.number().min(0),
  discount: z.number().min(0).max(100),
  stock: z.number().int().min(0),
  image: z.string().url().optional().or(z.literal("")),
  images: z.array(z.string()).optional(),
  description: z.string().trim().min(1),
  tags: z.array(z.string()).optional(),
})), createProduct);

router.put("/:id", protect, adminOnly, validateBody(z.object({
  name: z.string().trim().min(1).optional(),
  brand: z.string().trim().min(1).optional(),
  categoryId: z.string().optional(),
  storeId: z.string().optional(),
  slug: z.string().trim().min(1).optional(),
  price: z.number().min(0).optional(),
  mrp: z.number().min(0).optional(),
  discount: z.number().min(0).max(100).optional(),
  stock: z.number().int().min(0).optional(),
  image: z.string().url().optional().or(z.literal("")),
  images: z.array(z.string()).optional(),
  description: z.string().trim().min(1).optional(),
})), updateProduct);

router.delete("/:id", protect, adminOnly, deleteProduct);
router.post("/:id/reviews", protect, validateBody(z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().optional(),
})), createReview);

export default router;

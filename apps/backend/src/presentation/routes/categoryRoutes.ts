import { Router } from "express";
import { z } from "zod";
import { getCategories, createCategory, updateCategory } from "../controllers/categoryController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { validateBody } from "../middleware/validateRequest.js";

const router = Router();

router.get("/", getCategories);
router.post("/", protect, adminOnly, validateBody(z.object({
  name: z.string().trim().min(1, "Category name is required"),
  slug: z.string().trim().min(1, "Category slug is required"),
})), createCategory);
router.put("/:id", protect, adminOnly, validateBody(z.object({
  name: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
})), updateCategory);

export default router;

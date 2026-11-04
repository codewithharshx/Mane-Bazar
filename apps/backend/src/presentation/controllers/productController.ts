import { Request, Response } from "express";
import prisma from "../../infrastructure/database/prisma.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { escapeRegex } from "../../utils/order.js";

const normalizeImageValues = (payload: Record<string, any> = {}) => {
  const normalized = { ...payload };
  const image = typeof normalized.image === "string" ? normalized.image.trim() : "";
  const images = Array.isArray(normalized.images)
    ? normalized.images.map((v: any) => (typeof v === "string" ? v.trim() : "")).filter(Boolean)
    : typeof normalized.images === "string"
      ? normalized.images.split(",").map((v: string) => v.trim()).filter(Boolean)
      : [];

  if (image) {
    normalized.image = image;
    normalized.images = [image, ...images.filter((v: string) => v !== image)];
    return normalized;
  }
  if (images.length) {
    normalized.image = images[0];
    normalized.images = images;
  }
  return normalized;
};

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
  const skip = (page - 1) * limit;

  const where: any = { isActive: true, isDeleted: false };

  if (req.query.search) {
    where.OR = [
      { name: { contains: req.query.search as string, mode: "insensitive" } },
      { brand: { contains: req.query.search as string, mode: "insensitive" } },
      { description: { contains: req.query.search as string, mode: "insensitive" } },
    ];
  }

  if (req.query.brand) {
    where.brand = { contains: escapeRegex(req.query.brand as string), mode: "insensitive" };
  }

  if (req.query.minPrice || req.query.maxPrice) {
    where.price = {};
    if (req.query.minPrice) where.price.gte = Number(req.query.minPrice);
    if (req.query.maxPrice) where.price.lte = Number(req.query.maxPrice);
  }

  if (req.query.category) {
    const category = await prisma.category.findFirst({ where: { slug: req.query.category as string } });
    if (category) where.categoryId = category.id;
  }

  if (req.query.store) {
    where.storeId = req.query.store as string;
  }

  let orderBy: any = { createdAt: "desc" };
  switch (req.query.sort) {
    case "price_asc": orderBy = { price: "asc" }; break;
    case "price_desc": orderBy = { price: "desc" }; break;
    case "name_asc": orderBy = { name: "asc" }; break;
    case "popular":
    case "bestsellers":
      orderBy = { soldCount: "desc" }; break;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { name: true, slug: true } }, store: { select: { name: true, city: true, rating: true, isOpen: true } } },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);
  res.json({ data: products, page, pages, total, products, pagination: { page, limit, total, pages } });
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await prisma.product.findFirst({
    where: { slug: req.params.slug, isDeleted: false },
    include: {
      category: { select: { name: true, slug: true } },
      store: { select: { name: true, city: true, address: true, phone: true, whatsapp: true, rating: true, totalReviews: true } },
      ratings: { include: { user: { select: { name: true, avatar: true } } } },
    },
  });
  if (!product) { res.status(404); throw new Error("Product not found"); }
  res.json(product);
});

export const getProductsByCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await prisma.category.findFirst({ where: { slug: req.params.slug, isActive: true } });
  if (!category) { res.status(404); throw new Error("Category not found"); }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { categoryId: category.id, isActive: true, isDeleted: false },
      include: { category: { select: { name: true, slug: true } }, store: { select: { name: true, city: true, rating: true, isOpen: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where: { categoryId: category.id, isActive: true, isDeleted: false } }),
  ]);

  const pages = Math.ceil(total / limit);
  res.json({ data: products, page, pages, total, category, products, pagination: { page, limit, total, pages } });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = normalizeImageValues(req.body) as any;
  const product = await prisma.product.create({
    data,
    include: { category: { select: { name: true, slug: true } }, store: { select: { name: true, city: true } } },
  });
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = normalizeImageValues(req.body) as any;
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data,
    include: { category: { select: { name: true, slug: true } }, store: { select: { name: true, city: true } } },
  });
  if (!product) { res.status(404); throw new Error("Product not found"); }
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { isDeleted: true, isActive: false },
  });
  if (!product) { res.status(404); throw new Error("Product not found"); }
  res.json({ message: "Product deleted successfully" });
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { rating, review } = req.body;
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) { res.status(404); throw new Error("Product not found"); }

  const userId = (req as any).userId;

  const existing = await prisma.productRating.findFirst({
    where: { productId: product.id, userId },
  });

  if (existing) {
    await prisma.productRating.update({
      where: { id: existing.id },
      data: { rating, review: review || existing.review },
    });
  } else {
    await prisma.productRating.create({
      data: { productId: product.id, userId, rating, review },
    });
  }

  res.json({ message: "Review saved successfully" });
});

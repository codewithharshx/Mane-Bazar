import { Request, Response } from "express";
import prisma from "../../infrastructure/database/prisma.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { escapeRegex } from "../../utils/order.js";

const parsePageParams = (query: Record<string, any>) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 12), 1), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const getStores = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePageParams(req.query as Record<string, any>);
  const where: any = {};

  if (req.query.city) where.city = { contains: escapeRegex(req.query.city as string), mode: "insensitive" };
  if (req.query.pincode) where.pincode = req.query.pincode as string;
  if (req.query.search) {
    const s = escapeRegex(req.query.search as string);
    where.OR = [
      { name: { contains: s, mode: "insensitive" } },
      { city: { contains: s, mode: "insensitive" } },
      { address: { contains: s, mode: "insensitive" } },
    ];
  }
  if (typeof req.query.isOpen === "string") where.isOpen = req.query.isOpen === "true";

  const orderBy = req.query.sort === "rating" ? { rating: "desc" as const } : { createdAt: "desc" as const };

  const [stores, total] = await Promise.all([
    prisma.store.findMany({ where, orderBy, skip, take: limit, include: { owner: { select: { name: true, email: true } } } }),
    prisma.store.count({ where }),
  ]);

  res.json({ stores, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getStoreById = asyncHandler(async (req: Request, res: Response) => {
  const store = await prisma.store.findUnique({
    where: { id: req.params.storeId },
    include: {
      owner: { select: { name: true, email: true } },
      reviews: { include: { user: { select: { name: true, avatar: true } } } },
    },
  });
  if (!store) { res.status(404); throw new Error("Store not found"); }

  const starBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: store.reviews.filter((r) => r.rating === star).length,
  }));

  res.json({ ...store, starBreakdown });
});

export const createStore = asyncHandler(async (req: Request, res: Response) => {
  const store = await prisma.store.create({ data: req.body });
  res.status(201).json(store);
});

export const updateStore = asyncHandler(async (req: Request, res: Response) => {
  const store = await prisma.store.update({ where: { id: req.params.storeId }, data: req.body });
  if (!store) { res.status(404); throw new Error("Store not found"); }
  res.json(store);
});

export const deleteStore = asyncHandler(async (req: Request, res: Response) => {
  await prisma.store.delete({ where: { id: req.params.storeId } });
  res.json({ message: "Store deleted successfully" });
});

export const createStoreReview = asyncHandler(async (req: Request, res: Response) => {
  const { rating, review = "" } = req.body;
  const userId = (req as any).userId;

  const store = await prisma.store.findUnique({ where: { id: req.params.storeId } });
  if (!store) { res.status(404); throw new Error("Store not found"); }

  const existing = await prisma.storeReview.findFirst({
    where: { storeId: store.id, userId },
  });

  if (existing) {
    await prisma.storeReview.update({
      where: { id: existing.id },
      data: { rating, review: review || existing.review },
    });
  } else {
    await prisma.storeReview.create({
      data: { storeId: store.id, userId, rating, review },
    });
  }

  const totalReviews = await prisma.storeReview.count({ where: { storeId: store.id } });
  const agg = await prisma.storeReview.aggregate({ where: { storeId: store.id }, _avg: { rating: true } });
  const avgRating = totalReviews > 0 ? Number((agg._avg.rating || 0).toFixed(1)) : 0;

  await prisma.store.update({
    where: { id: store.id },
    data: { rating: avgRating, totalReviews },
  });

  res.json({ message: "Store review saved successfully", rating: avgRating, totalReviews });
});

export const getStoreProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePageParams(req.query as Record<string, any>);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { storeId: req.params.storeId, isActive: true },
      include: { category: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where: { storeId: req.params.storeId, isActive: true } }),
  ]);

  res.json({ products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// Nearby stores — simplified: no geo index in Prisma, filter by pincode or return all
export const getNearbyStores = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePageParams(req.query as Record<string, any>);
  const where: any = {};

  if (req.query.city) where.city = { contains: escapeRegex(req.query.city as string), mode: "insensitive" };

  const [stores, total] = await Promise.all([
    prisma.store.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.store.count({ where }),
  ]);

  res.json({ stores, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

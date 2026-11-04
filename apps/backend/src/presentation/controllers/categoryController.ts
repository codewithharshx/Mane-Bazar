import { Request, Response } from "express";
import prisma from "../../infrastructure/database/prisma.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  res.json(categories);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await prisma.category.create({ data: req.body });
  res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: req.body,
  });
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }
  res.json(category);
});

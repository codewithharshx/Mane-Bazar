import { Request, Response } from "express";
import { DiscountType } from "@mane-bazar/database";
import prisma from "../../infrastructure/database/prisma.js";
import asyncHandler from "../middleware/asyncHandler.js";

const computeCouponDiscount = (coupon: { discountType: DiscountType; discountValue: number }, subtotal: number) => {
  if (coupon.discountType === "PERCENT") {
    return Number(((subtotal * coupon.discountValue) / 100).toFixed(2));
  }
  return Math.min(subtotal, coupon.discountValue);
};

export const applyCoupon = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { code, subtotal } = req.body;
    const normalizedCode = String(code || "").toUpperCase().trim();
    const orderSubtotal = Number(subtotal);

    const coupon = await prisma.coupon.findFirst({ where: { code: normalizedCode, isActive: true } });
    if (!coupon) { res.status(400); throw new Error("Coupon is invalid or inactive"); }
    if (coupon.expiresAt < new Date()) { res.status(400); throw new Error("Coupon has expired"); }
    if (coupon.usedCount >= coupon.maxUses) { res.status(400); throw new Error("Coupon usage limit reached"); }
    if (orderSubtotal < coupon.minOrderAmount) {
      res.status(400);
      throw new Error(`Minimum order amount is Rs. ${coupon.minOrderAmount}`);
    }

    const discount = computeCouponDiscount(coupon, orderSubtotal);
    res.json({
      message: "Coupon applied successfully",
      code: coupon.code,
      discount,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    });
  } catch (error: any) {
    if (!res.headersSent) { res.status(400); }
    throw new Error(error.message);
  }
});

export const getCoupons = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  res.json(coupons);
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await prisma.coupon.create({
    data: { ...req.body, code: req.body.code.toUpperCase().trim() },
  });
  res.status(201).json(coupon);
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data: req.body });
  if (!coupon) { res.status(404); throw new Error("Coupon not found"); }
  res.json(coupon);
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  res.json({ message: "Coupon deleted successfully" });
});

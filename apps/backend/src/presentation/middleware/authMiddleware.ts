import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../infrastructure/database/prisma.js";
import { asyncHandler } from "./asyncHandler.js";
import { User, Role } from "@mane-bazar/shared";

interface DecodedToken {
  id: string;
}

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.accessToken;

  if (!cookieToken && (!authHeader || !authHeader.startsWith("Bearer "))) {
    res.status(401);
    throw new Error("Not authorized");
  }

  const token = cookieToken || authHeader!.split(" ")[1];
  let decoded: DecodedToken;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret-for-dev") as DecodedToken;
  } catch (error) {
    res.status(401);
    throw new Error("Invalid or expired access token");
  }

  if (!decoded?.id) {
    res.status(401);
    throw new Error("Invalid access token payload");
  }

  const userRecord = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!userRecord) {
    res.status(401);
    throw new Error("User no longer exists");
  }

  if (!userRecord.isActive) {
    res.status(401);
    throw new Error("User account is inactive");
  }

  // Map database model to shared User interface type
  const user: User = {
    id: userRecord.id,
    name: userRecord.name,
    email: userRecord.email,
    avatar: userRecord.avatar,
    role: userRecord.role as Role,
    isVerified: userRecord.isVerified,
    isActive: userRecord.isActive,
    createdAt: userRecord.createdAt.toISOString(),
    updatedAt: userRecord.updatedAt.toISOString(),
  };

  req.user = user;
  req.userId = user.id;
  next();
});

export const adminOnly = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user as User | undefined;
  if (!user || user.role !== "ADMIN") {
    res.status(403);
    throw new Error("Admin access required");
  }
  next();
};

export const ensureVerified = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user as User | undefined;
  if (!user?.isVerified) {
    res.status(403);
    throw new Error("Please verify your email before shopping");
  }
  next();
};

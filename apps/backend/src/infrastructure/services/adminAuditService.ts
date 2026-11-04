import { Prisma } from "@mane-bazar/database";
import { Request } from "express";
import prisma from "../database/prisma.js";

const getClientIp = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return (req.ip || (req.socket as any)?.remoteAddress || "") as string;
};

export const logAdminAction = async (
  req: Request,
  {
    action,
    targetType,
    targetId = "",
    meta = {},
  }: {
    action: string;
    targetType: string;
    targetId?: string;
    meta?: Record<string, unknown>;
  }
): Promise<void> => {
  await prisma.adminAuditLog.create({
    data: {
      actorId: (req as any).userId!,
      action,
      targetType,
      targetId: String(targetId || ""),
      requestId: (req as any).requestId || "",
      ipAddress: getClientIp(req),
      userAgent: String(req.headers["user-agent"] || "").slice(0, 512),
      meta: meta as Prisma.InputJsonValue,
    },
  });
};

import crypto from "crypto";
import { IdempotencyStatus } from "@mane-bazar/database";
import prisma from "../database/prisma.js";

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

const stableSerialize = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

export const hashPayload = (payload: unknown): string =>
  crypto.createHash("sha256").update(stableSerialize(payload)).digest("hex");

export const extractIdempotencyKey = (req: { headers: Record<string, any>; body?: Record<string, any> }): string => {
  const headerKey = req.headers["x-idempotency-key"];
  const bodyKey = req.body?.idempotencyKey;
  const raw = typeof headerKey === "string" ? headerKey : typeof bodyKey === "string" ? bodyKey : "";
  return raw.trim().slice(0, 128);
};

export interface IdempotencyLock {
  mode: "bypass" | "replay" | "conflict" | "processing" | "acquired";
  record?: any;
  responseCode?: number;
  responseBody?: any;
  message?: string;
}

export const acquireIdempotency = async ({
  userId,
  scope,
  key,
  requestHash,
}: {
  userId: string;
  scope: string;
  key: string;
  requestHash: string;
}): Promise<IdempotencyLock> => {
  if (!key) {
    return { mode: "bypass", record: null };
  }

  const now = new Date();
  const existing = await prisma.idempotencyKey.findFirst({
    where: { userId, scope, key },
  });

  if (existing) {
    if (existing.requestHash !== requestHash) {
      return {
        mode: "conflict",
        message: "Idempotency key was already used with a different request payload",
      };
    }
    if (existing.status === "COMPLETED") {
      return { mode: "replay", responseCode: existing.responseCode, responseBody: existing.responseBody };
    }
    if (existing.status === "PROCESSING") {
      return { mode: "processing", message: "Request is already being processed for this idempotency key" };
    }

    const record = await prisma.idempotencyKey.update({
      where: { id: existing.id },
      data: {
        status: "PROCESSING" as IdempotencyStatus,
        errorMessage: "",
        responseCode: 0,
        responseBody: undefined,
        expiresAt: new Date(now.getTime() + DEFAULT_TTL_MS),
      },
    });
    return { mode: "acquired", record };
  }

  try {
    const record = await prisma.idempotencyKey.create({
      data: {
        userId,
        scope,
        key,
        requestHash,
        status: "PROCESSING" as IdempotencyStatus,
        expiresAt: new Date(now.getTime() + DEFAULT_TTL_MS),
      },
    });
    return { mode: "acquired", record };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { mode: "processing", message: "Request is already being processed for this idempotency key" };
    }
    throw error;
  }
};

export const markIdempotencyCompleted = async (
  record: any,
  responseCode: number,
  responseBody: any
): Promise<void> => {
  if (!record) return;
  await prisma.idempotencyKey.update({
    where: { id: record.id },
    data: {
      status: "COMPLETED" as IdempotencyStatus,
      responseCode,
      responseBody,
      errorMessage: "",
    },
  });
};

export const markIdempotencyFailed = async (record: any, errorMessage: string): Promise<void> => {
  if (!record) return;
  await prisma.idempotencyKey.update({
    where: { id: record.id },
    data: {
      status: "FAILED" as IdempotencyStatus,
      errorMessage: String(errorMessage || "Request failed"),
    },
  });
};

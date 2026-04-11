const crypto = require("crypto");
const IdempotencyKey = require("../models/IdempotencyKey");

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

const stableSerialize = (value) => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
};

const hashPayload = (payload) =>
  crypto.createHash("sha256").update(stableSerialize(payload)).digest("hex");

const extractIdempotencyKey = (req) => {
  const headerKey = req.headers["x-idempotency-key"];
  const bodyKey = req.body?.idempotencyKey;
  const raw = typeof headerKey === "string" ? headerKey : bodyKey;
  const key = typeof raw === "string" ? raw.trim() : "";

  return key.slice(0, 128);
};

const acquireIdempotency = async ({ userId, scope, key, requestHash }) => {
  if (!key) {
    return { mode: "bypass", record: null };
  }

  const now = new Date();
  const existing = await IdempotencyKey.findOne({ user: userId, scope, key });

  if (existing) {
    if (existing.requestHash !== requestHash) {
      return {
        mode: "conflict",
        message: "Idempotency key was already used with a different request payload"
      };
    }

    if (existing.status === "completed") {
      return { mode: "replay", responseCode: existing.responseCode, responseBody: existing.responseBody };
    }

    if (existing.status === "processing") {
      return { mode: "processing", message: "Request is already being processed for this idempotency key" };
    }

    existing.status = "processing";
    existing.errorMessage = "";
    existing.responseCode = 0;
    existing.responseBody = null;
    existing.expiresAt = new Date(now.getTime() + DEFAULT_TTL_MS);
    await existing.save();

    return { mode: "acquired", record: existing };
  }

  try {
    const record = await IdempotencyKey.create({
      user: userId,
      scope,
      key,
      requestHash,
      status: "processing",
      expiresAt: new Date(now.getTime() + DEFAULT_TTL_MS)
    });

    return { mode: "acquired", record };
  } catch (error) {
    if (error?.code === 11000) {
      return { mode: "processing", message: "Request is already being processed for this idempotency key" };
    }
    throw error;
  }
};

const markIdempotencyCompleted = async (record, responseCode, responseBody) => {
  if (!record) return;

  record.status = "completed";
  record.responseCode = responseCode;
  record.responseBody = responseBody;
  record.errorMessage = "";
  await record.save();
};

const markIdempotencyFailed = async (record, errorMessage) => {
  if (!record) return;

  record.status = "failed";
  record.errorMessage = String(errorMessage || "Request failed");
  await record.save();
};

module.exports = {
  hashPayload,
  extractIdempotencyKey,
  acquireIdempotency,
  markIdempotencyCompleted,
  markIdempotencyFailed
};
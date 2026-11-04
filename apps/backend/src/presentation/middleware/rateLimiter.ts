import rateLimit, { Options } from "express-rate-limit";
import { getRuntimeConfig } from "../../config/env.js";
import { Request } from "express";

interface LimiterOptions {
  windowMs: number;
  max: number;
  message: string;
}

const buildLimiter = ({ windowMs, max, message }: LimiterOptions) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
    keyGenerator: (req: Request): string => {
      // Key rate limit by userId if authenticated, fallback to IP address
      const user = req.user as any;
      const userId = req.userId || user?.id;
      return userId ? `user:${userId}` : `ip:${req.ip}`;
    },
  });

const config = getRuntimeConfig();

export const authRateLimiter = buildLimiter({
  windowMs: config.authRateLimitWindowMs,
  max: config.authRateLimitMax,
  message: "Too many auth requests. Please try again later.",
});

export const resendVerificationRateLimiter = buildLimiter({
  windowMs: config.resendVerificationRateLimitWindowMs,
  max: config.resendVerificationRateLimitMax,
  message: "Too many verification email requests. Please try again shortly.",
});

export const verifyEmailRateLimiter = buildLimiter({
  windowMs: config.verifyEmailRateLimitWindowMs,
  max: config.verifyEmailRateLimitMax,
  message: "Too many verification attempts. Please try again shortly.",
});

export const passwordResetRateLimiter = buildLimiter({
  windowMs: config.passwordResetRateLimitWindowMs,
  max: config.passwordResetRateLimitMax,
  message: "Too many password reset requests. Please try again shortly.",
});

export const globalApiRateLimiter = buildLimiter({
  windowMs: config.apiRateLimitWindowMs,
  max: config.apiRateLimitMax,
  message: "Too many API requests. Please slow down and try again shortly.",
});

export const checkoutRateLimiter = buildLimiter({
  windowMs: config.checkoutRateLimitWindowMs,
  max: config.checkoutRateLimitMax,
  message: "Too many checkout attempts. Please wait a moment and retry.",
});

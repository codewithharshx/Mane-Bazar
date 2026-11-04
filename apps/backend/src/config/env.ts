export interface RuntimeConfig {
  isProduction: boolean;
  jwtExpire: string;
  jwtRefreshExpire: string;
  cookieSecure: boolean;
  cookieSameSite: "lax" | "strict" | "none";
  authRateLimitWindowMs: number;
  authRateLimitMax: number;
  apiRateLimitWindowMs: number;
  apiRateLimitMax: number;
  resendVerificationRateLimitWindowMs: number;
  resendVerificationRateLimitMax: number;
  verifyEmailRateLimitWindowMs: number;
  verifyEmailRateLimitMax: number;
  passwordResetRateLimitWindowMs: number;
  passwordResetRateLimitMax: number;
  checkoutRateLimitWindowMs: number;
  checkoutRateLimitMax: number;
  emailVerificationTokenTtlMinutes: number;
  emailOtpTtlMinutes: number;
  emailOtpCooldownSeconds: number;
  emailOtpMaxAttempts: number;
  emailOtpMaxRetriesPerHour: number;
  passwordResetTokenTtlMinutes: number;
  allowRefreshTokenBody: boolean;
  pendingPaymentSweepIntervalMs: number;
  pendingPaymentSweepBatchSize: number;
}

const DEFAULTS = {
  jwtExpire: "15m",
  jwtRefreshExpire: "7d",
  authRateLimitWindowMs: 15 * 60 * 1000,
  authRateLimitMax: 20,
  apiRateLimitWindowMs: 15 * 60 * 1000,
  apiRateLimitMax: 250,
  resendVerificationRateLimitWindowMs: 15 * 60 * 1000,
  resendVerificationRateLimitMax: 5,
  verifyEmailRateLimitWindowMs: 10 * 60 * 1000,
  verifyEmailRateLimitMax: 20,
  passwordResetRateLimitWindowMs: 15 * 60 * 1000,
  passwordResetRateLimitMax: 10,
  checkoutRateLimitWindowMs: 10 * 60 * 1000,
  checkoutRateLimitMax: 25,
  emailVerificationTokenTtlMinutes: 60,
  emailOtpTtlMinutes: 10,
  emailOtpCooldownSeconds: 60,
  emailOtpMaxAttempts: 5,
  emailOtpMaxRetriesPerHour: 5,
  passwordResetTokenTtlMinutes: 30,
  allowRefreshTokenBody: false,
  pendingPaymentSweepIntervalMs: 60 * 1000,
  pendingPaymentSweepBatchSize: 100,
};

const isPlaceholderSecret = (value: string = ""): boolean => {
  const normalized = value.toLowerCase();
  return !value || normalized.includes("change-in-production") || normalized.includes("your-");
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === "true";
};

const normalizeSameSite = (value: string | undefined, fallback: "lax" | "strict" | "none"): "lax" | "strict" | "none" => {
  const normalized = String(value || "").toLowerCase();
  if (["lax", "strict", "none"].includes(normalized)) {
    return normalized as "lax" | "strict" | "none";
  }
  return fallback;
};

export const getRuntimeConfig = (): RuntimeConfig => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    isProduction,
    jwtExpire: process.env.JWT_EXPIRE || DEFAULTS.jwtExpire,
    jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || DEFAULTS.jwtRefreshExpire,
    cookieSecure: parseBoolean(process.env.COOKIE_SECURE, isProduction),
    cookieSameSite: normalizeSameSite(
      process.env.COOKIE_SAME_SITE,
      isProduction ? "none" : "lax",
    ),
    authRateLimitWindowMs: parseNumber(
      process.env.AUTH_RATE_LIMIT_WINDOW_MS,
      DEFAULTS.authRateLimitWindowMs,
    ),
    authRateLimitMax: parseNumber(
      process.env.AUTH_RATE_LIMIT_MAX,
      DEFAULTS.authRateLimitMax,
    ),
    apiRateLimitWindowMs: parseNumber(
      process.env.API_RATE_LIMIT_WINDOW_MS,
      DEFAULTS.apiRateLimitWindowMs,
    ),
    apiRateLimitMax: parseNumber(
      process.env.API_RATE_LIMIT_MAX,
      DEFAULTS.apiRateLimitMax,
    ),
    resendVerificationRateLimitWindowMs: parseNumber(
      process.env.RESEND_VERIFICATION_RATE_LIMIT_WINDOW_MS,
      DEFAULTS.resendVerificationRateLimitWindowMs,
    ),
    resendVerificationRateLimitMax: parseNumber(
      process.env.RESEND_VERIFICATION_RATE_LIMIT_MAX,
      DEFAULTS.resendVerificationRateLimitMax,
    ),
    verifyEmailRateLimitWindowMs: parseNumber(
      process.env.VERIFY_EMAIL_RATE_LIMIT_WINDOW_MS,
      DEFAULTS.verifyEmailRateLimitWindowMs,
    ),
    verifyEmailRateLimitMax: parseNumber(
      process.env.VERIFY_EMAIL_RATE_LIMIT_MAX,
      DEFAULTS.verifyEmailRateLimitMax,
    ),
    passwordResetRateLimitWindowMs: parseNumber(
      process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS,
      DEFAULTS.passwordResetRateLimitWindowMs,
    ),
    passwordResetRateLimitMax: parseNumber(
      process.env.PASSWORD_RESET_RATE_LIMIT_MAX,
      DEFAULTS.passwordResetRateLimitMax,
    ),
    checkoutRateLimitWindowMs: parseNumber(
      process.env.CHECKOUT_RATE_LIMIT_WINDOW_MS,
      DEFAULTS.checkoutRateLimitWindowMs,
    ),
    checkoutRateLimitMax: parseNumber(
      process.env.CHECKOUT_RATE_LIMIT_MAX,
      DEFAULTS.checkoutRateLimitMax,
    ),
    emailVerificationTokenTtlMinutes: parseNumber(
      process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES,
      DEFAULTS.emailVerificationTokenTtlMinutes,
    ),
    emailOtpTtlMinutes: parseNumber(
      process.env.EMAIL_OTP_TTL_MINUTES,
      DEFAULTS.emailOtpTtlMinutes,
    ),
    emailOtpCooldownSeconds: parseNumber(
      process.env.EMAIL_OTP_COOLDOWN_SECONDS,
      DEFAULTS.emailOtpCooldownSeconds,
    ),
    emailOtpMaxAttempts: parseNumber(
      process.env.EMAIL_OTP_MAX_ATTEMPTS,
      DEFAULTS.emailOtpMaxAttempts,
    ),
    emailOtpMaxRetriesPerHour: parseNumber(
      process.env.EMAIL_OTP_MAX_RETRIES_PER_HOUR,
      DEFAULTS.emailOtpMaxRetriesPerHour,
    ),
    passwordResetTokenTtlMinutes: parseNumber(
      process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES,
      DEFAULTS.passwordResetTokenTtlMinutes,
    ),
    allowRefreshTokenBody: parseBoolean(
      process.env.ALLOW_REFRESH_TOKEN_BODY,
      !isProduction && DEFAULTS.allowRefreshTokenBody,
    ),
    pendingPaymentSweepIntervalMs: parseNumber(
      process.env.PENDING_PAYMENT_SWEEP_INTERVAL_MS,
      DEFAULTS.pendingPaymentSweepIntervalMs,
    ),
    pendingPaymentSweepBatchSize: parseNumber(
      process.env.PENDING_PAYMENT_SWEEP_BATCH_SIZE,
      DEFAULTS.pendingPaymentSweepBatchSize,
    ),
  };
};

export const validateRuntimeConfig = (): void => {
  const { isProduction, cookieSameSite, cookieSecure } = getRuntimeConfig();

  if (!isProduction) {
    return;
  }

  const errors: string[] = [];

  if (isPlaceholderSecret(process.env.JWT_SECRET) || String(process.env.JWT_SECRET).length < 32) {
    errors.push("JWT_SECRET must be configured and at least 32 characters in production");
  }

  if (
    isPlaceholderSecret(process.env.JWT_REFRESH_SECRET) ||
    String(process.env.JWT_REFRESH_SECRET).length < 32
  ) {
    errors.push("JWT_REFRESH_SECRET must be configured and at least 32 characters in production");
  }

  if (isPlaceholderSecret(process.env.RAZORPAY_WEBHOOK_SECRET)) {
    errors.push("RAZORPAY_WEBHOOK_SECRET must be configured in production");
  }

  if (cookieSameSite === "none" && !cookieSecure) {
    errors.push("COOKIE_SECURE must be true when COOKIE_SAME_SITE is 'none'");
  }

  if (errors.length) {
    throw new Error(`Invalid production environment configuration:\n- ${errors.join("\n- ")}`);
  }
};

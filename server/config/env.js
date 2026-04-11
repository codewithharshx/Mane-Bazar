const DEFAULTS = {
  jwtExpire: "15m",
  jwtRefreshExpire: "7d",
  authRateLimitWindowMs: 15 * 60 * 1000,
  authRateLimitMax: 20,
  apiRateLimitWindowMs: 15 * 60 * 1000,
  apiRateLimitMax: 250,
  checkoutRateLimitWindowMs: 10 * 60 * 1000,
  checkoutRateLimitMax: 25,
  allowRefreshTokenBody: false
};

const isPlaceholderSecret = (value = "") => {
  const normalized = value.toLowerCase();
  return (
    !value ||
    normalized.includes("change-in-production") ||
    normalized.includes("your-")
  );
};

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === "true";
};

const normalizeSameSite = (value, fallback) => {
  const normalized = String(value || "").toLowerCase();
  if (["lax", "strict", "none"].includes(normalized)) {
    return normalized;
  }
  return fallback;
};

const getRuntimeConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    isProduction,
    jwtExpire: process.env.JWT_EXPIRE || DEFAULTS.jwtExpire,
    jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || DEFAULTS.jwtRefreshExpire,
    cookieSecure: parseBoolean(process.env.COOKIE_SECURE, isProduction),
    cookieSameSite: normalizeSameSite(
      process.env.COOKIE_SAME_SITE,
      isProduction ? "none" : "lax"
    ),
    authRateLimitWindowMs: parseNumber(
      process.env.AUTH_RATE_LIMIT_WINDOW_MS,
      DEFAULTS.authRateLimitWindowMs
    ),
    authRateLimitMax: parseNumber(
      process.env.AUTH_RATE_LIMIT_MAX,
      DEFAULTS.authRateLimitMax
    ),
    apiRateLimitWindowMs: parseNumber(
      process.env.API_RATE_LIMIT_WINDOW_MS,
      DEFAULTS.apiRateLimitWindowMs
    ),
    apiRateLimitMax: parseNumber(
      process.env.API_RATE_LIMIT_MAX,
      DEFAULTS.apiRateLimitMax
    ),
    checkoutRateLimitWindowMs: parseNumber(
      process.env.CHECKOUT_RATE_LIMIT_WINDOW_MS,
      DEFAULTS.checkoutRateLimitWindowMs
    ),
    checkoutRateLimitMax: parseNumber(
      process.env.CHECKOUT_RATE_LIMIT_MAX,
      DEFAULTS.checkoutRateLimitMax
    ),
    allowRefreshTokenBody: parseBoolean(
      process.env.ALLOW_REFRESH_TOKEN_BODY,
      !isProduction && DEFAULTS.allowRefreshTokenBody
    )
  };
};

const validateRuntimeConfig = () => {
  const { isProduction, cookieSameSite, cookieSecure } = getRuntimeConfig();

  if (!isProduction) {
    return;
  }

  const errors = [];

  if (isPlaceholderSecret(process.env.JWT_SECRET) || String(process.env.JWT_SECRET).length < 32) {
    errors.push("JWT_SECRET must be configured and at least 32 characters in production");
  }

  if (
    isPlaceholderSecret(process.env.JWT_REFRESH_SECRET) ||
    String(process.env.JWT_REFRESH_SECRET).length < 32
  ) {
    errors.push("JWT_REFRESH_SECRET must be configured and at least 32 characters in production");
  }

  if (cookieSameSite === "none" && !cookieSecure) {
    errors.push("COOKIE_SECURE must be true when COOKIE_SAME_SITE is 'none'");
  }

  if (errors.length) {
    throw new Error(`Invalid production environment configuration:\n- ${errors.join("\n- ")}`);
  }
};

module.exports = {
  getRuntimeConfig,
  validateRuntimeConfig
};
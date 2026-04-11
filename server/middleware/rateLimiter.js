const rateLimit = require("express-rate-limit");
const { getRuntimeConfig } = require("../config/env");

const buildLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message }
  });

const config = getRuntimeConfig();

const authRateLimiter = buildLimiter({
  windowMs: config.authRateLimitWindowMs,
  max: config.authRateLimitMax,
  message: "Too many auth requests. Please try again later."
});

const globalApiRateLimiter = buildLimiter({
  windowMs: config.apiRateLimitWindowMs,
  max: config.apiRateLimitMax,
  message: "Too many API requests. Please slow down and try again shortly."
});

const checkoutRateLimiter = buildLimiter({
  windowMs: config.checkoutRateLimitWindowMs,
  max: config.checkoutRateLimitMax,
  message: "Too many checkout attempts. Please wait a moment and retry."
});

module.exports = {
  authRateLimiter,
  globalApiRateLimiter,
  checkoutRateLimiter
};

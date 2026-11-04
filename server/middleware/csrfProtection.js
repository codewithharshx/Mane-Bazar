const crypto = require("crypto");
const { getRuntimeConfig } = require("../config/env");

const CSRF_COOKIE_NAME = "csrfToken";
const CSRF_HEADER_NAME = "x-csrf-token";
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const buildCsrfCookieOptions = () => {
  const config = getRuntimeConfig();
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
};

const createCsrfToken = () => crypto.randomBytes(32).toString("hex");

const hasAuthCookies = (req) => Boolean(req.cookies?.accessToken || req.cookies?.refreshToken);

const ensureCsrfCookie = (req, res, next) => {
  const existing = req.cookies?.[CSRF_COOKIE_NAME];

  if (typeof existing === "string" && existing.length >= 32) {
    return next();
  }

  const token = createCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, token, buildCsrfCookieOptions());
  req.cookies = req.cookies || {};
  req.cookies[CSRF_COOKIE_NAME] = token;
  next();
};

const compareTokens = (a, b) => {
  const left = String(a || "");
  const right = String(b || "");

  if (!left || !right || left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
};

const requireCsrfForUnsafeMethods = (req, res, next) => {
  if (!UNSAFE_METHODS.has(req.method)) {
    return next();
  }

  // Only enforce CSRF once a cookie-authenticated session exists.
  if (!hasAuthCookies(req)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME] || "";
  const headerToken = req.get(CSRF_HEADER_NAME) || "";

  if (!compareTokens(cookieToken, headerToken)) {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }

  return next();
};

const csrfToken = (req, res) => {
  const token = req.cookies?.[CSRF_COOKIE_NAME] || createCsrfToken();

  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    res.cookie(CSRF_COOKIE_NAME, token, buildCsrfCookieOptions());
  }

  // Return token in response header AND in body for client-side access
  res.set(CSRF_HEADER_NAME, token);
  res.json({ csrfToken: token });
};

module.exports = {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  ensureCsrfCookie,
  requireCsrfForUnsafeMethods,
  csrfToken
};

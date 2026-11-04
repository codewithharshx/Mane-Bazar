import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { getRuntimeConfig } from "../../config/env.js";

export const CSRF_COOKIE_NAME = "csrfToken";
export const CSRF_HEADER_NAME = "x-csrf-token";
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const buildCsrfCookieOptions = () => {
  const config = getRuntimeConfig();
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

const createCsrfToken = () => crypto.randomBytes(32).toString("hex");

const hasAuthCookies = (req: Request): boolean =>
  Boolean(req.cookies?.accessToken || req.cookies?.refreshToken);

export const ensureCsrfCookie = (req: Request, res: Response, next: NextFunction): void => {
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

const compareTokens = (a: string, b: string): boolean => {
  const left = String(a || "");
  const right = String(b || "");

  if (!left || !right || left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
};

export const requireCsrfForUnsafeMethods = (req: Request, res: Response, next: NextFunction) => {
  if (!UNSAFE_METHODS.has(req.method)) {
    return next();
  }

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

export const csrfToken = (req: Request, res: Response): void => {
  const token = req.cookies?.[CSRF_COOKIE_NAME] || createCsrfToken();

  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    res.cookie(CSRF_COOKIE_NAME, token, buildCsrfCookieOptions());
  }

  res.set(CSRF_HEADER_NAME, token);
  res.json({ csrfToken: token });
};

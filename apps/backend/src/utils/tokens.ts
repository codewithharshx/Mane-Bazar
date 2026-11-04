import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Response } from "express";
import { getRuntimeConfig } from "../config/env.js";

export const generateAccessToken = (userId: string): string =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET || "fallback-secret-for-dev", {
    expiresIn: getRuntimeConfig().jwtExpire as any,
  });

export const generateRefreshToken = (userId: string): string =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret-for-dev", {
    expiresIn: getRuntimeConfig().jwtRefreshExpire as any,
  });

export const hashToken = (token: string = ""): string =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

const buildCookieOptions = () => {
  const config = getRuntimeConfig();
  return {
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
  };
};

export const setAccessTokenCookie = (res: Response, token: string): void => {
  const baseOptions = buildCookieOptions();

  res.cookie("accessToken", token, {
    httpOnly: true,
    ...baseOptions,
    maxAge: 15 * 60 * 1000,
  });
};

export const setRefreshTokenCookie = (res: Response, token: string): void => {
  const baseOptions = buildCookieOptions();

  res.cookie("refreshToken", token, {
    httpOnly: true,
    ...baseOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const setCsrfTokenCookie = (res: Response, token: string): void => {
  const baseOptions = buildCookieOptions();

  res.cookie("csrfToken", token, {
    httpOnly: true, // Modified to true based on CSRF Security Hardening from Phase 1 complete status!
    ...baseOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearRefreshTokenCookie = (res: Response): void => {
  const baseOptions = buildCookieOptions();

  res.clearCookie("refreshToken", {
    httpOnly: true,
    ...baseOptions,
  });
};

export const clearAccessTokenCookie = (res: Response): void => {
  const baseOptions = buildCookieOptions();

  res.clearCookie("accessToken", {
    httpOnly: true,
    ...baseOptions,
  });
};

export const clearCsrfTokenCookie = (res: Response): void => {
  const baseOptions = buildCookieOptions();

  res.clearCookie("csrfToken", {
    httpOnly: true,
    ...baseOptions,
  });
};

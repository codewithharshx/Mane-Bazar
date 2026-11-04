const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { getRuntimeConfig } = require("../config/env");

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: getRuntimeConfig().jwtExpire });

const generateRefreshToken = (userId) =>
  jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: getRuntimeConfig().jwtRefreshExpire }
  );

const hashToken = (token = "") =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

const buildCookieOptions = () => {
  const config = getRuntimeConfig();
  return {
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite
  };
};

const setAccessTokenCookie = (res, token) => {
  const config = getRuntimeConfig();
  const baseOptions = buildCookieOptions();

  res.cookie("accessToken", token, {
    httpOnly: true,
    ...baseOptions,
    maxAge: 15 * 60 * 1000
  });
};

const setRefreshTokenCookie = (res, token) => {
  const baseOptions = buildCookieOptions();

  res.cookie("refreshToken", token, {
    httpOnly: true,
    ...baseOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

const setCsrfTokenCookie = (res, token) => {
  const baseOptions = buildCookieOptions();

  res.cookie("csrfToken", token, {
    httpOnly: false,
    ...baseOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

const clearRefreshTokenCookie = (res) => {
  const baseOptions = buildCookieOptions();

  res.clearCookie("refreshToken", {
    httpOnly: true,
    ...baseOptions
  });
};

const clearAccessTokenCookie = (res) => {
  const baseOptions = buildCookieOptions();

  res.clearCookie("accessToken", {
    httpOnly: true,
    ...baseOptions
  });
};

const clearCsrfTokenCookie = (res) => {
  const baseOptions = buildCookieOptions();

  res.clearCookie("csrfToken", {
    httpOnly: false,
    ...baseOptions
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setCsrfTokenCookie,
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
  clearCsrfTokenCookie
};

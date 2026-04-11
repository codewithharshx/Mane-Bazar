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

const setRefreshTokenCookie = (res, token) => {
  const config = getRuntimeConfig();

  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

const clearRefreshTokenCookie = (res) => {
  const config = getRuntimeConfig();

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie
};

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("./asyncHandler");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.accessToken;

  if (!cookieToken && (!authHeader || !authHeader.startsWith("Bearer "))) {
    res.status(401);
    throw new Error("Not authorized");
  }

  const token = cookieToken || authHeader.split(" ")[1];
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    res.status(401);
    throw new Error("Invalid or expired access token");
  }

  if (!decoded?.id) {
    res.status(401);
    throw new Error("Invalid access token payload");
  }

  const user = await User.findById(decoded.id).select("-password -refreshToken");

  if (!user) {
    res.status(401);
    throw new Error("User no longer exists");
  }

  if (!user.isActive) {
    res.status(401);
    throw new Error("User account is inactive");
  }

  req.user = user;
  next();
});

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403);
    throw new Error("Admin access required");
  }

  next();
};

const ensureVerified = (req, res, next) => {
  if (!req.user?.isVerified) {
    res.status(403);
    throw new Error("Please verify your email before shopping");
  }

  next();
};

module.exports = {
  protect,
  adminOnly,
  ensureVerified
};

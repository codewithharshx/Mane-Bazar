const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("./asyncHandler");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
  } catch (error) {
    res.status(401);
    throw new Error("Invalid or expired access token");
  }
});

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403);
    throw new Error("Admin access required");
  }

  next();
};

module.exports = {
  protect,
  adminOnly
};

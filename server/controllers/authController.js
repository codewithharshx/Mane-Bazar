const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const {
  clearRefreshTokenCookie,
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie
} = require("../utils/tokens");

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

const buildAuthResponse = async (user, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();
  setRefreshTokenCookie(res, refreshToken);

  return {
    accessToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      addresses: user.addresses,
      createdAt: user.createdAt
    }
  };
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({ name, email, password });
  const payload = await buildAuthResponse(user, res);
  res.status(201).json(payload);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const payload = await buildAuthResponse(user, res);
  res.json(payload);
});

const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!googleClient) {
    res.status(500);
    throw new Error("Google login is not configured");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  let user = await User.findOne({
    $or: [{ email: payload.email }, { googleId: payload.sub }]
  });

  if (!user) {
    user = await User.create({
      name: payload.name,
      email: payload.email,
      googleId: payload.sub,
      avatar: payload.picture || ""
    });
  } else {
    user.googleId = payload.sub;
    user.avatar = user.avatar || payload.picture || "";
    await user.save();
  }

  const response = await buildAuthResponse(user, res);
  res.json(response);
});

const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  if (!token) {
    res.status(401);
    throw new Error("Refresh token missing");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    res.status(401);
    throw new Error("Invalid refresh token");
  }

  const user = await User.findById(decoded.id);
  if (!user || user.refreshToken !== token) {
    res.status(401);
    throw new Error("Refresh token has been rotated or revoked");
  }

  const payload = await buildAuthResponse(user, res);
  res.json(payload);
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  if (token) {
    const user = await User.findOne({ refreshToken: token });
    if (user) {
      user.refreshToken = "";
      await user.save();
    }
  }

  clearRefreshTokenCookie(res);
  res.json({ message: "Logged out successfully" });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken");
  res.json(user);
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.name = req.body.name || user.name;

  if (req.body.avatar !== undefined) {
    user.avatar = req.body.avatar;
  }

  if (req.body.password) {
    user.password = req.body.password;
  }

  await user.save();
  res.json({
    message: "Profile updated successfully",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      addresses: user.addresses
    }
  });
});

const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = req.body;

  if (address.isDefault) {
    user.addresses.forEach((item) => {
      item.isDefault = false;
    });
  }

  if (!user.addresses.length) {
    address.isDefault = true;
  }

  user.addresses.push(address);
  await user.save();

  res.status(201).json({
    message: "Address added successfully",
    addresses: user.addresses
  });
});

const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    res.status(404);
    throw new Error("Address not found");
  }

  if (req.body.isDefault) {
    user.addresses.forEach((item) => {
      item.isDefault = false;
    });
  }

  Object.assign(address, req.body);
  await user.save();

  res.json({
    message: "Address updated successfully",
    addresses: user.addresses
  });
});

const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    res.status(404);
    throw new Error("Address not found");
  }

  const wasDefault = address.isDefault;
  address.deleteOne();

  if (wasDefault && user.addresses.length) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  res.json({
    message: "Address deleted successfully",
    addresses: user.addresses
  });
});

module.exports = {
  register,
  login,
  googleAuth,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress
};

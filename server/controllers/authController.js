const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const OTP = require("../models/OTPModel");
const asyncHandler = require("../middleware/asyncHandler");
const { getRuntimeConfig } = require("../config/env");
const { generateOTP } = require("../utils/generateOTP");
const {
  queueVerificationOtpEmail,
  queuePasswordResetEmail
} = require("../services/emailService");
const {
  isOtpExpired,
  canAttemptOtp,
  canResendOtp
} = require("../services/otpPolicy");
const {
  clearAccessTokenCookie,
  clearCsrfTokenCookie,
  clearRefreshTokenCookie,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setAccessTokenCookie,
  setCsrfTokenCookie,
  setRefreshTokenCookie
} = require("../utils/tokens");

// Initialize Google OAuth2 Client
const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

/**
 * Get refresh token from request (cookie or body, depending on config)
 */
const getRefreshTokenFromRequest = (req) => {
  if (req.cookies.refreshToken) {
    return req.cookies.refreshToken;
  }

  const config = getRuntimeConfig();
  if (config.allowRefreshTokenBody && req.body.refreshToken) {
    return req.body.refreshToken;
  }

  return "";
};

const hashVerificationToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const isEmailTransportConfigured = () =>
  Boolean(
    (process.env.EMAIL_HOST || process.env.SMTP_HOST) &&
      Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 0) &&
      (process.env.EMAIL_USER || process.env.SMTP_USER) &&
      (process.env.EMAIL_PASS || process.env.SMTP_PASS)
  );

/**
 * Sanitize user data for API responses
 */
const sanitizeAuthUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  addresses: user.addresses,
  isVerified: user.isVerified,
  createdAt: user.createdAt
});

const issueEmailOtp = async (user, existingOtpDoc = null) => {
  const config = getRuntimeConfig();
  const otp = generateOTP();
  const otpHash = await bcrypt.hash(otp, 12);
  const now = new Date();
  const expiresAt = new Date(Date.now() + config.emailOtpTtlMinutes * 60 * 1000);

  const previous = existingOtpDoc || (await OTP.findOne({ userId: user._id }));

  let resendWindowStartedAt = now;
  let resendCount = 1;

  if (previous && previous.resendWindowStartedAt) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (previous.resendWindowStartedAt > oneHourAgo) {
      resendWindowStartedAt = previous.resendWindowStartedAt;
      resendCount = (previous.resendCount || 0) + 1;
    }
  }

  await OTP.findOneAndUpdate(
    { userId: user._id },
    {
      userId: user._id,
      otpHash,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
      resendWindowStartedAt,
      resendCount
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await queueVerificationOtpEmail({
    to: user.email,
    name: user.name,
    otp,
    expiresMinutes: config.emailOtpTtlMinutes
  });

  return {
    otp,
    transportConfigured: isEmailTransportConfigured()
  };
};

/**
 * Build comprehensive auth response with tokens and refresh cookie
 */
const buildAuthResponse = async (user, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  const csrfToken = crypto.randomBytes(32).toString("hex");

  user.refreshToken = hashToken(refreshToken);
  await user.save();
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
  setCsrfTokenCookie(res, csrfToken);

  return {
    accessToken,
    user: sanitizeAuthUser(user)
  };
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser && existingUser.isActive && existingUser.isVerified) {
    res.status(400);
    throw new Error("Email already registered. Please login or use a different email.");
  }

  let user = existingUser;
  if (!user) {
    user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      isVerified: false
    });
  } else {
    user.name = name.trim();
    user.password = password;
    user.isVerified = false;
    await user.save();
  }

  const otpDispatch = await issueEmailOtp(user);

  const responsePayload = {
    message: "Registration successful. OTP sent to your email.",
    email: user.email,
    requiresEmailVerification: true
  };

  if (process.env.NODE_ENV !== "production" && !otpDispatch.transportConfigured) {
    responsePayload.deliveryHint =
      "SMTP is not configured. OTP email is logged in backend console in development.";
    responsePayload.devOtp = otpDispatch.otp;
  }

  res.status(201).json(responsePayload);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user || !user.isActive || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isVerified) {
    res.status(403);
    throw new Error("Please verify your email before shopping");
  }

  const payload = await buildAuthResponse(user, res);
  res.json(payload);
});

const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!process.env.GOOGLE_CLIENT_ID) {
    res.status(500);
    throw new Error("Google login is not configured on the server");
  }

  if (!googleClient) {
    res.status(500);
    throw new Error("Google OAuth client initialization failed");
  }

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
  } catch (error) {
    res.status(401);
    throw new Error(`Google token verification failed: ${error.message}`);
  }

  const payload = ticket.getPayload();
  if (!payload?.email || payload.email_verified === false) {
    res.status(401);
    throw new Error("Google account email is not verified");
  }

  let user = await User.findOne({
    $or: [{ email: payload.email }, { googleId: payload.sub }]
  });

  if (!user) {
    user = await User.create({
      name: payload.name,
      email: payload.email,
      googleId: payload.sub,
      avatar: payload.picture || "",
      isVerified: true
    });
  } else {
    user.googleId = payload.sub;
    user.avatar = user.avatar || payload.picture || "";
    if (!user.isVerified) {
      user.isVerified = true;
      await OTP.findOneAndDelete({ userId: user._id });
    }
    await user.save();
  }

  const response = await buildAuthResponse(user, res);
  res.json(response);
});

const refreshToken = asyncHandler(async (req, res) => {
  const token = getRefreshTokenFromRequest(req);

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
  const incomingTokenHash = hashToken(token);
  const hasValidStoredToken =
    user && (user.refreshToken === incomingTokenHash || user.refreshToken === token);

  if (!user || !user.isActive || !hasValidStoredToken) {
    res.status(401);
    throw new Error("Refresh token has been rotated or revoked");
  }

  if (!user.isVerified) {
    clearAccessTokenCookie(res);
    clearRefreshTokenCookie(res);
    res.status(403);
    throw new Error("Please verify your email before shopping");
  }

  const payload = await buildAuthResponse(user, res);
  res.json(payload);
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const config = getRuntimeConfig();
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !user.isActive) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  if (user.isVerified) {
    return res.json({ message: "Email already verified" });
  }

  const otpDoc = await OTP.findOne({ userId: user._id });
  if (!otpDoc || isOtpExpired(otpDoc.expiresAt)) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  if (!canAttemptOtp(otpDoc.attempts, config.emailOtpMaxAttempts)) {
    res.status(429);
    throw new Error("Too many invalid attempts. Request a new OTP.");
  }

  const normalizedOtp = String(otp || "").trim();
  const isValid = await bcrypt.compare(normalizedOtp, otpDoc.otpHash);
  if (!isValid) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  user.isVerified = true;
  await user.save();
  await OTP.findOneAndDelete({ userId: user._id });

  res.json({ message: "Email verified successfully. You can now login." });
});

const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const config = getRuntimeConfig();
  const safeMessage =
    "If this email is registered and not yet verified, an OTP has been sent.";

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !user.isActive || user.isVerified) {
    return res.json({ message: safeMessage });
  }

  const otpDoc = await OTP.findOne({ userId: user._id });
  const now = Date.now();

  if (otpDoc?.lastSentAt && otpDoc?.resendWindowStartedAt) {
    const resendDecision = canResendOtp({
      lastSentAt: otpDoc.lastSentAt,
      resendWindowStartedAt: otpDoc.resendWindowStartedAt,
      resendCount: otpDoc.resendCount,
      cooldownSeconds: config.emailOtpCooldownSeconds,
      maxRetriesPerHour: config.emailOtpMaxRetriesPerHour,
      now: new Date(now)
    });

    if (!resendDecision.allowed && resendDecision.reason === "cooldown") {
      res.status(429);
      throw new Error(`Please wait ${resendDecision.retryAfterSeconds}s before requesting a new OTP.`);
    }

    if (!resendDecision.allowed && resendDecision.reason === "hourly_limit") {
      res.status(429);
      throw new Error("OTP resend limit reached. Please try again later.");
    }
  }

  const otpDispatch = await issueEmailOtp(user, otpDoc);

  const responsePayload = { message: safeMessage };
  if (process.env.NODE_ENV !== "production" && !otpDispatch.transportConfigured) {
    responsePayload.deliveryHint =
      "SMTP is not configured. OTP email is logged in backend console in development.";
    responsePayload.devOtp = otpDispatch.otp;
  }

  return res.json(responsePayload);
});

const logout = asyncHandler(async (req, res) => {
  const token = getRefreshTokenFromRequest(req);

  if (token) {
    const tokenHash = hashToken(token);
    const user = await User.findOne({
      $or: [{ refreshToken: tokenHash }, { refreshToken: token }]
    });

    if (user) {
      user.refreshToken = "";
      await user.save();
    }
  }

  clearRefreshTokenCookie(res);
  clearAccessTokenCookie(res);
  clearCsrfTokenCookie(res);
  res.json({ message: "Logged out successfully" });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken");
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error("User account is inactive");
  }
  res.json(user);
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error("User account is inactive");
  }
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
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error("User account is inactive");
  }
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
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error("User account is inactive");
  }
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
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error("User account is inactive");
  }
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

const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const config = getRuntimeConfig();
  const safeMessage =
    "If an account exists with this email, a password reset link has been sent. Please check your inbox.";

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  
  if (!user || !user.isActive) {
    return res.json({ message: safeMessage });
  }

  // Generate password reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetTokenHash = hashVerificationToken(resetToken);
  user.passwordResetTokenExpires = new Date(
    Date.now() + config.passwordResetTokenTtlMinutes * 60 * 1000
  );
  await user.save();

  await queuePasswordResetEmail({
    to: user.email,
    name: user.name,
    resetToken,
    expiresMinutes: config.passwordResetTokenTtlMinutes
  });

  res.json({
    message: safeMessage
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || typeof token !== "string") {
    res.status(400);
    throw new Error("Password reset token is required");
  }

  if (!password || password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const hashedToken = hashVerificationToken(token);
  const user = await User.findOne({
    passwordResetTokenHash: hashedToken,
    passwordResetTokenExpires: { $gt: new Date() }
  });

  if (!user) {
    res.status(400);
    throw new Error("Password reset link is invalid or has expired");
  }

  user.password = password;
  user.passwordResetTokenHash = "";
  user.passwordResetTokenExpires = null;
  user.refreshToken = "";
  await user.save();

  res.json({
    message: "Password reset successful. Please login with your new password."
  });
});

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  googleAuth,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  requestPasswordReset,
  resetPassword
};

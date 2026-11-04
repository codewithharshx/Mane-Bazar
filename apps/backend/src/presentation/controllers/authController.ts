import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import prisma from "../../infrastructure/database/prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getRuntimeConfig } from "../../config/env.js";
import { generateOTP } from "../../utils/generateOTP.js";
import {
  queueVerificationOtpEmail,
  queuePasswordResetEmail,
} from "../../infrastructure/services/emailService.js";
import {
  isOtpExpired,
  canAttemptOtp,
  canResendOtp,
} from "../../services/otpPolicy.js";
import {
  clearAccessTokenCookie,
  clearCsrfTokenCookie,
  clearRefreshTokenCookie,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setAccessTokenCookie,
  setCsrfTokenCookie,
  setRefreshTokenCookie,
} from "../../utils/tokens.js";
import { User, Role } from "@mane-bazar/shared";

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

const getRefreshTokenFromRequest = (req: Request): string => {
  if (req.cookies.refreshToken) {
    return req.cookies.refreshToken;
  }

  const config = getRuntimeConfig();
  if (config.allowRefreshTokenBody && req.body.refreshToken) {
    return req.body.refreshToken;
  }

  return "";
};

const hashVerificationToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

const isEmailTransportConfigured = (): boolean =>
  Boolean(
    (process.env.EMAIL_HOST || process.env.SMTP_HOST) &&
      Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 0) &&
      (process.env.EMAIL_USER || process.env.SMTP_USER) &&
      (process.env.EMAIL_PASS || process.env.SMTP_PASS),
  );

const sanitizeAuthUser = (user: any): Partial<User> => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role as Role,
  avatar: user.avatar,
  isVerified: user.isVerified,
  createdAt: user.createdAt.toISOString(),
});

const sanitizeMeUser = (user: any): Partial<User> & { addresses?: any[] } => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role as Role,
  avatar: user.avatar,
  isVerified: user.isVerified,
  isActive: user.isActive,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt?.toISOString(),
  addresses: user.addresses,
});

const issueEmailOtp = async (user: any, existingOtpDoc: any = null) => {
  const config = getRuntimeConfig();
  const otp = generateOTP();
  const salt = await bcrypt.genSalt(12);
  const otpHash = await bcrypt.hash(otp, salt);
  const now = new Date();
  const expiresAt = new Date(Date.now() + config.emailOtpTtlMinutes * 60 * 1000);

  const previous = existingOtpDoc || (await prisma.otp.findUnique({ where: { userId: user.id } }));

  let resendWindowStartedAt = now;
  let resendCount = 1;

  if (previous && previous.resendWindowStartedAt) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (previous.resendWindowStartedAt > oneHourAgo) {
      resendWindowStartedAt = previous.resendWindowStartedAt;
      resendCount = (previous.resendCount || 0) + 1;
    }
  }

  await prisma.otp.upsert({
    where: { userId: user.id },
    update: {
      otpHash,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
      resendWindowStartedAt,
      resendCount,
    },
    create: {
      userId: user.id,
      otpHash,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
      resendWindowStartedAt,
      resendCount,
    },
  });

  await queueVerificationOtpEmail({
    to: user.email,
    name: user.name,
    otp,
    expiresMinutes: config.emailOtpTtlMinutes,
  });

  return {
    otp,
    transportConfigured: isEmailTransportConfigured(),
  };
};

const buildAuthResponse = async (user: any, res: Response) => {
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  const csrfToken = crypto.randomBytes(32).toString("hex");

  const hashedRefreshToken = hashToken(refreshToken);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: hashedRefreshToken },
  });

  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
  setCsrfTokenCookie(res, csrfToken);

  return {
    accessToken,
    user: sanitizeAuthUser(user),
  };
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser && existingUser.isActive && existingUser.isVerified) {
    res.status(400);
    throw new Error("Email already registered. Please login or use a different email.");
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  let user = existingUser;
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        isVerified: false,
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name.trim(),
        password: hashedPassword,
        isVerified: false,
      },
    });
  }

  const otpDispatch = await issueEmailOtp(user);

  const responsePayload: any = {
    message: "Registration successful. OTP sent to your email.",
    email: user.email,
    requiresEmailVerification: true,
  };

  if (process.env.NODE_ENV !== "production" && !otpDispatch.transportConfigured) {
    responsePayload.deliveryHint =
      "SMTP is not configured. OTP email is logged in backend console in development.";
    responsePayload.devOtp = otpDispatch.otp;
  }

  res.status(201).json(responsePayload);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  if (!user || !user.password || !user.isActive || !(await bcrypt.compare(password, user.password))) {
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

export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
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
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (error: any) {
    res.status(401);
    throw new Error(`Google token verification failed: ${error.message}`);
  }

  const payload = ticket.getPayload();
  if (!payload?.email || payload.email_verified === false) {
    res.status(401);
    throw new Error("Google account email is not verified");
  }

  let user = await prisma.user.findFirst({
    where: {
      OR: [{ email: payload.email }, { googleId: payload.sub }],
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: payload.name || "Google User",
        email: payload.email,
        googleId: payload.sub,
        avatar: payload.picture || "",
        isVerified: true,
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: payload.sub,
        avatar: user.avatar || payload.picture || "",
        isVerified: true,
      },
    });
    await prisma.otp.deleteMany({ where: { userId: user.id } });
  }

  const response = await buildAuthResponse(user, res);
  res.json(response);
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token = getRefreshTokenFromRequest(req);

  if (!token) {
    res.status(401);
    throw new Error("Refresh token missing");
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret-for-dev");
  } catch (error) {
    res.status(401);
    throw new Error("Invalid refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
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

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const config = getRuntimeConfig();
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user || !user.isActive) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  if (user.isVerified) {
    return res.json({ message: "Email already verified" });
  }

  const otpDoc = await prisma.otp.findUnique({ where: { userId: user.id } });
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
    await prisma.otp.update({
      where: { userId: user.id },
      data: { attempts: { increment: 1 } },
    });
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true },
  });
  await prisma.otp.delete({ where: { userId: user.id } });

  res.json({ message: "Email verified successfully. You can now login." });
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const config = getRuntimeConfig();
  const safeMessage = "If this email is registered and not yet verified, an OTP has been sent.";

  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.isActive || user.isVerified) {
    return res.json({ message: safeMessage });
  }

  const otpDoc = await prisma.otp.findUnique({ where: { userId: user.id } });
  const now = Date.now();

  if (otpDoc?.lastSentAt && otpDoc?.resendWindowStartedAt) {
    const resendDecision = canResendOtp({
      lastSentAt: otpDoc.lastSentAt,
      resendWindowStartedAt: otpDoc.resendWindowStartedAt,
      resendCount: otpDoc.resendCount,
      cooldownSeconds: config.emailOtpCooldownSeconds,
      maxRetriesPerHour: config.emailOtpMaxRetriesPerHour,
      now: new Date(now),
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

  const responsePayload: any = { message: safeMessage };
  if (process.env.NODE_ENV !== "production" && !otpDispatch.transportConfigured) {
    responsePayload.deliveryHint =
      "SMTP is not configured. OTP email is logged in backend console in development.";
    responsePayload.devOtp = otpDispatch.otp;
  }

  res.json(responsePayload);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = getRefreshTokenFromRequest(req);

  if (token) {
    const tokenHash = hashToken(token);
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ refreshToken: tokenHash }, { refreshToken: token }],
      },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: "" },
      });
    }
  }

  clearRefreshTokenCookie(res);
  clearAccessTokenCookie(res);
  clearCsrfTokenCookie(res);
  res.json({ message: "Logged out successfully" });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { addresses: true },
  });
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error("User account is inactive");
  }
  res.json(sanitizeMeUser(user));
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error("User account is inactive");
  }

  const dataToUpdate: any = {};
  if (req.body.name) {
    dataToUpdate.name = req.body.name.trim();
  }
  if (req.body.avatar !== undefined) {
    dataToUpdate.avatar = req.body.avatar;
  }
  if (req.body.password) {
    const salt = await bcrypt.genSalt(12);
    dataToUpdate.password = await bcrypt.hash(req.body.password, salt);
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: dataToUpdate,
    include: { addresses: true },
  });

  res.json({
    message: "Profile updated successfully",
    user: sanitizeAuthUser(updatedUser),
  });
});

export const addAddress = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { addresses: true },
  });
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error("User account is inactive");
  }

  const addressInput = req.body;
  const isDefault = addressInput.isDefault || user.addresses.length === 0;

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });
  }

  const createdAddress = await prisma.address.create({
    data: {
      userId: user.id,
      label: addressInput.label || "Home",
      street: addressInput.street,
      city: addressInput.city,
      state: addressInput.state || "",
      pincode: addressInput.pincode,
      phone: addressInput.phone || "",
      lat: addressInput.lat ? Number(addressInput.lat) : null,
      lng: addressInput.lng ? Number(addressInput.lng) : null,
      isDefault,
    },
  });

  const allAddresses = await prisma.address.findMany({
    where: { userId: user.id },
  });

  res.status(201).json({
    message: "Address added successfully",
    addresses: allAddresses,
  });
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { addresses: true },
  });
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error("User account is inactive");
  }

  const address = await prisma.address.findFirst({
    where: { id: req.params.addressId, userId: user.id },
  });

  if (!address) {
    res.status(404);
    throw new Error("Address not found");
  }

  const isDefault = req.body.isDefault;

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });
  }

  await prisma.address.update({
    where: { id: address.id },
    data: {
      label: req.body.label,
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      phone: req.body.phone,
      lat: req.body.lat !== undefined ? Number(req.body.lat) : undefined,
      lng: req.body.lng !== undefined ? Number(req.body.lng) : undefined,
      isDefault: isDefault !== undefined ? isDefault : undefined,
    },
  });

  const allAddresses = await prisma.address.findMany({
    where: { userId: user.id },
  });

  res.json({
    message: "Address updated successfully",
    addresses: allAddresses,
  });
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { addresses: true },
  });
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error("User account is inactive");
  }

  const address = await prisma.address.findFirst({
    where: { id: req.params.addressId, userId: user.id },
  });

  if (!address) {
    res.status(404);
    throw new Error("Address not found");
  }

  await prisma.address.delete({
    where: { id: address.id },
  });

  if (address.isDefault) {
    const nextAddress = await prisma.address.findFirst({
      where: { userId: user.id },
    });
    if (nextAddress) {
      await prisma.address.update({
        where: { id: nextAddress.id },
        data: { isDefault: true },
      });
    }
  }

  const allAddresses = await prisma.address.findMany({
    where: { userId: user.id },
  });

  res.json({
    message: "Address deleted successfully",
    addresses: allAddresses,
  });
});

export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const config = getRuntimeConfig();
  const safeMessage =
    "If an account exists with this email, a password reset link has been sent. Please check your inbox.";

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.isActive) {
    return res.json({ message: safeMessage });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashVerificationToken(resetToken);
  const passwordResetTokenExpires = new Date(
    Date.now() + config.passwordResetTokenTtlMinutes * 60 * 1000,
  );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: hashedToken,
      passwordResetTokenExpires,
    },
  });

  await queuePasswordResetEmail({
    to: user.email,
    name: user.name,
    resetToken,
    expiresMinutes: config.passwordResetTokenTtlMinutes,
  });

  res.json({
    message: safeMessage,
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
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
  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: hashedToken,
      passwordResetTokenExpires: { gt: new Date() },
    },
  });

  if (!user) {
    res.status(400);
    throw new Error("Password reset link is invalid or has expired");
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetTokenHash: "",
      passwordResetTokenExpires: null,
      refreshToken: "",
    },
  });

  res.json({
    message: "Password reset successful. Please login with your new password.",
  });
});

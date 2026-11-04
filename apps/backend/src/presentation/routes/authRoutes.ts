import express from "express";
import passport from "passport";
import crypto from "crypto";
import {
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
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateBody } from "../middleware/validateRequest.js";
import {
  resendVerificationRateLimiter,
  verifyEmailRateLimiter,
  passwordResetRateLimiter,
} from "../middleware/rateLimiter.js";
import { csrfToken } from "../middleware/csrfProtection.js";
import {
  RegisterSchema,
  LoginSchema,
  VerifyEmailOtpSchema,
  ResendVerificationSchema,
  PasswordResetRequestSchema,
  PasswordResetSchema,
  GoogleAuthSchema,
  UpdateProfileSchema,
  AddressSchema,
} from "@mane-bazar/shared";

const router = express.Router();
const getClientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

// User Registration
router.post("/register", validateBody(RegisterSchema), register);

// Email & Password Login
router.post("/login", validateBody(LoginSchema), login);

// Email Verification (OTP)
router.post("/verify-email", verifyEmailRateLimiter, validateBody(VerifyEmailOtpSchema), verifyEmail);

// Resend Verification Email
router.post(
  "/resend-verification",
  resendVerificationRateLimiter,
  validateBody(ResendVerificationSchema),
  resendVerification
);

// Password Reset Request
router.post(
  "/request-password-reset",
  passwordResetRateLimiter,
  validateBody(PasswordResetRequestSchema),
  requestPasswordReset
);

// Password Reset
router.post("/reset-password", validateBody(PasswordResetSchema), resetPassword);

// Google OAuth Token Exchange (ID token from frontend)
router.post("/google", validateBody(GoogleAuthSchema), googleAuth);

// Check if Google OAuth is configured (for frontend)
router.get("/config", (_req, res) => {
  res.json({
    googleOAuthEnabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  });
});

// Refresh Access Token
router.post("/refresh-token", refreshToken);

// Read CSRF token (public endpoint)
router.get("/csrf", csrfToken);

// Logout
router.post("/logout", logout);

// Get Current User Profile
router.get("/me", protect, getMe);

// Update User Profile
router.put("/profile", protect, validateBody(UpdateProfileSchema), updateProfile);

// Add New Address
router.post("/addresses", protect, validateBody(AddressSchema), addAddress);

// Update Address
router.put("/addresses/:addressId", protect, validateBody(AddressSchema), updateAddress);

// Delete Address
router.delete("/addresses/:addressId", protect, deleteAddress);

export default router;

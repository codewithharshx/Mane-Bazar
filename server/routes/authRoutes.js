const express = require("express");
const passport = require("passport");
const crypto = require("crypto");
const {
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
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const {
  validateRegister,
  validateLogin,
  validateGoogleAuth,
  validateResendVerification,
  validateVerifyEmailOtp,
  validatePasswordResetRequest,
  validateOptionalRefreshToken,
  validateUpdateProfile,
  validateAddressIdParam,
  validateAddAddress,
  validatePasswordReset
} = require("../middleware/validators");
const {
  resendVerificationRateLimiter,
  verifyEmailRateLimiter,
  passwordResetRateLimiter
} = require("../middleware/rateLimiter");
const { csrfToken } = require("../middleware/csrfProtection");
const {
  setCsrfTokenCookie,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setAccessTokenCookie,
  setRefreshTokenCookie
} = require("../utils/tokens");

const router = express.Router();
const getClientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC AUTHENTICATION ROUTES (No authentication required)
// ═══════════════════════════════════════════════════════════════════════════════

// User Registration
router.post("/register", validateRegister, register);

// Email & Password Login
router.post("/login", validateLogin, login);

// Email Verification (OTP)
router.post("/verify-email", verifyEmailRateLimiter, validateVerifyEmailOtp, verifyEmail);

// Resend Verification Email
router.post(
  "/resend-verification",
  resendVerificationRateLimiter,
  validateResendVerification,
  resendVerification
);

// Password Reset Request
router.post(
  "/request-password-reset",
  passwordResetRateLimiter,
  validatePasswordResetRequest,
  requestPasswordReset
);

// Password Reset
router.post("/reset-password", validatePasswordReset, resetPassword);

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE OAUTH ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Google OAuth Token Exchange (ID token from frontend)
router.post("/google", validateGoogleAuth, googleAuth);

// Check if Google OAuth is configured (for frontend)
router.get("/config", (req, res) => {
  res.json({
    googleOAuthEnabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  });
});

// Google OAuth Redirect Flow (Passport)
router.get("/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${getClientUrl()}/login?error=google_not_configured`);
  }
  passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"]
  })(req, res, next);
});

// Google OAuth Callback
router.get(
  "/google/callback",
  (req, res, next) =>
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${getClientUrl()}/login`
    })(req, res, next),
  async (req, res) => {
    const accessToken = generateAccessToken(req.user._id);
    const refreshToken = generateRefreshToken(req.user._id);
    const csrfToken = crypto.randomBytes(32).toString("hex");
    req.user.refreshToken = hashToken(refreshToken);
    await req.user.save();
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);
    setCsrfTokenCookie(res, csrfToken);

    const clientUrl = getClientUrl();
    // Fixed redirect target to avoid open redirect/token exfiltration issues.
    res.redirect(`${clientUrl}/`);
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN MANAGEMENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Refresh Access Token
router.post("/refresh-token", validateOptionalRefreshToken, refreshToken);

// Read CSRF token (public endpoint for security-aware clients)
router.get("/csrf", csrfToken);

// Logout (Invalidate Refresh Token)
router.post("/logout", validateOptionalRefreshToken, logout);

// ═══════════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES (Authentication required with valid JWT)
// ═══════════════════════════════════════════════════════════════════════════════

// Get Current User Profile
router.get("/me", protect, getMe);

// Update User Profile
router.put("/profile", protect, validateUpdateProfile, updateProfile);

// ═══════════════════════════════════════════════════════════════════════════════
// ADDRESS MANAGEMENT ROUTES (Protected)
// ═══════════════════════════════════════════════════════════════════════════════

// Add New Address
router.post("/addresses", protect, validateAddAddress, addAddress);

// Update Address
router.put(
  "/addresses/:addressId",
  protect,
  validateAddressIdParam,
  validateAddAddress,
  updateAddress
);

// Delete Address
router.delete("/addresses/:addressId", protect, validateAddressIdParam, deleteAddress);

module.exports = router;

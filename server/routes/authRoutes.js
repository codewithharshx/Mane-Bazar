const express = require("express");
const passport = require("passport");
const {
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
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const {
  validateRegister,
  validateLogin,
  validateGoogleAuth,
  validateOptionalRefreshToken,
  validateUpdateProfile,
  validateAddressIdParam,
  validateAddAddress
} = require("../middleware/validators");
const { generateAccessToken } = require("../utils/tokens");

const router = express.Router();

// Public routes
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/google", validateGoogleAuth, googleAuth);
router.post("/refresh-token", validateOptionalRefreshToken, refreshToken);
router.post("/logout", validateOptionalRefreshToken, logout);

// Google OAuth (Passport flow — optional, in addition to google-auth-library)
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req, res) => {
    const token = generateAccessToken(req.user._id);
    res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}?token=${token}`);
  }
);

// Protected routes
router.get("/me", protect, getMe);
router.put("/profile", protect, validateUpdateProfile, updateProfile);
router.post("/addresses", protect, validateAddAddress, addAddress);
router.put(
  "/addresses/:addressId",
  protect,
  validateAddressIdParam,
  validateAddAddress,
  updateAddress
);
router.delete("/addresses/:addressId", protect, validateAddressIdParam, deleteAddress);

module.exports = router;
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
  validateUpdateProfile,
  validateAddAddress
} = require("../middleware/validators");

const router = express.Router();

// Public routes
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/google", googleAuth);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

// Google OAuth (Passport flow — optional, in addition to google-auth-library)
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req, res) => {
    const jwt = require("jsonwebtoken");
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}?token=${token}`);
  }
);

// Protected routes
router.get("/me", protect, getMe);
router.put("/profile", protect, validateUpdateProfile, updateProfile);
router.post("/addresses", protect, validateAddAddress, addAddress);
router.put("/addresses/:addressId", protect, validateAddAddress, updateAddress);
router.delete("/addresses/:addressId", protect, deleteAddress);

module.exports = router;
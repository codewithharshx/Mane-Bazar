const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home", trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: "", trim: true },
    pincode: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    isDefault: { type: Boolean, default: false }
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      default: ""
    },
    googleId: {
      type: String,
      default: ""
    },
    avatar: {
      type: String,
      default: ""
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    addresses: {
      type: [addressSchema],
      default: []
    },
    refreshToken: {
      type: String,
      default: ""
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: {
      type: String,
      default: ""
    },
    verificationTokenExpires: {
      type: Date,
      default: null
    },
    passwordResetTokenHash: {
      type: String,
      default: ""
    },
    passwordResetTokenExpires: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare plain-text password with hashed password
userSchema.methods.matchPassword = async function matchPassword(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Mask sensitive fields from JSON output
userSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.refreshToken;
    delete ret.verificationToken;
    delete ret.verificationTokenExpires;
    delete ret.passwordResetTokenHash;
    delete ret.passwordResetTokenExpires;
    return ret;
  }
});

module.exports = mongoose.model("User", userSchema);
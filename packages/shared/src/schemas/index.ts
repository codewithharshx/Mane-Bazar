import { z } from "zod";

// User Schemas
export const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const LoginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const ResendVerificationSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
});

export const VerifyEmailOtpSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

export const PasswordResetRequestSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
});

export const PasswordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const GoogleAuthSchema = z.object({
  credential: z.string().min(1, "Google credential is required"),
});

export const UpdateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  avatar: z.string().url("Invalid avatar URL format").optional().or(z.literal("")),
});

// Address Schemas
export const AddressSchema = z.object({
  label: z.string().trim().default("Home"),
  street: z.string().trim().min(1, "Street is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().default(""),
  pincode: z.string().trim().min(6, "Pincode must be at least 6 digits").max(10),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits").optional().or(z.literal("")),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  isDefault: z.boolean().default(false),
});

// Catalog Schemas (Store & Product)
export const ProductRatingSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().trim().optional(),
});

export const StoreReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().trim().optional(),
});

export const RestockSchema = z.object({
  quantity: z.number().int().min(1).max(100000),
});

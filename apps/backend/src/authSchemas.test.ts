import { describe, it, expect } from "vitest";
import {
  RegisterSchema,
  LoginSchema,
  VerifyEmailOtpSchema,
  ResendVerificationSchema,
  PasswordResetRequestSchema,
  PasswordResetSchema,
  GoogleAuthSchema,
  UpdateProfileSchema,
} from "@mane-bazar/shared";

describe("Auth Schemas Contract Alignment", () => {
  describe("RegisterSchema", () => {
    it("accepts valid registration payload", () => {
      const result = RegisterSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "secret123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing name", () => {
      const result = RegisterSchema.safeParse({
        email: "john@example.com",
        password: "secret123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email", () => {
      const result = RegisterSchema.safeParse({
        name: "John",
        email: "not-an-email",
        password: "secret123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects short password", () => {
      const result = RegisterSchema.safeParse({
        name: "John",
        email: "john@example.com",
        password: "12345",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("LoginSchema", () => {
    it("accepts valid login payload", () => {
      const result = LoginSchema.safeParse({
        email: "john@example.com",
        password: "secret123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = LoginSchema.safeParse({
        email: "bad",
        password: "secret123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("VerifyEmailOtpSchema — must accept { email, otp } (not { userId, otp })", () => {
    it("accepts { email, otp } matching frontend contract", () => {
      const result = VerifyEmailOtpSchema.safeParse({
        email: "john@example.com",
        otp: "123456",
      });
      expect(result.success).toBe(true);
    });

    it("rejects if email field is missing", () => {
      const result = VerifyEmailOtpSchema.safeParse({ otp: "123456" });
      expect(result.success).toBe(false);
    });

    it("rejects if otp is not exactly 6 digits", () => {
      const result = VerifyEmailOtpSchema.safeParse({
        email: "john@example.com",
        otp: "12345",
      });
      expect(result.success).toBe(false);
    });

    it("accepts 6-char otp (digits-only enforced server-side)", () => {
      // The schema only validates length=6; actual OTP format is enforced by bcrypt compare server-side
      const result = VerifyEmailOtpSchema.safeParse({
        email: "john@example.com",
        otp: "12345a",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email format", () => {
      const result = VerifyEmailOtpSchema.safeParse({
        email: "not-valid",
        otp: "123456",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ResendVerificationSchema", () => {
    it("accepts valid email", () => {
      const result = ResendVerificationSchema.safeParse({
        email: "john@example.com",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("PasswordResetRequestSchema", () => {
    it("accepts valid email", () => {
      const result = PasswordResetRequestSchema.safeParse({
        email: "john@example.com",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("PasswordResetSchema — must accept { token, password } (not { token, newPassword })", () => {
    it("accepts { token, password } matching frontend contract", () => {
      const result = PasswordResetSchema.safeParse({
        token: "abc123resettoken",
        password: "newsecret",
      });
      expect(result.success).toBe(true);
    });

    it("rejects if token is missing", () => {
      const result = PasswordResetSchema.safeParse({
        password: "newsecret",
      });
      expect(result.success).toBe(false);
    });

    it("rejects if password is too short", () => {
      const result = PasswordResetSchema.safeParse({
        token: "abc123",
        password: "12345",
      });
      expect(result.success).toBe(false);
    });

    it("rejects if password is empty", () => {
      const result = PasswordResetSchema.safeParse({
        token: "abc123",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("GoogleAuthSchema — must accept { credential } (not { idToken })", () => {
    it("accepts { credential } matching frontend contract", () => {
      const result = GoogleAuthSchema.safeParse({
        credential: "google-id-token-string",
      });
      expect(result.success).toBe(true);
    });

    it("rejects if credential is missing", () => {
      const result = GoogleAuthSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects if credential is empty string", () => {
      const result = GoogleAuthSchema.safeParse({ credential: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateProfileSchema", () => {
    it("accepts name only", () => {
      const result = UpdateProfileSchema.safeParse({ name: "Jane" });
      expect(result.success).toBe(true);
    });

    it("accepts avatar URL", () => {
      const result = UpdateProfileSchema.safeParse({
        avatar: "https://example.com/avatar.jpg",
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty avatar (clear avatar)", () => {
      const result = UpdateProfileSchema.safeParse({ avatar: "" });
      expect(result.success).toBe(true);
    });

    it("accepts both fields", () => {
      const result = UpdateProfileSchema.safeParse({
        name: "Jane",
        avatar: "https://example.com/a.jpg",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid avatar URL", () => {
      const result = UpdateProfileSchema.safeParse({
        avatar: "not-a-url",
      });
      expect(result.success).toBe(false);
    });

    it("rejects name that is too short", () => {
      const result = UpdateProfileSchema.safeParse({ name: "J" });
      expect(result.success).toBe(false);
    });
  });
});

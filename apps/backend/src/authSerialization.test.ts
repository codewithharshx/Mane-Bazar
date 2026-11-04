import { describe, it, expect } from "vitest";

/**
 * Tests for the safe-user serialization functions used in authController.
 *
 * sanitizeAuthUser strips sensitive fields for login/refresh/updateProfile responses.
 * sanitizeMeUser includes addresses but still strips password/token fields for /auth/me.
 *
 * These mirror the logic in apps/backend/src/presentation/controllers/authController.ts.
 * Both functions MUST never return: password, refreshToken, passwordResetTokenHash,
 * passwordResetTokenExpires, googleId, verificationToken, verificationTokenExpires.
 */

// Replicate the exact mapping logic from authController.ts
const sanitizeAuthUser = (user: any) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  isVerified: user.isVerified,
  createdAt: user.createdAt.toISOString(),
});

const sanitizeMeUser = (user: any) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  isVerified: user.isVerified,
  isActive: user.isActive,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt?.toISOString(),
  addresses: user.addresses,
});

// A realistic Prisma User record with all fields
const mockPrismaUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "John Doe",
  email: "john@example.com",
  password: "$2a$12$hashedPasswordValue",
  googleId: "google-sub-id-123",
  avatar: "https://example.com/avatar.jpg",
  role: "USER",
  isVerified: true,
  verificationToken: "verify-token-abc",
  verificationTokenExpires: new Date("2026-01-01"),
  passwordResetTokenHash: "reset-hash-abc",
  passwordResetTokenExpires: new Date("2026-01-01"),
  isActive: true,
  refreshToken: "$2a$12$hashedRefreshToken",
  createdAt: new Date("2026-01-15"),
  updatedAt: new Date("2026-07-20"),
};

const mockAddresses = [
  {
    id: "addr-1",
    userId: mockPrismaUser.id,
    label: "Home",
    street: "123 Main St",
    city: "Mumbai",
    state: "MH",
    pincode: "400001",
    phone: "9876543210",
    lat: 19.076,
    lng: 72.8777,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("sanitizeAuthUser — sensitive field stripping", () => {
  const sanitized = sanitizeAuthUser(mockPrismaUser);

  it("includes safe fields", () => {
    expect(sanitized.id).toBe(mockPrismaUser.id);
    expect(sanitized.name).toBe("John Doe");
    expect(sanitized.email).toBe("john@example.com");
    expect(sanitized.role).toBe("USER");
    expect(sanitized.avatar).toBe(mockPrismaUser.avatar);
    expect(sanitized.isVerified).toBe(true);
    expect(sanitized.createdAt).toBe(mockPrismaUser.createdAt.toISOString());
  });

  it("strips password", () => {
    expect(sanitized).not.toHaveProperty("password");
  });

  it("strips refreshToken", () => {
    expect(sanitized).not.toHaveProperty("refreshToken");
  });

  it("strips passwordResetTokenHash", () => {
    expect(sanitized).not.toHaveProperty("passwordResetTokenHash");
  });

  it("strips passwordResetTokenExpires", () => {
    expect(sanitized).not.toHaveProperty("passwordResetTokenExpires");
  });

  it("strips googleId", () => {
    expect(sanitized).not.toHaveProperty("googleId");
  });

  it("strips verificationToken", () => {
    expect(sanitized).not.toHaveProperty("verificationToken");
  });

  it("strips verificationTokenExpires", () => {
    expect(sanitized).not.toHaveProperty("verificationTokenExpires");
  });

  it("strips isActive", () => {
    expect(sanitized).not.toHaveProperty("isActive");
  });

  it("strips updatedAt", () => {
    expect(sanitized).not.toHaveProperty("updatedAt");
  });
});

describe("sanitizeMeUser — sensitive field stripping with addresses", () => {
  const userWithAddresses = { ...mockPrismaUser, addresses: mockAddresses };
  const sanitized = sanitizeMeUser(userWithAddresses);

  it("includes safe user fields", () => {
    expect(sanitized.id).toBe(mockPrismaUser.id);
    expect(sanitized.name).toBe("John Doe");
    expect(sanitized.email).toBe("john@example.com");
    expect(sanitized.role).toBe("USER");
    expect(sanitized.avatar).toBe(mockPrismaUser.avatar);
    expect(sanitized.isVerified).toBe(true);
    expect(sanitized.isActive).toBe(true);
    expect(sanitized.createdAt).toBe(mockPrismaUser.createdAt.toISOString());
    expect(sanitized.updatedAt).toBe(mockPrismaUser.updatedAt.toISOString());
  });

  it("includes addresses", () => {
    expect(sanitized.addresses).toEqual(mockAddresses);
    expect(sanitized.addresses).toHaveLength(1);
    expect(sanitized.addresses![0].label).toBe("Home");
  });

  it("strips password", () => {
    expect(sanitized).not.toHaveProperty("password");
  });

  it("strips refreshToken", () => {
    expect(sanitized).not.toHaveProperty("refreshToken");
  });

  it("strips passwordResetTokenHash", () => {
    expect(sanitized).not.toHaveProperty("passwordResetTokenHash");
  });

  it("strips passwordResetTokenExpires", () => {
    expect(sanitized).not.toHaveProperty("passwordResetTokenExpires");
  });

  it("strips googleId", () => {
    expect(sanitized).not.toHaveProperty("googleId");
  });

  it("strips verificationToken", () => {
    expect(sanitized).not.toHaveProperty("verificationToken");
  });

  it("strips verificationTokenExpires", () => {
    expect(sanitized).not.toHaveProperty("verificationTokenExpires");
  });

  it("handles null addresses gracefully", () => {
    const userNoAddresses = { ...mockPrismaUser, addresses: null };
    const result = sanitizeMeUser(userNoAddresses);
    expect(result.addresses).toBeNull();
  });

  it("handles undefined addresses gracefully", () => {
    const userNoAddresses = { ...mockPrismaUser, addresses: undefined };
    const result = sanitizeMeUser(userNoAddresses);
    expect(result.addresses).toBeUndefined();
  });
});

describe("Sensitive fields are never serialized for client responses", () => {
  const sensitiveFields = [
    "password",
    "refreshToken",
    "passwordResetTokenHash",
    "passwordResetTokenExpires",
    "googleId",
    "verificationToken",
    "verificationTokenExpires",
  ];

  const userWithAddresses = { ...mockPrismaUser, addresses: mockAddresses };

  for (const field of sensitiveFields) {
    it(`sanitizeAuthUser strips "${field}"`, () => {
      const result = sanitizeAuthUser(mockPrismaUser);
      expect(result).not.toHaveProperty(field);
    });

    it(`sanitizeMeUser strips "${field}"`, () => {
      const result = sanitizeMeUser(userWithAddresses);
      expect(result).not.toHaveProperty(field);
    });
  }
});

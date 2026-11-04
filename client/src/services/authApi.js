import api from "./apiClient";

/**
 * Authentication API endpoints
 * Handles all auth-related API calls
 */
export const authApi = {
  // User Registration & Account
  register: (payload) => api.post("/auth/register", payload),
  
  // Email & Password Authentication
  login: (payload) => api.post("/auth/login", payload),
  
  // Google OAuth
  googleAuth: (credential) => api.post("/auth/google", { credential }),
  
  // Email Verification (OTP)
  verifyEmail: (payload) => api.post("/auth/verify-email", payload),
  resendVerification: (email) => api.post("/auth/resend-verification", { email }),
  
  // Password Management
  requestPasswordReset: (email) => api.post("/auth/request-password-reset", { email }),
  resetPassword: (token, password) => api.post("/auth/reset-password", { token, password }),
  
  // Token Management
  csrfToken: () => api.get("/auth/csrf-token"),
  refreshToken: () => api.post("/auth/refresh-token"),
  logout: () => api.post("/auth/logout"),
  
  // User Profile
  me: () => api.get("/auth/me"),
  updateProfile: (payload) => api.put("/auth/profile", payload),
  
  // Address Management
  addAddress: (payload) => api.post("/auth/addresses", payload),
  updateAddress: (addressId, payload) => api.put(`/auth/addresses/${addressId}`, payload),
  deleteAddress: (addressId) => api.delete(`/auth/addresses/${addressId}`)
};

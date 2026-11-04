import api from "./apiClient";

export const authApi = {
  register: (payload: Record<string, unknown>) => api.post("/auth/register", payload),
  login: (payload: Record<string, unknown>) => api.post("/auth/login", payload),
  googleAuth: (credential: string) => api.post("/auth/google", { credential }),
  verifyEmail: (payload: Record<string, unknown>) => api.post("/auth/verify-email", payload),
  resendVerification: (email: string) => api.post("/auth/resend-verification", { email }),
  requestPasswordReset: (email: string) => api.post("/auth/request-password-reset", { email }),
  resetPassword: (token: string, password: string) =>
    api.post("/auth/reset-password", { token, password }),
  csrfToken: () => api.get("/auth/csrf"),
  refreshToken: () => api.post("/auth/refresh-token"),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  updateProfile: (payload: Record<string, unknown>) => api.put("/auth/profile", payload),
  addAddress: (payload: Record<string, unknown>) => api.post("/auth/addresses", payload),
  updateAddress: (addressId: string, payload: Record<string, unknown>) =>
    api.put(`/auth/addresses/${addressId}`, payload),
  deleteAddress: (addressId: string) => api.delete(`/auth/addresses/${addressId}`),
};

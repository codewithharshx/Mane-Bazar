import api from "./apiClient";

export const productApi = {
  list: (params?: Record<string, unknown>) => api.get("/products", { params }),
  getBySlug: (slug: string) => api.get(`/products/${slug}`),
  getByCategory: (slug: string) => api.get(`/products/category/${slug}`),
  create: (payload: Record<string, unknown>) => api.post("/products", payload),
  update: (id: string, payload: Record<string, unknown>) => api.put(`/products/${id}`, payload),
  remove: (id: string) => api.delete(`/products/${id}`),
  createReview: (id: string, payload: Record<string, unknown>) =>
    api.post(`/products/${id}/reviews`, payload),
};

export const categoryApi = {
  list: () => api.get("/categories"),
  create: (payload: Record<string, unknown>) => api.post("/categories", payload),
  update: (id: string, payload: Record<string, unknown>) => api.put(`/categories/${id}`, payload),
};

export const storeApi = {
  list: (params?: Record<string, unknown>) => api.get("/stores", { params }),
  nearby: (params?: Record<string, unknown>) => api.get("/stores/nearby", { params }),
  getById: (storeId: string) => api.get(`/stores/${storeId}`),
  products: (storeId: string, params?: Record<string, unknown>) =>
    api.get(`/stores/${storeId}/products`, { params }),
  createReview: (storeId: string, payload: Record<string, unknown>) =>
    api.post(`/stores/${storeId}/reviews`, payload),
  create: (payload: Record<string, unknown>) => api.post("/stores", payload),
  update: (storeId: string, payload: Record<string, unknown>) =>
    api.put(`/stores/${storeId}`, payload),
  remove: (storeId: string) => api.delete(`/stores/${storeId}`),
};

export const orderApi = {
  createCod: (payload: Record<string, unknown>, config = {}) =>
    api.post("/orders/cod", payload, config),
  listMine: (params: Record<string, unknown> = {}) =>
    api.get("/orders/my-orders", { params }),
  getByOrderId: (orderId: string) => api.get(`/orders/${orderId}`),
  cancel: (orderId: string, payload = {}) => api.put(`/orders/${orderId}/cancel`, payload),
  invoice: (orderId: string) =>
    api.get(`/orders/${orderId}/invoice`, { responseType: "blob" }),
  updateStatus: (orderId: string, payload: Record<string, unknown>) =>
    api.put(`/orders/${orderId}/status`, payload),
};

export const paymentApi = {
  createOrder: (payload: Record<string, unknown>, config = {}) =>
    api.post("/payment/create-order", payload, config),
  verify: (payload: Record<string, unknown>, config = {}) =>
    api.post("/payment/verify", payload, config),
  paymentFailed: (payload: Record<string, unknown>, config = {}) =>
    api.post("/payment/payment-failed", payload, config),
};

export const couponApi = {
  apply: (payload: Record<string, unknown>) => api.post("/coupons/apply", payload),
  list: () => api.get("/coupons"),
  create: (payload: Record<string, unknown>) => api.post("/coupons", payload),
  update: (id: string, payload: Record<string, unknown>) => api.put(`/coupons/${id}`, payload),
  remove: (id: string) => api.delete(`/coupons/${id}`),
};

export const adminApi = {
  dashboard: () => api.get("/admin/dashboard"),
  orders: (params?: Record<string, unknown>) => api.get("/admin/orders", { params }),
  users: (params?: Record<string, unknown>) => api.get("/admin/users", { params }),
  auditLogs: (params?: Record<string, unknown>) => api.get("/admin/audit-logs", { params }),
  updateUserRole: (userId: string, role: string) =>
    api.patch(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),
  inventory: () => api.get("/admin/inventory"),
  restock: (productId: string, quantity: number) =>
    api.patch(`/admin/inventory/${productId}/restock`, { quantity }),
};

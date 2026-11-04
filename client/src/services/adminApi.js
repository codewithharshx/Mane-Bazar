import api from "./apiClient";

export const adminApi = {
  dashboard: () => api.get("/admin/dashboard"),
  orders: (params) => api.get("/admin/orders", { params }),
  users: (params) => api.get("/admin/users", { params }),
  auditLogs: (params) => api.get("/admin/audit-logs", { params }),
  updateUserRole: (userId, role) => api.patch(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  inventory: () => api.get("/admin/inventory"),
  restock: (productId, quantity) => api.patch(`/admin/inventory/${productId}/restock`, { quantity })
};

import api from "./apiClient";

export const orderApi = {
  createCod: (payload, config = {}) => api.post("/orders/cod", payload, config),
  /** @param {{ page?: number, limit?: number }} params */
  listMine: (params = {}) => api.get("/orders/my-orders", { params }),
  getByOrderId: (orderId) => api.get(`/orders/${orderId}`),
  cancel: (orderId, payload = {}) => api.put(`/orders/${orderId}/cancel`, payload),
  invoice: (orderId) => api.get(`/orders/${orderId}/invoice`, { responseType: "blob" }),
  updateStatus: (orderId, payload) => api.put(`/orders/${orderId}/status`, payload)
};


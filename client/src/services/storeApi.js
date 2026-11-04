import api from "./apiClient";

export const storeApi = {
  list: (params) => api.get("/stores", { params }),
  nearby: (params) => api.get("/stores/nearby", { params }),
  getById: (storeId) => api.get(`/stores/${storeId}`),
  products: (storeId, params) => api.get(`/stores/${storeId}/products`, { params }),
  createReview: (storeId, payload) => api.post(`/stores/${storeId}/reviews`, payload),
  create: (payload) => api.post("/stores", payload),
  update: (storeId, payload) => api.put(`/stores/${storeId}`, payload),
  remove: (storeId) => api.delete(`/stores/${storeId}`)
};

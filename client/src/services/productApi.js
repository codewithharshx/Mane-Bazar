import api from "./apiClient";

export const productApi = {
  list: (params) => api.get("/products", { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  getByCategory: (slug) => api.get(`/products/category/${slug}`),
  create: (payload) => api.post("/products", payload),
  update: (id, payload) => api.put(`/products/${id}`, payload),
  remove: (id) => api.delete(`/products/${id}`),
  createReview: (id, payload) => api.post(`/products/${id}/reviews`, payload)
};

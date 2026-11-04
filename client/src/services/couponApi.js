import api from "./apiClient";

export const couponApi = {
  apply: (payload) => api.post("/coupons/apply", payload),
  list: () => api.get("/coupons"),
  create: (payload) => api.post("/coupons", payload),
  update: (id, payload) => api.put(`/coupons/${id}`, payload),
  remove: (id) => api.delete(`/coupons/${id}`)
};

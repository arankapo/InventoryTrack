import api from "./api";

export const warehouseService = {
  list: () => api.get("/warehouses").then((r) => r.data.data),
  get: (id) => api.get(`/warehouses/${id}`).then((r) => r.data.data),
  create: (payload) => api.post("/warehouses", payload).then((r) => r.data.data),
  update: (id, payload) => api.patch(`/warehouses/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/warehouses/${id}`).then((r) => r.data),
};

export const categoryService = {
  list: () => api.get("/categories").then((r) => r.data.data),
  create: (payload) => api.post("/categories", payload).then((r) => r.data.data),
  update: (id, payload) => api.patch(`/categories/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/categories/${id}`).then((r) => r.data),
};

export const productService = {
  list: (params) => api.get("/products", { params }).then((r) => r.data.data),
  get: (id) => api.get(`/products/${id}`).then((r) => r.data.data),
  create: (payload) => api.post("/products", payload).then((r) => r.data.data),
  update: (id, payload) => api.patch(`/products/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/products/${id}`).then((r) => r.data),
};

export const stockService = {
  levels: (params) => api.get("/stock", { params }).then((r) => r.data.data),
  movements: (params) => api.get("/stock/movements", { params }).then((r) => r.data.data),
  recordMovement: (payload) => api.post("/stock/movements", payload).then((r) => r.data.data),
};

export const dashboardService = {
  summary: () => api.get("/dashboard/summary").then((r) => r.data.data),
};

export const userService = {
  list: () => api.get("/users").then((r) => r.data.data),
  update: (id, payload) => api.patch(`/users/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/users/${id}`).then((r) => r.data),
  create: (payload) => api.post("/auth/register", payload).then((r) => r.data.data),
};

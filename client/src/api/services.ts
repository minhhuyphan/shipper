/**
 * API Service Collection
 * Chức năng: Tập hợp tất cả các hàm gọi API của hệ thống, phân loại theo module (Auth, Stats, Orders, Drivers, v.v.).
 * Các thành phần chính: authApi, statsApi, ordersApi, pricingApi, driversApi, codApi.
 */
import api from "./axios";

// Auth
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.post("/auth/change-password", data),
};

// Stats
export const statsApi = {
  revenue: (params?: any) => api.get("/admin/stats/revenue", { params }),
  ordersSummary: (params?: any) =>
    api.get("/admin/stats/orders-summary", { params }),
  driversOnline: () => api.get("/admin/stats/drivers/online"),
};

// Orders
export const ordersApi = {
  list: (params?: any) => api.get("/admin/orders", { params }),
  getById: (id: string) => api.get(`/admin/orders/${id}`),
  getByOrderCode: (orderCode: string) =>
    api.get(`/admin/orders/code/${orderCode}`),
  update: (id: string, data: any) => api.patch(`/admin/orders/${id}`, data),
  updateComplaint: (id: string, data: any) =>
    api.patch(`/admin/orders/${id}/complaint`, data),
  getAudit: (id: string) => api.get(`/admin/orders/${id}/audit`),
};

// Mobile Orders API (Public - no auth required)
export const mobileOrdersApi = {
  trackByOrderCode: (orderCode: string) =>
    api.get(`/orders/track/${orderCode}`),
  getByCustomerPhone: (phone: string) =>
    api.get(`/orders/customer/${phone}`),
  create: (data: any) => api.post("/orders", data),
};

// Pricing
export const pricingApi = {
  list: () => api.get("/admin/pricing"),
  getActive: () => api.get("/admin/pricing/active"),
  create: (data: any) => api.post("/admin/pricing", data),
  update: (id: string, data: any) => api.patch(`/admin/pricing/${id}`, data),
  activate: (id: string) => api.post(`/admin/pricing/${id}/activate`),
  simulate: (data: any) => api.post("/admin/pricing/simulate", data),
};

// Drivers
export const driversApi = {
  list: (params?: any) => api.get("/admin/drivers", { params }),
  getById: (id: string) => api.get(`/admin/drivers/${id}`),
  approve: (id: string, action: string) =>
    api.patch(`/admin/drivers/${id}/approve`, { action }),
  toggleLock: (id: string) => api.patch(`/admin/drivers/${id}/lock`),
};

// COD
export const codApi = {
  summary: () => api.get("/admin/drivers/cod/summary"),
  settle: (data: any) => api.post("/admin/drivers/cod/settle", data),
  settlements: (params?: any) =>
    api.get("/admin/drivers/cod/settlements", { params }),
  exportCsv: () =>
    api.get("/admin/drivers/cod/export.csv", { responseType: "blob" }),
};

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});
api.interceptors.response.use(r => r, e => Promise.reject(e));

export const authApi = {
  register:   (d) => api.post("/auth/register", d),
  verifyOtp:  (d) => api.post("/auth/verify-otp", d),
  resendOtp:  (d) => api.post("/auth/resend-otp", d),
  login:      (d) => api.post("/auth/login", d),
  profile:    ()  => api.get("/auth/profile"),
  logout:     ()  => api.post("/auth/logout"),
};

export const userApi = {
  getProfile:       ()  => api.get("/users/profile"),
  updateProfile:    (d) => api.put("/users/profile", d),
  changePassword:   (d) => api.put("/users/change-password", d),
  updateSalaryCycle:(d) => api.put("/users/salary-cycle", d),
  updateTheme:      (d) => api.put("/users/theme", d),
};

export const walletApi = {
  getAll:          ()      => api.get("/wallets"),
  create:          (d)     => api.post("/wallets", d),
  remove:          (id)    => api.delete(`/wallets/${id}`),
  adjustBalance:   (id, d) => api.put(`/wallets/${id}/adjust`, d),
  getTransactions: (id, p) => api.get(`/wallets/${id}/transactions`, { params: p }),
};

export const categoryApi = {
  getAll:  (type) => api.get("/categories", { params: { type } }),
  create:  (d)    => api.post("/categories", d),
  update:  (id,d) => api.put(`/categories/${id}`, d),
  remove:  (id)   => api.delete(`/categories/${id}`),
};

export const transactionApi = {
  getSummary: (p)    => api.get("/transactions/summary", { params: p }),
  getChart:   (p)    => api.get("/transactions/chart",   { params: p }),
  getReport:  (p)    => api.get("/transactions/report",  { params: p }),
  getExport:  (p)    => api.get("/transactions/export",  { params: p }),
  getAll:     (p)    => api.get("/transactions",         { params: p }),
  create:     (d)    => api.post("/transactions", d),
  update:     (id,d) => api.put(`/transactions/${id}`, d),
  remove:     (id)   => api.delete(`/transactions/${id}`),
};

export const securityApi = {
  getStatus: ()  => api.get("/security/status"),
  createPin: (d) => api.post("/security/create-pin", d),
  verifyPin: (d) => api.post("/security/verify-pin", d),
  changePin: (d) => api.put("/security/change-pin",  d),
  removePin: (d) => api.put("/security/remove-pin",  d),
};

export const budgetApi = {
  getAll: (p)  => api.get("/budgets", { params: p }),
  upsert: (d)  => api.post("/budgets", d),
  remove: (id) => api.delete(`/budgets/${id}`),
};

export const reminderApi = {
  getAll:   (p)    => api.get("/reminders", { params: p }),
  create:   (d)    => api.post("/reminders", d),
  update:   (id,d) => api.put(`/reminders/${id}`, d),
  markPaid: (id,d) => api.put(`/reminders/${id}/paid`, d),
  remove:   (id)   => api.delete(`/reminders/${id}`),
};

export const recurringApi = {
  getAll:       ()      => api.get("/recurring"),
  create:       (d)     => api.post("/recurring", d),
  update:       (id,d)  => api.put(`/recurring/${id}`, d),
  toggleActive: (id,d)  => api.put(`/recurring/${id}/toggle`, d),
  remove:       (id)    => api.delete(`/recurring/${id}`),
  runDue:       ()      => api.post("/recurring/run-due"),
};

export default api;

export const savingsApi = {
  getAll:   ()      => api.get("/savings"),
  create:   (d)     => api.post("/savings", d),
  addFunds: (id, d) => api.put(`/savings/${id}/add-funds`, d),
  remove:   (id)    => api.delete(`/savings/${id}`),
};

export const splitBillApi = {
  getAll:      ()    => api.get("/split-bills"),
  create:      (d)   => api.post("/split-bills", d),
  togglePaid:  (mid) => api.put(`/split-bills/members/${mid}/paid`),
  remove:      (id)  => api.delete(`/split-bills/${id}`),
};

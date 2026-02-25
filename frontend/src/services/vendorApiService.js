import { apiFetch } from '../utils/api';

const vendorApiService = {
  // Authentication
  async login(email, password) {
    return await apiFetch('/api/vendor/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(vendorData) {
    return await apiFetch('/api/vendor/register', {
      method: 'POST',
      body: JSON.stringify(vendorData),
    });
  },

  // Normalize API responses so vendor pages always receive { success, data, ... }
  _normalize(response) {
    // response is { ok, status, data }
    const payload = response?.data || {};
    const innerData = payload.data !== undefined ? payload.data : payload;
    const success = Boolean(response?.ok) && (payload.success !== false);
    return { ...response, success, data: innerData };
  },

  // Dashboard
  async getDashboard() {
    const res = await apiFetch('/api/vendor/dashboard', {
      suppressError: true, // Suppress auto-logout on dashboard errors
      suppressLogout: true // Prevent automatic logout
    });
    return this._normalize(res);
  },

  // Alerts / Notifications summary for dashboard top cards
  async getAlerts() {
    // Even if backend doesn't have this yet, suppress errors so UI doesn't break
    return await apiFetch('/api/vendor/alerts', {
      suppressError: true,
      suppressLogout: true
    });
  },

  // Profile
  async getProfile() {
    const res = await apiFetch('/api/vendor/profile', {
      suppressError: true, // Suppress 404 errors
      suppressLogout: true // Prevent automatic logout
    });
    return this._normalize(res);
  },

  async updateProfile(updates) {
    const res = await apiFetch('/api/vendor/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return this._normalize(res);
  },

  // Purchase Orders
  async getPurchaseOrders(params = {}) {
    // Filter out undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = queryString ? `/api/vendor/purchase-orders?${queryString}` : '/api/vendor/purchase-orders';
    const res = await apiFetch(url, {
      suppressError: true, // Suppress 404 errors
      suppressLogout: true // Prevent automatic logout
    });
    return this._normalize(res);
  },

  async getPurchaseOrder(poId) {
    const res = await apiFetch(`/api/vendor/purchase-orders/${poId}`);
    return this._normalize(res);
  },

  async acceptPurchaseOrder(poId, data = {}) {
    const res = await apiFetch(`/api/vendor/purchase-orders/${poId}/accept`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return this._normalize(res);
  },

  async rejectPurchaseOrder(poId, reason) {
    const res = await apiFetch(`/api/vendor/purchase-orders/${poId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return this._normalize(res);
  },

  async updateDeliveryStatus(poId, data) {
    const res = await apiFetch(`/api/vendor/purchase-orders/${poId}/update-delivery`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return this._normalize(res);
  },

  async dispatchPurchaseOrder(poId, data) {
    const res = await apiFetch(`/api/vendor/purchase-orders/${poId}/dispatch`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return this._normalize(res);
  },

  async submitInvoice(data) {
    const res = await apiFetch('/api/vendor/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return this._normalize(res);
  },

  async getLedger(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = queryString ? `/api/vendor/ledger?${queryString}` : '/api/vendor/ledger';
    const res = await apiFetch(url, {
      suppressError: true,
      suppressLogout: true
    });
    return this._normalize(res);
  },

  // Invoices
  async getInvoices(params = {}) {
    // Filter out undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = queryString ? `/api/vendor/invoices?${queryString}` : '/api/vendor/invoices';
    const res = await apiFetch(url, {
      suppressError: true, // Suppress 404 errors
      suppressLogout: true // Prevent automatic logout
    });
    return this._normalize(res);
  },

  async getInvoice(invoiceId) {
    const res = await apiFetch(`/api/vendor/invoices/${invoiceId}`);
    return this._normalize(res);
  },

  async downloadInvoice(invoiceId) {
    const res = await apiFetch(`/api/vendor/invoices/${invoiceId}/download`);
    return this._normalize(res);
  },

  // Payments
  async getPayments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/vendor/payments?${queryString}` : '/api/vendor/payments';
    const res = await apiFetch(url, {
      suppressError: true, // Suppress 404 errors
      suppressLogout: true // Prevent automatic logout
    });
    return this._normalize(res);
  },

  // Performance
  async getPerformance() {
    const res = await apiFetch('/api/vendor/performance', {
      suppressError: true,
      suppressLogout: true // Prevent automatic logout
    });
    return this._normalize(res);
  },

  // Trust Score
  async getTrustScore() {
    const res = await apiFetch('/api/vendor/trust-score', {
      suppressError: true, // Suppress 404 errors
      suppressLogout: true // Prevent automatic logout
    });
    return this._normalize(res);
  },

  // Notifications
  async getNotifications() {
    const res = await apiFetch('/api/vendor/notifications', {
      suppressError: true, // Suppress 404 errors
      suppressLogout: true // Prevent automatic logout
    });
    return this._normalize(res);
  },

  // Audit Log
  async getAuditLog(params = {}) {
    // Filter out undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = queryString ? `/api/vendor/audit-log?${queryString}` : '/api/vendor/audit-log';
    const res = await apiFetch(url, {
      suppressError: true, // Suppress 404 errors
      suppressLogout: true // Prevent automatic logout
    });
    return this._normalize(res);
  },

  // Spare Parts
  async getSpareParts(params = {}) {
    // Filter out undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = queryString ? `/api/vendor/spare-parts?${queryString}` : '/api/vendor/spare-parts';
    const res = await apiFetch(url);
    return this._normalize(res);
  },
};

export default vendorApiService;


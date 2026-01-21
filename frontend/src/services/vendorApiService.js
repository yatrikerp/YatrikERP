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

  // Dashboard
  async getDashboard() {
    return await apiFetch('/api/vendor/dashboard', {
      suppressError: true, // Suppress auto-logout on dashboard errors
      suppressLogout: true // Prevent automatic logout
    });
  },

  // Profile
  async getProfile() {
    return await apiFetch('/api/vendor/profile', {
      suppressError: true // Suppress 404 errors
    });
  },

  async updateProfile(updates) {
    return await apiFetch('/api/vendor/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Purchase Orders
  async getPurchaseOrders(params = {}) {
    // Filter out undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = queryString ? `/api/vendor/purchase-orders?${queryString}` : '/api/vendor/purchase-orders';
    return await apiFetch(url, {
      suppressError: true // Suppress 404 errors
    });
  },

  async getPurchaseOrder(poId) {
    return await apiFetch(`/api/vendor/purchase-orders/${poId}`);
  },

  async acceptPurchaseOrder(poId, data = {}) {
    return await apiFetch(`/api/vendor/purchase-orders/${poId}/accept`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async rejectPurchaseOrder(poId, reason) {
    return await apiFetch(`/api/vendor/purchase-orders/${poId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async updateDeliveryStatus(poId, data) {
    return await apiFetch(`/api/vendor/purchase-orders/${poId}/update-delivery`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Invoices
  async getInvoices(params = {}) {
    // Filter out undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = queryString ? `/api/vendor/invoices?${queryString}` : '/api/vendor/invoices';
    return await apiFetch(url, {
      suppressError: true // Suppress 404 errors
    });
  },

  async getInvoice(invoiceId) {
    return await apiFetch(`/api/vendor/invoices/${invoiceId}`);
  },

  async downloadInvoice(invoiceId) {
    return await apiFetch(`/api/vendor/invoices/${invoiceId}/download`);
  },

  // Payments
  async getPayments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/vendor/payments?${queryString}` : '/api/vendor/payments';
    return await apiFetch(url, {
      suppressError: true // Suppress 404 errors
    });
  },

  // Performance
  async getPerformance() {
    return await apiFetch('/api/vendor/performance');
  },

  // Trust Score
  async getTrustScore() {
    return await apiFetch('/api/vendor/trust-score', {
      suppressError: true // Suppress 404 errors
    });
  },

  // Notifications
  async getNotifications() {
    return await apiFetch('/api/vendor/notifications', {
      suppressError: true // Suppress 404 errors
    });
  },

  // Audit Log
  async getAuditLog(params = {}) {
    // Filter out undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = queryString ? `/api/vendor/audit-log?${queryString}` : '/api/vendor/audit-log';
    return await apiFetch(url, {
      suppressError: true // Suppress 404 errors
    });
  },

  // Spare Parts
  async getSpareParts(params = {}) {
    // Filter out undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = queryString ? `/api/vendor/spare-parts?${queryString}` : '/api/vendor/spare-parts';
    return await apiFetch(url);
  },
};

export default vendorApiService;


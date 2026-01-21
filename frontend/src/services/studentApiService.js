import { apiFetch } from '../utils/api';

const studentApiService = {
  // Authentication
  async login(identifier, password, type = 'email') {
    const body = { password };
    if (type === 'aadhaar') {
      body.aadhaarNumber = identifier;
    } else if (type === 'phone') {
      body.phone = identifier;
    } else {
      body.email = identifier;
    }
    
    return await apiFetch('/api/student/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async register(studentData) {
    return await apiFetch('/api/student/register', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },

  // Dashboard
  async getDashboard() {
    return await apiFetch('/api/student/dashboard');
  },

  // Profile
  async getProfile() {
    return await apiFetch('/api/student/profile');
  },

  // Usage History
  async getUsageHistory(limit = 50, page = 1) {
    return await apiFetch(`/api/student/usage-history?limit=${limit}&page=${page}`);
  },

  // Pass Renewal
  async renewPass() {
    return await apiFetch('/api/student/renew', {
      method: 'POST',
    });
  },

  // Concession
  async getConcessionStatus() {
    return await apiFetch('/api/student/concession/status');
  },

  async applyForConcession(formData) {
    return await apiFetch('/api/student/concession/apply', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type for FormData - browser sets it automatically with boundary
    });
  },

  // Digital Pass
  async getPass() {
    return await apiFetch('/api/student/pass');
  },

  // Trip Booking
  async getRoutes() {
    return await apiFetch('/api/student/routes');
  },

  async getAvailableRoutes() {
    return await apiFetch('/api/student/routes');
  },

  async bookTrip(bookingData) {
    return await apiFetch('/api/student/book', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  // Payments
  async getPayments() {
    return await apiFetch('/api/student/payments');
  },

  async processPayment(paymentData) {
    return await apiFetch('/api/student/payment/process', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  // Notifications
  async getNotifications() {
    return await apiFetch('/api/student/notifications');
  },

  async markNotificationRead(notificationId) {
    return await apiFetch(`/api/student/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  },

  // Support
  async getSupportTickets() {
    return await apiFetch('/api/student/support/tickets');
  },

  async createSupportTicket(ticketData) {
    return await apiFetch('/api/student/support/create', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  },
};

export default studentApiService;


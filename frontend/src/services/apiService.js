import { apiFetch, batchRequests, preloadData, healthCheck } from '../utils/api';

/**
 * Modern API Service Layer with TypeScript-like JSDoc
 * Provides organized, type-safe API calls with better error handling
 */

// Base API configuration
const API_BASE = process.env.REACT_APP_API_URL || '';

// Request timeout configurations
const TIMEOUTS = {
  SHORT: 5000,    // 5 seconds for quick operations
  MEDIUM: 15000,  // 15 seconds for normal operations
  LONG: 30000     // 30 seconds for heavy operations
};

/**
 * Authentication Service
 */
export const authService = {
  /**
   * Login user
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} User data and token
   */
  async login(credentials) {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      timeout: TIMEOUTS.SHORT
    });
    
    if (response.ok) {
      // Store tokens
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }
    
    return response;
  },

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result
   */
  async register(userData) {
    return await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      timeout: TIMEOUTS.MEDIUM
    });
  },

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('depotToken');
      localStorage.removeItem('depotUser');
    }
  },

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  async getProfile() {
    return await apiFetch('/api/auth/profile');
  },

  /**
   * Refresh authentication token
   * @returns {Promise<Object>} New token data
   */
  async refreshToken() {
    const response = await apiFetch('/api/auth/refresh', {
      method: 'POST',
      timeout: TIMEOUTS.SHORT
    });
    
    if (response.ok && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response;
  }
};

/**
 * Trip Management Service
 */
export const tripService = {
  /**
   * Search for trips
   * @param {Object} searchParams - { from, to, departureDate, passengers }
   * @returns {Promise<Object>} Search results
   */
  async searchTrips(searchParams) {
    const params = new URLSearchParams(searchParams);
    return await apiFetch(`/api/booking/search-proxy?${params}`, {
      timeout: TIMEOUTS.MEDIUM
    });
  },

  /**
   * Get all available trips
   * @param {Object} filters - { date, status, limit, page }
   * @returns {Promise<Object>} Trips list
   */
  async getTrips(filters = {}) {
    const params = new URLSearchParams(filters);
    return await apiFetch(`/api/booking/list?${params}`, {
      timeout: TIMEOUTS.MEDIUM
    });
  },

  /**
   * Get trip details by ID
   * @param {string} tripId - Trip ID
   * @returns {Promise<Object>} Trip details
   */
  async getTripById(tripId) {
    return await apiFetch(`/api/trips/${tripId}`, {
      timeout: TIMEOUTS.SHORT
    });
  },

  /**
   * Get available seats for a trip
   * @param {string} tripId - Trip ID
   * @returns {Promise<Object>} Available seats
   */
  async getAvailableSeats(tripId) {
    return await apiFetch(`/api/seats?tripId=${tripId}`, {
      timeout: TIMEOUTS.SHORT
    });
  }
};

/**
 * Booking Service
 */
export const bookingService = {
  /**
   * Create a new booking
   * @param {Object} bookingData - Booking details
   * @returns {Promise<Object>} Created booking
   */
  async createBooking(bookingData) {
    return await apiFetch('/api/bookings/create', {
      method: 'POST',
      body: JSON.stringify(bookingData),
      timeout: TIMEOUTS.LONG
    });
  },

  /**
   * Get user bookings
   * @param {string} userId - User ID
   * @param {Object} filters - { status, limit, page }
   * @returns {Promise<Object>} User bookings
   */
  async getUserBookings(userId, filters = {}) {
    const params = new URLSearchParams(filters);
    return await apiFetch(`/api/booking-auth/user/${userId}?${params}`, {
      timeout: TIMEOUTS.MEDIUM
    });
  },

  /**
   * Get booking details
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} Booking details
   */
  async getBookingById(bookingId) {
    return await apiFetch(`/api/booking/${bookingId}`, {
      timeout: TIMEOUTS.SHORT
    });
  },

  /**
   * Confirm booking payment
   * @param {string} bookingId - Booking ID
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Confirmation result
   */
  async confirmBooking(bookingId, paymentData) {
    return await apiFetch(`/api/booking/${bookingId}/confirm`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
      timeout: TIMEOUTS.MEDIUM
    });
  },

  /**
   * Cancel booking
   * @param {string} bookingId - Booking ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelBooking(bookingId, reason) {
    return await apiFetch(`/api/booking/${bookingId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
      timeout: TIMEOUTS.MEDIUM
    });
  }
};

/**
 * Route Service
 */
export const routeService = {
  /**
   * Get all routes
   * @param {Object} filters - { status, limit, page }
   * @returns {Promise<Object>} Routes list
   */
  async getRoutes(filters = {}) {
    const params = new URLSearchParams(filters);
    return await apiFetch(`/api/routes?${params}`, {
      timeout: TIMEOUTS.MEDIUM
    });
  },

  /**
   * Get popular routes
   * @param {number} limit - Number of routes to return
   * @returns {Promise<Object>} Popular routes
   */
  async getPopularRoutes(limit = 10) {
    return await apiFetch(`/api/routes?status=active&limit=${limit}`, {
      timeout: TIMEOUTS.SHORT
    });
  },

  /**
   * Get route details
   * @param {string} routeId - Route ID
   * @returns {Promise<Object>} Route details
   */
  async getRouteById(routeId) {
    return await apiFetch(`/api/routes/${routeId}`, {
      timeout: TIMEOUTS.SHORT
    });
  }
};

/**
 * Payment Service
 */
export const paymentService = {
  /**
   * Initialize Razorpay payment
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Razorpay options
   */
  async initializePayment(paymentData) {
    return await apiFetch('/api/payment/initialize', {
      method: 'POST',
      body: JSON.stringify(paymentData),
      timeout: TIMEOUTS.MEDIUM
    });
  },

  /**
   * Verify payment
   * @param {Object} verificationData - Payment verification data
   * @returns {Promise<Object>} Verification result
   */
  async verifyPayment(verificationData) {
    return await apiFetch('/api/payment/verify', {
      method: 'POST',
      body: JSON.stringify(verificationData),
      timeout: TIMEOUTS.MEDIUM
    });
  }
};

/**
 * Dashboard Service
 */
export const dashboardService = {
  /**
   * Get dashboard statistics
   * @param {string} userType - 'admin', 'depot', 'passenger'
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboardData(userType) {
    const endpoint = userType === 'admin' ? '/api/admin/dashboard' : 
                    userType === 'depot' ? '/api/depot/dashboard' : 
                    '/api/passenger/dashboard';
    
    return await apiFetch(endpoint, {
      timeout: TIMEOUTS.MEDIUM
    });
  },

  /**
   * Get recent activities
   * @param {string} userType - User type
   * @param {number} limit - Number of activities
   * @returns {Promise<Object>} Recent activities
   */
  async getRecentActivities(userType, limit = 10) {
    const endpoint = userType === 'admin' ? '/api/admin/recent-activities' : 
                    userType === 'depot' ? '/api/depot/recent-activities' : 
                    '/api/passenger/recent-activities';
    
    return await apiFetch(`${endpoint}?limit=${limit}`, {
      timeout: TIMEOUTS.SHORT
    });
  }
};

/**
 * Utility Service
 */
export const utilityService = {
  /**
   * Health check
   * @returns {Promise<boolean>} Service health status
   */
  async healthCheck() {
    return await healthCheck();
  },

  /**
   * Preload critical data
   * @param {Array<string>} endpoints - List of endpoints to preload
   * @returns {Promise<Array>} Preload results
   */
  async preloadCriticalData(endpoints) {
    return await preloadData(endpoints);
  },

  /**
   * Batch multiple requests
   * @param {Array<Object>} requests - Array of { path, options }
   * @returns {Promise<Array>} Batch results
   */
  async batchRequests(requests) {
    return await batchRequests(requests);
  }
};

/**
 * Error handling utilities
 */
export const errorHandling = {
  /**
   * Check if error is retryable
   * @param {Object} error - Error object
   * @returns {boolean} Whether error can be retried
   */
  isRetryableError(error) {
    return error.status >= 500 || 
           error.status === 408 || 
           error.status === 429 ||
           error.message?.includes('Network');
  },

  /**
   * Get user-friendly error message
   * @param {Object} error - Error object
   * @returns {string} User-friendly message
   */
  getErrorMessage(error) {
    const messages = {
      400: 'Invalid request. Please check your input.',
      401: 'Please log in to continue.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      408: 'Request timed out. Please try again.',
      429: 'Too many requests. Please wait a moment.',
      500: 'Server error. Please try again later.',
      502: 'Service temporarily unavailable.',
      503: 'Service temporarily unavailable.',
      504: 'Request timed out. Please try again.'
    };

    return messages[error.status] || error.message || 'An unexpected error occurred.';
  }
};

// Export all services as default
export default {
  auth: authService,
  trips: tripService,
  bookings: bookingService,
  routes: routeService,
  payments: paymentService,
  dashboard: dashboardService,
  utility: utilityService,
  errorHandling
};

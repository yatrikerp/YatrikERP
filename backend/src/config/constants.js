// Application Constants
module.exports = {
  // File Upload Limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  ALLOWED_FILE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf'],

  // Password Requirements
  MIN_PASSWORD_LENGTH: 8, // Increased from 6 for better security
  MAX_PASSWORD_LENGTH: 128,
  
  // Request Timeouts
  REQUEST_TIMEOUT: 30000, // 30 seconds
  DASHBOARD_REQUEST_TIMEOUT: 30000, // 30 seconds for dashboard endpoints
  QUERY_TIMEOUT: 5000, // 5 seconds for database queries
  
  // Cache Durations
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  DASHBOARD_CACHE_DURATION: 2 * 60 * 1000, // 2 minutes
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Status Values
  STATUS: {
    ACTIVE: 'active',
    PENDING: 'pending',
    SUSPENDED: 'suspended',
    INACTIVE: 'inactive',
    CANCELLED: 'cancelled'
  },
  
  // User Roles
  ROLES: {
    ADMIN: 'admin',
    DEPOT_MANAGER: 'depot_manager',
    DRIVER: 'driver',
    CONDUCTOR: 'conductor',
    PASSENGER: 'passenger',
    VENDOR: 'vendor',
    STUDENT: 'student',
    SUPPORT_AGENT: 'support_agent',
    DATA_COLLECTOR: 'data_collector'
  },
  
  // Validation Patterns
  PATTERNS: {
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    PHONE: /^[+]?[0-9]{7,15}$/,
    PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    GST: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    PINCODE: /^[0-9]{6}$/,
    PINCODE_IN: /^[1-9][0-9]{5}$/ // Indian PIN code (doesn't start with 0)
  }
};

require('dotenv').config({ path: '.env' });

const FRONTEND_URL = process.env.E2E_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.E2E_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:5000';

// Default admin user seeded by backend scripts
const TEST_USER_EMAIL = process.env.E2E_USER_EMAIL || 'admin@yatrik.com';
const TEST_USER_PASSWORD = process.env.E2E_USER_PASSWORD || 'admin123';

// Optional role-specific test credentials (fallback to common admin if not provided)
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || TEST_USER_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || TEST_USER_PASSWORD;
const PASSENGER_EMAIL = process.env.E2E_PASSENGER_EMAIL || process.env.E2E_USER_EMAIL || '';
const PASSENGER_PASSWORD = process.env.E2E_PASSENGER_PASSWORD || process.env.E2E_USER_PASSWORD || '';
const DEPOT_USERNAME_OR_EMAIL = process.env.E2E_DEPOT_USERNAME || process.env.E2E_DEPOT_EMAIL || '';
const DEPOT_PASSWORD = process.env.E2E_DEPOT_PASSWORD || '';
const DRIVER_USERNAME = process.env.E2E_DRIVER_USERNAME || '';
const DRIVER_PASSWORD = process.env.E2E_DRIVER_PASSWORD || '';
const CONDUCTOR_USERNAME = process.env.E2E_CONDUCTOR_USERNAME || '';
const CONDUCTOR_PASSWORD = process.env.E2E_CONDUCTOR_PASSWORD || '';

module.exports = {
  FRONTEND_URL,
  BACKEND_URL,
  TEST_USER_EMAIL,
  TEST_USER_PASSWORD,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  PASSENGER_EMAIL,
  PASSENGER_PASSWORD,
  DEPOT_USERNAME_OR_EMAIL,
  DEPOT_PASSWORD,
  DRIVER_USERNAME,
  DRIVER_PASSWORD,
  CONDUCTOR_USERNAME,
  CONDUCTOR_PASSWORD,
};




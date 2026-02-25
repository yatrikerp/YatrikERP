// Selenium Test Configuration
require('dotenv').config();

module.exports = {
  // Application URLs
  BASE_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  API_URL: process.env.BACKEND_URL || 'http://localhost:5000',
  
  // Test timeouts
  TIMEOUT: {
    SHORT: 5000,
    MEDIUM: 10000,
    LONG: 30000,
    EXTRA_LONG: 60000
  },
  
  // Browser configuration
  BROWSER: process.env.TEST_BROWSER || 'chrome',
  HEADLESS: process.env.HEADLESS !== 'false',
  
  // Test credentials
  CREDENTIALS: {
    admin: {
      email: 'admin@yatrik.com',
      password: 'Admin@123'
    },
    depot: {
      email: 'depot@yatrik.com',
      password: 'Depot@123'
    },
    driver: {
      email: 'driver@yatrik.com',
      password: 'Driver@123'
    },
    conductor: {
      email: 'conductor@yatrik.com',
      password: 'Conductor@123'
    },
    passenger: {
      email: 'passenger@yatrik.com',
      password: 'Passenger@123'
    },
    vendor: {
      email: 'vendor@yatrik.com',
      password: 'Vendor@123'
    },
    state: {
      email: 'state@yatrik.com',
      password: 'State@123'
    }
  },
  
  // Screenshot configuration
  SCREENSHOTS: {
    ENABLED: true,
    PATH: './test-results/screenshots',
    ON_FAILURE: true
  },
  
  // Report configuration
  REPORTS: {
    PATH: './test-results/reports',
    FORMAT: 'html'
  }
};

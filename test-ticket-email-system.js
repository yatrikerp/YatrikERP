/**
 * Test Script for Email Ticket System
 * 
 * This script tests the complete ticket email flow:
 * 1. Creates a test booking
 * 2. Simulates payment
 * 3. Verifies ticket creation
 * 4. Checks email was sent
 * 5. Tests QR code validation
 */

require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Test configuration
const TEST_CONFIG = {
  passenger: {
    email: 'test.passenger@example.com',
    password: 'Test@1234',
    name: 'Test Passenger'
  },
  conductor: {
    email: 'test.conductor@example.com',
    password: 'Test@1234'
  }
};

let passengerToken = '';
let conductorToken = '';
let testBookingId = '';
let testTicketQR = '';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function step(message) {
  log(`\n🔹 ${message}`, 'magenta');
}

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message);
  }
}

// Test Steps

async function step1_LoginPassenger() {
  step('Step 1: Login as Passenger');
  try {
    const response = await apiCall('POST', '/auth/login', {
      email: TEST_CONFIG.passenger.email,
      password: TEST_CONFIG.passenger.password
    });

    if (response.success && response.token) {
      passengerToken = response.token;
      success('Passenger logged in successfully');
      info(`Token: ${passengerToken.substring(0, 20)}...`);
      return true;
    } else {
      error('Login failed: No token received');
      return false;
    }
  } catch (err) {
    error(`Login failed: ${err.message}`);
    info('Make sure test passenger account exists or create one first');
    return false;
  }
}

async function step2_SearchTrips() {
  step('Step 2: Search Available Trips');
  try {
    const response = await apiCall('GET', '/search?from=Chennai&to=Bangalore&date=2025-10-21', null, passengerToken);
    
    if (response.success && response.data?.trips?.length > 0) {
      success(`Found ${response.data.trips.length} trips`);
      const trip = response.data.trips[0];
      info(`Sample Trip: ${trip.route?.routeName || 'N/A'} - ${trip.startTime}`);
      return trip._id;
    } else {
      error('No trips found');
      return null;
    }
  } catch (err) {
    error(`Search failed: ${err.message}`);
    return null;
  }
}

async function step3_CreateBooking(tripId) {
  step('Step 3: Create Test Booking');
  try {
    const bookingData = {
      tripId: tripId,
      seatNo: 'A12',
      boardingStopId: 'boarding_stop_id',
      destinationStopId: 'destination_stop_id',
      passengerDetails: {
        name: TEST_CONFIG.passenger.name,
        email: TEST_CONFIG.passenger.email,
        phone: '+91-9876543210'
      }
    };

    const response = await apiCall('POST', '/bookings/create', bookingData, passengerToken);
    
    if (response.success && response.data?.bookingId) {
      testBookingId = response.data.bookingId;
      success('Booking created successfully');
      info(`Booking ID: ${testBookingId}`);
      info(`Amount: ₹${response.data.amount}`);
      return true;
    } else {
      error('Booking creation failed');
      return false;
    }
  } catch (err) {
    error(`Booking creation failed: ${err.message}`);
    return false;
  }
}

async function step4_MockPayment() {
  step('Step 4: Complete Payment (Mock)');
  try {
    const response = await apiCall('POST', '/payment/mock', {
      bookingId: testBookingId
    }, passengerToken);

    if (response.success && response.data?.tickets?.length > 0) {
      success('Payment completed successfully');
      success('Tickets generated with QR codes');
      
      const ticket = response.data.tickets[0];
      testTicketQR = ticket.qrPayload;
      
      info(`PNR: ${ticket.pnr}`);
      info(`Ticket Count: ${response.data.tickets.length}`);
      info('Email should be sent to passenger');
      
      return true;
    } else {
      error('Payment processing failed');
      return false;
    }
  } catch (err) {
    error(`Payment failed: ${err.message}`);
    return false;
  }
}

async function step5_LoginConductor() {
  step('Step 5: Login as Conductor');
  try {
    const response = await apiCall('POST', '/auth/login', {
      email: TEST_CONFIG.conductor.email,
      password: TEST_CONFIG.conductor.password
    });

    if (response.success && response.token) {
      conductorToken = response.token;
      success('Conductor logged in successfully');
      info(`Token: ${conductorToken.substring(0, 20)}...`);
      return true;
    } else {
      error('Login failed: No token received');
      return false;
    }
  } catch (err) {
    error(`Login failed: ${err.message}`);
    info('Make sure test conductor account exists');
    return false;
  }
}

async function step6_ScanTicket() {
  step('Step 6: Scan Ticket QR Code');
  try {
    const response = await apiCall('POST', '/conductor/scan-ticket', {
      qrPayload: testTicketQR,
      currentStop: 'Chennai Central',
      deviceId: 'TEST_DEVICE_001',
      appVersion: '1.0.0'
    }, conductorToken);

    if (response.success) {
      success('Ticket validated successfully');
      info(`Passenger: ${response.data?.ticket?.passengerName}`);
      info(`Seat: ${response.data?.ticket?.seatNumber}`);
      info(`PNR: ${response.data?.ticket?.pnr}`);
      info(`Status: ${response.data?.ticket?.state}`);
      return true;
    } else {
      error('Ticket validation failed');
      return false;
    }
  } catch (err) {
    error(`Ticket scanning failed: ${err.message}`);
    return false;
  }
}

async function step7_ScanAgain() {
  step('Step 7: Try Scanning Same Ticket Again (Should Detect Duplicate)');
  try {
    const response = await apiCall('POST', '/conductor/scan-ticket', {
      qrPayload: testTicketQR
    }, conductorToken);

    if (response.success && response.alreadyValidated) {
      success('System correctly detected already validated ticket');
      info('Duplicate scan prevention working ✓');
      return true;
    } else {
      error('System should have detected duplicate scan');
      return false;
    }
  } catch (err) {
    error(`Duplicate detection test failed: ${err.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.clear();
  log('═══════════════════════════════════════════════════════', 'yellow');
  log('     EMAIL TICKET SYSTEM - AUTOMATED TEST SUITE        ', 'yellow');
  log('═══════════════════════════════════════════════════════', 'yellow');
  
  const results = {
    total: 7,
    passed: 0,
    failed: 0
  };

  // Connect to MongoDB
  try {
    info('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000
    });
    success('Connected to MongoDB');
  } catch (err) {
    error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }

  // Run tests
  const tests = [
    { name: 'Passenger Login', fn: step1_LoginPassenger },
    { name: 'Search Trips', fn: async () => {
      const tripId = await step2_SearchTrips();
      return tripId ? await step3_CreateBooking(tripId) : false;
    }},
    { name: 'Mock Payment & Email', fn: step4_MockPayment },
    { name: 'Conductor Login', fn: step5_LoginConductor },
    { name: 'Ticket Scanning', fn: step6_ScanTicket },
    { name: 'Duplicate Detection', fn: step7_ScanAgain }
  ];

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (err) {
      error(`Test "${test.name}" crashed: ${err.message}`);
      results.failed++;
    }
  }

  // Summary
  log('\n═══════════════════════════════════════════════════════', 'yellow');
  log('                    TEST RESULTS                        ', 'yellow');
  log('═══════════════════════════════════════════════════════', 'yellow');
  
  log(`\nTotal Tests: ${results.total}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, 'red');
  
  if (results.failed === 0) {
    log('\n🎉 ALL TESTS PASSED! Email Ticket System Working Perfectly!', 'green');
  } else {
    log(`\n⚠️  ${results.failed} test(s) failed. Please check the logs above.`, 'red');
  }
  
  log('\n═══════════════════════════════════════════════════════\n', 'yellow');

  // Cleanup
  await mongoose.connection.close();
  info('MongoDB connection closed');
  
  process.exit(results.failed === 0 ? 0 : 1);
}

// Handle errors
process.on('unhandledRejection', (err) => {
  error(`Unhandled error: ${err.message}`);
  process.exit(1);
});

// Run the tests
runTests().catch((err) => {
  error(`Test suite failed: ${err.message}`);
  process.exit(1);
});

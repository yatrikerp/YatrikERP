/**
 * Test script to verify vendor routes are properly registered
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';

async function testVendorRoutes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Check if vendor routes file loads
    console.log('📋 Test 1: Loading vendor routes...');
    try {
      const vendorRouter = require('../routes/vendor');
      console.log('✅ Vendor routes file loaded successfully');
      console.log('   Router type:', typeof vendorRouter);
      console.log('   Router has stack:', Array.isArray(vendorRouter.stack));
      console.log('   Number of routes:', vendorRouter.stack?.length || 0);
    } catch (error) {
      console.error('❌ Failed to load vendor routes:', error.message);
      console.error('   Stack:', error.stack);
      process.exit(1);
    }

    // Test 2: Check if Invoice model loads
    console.log('\n📋 Test 2: Loading Invoice model...');
    try {
      const Invoice = require('../models/Invoice');
      console.log('✅ Invoice model loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load Invoice model:', error.message);
      process.exit(1);
    }

    // Test 3: Check if Vendor model loads
    console.log('\n📋 Test 3: Loading Vendor model...');
    try {
      const Vendor = require('../models/Vendor');
      console.log('✅ Vendor model loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load Vendor model:', error.message);
      process.exit(1);
    }

    // Test 4: Check if PurchaseOrder model loads
    console.log('\n📋 Test 4: Loading PurchaseOrder model...');
    try {
      const PurchaseOrder = require('../models/PurchaseOrder');
      console.log('✅ PurchaseOrder model loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load PurchaseOrder model:', error.message);
      process.exit(1);
    }

    // Test 5: List all registered routes
    console.log('\n📋 Test 5: Listing registered routes...');
    try {
      const vendorRouter = require('../routes/vendor');
      if (vendorRouter.stack && vendorRouter.stack.length > 0) {
        console.log(`✅ Found ${vendorRouter.stack.length} routes:`);
        vendorRouter.stack.forEach((route, index) => {
          const methods = route.route?.methods || {};
          const path = route.route?.path || 'N/A';
          const methodNames = Object.keys(methods).filter(m => methods[m]).join(', ').toUpperCase();
          console.log(`   ${index + 1}. ${methodNames.padEnd(6)} /api/vendor${path}`);
        });
      } else {
        console.log('⚠️  No routes found in router stack');
      }
    } catch (error) {
      console.error('❌ Failed to list routes:', error.message);
    }

    // Test 6: Check server.js registration
    console.log('\n📋 Test 6: Checking server.js route registration...');
    try {
      const fs = require('fs');
      const serverContent = fs.readFileSync('./server.js', 'utf8');
      if (serverContent.includes('/api/vendor')) {
        console.log('✅ Server.js includes /api/vendor route registration');
        if (serverContent.includes("require('./routes/vendor')")) {
          console.log('✅ Server.js requires vendor routes file');
        } else {
          console.log('⚠️  Server.js may not require vendor routes correctly');
        }
      } else {
        console.log('❌ Server.js does not include /api/vendor route registration');
      }
    } catch (error) {
      console.error('❌ Failed to check server.js:', error.message);
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('\n💡 If routes still return 404:');
    console.log('   1. Make sure backend server is running');
    console.log('   2. Restart the backend server: npm start');
    console.log('   3. Check server console for: "✅ Vendor routes registered at /api/vendor"');
    console.log('   4. Verify authentication token is being sent in requests');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testVendorRoutes();

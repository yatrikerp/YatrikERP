/**
 * Verify Vendor Module Setup
 * Run this to check if all vendor module files are properly set up
 */

console.log('🔍 Verifying Vendor Module Setup...\n');

let allGood = true;

// Test 1: Check routes file
console.log('📋 Test 1: Checking vendor.routes.js...');
try {
  const routes = require('../routes/vendor.routes');
  if (routes && routes.stack) {
    console.log(`✅ Routes file loaded - ${routes.stack.length} endpoints registered`);
  } else {
    console.log('❌ Routes file loaded but no routes found');
    allGood = false;
  }
} catch (error) {
  console.log('❌ Routes file failed to load:', error.message);
  allGood = false;
}

// Test 2: Check controller file
console.log('\n📋 Test 2: Checking vendorController.js...');
try {
  const controller = require('../controllers/vendorController');
  const methods = Object.keys(controller);
  const requiredMethods = [
    'getDashboard',
    'getProfile',
    'getPurchaseOrders',
    'getInvoices',
    'getPayments',
    'getTrustScore',
    'getNotifications',
    'getAuditLog'
  ];
  
  const missing = requiredMethods.filter(m => !methods.includes(m));
  if (missing.length === 0) {
    console.log(`✅ Controller loaded - All ${methods.length} methods present`);
  } else {
    console.log(`❌ Controller missing methods: ${missing.join(', ')}`);
    allGood = false;
  }
} catch (error) {
  console.log('❌ Controller file failed to load:', error.message);
  allGood = false;
}

// Test 3: Check service file
console.log('\n📋 Test 3: Checking vendorService.js...');
try {
  const service = require('../services/vendorService');
  const methods = Object.keys(service);
  const requiredMethods = [
    'getDashboardData',
    'getProfile',
    'getPurchaseOrders',
    'getInvoices',
    'getPayments',
    'getTrustScore',
    'getNotifications',
    'getAuditLog'
  ];
  
  const missing = requiredMethods.filter(m => !methods.includes(m));
  if (missing.length === 0) {
    console.log(`✅ Service loaded - All ${methods.length} methods present`);
  } else {
    console.log(`❌ Service missing methods: ${missing.join(', ')}`);
    allGood = false;
  }
} catch (error) {
  console.log('❌ Service file failed to load:', error.message);
  allGood = false;
}

// Test 4: Check models
console.log('\n📋 Test 4: Checking required models...');
const models = ['Vendor', 'PurchaseOrder', 'Invoice', 'SparePart'];
let modelsOk = true;
models.forEach(modelName => {
  try {
    const model = require(`../models/${modelName}`);
    if (model) {
      console.log(`✅ ${modelName} model loaded`);
    } else {
      console.log(`❌ ${modelName} model not found`);
      modelsOk = false;
    }
  } catch (error) {
    console.log(`❌ ${modelName} model failed: ${error.message}`);
    modelsOk = false;
  }
});

if (!modelsOk) {
  allGood = false;
}

// Test 5: Check middleware
console.log('\n📋 Test 5: Checking auth middleware...');
try {
  const { auth } = require('../middleware/auth');
  if (auth) {
    console.log('✅ Auth middleware loaded');
  } else {
    console.log('❌ Auth middleware not found');
    allGood = false;
  }
} catch (error) {
  console.log('❌ Auth middleware failed:', error.message);
  allGood = false;
}

// Final summary
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✅ ALL CHECKS PASSED!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Restart backend server: npm start');
  console.log('   2. Look for: "✅ Vendor routes registered at /api/vendor"');
  console.log('   3. Clear browser cache and test dashboard');
} else {
  console.log('❌ SOME CHECKS FAILED!');
  console.log('\n⚠️  Please fix the errors above before restarting server.');
}
console.log('='.repeat(50));

process.exit(allGood ? 0 : 1);

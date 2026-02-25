#!/usr/bin/env node
/**
 * Verify that booking routes are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Booking Routes Configuration...\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

// Check 1: BookingChoice.jsx exists
console.log('1. Checking BookingChoice.jsx...');
const bookingChoicePath = path.join(__dirname, 'frontend', 'src', 'pages', 'BookingChoice.jsx');
if (fs.existsSync(bookingChoicePath)) {
  console.log('   ✅ BookingChoice.jsx exists');
  checks.passed++;
} else {
  console.log('   ❌ BookingChoice.jsx NOT FOUND');
  checks.failed++;
}

// Check 2: CompleteBookingFlow.jsx exists
console.log('2. Checking CompleteBookingFlow.jsx...');
const completeFlowPath = path.join(__dirname, 'frontend', 'src', 'pages', 'passenger', 'CompleteBookingFlow.jsx');
if (fs.existsSync(completeFlowPath)) {
  console.log('   ✅ CompleteBookingFlow.jsx exists');
  checks.passed++;
} else {
  console.log('   ❌ CompleteBookingFlow.jsx NOT FOUND');
  checks.failed++;
}

// Check 3: App.js has proper imports
console.log('3. Checking App.js imports...');
const appJsPath = path.join(__dirname, 'frontend', 'src', 'App.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf-8');

if (appJsContent.includes('import BookingChoice')) {
  console.log('   ✅ BookingChoice imported in App.js');
  checks.passed++;
} else {
  console.log('   ❌ BookingChoice NOT imported in App.js');
  checks.failed++;
}

if (appJsContent.includes('import CompleteBookingFlow')) {
  console.log('   ✅ CompleteBookingFlow imported in App.js');
  checks.passed++;
} else {
  console.log('   ❌ CompleteBookingFlow NOT imported in App.js');
  checks.failed++;
}

// Check 4: App.js has route definitions
console.log('4. Checking App.js route definitions...');
if (appJsContent.includes('path="/booking-choice"')) {
  console.log('   ✅ /booking-choice route defined');
  checks.passed++;
} else {
  console.log('   ❌ /booking-choice route NOT defined');
  checks.failed++;
}

if (appJsContent.includes('path="/complete-booking/:tripId"')) {
  console.log('   ✅ /complete-booking/:tripId route defined');
  checks.passed++;
} else {
  console.log('   ❌ /complete-booking/:tripId route NOT defined');
  checks.failed++;
}

// Check 5: PopularRoutes.js updated
console.log('5. Checking PopularRoutes.js...');
const popularRoutesPath = path.join(__dirname, 'frontend', 'src', 'components', 'LandingPage', 'PopularRoutes.js');
if (fs.existsSync(popularRoutesPath)) {
  const popularRoutesContent = fs.readFileSync(popularRoutesPath, 'utf-8');
  if (popularRoutesContent.includes('pendingBooking') && popularRoutesContent.includes('booking-choice')) {
    console.log('   ✅ PopularRoutes.js updated with new flow');
    checks.passed++;
  } else {
    console.log('   ⚠️  PopularRoutes.js exists but may not be updated');
    checks.warnings++;
  }
} else {
  console.log('   ❌ PopularRoutes.js NOT FOUND');
  checks.failed++;
}

// Check 6: Auth.js updated
console.log('6. Checking Auth.js...');
const authPath = path.join(__dirname, 'frontend', 'src', 'pages', 'Auth.js');
if (fs.existsSync(authPath)) {
  const authContent = fs.readFileSync(authPath, 'utf-8');
  if (authContent.includes('pendingBooking') && authContent.includes('booking-choice')) {
    console.log('   ✅ Auth.js updated with post-login redirect');
    checks.passed++;
  } else {
    console.log('   ⚠️  Auth.js may not have post-login redirect logic');
    checks.warnings++;
  }
} else {
  console.log('   ❌ Auth.js NOT FOUND');
  checks.failed++;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('VERIFICATION SUMMARY:');
console.log('='.repeat(50));
console.log(`✅ Passed:   ${checks.passed}`);
console.log(`❌ Failed:   ${checks.failed}`);
console.log(`⚠️  Warnings: ${checks.warnings}`);
console.log('='.repeat(50));

if (checks.failed === 0 && checks.warnings === 0) {
  console.log('\n🎉 ALL CHECKS PASSED! Routes are properly configured.');
  console.log('\n📝 Next Steps:');
  console.log('   1. Restart frontend server (Ctrl+C and npm run dev)');
  console.log('   2. Clear browser cache (Ctrl+Shift+R)');
  console.log('   3. Visit http://localhost:5173/');
  console.log('   4. Click "Book" on any Popular Route');
  process.exit(0);
} else if (checks.failed === 0) {
  console.log('\n⚠️  Some warnings, but routes should work.');
  console.log('   Try restarting the frontend server.');
  process.exit(0);
} else {
  console.log('\n❌ Some checks failed. Please review the errors above.');
  process.exit(1);
}


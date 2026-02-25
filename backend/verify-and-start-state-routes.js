// Comprehensive verification and startup check for State Routes
const path = require('path');
const fs = require('fs');

console.log('🔍 Verifying State Command Dashboard Setup...\n');

let allGood = true;

// 1. Check if route file exists
console.log('1. Checking route file...');
const routeFile = path.join(__dirname, 'routes', 'state.js');
if (fs.existsSync(routeFile)) {
  console.log('   ✅ routes/state.js exists');
} else {
  console.log('   ❌ routes/state.js NOT FOUND');
  allGood = false;
}

// 2. Check if models exist
console.log('\n2. Checking model files...');
const models = [
  'StateMetrics.js',
  'RouteHealth.js',
  'DepotScore.js',
  'PolicyOverride.js',
  'SystemAlert.js',
  'Policy.js'
];

models.forEach(model => {
  const modelPath = path.join(__dirname, 'models', model);
  if (fs.existsSync(modelPath)) {
    console.log(`   ✅ models/${model} exists`);
  } else {
    console.log(`   ❌ models/${model} NOT FOUND`);
    allGood = false;
  }
});

// 3. Try to load the route file
console.log('\n3. Testing route file load...');
try {
  const stateRoutes = require('./routes/state');
  if (stateRoutes && typeof stateRoutes.use === 'function') {
    console.log('   ✅ Route file loads successfully');
    console.log('   ✅ Router is valid Express router');
  } else {
    console.log('   ❌ Route file loaded but router is invalid');
    allGood = false;
  }
} catch (error) {
  console.log('   ❌ ERROR loading route file:', error.message);
  console.log('   Stack:', error.stack.split('\n')[1]);
  allGood = false;
}

// 4. Check server.js registration
console.log('\n4. Checking server.js registration...');
const serverFile = path.join(__dirname, 'server.js');
if (fs.existsSync(serverFile)) {
  const serverContent = fs.readFileSync(serverFile, 'utf8');
  if (serverContent.includes('app.use("/api/state"')) {
    console.log('   ✅ State routes registered in server.js');
  } else {
    console.log('   ❌ State routes NOT registered in server.js');
    allGood = false;
  }
} else {
  console.log('   ❌ server.js NOT FOUND');
  allGood = false;
}

// 5. Check middleware
console.log('\n5. Checking middleware files...');
const middlewareFiles = [
  'middleware/auth.js',
  'middleware/authorizeRoles.js'
];

middlewareFiles.forEach(mw => {
  const mwPath = path.join(__dirname, mw);
  if (fs.existsSync(mwPath)) {
    console.log(`   ✅ ${mw} exists`);
  } else {
    console.log(`   ❌ ${mw} NOT FOUND`);
    allGood = false;
  }
});

// Summary
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✅ ALL CHECKS PASSED!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Restart your backend server:');
  console.log('      cd backend');
  console.log('      npm start');
  console.log('\n   2. Look for this message in console:');
  console.log('      ✅ State routes loaded successfully');
  console.log('\n   3. Test the routes:');
  console.log('      http://localhost:5000/api/state/test');
  console.log('\n   4. Login to dashboard:');
  console.log('      http://localhost:3000/login');
  console.log('      Email: stateadmin@yatrik.com');
  console.log('      Password: Yatrik123');
  console.log('\n✅ Everything is ready - just restart the server!\n');
} else {
  console.log('❌ SOME CHECKS FAILED');
  console.log('Please fix the errors above before restarting the server.\n');
  process.exit(1);
}

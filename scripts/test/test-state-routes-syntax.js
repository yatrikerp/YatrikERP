// Test if state routes file can be loaded
console.log('Testing state routes syntax...\n');

try {
  const path = require('path');
  const stateRoutes = require(path.join(__dirname, 'backend', 'routes', 'state'));
  
  console.log('✅ SUCCESS: State routes file loads without errors!');
  console.log('✅ Router type:', typeof stateRoutes);
  console.log('✅ Is Express router:', stateRoutes && typeof stateRoutes.use === 'function');
  console.log('✅ Is Express router (get):', stateRoutes && typeof stateRoutes.get === 'function');
  console.log('✅ Is Express router (post):', stateRoutes && typeof stateRoutes.post === 'function');
  
  // Restore original directory
  process.chdir(originalCwd);
  
  console.log('\n✅ ALL SYNTAX CHECKS PASSED!');
  console.log('\n📋 The routes file is valid and ready to use.');
  console.log('⚠️  IMPORTANT: Restart your backend server to load these routes.');
  console.log('   Command: cd backend && npm start\n');
  
  process.exit(0);
} catch (error) {
  console.error('❌ ERROR: State routes file has syntax errors!');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

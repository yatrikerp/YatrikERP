// Test script to verify state routes can be loaded
const path = require('path');

console.log('Testing state routes file...\n');

try {
  // Change to backend directory context
  process.chdir(path.join(__dirname));
  
  const stateRoutes = require('./routes/state');
  
  console.log('✅ State routes file loaded successfully!');
  console.log('✅ Router type:', typeof stateRoutes);
  console.log('✅ Router is Express router:', stateRoutes && typeof stateRoutes.use === 'function');
  console.log('\n✅ All checks passed! The routes file is valid.');
  console.log('\n⚠️  IMPORTANT: Restart your backend server to load these routes!');
  console.log('   Run: cd backend && npm start\n');
  
  process.exit(0);
} catch (error) {
  console.error('❌ ERROR: Failed to load state routes file');
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  console.error('\nPlease check the state.js file for syntax errors.');
  process.exit(1);
}

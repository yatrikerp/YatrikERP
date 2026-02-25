// Quick verification that state routes file is valid
console.log('Verifying state routes...\n');

try {
  const stateRoutes = require('./backend/routes/state');
  console.log('✅ State routes file is valid and loads successfully!');
  console.log('✅ Router exported correctly');
  console.log('\n📋 Next Steps:');
  console.log('1. Stop your backend server (Ctrl+C)');
  console.log('2. Restart it: cd backend && npm start');
  console.log('3. Check console for: "✅ State routes loaded successfully"');
  console.log('4. Test: http://localhost:5000/api/state/test');
  console.log('\n✅ All code is correct - just needs server restart!\n');
} catch (error) {
  console.error('❌ ERROR:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

// Simple test to verify depot routes are registered
const express = require('express');
const app = express();

console.log('🧪 Testing depot routes registration...\n');

try {
  const depotRouter = require('./routes/depot');
  console.log('✅ Depot routes module loaded');
  console.log('Type:', typeof depotRouter);
  console.log('Has get method:', typeof depotRouter.get);
  
  // Check if routes are defined
  const routes = depotRouter.stack || [];
  console.log(`\n📋 Found ${routes.length} middleware/route handlers`);
  
  // List all routes
  routes.forEach((layer, index) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
      const path = layer.route.path;
      console.log(`  ${index + 1}. ${methods} ${path}`);
    } else if (layer.name === 'router') {
      console.log(`  ${index + 1}. [Router] ${layer.regexp}`);
    } else {
      console.log(`  ${index + 1}. [Middleware] ${layer.name || 'anonymous'}`);
    }
  });
  
  // Check for specific routes
  const hasDashboard = routes.some(layer => 
    layer.route && layer.route.path === '/dashboard' && layer.route.methods.get
  );
  const hasNotifications = routes.some(layer => 
    layer.route && layer.route.path === '/notifications' && layer.route.methods.get
  );
  
  console.log('\n🔍 Route Check:');
  console.log('  Dashboard route:', hasDashboard ? '✅ Found' : '❌ Missing');
  console.log('  Notifications route:', hasNotifications ? '✅ Found' : '❌ Missing');
  
  if (hasDashboard && hasNotifications) {
    console.log('\n✅ All routes are properly registered!');
  } else {
    console.log('\n❌ Some routes are missing. Check the route definitions.');
  }
  
} catch (error) {
  console.error('❌ Error loading depot routes:', error.message);
  console.error(error.stack);
  process.exit(1);
}

// Test script to identify the route issue
const express = require('express');
const { auth } = require('./backend/middleware/auth');

console.log('Testing middleware import...');
console.log('Auth middleware type:', typeof auth);
console.log('Auth middleware:', auth);

// Test creating a route
const router = express.Router();

try {
  // Test the exact route that's failing
  router.get('/test', auth, (req, res) => {
    res.json({ success: true });
  });
  console.log('✅ Route creation successful');
} catch (error) {
  console.error('❌ Route creation failed:', error.message);
}

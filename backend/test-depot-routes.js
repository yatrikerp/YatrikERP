// Quick test to verify depot routes are accessible
const express = require('express');
const app = express();

// Test if routes can be loaded
try {
  const depotRouter = require('./routes/depot');
  console.log('✅ Depot routes loaded successfully');
  console.log('Router type:', typeof depotRouter);
  console.log('Router methods:', Object.keys(depotRouter));
} catch (error) {
  console.error('❌ Error loading depot routes:', error);
  process.exit(1);
}

process.exit(0);

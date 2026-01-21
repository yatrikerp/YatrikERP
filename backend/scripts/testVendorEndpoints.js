/**
 * Test Vendor Endpoints
 * Tests if vendor routes are accessible (requires server to be running)
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

const endpoints = [
  '/api/vendor/dashboard',
  '/api/vendor/profile',
  '/api/vendor/purchase-orders',
  '/api/vendor/invoices',
  '/api/vendor/payments',
  '/api/vendor/trust-score',
  '/api/vendor/notifications',
  '/api/vendor/audit-log',
  '/api/vendor/spare-parts'
];

async function testEndpoint(path) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const req = http.get(url, (res) => {
      resolve({
        path,
        status: res.statusCode,
        success: res.statusCode !== 404
      });
    });
    
    req.on('error', (error) => {
      resolve({
        path,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        path,
        status: 'TIMEOUT',
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

async function testAllEndpoints() {
  console.log('🧪 Testing Vendor Endpoints...\n');
  console.log('⚠️  Note: These tests will return 401 (Unauthorized) if routes exist but require auth');
  console.log('   A 404 means the route does not exist\n');
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.status === 404) {
      console.log(`❌ ${endpoint} - 404 (Route NOT FOUND)`);
    } else if (result.status === 401) {
      console.log(`✅ ${endpoint} - 401 (Route EXISTS - Auth required)`);
    } else if (result.status === 'ERROR') {
      console.log(`⚠️  ${endpoint} - ERROR: ${result.error}`);
      console.log('   (Server may not be running)');
    } else {
      console.log(`✅ ${endpoint} - ${result.status}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  const found = results.filter(r => r.status !== 404 && r.status !== 'ERROR' && r.status !== 'TIMEOUT').length;
  const notFound = results.filter(r => r.status === 404).length;
  const errors = results.filter(r => r.status === 'ERROR' || r.status === 'TIMEOUT').length;
  
  console.log('📊 Summary:');
  console.log(`   ✅ Found (or requires auth): ${found}`);
  console.log(`   ❌ Not Found (404): ${notFound}`);
  console.log(`   ⚠️  Errors/Timeout: ${errors}`);
  console.log('='.repeat(50));
  
  if (notFound > 0) {
    console.log('\n⚠️  Some routes return 404 - Backend server needs restart!');
    console.log('   Run: cd backend && npm start');
  } else if (errors > 0) {
    console.log('\n⚠️  Server may not be running on port 5000');
    console.log('   Start server: cd backend && npm start');
  } else {
    console.log('\n✅ All routes are accessible!');
  }
}

testAllEndpoints();

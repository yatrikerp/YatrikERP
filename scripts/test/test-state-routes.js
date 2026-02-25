// Quick test to verify state routes are accessible
const http = require('http');

const testRoutes = [
  '/api/state/dashboard',
  '/api/state/live-map',
  '/api/state/revenue',
  '/api/state/load-occupancy',
  '/api/state/citizen-pain',
  '/api/state/alerts',
  '/api/state/policies'
];

console.log('Testing State Routes...\n');

testRoutes.forEach(route => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: route,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test' // Will fail auth but should not be 404
    }
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 404) {
      console.log(`❌ ${route} - 404 (Route not found - server needs restart)`);
    } else if (res.statusCode === 401) {
      console.log(`✅ ${route} - 401 (Route exists, auth required)`);
    } else if (res.statusCode === 403) {
      console.log(`✅ ${route} - 403 (Route exists, insufficient permissions)`);
    } else {
      console.log(`✅ ${route} - ${res.statusCode}`);
    }
  });

  req.on('error', (e) => {
    console.log(`❌ ${route} - Error: ${e.message}`);
  });

  req.end();
});

setTimeout(() => {
  console.log('\n✅ Test complete. If you see 404 errors, restart the backend server.');
  process.exit(0);
}, 2000);

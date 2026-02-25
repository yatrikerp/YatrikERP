const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test endpoints
const endpoints = [
  { method: 'GET', url: '/api/ai/health', name: 'AI Health Check' },
  { method: 'GET', url: '/api/ai/analytics', name: 'AI Analytics' },
  { method: 'GET', url: '/api/ai/analytics/comparison', name: 'AI Comparison' },
  { method: 'GET', url: '/api/ai/models', name: 'AI Models List' },
  { method: 'GET', url: '/api/admin/ai/command-dashboard/kpis', name: 'Command Dashboard KPIs' },
  { method: 'GET', url: '/api/admin/ai/command-dashboard/ai-alerts', name: 'AI Alerts' },
  { method: 'GET', url: '/api/admin/ai/ml/models', name: 'ML Models' },
  { method: 'GET', url: '/api/admin/ai/autonomous/status', name: 'Autonomous Status' },
  { method: 'GET', url: '/api/admin/ai/predictive/demand', name: 'Demand Forecast' },
  { method: 'GET', url: '/api/admin/ai/predictive/revenue', name: 'Revenue Forecast' }
];

async function testEndpoint(endpoint) {
  try {
    const response = await axios({
      method: endpoint.method,
      url: `${BASE_URL}${endpoint.url}`,
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`
      },
      timeout: 5000
    });
    
    console.log(`✅ ${endpoint.name}: ${response.status} OK`);
    return true;
  } catch (error) {
    if (error.response) {
      console.log(`❌ ${endpoint.name}: ${error.response.status} ${error.response.statusText}`);
    } else if (error.code === 'ECONNREFUSED') {
      console.log(`❌ ${endpoint.name}: Server not running`);
    } else {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('========================================');
  console.log('   TESTING AI ENDPOINTS');
  console.log('========================================\n');
  
  console.log('Testing server connection...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    if (result) passed++;
    else failed++;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n========================================');
  console.log('   TEST RESULTS');
  console.log('========================================');
  console.log(`Total Tests: ${endpoints.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('========================================\n');
  
  if (failed > 0) {
    console.log('Note: Some endpoints require authentication.');
    console.log('Login as admin first to get a valid token.\n');
  }
}

// Run tests
runTests().catch(console.error);

const fetch = require('node-fetch');

async function testBackendConnection() {
  try {
    console.log('🔍 Testing backend connection...');
    
    // Test basic health endpoint
    const healthResponse = await fetch('http://localhost:5000/api/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend is running:', healthData);
    } else {
      console.log('❌ Backend health check failed:', healthResponse.status);
    }
    
    // Test bulk scheduler status endpoint
    const statusResponse = await fetch('http://localhost:5000/api/bulk-scheduler/status');
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Bulk scheduler endpoint working:', statusData);
    } else {
      console.log('❌ Bulk scheduler endpoint failed:', statusResponse.status, statusResponse.statusText);
    }
    
  } catch (error) {
    console.log('❌ Connection error:', error.message);
    console.log('💡 Make sure the backend server is running on port 5000');
  }
}

testBackendConnection();

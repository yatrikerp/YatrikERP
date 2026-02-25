const fetch = require('node-fetch');

// Test authentication and bulk scheduler endpoints
async function testAuthAndBulkScheduler() {
  try {
    console.log('🔍 Testing Authentication and Bulk Scheduler...');
    
    // Test 1: Health endpoint (no auth required)
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:5000/api/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health endpoint working:', healthData.status);
    } else {
      console.log('❌ Health endpoint failed:', healthResponse.status);
    }
    
    // Test 2: Login to get token
    console.log('\n2. Testing login to get authentication token...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@yatrik.com',
        password: 'admin123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful');
      const token = loginData.token;
      
      // Test 3: Bulk scheduler status with auth
      console.log('\n3. Testing bulk scheduler status with authentication...');
      const statusResponse = await fetch('http://localhost:5000/api/bulk-scheduler/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('✅ Bulk scheduler status working:', statusData);
      } else {
        const errorData = await statusResponse.json();
        console.log('❌ Bulk scheduler status failed:', statusResponse.status, errorData);
      }
      
      // Test 4: Depot analysis with auth
      console.log('\n4. Testing depot analysis with authentication...');
      const depotResponse = await fetch('http://localhost:5000/api/bulk-scheduler/depot-analysis', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (depotResponse.ok) {
        const depotData = await depotResponse.json();
        console.log('✅ Depot analysis working:', depotData);
      } else {
        const errorData = await depotResponse.json();
        console.log('❌ Depot analysis failed:', depotResponse.status, errorData);
      }
      
    } else {
      const errorData = await loginResponse.json();
      console.log('❌ Login failed:', loginResponse.status, errorData);
    }
    
    console.log('\n🎉 Authentication and API testing complete!');
    
  } catch (error) {
    console.log('❌ Error during testing:', error.message);
  }
}

testAuthAndBulkScheduler();

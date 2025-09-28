const fetch = require('node-fetch');

async function testAutoScheduler() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('🧪 Testing Auto Scheduler...');
    
    // Test the mass-schedule endpoint
    const testData = {
      date: new Date().toISOString().slice(0, 10),
      depotIds: [],
      maxTripsPerRoute: 3,
      timeGap: 30,
      autoAssignCrew: true,
      autoAssignBuses: true,
      optimizeForDemand: true,
      generateReports: true
    };
    
    console.log('📋 Test data:', testData);
    
    const response = await fetch(`${baseUrl}/api/auto-scheduler/mass-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You might need to adjust this
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Auto scheduler test PASSED!');
      console.log(`📈 Created ${result.data?.tripsCreated || 0} trips`);
      console.log(`📈 Success rate: ${result.data?.successRate || '0%'}`);
    } else {
      console.log('❌ Auto scheduler test FAILED!');
      console.log('Error:', result.message || result.error);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testAutoScheduler();

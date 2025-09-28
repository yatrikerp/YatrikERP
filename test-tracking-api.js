// Test script to verify tracking API is working
const fetch = require('node-fetch');

async function testTrackingAPI() {
  try {
    console.log('🧪 Testing tracking API...\n');
    
    // Test the running trips endpoint
    const response = await fetch('http://localhost:5000/api/tracking/running-trips');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response Status:', response.status);
      console.log('✅ API Response Data:', JSON.stringify(data, null, 2));
      
      if (data.success && data.data?.trips) {
        console.log(`\n🎉 Found ${data.data.trips.length} running trips!`);
        data.data.trips.forEach((trip, index) => {
          console.log(`${index + 1}. ${trip.tripId} - ${trip.routeId.routeName}`);
          console.log(`   Bus: ${trip.busId.busNumber} | Status: ${trip.status}`);
          console.log(`   Location: ${trip.currentLocation} | Speed: ${trip.currentSpeed}`);
        });
      } else {
        console.log('⚠️ No trips found in API response');
      }
    } else {
      console.log('❌ API Request Failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('❌ Error Details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('\n💡 Make sure the backend server is running on port 5000');
    console.log('💡 Run: cd backend && npm start');
  }
}

testTrackingAPI();

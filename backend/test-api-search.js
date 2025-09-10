const axios = require('axios');

async function testApiSearch() {
  try {
    console.log('🔍 Testing API search endpoint...');
    
    // Test search for Mumbai to Pune
    const response = await axios.get('http://localhost:5000/api/trips/search', {
      params: {
        from: 'Mumbai',
        to: 'Pune',
        date: '2025-09-09' // Today's date
      }
    });
    
    console.log('✅ API Response:', response.status);
    console.log('📊 Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data && response.data.data.trips) {
      console.log(`🎯 Found ${response.data.data.trips.length} trips`);
      response.data.data.trips.forEach((trip, index) => {
        console.log(`  ${index + 1}. ${trip.routeName} - ${trip.startTime} - ₹${trip.fare}`);
      });
    }
    
  } catch (error) {
    console.error('❌ API Error:', error.response?.data || error.message);
  }
}

testApiSearch();

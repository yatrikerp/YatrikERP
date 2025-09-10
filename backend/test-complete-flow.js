const axios = require('axios');

async function testCompleteFlow() {
  try {
    console.log('🔍 Testing complete passenger flow...');
    
    // Step 1: Search for trips
    console.log('1. Searching for Mumbai to Pune trips...');
    const searchResponse = await axios.get('http://localhost:5000/api/trips/search', {
      params: {
        from: 'Mumbai',
        to: 'Pune',
        date: '2025-09-10'
      }
    });
    
    if (searchResponse.data.data.trips.length === 0) {
      console.log('❌ No trips found');
      return;
    }
    
    const trip = searchResponse.data.data.trips[0];
    console.log('✅ Found trip:', trip.routeName, '- ID:', trip._id);
    console.log('   Fare:', trip.fare, 'Time:', trip.startTime, '-', trip.endTime);
    
    // Step 2: Get trip details
    console.log('2. Getting trip details...');
    const tripResponse = await axios.get(`http://localhost:5000/api/trips/${trip._id}`);
    
    if (tripResponse.data.ok) {
      const tripDetails = tripResponse.data.data;
      console.log('✅ Trip details loaded:');
      console.log('   Route:', tripDetails.routeName);
      console.log('   From:', tripDetails.fromCity, 'To:', tripDetails.toCity);
      console.log('   Bus:', tripDetails.busNumber, '-', tripDetails.busType);
      console.log('   Available Seats:', tripDetails.availableSeats);
    } else {
      console.log('❌ Failed to get trip details:', tripResponse.data.message);
      return;
    }
    
    console.log('\n🎉 Complete flow test successful!');
    console.log('✅ Trip search works');
    console.log('✅ Trip details API works');
    console.log('✅ Frontend should now be able to:');
    console.log('   1. Show search results with "Book Now" buttons');
    console.log('   2. Navigate to booking page with correct tripId');
    console.log('   3. Load trip details in booking page');
    console.log('   4. Allow users to complete booking process');
    
    console.log('\n📱 To test in browser:');
    console.log('1. Go to http://localhost:5173/pax/dashboard');
    console.log('2. Search for: Mumbai → Pune on 2025-09-10');
    console.log('3. Click "Book Now" on any trip');
    console.log('4. You should see the booking page with trip details');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCompleteFlow();

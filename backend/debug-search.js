// Debug script to test search logic step by step
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');

// Import models
const Route = require('./models/Route');
const Trip = require('./models/Trip');

async function debugSearch() {
  try {
    console.log('🔍 Debugging search logic...\n');

    // Test 1: Check what trips exist
    console.log('1️⃣ Checking existing trips...');
    const trips = await Trip.find({}).populate('routeId').lean();
    console.log(`Found ${trips.length} trips:`);
    trips.forEach(trip => {
      console.log(`   - ${trip.routeId?.routeName} on ${trip.serviceDate} at ${trip.startTime}`);
    });

    // Test 2: Check date comparison
    console.log('\n2️⃣ Testing date comparison...');
    const searchDate = new Date('2025-08-25');
    searchDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    console.log('Search date:', searchDate);
    console.log('Next day:', nextDay);
    
    const matchingTrips = await Trip.find({
      serviceDate: { $gte: searchDate, $lt: nextDay },
      status: { $in: ['scheduled', 'boarding', 'running'] }
    }).populate('routeId').lean();
    
    console.log(`Trips matching date criteria: ${matchingTrips.length}`);

    // Test 3: Check city matching
    console.log('\n3️⃣ Testing city matching...');
    const from = 'Mumbai';
    const to = 'Pune';
    
    if (matchingTrips.length > 0) {
      const trip = matchingTrips[0];
      const route = trip.routeId;
      
      console.log('Route structure:');
      console.log('  Starting point:', route.startingPoint?.city);
      console.log('  Ending point:', route.endingPoint?.city);
      console.log('  Intermediate stops:', route.intermediateStops?.map(s => s.city));
      
      // Check if route has the required cities
      const hasFrom = 
        (route.startingPoint?.city && route.startingPoint.city.toLowerCase().includes(from.toLowerCase())) ||
        (route.endingPoint?.city && route.endingPoint.city.toLowerCase().includes(from.toLowerCase())) ||
        (route.intermediateStops && route.intermediateStops.some(stop => 
          stop.city && stop.city.toLowerCase().includes(from.toLowerCase())
        ));
      
      const hasTo = 
        (route.startingPoint?.city && route.startingPoint.city.toLowerCase().includes(to.toLowerCase())) ||
        (route.endingPoint?.city && route.endingPoint.city.toLowerCase().includes(to.toLowerCase())) ||
        (route.intermediateStops && route.intermediateStops.some(stop => 
          stop.city && stop.city.toLowerCase().includes(to.toLowerCase())
        ));
      
      console.log(`Has from city (${from}): ${hasFrom}`);
      console.log(`Has to city (${to}): ${hasTo}`);
      console.log(`Trip matches search criteria: ${hasFrom && hasTo}`);
    }

    console.log('\n🎯 Debug completed!');
    
  } catch (error) {
    console.error('❌ Error debugging:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the debug
debugSearch();

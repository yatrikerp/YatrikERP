const mongoose = require('mongoose');
const Route = require('./models/Route');
const Trip = require('./models/Trip');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testTripSearch() {
  try {
    console.log('🔍 Testing trip search...');

    // Get all routes
    const routes = await Route.find({}).lean();
    console.log('📍 Available routes:', routes.length);
    routes.forEach(route => {
      console.log(`  - ${route.routeNumber}: ${route.routeName}`);
      console.log(`    From: ${route.startingPoint?.city} To: ${route.endingPoint?.city}`);
    });

    // Get all trips
    const trips = await Trip.find({}).lean();
    console.log('🚌 Available trips:', trips.length);
    trips.forEach(trip => {
      console.log(`  - Trip ID: ${trip._id}`);
      console.log(`    Date: ${trip.serviceDate}`);
      console.log(`    Time: ${trip.startTime} - ${trip.endTime}`);
      console.log(`    Route ID: ${trip.routeId}`);
      console.log(`    Status: ${trip.status}`);
    });

    // Test search for Mumbai to Pune
    console.log('\n🔍 Testing search: Mumbai to Pune');
    const mumbaiPuneTrips = trips.filter(trip => {
      const route = routes.find(r => r._id.toString() === trip.routeId.toString());
      if (!route) return false;
      
      const fromMatch = route.startingPoint?.city?.toLowerCase().includes('mumbai') ||
                       route.routeName?.toLowerCase().includes('mumbai');
      const toMatch = route.endingPoint?.city?.toLowerCase().includes('pune') ||
                     route.routeName?.toLowerCase().includes('pune');
      
      return fromMatch && toMatch;
    });

    console.log('🎯 Found trips for Mumbai to Pune:', mumbaiPuneTrips.length);
    mumbaiPuneTrips.forEach(trip => {
      const route = routes.find(r => r._id.toString() === trip.routeId.toString());
      console.log(`  - ${route?.routeName} on ${trip.serviceDate} at ${trip.startTime}`);
    });

    // Test search for any route
    console.log('\n🔍 Testing search: Any route');
    const anyTrips = trips.filter(trip => {
      const route = routes.find(r => r._id.toString() === trip.routeId.toString());
      return route && trip.status === 'scheduled';
    });

    console.log('🎯 Found scheduled trips:', anyTrips.length);
    anyTrips.forEach(trip => {
      const route = routes.find(r => r._id.toString() === trip.routeId.toString());
      console.log(`  - ${route?.routeName} on ${trip.serviceDate} at ${trip.startTime}`);
    });

  } catch (error) {
    console.error('❌ Error testing trip search:', error);
  } finally {
    mongoose.connection.close();
  }
}

testTripSearch();

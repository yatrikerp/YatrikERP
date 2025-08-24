// Script to clean up old trips and recreate them with correct structure
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');

// Import models
const Route = require('./models/Route');
const Trip = require('./models/Trip');

async function cleanupAndRecreateTrips() {
  try {
    console.log('🧹 Cleaning up old trips and recreating...\n');

    // Delete all existing trips
    const deleteResult = await Trip.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} old trips`);

    // Find existing routes
    const routes = await Route.find({ status: 'active' }).lean();
    console.log(`Found ${routes.length} existing routes`);

    if (routes.length === 0) {
      console.log('❌ No routes found. Please create routes first.');
      return;
    }

    // Create trips for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const tripsCreated = [];

    for (const route of routes) {
      // Create morning trip
      const morningTrip = new Trip({
        routeId: route._id,
        serviceDate: tomorrow,
        startTime: '08:00',
        status: 'scheduled'
      });

      // Create afternoon trip
      const afternoonTrip = new Trip({
        routeId: route._id,
        serviceDate: tomorrow,
        startTime: '14:00',
        status: 'scheduled'
      });

      // Save trips
      await morningTrip.save();
      await afternoonTrip.save();
      
      tripsCreated.push(`Morning trip for ${route.routeName}`);
      tripsCreated.push(`Afternoon trip for ${route.routeName}`);
      
      console.log('✅ Created morning trip for:', route.routeName);
      console.log('✅ Created afternoon trip for:', route.routeName);
    }

    console.log('\n🎉 Trip recreation completed!');
    console.log(`📅 Trips scheduled for: ${tomorrow.toDateString()}`);
    console.log(`🚌 Total trips created: ${tripsCreated.length}`);
    
    console.log('\n📋 Created trips:');
    tripsCreated.forEach(trip => console.log(`   - ${trip}`));

    console.log('\n🔍 Now you can test the search:');
    console.log('1. Go to landing page: http://localhost:5173');
    console.log('2. Search for trips from Mumbai to Pune');
    console.log('3. Select tomorrow\'s date');
    console.log('4. You should see available trips!');
    
  } catch (error) {
    console.error('❌ Error recreating trips:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
cleanupAndRecreateTrips();

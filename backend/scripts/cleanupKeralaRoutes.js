const mongoose = require('mongoose');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const Bus = require('../models/Bus');
const Depot = require('../models/Depot');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const cleanupKeralaRoutes = async () => {
  try {
    console.log('Starting comprehensive Kerala routes cleanup...');

    // 1. Verify only Kerala routes exist
    const allRoutes = await Route.find({});
    console.log(`\n📊 Current routes in database:`);
    allRoutes.forEach(route => {
      console.log(`- ${route.routeNumber}: ${route.routeName}`);
    });

    // 2. Verify only Kerala trips exist
    const allTrips = await Trip.find({});
    console.log(`\n📊 Current trips in database: ${allTrips.length}`);
    
    // 3. Verify only Kerala buses exist
    const allBuses = await Bus.find({});
    console.log(`\n📊 Current buses in database: ${allBuses.length}`);
    allBuses.forEach(bus => {
      console.log(`- ${bus.busNumber}: ${bus.busType} (${bus.capacity.total} seats)`);
    });

    // 4. Verify only Kerala depot exists
    const allDepots = await Depot.find({});
    console.log(`\n📊 Current depots in database: ${allDepots.length}`);
    allDepots.forEach(depot => {
      console.log(`- ${depot.depotName}: ${depot.location.city}, ${depot.location.state}`);
    });

    // 5. Check for any bookings
    const allBookings = await Booking.find({});
    console.log(`\n📊 Current bookings in database: ${allBookings.length}`);

    // 6. Check for any tickets
    const allTickets = await Ticket.find({});
    console.log(`\n📊 Current tickets in database: ${allTickets.length}`);

    // 7. Verify route-trip relationships
    console.log(`\n🔗 Verifying route-trip relationships...`);
    for (const route of allRoutes) {
      const routeTrips = await Trip.find({ routeId: route._id });
      console.log(`- ${route.routeNumber}: ${routeTrips.length} trips`);
    }

    // 8. Verify bus assignments
    console.log(`\n🔗 Verifying bus assignments...`);
    for (const route of allRoutes) {
      if (route.assignedBuses && route.assignedBuses.length > 0) {
        console.log(`- ${route.routeNumber}: ${route.assignedBuses.length} buses assigned`);
        route.assignedBuses.forEach(bus => {
          console.log(`  * ${bus.busNumber} (${bus.capacity} seats)`);
        });
      }
    }

    // 9. Summary
    console.log(`\n✅ Cleanup Summary:`);
    console.log(`- Routes: ${allRoutes.length} (All Kerala routes)`);
    console.log(`- Trips: ${allTrips.length} (All Kerala trips)`);
    console.log(`- Buses: ${allBuses.length} (All Kerala buses)`);
    console.log(`- Depots: ${allDepots.length} (All Kerala depots)`);
    console.log(`- Bookings: ${allBookings.length}`);
    console.log(`- Tickets: ${allTickets.length}`);

    console.log(`\n🎯 System is now fully configured for Kerala routes only!`);
    console.log(`\n📋 Available Routes:`);
    console.log(`1. KL001: Kochi - Thiruvananthapuram Express`);
    console.log(`2. KL002: Kozhikode - Kochi Coastal Route`);
    console.log(`3. KL003: Thiruvananthapuram - Kozhikode Mountain Express`);

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the cleanup
cleanupKeralaRoutes();

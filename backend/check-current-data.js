const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Trip = require('./models/Trip');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const Depot = require('./models/Depot');
const Booking = require('./models/Booking');

async function checkCurrentData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('Connected to MongoDB');

    console.log('\n📊 CURRENT DATABASE STATISTICS');
    console.log('================================');

    // Count all documents
    const [totalTrips, totalRoutes, totalBuses, totalDepots, totalBookings] = await Promise.all([
      Trip.countDocuments(),
      Route.countDocuments(),
      Bus.countDocuments(),
      Depot.countDocuments(),
      Booking.countDocuments()
    ]);

    console.log(`\n📈 TOTAL COUNTS:`);
    console.log(`- Trips: ${totalTrips}`);
    console.log(`- Routes: ${totalRoutes}`);
    console.log(`- Buses: ${totalBuses}`);
    console.log(`- Depots: ${totalDepots}`);
    console.log(`- Bookings: ${totalBookings}`);

    // Get upcoming trips (available for booking)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingTrips = await Trip.find({
      serviceDate: { $gte: today },
      status: { $in: ['scheduled', 'running'] },
      bookingOpen: true
    })
    .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
    .populate('busId', 'busNumber busType')
    .populate('depotId', 'depotName')
    .sort({ serviceDate: 1, startTime: 1 })
    .lean();

    console.log(`\n🚌 AVAILABLE TRIPS (for passenger booking):`);
    console.log(`- Total upcoming trips: ${upcomingTrips.length}`);

    if (upcomingTrips.length > 0) {
      console.log(`\n📋 TRIP DETAILS:`);
      upcomingTrips.forEach((trip, index) => {
        const route = trip.routeId;
        const bus = trip.busId;
        const depot = trip.depotId;
        
        console.log(`${index + 1}. ${route?.routeName || 'Unknown Route'}`);
        console.log(`   Route: ${route?.routeNumber || 'N/A'}`);
        console.log(`   From: ${route?.startingPoint?.city || route?.startingPoint || 'Unknown'}`);
        console.log(`   To: ${route?.endingPoint?.city || route?.endingPoint || 'Unknown'}`);
        console.log(`   Date: ${new Date(trip.serviceDate).toLocaleDateString()}`);
        console.log(`   Time: ${trip.startTime} - ${trip.endTime}`);
        console.log(`   Bus: ${bus?.busNumber || 'N/A'} (${bus?.busType || 'Unknown'})`);
        console.log(`   Fare: ₹${trip.fare}`);
        console.log(`   Available Seats: ${trip.availableSeats}/${trip.capacity}`);
        console.log(`   Depot: ${depot?.depotName || 'Unknown'}`);
        console.log(`   Status: ${trip.status}`);
        console.log(`   Booking Open: ${trip.bookingOpen ? 'Yes' : 'No'}`);
        console.log('');
      });
    }

    // Get routes summary
    const routes = await Route.find({})
      .populate('depot', 'depotName')
      .sort({ routeNumber: 1 })
      .lean();

    console.log(`\n🛣️ ROUTES SUMMARY:`);
    console.log(`- Total routes: ${routes.length}`);
    
    if (routes.length > 0) {
      console.log(`\n📋 ROUTE DETAILS:`);
      routes.forEach((route, index) => {
        console.log(`${index + 1}. ${route.routeNumber}: ${route.routeName}`);
        console.log(`   From: ${route.startingPoint?.city || route.startingPoint || 'Unknown'}`);
        console.log(`   To: ${route.endingPoint?.city || route.endingPoint || 'Unknown'}`);
        console.log(`   Distance: ${route.totalDistance || 'N/A'} km`);
        console.log(`   Base Fare: ₹${route.baseFare || 'N/A'}`);
        console.log(`   Depot: ${route.depot?.depotName || 'Unknown'}`);
        console.log(`   Status: ${route.status || 'Unknown'}`);
        console.log('');
      });
    }

    // Get buses summary
    const buses = await Bus.find({})
      .populate('depotId', 'depotName')
      .sort({ busNumber: 1 })
      .lean();

    console.log(`\n🚌 BUSES SUMMARY:`);
    console.log(`- Total buses: ${buses.length}`);
    
    if (buses.length > 0) {
      console.log(`\n📋 BUS DETAILS:`);
      buses.forEach((bus, index) => {
        console.log(`${index + 1}. ${bus.busNumber}`);
        console.log(`   Type: ${bus.busType || 'Unknown'}`);
        console.log(`   Capacity: ${bus.capacity?.total || 'N/A'} seats`);
        console.log(`   Registration: ${bus.registrationNumber || 'N/A'}`);
        console.log(`   Depot: ${bus.depotId?.depotName || 'Unknown'}`);
        console.log(`   Status: ${bus.status || 'Unknown'}`);
        console.log('');
      });
    }

    // Get depots summary
    const depots = await Depot.find({}).lean();

    console.log(`\n🏢 DEPOTS SUMMARY:`);
    console.log(`- Total depots: ${depots.length}`);
    
    if (depots.length > 0) {
      console.log(`\n📋 DEPOT DETAILS:`);
      depots.forEach((depot, index) => {
        console.log(`${index + 1}. ${depot.depotName}`);
        console.log(`   Code: ${depot.depotCode || 'N/A'}`);
        console.log(`   Location: ${depot.address?.city || 'Unknown'}, ${depot.address?.state || 'Unknown'}`);
        console.log(`   Status: ${depot.status || 'Unknown'}`);
        console.log(`   Capacity: ${depot.capacity || 'N/A'} buses`);
        console.log('');
      });
    }

    // Check for bookings
    if (totalBookings > 0) {
      const recentBookings = await Booking.find({})
        .populate('tripId', 'routeId')
        .populate('passengerId', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      console.log(`\n🎫 RECENT BOOKINGS:`);
      recentBookings.forEach((booking, index) => {
        console.log(`${index + 1}. Booking ID: ${booking.bookingId || booking._id}`);
        console.log(`   Passenger: ${booking.passengerId?.name || 'Unknown'}`);
        console.log(`   Amount: ₹${booking.totalAmount || 'N/A'}`);
        console.log(`   Status: ${booking.status || 'Unknown'}`);
        console.log(`   Created: ${new Date(booking.createdAt).toLocaleString()}`);
        console.log('');
      });
    }

    console.log('\n✅ Database check completed!');

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
checkCurrentData();

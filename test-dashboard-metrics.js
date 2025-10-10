const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Trip = require('./models/Trip');
const Booking = require('./models/Booking');
const User = require('./models/User');
const Bus = require('./models/Bus');
const Route = require('./models/Route');
const Depot = require('./models/Depot');

async function testDashboardMetrics() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');
    console.log('✅ Connected to MongoDB');

    // Get current date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    console.log('\n📊 Testing Dashboard Metrics...');
    console.log('Today:', today.toISOString());
    console.log('Tomorrow:', tomorrow.toISOString());
    console.log('Week ago:', weekAgo.toISOString());

    // Test Trip metrics
    console.log('\n🚌 Trip Metrics:');
    const totalTrips = await Trip.countDocuments();
    const tripsToday = await Trip.countDocuments({ 
      serviceDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['scheduled', 'running', 'completed'] }
    });
    const runningTrips = await Trip.countDocuments({ status: 'running' });
    const completedTripsToday = await Trip.countDocuments({ 
      serviceDate: { $gte: today, $lt: tomorrow },
      status: 'completed'
    });
    const scheduledTrips = await Trip.countDocuments({ status: 'scheduled' });

    console.log(`  Total Trips: ${totalTrips}`);
    console.log(`  Trips Today: ${tripsToday}`);
    console.log(`  Running Trips: ${runningTrips}`);
    console.log(`  Completed Today: ${completedTripsToday}`);
    console.log(`  Scheduled Trips: ${scheduledTrips}`);

    // Test Booking metrics
    console.log('\n🎫 Booking Metrics:');
    const totalBookings = await Booking.countDocuments();
    const bookingsToday = await Booking.countDocuments({ 
      createdAt: { $gte: today, $lt: tomorrow }
    });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });

    console.log(`  Total Bookings: ${totalBookings}`);
    console.log(`  Bookings Today: ${bookingsToday}`);
    console.log(`  Pending Bookings: ${pendingBookings}`);
    console.log(`  Confirmed Bookings: ${confirmedBookings}`);
    console.log(`  Cancelled Bookings: ${cancelledBookings}`);

    // Test Revenue metrics
    console.log('\n💰 Revenue Metrics:');
    
    // Total revenue from completed payments
    const totalRevenueResult = await Booking.aggregate([
      { $match: { 'payment.paymentStatus': 'completed' } },
      { $group: { _id: null, total: { $sum: '$pricing.paidAmount' } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // Today's revenue
    const todayRevenueResult = await Booking.aggregate([
      { 
        $match: { 
          'payment.paymentStatus': 'completed',
          createdAt: { $gte: today, $lt: tomorrow }
        } 
      },
      { $group: { _id: null, total: { $sum: '$pricing.paidAmount' } } }
    ]);
    const todayRevenue = todayRevenueResult[0]?.total || 0;

    // This week's revenue
    const weekRevenueResult = await Booking.aggregate([
      { 
        $match: { 
          'payment.paymentStatus': 'completed',
          createdAt: { $gte: weekAgo, $lt: today }
        } 
      },
      { $group: { _id: null, total: { $sum: '$pricing.paidAmount' } } }
    ]);
    const weekRevenue = weekRevenueResult[0]?.total || 0;

    console.log(`  Total Revenue: ₹${totalRevenue}`);
    console.log(`  Today's Revenue: ₹${todayRevenue}`);
    console.log(`  This Week's Revenue: ₹${weekRevenue}`);

    // Test User metrics
    console.log('\n👥 User Metrics:');
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const newUsersToday = await User.countDocuments({ 
      createdAt: { $gte: today, $lt: tomorrow }
    });
    const newUsersThisWeek = await User.countDocuments({ 
      createdAt: { $gte: weekAgo, $lt: today }
    });

    console.log(`  Total Users: ${totalUsers}`);
    console.log(`  Active Users: ${activeUsers}`);
    console.log(`  New Users Today: ${newUsersToday}`);
    console.log(`  New Users This Week: ${newUsersThisWeek}`);

    // Test Fleet metrics
    console.log('\n🚍 Fleet Metrics:');
    const totalBuses = await Bus.countDocuments();
    const activeBuses = await Bus.countDocuments({ status: 'active' });
    const busesInMaintenance = await Bus.countDocuments({ status: 'maintenance' });
    const busesOnRoute = await Bus.countDocuments({ status: 'on_route' });

    console.log(`  Total Buses: ${totalBuses}`);
    console.log(`  Active Buses: ${activeBuses}`);
    console.log(`  Buses in Maintenance: ${busesInMaintenance}`);
    console.log(`  Buses on Route: ${busesOnRoute}`);

    // Test Route metrics
    console.log('\n🛣️ Route Metrics:');
    const totalRoutes = await Route.countDocuments();
    const activeRoutes = await Route.countDocuments({ status: 'active' });

    console.log(`  Total Routes: ${totalRoutes}`);
    console.log(`  Active Routes: ${activeRoutes}`);

    // Test Depot metrics
    console.log('\n🏢 Depot Metrics:');
    const totalDepots = await Depot.countDocuments();
    const activeDepots = await Depot.countDocuments({ status: 'active' });

    console.log(`  Total Depots: ${totalDepots}`);
    console.log(`  Active Depots: ${activeDepots}`);

    // Check for sample data
    console.log('\n🔍 Sample Data Check:');
    
    // Get sample trips
    const sampleTrips = await Trip.find().limit(3).populate('routeId', 'routeName').populate('busId', 'busNumber');
    console.log('  Sample Trips:');
    sampleTrips.forEach((trip, index) => {
      console.log(`    ${index + 1}. ${trip.routeId?.routeName || 'N/A'} - ${trip.busId?.busNumber || 'N/A'} - Status: ${trip.status}`);
    });

    // Get sample bookings
    const sampleBookings = await Booking.find().limit(3).populate('tripId', 'startTime').populate('routeId', 'routeName');
    console.log('  Sample Bookings:');
    sampleBookings.forEach((booking, index) => {
      console.log(`    ${index + 1}. ${booking.customer.name} - ${booking.routeId?.routeName || 'N/A'} - Status: ${booking.status} - Payment: ${booking.payment.paymentStatus}`);
    });

    // Check for running trips specifically
    console.log('\n🏃‍♂️ Running Trips Details:');
    const runningTripsDetails = await Trip.find({ status: 'running' })
      .populate('routeId', 'routeName routeNumber')
      .populate('busId', 'busNumber busType')
      .populate('driverId', 'name')
      .populate('conductorId', 'name');
    
    if (runningTripsDetails.length > 0) {
      console.log(`  Found ${runningTripsDetails.length} running trips:`);
      runningTripsDetails.forEach((trip, index) => {
        console.log(`    ${index + 1}. Route: ${trip.routeId?.routeName || 'N/A'} (${trip.routeId?.routeNumber || 'N/A'})`);
        console.log(`       Bus: ${trip.busId?.busNumber || 'N/A'} (${trip.busId?.busType || 'N/A'})`);
        console.log(`       Driver: ${trip.driverId?.name || 'N/A'}, Conductor: ${trip.conductorId?.name || 'N/A'}`);
        console.log(`       Service Date: ${trip.serviceDate}, Start Time: ${trip.startTime}`);
      });
    } else {
      console.log('  No running trips found');
    }

    // Check for pending bookings specifically
    console.log('\n⏳ Pending Bookings Details:');
    const pendingBookingsDetails = await Booking.find({ status: 'pending' })
      .populate('tripId', 'startTime')
      .populate('routeId', 'routeName')
      .limit(5);
    
    if (pendingBookingsDetails.length > 0) {
      console.log(`  Found ${pendingBookingsDetails.length} pending bookings:`);
      pendingBookingsDetails.forEach((booking, index) => {
        console.log(`    ${index + 1}. Customer: ${booking.customer.name}`);
        console.log(`       Route: ${booking.routeId?.routeName || 'N/A'}`);
        console.log(`       Amount: ₹${booking.pricing.totalAmount}, Paid: ₹${booking.pricing.paidAmount}`);
        console.log(`       Payment Status: ${booking.payment.paymentStatus}`);
      });
    } else {
      console.log('  No pending bookings found');
    }

    // Check for completed payments
    console.log('\n💳 Completed Payments Details:');
    const completedPayments = await Booking.find({ 'payment.paymentStatus': 'completed' })
      .populate('routeId', 'routeName')
      .limit(5);
    
    if (completedPayments.length > 0) {
      console.log(`  Found ${completedPayments.length} completed payments:`);
      completedPayments.forEach((booking, index) => {
        console.log(`    ${index + 1}. Customer: ${booking.customer.name}`);
        console.log(`       Route: ${booking.routeId?.routeName || 'N/A'}`);
        console.log(`       Amount: ₹${booking.pricing.totalAmount}, Paid: ₹${booking.pricing.paidAmount}`);
        console.log(`       Created: ${booking.createdAt}`);
      });
    } else {
      console.log('  No completed payments found');
    }

    console.log('\n✅ Dashboard metrics test completed!');

  } catch (error) {
    console.error('❌ Error testing dashboard metrics:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testDashboardMetrics();

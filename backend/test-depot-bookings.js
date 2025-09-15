const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Booking = require('./models/Booking');
const Depot = require('./models/Depot');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const User = require('./models/User');

async function testDepotBookings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('✅ Connected to MongoDB');

    // Find a depot
    const depot = await Depot.findOne({ status: 'active' });
    if (!depot) {
      console.log('❌ No active depot found');
      return;
    }
    console.log('✅ Found depot:', depot.depotName);

    // Find routes for this depot
    const routes = await Route.find({ 'depot.depotId': depot._id });
    console.log('✅ Found routes:', routes.length);

    // Find buses for this depot
    const buses = await Bus.find({ depotId: depot._id });
    console.log('✅ Found buses:', buses.length);

    // Find bookings for this depot
    const bookings = await Booking.find({ depotId: depot._id })
      .populate('routeId', 'routeName routeNumber')
      .populate('busId', 'busNumber type')
      .limit(5);

    console.log('✅ Found bookings:', bookings.length);
    
    if (bookings.length > 0) {
      console.log('\n📋 Sample bookings:');
      bookings.forEach((booking, index) => {
        console.log(`${index + 1}. ${booking.bookingId} - ${booking.customer.name} - ${booking.routeId?.routeName} - ${booking.status}`);
      });
    }

    // Test booking statistics aggregation
    const stats = await Booking.aggregate([
      { $match: { depotId: depot._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalAmount' }
        }
      }
    ]);

    console.log('\n📊 Booking statistics:');
    stats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} bookings, ₹${stat.totalRevenue}`);
    });

    // Test route-wise statistics
    const routeStats = await Booking.aggregate([
      { $match: { depotId: depot._id } },
      {
        $group: {
          _id: '$routeId',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'routes',
          localField: '_id',
          foreignField: '_id',
          as: 'route'
        }
      },
      {
        $unwind: '$route'
      },
      {
        $project: {
          routeName: '$route.routeName',
          routeNumber: '$route.routeNumber',
          count: 1,
          totalRevenue: 1
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    console.log('\n🛣️ Top routes by bookings:');
    routeStats.forEach(route => {
      console.log(`${route.routeName} (${route.routeNumber}): ${route.count} bookings, ₹${route.totalRevenue}`);
    });

    console.log('\n✅ Depot booking functionality test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing depot bookings:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testDepotBookings();


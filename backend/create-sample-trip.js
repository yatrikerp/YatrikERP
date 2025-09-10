const mongoose = require('mongoose');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const Trip = require('./models/Trip');
const Depot = require('./models/Depot');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createSampleTrip() {
  try {
    console.log('🚌 Creating sample trip...');

    // Find an existing route
    const route = await Route.findOne({ status: 'active' });
    if (!route) {
      console.log('❌ No active routes found. Please create a route first.');
      return;
    }
    console.log('📍 Using route:', route.routeNumber, '-', route.routeName);

    // Find an existing bus
    const bus = await Bus.findOne({ status: 'active' });
    if (!bus) {
      console.log('❌ No active buses found. Please create a bus first.');
      return;
    }
    console.log('🚌 Using bus:', bus.busNumber, '-', bus.busType);

    // Find an existing depot
    const depot = await Depot.findOne({ status: 'active' });
    if (!depot) {
      console.log('❌ No active depots found. Please create a depot first.');
      return;
    }
    console.log('🏢 Using depot:', depot.depotName);

    // Find an admin user for createdBy
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.');
      return;
    }
    console.log('👤 Using admin user:', adminUser.name);

    // Create tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Sample trip data
    const tripData = {
      routeId: route._id,
      busId: bus._id,
      depotId: depot._id,
      serviceDate: tomorrow,
      startTime: '08:00',
      endTime: '12:00',
      fare: 250,
      capacity: bus.capacity.total,
      availableSeats: bus.capacity.total,
      bookedSeats: 0,
      status: 'scheduled',
      createdBy: adminUser._id,
      notes: 'Sample trip for testing',
      bookingOpen: true,
      bookingCloseTime: new Date(tomorrow.getTime() - (2 * 60 * 60 * 1000)), // 2 hours before departure
      cancellationPolicy: {
        allowed: true,
        hoursBeforeDeparture: 2,
        refundPercentage: 80
      }
    };

    console.log('📊 Trip data:', {
      route: `${route.routeNumber} - ${route.routeName}`,
      bus: `${bus.busNumber} - ${bus.busType}`,
      depot: depot.depotName,
      date: tripData.serviceDate.toDateString(),
      time: `${tripData.startTime} - ${tripData.endTime}`,
      fare: `₹${tripData.fare}`,
      capacity: tripData.capacity
    });

    // Create the trip
    const trip = new Trip(tripData);
    await trip.save();

    console.log('✅ Sample trip created successfully!');
    console.log('🆔 Trip ID:', trip._id);
    console.log('📅 Service Date:', trip.serviceDate.toDateString());
    console.log('⏰ Time:', trip.startTime, '-', trip.endTime);
    console.log('💰 Fare: ₹', trip.fare);
    console.log('🚌 Bus:', bus.busNumber);
    console.log('📍 Route:', route.routeNumber, '-', route.routeName);

  } catch (error) {
    console.error('❌ Error creating sample trip:', error);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', Object.values(error.errors).map(err => err.message));
    }
  } finally {
    mongoose.connection.close();
  }
}

createSampleTrip();

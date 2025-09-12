const mongoose = require('mongoose');
require('dotenv').config();

const Trip = require('./models/Trip');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const User = require('./models/User');

async function createKeralaTrips() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('✅ Connected to MongoDB');

    // Get Kochi-Kollam route (RT001)
    const route = await Route.findOne({ routeNumber: 'RT001' });
    console.log('Route found:', route ? route.routeName : 'Not found');

    // Get first available bus
    const bus = await Bus.findOne({ status: 'active' });
    console.log('Bus found:', bus ? bus.busNumber : 'Not found');

    // Get admin user
    const admin = await User.findOne({ role: 'admin' });
    console.log('Admin found:', admin ? admin.name : 'Not found');

    if (!route || !bus || !admin) {
      console.log('❌ Missing required data');
      return;
    }

    // Create trips for next 5 days
    const trips = [];
    for (let i = 0; i < 5; i++) {
      const serviceDate = new Date();
      serviceDate.setDate(serviceDate.getDate() + i);
      
      const trip = {
        routeId: route._id,
        busId: bus._id,
        serviceDate: serviceDate,
        startTime: '08:00',
        endTime: '14:00',
        fare: 200,
        capacity: 40,
        availableSeats: 40,
        bookedSeats: 0,
        status: 'scheduled',
        depotId: route.depot?._id,
        createdBy: admin._id,
        bookingOpen: true,
        notes: `Kerala trip - ${route.routeName}`
      };
      trips.push(trip);
    }

    const createdTrips = await Trip.insertMany(trips);
    console.log(`🎉 Created ${createdTrips.length} trips for ${route.routeName}`);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createKeralaTrips();

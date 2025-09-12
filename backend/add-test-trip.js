const mongoose = require('mongoose');
require('dotenv').config();

const Trip = require('./models/Trip');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const User = require('./models/User');

async function addTestTrip() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const route = await Route.findOne({routeNumber: 'RT001'});
    const bus = await Bus.findOne({status: 'active'});
    const admin = await User.findOne({role: 'admin'});

    console.log('Route:', route ? route.routeName : 'Not found');
    console.log('Bus:', bus ? bus.busNumber : 'Not found');
    console.log('Admin:', admin ? admin.name : 'Not found');

    if (route && bus && admin) {
      const trip = await Trip.create({
        routeId: route._id,
        busId: bus._id,
        serviceDate: new Date('2025-09-13'),
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
        notes: 'Test Kerala trip for Kollam-Kochi'
      });
      console.log('🎉 Trip created successfully!');
      console.log('Trip ID:', trip._id);
      console.log('Route:', route.routeName);
      console.log('Date:', trip.serviceDate.toDateString());
      console.log('Time:', trip.startTime, '-', trip.endTime);
    } else {
      console.log('❌ Missing required data');
    }
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addTestTrip();

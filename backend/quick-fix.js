const mongoose = require('mongoose');
require('dotenv').config();

const Trip = require('./models/Trip');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const User = require('./models/User');

async function quickFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check existing trips
    const existingTrips = await Trip.find({}).populate('routeId', 'routeName routeNumber');
    console.log('Existing trips:', existingTrips.length);
    existingTrips.forEach(trip => {
      console.log(`- ${trip.routeId?.routeName} on ${new Date(trip.serviceDate).toLocaleDateString()}`);
    });

    // Get RT001 route
    const route = await Route.findOne({routeNumber: 'RT001'});
    console.log('RT001 route:', route ? route.routeName : 'Not found');

    // Get a bus
    const bus = await Bus.findOne({status: 'active'});
    console.log('Active bus:', bus ? bus.busNumber : 'Not found');

    // Get admin
    const admin = await User.findOne({role: 'admin'});
    console.log('Admin:', admin ? admin.name : 'Not found');

    if (route && bus && admin) {
      // Create trip for Sept 13, 2025
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
        notes: 'Kerala trip - Kollam to Kochi'
      });
      
      console.log('✅ Trip created successfully!');
      console.log('Trip ID:', trip._id);
      console.log('Route:', route.routeName);
      console.log('Date:', trip.serviceDate.toDateString());
      console.log('Status:', trip.status);
      console.log('Booking Open:', trip.bookingOpen);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

quickFix();

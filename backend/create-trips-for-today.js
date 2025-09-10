const mongoose = require('mongoose');
require('dotenv').config();

const Trip = require('./models/Trip');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const Depot = require('./models/Depot');
const User = require('./models/User');

async function createTripsForToday() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get existing data
    const route = await Route.findOne({ status: 'active' });
    const bus = await Bus.findOne({ status: 'active' });
    const depot = await Depot.findOne({ status: 'active' });
    const admin = await User.findOne({ role: 'admin' });

    if (!route || !bus || !depot || !admin) {
      console.log('Missing required data:', { route: !!route, bus: !!bus, depot: !!depot, admin: !!admin });
      return;
    }

    console.log('Using:', {
      route: route.routeName,
      bus: bus.busNumber,
      depot: depot.depotName,
      admin: admin.name
    });

    // Create trips for next 7 days
    const trips = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const serviceDate = new Date(today);
      serviceDate.setDate(today.getDate() + i);
      serviceDate.setHours(8, 0, 0, 0); // Set to 8 AM

      const tripData = {
        routeId: route._id,
        busId: bus._id,
        depotId: depot._id,
        serviceDate: serviceDate,
        startTime: '08:00',
        endTime: '12:00',
        fare: 250,
        capacity: bus.capacity?.total || 35,
        availableSeats: bus.capacity?.total || 35,
        bookedSeats: 0,
        status: 'scheduled',
        createdBy: admin._id,
        notes: `Trip for ${serviceDate.toDateString()}`,
        bookingOpen: true,
        bookingCloseTime: new Date(serviceDate.getTime() - (2 * 60 * 60 * 1000)), // 2 hours before
        cancellationPolicy: {
          allowed: true,
          hoursBeforeDeparture: 2,
          refundPercentage: 80
        }
      };

      // Check if trip already exists for this date
      const existingTrip = await Trip.findOne({
        routeId: route._id,
        serviceDate: {
          $gte: new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate()),
          $lt: new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate() + 1)
        }
      });

      if (!existingTrip) {
        const trip = new Trip(tripData);
        await trip.save();
        trips.push(trip);
        console.log(`✅ Created trip for ${serviceDate.toDateString()}`);
      } else {
        console.log(`⏭️ Trip already exists for ${serviceDate.toDateString()}`);
      }
    }

    console.log(`\n🎉 Created ${trips.length} new trips`);
    
    // Show all trips
    const allTrips = await Trip.find({})
      .populate('routeId', 'routeName')
      .populate('busId', 'busNumber')
      .sort({ serviceDate: 1 });

    console.log(`\n📊 Total trips in database: ${allTrips.length}`);
    allTrips.forEach((trip, index) => {
      console.log(`${index + 1}. ${trip.routeId?.routeName} | ${trip.busId?.busNumber} | ${trip.serviceDate.toDateString()} | ${trip.status}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTripsForToday();

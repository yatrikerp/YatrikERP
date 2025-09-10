const mongoose = require('mongoose');
require('dotenv').config();

const Bus = require('./models/Bus');
const Route = require('./models/Route');
const Trip = require('./models/Trip');
const Depot = require('./models/Depot');
const User = require('./models/User');

(async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1) Ensure a depot exists
    let depot = await Depot.findOne({ status: 'active' });
    if (!depot) {
      depot = await Depot.create({
        depotName: 'Kattappana depot',
        depotCode: 'KTP',
        location: { city: 'Mumbai' },
        status: 'active'
      });
      console.log('Created depot:', depot.depotName);
    }

    // 2) Ensure a bus exists and is active
    let bus = await Bus.findOne({ busNumber: 'MH-12-XY-7777' });
    if (!bus) {
      bus = await Bus.create({
        busNumber: 'MH-12-XY-7777',
        busType: 'ac_seater',
        capacity: { total: 45 },
        status: 'active',
        assignedDepot: depot._id
      });
      console.log('Created bus:', bus.busNumber);
    } else {
      if (bus.status !== 'active') {
        bus.status = 'active';
        await bus.save();
        console.log('Activated existing bus:', bus.busNumber);
      }
    }

    // 3) Find Mumbai->Pune route
    const route = await Route.findOne({ 'startingPoint.city': 'Mumbai', 'endingPoint.city': 'Pune' });
    if (!route) {
      console.log('Mumbai → Pune route not found. Please create the route first.');
      process.exit(0);
    }

    // 4) Attach bus to route if not attached
    const alreadyAssigned = (route.assignedBuses || []).some(r => String(r.busId) === String(bus._id));
    if (!alreadyAssigned) {
      route.assignedBuses = route.assignedBuses || [];
      route.assignedBuses.push({ busId: bus._id, active: true });
      await route.save();
      console.log('Attached bus to route:', route.routeName);
    }

    // 5) Find an admin user
    const admin = await User.findOne({ role: 'admin' });

    // 6) Create trips for next 7 days
    const today = new Date();
    let created = 0;
    for (let i = 0; i < 7; i++) {
      const serviceDate = new Date(today);
      serviceDate.setDate(today.getDate() + i);
      serviceDate.setHours(8, 0, 0, 0);

      const exists = await Trip.findOne({
        routeId: route._id,
        serviceDate: { $gte: new Date(serviceDate.setHours(0,0,0,0)), $lte: new Date(serviceDate.setHours(23,59,59,999)) }
      });
      if (exists) {
        console.log('Trip already exists for', new Date(serviceDate).toDateString());
        continue;
      }

      const trip = await Trip.create({
        routeId: route._id,
        busId: bus._id,
        depotId: depot._id,
        serviceDate: serviceDate,
        startTime: '08:00',
        endTime: '12:00',
        fare: 250,
        capacity: bus.capacity.total,
        availableSeats: bus.capacity.total,
        bookedSeats: 0,
        status: 'scheduled',
        createdBy: admin?._id,
        bookingOpen: true,
        bookingCloseTime: new Date(serviceDate.getTime() - 2 * 60 * 60 * 1000),
        cancellationPolicy: { allowed: true, hoursBeforeDeparture: 2, refundPercentage: 80 }
      });
      created++;
      console.log('Created trip:', trip.serviceDate.toDateString());
    }

    console.log(`Done. Created ${created} new trips.`);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();

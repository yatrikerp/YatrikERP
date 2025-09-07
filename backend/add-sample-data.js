const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Route = require('./models/Route');
const Trip = require('./models/Trip');
const Bus = require('./models/Bus');
const Depot = require('./models/Depot');
const User = require('./models/User');

async function addSampleData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('Connected to MongoDB');

    // Create admin user
    let adminUser = await User.findOne({ email: 'admin@yatrik.com' });
    if (!adminUser) {
      adminUser = new User({
        name: 'Admin User',
        email: 'admin@yatrik.com',
        phone: '9876543210',
        password: 'admin123',
        role: 'admin',
        status: 'active'
      });
      await adminUser.save();
      console.log('Created admin user');
    }

    // Create depot
    let depot = await Depot.findOne({ depotName: 'Main Depot' });
    if (!depot) {
      depot = new Depot({
        depotName: 'Main Depot',
        depotCode: 'MD001',
        location: {
          address: '123 Main Street, Bangalore',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001'
        },
        contact: {
          phone: '9876543210',
          email: 'maindepot@yatrik.com'
        },
        operatingHours: {
          openTime: '06:00',
          closeTime: '22:00'
        },
        capacity: {
          totalBuses: 50,
          availableBuses: 45
        },
        createdBy: adminUser._id,
        status: 'active'
      });
      await depot.save();
      console.log('Created depot');
    }

    // Create route
    let route = await Route.findOne({ routeName: 'Vytila Hub to Idukki' });
    if (!route) {
      route = new Route({
        routeName: 'Vytila Hub to Idukki',
        routeNumber: 'KL02',
        startingPoint: {
          city: 'vytila hub',
          name: 'Vytila Hub',
          location: 'Vytila Hub Bus Stand'
        },
        endingPoint: {
          city: 'IDUKKI',
          name: 'Idukki',
          location: 'Idukki Bus Stand'
        },
        totalDistance: 100,
        estimatedDuration: 2,
        farePerKm: 3.45,
        baseFare: 50,
        depot: {
          depotId: depot._id,
          depotName: depot.depotName,
          depotLocation: depot.location.address
        },
        createdBy: adminUser._id,
        status: 'active'
      });
      await route.save();
      console.log('Created route');
    }

    // Create bus
    let bus = await Bus.findOne({ busNumber: 'KL02-AB-1234' });
    if (!bus) {
      bus = new Bus({
        busNumber: 'KL02-AB-1234',
        registrationNumber: 'KL02-AB-1234',
        depotId: depot._id,
        busType: 'ac_sleeper',
        capacity: {
          total: 30,
          seater: 10,
          sleeper: 20,
          ladies: 5,
          disabled: 3
        },
        amenities: ['ac', 'wifi', 'charging'],
        operatorName: 'Yatrik Travels',
        assignedBy: adminUser._id,
        status: 'active'
      });
      await bus.save();
      console.log('Created bus');
    }

    // Create trip for today
    const today = new Date();
    const serviceDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let trip = await Trip.findOne({ 
      routeId: route._id,
      serviceDate: serviceDate
    });
    
    if (!trip) {
      trip = new Trip({
        tripNumber: 'TRP-001',
        routeId: route._id,
        busId: bus._id,
        depotId: depot._id,
        startTime: '00:55',
        endTime: '02:01',
        serviceDate: serviceDate,
        fare: 345,
        capacity: 30,
        availableSeats: 30,
        bookedSeats: 0,
        status: 'scheduled',
        bookingOpen: true,
        createdBy: adminUser._id
      });
      await trip.save();
      console.log('Created trip for today');
    }

    console.log('Sample data creation completed!');
    process.exit(0);

  } catch (error) {
    console.error('Error creating sample data:', error);
    process.exit(1);
  }
}

addSampleData();

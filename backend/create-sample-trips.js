const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Trip = require('./models/Trip');
const Bus = require('./models/Bus');
const Route = require('./models/Route');
const Depot = require('./models/Depot');

async function createSampleData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('Connected to MongoDB');

    // Create a simple admin user first
    const User = require('./models/User');
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

    // Create sample depot
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
          phone: '+91-9876543210',
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
      console.log('Created sample depot');
    }

    // Create sample route
    let route = await Route.findOne({ routeName: 'Bangalore to Chennai' });
    if (!route) {
      route = new Route({
        routeName: 'Bangalore to Chennai',
        routeNumber: 'BC001',
        startingPoint: {
          city: 'Bangalore',
          location: 'Majestic Bus Stand',
          coordinates: { lat: 12.9772, lng: 77.5713 }
        },
        endingPoint: {
          city: 'Chennai',
          location: 'Chennai Central',
          coordinates: { lat: 13.0827, lng: 80.2707 }
        },
        distance: 350,
        estimatedDuration: 6,
        status: 'active'
      });
      await route.save();
      console.log('Created sample route');
    }

    // Create sample bus
    let bus = await Bus.findOne({ busNumber: 'KA01-AB-1234' });
    if (!bus) {
      bus = new Bus({
        busNumber: 'KA01-AB-1234',
        busType: 'AC Sleeper',
        capacity: {
          total: 30,
          seater: 10,
          sleeper: 20,
          ladies: 5,
          disabled: 3
        },
        amenities: ['AC', 'WiFi', 'Charging Points', 'Blankets'],
        operatorName: 'Yatrik Travels',
        status: 'active'
      });
      await bus.save();
      console.log('Created sample bus');
    }

    // Create sample trips for today and tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tripDates = [
      today.toISOString().split('T')[0],
      tomorrow.toISOString().split('T')[0]
    ];

    for (const date of tripDates) {
      // Check if trip already exists
      const existingTrip = await Trip.findOne({
        routeId: route._id,
        serviceDate: new Date(date)
      });

      if (!existingTrip) {
        const trip = new Trip({
          tripNumber: `TRP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          routeId: route._id,
          busId: bus._id,
          depotId: depot._id,
          startTime: '22:00',
          endTime: '06:00',
          serviceDate: new Date(date),
          fare: 800,
          capacity: bus.capacity.total,
          availableSeats: bus.capacity.total,
          bookedSeats: 0,
          status: 'scheduled',
          bookingOpen: true
        });

        await trip.save();
        console.log(`Created sample trip for ${date}`);
      }
    }

    console.log('Sample data creation completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error creating sample data:', error);
    process.exit(1);
  }
}

createSampleData();

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Trip = require('./models/Trip');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const Depot = require('./models/Depot');
const User = require('./models/User');

async function createSampleTrips() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('Connected to MongoDB');

    // Find or create a depot
    let depot = await Depot.findOne();
    if (!depot) {
      depot = await Depot.create({
        depotName: 'Kochi Central Depot',
        depotCode: 'KCD001',
        address: {
          street: 'MG Road',
          city: 'Kochi',
          state: 'Kerala',
          pincode: '682001',
          country: 'India'
        },
        contact: {
          phone: '+91-484-1234567',
          email: 'kochi@yatrik.com'
        },
        status: 'active',
        capacity: 50,
        facilities: ['parking', 'maintenance', 'fuel', 'canteen']
      });
      console.log('Created depot:', depot.depotName);
    }

    // Find or create routes
    const routes = [];
    const routeData = [
      {
        routeNumber: 'RT001',
        routeName: 'Kochi to Bangalore Express',
        startingPoint: { city: 'Kochi', state: 'Kerala' },
        endingPoint: { city: 'Bangalore', state: 'Karnataka' },
        intermediateStops: [
          { name: 'Thrissur', city: 'Thrissur', state: 'Kerala' },
          { name: 'Palakkad', city: 'Palakkad', state: 'Kerala' },
          { name: 'Coimbatore', city: 'Coimbatore', state: 'Tamil Nadu' }
        ],
        totalDistance: 550,
        estimatedDuration: 10,
        baseFare: 450,
        depot: { depotId: depot._id, depotName: depot.depotName }
      },
      {
        routeNumber: 'RT002',
        routeName: 'Kochi to Chennai Superfast',
        startingPoint: { city: 'Kochi', state: 'Kerala' },
        endingPoint: { city: 'Chennai', state: 'Tamil Nadu' },
        intermediateStops: [
          { name: 'Alappuzha', city: 'Alappuzha', state: 'Kerala' },
          { name: 'Kollam', city: 'Kollam', state: 'Kerala' },
          { name: 'Thiruvananthapuram', city: 'Thiruvananthapuram', state: 'Kerala' }
        ],
        totalDistance: 700,
        estimatedDuration: 12,
        baseFare: 600,
        depot: { depotId: depot._id, depotName: depot.depotName }
      },
      {
        routeNumber: 'RT003',
        routeName: 'Kochi to Mumbai Express',
        startingPoint: { city: 'Kochi', state: 'Kerala' },
        endingPoint: { city: 'Mumbai', state: 'Maharashtra' },
        intermediateStops: [
          { name: 'Goa', city: 'Panaji', state: 'Goa' },
          { name: 'Pune', city: 'Pune', state: 'Maharashtra' }
        ],
        totalDistance: 1200,
        estimatedDuration: 20,
        baseFare: 1200,
        depot: { depotId: depot._id, depotName: depot.depotName }
      }
    ];

    for (const routeInfo of routeData) {
      let route = await Route.findOne({ routeNumber: routeInfo.routeNumber });
      if (!route) {
        route = await Route.create(routeInfo);
        console.log('Created route:', route.routeName);
      }
      routes.push(route);
    }

    // Find or create buses
    const buses = [];
    const busData = [
      {
        busNumber: 'KL-01-AB-1234',
        busType: 'AC Sleeper',
        registrationNumber: 'KL01AB1234',
        capacity: { total: 35, sleeper: 35, seater: 0 },
        depotId: depot._id,
        status: 'available',
        amenities: ['AC', 'Sleeper', 'WiFi', 'Charging Points', 'Blanket']
      },
      {
        busNumber: 'KL-02-CD-5678',
        busType: 'Non-AC Seater',
        registrationNumber: 'KL02CD5678',
        capacity: { total: 45, sleeper: 0, seater: 45 },
        depotId: depot._id,
        status: 'available',
        amenities: ['Non-AC', 'Seater', 'Charging Points']
      },
      {
        busNumber: 'KL-03-EF-9012',
        busType: 'AC Seater',
        registrationNumber: 'KL03EF9012',
        capacity: { total: 40, sleeper: 0, seater: 40 },
        depotId: depot._id,
        status: 'available',
        amenities: ['AC', 'Seater', 'WiFi', 'Charging Points']
      }
    ];

    for (const busInfo of busData) {
      let bus = await Bus.findOne({ busNumber: busInfo.busNumber });
      if (!bus) {
        bus = await Bus.create(busInfo);
        console.log('Created bus:', bus.busNumber);
      }
      buses.push(bus);
    }

    // Find or create admin user
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.create({
        name: 'System Admin',
        email: 'admin@yatrik.com',
        phone: '+91-9999999999',
        password: 'admin123',
        role: 'admin',
        isActive: true
      });
      console.log('Created admin user');
    }

    // Create sample trips for the next 7 days
    const today = new Date();
    const trips = [];

    for (let day = 0; day < 7; day++) {
      const serviceDate = new Date(today);
      serviceDate.setDate(today.getDate() + day);
      serviceDate.setHours(0, 0, 0, 0);

      // Create trips for each route
      routes.forEach((route, routeIndex) => {
        buses.forEach((bus, busIndex) => {
          // Create 2 trips per day per route (morning and evening)
          const morningTrip = {
            routeId: route._id,
            busId: bus._id,
            serviceDate: serviceDate,
            startTime: '08:00',
            endTime: routeIndex === 0 ? '18:00' : routeIndex === 1 ? '20:00' : '04:00',
            fare: route.baseFare + (busIndex * 50), // Vary fare by bus type
            capacity: bus.capacity.total,
            availableSeats: bus.capacity.total,
            bookedSeats: 0,
            status: 'scheduled',
            depotId: depot._id,
            createdBy: admin._id,
            bookingOpen: true,
            notes: `Daily service - ${route.routeName}`
          };

          const eveningTrip = {
            routeId: route._id,
            busId: buses[(busIndex + 1) % buses.length]._id, // Use different bus
            serviceDate: serviceDate,
            startTime: '20:00',
            endTime: routeIndex === 0 ? '06:00' : routeIndex === 1 ? '08:00' : '16:00',
            fare: route.baseFare + (busIndex * 50) + 100, // Evening trips cost more
            capacity: buses[(busIndex + 1) % buses.length].capacity.total,
            availableSeats: buses[(busIndex + 1) % buses.length].capacity.total,
            bookedSeats: 0,
            status: 'scheduled',
            depotId: depot._id,
            createdBy: admin._id,
            bookingOpen: true,
            notes: `Evening service - ${route.routeName}`
          };

          trips.push(morningTrip, eveningTrip);
        });
      });
    }

    // Insert trips
    const createdTrips = await Trip.insertMany(trips);
    console.log(`Created ${createdTrips.length} trips for the next 7 days`);

    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Depot: ${depot.depotName}`);
    console.log(`Routes: ${routes.length}`);
    console.log(`Buses: ${buses.length}`);
    console.log(`Trips: ${createdTrips.length}`);
    console.log(`Admin User: ${admin.name} (${admin.email})`);
    
    console.log('\n=== SAMPLE TRIPS ===');
    createdTrips.slice(0, 5).forEach(trip => {
      console.log(`- ${trip.startTime} | ${routes.find(r => r._id.equals(trip.routeId))?.routeName} | ₹${trip.fare}`);
    });

    console.log('\n✅ Sample trips created successfully!');
    console.log('You can now test the passenger dashboard to see these trips.');

  } catch (error) {
    console.error('Error creating sample trips:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createSampleTrips();

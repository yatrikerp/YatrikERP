const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Trip = require('./models/Trip');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const Depot = require('./models/Depot');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');

async function createMLData() {
  try {
    console.log('🚀 Creating ML test data...');

    // Get or create admin user
    let adminUser = await User.findOne({ email: 'admin@yatrik.com' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Admin',
        email: 'admin@yatrik.com',
        password: 'admin123',
        role: 'admin',
        phone: '+91-9876543210',
        isActive: true
      });
    }

    // Get or create depot
    let depot = await Depot.findOne();
    if (!depot) {
      depot = await Depot.create({
        depotCode: 'DP001',
        depotName: 'Central Depot',
        location: {
          city: 'Mumbai',
          state: 'Maharashtra',
          address: '123 Main St'
        },
        status: 'active',
        createdBy: adminUser._id
      });
    }

    // Clear old test data
    await Booking.deleteMany({});
    await Trip.deleteMany({});
    console.log('✅ Cleared old data');

    // Create routes
    const routes = await Route.create([
      {
        routeName: 'Mumbai - Pune',
        routeNumber: 'MP001',
        startingPoint: { city: 'Mumbai', location: { lat: 19.0760, lng: 72.8777 } },
        endingPoint: { city: 'Pune', location: { lat: 18.5204, lng: 73.8567 } },
        totalDistance: 150,
        farePerKm: 2.5,
        estimatedDuration: '3h',
        status: 'active',
        schedules: [
          { startTime: '08:00', endTime: '11:00' },
          { startTime: '14:00', endTime: '17:00' },
          { startTime: '20:00', endTime: '23:00' }
        ],
        stops: [
          {
            stopId: 'S001',
            stopName: 'Mumbai Central',
            city: 'Mumbai',
            location: { lat: 19.0760, lng: 72.8777 },
            distanceFromStart: 0,
            distanceFromPrev: 0,
            stopNumber: 1
          },
          {
            stopId: 'S002',
            stopName: 'Pune Junction',
            city: 'Pune',
            location: { lat: 18.5204, lng: 73.8567 },
            distanceFromStart: 150,
            distanceFromPrev: 150,
            stopNumber: 2
          }
        ],
        createdBy: adminUser._id
      },
      {
        routeName: 'Mumbai - Nashik',
        routeNumber: 'MN001',
        startingPoint: { city: 'Mumbai', location: { lat: 19.0760, lng: 72.8777 } },
        endingPoint: { city: 'Nashik', location: { lat: 19.9975, lng: 73.7898 } },
        totalDistance: 160,
        farePerKm: 2.0,
        estimatedDuration: '4h',
        status: 'active',
        schedules: [
          { startTime: '07:00', endTime: '11:00' },
          { startTime: '15:00', endTime: '19:00' }
        ],
        stops: [
          {
            stopId: 'S003',
            stopName: 'Mumbai Central',
            city: 'Mumbai',
            location: { lat: 19.0760, lng: 72.8777 },
            distanceFromStart: 0,
            distanceFromPrev: 0,
            stopNumber: 1
          },
          {
            stopId: 'S004',
            stopName: 'Nashik City',
            city: 'Nashik',
            location: { lat: 19.9975, lng: 73.7898 },
            distanceFromStart: 160,
            distanceFromPrev: 160,
            stopNumber: 2
          }
        ],
        createdBy: adminUser._id
      }
    ]);
    console.log('✅ Created 2 routes');

    // Create buses
    const buses = await Bus.create([
      {
        busNumber: 'KL01AB1234',
        busType: 'ac_sleeper',
        capacity: { total: 40, sleeper: 20, seater: 20 },
        status: 'active',
        depotId: depot._id,
        createdBy: adminUser._id
      },
      {
        busNumber: 'KL02CD5678',
        busType: 'ac_seater',
        capacity: { total: 50, seater: 50 },
        status: 'active',
        depotId: depot._id,
        createdBy: adminUser._id
      }
    ]);
    console.log('✅ Created 2 buses');

    // Create trips for the next 30 days
    const trips = [];
    const today = new Date();
    
    for (let day = 0; day < 30; day++) {
      const tripDate = new Date(today);
      tripDate.setDate(today.getDate() + day);
      
      const schedules = [
        { time: '08:00', end: '11:00' },
        { time: '14:00', end: '17:00' },
        { time: '20:00', end: '23:00' }
      ];
      
      for (const sched of schedules) {
        trips.push({
          route: routes[0]._id,
          bus: buses[0]._id,
          depot: depot._id,
          date: tripDate,
          startTime: sched.time,
          endTime: sched.end,
          fare: 375,
          totalSeats: 40,
          availableSeats: Math.floor(Math.random() * 30) + 5,
          status: day === 0 ? 'in_progress' : 'scheduled',
          createdBy: adminUser._id
        });
      }
      
      for (const sched of [{ time: '07:00', end: '11:00' }]) {
        trips.push({
          route: routes[1]._id,
          bus: buses[1]._id,
          depot: depot._id,
          date: tripDate,
          startTime: sched.time,
          endTime: sched.end,
          fare: 320,
          totalSeats: 50,
          availableSeats: Math.floor(Math.random() * 40) + 5,
          status: day === 0 ? 'scheduled' : 'scheduled',
          createdBy: adminUser._id
        });
      }
    }
    
    const createdTrips = await Trip.insertMany(trips);
    console.log(`✅ Created ${createdTrips.length} trips`);

    // Create bookings with varied data
    const bookings = [];
    const passengers = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Williams', 'Carol Davis'];
    
    for (const trip of createdTrips.slice(0, 100)) { // Create bookings for first 100 trips
      const numBookings = Math.floor(Math.random() * 8) + 1; // 1-8 bookings per trip
      
      for (let i = 0; i < numBookings; i++) {
        const passengerName = passengers[Math.floor(Math.random() * passengers.length)];
        const bookingDate = new Date(trip.date);
        bookingDate.setHours(bookingDate.getHours() - Math.floor(Math.random() * 48));
        
        bookings.push({
          trip: trip._id,
          route: trip.route,
          bus: trip.bus,
          depot: trip.depot,
          passenger: {
            name: passengerName,
            email: `${passengerName.toLowerCase().replace(' ', '.')}@example.com`,
            phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            age: Math.floor(Math.random() * 50) + 18
          },
          seats: [{ seatNumber: `A${i + 1}`, seatType: 'seater' }],
          fare: trip.fare,
          status: 'confirmed',
          paymentStatus: 'paid',
          createdAt: bookingDate,
          createdBy: adminUser._id
        });
      }
    }
    
    const createdBookings = await Booking.insertMany(bookings);
    console.log(`✅ Created ${createdBookings.length} bookings`);

    console.log('\n🎉 ML Test Data Created Successfully!');
    console.log(`📊 Routes: ${routes.length}`);
    console.log(`🚌 Buses: ${buses.length}`);
    console.log(`🗓️  Trips: ${createdTrips.length}`);
    console.log(`🎫 Bookings: ${createdBookings.length}`);
    console.log('\n✅ Ready to run ML models!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createMLData();


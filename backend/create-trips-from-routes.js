const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Trip = require('./models/Trip');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const Depot = require('./models/Depot');
const User = require('./models/User');

async function createTripsFromRoutes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('Connected to MongoDB');

    console.log('\n🚌 CREATING TRIPS FROM EXISTING ROUTES');
    console.log('=====================================');

    // Get all active Kerala routes
    const routes = await Route.find({ 
      status: 'active',
      $or: [
        { 'startingPoint.city': { $regex: /kochi|thiruvananthapuram|kollam|kottayam|palakkad|malappuram|kannur|kasargod|wayanad|thrissur|ernakulam|alappuzha|pathanamthitta|idukki/i } },
        { 'endingPoint.city': { $regex: /kochi|thiruvananthapuram|kollam|kottayam|palakkad|malappuram|kannur|kasargod|wayanad|thrissur|ernakulam|alappuzha|pathanamthitta|idukki/i } },
        { routeName: { $regex: /kochi|thiruvananthapuram|kollam|kottayam|palakkad|malappuram|kannur|kasargod|wayanad|thrissur|ernakulam|alappuzha|pathanamthitta|idukki/i } }
      ]
    })
      .populate('depot', 'depotName')
      .lean();
    
    console.log(`\n📋 Found ${routes.length} active routes:`);
    routes.forEach((route, index) => {
      console.log(`${index + 1}. ${route.routeNumber}: ${route.routeName}`);
      console.log(`   From: ${route.startingPoint?.city || route.startingPoint}`);
      console.log(`   To: ${route.endingPoint?.city || route.endingPoint}`);
      console.log(`   Distance: ${route.totalDistance || 'N/A'} km`);
      console.log(`   Base Fare: ₹${route.baseFare || 'N/A'}`);
      console.log(`   Depot: ${route.depot?.depotName || 'Unknown'}`);
      console.log('');
    });

    if (routes.length === 0) {
      console.log('❌ No active routes found. Please create routes first.');
      return;
    }

    // Get available buses
    const buses = await Bus.find({ status: 'active' }).lean();
    
    console.log(`\n🚌 Found ${buses.length} available buses:`);
    buses.forEach((bus, index) => {
      console.log(`${index + 1}. ${bus.busNumber} (${bus.busType})`);
      console.log(`   Capacity: ${bus.capacity?.total || 'N/A'} seats`);
      console.log(`   Registration: ${bus.registrationNumber || 'N/A'}`);
      console.log('');
    });

    if (buses.length === 0) {
      console.log('❌ No available buses found. Please add buses first.');
      return;
    }

    // Get admin user
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
      console.log('✅ Created admin user');
    }

    // Create trips for next 7 days
    const days = 7;
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);

    const trips = [];
    let busIndex = 0;

    console.log(`\n📅 Creating trips for next ${days} days starting from ${baseDate.toLocaleDateString()}`);

    for (let day = 0; day < days; day++) {
      const serviceDate = new Date(baseDate);
      serviceDate.setDate(baseDate.getDate() + day);

      console.log(`\n📆 Day ${day + 1}: ${serviceDate.toLocaleDateString()}`);

      routes.forEach((route, routeIndex) => {
        // Assign buses in round-robin fashion
        const bus = buses[busIndex % buses.length];
        busIndex++;

        // Create morning trip
        const morningTrip = {
          routeId: route._id,
          busId: bus._id,
          serviceDate: serviceDate,
          startTime: '08:00',
          endTime: '18:00', // Default 10-hour journey
          fare: route.baseFare || 500,
          capacity: bus.capacity?.total || 35,
          availableSeats: bus.capacity?.total || 35,
          bookedSeats: 0,
          status: 'scheduled',
          depotId: route.depot?._id,
          createdBy: admin._id,
          bookingOpen: true,
          notes: `Auto-generated morning trip for ${route.routeName}`
        };

        // Create evening trip
        const eveningTrip = {
          routeId: route._id,
          busId: buses[(busIndex) % buses.length]._id,
          serviceDate: serviceDate,
          startTime: '20:00',
          endTime: '06:00', // Next day arrival
          fare: (route.baseFare || 500) + 100, // Evening trips cost more
          capacity: buses[(busIndex) % buses.length].capacity?.total || 35,
          availableSeats: buses[(busIndex) % buses.length].capacity?.total || 35,
          bookedSeats: 0,
          status: 'scheduled',
          depotId: route.depot?._id,
          createdBy: admin._id,
          bookingOpen: true,
          notes: `Auto-generated evening trip for ${route.routeName}`
        };

        trips.push(morningTrip, eveningTrip);
        busIndex++; // Increment for evening trip bus

        console.log(`   ✅ ${route.routeNumber}: Morning (08:00) & Evening (20:00) trips`);
      });
    }

    // Insert all trips
    const createdTrips = await Trip.insertMany(trips);

    console.log(`\n🎉 SUCCESS! Created ${createdTrips.length} trips`);
    console.log(`📊 Summary:`);
    console.log(`- Routes used: ${routes.length}`);
    console.log(`- Buses used: ${buses.length}`);
    console.log(`- Days covered: ${days}`);
    console.log(`- Trips per route per day: 2 (morning + evening)`);
    console.log(`- Total trips created: ${createdTrips.length}`);

    console.log(`\n📋 Sample trips created:`);
    createdTrips.slice(0, 5).forEach((trip, index) => {
      const route = routes.find(r => r._id.equals(trip.routeId));
      console.log(`${index + 1}. ${route?.routeName || 'Unknown Route'}`);
      console.log(`   Date: ${new Date(trip.serviceDate).toLocaleDateString()}`);
      console.log(`   Time: ${trip.startTime} - ${trip.endTime}`);
      console.log(`   Fare: ₹${trip.fare}`);
      console.log(`   Status: ${trip.status}`);
      console.log(`   Booking Open: ${trip.bookingOpen ? 'Yes' : 'No'}`);
      console.log('');
    });

    console.log('✅ All trips created successfully!');
    console.log('🚌 Passengers can now search and book these trips.');

  } catch (error) {
    console.error('❌ Error creating trips from routes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createTripsFromRoutes();

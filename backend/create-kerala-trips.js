const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Trip = require('./models/Trip');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const User = require('./models/User');

async function createKeralaTrips() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('Connected to MongoDB');

    console.log('\n🚌 CREATING KERALA TRIPS');
    console.log('========================');

    // Get Kerala routes (Kochi to Kollam route)
    const keralaRoutes = await Route.find({ 
      status: 'active',
      $or: [
        { 'startingPoint.city': { $regex: /kochi/i } },
        { 'endingPoint.city': { $regex: /kollam/i } },
        { routeName: { $regex: /kochi|kollam/i } }
      ]
    })
      .populate('depot', 'depotName')
      .lean();
    
    console.log(`\n📋 Found ${keralaRoutes.length} Kerala routes:`);
    keralaRoutes.forEach((route, index) => {
      console.log(`${index + 1}. ${route.routeNumber}: ${route.routeName}`);
      console.log(`   From: ${route.startingPoint?.city || route.startingPoint}`);
      console.log(`   To: ${route.endingPoint?.city || route.endingPoint}`);
      console.log(`   Depot: ${route.depot?.depotName || 'Unknown'}`);
    });

    if (keralaRoutes.length === 0) {
      console.log('❌ No Kerala routes found.');
      return;
    }

    // Get available buses
    const buses = await Bus.find({ status: 'active' }).limit(10).lean();
    
    console.log(`\n🚌 Found ${buses.length} available buses`);

    if (buses.length === 0) {
      console.log('❌ No available buses found.');
      return;
    }

    // Get admin user
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ No admin user found.');
      return;
    }

    // Create trips for next 5 days
    const days = 5;
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);

    const trips = [];
    let busIndex = 0;

    console.log(`\n📅 Creating trips for next ${days} days`);

    for (let day = 0; day < days; day++) {
      const serviceDate = new Date(baseDate);
      serviceDate.setDate(baseDate.getDate() + day);

      keralaRoutes.forEach((route) => {
        const bus = buses[busIndex % buses.length];
        busIndex++;

        // Create morning trip
        const morningTrip = {
          routeId: route._id,
          busId: bus._id,
          serviceDate: serviceDate,
          startTime: '08:00',
          endTime: '14:00',
          fare: route.baseFare || 200,
          capacity: bus.capacity?.total || 40,
          availableSeats: bus.capacity?.total || 40,
          bookedSeats: 0,
          status: 'scheduled',
          depotId: route.depot?._id,
          createdBy: admin._id,
          bookingOpen: true,
          notes: `Kerala morning trip - ${route.routeName}`
        };

        trips.push(morningTrip);
        console.log(`   ✅ ${route.routeNumber}: Morning trip (08:00-14:00) for ${serviceDate.toLocaleDateString()}`);
      });
    }

    // Insert all trips
    const createdTrips = await Trip.insertMany(trips);

    console.log(`\n🎉 SUCCESS! Created ${createdTrips.length} Kerala trips`);
    console.log(`📊 Summary:`);
    console.log(`- Routes used: ${keralaRoutes.length}`);
    console.log(`- Days covered: ${days}`);
    console.log(`- Total trips created: ${createdTrips.length}`);

    console.log('✅ Kerala trips created successfully!');

  } catch (error) {
    console.error('❌ Error creating Kerala trips:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createKeralaTrips();

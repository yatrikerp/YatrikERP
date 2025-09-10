const mongoose = require('mongoose');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const Trip = require('./models/Trip');
const Depot = require('./models/Depot');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createSimpleTrip() {
  try {
    console.log('🚌 Creating simple trip...');

    // First, let's see what we have
    const routes = await Route.find({}).lean();
    const buses = await Bus.find({}).lean();
    const depots = await Depot.find({}).lean();
    const users = await User.find({ role: 'admin' }).lean();

    console.log('📊 Database status:');
    console.log(`  Routes: ${routes.length}`);
    console.log(`  Buses: ${buses.length}`);
    console.log(`  Depots: ${depots.length}`);
    console.log(`  Admin users: ${users.length}`);

    if (routes.length === 0) {
      console.log('❌ No routes found. Creating a simple route...');
      
      // Create a simple route
      const route = new Route({
        routeNumber: 'TEST-001',
        routeName: 'Mumbai to Pune Express',
        startingPoint: {
          city: 'Mumbai',
          location: 'Mumbai Central',
          coordinates: { latitude: 19.0760, longitude: 72.8777 }
        },
        endingPoint: {
          city: 'Pune',
          location: 'Pune Station',
          coordinates: { latitude: 18.5204, longitude: 73.8567 }
        },
        totalDistance: 150,
        estimatedDuration: 180,
        baseFare: 200,
        farePerKm: 2,
        depot: {
          depotId: depots[0]?._id || new mongoose.Types.ObjectId(),
          depotName: depots[0]?.depotName || 'Test Depot',
          depotLocation: depots[0]?.location?.city || 'Mumbai'
        },
        schedules: [{
          scheduleId: `SCH_TEST-001_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          departureTime: '08:00',
          arrivalTime: '12:00',
          frequency: 'daily',
          daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          isActive: true,
          createdBy: users[0]?._id || new mongoose.Types.ObjectId()
        }],
        status: 'active',
        createdBy: users[0]?._id || new mongoose.Types.ObjectId()
      });
      
      await route.save();
      console.log('✅ Created route:', route.routeName);
    }

    if (buses.length === 0) {
      console.log('❌ No buses found. Creating a simple bus...');
      
      // Create a simple bus
      const bus = new Bus({
        busNumber: 'TEST-BUS-001',
        registrationNumber: 'TEST-001-AB-1234',
        depotId: depots[0]?._id || new mongoose.Types.ObjectId(),
        busType: 'ac_seater',
        capacity: {
          total: 40,
          seater: 40,
          sleeper: 0
        },
        amenities: ['ac', 'wifi'],
        status: 'active',
        assignedBy: users[0]?._id || new mongoose.Types.ObjectId()
      });
      
      await bus.save();
      console.log('✅ Created bus:', bus.busNumber);
    }

    if (depots.length === 0) {
      console.log('❌ No depots found. Creating a simple depot...');
      
      // Create a simple depot
      const depot = new Depot({
        depotName: 'Test Depot',
        depotCode: 'TEST001',
        location: {
          city: 'Mumbai',
          state: 'Maharashtra',
          address: 'Test Address'
        },
        contact: {
          phone: '+91-98765-43210',
          email: 'test@depot.com'
        },
        capacity: {
          totalBuses: 10,
          availableBuses: 10,
          maintenanceBuses: 0
        },
        operatingHours: {
          openTime: '06:00',
          closeTime: '22:00',
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        status: 'active'
      });
      
      await depot.save();
      console.log('✅ Created depot:', depot.depotName);
    }

    // Now get the latest data
    const latestRoutes = await Route.find({}).lean();
    const latestBuses = await Bus.find({}).lean();
    const latestDepots = await Depot.find({}).lean();
    const latestUsers = await User.find({ role: 'admin' }).lean();

    // Create a trip for today
    const today = new Date();
    const trip = new Trip({
      routeId: latestRoutes[0]._id,
      busId: latestBuses[0]._id,
      depotId: latestDepots[0]._id,
      serviceDate: today,
      startTime: '08:00',
      endTime: '12:00',
      fare: 250,
      capacity: latestBuses[0].capacity.total,
      availableSeats: latestBuses[0].capacity.total,
      bookedSeats: 0,
      status: 'scheduled',
      createdBy: latestUsers[0]?._id || new mongoose.Types.ObjectId(),
      notes: 'Test trip for today'
    });

    await trip.save();
    console.log('✅ Created trip for today:', trip._id);

    // Create a trip for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tomorrowTrip = new Trip({
      routeId: latestRoutes[0]._id,
      busId: latestBuses[0]._id,
      depotId: latestDepots[0]._id,
      serviceDate: tomorrow,
      startTime: '14:00',
      endTime: '18:00',
      fare: 300,
      capacity: latestBuses[0].capacity.total,
      availableSeats: latestBuses[0].capacity.total,
      bookedSeats: 0,
      status: 'scheduled',
      createdBy: latestUsers[0]?._id || new mongoose.Types.ObjectId(),
      notes: 'Test trip for tomorrow'
    });

    await tomorrowTrip.save();
    console.log('✅ Created trip for tomorrow:', tomorrowTrip._id);

    console.log('\n🎉 Sample data created successfully!');
    console.log('You can now test the passenger dashboard search.');

  } catch (error) {
    console.error('❌ Error creating simple trip:', error);
  } finally {
    mongoose.connection.close();
  }
}

createSimpleTrip();

const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Depot = require('../models/Depot');
const User = require('../models/User');
require('dotenv').config();

const checkExistingData = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check buses
    const buses = await Bus.find({}).populate('depotId', 'depotName depotCode');
    console.log(`🚌 Found ${buses.length} buses:`);
    buses.forEach(bus => {
      console.log(`   - ${bus.busNumber} (${bus.busType}) - Status: ${bus.status} - Depot: ${bus.depotId ? bus.depotId.depotName : 'No Depot'}`);
    });

    // Check routes
    const routes = await Route.find({});
    console.log(`🛣️ Found ${routes.length} routes:`);
    routes.forEach(route => {
      console.log(`   - ${route.routeNumber}: ${route.routeName} - Status: ${route.status}`);
    });

    // Check depots
    const depots = await Depot.find({});
    console.log(`🏢 Found ${depots.length} depots:`);
    depots.forEach(depot => {
      console.log(`   - ${depot.depotName} (${depot.depotCode}) - Status: ${depot.status}`);
    });

    // Check users (drivers/conductors)
    const drivers = await User.find({ role: 'driver' });
    const conductors = await User.find({ role: 'conductor' });
    console.log(`👥 Found ${drivers.length} drivers and ${conductors.length} conductors`);

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

checkExistingData();

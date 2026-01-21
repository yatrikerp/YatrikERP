const mongoose = require('mongoose');
const Depot = require('../models/Depot');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');
const Duty = require('../models/Duty');
const DepotUser = require('../models/DepotUser');
require('dotenv').config();

async function verifyKCHData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrikerp_final', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Find KCH depot
    const kchDepot = await Depot.findOne({ $or: [{ depotCode: 'KCH' }, { code: 'KCH' }] });
    if (!kchDepot) {
      console.log('❌ KCH Depot not found!');
      process.exit(1);
    }
    console.log(`📋 KCH Depot: ${kchDepot.depotName} (${kchDepot._id})\n`);

    // Check depot user
    const depotUser = await DepotUser.findOne({ email: 'kch-depot@yatrik.com' });
    if (depotUser) {
      console.log(`✅ Depot User: ${depotUser.email}`);
      console.log(`   DepotId: ${depotUser.depotId}`);
      console.log(`   Matches KCH: ${depotUser.depotId?.toString() === kchDepot._id.toString()}\n`);
    } else {
      console.log('❌ Depot User not found!\n');
    }

    // Count data
    const busCount = await Bus.countDocuments({ depotId: kchDepot._id });
    const routeCount = await Route.countDocuments({
      $or: [
        { 'depot.depotId': kchDepot._id },
        { depotId: kchDepot._id }
      ]
    });
    const tripCount = await Trip.countDocuments({ depotId: kchDepot._id });
    const driverCount = await Driver.countDocuments({ depotId: kchDepot._id });
    const conductorCount = await Conductor.countDocuments({ depotId: kchDepot._id });
    const dutyCount = await Duty.countDocuments({ depotId: kchDepot._id });

    console.log('📊 Data Counts:');
    console.log(`   Buses: ${busCount}`);
    console.log(`   Routes: ${routeCount}`);
    console.log(`   Trips: ${tripCount}`);
    console.log(`   Drivers: ${driverCount}`);
    console.log(`   Conductors: ${conductorCount}`);
    console.log(`   Duty Assignments: ${dutyCount}\n`);

    // Show sample data
    if (busCount > 0) {
      const sampleBus = await Bus.findOne({ depotId: kchDepot._id });
      console.log('🚌 Sample Bus:', sampleBus?.busNumber || 'N/A');
    }
    if (routeCount > 0) {
      const sampleRoute = await Route.findOne({
        $or: [
          { 'depot.depotId': kchDepot._id },
          { depotId: kchDepot._id }
        ]
      });
      console.log('🛣️  Sample Route:', sampleRoute?.routeName || 'N/A');
    }
    if (tripCount > 0) {
      const sampleTrip = await Trip.findOne({ depotId: kchDepot._id });
      console.log('🚍 Sample Trip:', sampleTrip?.tripNumber || 'N/A');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

verifyKCHData();

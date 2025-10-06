const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/User');
const Trip = require('./models/Trip');
const Bus = require('./models/Bus');
const Depot = require('./models/Depot');
const Conductor = require('./models/Conductor');
const Driver = require('./models/Driver');
const Route = require('./models/Route');

async function checkData() {
  try {
    console.log('🔍 Checking database data...');
    
    const counts = await Promise.all([
      User.countDocuments(),
      Trip.countDocuments(),
      Bus.countDocuments(),
      Depot.countDocuments(),
      Conductor.countDocuments(),
      Driver.countDocuments(),
      Route.countDocuments()
    ]);
    
    console.log('📊 Database counts:');
    console.log('Users:', counts[0]);
    console.log('Trips:', counts[1]);
    console.log('Buses:', counts[2]);
    console.log('Depots:', counts[3]);
    console.log('Conductors:', counts[4]);
    console.log('Drivers:', counts[5]);
    console.log('Routes:', counts[6]);
    
    // Get sample data
    console.log('\n📋 Sample data:');
    
    const sampleTrip = await Trip.findOne().populate('routeId busId driverId conductorId');
    console.log('Sample Trip:', sampleTrip ? {
      id: sampleTrip._id,
      route: sampleTrip.routeId?.routeName || 'No route',
      bus: sampleTrip.busId?.busNumber || 'No bus',
      status: sampleTrip.status,
      date: sampleTrip.serviceDate
    } : 'No trips found');
    
    const sampleBus = await Bus.findOne().populate('depotId');
    console.log('Sample Bus:', sampleBus ? {
      id: sampleBus._id,
      number: sampleBus.busNumber,
      depot: sampleBus.depotId?.depotName || 'No depot',
      status: sampleBus.status
    } : 'No buses found');
    
    const sampleDepot = await Depot.findOne();
    console.log('Sample Depot:', sampleDepot ? {
      id: sampleDepot._id,
      name: sampleDepot.depotName,
      code: sampleDepot.depotCode,
      status: sampleDepot.status
    } : 'No depots found');
    
    const sampleConductor = await Conductor.findOne().populate('depotId');
    console.log('Sample Conductor:', sampleConductor ? {
      id: sampleConductor._id,
      name: sampleConductor.name,
      conductorId: sampleConductor.conductorId,
      depot: sampleConductor.depotId?.depotName || 'No depot',
      status: sampleConductor.status
    } : 'No conductors found');
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkData();

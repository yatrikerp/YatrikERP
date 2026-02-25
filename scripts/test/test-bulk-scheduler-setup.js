const mongoose = require('mongoose');
const Driver = require('./backend/models/Driver');
const Conductor = require('./backend/models/Conductor');
const Depot = require('./backend/models/Depot');
const Route = require('./backend/models/Route');
const Bus = require('./backend/models/Bus');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
const connectionUri = process.env.MONGODB_URI;

if (!connectionUri) {
  console.error('❌ MONGODB_URI environment variable is required. Please set it in your .env file.');
  process.exit(1);
}

console.log('🔍 Diagnosing Bulk Trip Scheduler Setup...\n');

mongoose.connect(connectionUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

async function diagnoseSetup() {
  try {
    console.log('📊 Checking system readiness...\n');
    
    // Check depots
    const depotCount = await Depot.countDocuments({ isActive: true });
    console.log(`🏢 Active Depots: ${depotCount}`);
    
    // Check drivers
    const driverCount = await Driver.countDocuments({ status: 'active' });
    console.log(`👨‍✈️ Active Drivers: ${driverCount}`);
    
    // Check conductors
    const conductorCount = await Conductor.countDocuments({ status: 'active' });
    console.log(`🎫 Active Conductors: ${conductorCount}`);
    
    // Check routes
    const routeCount = await Route.countDocuments({ isActive: true });
    console.log(`🛣️ Active Routes: ${routeCount}`);
    
    // Check buses
    const busCount = await Bus.countDocuments({ status: 'active' });
    console.log(`🚌 Active Buses: ${busCount}`);
    
    console.log('\n📋 Readiness Analysis:');
    
    // Depot readiness
    const depotReadiness = depotCount >= 10 ? '✅ Ready' : '❌ Need more depots';
    console.log(`   Depots: ${depotReadiness} (${depotCount}/10+)`);
    
    // Crew readiness (need at least 20 per depot)
    const minCrewNeeded = depotCount * 20;
    const totalCrew = driverCount + conductorCount;
    const crewReadiness = totalCrew >= minCrewNeeded ? '✅ Ready' : '❌ Need more crew';
    console.log(`   Crew: ${crewReadiness} (${totalCrew}/${minCrewNeeded})`);
    
    // Route readiness
    const routeReadiness = routeCount >= depotCount ? '✅ Ready' : '❌ Need more routes';
    console.log(`   Routes: ${routeReadiness} (${routeCount}/${depotCount}+)`);
    
    // Bus readiness
    const busReadiness = busCount >= depotCount ? '✅ Ready' : '❌ Need more buses';
    console.log(`   Buses: ${busReadiness} (${busCount}/${depotCount}+)`);
    
    // Overall readiness
    const isReady = depotCount >= 10 && totalCrew >= minCrewNeeded && routeCount >= depotCount && busCount >= depotCount;
    
    console.log('\n🎯 Overall Status:');
    if (isReady) {
      console.log('✅ SYSTEM READY FOR BULK TRIP SCHEDULING!');
      console.log(`📈 Can generate up to ${depotCount * 30 * 20} trips (${depotCount} depots × 30 days × 20 trips/day)`);
    } else {
      console.log('❌ SYSTEM NOT READY - Missing components');
      console.log('🔧 Please ensure all requirements are met before scheduling');
    }
    
    // Show sample data
    if (depotCount > 0) {
      console.log('\n📝 Sample Depot:');
      const sampleDepot = await Depot.findOne({ isActive: true }).populate('createdBy', 'name email');
      console.log(`   Name: ${sampleDepot.depotName} (${sampleDepot.depotCode})`);
      console.log(`   Location: ${sampleDepot.location.city}, ${sampleDepot.location.state}`);
      console.log(`   Capacity: ${sampleDepot.capacity.totalBuses} buses`);
    }
    
    if (driverCount > 0) {
      console.log('\n👨‍✈️ Sample Driver:');
      const sampleDriver = await Driver.findOne({ status: 'active' }).populate('depotId', 'depotName depotCode');
      console.log(`   Name: ${sampleDriver.name}`);
      console.log(`   Depot: ${sampleDriver.depotId.depotName} (${sampleDriver.depotId.depotCode})`);
      console.log(`   License: ${sampleDriver.drivingLicense.licenseNumber}`);
    }
    
    if (conductorCount > 0) {
      console.log('\n🎫 Sample Conductor:');
      const sampleConductor = await Conductor.findOne({ status: 'active' }).populate('depotId', 'depotName depotCode');
      console.log(`   Name: ${sampleConductor.name}`);
      console.log(`   Depot: ${sampleConductor.depotId.depotName} (${sampleConductor.depotId.depotCode})`);
      console.log(`   Employee Code: ${sampleConductor.employeeCode}`);
    }
    
    console.log('\n🚀 Next Steps:');
    if (isReady) {
      console.log('1. Open http://localhost:5173');
      console.log('2. Login as admin');
      console.log('3. Go to Trip Management');
      console.log('4. Click "Bulk Scheduler"');
      console.log('5. Configure and generate trips!');
    } else {
      console.log('1. Fix the missing components above');
      console.log('2. Run the setup scripts to create missing data');
      console.log('3. Re-run this diagnostic');
    }
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    mongoose.disconnect();
  }
}

diagnoseSetup();

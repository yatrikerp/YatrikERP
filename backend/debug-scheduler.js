const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Bus = require('./models/Bus');
const Route = require('./models/Route');
const Trip = require('./models/Trip');
const User = require('./models/User');
const Depot = require('./models/Depot');

async function debugScheduler() {
  try {
    console.log('🔍 Debugging Auto Scheduler - Checking Database Data...\n');
    
    // Check buses
    const buses = await Bus.find({ status: 'active' }).populate('depotId', 'depotName').lean();
    console.log(`🚌 Active Buses: ${buses.length}`);
    if (buses.length > 0) {
      console.log('   Sample buses:', buses.slice(0, 3).map(b => ({ 
        id: b._id, 
        number: b.busNumber, 
        depot: b.depotId?.depotName || 'No depot',
        capacity: b.capacity?.total || 'No capacity'
      })));
    }
    
    // Check routes
    const routes = await Route.find({ status: 'active', isActive: true }).populate('depot.depotId', 'depotName').lean();
    console.log(`🛣️ Active Routes: ${routes.length}`);
    if (routes.length > 0) {
      console.log('   Sample routes:', routes.slice(0, 3).map(r => ({ 
        id: r._id, 
        number: r.routeNumber, 
        name: r.routeName,
        depot: r.depot?.depotId?.depotName || 'No depot',
        baseFare: r.baseFare
      })));
    }
    
    // Check drivers
    const drivers = await User.find({ role: 'driver', status: 'active' }).select('_id name depotId').lean();
    console.log(`👨‍💼 Active Drivers: ${drivers.length}`);
    if (drivers.length > 0) {
      console.log('   Sample drivers:', drivers.slice(0, 3).map(d => ({ 
        id: d._id, 
        name: d.name,
        depot: d.depotId || 'No depot'
      })));
    }
    
    // Check conductors
    const conductors = await User.find({ role: 'conductor', status: 'active' }).select('_id name depotId').lean();
    console.log(`👨‍✈️ Active Conductors: ${conductors.length}`);
    if (conductors.length > 0) {
      console.log('   Sample conductors:', conductors.slice(0, 3).map(c => ({ 
        id: c._id, 
        name: c.name,
        depot: c.depotId || 'No depot'
      })));
    }
    
    // Check depots
    const depots = await Depot.find({}).lean();
    console.log(`🏢 Total Depots: ${depots.length}`);
    if (depots.length > 0) {
      console.log('   Sample depots:', depots.slice(0, 3).map(d => ({ 
        id: d._id, 
        name: d.depotName || d.name
      })));
    }
    
    // Check existing trips for today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const existingTrips = await Trip.find({
      serviceDate: { $gte: startOfDay, $lt: endOfDay }
    }).lean();
    console.log(`📅 Trips for today: ${existingTrips.length}`);
    
    // Analyze the issue
    console.log('\n🔍 Analysis:');
    
    if (buses.length === 0) {
      console.log('❌ No active buses found - this is likely the main issue');
    }
    
    if (routes.length === 0) {
      console.log('❌ No active routes found - this is likely the main issue');
    }
    
    if (drivers.length === 0) {
      console.log('⚠️ No active drivers found - trips will be created without crew assignment');
    }
    
    if (conductors.length === 0) {
      console.log('⚠️ No active conductors found - trips will be created without crew assignment');
    }
    
    // Check depot relationships
    console.log('\n🔗 Depot Relationships:');
    const busesWithDepot = buses.filter(b => b.depotId);
    const routesWithDepot = routes.filter(r => r.depot?.depotId);
    const driversWithDepot = drivers.filter(d => d.depotId);
    const conductorsWithDepot = conductors.filter(c => c.depotId);
    
    console.log(`   Buses with depot: ${busesWithDepot.length}/${buses.length}`);
    console.log(`   Routes with depot: ${routesWithDepot.length}/${routes.length}`);
    console.log(`   Drivers with depot: ${driversWithDepot.length}/${drivers.length}`);
    console.log(`   Conductors with depot: ${conductorsWithDepot.length}/${conductors.length}`);
    
    // Check if buses and routes have matching depots
    if (busesWithDepot.length > 0 && routesWithDepot.length > 0) {
      const busDepotIds = new Set(busesWithDepot.map(b => b.depotId._id.toString()));
      const routeDepotIds = new Set(routesWithDepot.map(r => r.depot.depotId.toString()));
      const matchingDepots = [...busDepotIds].filter(id => routeDepotIds.has(id));
      
      console.log(`   Matching depot IDs: ${matchingDepots.length}`);
      if (matchingDepots.length === 0) {
        console.log('❌ No matching depots between buses and routes - this is the main issue!');
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugScheduler();

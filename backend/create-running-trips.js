const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Trip = require('./models/Trip');
const Bus = require('./models/Bus');
const Route = require('./models/Route');
const Driver = require('./models/Driver');
const Conductor = require('./models/Conductor');

async function createRunningTrips() {
  try {
    console.log('🚌 Creating running trips for testing...\n');
    
    // Find existing buses, routes, drivers, and conductors
    const buses = await Bus.find({ status: 'active' }).limit(3);
    const routes = await Route.find().limit(3);
    const drivers = await Driver.find().limit(3);
    const conductors = await Conductor.find().limit(3);
    
    if (buses.length === 0 || routes.length === 0) {
      console.log('❌ Need buses and routes to create trips. Run create-sample-data.js first.');
      return;
    }
    
    // Create running trips for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const runningTrips = [];
    
    for (let i = 0; i < Math.min(3, buses.length, routes.length); i++) {
      const bus = buses[i];
      const route = routes[i];
      const driver = drivers[i % drivers.length];
      const conductor = conductors[i % conductors.length];
      
      // Create trip for today with 'running' status
      const trip = new Trip({
        routeId: route._id,
        busId: bus._id,
        driverId: driver._id,
        conductorId: conductor._id,
        serviceDate: today,
        startTime: '08:00',
        endTime: '12:00',
        status: 'running',
        fare: 150,
        availableSeats: bus.capacity.total,
        totalSeats: bus.capacity.total,
        depotId: bus.depotId
      });
      
      await trip.save();
      runningTrips.push(trip);
      console.log(`✅ Created running trip: ${trip._id} for bus ${bus.busNumber}`);
    }
    
    console.log(`\n🎉 Created ${runningTrips.length} running trips for testing!`);
    console.log('You can now test the tracking API at: /api/tracking/running-trips');
    
  } catch (error) {
    console.error('❌ Error creating running trips:', error);
  } finally {
    mongoose.connection.close();
  }
}

createRunningTrips();

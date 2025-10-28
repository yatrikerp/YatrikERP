require('dotenv').config();
const mongoose = require('mongoose');
const Trip = require('./models/Trip');
const Bus = require('./models/Bus');
const Driver = require('./models/Driver');
const Conductor = require('./models/Conductor');

const MONGODB_URI = process.env.MONGODB_URI;

async function assignBuses() {
  try {
    console.log('🚀 Assigning buses to trips...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const [trips, buses, drivers, conductors] = await Promise.all([
      Trip.find({ $or: [{ busId: null }, { busId: { $exists: false } }] }).limit(5000),
      Bus.find({ status: { $in: ['active', 'idle'] } }),
      Driver.find({ status: 'active' }),
      Conductor.find({ status: 'active' })
    ]);

    console.log(`Found ${trips.length} trips without buses`);
    console.log(`Found ${buses.length} buses`);
    console.log(`Found ${drivers.length} drivers`);
    console.log(`Found ${conductors.length} conductors\n`);

    if (!buses.length) {
      console.log('❌ No buses available');
      return;
    }

    let assigned = 0;

    for (const trip of trips) {
      const bus = buses[assigned % buses.length];
      const driver = drivers[assigned % drivers.length];
      const conductor = conductors[assigned % conductors.length];

      await Trip.findByIdAndUpdate(trip._id, {
        busId: bus._id,
        driverId: driver?._id || null,
        conductorId: conductor?._id || null,
        updatedAt: new Date()
      });

      assigned++;

      if (assigned % 100 === 0) {
        process.stdout.write(`\r   Assigned ${assigned}/${trips.length} trips...`);
      }
    }

    console.log(`\n\n✅ Successfully assigned buses to ${assigned} trips!`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

assignBuses();


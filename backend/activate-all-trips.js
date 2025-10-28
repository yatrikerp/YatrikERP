require('dotenv').config();
const mongoose = require('./node_modules/mongoose');
const Trip = require('./models/Trip');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const Driver = require('./models/Driver');
const Conductor = require('./models/Conductor');

const MONGODB_URI = process.env.MONGODB_URI;

async function activateAllTrips() {
  try {
    console.log('🚀 ACTIVATING ALL TRIPS...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const [routes, buses, drivers, conductors] = await Promise.all([
      Route.find({ status: 'active' }).lean(),
      Bus.find({ status: { $in: ['active', 'idle'] } }).lean(),
      Driver.find({ status: 'active' }).lean(),
      Conductor.find({ status: 'active' }).lean()
    ]);

    console.log(`📊 Resources: ${routes.length} routes, ${buses.length} buses, ${drivers.length} drivers, ${conductors.length} conductors\n`);

    if (!routes.length || !buses.length) {
      console.log('❌ Need routes and buses');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Clear existing trips for today and next 30 days
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 31);

    console.log('🗑️ Clearing existing trips...');
    const cleared = await Trip.deleteMany({ serviceDate: { $gte: today, $lt: endDate } });
    console.log(`✅ Cleared ${cleared.deletedCount} trips\n`);

    // Create trips
    const trips = [];
    const timeSlots = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];

    console.log('📅 Creating trips for 30 days...\n');

    for (let day = 0; day < 30; day++) {
      const serviceDate = new Date(today);
      serviceDate.setDate(today.getDate() + day);
      
      const status = day === 0 ? 'running' : 'scheduled';

      routes.forEach((route, idx) => {
        const bus = buses[idx % buses.length];
        const driver = drivers[idx % drivers.length] || null;
        const conductor = conductors[idx % conductors.length] || null;

        // Create 2 trips per route per day
        timeSlots.slice(0, 2).forEach((startTime) => {
          trips.push({
            routeId: route._id,
            busId: bus._id,
            driverId: driver?._id,
            conductorId: conductor?._id,
            depotId: route.depotId || route.depot?._id || bus.depotId,
            serviceDate,
            startTime,
            endTime: calculateEndTime(startTime),
            status,
            fare: route.baseFare || route.minFare || 150,
            capacity: bus.capacity?.total || 45,
            availableSeats: bus.capacity?.total || 45,
            bookedSeats: 0,
            bookingOpen: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        });
      });

      if (day % 7 === 0) {
        const dayTrips = routes.length * 2;
        console.log(`   Day ${day + 1}: ${dayTrips} trips (${status})`);
      }
    }

    console.log(`\n📊 Total trips to create: ${trips.length}`);
    
    // Insert in batches
    console.log('\n💾 Inserting trips...');
    const batchSize = 500;
    let inserted = 0;
    
    for (let i = 0; i < trips.length; i += batchSize) {
      const batch = trips.slice(i, i + batchSize);
      try {
        await Trip.insertMany(batch, { ordered: false });
        inserted += batch.length;
        process.stdout.write(`\r   ${Math.round((inserted / trips.length) * 100)}% (${inserted}/${trips.length})`);
      } catch (err) {
        console.log(`\n   Error: ${err.message}`);
      }
    }

    const runningCount = trips.filter(t => t.status === 'running').length;
    const scheduledCount = trips.filter(t => t.status === 'scheduled').length;

    console.log('\n\n✅ TRIPS ACTIVATED!');
    console.log(`📊 Total: ${inserted} trips`);
    console.log(`🟢 Running (today): ${runningCount}`);
    console.log(`🔵 Scheduled (future): ${scheduledCount}`);
    console.log(`\n🎉 All popular routes are now active!`);

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

function calculateEndTime(startTime) {
  const [h, m] = startTime.split(':').map(Number);
  const total = h * 60 + m + 180;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

activateAllTrips();


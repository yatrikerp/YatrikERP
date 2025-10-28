require('dotenv').config();
const mongoose = require('./node_modules/mongoose');
const Trip = require('./models/Trip');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const Driver = require('./models/Driver');
const Conductor = require('./models/Conductor');

const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
  try {
    console.log('Starting trip scheduling...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const [routes, buses, drivers, conductors] = await Promise.all([
      Route.find({ status: 'active' }).lean(),
      Bus.find({ status: { $in: ['active', 'idle'] } }).lean(),
      Driver.find({ status: 'active' }).lean(),
      Conductor.find({ status: 'active' }).lean()
    ]);

    console.log(`Found ${routes.length} routes, ${buses.length} buses, ${drivers.length} drivers, ${conductors.length} conductors`);

    if (!routes.length || !buses.length) {
      console.log('Need routes and buses');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const trips = [];
    
    // Clear existing trips
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 31);
    await Trip.deleteMany({ serviceDate: { $gte: today, $lt: endDate } });
    console.log('Cleared old trips');

    // Create trips for 30 days
    for (let day = 0; day < 30; day++) {
      const serviceDate = new Date(today);
      serviceDate.setDate(today.getDate() + day);
      const status = day === 0 ? 'running' : 'scheduled';

      routes.forEach((route, rIdx) => {
        const bus = buses[rIdx % buses.length];
        const driver = drivers[rIdx % drivers.length] || null;
        const conductor = conductors[rIdx % conductors.length] || null;

        const timeSlots = ['06:00', '12:00', '18:00']; // Morning, noon, evening
        
        timeSlots.forEach((startTime, slotIdx) => {
          trips.push({
            routeId: route._id,
            busId: bus._id,
            driverId: driver?._id,
            conductorId: conductor?._id,
            depotId: route.depotId || route.depot?._id,
            serviceDate,
            startTime,
            endTime: calculateEndTime(startTime),
            status,
            fare: route.baseFare || 150,
            capacity: bus.capacity?.total || 45,
            availableSeats: bus.capacity?.total || 45,
            bookedSeats: 0,
            bookingOpen: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        });
      });
    }

    console.log(`Created ${trips.length} trips`);
    
    // Insert in batches
    const batchSize = 100;
    let inserted = 0;
    for (let i = 0; i < trips.length; i += batchSize) {
      const batch = trips.slice(i, i + batchSize);
      await Trip.insertMany(batch, { ordered: false });
      inserted += batch.length;
      if (inserted % 1000 === 0) console.log(`Inserted ${inserted}...`);
    }
    
    console.log(`✅ Successfully inserted ${inserted} trips`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

function calculateEndTime(startTime) {
  const [h, m] = startTime.split(':').map(Number);
  const total = h * 60 + m + 180;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

main();



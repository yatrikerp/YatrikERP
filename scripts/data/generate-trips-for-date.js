// Generate high-volume scheduled trips for a single date (~10k) directly in DB
// Usage: node generate-trips-for-date.js 2025-10-06

require('dotenv').config();
const mongoose = require('./backend/node_modules/mongoose');
const Trip = require('./backend/models/Trip');
const Route = require('./backend/models/Route');
const Bus = require('./backend/models/Bus');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp';

function addMinutes(timeHHMM, minutesToAdd) {
  const [h, m] = (timeHHMM || '06:00').split(':').map(Number);
  const total = h * 60 + m + (minutesToAdd || 120);
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function pickSlots(num) {
  const slots = ['05:30','06:00','06:30','07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00'];
  return slots.slice(0, Math.min(num, slots.length));
}

async function main() {
  const dateArg = process.argv[2];
  const targetDate = dateArg ? new Date(dateArg) : new Date(Date.now() + 24*60*60*1000);
  targetDate.setHours(0,0,0,0);

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');
  try {
    const [routes, buses] = await Promise.all([
      Route.find({}).lean(),
      Bus.find({ status: { $in: ['active','idle'] } }).lean()
    ]);
    console.log(`Routes=${routes.length}, Buses=${buses.length}`);
    if (!routes.length || !buses.length) {
      console.log('❌ Need routes and buses');
      return;
    }

    // Group buses by depot; fallback to all
    const busesByDepot = new Map();
    for (const b of buses) {
      const key = String(b.depotId || 'any');
      if (!busesByDepot.has(key)) busesByDepot.set(key, []);
      busesByDepot.get(key).push(b);
    }

    const trips = [];
    // Aim for ~10k trips total: distribute across routes with multiple slots
    const avgTripsPerRoute = Math.max(1, Math.floor(10000 / Math.max(routes.length, 1)));

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      const depotId = route?.depot?.depotId || route?.depotId || null;
      const pool = (busesByDepot.get(String(depotId)) || buses);
      if (!pool.length) continue;

      const slots = pickSlots(avgTripsPerRoute);
      for (let j = 0; j < slots.length; j++) {
        const bus = pool[(i + j) % pool.length];
        const startTime = slots[j];
        const duration = route.estimatedDuration || route.duration || 120;
        const endTime = addMinutes(startTime, duration);
        const capacity = bus.capacity?.total || 45;
        const fare = route.baseFare || 150;
        trips.push({
          routeId: route._id,
          busId: bus._id,
          depotId: depotId || bus.depotId,
          serviceDate: targetDate,
          startTime,
          endTime,
          status: 'scheduled',
          fare,
          capacity,
          availableSeats: capacity,
          bookedSeats: 0,
          bookingOpen: true,
          notes: 'High-volume daily generation'
        });
      }
    }

    console.log('Prepared trips:', trips.length);
    if (!trips.length) return;

    // Clear existing scheduled trips for that date to avoid bus double-assign conflicts
    await Trip.deleteMany({ serviceDate: targetDate, status: 'scheduled' });

    // Insert in batches
    const batchSize = 100;
    let inserted = 0;
    for (let k = 0; k < trips.length; k += batchSize) {
      const batch = trips.slice(k, k + batchSize);
      try { await Trip.insertMany(batch, { ordered: false }); inserted += batch.length; } catch(e) { /* continue */ }
      if (inserted % 1000 === 0) console.log(`Inserted ${inserted}...`);
    }
    console.log(`✅ Inserted ${inserted} trips for ${targetDate.toISOString().split('T')[0]}`);
  } catch (e) {
    console.error('❌ Generation failed:', e.message);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected');
  }
}

main();



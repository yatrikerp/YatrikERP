const mongoose = require('mongoose');
const path = require('path');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Depot = require('../models/Depot');
const User = require('../models/User');
// Load env from project root and backend/.env (backend wins)
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Connect using env per project rule (no localhost fallback)
const MONGODB_URI = process.env.MONGODB_URI;

async function connectDb() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Please add it to your .env.');
  }
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}

function minutesFromKm(distanceKm) {
  // Approximate average speed 42 km/h
  const hours = distanceKm / 42;
  return Math.max(60, Math.round(hours * 60));
}

function makeRouteNumber(bus) {
  // Example: KL-KAS-BAN-519 style → derive from busNumber cleaned + short id tail
  const base = (bus.busNumber || 'BUS').toString().replace(/[^A-Z0-9]/gi, '-').toUpperCase();
  return `${base}`.slice(0, 20) + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
}

function mapBusTypeToRouteEnum(busType) {
  if (!busType) return 'ordinary';
  const t = String(busType).toLowerCase();
  if (t.includes('garuda')) return 'garuda';
  if (t.includes('volvo') || t.includes('ac_seater') || t.includes('ac_sleeper') || t.includes('low_floor_ac')) return 'volvo';
  if (t.includes('ac')) return 'ac';
  if (t.includes('super_fast') || t.includes('minnal') || t.includes('ananthapuri')) return 'super_fast';
  if (t.includes('fast')) return 'fast_passenger';
  return 'ordinary';
}

async function getSystemUser() {
  let user = await User.findOne({ role: 'admin' }).lean();
  if (!user) {
    user = await User.findOne({ email: 'admin@yatrik.com' }).lean();
  }
  if (!user) {
    const created = await new User({
      name: 'System Admin',
      email: 'admin@yatrik.com',
      password: 'admin123',
      role: 'admin',
      isActive: true
    }).save();
    return created;
  }
  return user;
}

async function generateRoutesForAllBuses() {
  await connectDb();
  const creator = await getSystemUser();

  const buses = await Bus.find({}).lean();
  if (buses.length === 0) {
    console.log('No buses found. Abort.');
    return;
  }

  const depotsById = new Map();
  const findDepot = async (id) => {
    if (!id) return null;
    if (depotsById.has(id.toString())) return depotsById.get(id.toString());
    const d = await Depot.findById(id).lean();
    if (d) depotsById.set(id.toString(), d);
    return d;
  };

  let createdCount = 0;
  for (const bus of buses) {
    const depot = await findDepot(bus.depotId);
    if (!depot) {
      console.log(`Skipping bus ${bus.busNumber} - depot not found`);
      continue;
    }

    // If this bus already has a current route reference that exists, skip creating duplicate
    if (bus.currentRoute && bus.currentRoute.routeId) {
      const existing = await Route.findById(bus.currentRoute.routeId).lean();
      if (existing) {
        continue;
      }
    }

    const fromCity = depot.location?.city || 'Depot';
    // Create a synthetic destination within or across cities using depot name
    const toCity = `${fromCity} Central`;

    const totalDistanceKm = 80 + Math.floor(Math.random() * 320); // 80-400km

    const routeData = {
      routeNumber: makeRouteNumber(bus),
      routeName: `${fromCity} to ${toCity}`,
      startingPoint: {
        city: fromCity,
        location: depot.location?.address || depot.depotName
      },
      endingPoint: {
        city: toCity,
        location: `${toCity} Bus Stand`
      },
      totalDistance: totalDistanceKm,
      estimatedDuration: minutesFromKm(totalDistanceKm),
      intermediateStops: [],
      baseFare: Math.max(100, Math.round(totalDistanceKm * 2.5)),
      farePerKm: 2.5,
      depot: {
        depotId: depot._id,
        depotName: depot.depotName,
        depotLocation: depot.location?.city || ''
      },
      assignedBuses: [{
        busId: bus._id,
        busNumber: bus.busNumber,
        capacity: bus.capacity?.total || 40,
        busType: bus.busType
      }],
      schedules: [{
        scheduleId: `SCH_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        departureTime: '08:00',
        arrivalTime: '12:00',
        frequency: 'daily',
        daysOfWeek: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'],
        isActive: true,
        createdBy: creator._id
      }],
      status: 'active',
      features: ['WiFi'],
      busType: mapBusTypeToRouteEnum(bus.busType),
      creationMethod: 'bulk_import',
      createdBy: creator._id
    };

    const route = await new Route(routeData).save();
    createdCount++;

    // Update bus currentRoute
    await Bus.updateOne({ _id: bus._id }, {
      $set: {
        currentRoute: {
          routeId: route._id,
          routeName: route.routeName,
          routeNumber: route.routeNumber,
          assignedAt: new Date()
        }
      }
    });
  }

  console.log(`Created ${createdCount} routes out of ${buses.length} buses.`);
}

generateRoutesForAllBuses()
  .catch(err => {
    console.error('Error generating routes:', err);
  })
  .finally(async () => {
    await mongoose.connection.close();
  });



// Admin import script: clears existing routes and imports Kerala routes via Admin API
// Usage:
//   node admin-import-kerala-routes.js
// Env (optional):
//   API_BASE=http://localhost:5000
//   ADMIN_EMAIL=admin@yatrik.com
//   ADMIN_PASSWORD=admin123

const axios = require('axios');
const { keralaRoutesData } = require('./backend/scripts/import-kerala-routes-to-database');

const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@yatrik.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const DELETE_ONLY = String(process.env.DELETE_ONLY || 'false').toLowerCase() === 'true';

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

function mapRouteTypeToBusType(routeType) {
  switch (routeType) {
    case 'intercity': return 'ordinary';
    case 'interstate': return 'volvo';
    case 'hill_station': return 'super_fast';
    case 'seasonal': return 'fast_passenger';
    case 'tourist': return 'ac';
    case 'airport': return 'garuda';
    default: return 'ordinary';
  }
}

function calcBaseFare(distanceKm) {
  const perKm = 2.5;
  return Math.max(8, Math.floor((distanceKm || 0) * perKm));
}

function makeRouteNumber(from, to) {
  const f = (from || '').substr(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'ROU';
  const t = (to || '').substr(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'TE';
  const rand = Math.floor(Math.random() * 900) + 100;
  return `KL-${f}-${t}-${rand}`;
}

async function adminLogin() {
  const url = `${API_BASE}/api/auth/login`;
  const { data } = await axios.post(url, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (!data || !data.token) throw new Error('Login failed: no token in response');
  return data.token;
}

async function getDepots(auth) {
  const url = `${API_BASE}/api/admin/depots`;
  const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${auth}` } });
  // Some endpoints return { depots }, others return array; normalize
  const depots = Array.isArray(data) ? data : (data.depots || []);
  return depots;
}

async function listAllRoutes(auth) {
  // Use paginated endpoint
  const routes = [];
  let page = 1;
  const limit = 50;
  while (true) {
    const url = `${API_BASE}/api/admin/routes?page=${page}&limit=${limit}`;
    const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${auth}` } });
    const pageRoutes = data?.data?.routes || [];
    routes.push(...pageRoutes);
    const total = data?.data?.pagination?.total || 0;
    if (routes.length >= total || pageRoutes.length === 0) break;
    page += 1;
    await sleep(50);
  }
  return routes;
}

async function deleteRoute(auth, id) {
  const url = `${API_BASE}/api/admin/routes/${id}`;
  return axios.delete(url, { headers: { Authorization: `Bearer ${auth}` } });
}

async function clearAllRoutes(auth) {
  const existing = await listAllRoutes(auth);
  console.log(`Found ${existing.length} existing routes to delete`);
  let deleted = 0, failed = 0;
  for (const r of existing) {
    try {
      await deleteRoute(auth, r._id || r.id);
      deleted += 1;
      if (deleted % 10 === 0) console.log(`Deleted ${deleted}/${existing.length} routes...`);
      await sleep(25);
    } catch (err) {
      failed += 1;
      const msg = err?.response?.data?.message || err?.message;
      console.warn(`Failed to delete route ${r.routeNumber || r._id}: ${msg}`);
    }
  }
  console.log(`Deletion complete. Deleted=${deleted}, Failed=${failed}`);
}

async function createAdminRoute(auth, payload) {
  const url = `${API_BASE}/api/admin/routes`;
  return axios.post(url, payload, { headers: { Authorization: `Bearer ${auth}` } });
}

function buildAdminRoutePayload(route, depot) {
  const routeNumber = makeRouteNumber(route.from, route.to);
  const busType = mapRouteTypeToBusType(route.type);
  const baseFare = calcBaseFare(route.distance);
  const uniqueScheduleId = `SCH_${routeNumber}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    routeNumber,
    routeName: `${route.from} to ${route.to}`,
    startingPoint: {
      city: route.from,
      location: `${route.from} Bus Station, Kerala`,
      coordinates: { latitude: 0, longitude: 0 }
    },
    endingPoint: {
      city: route.to,
      location: `${route.to} Bus Station, ${route.type === 'interstate' ? 'Other State' : 'Kerala'}`,
      coordinates: { latitude: 0, longitude: 0 }
    },
    intermediateStops: [],
    totalDistance: route.distance,
    estimatedDuration: route.duration,
    baseFare,
    farePerKm: 2.5,
    busType,
    depotId: depot._id || depot.id,
    status: 'active',
    amenities: route.type === 'ac' ? ['AC'] : ['WiFi'],
    isActive: true,
    operatingHours: {},
    frequency: {},
    schedules: [
      {
        scheduleId: uniqueScheduleId,
        departureTime: '08:00',
        arrivalTime: '12:00',
        frequency: 'daily',
        isActive: true
      }
    ],
    notes: `Kerala ${route.type} route`
  };
}

async function importKerala(auth) {
  // Get depots; pick first active depot as default
  const depots = await getDepots(auth);
  if (!depots || depots.length === 0) throw new Error('No depots found. Create a depot first.');
  const depot = depots[0];
  console.log(`Using depot: ${depot.depotName || depot.name} (${depot._id || depot.id})`);

  let created = 0, errors = 0;
  for (const [depotName, routes] of Object.entries(keralaRoutesData)) {
    console.log(`Processing ${depotName}: ${routes.length} routes`);
    for (const route of routes) {
      try {
        const payload = buildAdminRoutePayload(route, depot);
        await createAdminRoute(auth, payload);
        created += 1;
        if (created % 10 === 0) console.log(`Created ${created} routes...`);
        await sleep(30);
      } catch (err) {
        errors += 1;
        const msg = err?.response?.data?.message || err?.message;
        const details = err?.response?.data || {};
        console.warn(`Failed to create ${route.from}→${route.to}: ${msg}`);
        if (Object.keys(details).length) {
          console.warn('Details:', JSON.stringify(details));
        }
      }
    }
  }
  console.log(`Import complete. Created=${created}, Errors=${errors}`);
}

async function main() {
  try {
    console.log('Logging in as admin...');
    const token = await adminLogin();
    console.log('Login successful. Clearing existing routes...');
    await clearAllRoutes(token);
    if (!DELETE_ONLY) {
      console.log('Importing Kerala routes into admin route management...');
      await importKerala(token);
    } else {
      console.log('DELETE_ONLY=true set. Skipping import.');
    }
    console.log('✅ Done. Check admin UI at /admin/streamlined-routes');
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message;
    console.error('❌ Import failed:', msg);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}



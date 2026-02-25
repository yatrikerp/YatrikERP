// Bulk schedule trips via Admin API so they appear in streamlined-trips immediately
// Usage (PowerShell): node admin-bulk-schedule-trips.js

const axios = require('axios');

const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@yatrik.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function addMinutes(timeHHMM, minutesToAdd) {
  const [h, m] = (timeHHMM || '08:00').split(':').map(Number);
  const total = h * 60 + m + (minutesToAdd || 120);
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

async function adminLogin() {
  const { data } = await axios.post(`${API_BASE}/api/auth/login`, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });
  if (!data?.token) throw new Error('Login failed');
  return data.token;
}

async function listAllRoutes(auth) {
  const routes = [];
  let page = 1;
  const limit = 100;
  while (true) {
    const { data } = await axios.get(`${API_BASE}/api/admin/routes?page=${page}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${auth}` }
    });
    const pageRoutes = data?.data?.routes || [];
    routes.push(...pageRoutes);
    const total = data?.data?.pagination?.total || pageRoutes.length;
    if (routes.length >= total || pageRoutes.length === 0) break;
    page += 1;
  }
  return routes;
}

async function listAllBuses(auth) {
  const buses = [];
  let page = 1;
  const limit = 200;
  while (true) {
    const { data } = await axios.get(`${API_BASE}/api/admin/buses?page=${page}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${auth}` }
    });
    const pageBuses = data?.data?.buses || [];
    buses.push(...pageBuses);
    const total = data?.data?.pagination?.total || pageBuses.length;
    if (buses.length >= total || pageBuses.length === 0) break;
    page += 1;
  }
  return buses;
}

async function createTrip(auth, payload) {
  const { data } = await axios.post(`${API_BASE}/api/admin/trips`, payload, {
    headers: { Authorization: `Bearer ${auth}` }
  });
  return data;
}

async function run() {
  try {
    console.log('🔐 Logging in as admin...');
    const token = await adminLogin();
    console.log('✅ Login OK');

    console.log('📥 Fetching routes and buses...');
    const [routes, buses] = await Promise.all([listAllRoutes(token), listAllBuses(token)]);
    console.log(`➡️ Routes: ${routes.length}, Buses: ${buses.length}`);
    if (routes.length === 0 || buses.length === 0) {
      console.log('❌ Need both routes and buses to schedule. Aborting.');
      return;
    }

    // Group buses by depotId string for better assignment
    const busesByDepot = new Map();
    for (const b of buses) {
      const did = b.depotId?._id || b.depotId || b.depot?.depotId || '';
      const key = String(did || 'any');
      if (!busesByDepot.has(key)) busesByDepot.set(key, []);
      busesByDepot.get(key).push(b);
    }

    // Schedule one trip per route for tomorrow at 08:00 (quick visibility)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const serviceDate = tomorrow.toISOString().split('T')[0];
    let created = 0, skipped = 0;

    for (const route of routes) {
      const depotId = route?.depot?.depotId || route?.depotId || '';
      const key = String(depotId || 'any');
      const candidateBuses = (busesByDepot.get(key) || busesByDepot.get('any') || buses);
      if (!candidateBuses || candidateBuses.length === 0) { skipped++; continue; }
      const bus = candidateBuses[(created + skipped) % candidateBuses.length];

      const startTime = '08:00';
      const duration = route?.estimatedDuration || route?.duration || 120;
      const endTime = addMinutes(startTime, duration);
      const fare = route?.baseFare || 150;
      const capacity = bus?.capacity?.total || 45;

      const tripPayload = {
        routeId: route._id,
        busId: bus._id,
        depotId: depotId || bus.depotId,
        serviceDate,
        startTime,
        endTime,
        fare,
        capacity,
        status: 'scheduled',
        notes: 'Auto-scheduled (bulk)'
      };

      try {
        await createTrip(token, tripPayload);
        created++;
        if (created % 25 === 0) console.log(`Created ${created} trips...`);
        await sleep(10);
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message;
        // console.warn(`Skip route ${route.routeNumber || route._id}: ${msg}`);
        skipped++;
      }
    }

    console.log(`✅ Done. Created=${created}, Skipped=${skipped}. Check UI for ${serviceDate}.`);
  } catch (e) {
    console.error('❌ Bulk schedule failed:', e.message);
    process.exitCode = 1;
  }
}

run();



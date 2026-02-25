// Export per-depot report for routes and buses via Admin API
// Usage: node admin-export-depot-report.js

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@yatrik.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function login() {
  const { data } = await axios.post(`${API_BASE}/api/auth/login`, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });
  if (!data?.token) throw new Error('Login failed');
  return data.token;
}

async function fetchAllPaged(url, token, key) {
  const items = [];
  let page = 1;
  const limit = 200;
  for (;;) {
    const { data } = await axios.get(`${API_BASE}${url}?page=${page}&limit=${limit}` , {
      headers: { Authorization: `Bearer ${token}` }
    });
    const chunk = data?.data?.[key] || [];
    items.push(...chunk);
    const total = data?.data?.pagination?.total ?? chunk.length;
    if (items.length >= total || chunk.length === 0) break;
    page += 1;
  }
  return items;
}

function buildReport(routes, buses) {
  const byDepot = new Map();

  // Seed depots from buses
  for (const b of buses) {
    const depotId = b?.depotId?._id || b?.depotId || 'unknown';
    const depotName = b?.depotId?.depotName || b?.depotName || 'Unknown Depot';
    const key = String(depotId);
    if (!byDepot.has(key)) byDepot.set(key, { depotId: key, depotName, buses: [], routes: [] });
    byDepot.get(key).buses.push({
      busId: b._id,
      busNumber: b.busNumber,
      registrationNumber: b.registrationNumber,
      busType: b.busType,
      capacity: b.capacity?.total || 0,
      status: b.status
    });
  }

  // Attach routes
  for (const r of routes) {
    const depotId = r?.depot?.depotId || r?.depotId || 'unknown';
    const depotName = r?.depot?.depotName || r?.depotName || 'Unknown Depot';
    const key = String(depotId);
    if (!byDepot.has(key)) byDepot.set(key, { depotId: key, depotName, buses: [], routes: [] });
    byDepot.get(key).routes.push({
      routeId: r._id,
      routeNumber: r.routeNumber,
      routeName: r.routeName,
      from: r.startingPoint?.city || r.startingPoint,
      to: r.endingPoint?.city || r.endingPoint,
      totalDistance: r.totalDistance,
      estimatedDuration: r.estimatedDuration,
      status: r.status
    });
  }

  // Build summary
  const depots = Array.from(byDepot.values()).sort((a,b)=> (a.depotName||'').localeCompare(b.depotName||''));
  const summary = depots.map(d => ({
    depotId: d.depotId,
    depotName: d.depotName,
    totalBuses: d.buses.length,
    totalRoutes: d.routes.length,
    activeBuses: d.buses.filter(x=>x.status==='active').length,
    idleBuses: d.buses.filter(x=>x.status==='idle').length,
  }));

  return { depots, summary, totals: {
    routes: routes.length,
    buses: buses.length,
    depots: depots.length
  }};
}

function writeFiles(report) {
  const outJson = path.resolve(process.cwd(), 'depot-report.json');
  const outCsv = path.resolve(process.cwd(), 'depot-report.csv');
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2), 'utf8');

  const lines = ['Depot ID,Depot Name,Total Buses,Active Buses,Idle Buses,Total Routes'];
  for (const s of report.summary) {
    lines.push([s.depotId, s.depotName?.replace(/,/g,' '), s.totalBuses, s.activeBuses, s.idleBuses, s.totalRoutes].join(','));
  }
  fs.writeFileSync(outCsv, lines.join('\n'), 'utf8');
  return { outJson, outCsv };
}

async function run() {
  try {
    console.log('Logging in...');
    const token = await login();
    console.log('Fetching routes/buses...');
    const [routes, buses] = await Promise.all([
      fetchAllPaged('/api/admin/routes', token, 'routes'),
      fetchAllPaged('/api/admin/buses', token, 'buses')
    ]);
    console.log(`Routes=${routes.length}, Buses=${buses.length}`);
    const report = buildReport(routes, buses);
    const files = writeFiles(report);
    console.log('✅ Report ready:', files);
  } catch (e) {
    console.error('❌ Export failed:', e.message);
    process.exitCode = 1;
  }
}

run();



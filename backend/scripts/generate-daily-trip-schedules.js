#!/usr/bin/env node
/**
 * YATRIK ERP - Generate Daily Trip Schedules
 *
 * Creates ~10,000 trips across all depots using existing routes and buses.
 * - Proportional depot allocation by busCount
 * - Route selection by matching originDistrict to depot.district
 * - Randomized peak-hour start times; computed end times
 * - Local vs Interstate tagging from district match
 * - Optional crew rotation (best-effort, in-memory round-robin)
 * - Idempotent for the day: clears today's schedules first
 * - Emits 'trips:updated' event (best-effort) after completion
 * - Writes per-depot CSV summary
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Optional runtime deps (wrapped)
let ioClient = null;
try { ioClient = require('socket.io-client'); } catch (_) {}
let cron = null;
try { cron = require('node-cron'); } catch (_) {}

// Models
const Depot = require('../models/Depot');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Trip = require('../models/Trip');
let Driver, Conductor;
try { Driver = require('../models/Driver'); } catch (_) {}
try { Conductor = require('../models/Conductor'); } catch (_) {}

// Scheduling constants
const TOTAL_TRIPS_PER_DAY = 10000;
const INTERSTATE_RATIO = 0.05; // 5%
const LOCAL_TRIPS = Math.round(TOTAL_TRIPS_PER_DAY * (1 - INTERSTATE_RATIO));
const INTERSTATE_TRIPS = TOTAL_TRIPS_PER_DAY - LOCAL_TRIPS;
const PEAK_HOURS = { morning: [5,10], noon: [10,16], evening: [16,22] };

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp';
const API_SOCKET_URL = process.env.API_SOCKET_URL || 'http://localhost:5000';

async function main(runDate = new Date()) {
  const scheduleDate = new Date(runDate).toISOString().split('T')[0];

  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // Fast lookups
  await ensureIndexes();

  const [depots, routes, buses] = await Promise.all([
    Depot.find({}, { district: 1, busCount: 1, managerId: 1 }).lean(),
    Route.find({}, { originDistrict: 1, destinationDistrict: 1, distanceKm: 1, durationMin: 1 }).lean(),
    Bus.find({ status: 'active' }, { depotId: 1, status: 1 }).lean()
  ]);

  if (!depots.length || !routes.length || !buses.length) {
    console.log('No sufficient data to generate schedules.');
    await mongoose.connection.close();
    return;
  }

  // Group buses by depot
  const depotIdToBuses = new Map();
  for (const bus of buses) {
    const key = String(bus.depotId || '');
    if (!depotIdToBuses.has(key)) depotIdToBuses.set(key, []);
    depotIdToBuses.get(key).push(bus);
  }

  // Group routes by origin district
  const routesByOrigin = new Map();
  for (const r of routes) {
    const key = (r.originDistrict || '').toLowerCase();
    if (!routesByOrigin.has(key)) routesByOrigin.set(key, []);
    routesByOrigin.get(key).push(r);
  }

  // Compute depot quotas
  const totalBuses = depots.reduce((sum, d) => sum + (d.busCount || 0), 0) || buses.length;
  const depotQuotas = depots.map(d => ({
    depot: d,
    quota: Math.round(((d.busCount || (depotIdToBuses.get(String(d._id)) || []).length) / totalBuses) * TOTAL_TRIPS_PER_DAY)
  }));

  // Optional crew pools by depot
  let driversByDepot = new Map();
  let conductorsByDepot = new Map();
  if (Driver) {
    const ds = await Driver.find({}, { _id: 1, depotId: 1 }).lean();
    for (const u of ds) {
      const key = String(u.depotId || '');
      if (!driversByDepot.has(key)) driversByDepot.set(key, []);
      driversByDepot.get(key).push(u._id);
    }
  }
  if (Conductor) {
    const cs = await Conductor.find({}, { _id: 1, depotId: 1 }).lean();
    for (const c of cs) {
      const key = String(c.depotId || '');
      if (!conductorsByDepot.has(key)) conductorsByDepot.set(key, []);
      conductorsByDepot.get(key).push(c._id);
    }
  }

  // Prepare generation
  const trips = [];
  let localCount = 0;
  let interstateCount = 0;

  // Clear existing for today
  await Trip.deleteMany({ scheduleDate });

  // Per-depot generation
  for (const { depot, quota } of depotQuotas) {
    if (!quota) continue;
    const originKey = (depot.district || '').toLowerCase();
    const candidateRoutes = routesByOrigin.get(originKey) || [];
    const depotBuses = depotIdToBuses.get(String(depot._id)) || [];
    if (!candidateRoutes.length || !depotBuses.length) continue;

    // Create a balanced mix of local/interstate respecting global targets
    for (let i = 0; i < quota; i++) {
      const route = pickRandom(candidateRoutes);
      if (!route) continue;

      const isInterstate = (route.destinationDistrict || '').toLowerCase() !== (route.originDistrict || '').toLowerCase();
      // Guard global ratios (best-effort)
      if (isInterstate && interstateCount >= INTERSTATE_TRIPS) continue;
      if (!isInterstate && localCount >= LOCAL_TRIPS) continue;

      const bus = pickRandom(depotBuses);
      if (!bus) continue;

      const startTime = randomPeakStartTime();
      const endTime = addMinutes(startTime, route.durationMin || 0);

      const fareType = isInterstate ? 'interstate' : pickRandom(['standard','standard','express']);

      const [driverId, conductorId] = rotateCrew(String(depot._id), driversByDepot, conductorsByDepot);

      trips.push({
        routeId: route._id,
        depotId: depot._id,
        busId: bus._id,
        driverId: driverId || undefined,
        conductorId: conductorId || undefined,
        startTime,
        endTime,
        distanceKm: route.distanceKm,
        durationMin: route.durationMin,
        status: 'scheduled',
        fareType,
        scheduleDate,
        tripCode: shortId(),
        managerId: depot.managerId || undefined
      });

      if (isInterstate) interstateCount++; else localCount++;

      // Stop if we've hit global limit (safety)
      if (trips.length >= TOTAL_TRIPS_PER_DAY) break;
    }
    if (trips.length >= TOTAL_TRIPS_PER_DAY) break;
  }

  // If short due to data constraints, top-up with any route/bus
  while (trips.length < TOTAL_TRIPS_PER_DAY) {
    const r = pickRandom(routes);
    const b = pickRandom(buses);
    if (!r || !b) break;
    const depotId = b.depotId;
    const isInterstate = (r.destinationDistrict || '').toLowerCase() !== (r.originDistrict || '').toLowerCase();
    if (isInterstate && interstateCount >= INTERSTATE_TRIPS) continue;
    if (!isInterstate && localCount >= LOCAL_TRIPS) continue;
    const startTime = randomPeakStartTime();
    const endTime = addMinutes(startTime, r.durationMin || 0);
    trips.push({
      routeId: r._id,
      depotId,
      busId: b._id,
      startTime,
      endTime,
      distanceKm: r.distanceKm,
      durationMin: r.durationMin,
      status: 'scheduled',
      fareType: isInterstate ? 'interstate' : pickRandom(['standard','express']),
      scheduleDate,
      tripCode: shortId()
    });
    if (isInterstate) interstateCount++; else localCount++;
  }

  // Bulk insert
  const inserted = await Trip.insertMany(trips, { ordered: false });

  // Emit UI update (best-effort)
  await emitTripsUpdated();

  // CSV report
  await writeCsvReport(scheduleDate, inserted);

  // Summary
  console.log('\n✅ Daily Trip Scheduling Complete');
  console.log(`- Total Trips: ${inserted.length}`);
  console.log(`- Local: ${localCount}`);
  console.log(`- Interstate: ${interstateCount}`);
  console.log(`- Depots: ${depots.length}`);
  console.log(`- Routes: ${routes.length}`);

  await mongoose.connection.close();
}

function pickRandom(arr) {
  if (!arr || !arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPeakStartTime() {
  const bucket = pickRandom(['morning','noon','evening']);
  const [h1, h2] = PEAK_HOURS[bucket];
  const hour = Math.floor(h1 + Math.random() * (h2 - h1));
  const minute = [0, 10, 15, 20, 30, 40, 45, 50][Math.floor(Math.random() * 8)];
  return pad2(hour) + ':' + pad2(minute);
}

function pad2(n) { return String(n).padStart(2, '0'); }

function addMinutes(startHHmm, minutes) {
  const [hh, mm] = String(startHHmm).split(':').map(x => parseInt(x, 10) || 0);
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  d.setMinutes(d.getMinutes() + (minutes || 0));
  return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

function shortId() {
  return Math.random().toString(36).slice(2, 6) + Math.random().toString(36).slice(2, 6);
}

// In-memory rotor per depot
const rotorState = new Map();
function rotateCrew(depotId, driversByDepot, conductorsByDepot) {
  const dlist = driversByDepot.get(depotId) || [];
  const clist = conductorsByDepot.get(depotId) || [];
  if (!rotorState.has(depotId)) rotorState.set(depotId, { di: 0, ci: 0 });
  const st = rotorState.get(depotId);
  const driverId = dlist.length ? dlist[st.di % dlist.length] : undefined;
  const conductorId = clist.length ? clist[st.ci % clist.length] : undefined;
  st.di++; st.ci++;
  return [driverId, conductorId];
}

async function ensureIndexes() {
  try {
    await Trip.collection.createIndex({ routeId: 1, depotId: 1, scheduleDate: 1 });
  } catch (_) {}
}

async function emitTripsUpdated() {
  if (!ioClient) return;
  try {
    const socket = ioClient(API_SOCKET_URL, { transports: ['websocket'], timeout: 1500, reconnection: false });
    await new Promise(resolve => socket.on('connect', resolve));
    socket.emit('trips:updated', { at: new Date().toISOString() });
    socket.close();
  } catch (_) {}
}

async function writeCsvReport(scheduleDate, docs) {
  try {
    const byDepot = new Map();
    for (const t of docs) {
      const key = String(t.depotId || '');
      byDepot.set(key, (byDepot.get(key) || 0) + 1);
    }
    const rows = [['depotId','trips','date']];
    for (const [depotId, count] of byDepot.entries()) rows.push([depotId, count, scheduleDate]);
    const csv = rows.map(r => r.join(',')).join('\n');
    const outPath = path.join(process.cwd(), 'daily-trips-report.csv');
    fs.writeFileSync(outPath, csv, 'utf8');
    console.log(`CSV report written: ${outPath}`);
  } catch (e) {
    console.warn('CSV report write failed:', e.message);
  }
}

// Optional CRON (run at 00:05 daily) when RUN_AS_CRON=true or --cron
if (process.env.RUN_AS_CRON === 'true' || process.argv.includes('--cron')) {
  if (!cron) {
    console.warn('node-cron not installed; running once now.');
    main().catch(err => { console.error(err); process.exit(1); });
  } else {
    cron.schedule('5 0 * * *', () => main().catch(err => console.error(err)));
    console.log('CRON enabled: will run daily at 00:05');
  }
} else {
  main().catch(err => { console.error(err); process.exit(1); });
}



#!/usr/bin/env node

/*
  List a sample of existing driver and conductor login identifiers.
  Usage: node backend/scripts/listStaffCredentials.js

  Notes:
  - Passwords are stored hashed; this prints usernames/emails only.
  - If staff were created via create-drivers-conductors.js, defaults are:
      driver password: "driver123"  | conductor password: "conductor123"
  - If staff were created via kerala staff script, passwords are random; reset if unknown.
*/

const mongoose = require('mongoose');
require('dotenv').config();

const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');
const Depot = require('../models/Depot');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp';
  console.log(`Connecting to MongoDB: ${uri}`);
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    const depots = await Depot.find({}).select('_id depotName depotCode').lean();
    const depotIdToInfo = new Map(depots.map(d => [String(d._id), d]));

    const drivers = await Driver.find({}).select('_id name username email depotId status').limit(20).lean();
    const conductors = await Conductor.find({}).select('_id name username email depotId status').limit(20).lean();

    const format = (row) => {
      const depot = depotIdToInfo.get(String(row.depotId));
      return {
        name: row.name,
        username: row.username,
        email: row.email,
        depotCode: depot?.depotCode || null,
        depotName: depot?.depotName || null,
        status: row.status
      };
    };

    console.log('\n=== Drivers (sample) ===');
    drivers.map(format).forEach((d, i) => {
      console.log(`${i + 1}. username: ${d.username} | email: ${d.email || '-'} | depot: ${d.depotCode || '-'} (${d.depotName || '-'}) | status: ${d.status}`);
    });

    console.log('\n=== Conductors (sample) ===');
    conductors.map(format).forEach((c, i) => {
      console.log(`${i + 1}. username: ${c.username} | email: ${c.email || '-'} | depot: ${c.depotCode || '-'} (${c.depotName || '-'}) | status: ${c.status}`);
    });

    console.log('\nHints:');
    console.log('- Try passwords: driver123 (drivers) / conductor123 (conductors) if created by default seeder.');
    console.log('- If login fails, reset the staff password via admin panel or a small script.');
  } catch (err) {
    console.error('Error listing staff credentials:', err);
  } finally {
    await mongoose.disconnect();
  }
}

main();



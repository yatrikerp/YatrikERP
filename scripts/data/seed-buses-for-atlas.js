// Seed buses into Atlas and assign to depots present in routes
// Usage: node seed-buses-for-atlas.js

require('dotenv').config();
const mongoose = require('./backend/node_modules/mongoose');
const Bus = require('./backend/models/Bus');
const Route = require('./backend/models/Route');
const Depot = require('./backend/models/Depot');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');
  try {
    // Fetch all routes regardless of isActive to capture newly imported ones
    const routes = await Route.find({}).lean();
    const depotIds = Array.from(new Set(
      routes.map(r => (r.depot?.depotId || r.depotId || r.depot)?.toString?.() || '').filter(Boolean)
    ));
    const depots = await Depot.find({ _id: { $in: depotIds } }).lean();
    console.log(`Found ${depots.length} depots referenced by routes`);

    const busesToCreate = [];
    let counter = 1;
    for (const depot of depots) {
      // Create 12 buses per depot
      for (let i = 0; i < 12; i++) {
        const busNumber = `${(depot.depotCode || depot.depotName || 'DEP').slice(0,3).toUpperCase()}-BUS-${String(counter).padStart(4,'0')}`;
        const registrationNumber = `KL-${String(1 + (counter % 99)).padStart(2,'0')}-${String(1000 + counter).slice(-4)}`;
        busesToCreate.push({
          busNumber,
          registrationNumber,
          depotId: depot._id,
          busType: 'ordinary',
          capacity: { total: 45, sleeper: 0, seater: 45 },
          amenities: ['wifi', 'charging'],
          specifications: { manufacturer: 'Tata', model: 'Starbus', year: 2022, fuelType: 'diesel' },
          status: 'idle',
          assignedBy: new mongoose.Types.ObjectId(),
          notes: `Auto-seeded for depot ${depot.depotName || depot.name}`
        });
        counter++;
      }
    }

    console.log(`Prepared ${busesToCreate.length} buses to insert`);
    const existing = await Bus.find({ busNumber: { $in: busesToCreate.map(b => b.busNumber) } }).select('busNumber').lean();
    const existingSet = new Set(existing.map(b => b.busNumber));
    const newOnes = busesToCreate.filter(b => !existingSet.has(b.busNumber));
    if (newOnes.length) {
      await Bus.insertMany(newOnes, { ordered: false });
      console.log(`✅ Inserted ${newOnes.length} new buses`);
    } else {
      console.log('No new buses to insert');
    }
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

main();



// Export all routes to a JSON file for permanent backup
// Usage: node backup-routes-to-file.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
// Load mongoose from backend's node_modules to avoid duplicate install at root
const mongoose = require('./backend/node_modules/mongoose');

const Route = require('./backend/models/Route');

async function run() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp';
  console.log('Connecting to MongoDB:', mongoUri);
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    const routes = await Route.find({}).lean();
    console.log(`Found ${routes.length} routes. Writing backup...`);

    const outDir = path.resolve(process.cwd());
    const fileName = `routes-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const outPath = path.join(outDir, fileName);

    fs.writeFileSync(outPath, JSON.stringify({ count: routes.length, routes }, null, 2), 'utf-8');
    console.log('✅ Backup written to:', outPath);
  } catch (err) {
    console.error('❌ Backup failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();



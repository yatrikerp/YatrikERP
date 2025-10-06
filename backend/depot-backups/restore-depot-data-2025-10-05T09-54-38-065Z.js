const mongoose = require('mongoose');
const fs = require('fs');
const Depot = require('./models/Depot');
const DepotUser = require('./models/DepotUser');
require('dotenv').config();

async function restoreDepotData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Depot.deleteMany({});
    await DepotUser.deleteMany({});
    console.log('🧹 Cleared existing depot data');

    // Restore depots
    const depotsData = JSON.parse(fs.readFileSync('D:\YATRIK_BACKUP\backend\depot-backups\depots-backup-2025-10-05T09-54-38-065Z.json', 'utf8'));
    await Depot.insertMany(depotsData);
    console.log(`✅ Restored ${depotsData.length} depots`);

    // Restore depot users
    const depotUsersData = JSON.parse(fs.readFileSync('D:\YATRIK_BACKUP\backend\depot-backups\depot-users-backup-2025-10-05T09-54-38-065Z.json', 'utf8'));
    await DepotUser.insertMany(depotUsersData);
    console.log(`✅ Restored ${depotUsersData.length} depot users`);

    console.log('🎉 Depot data restoration completed successfully!');
  } catch (error) {
    console.error('❌ Error restoring depot data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

restoreDepotData();
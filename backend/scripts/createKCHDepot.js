const mongoose = require('mongoose');
const Depot = require('../models/Depot');
const DepotUser = require('../models/DepotUser');
require('dotenv').config();

async function createKCHDepot() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrikerp_final', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Check if KCH depot already exists
    let depot = await Depot.findOne({ depotCode: 'KCH' });
    
    if (!depot) {
      // Create KCH Depot
      depot = new Depot({
        depotName: 'Kochi Central Depot',
        depotCode: 'KCH',
        code: 'KCH',
        location: 'Kochi, Kerala',
        address: 'Kochi Central Bus Station, Ernakulam',
        contact: '+91-484-1234567',
        email: 'kch-depot@yatrik.com',
        manager: 'Kochi Depot Manager',
        capacity: 150,
        operationalHours: {
          start: '05:00',
          end: '23:00'
        },
        established: new Date('2020-01-01'),
        status: 'active'
      });
      await depot.save();
      console.log('✅ Created KCH Depot');
    } else {
      console.log('ℹ️  KCH Depot already exists');
    }

    // Check if depot user exists
    let depotUser = await DepotUser.findOne({ email: 'kch-depot@yatrik.com' });
    
    if (!depotUser) {
      // Create Depot User
      depotUser = new DepotUser({
        username: 'kch_depot_manager',
        email: 'kch-depot@yatrik.com',
        password: 'KCH@2024', // Will be hashed by pre-save middleware
        depotId: depot._id,
        depotCode: 'KCH',
        depotName: depot.depotName,
        role: 'depot_manager',
        status: 'active',
        permissions: [
          'manage_buses',
          'view_buses',
          'manage_routes',
          'view_routes',
          'manage_schedules',
          'view_schedules',
          'manage_staff',
          'view_staff',
          'view_reports',
          'manage_depot_info',
          'view_depot_info'
        ]
      });
      await depotUser.save();
      console.log('✅ Created KCH Depot User');
    } else {
      // Update password if needed
      depotUser.password = 'KCH@2024';
      depotUser.depotId = depot._id;
      depotUser.status = 'active';
      await depotUser.save();
      console.log('✅ Updated KCH Depot User');
    }

    console.log('\n📋 KCH Depot Credentials:');
    console.log('   Email: kch-depot@yatrik.com');
    console.log('   Password: KCH@2024');
    console.log('   Depot Code: KCH');
    console.log('   Depot Name: Kochi Central Depot');
    console.log('\n✅ Setup complete!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createKCHDepot();

const mongoose = require('mongoose');
const DepotUser = require('../models/DepotUser');
const Depot = require('../models/Depot');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    await createDepotUser();
    console.log('Depot user created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating depot user:', error);
    process.exit(1);
  }
});

async function createDepotUser() {
  // Find or create a depot first
  let depot = await Depot.findOne({ depotCode: 'MUM-CENTRAL-001' });
  
  if (!depot) {
    console.log('Creating depot first...');
    depot = await Depot.create({
      depotCode: 'MUM-CENTRAL-001',
      depotName: 'Central Transport Hub',
      location: {
        address: 'Station Road, Mumbai Central',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400008',
        coordinates: { latitude: 19.0760, longitude: 72.8777 }
      },
      contact: {
        phone: '+91-22-2307-0000',
        email: 'central@yatrik.com',
        manager: {
          name: 'Rajesh Kumar',
          phone: '+91-98765-43210',
          email: 'rajesh.kumar@yatrik.com'
        }
      },
      capacity: {
        totalBuses: 50,
        availableBuses: 45,
        maintenanceBuses: 5
      },
      operatingHours: {
        openTime: '05:00',
        closeTime: '23:00',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      facilities: ['Fuel_Station', 'Maintenance_Bay', 'Washing_Bay', 'Parking_Lot', 'Driver_Rest_Room', 'Canteen', 'Security_Office', 'Admin_Office'],
      status: 'active',
      isActive: true
    });
    console.log('Created depot:', depot.depotName);
  } else {
    console.log('Using existing depot:', depot.depotName);
  }

  // Check if depot user already exists
  let depotUser = await DepotUser.findOne({ email: 'depot-plk@yatrik.com' });
  
  if (!depotUser) {
    depotUser = await DepotUser.create({
      username: 'depot-plk',
      email: 'depot-plk@yatrik.com',
      password: 'depot123',
      depotId: depot._id,
      depotCode: depot.depotCode,
      depotName: depot.depotName,
      role: 'depot_manager',
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
      ],
      status: 'active'
    });
    console.log('✅ Created depot user:', depotUser.email);
    console.log('📋 Login credentials:');
    console.log('   Email: depot-plk@yatrik.com');
    console.log('   Password: depot123');
  } else {
    console.log('✅ Depot user already exists:', depotUser.email);
    console.log('📋 Login credentials:');
    console.log('   Email: depot-plk@yatrik.com');
    console.log('   Password: depot123');
  }
}


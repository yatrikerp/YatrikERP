const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Since we're in backend directory, use direct relative paths
const User = require('./models/User');
const DepotUser = require('./models/DepotUser');
const Conductor = require('./models/Conductor');
const Driver = require('./models/Driver');
const Depot = require('./models/Depot');

require('dotenv').config();

async function createTestUsers() {
  console.log('Starting test user creation...');
  console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Configured' : 'Using default');
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('Connected to MongoDB successfully!');
    
    // Create a test depot first
    const depot = await Depot.findOneAndUpdate(
      { depotCode: 'TVM001' },
      {
        depotName: 'Trivandrum Central Depot',
        depotCode: 'TVM001',
        location: {
          address: 'Central Bus Station, Trivandrum',
          coordinates: {
            latitude: 8.5241,
            longitude: 76.9366
          }
        },
        status: 'active'
      },
      { upsert: true, new: true }
    );

    console.log('Created depot:', depot.depotCode);

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('Test@123', 10);

    // 1. Create Admin User
    const admin = await User.findOneAndUpdate(
      { email: 'admin@yatrik.com' },
      {
        name: 'Admin User',
        email: 'admin@yatrik.com',
        phone: '+919876543210',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        emailVerified: true
      },
      { upsert: true, new: true }
    );
    console.log('Created admin:', admin.email);
    
    // Get admin user ID for createdBy field
    const adminId = admin._id;

    // 2. Create Depot Manager
    const depotManager = await DepotUser.findOneAndUpdate(
      { email: 'tvm-depot@yatrik.com' },
      {
        username: 'tvm-depot',
        email: 'tvm-depot@yatrik.com',
        password: hashedPassword,
        role: 'depot_manager',
        depotId: depot._id,
        depotCode: depot.depotCode,
        depotName: depot.depotName,
        permissions: ['manage_buses', 'manage_routes', 'manage_schedules', 'manage_staff'],
        status: 'active'
      },
      { upsert: true, new: true }
    );
    console.log('Created depot manager:', depotManager.email);

    // Delete existing test conductor and driver before creating new ones
    await Conductor.deleteMany({ $or: [{ username: 'conductor001' }, { conductorId: 'COND001' }] });
    await Driver.deleteMany({ $or: [{ username: 'driver001' }, { driverId: 'DRV001' }] });

    // 3. Create Conductor
    const conductor = new Conductor({
      conductorId: 'COND001',
      name: 'Test Conductor',
      username: 'conductor001',
      password: hashedPassword,
      email: 'conductor@yatrik.com',
      phone: '+919876543211',
      employeeCode: 'EMP-COND-001',
      depotId: depot._id,
      status: 'active',
      createdBy: adminId
    });
    await conductor.save();
    console.log('Created conductor:', conductor.username);

    // 4. Create Driver
    const driver = new Driver({
      driverId: 'DRV001',
      name: 'Test Driver',
      username: 'driver001',
      password: hashedPassword,
      email: 'driver@yatrik.com',
      phone: '+919876543212',
      employeeCode: 'EMP-DRV-001',
      depotId: depot._id,
      drivingLicense: {
        licenseNumber: 'KL-2023-0123456789',
        licenseType: 'HMV',
        expiryDate: new Date('2025-12-31'),
        status: 'valid'
      },
      status: 'active',
      createdBy: adminId
    });
    await driver.save();
    console.log('Created driver:', driver.username);

    // 5. Create Passenger
    const passenger = await User.findOneAndUpdate(
      { email: 'passenger@example.com' },
      {
        name: 'Test Passenger',
        email: 'passenger@example.com',
        phone: '+919876543213',
        password: hashedPassword,
        role: 'passenger',
        status: 'active',
        emailVerified: true
      },
      { upsert: true, new: true }
    );
    console.log('Created passenger:', passenger.email);

    console.log('\n✅ All test users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('==================');
    console.log('Admin: admin@yatrik.com / Test@123');
    console.log('Depot: tvm-depot@yatrik.com / Test@123');
    console.log('Conductor: conductor001 / Test@123');
    console.log('Driver: driver001 / Test@123');
    console.log('Passenger: passenger@example.com / Test@123');

  } catch (error) {
    console.error('Error creating test users:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    console.log('Closing MongoDB connection...');
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
}

createTestUsers().then(() => {
  console.log('Script completed.');
  process.exit(0);
}).catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});

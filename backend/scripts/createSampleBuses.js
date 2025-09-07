const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const Depot = require('../models/Depot');
const User = require('../models/User');

async function createSampleData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');

    // Find or create an admin user
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = new User({
        name: 'Admin User',
        email: 'admin@yatrik.com',
        password: '$2a$10$hashedpassword', // This would be properly hashed in real scenario
        role: 'admin',
        status: 'active'
      });
      await adminUser.save();
      console.log('Created admin user');
    }

    // Create a sample depot if it doesn't exist
    let depot = await Depot.findOne();
    if (!depot) {
      depot = new Depot({
        depotCode: 'MAIN001',
        depotName: 'Main Depot',
        location: {
          address: '123 Main Street, Central City',
          city: 'Central City',
          state: 'Maharashtra',
          pincode: '400001'
        },
        contact: {
          phone: '+1234567890',
          email: 'maindepot@yatrik.com'
        },
        capacity: {
          totalBuses: 50,
          availableBuses: 45
        },
        operatingHours: {
          openTime: '06:00',
          closeTime: '22:00'
        },
        facilities: ['Fuel_Station', 'Maintenance_Bay', 'Washing_Bay'],
        status: 'active',
        createdBy: adminUser._id
      });
      await depot.save();
      console.log('Created sample depot');
    }

    // Create sample buses
    const sampleBuses = [
      {
        busNumber: 'BUS001',
        registrationNumber: 'MH01AB1234',
        busType: 'ac_sleeper',
        capacity: {
          total: 40,
          sleeper: 40,
          seater: 0,
          ladies: 4,
          disabled: 2
        },
        depotId: depot._id,
        status: 'active',
        fuelType: 'diesel',
        lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        nextMaintenance: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        odometerReading: 50000,
        lastKnownLocation: { lat: 19.0760, lng: 72.8777 },
        assignedBy: depot._id
      },
      {
        busNumber: 'BUS002',
        registrationNumber: 'MH01CD5678',
        busType: 'ac_seater',
        capacity: {
          total: 35,
          sleeper: 0,
          seater: 35,
          ladies: 3,
          disabled: 1
        },
        depotId: depot._id,
        status: 'active',
        fuelType: 'diesel',
        lastMaintenance: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        nextMaintenance: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        odometerReading: 45000,
        lastKnownLocation: { lat: 19.0760, lng: 72.8777 },
        assignedBy: depot._id
      },
      {
        busNumber: 'BUS003',
        registrationNumber: 'MH01EF9012',
        busType: 'non_ac_seater',
        capacity: {
          total: 50,
          sleeper: 0,
          seater: 50,
          ladies: 5,
          disabled: 2
        },
        depotId: depot._id,
        status: 'maintenance',
        fuelType: 'diesel',
        lastMaintenance: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        nextMaintenance: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000),
        odometerReading: 75000,
        lastKnownLocation: { lat: 19.0760, lng: 72.8777 },
        assignedBy: depot._id
      },
      {
        busNumber: 'BUS004',
        registrationNumber: 'MH01GH3456',
        busType: 'ac_sleeper',
        capacity: {
          total: 40,
          sleeper: 40,
          seater: 0,
          ladies: 4,
          disabled: 2
        },
        depotId: depot._id,
        status: 'active',
        fuelType: 'cng',
        lastMaintenance: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        nextMaintenance: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000),
        odometerReading: 30000,
        lastKnownLocation: { lat: 19.0760, lng: 72.8777 },
        assignedBy: depot._id
      },
      {
        busNumber: 'BUS005',
        registrationNumber: 'MH01IJ7890',
        busType: 'ac_seater',
        capacity: {
          total: 35,
          sleeper: 0,
          seater: 35,
          ladies: 3,
          disabled: 1
        },
        depotId: depot._id,
        status: 'inactive',
        fuelType: 'diesel',
        lastMaintenance: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        odometerReading: 90000,
        lastKnownLocation: { lat: 19.0760, lng: 72.8777 },
        assignedBy: depot._id
      }
    ];

    // Clear existing buses and insert new ones
    await Bus.deleteMany({});
    await Bus.insertMany(sampleBuses);

    console.log('Created', sampleBuses.length, 'sample buses');
    console.log('Sample data created successfully!');

  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createSampleData();

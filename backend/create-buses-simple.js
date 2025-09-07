const mongoose = require('mongoose');
const Bus = require('./models/Bus');
const Depot = require('./models/Depot');

async function createBuses() {
  try {
    await mongoose.connect('mongodb://localhost:27017/yatrik_erp');
    console.log('Connected to MongoDB');

    // Find depot
    const depot = await Depot.findOne();
    if (!depot) {
      console.log('No depot found, creating one...');
      const User = require('./models/User');
      const adminUser = await User.findOne({ role: 'admin' });
      
      const newDepot = new Depot({
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
      await newDepot.save();
      console.log('Created depot');
    }

    // Clear existing buses
    await Bus.deleteMany({});
    console.log('Cleared existing buses');

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
      }
    ];

    await Bus.insertMany(sampleBuses);
    console.log('Created', sampleBuses.length, 'sample buses');

    // Test the API response
    const buses = await Bus.find().populate('depotId', 'depotName');
    console.log('Buses in database:', buses.length);
    console.log('Sample bus:', buses[0]);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createBuses();

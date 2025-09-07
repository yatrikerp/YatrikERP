const mongoose = require('mongoose');
const Bus = require('./models/Bus');
const Depot = require('./models/Depot');
require('dotenv').config();

async function createBuses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');
    console.log('Connected to MongoDB');

    // Get or create a depot
    let depot = await Depot.findOne();
    if (!depot) {
      depot = new Depot({
        depotName: 'Central Transport Hub',
        code: 'CTH',
        location: {
          address: 'Central Bus Station, Mumbai',
          coordinates: { lat: 19.0760, lng: 72.8777 }
        },
        contact: {
          phone: '+91-22-12345678',
          email: 'central@yatrik.com'
        },
        capacity: 100,
        status: 'active'
      });
      await depot.save();
      console.log('Created depot:', depot.depotName);
    }

    // Create sample buses
    const buses = [
      {
        busNumber: 'KA-01-AB-1234',
        registrationNumber: 'KA01AB1234',
        depotId: depot._id,
        busType: 'ac_sleeper',
        capacity: { total: 40, sleeper: 40, seater: 0, ladies: 8, disabled: 2 },
        amenities: ['AC', 'WiFi', 'Charging Points', 'Blankets', 'Water Bottles'],
        specifications: {
          make: 'Volvo',
          model: 'B9R',
          year: 2023,
          engine: 'Diesel',
          fuelCapacity: 400
        },
        status: 'active',
        currentLocation: {
          lat: 19.0760,
          lng: 72.8777,
          lastUpdated: new Date()
        }
      },
      {
        busNumber: 'KA-01-CD-5678',
        registrationNumber: 'KA01CD5678',
        depotId: depot._id,
        busType: 'non_ac_seater',
        capacity: { total: 50, sleeper: 0, seater: 50, ladies: 10, disabled: 2 },
        amenities: ['WiFi', 'Charging Points'],
        specifications: {
          make: 'Tata',
          model: 'Starbus',
          year: 2022,
          engine: 'Diesel',
          fuelCapacity: 300
        },
        status: 'active',
        currentLocation: {
          lat: 19.0760,
          lng: 72.8777,
          lastUpdated: new Date()
        }
      },
      {
        busNumber: 'KA-01-EF-9012',
        registrationNumber: 'KA01EF9012',
        depotId: depot._id,
        busType: 'ac_seater',
        capacity: { total: 45, sleeper: 0, seater: 45, ladies: 9, disabled: 2 },
        amenities: ['AC', 'WiFi', 'Charging Points', 'Water Bottles'],
        specifications: {
          make: 'Ashok Leyland',
          model: 'Viking',
          year: 2023,
          engine: 'Diesel',
          fuelCapacity: 350
        },
        status: 'maintenance',
        currentLocation: {
          lat: 19.0760,
          lng: 72.8777,
          lastUpdated: new Date()
        }
      }
    ];

    // Clear existing buses
    await Bus.deleteMany({});
    console.log('Cleared existing buses');

    // Create new buses
    for (const busData of buses) {
      const bus = new Bus(busData);
      await bus.save();
      console.log(`Created bus: ${bus.busNumber}`);
    }

    console.log(`Successfully created ${buses.length} buses`);
    
  } catch (error) {
    console.error('Error creating buses:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createBuses();

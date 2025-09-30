const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Depot = require('../models/Depot');
const User = require('../models/User');
require('dotenv').config();

const createSampleData = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get the first depot
    const depot = await Depot.findOne({ status: 'active' });
    if (!depot) {
      console.log('❌ No active depot found. Please create a depot first.');
      return;
    }
    console.log(`🏢 Using depot: ${depot.depotName}`);

    // Get admin user for assignment
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('❌ No admin user found.');
      return;
    }

    // Create sample buses
    const sampleBuses = [
      {
        busNumber: 'KL-01-AB-1234',
        registrationNumber: 'KL01AB1234',
        depotId: depot._id,
        busType: 'super_deluxe',
        capacity: { total: 50, seater: 50 },
        amenities: ['wifi', 'ac', 'charging'],
        status: 'idle',
        assignedBy: adminUser._id,
        specifications: {
          manufacturer: 'Tata',
          model: 'Starbus',
          year: 2023,
          fuelType: 'diesel',
          mileage: 8
        },
        fareInfo: {
          baseFarePerKm: 2.5,
          minimumFare: 10,
          routeType: 'intercity'
        },
        documents: {
          insurance: { expiryDate: new Date('2025-12-31') },
          fitness: { expiryDate: new Date('2025-12-31') }
        }
      },
      {
        busNumber: 'KL-02-CD-5678',
        registrationNumber: 'KL02CD5678',
        depotId: depot._id,
        busType: 'fast_passenger',
        capacity: { total: 45, seater: 45 },
        amenities: ['wifi'],
        status: 'idle',
        assignedBy: adminUser._id,
        specifications: {
          manufacturer: 'Ashok Leyland',
          model: 'Viking',
          year: 2022,
          fuelType: 'diesel',
          mileage: 7
        },
        fareInfo: {
          baseFarePerKm: 2.0,
          minimumFare: 8,
          routeType: 'intercity'
        },
        documents: {
          insurance: { expiryDate: new Date('2025-12-31') },
          fitness: { expiryDate: new Date('2025-12-31') }
        }
      },
      {
        busNumber: 'KL-03-EF-9012',
        registrationNumber: 'KL03EF9012',
        depotId: depot._id,
        busType: 'ordinary',
        capacity: { total: 40, seater: 40 },
        amenities: [],
        status: 'idle',
        assignedBy: adminUser._id,
        specifications: {
          manufacturer: 'Mahindra',
          model: 'Comfio',
          year: 2021,
          fuelType: 'diesel',
          mileage: 6
        },
        fareInfo: {
          baseFarePerKm: 1.5,
          minimumFare: 5,
          routeType: 'local'
        },
        documents: {
          insurance: { expiryDate: new Date('2025-12-31') },
          fitness: { expiryDate: new Date('2025-12-31') }
        }
      }
    ];

    console.log('🚌 Creating sample buses...');
    const createdBuses = await Bus.insertMany(sampleBuses);
    console.log(`✅ Created ${createdBuses.length} buses`);

    // Create sample routes
    const sampleRoutes = [
      {
        routeNumber: 'R001',
        routeName: 'Thiruvananthapuram - Kochi',
        origin: {
          name: 'Thiruvananthapuram Central',
          city: 'Thiruvananthapuram',
          state: 'Kerala',
          pincode: '695001',
          coordinates: { latitude: 8.5241, longitude: 76.9366 }
        },
        destination: {
          name: 'Kochi Central',
          city: 'Kochi',
          state: 'Kerala',
          pincode: '682001',
          coordinates: { latitude: 9.9312, longitude: 76.2673 }
        },
        depot: { depotId: depot._id },
        distance: 220, // km
        estimatedDuration: 300, // minutes
        routeType: 'intercity',
        status: 'active',
        isActive: true,
        schedules: [
          {
            departureTime: '06:00',
            arrivalTime: '11:00',
            frequency: 'daily',
            isActive: true,
            fare: {
              baseFare: 150,
              perKmRate: 2.5
            }
          },
          {
            departureTime: '14:00',
            arrivalTime: '19:00',
            frequency: 'daily',
            isActive: true,
            fare: {
              baseFare: 150,
              perKmRate: 2.5
            }
          }
        ],
        stops: [
          { name: 'Thiruvananthapuram Central', sequence: 1, distance: 0 },
          { name: 'Kollam', sequence: 2, distance: 70 },
          { name: 'Alappuzha', sequence: 3, distance: 140 },
          { name: 'Kochi Central', sequence: 4, distance: 220 }
        ],
        createdBy: adminUser._id
      },
      {
        routeNumber: 'R002',
        routeName: 'Kochi - Kozhikode',
        origin: {
          name: 'Kochi Central',
          city: 'Kochi',
          state: 'Kerala',
          pincode: '682001',
          coordinates: { latitude: 9.9312, longitude: 76.2673 }
        },
        destination: {
          name: 'Kozhikode Central',
          city: 'Kozhikode',
          state: 'Kerala',
          pincode: '673001',
          coordinates: { latitude: 11.2588, longitude: 75.7804 }
        },
        depot: { depotId: depot._id },
        distance: 180, // km
        estimatedDuration: 240, // minutes
        routeType: 'intercity',
        status: 'active',
        isActive: true,
        schedules: [
          {
            departureTime: '07:00',
            arrivalTime: '11:00',
            frequency: 'daily',
            isActive: true,
            fare: {
              baseFare: 120,
              perKmRate: 2.0
            }
          },
          {
            departureTime: '15:00',
            arrivalTime: '19:00',
            frequency: 'daily',
            isActive: true,
            fare: {
              baseFare: 120,
              perKmRate: 2.0
            }
          }
        ],
        stops: [
          { name: 'Kochi Central', sequence: 1, distance: 0 },
          { name: 'Thrissur', sequence: 2, distance: 80 },
          { name: 'Kozhikode Central', sequence: 3, distance: 180 }
        ],
        createdBy: adminUser._id
      }
    ];

    console.log('🛣️ Creating sample routes...');
    const createdRoutes = await Route.insertMany(sampleRoutes);
    console.log(`✅ Created ${createdRoutes.length} routes`);

    console.log('🎉 Sample data created successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Buses: ${createdBuses.length}`);
    console.log(`   - Routes: ${createdRoutes.length}`);
    console.log(`   - Depot: ${depot.depotName}`);

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

createSampleData();

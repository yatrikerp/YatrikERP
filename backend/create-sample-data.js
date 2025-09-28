const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Bus = require('./models/Bus');
const Route = require('./models/Route');
const Trip = require('./models/Trip');
const User = require('./models/User');
const Depot = require('./models/Depot');

async function createSampleData() {
  try {
    console.log('🏗️ Creating sample data for auto scheduler...\n');
    
    // Create sample depot
    let depot = await Depot.findOne({ depotName: 'Test Depot' });
    if (!depot) {
      depot = new Depot({
        depotName: 'Test Depot',
        depotCode: 'TD001',
        location: 'Test City',
        address: '123 Test Street',
        phone: '1234567890',
        email: 'test@depot.com',
        status: 'active'
      });
      await depot.save();
      console.log('✅ Created sample depot');
    } else {
      console.log('✅ Sample depot already exists');
    }
    
    // Create sample buses
    const existingBuses = await Bus.countDocuments({ depotId: depot._id });
    if (existingBuses === 0) {
      const buses = [
        {
          busNumber: 'TN-01-AB-1234',
          busType: 'AC Semi Sleeper',
          capacity: { total: 45, sleeper: 20, seating: 25 },
          depotId: depot._id,
          status: 'active',
          features: ['AC', 'WiFi', 'Charging Points'],
          manufacturer: 'Tata',
          model: 'Starbus',
          year: 2023
        },
        {
          busNumber: 'TN-01-CD-5678',
          busType: 'Non-AC Seater',
          capacity: { total: 50, seating: 50 },
          depotId: depot._id,
          status: 'active',
          features: ['WiFi'],
          manufacturer: 'Ashok Leyland',
          model: 'Viking',
          year: 2022
        },
        {
          busNumber: 'TN-01-EF-9012',
          busType: 'AC Seater',
          capacity: { total: 40, seating: 40 },
          depotId: depot._id,
          status: 'active',
          features: ['AC', 'WiFi', 'Charging Points'],
          manufacturer: 'Volvo',
          model: 'B9R',
          year: 2023
        }
      ];
      
      await Bus.insertMany(buses);
      console.log('✅ Created 3 sample buses');
    } else {
      console.log('✅ Sample buses already exist');
    }
    
    // Create sample routes
    const existingRoutes = await Route.countDocuments({ 'depot.depotId': depot._id });
    if (existingRoutes === 0) {
      const routes = [
        {
          routeNumber: 'R001',
          routeName: 'Test City to Sample Town',
          startingPoint: {
            location: 'Test City Bus Stand',
            city: 'Test City',
            state: 'Test State',
            coordinates: { lat: 12.9716, lng: 77.5946 }
          },
          endingPoint: {
            location: 'Sample Town Bus Stand',
            city: 'Sample Town',
            state: 'Test State',
            coordinates: { lat: 13.0827, lng: 80.2707 }
          },
          distance: 150,
          estimatedDuration: 180, // 3 hours
          baseFare: 250,
          depot: { depotId: depot._id },
          status: 'active',
          isActive: true,
          features: ['AC', 'WiFi'],
          schedules: [
            {
              departureTime: '06:00',
              arrivalTime: '09:00',
              daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
              isActive: true
            },
            {
              departureTime: '14:00',
              arrivalTime: '17:00',
              daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
              isActive: true
            }
          ]
        },
        {
          routeNumber: 'R002',
          routeName: 'Test City to Demo City',
          startingPoint: {
            location: 'Test City Central',
            city: 'Test City',
            state: 'Test State',
            coordinates: { lat: 12.9716, lng: 77.5946 }
          },
          endingPoint: {
            location: 'Demo City Bus Stand',
            city: 'Demo City',
            state: 'Test State',
            coordinates: { lat: 11.2588, lng: 75.7804 }
          },
          distance: 200,
          estimatedDuration: 240, // 4 hours
          baseFare: 350,
          depot: { depotId: depot._id },
          status: 'active',
          isActive: true,
          features: ['AC', 'WiFi', 'Charging Points'],
          schedules: [
            {
              departureTime: '08:00',
              arrivalTime: '12:00',
              daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
              isActive: true
            },
            {
              departureTime: '16:00',
              arrivalTime: '20:00',
              daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
              isActive: true
            }
          ]
        }
      ];
      
      await Route.insertMany(routes);
      console.log('✅ Created 2 sample routes');
    } else {
      console.log('✅ Sample routes already exist');
    }
    
    // Create sample drivers
    const existingDrivers = await User.countDocuments({ role: 'driver', depotId: depot._id });
    if (existingDrivers === 0) {
      const drivers = [
        {
          name: 'John Driver',
          email: 'john.driver@test.com',
          phone: '9876543210',
          role: 'driver',
          depotId: depot._id,
          status: 'active',
          isActive: true,
          licenseNumber: 'DL123456789',
          licenseExpiry: new Date('2025-12-31'),
          address: '123 Driver Street, Test City'
        },
        {
          name: 'Mike Driver',
          email: 'mike.driver@test.com',
          phone: '9876543211',
          role: 'driver',
          depotId: depot._id,
          status: 'active',
          isActive: true,
          licenseNumber: 'DL123456790',
          licenseExpiry: new Date('2025-12-31'),
          address: '456 Driver Avenue, Test City'
        },
        {
          name: 'David Driver',
          email: 'david.driver@test.com',
          phone: '9876543212',
          role: 'driver',
          depotId: depot._id,
          status: 'active',
          isActive: true,
          licenseNumber: 'DL123456791',
          licenseExpiry: new Date('2025-12-31'),
          address: '789 Driver Road, Test City'
        }
      ];
      
      await User.insertMany(drivers);
      console.log('✅ Created 3 sample drivers');
    } else {
      console.log('✅ Sample drivers already exist');
    }
    
    // Create sample conductors
    const existingConductors = await User.countDocuments({ role: 'conductor', depotId: depot._id });
    if (existingConductors === 0) {
      const conductors = [
        {
          name: 'Alice Conductor',
          email: 'alice.conductor@test.com',
          phone: '9876543213',
          role: 'conductor',
          depotId: depot._id,
          status: 'active',
          isActive: true,
          employeeId: 'EMP001',
          address: '123 Conductor Street, Test City'
        },
        {
          name: 'Bob Conductor',
          email: 'bob.conductor@test.com',
          phone: '9876543214',
          role: 'conductor',
          depotId: depot._id,
          status: 'active',
          isActive: true,
          employeeId: 'EMP002',
          address: '456 Conductor Avenue, Test City'
        },
        {
          name: 'Carol Conductor',
          email: 'carol.conductor@test.com',
          phone: '9876543215',
          role: 'conductor',
          depotId: depot._id,
          status: 'active',
          isActive: true,
          employeeId: 'EMP003',
          address: '789 Conductor Road, Test City'
        }
      ];
      
      await User.insertMany(conductors);
      console.log('✅ Created 3 sample conductors');
    } else {
      console.log('✅ Sample conductors already exist');
    }
    
    console.log('\n🎉 Sample data creation completed!');
    console.log('Now try running the auto scheduler again.');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    mongoose.connection.close();
  }
}

createSampleData();

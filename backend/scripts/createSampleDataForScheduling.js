const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');
const Route = require('../models/Route');
const Depot = require('../models/Depot');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createSampleData() {
  try {
    console.log('Creating sample data for Bus Scheduling...');

    // Find or create a depot
    let depot = await Depot.findOne({ status: 'active' });
    if (!depot) {
      depot = new Depot({
        depotName: 'Main Depot',
        location: 'Kochi, Kerala',
        address: '123 Main Street, Kochi',
        contactNumber: '+91-9876543210',
        email: 'main@yatrik.com',
        status: 'active',
        capacity: 50,
        facilities: ['Parking', 'Maintenance', 'Fuel Station'],
        coordinates: { latitude: 9.9312, longitude: 76.2673 }
      });
      await depot.save();
      console.log('Created depot:', depot.depotName);
    }

    // Create sample buses
    const buses = [
      {
        busNumber: 'KL-01-AB-1234',
        registrationNumber: 'KL-01-AB-1234',
        busType: 'ac_seater',
        capacity: {
          total: 45,
          seater: 45,
          sleeper: 0,
          ladies: 5,
          disabled: 2
        },
        depotId: depot._id,
        status: 'active',
        assignedBy: depot._id,
        specifications: {
          manufacturer: 'Tata',
          model: 'Starbus',
          year: 2023,
          fuelType: 'diesel',
          mileage: 8,
          maxSpeed: 80
        },
        amenities: ['ac', 'wifi', 'charging', 'refreshments'],
        lastMaintenance: new Date(),
        odometerReading: 50000,
        lastFuelReading: 200,
        lastFuelDate: new Date()
      },
      {
        busNumber: 'KL-01-CD-5678',
        registrationNumber: 'KL-01-CD-5678',
        busType: 'non_ac_seater',
        capacity: {
          total: 50,
          seater: 50,
          sleeper: 0,
          ladies: 5,
          disabled: 2
        },
        depotId: depot._id,
        status: 'active',
        assignedBy: depot._id,
        specifications: {
          manufacturer: 'Ashok Leyland',
          model: 'Viking',
          year: 2022,
          fuelType: 'diesel',
          mileage: 7,
          maxSpeed: 75
        },
        amenities: ['refreshments'],
        lastMaintenance: new Date(),
        odometerReading: 75000,
        lastFuelReading: 180,
        lastFuelDate: new Date()
      },
      {
        busNumber: 'KL-01-EF-9012',
        registrationNumber: 'KL-01-EF-9012',
        busType: 'ac_sleeper',
        capacity: {
          total: 30,
          seater: 0,
          sleeper: 30,
          ladies: 3,
          disabled: 1
        },
        depotId: depot._id,
        status: 'active',
        assignedBy: depot._id,
        specifications: {
          manufacturer: 'Volvo',
          model: 'B9R',
          year: 2023,
          fuelType: 'diesel',
          mileage: 6,
          maxSpeed: 100
        },
        amenities: ['ac', 'wifi', 'charging', 'refreshments', 'entertainment'],
        lastMaintenance: new Date(),
        odometerReading: 30000,
        lastFuelReading: 250,
        lastFuelDate: new Date()
      }
    ];

    for (const busData of buses) {
      const existingBus = await Bus.findOne({ busNumber: busData.busNumber });
      if (!existingBus) {
        try {
          const bus = new Bus(busData);
          await bus.save();
          console.log('Created bus:', bus.busNumber);
        } catch (error) {
          console.log('Error creating bus', busData.busNumber, ':', error.message);
        }
      } else {
        console.log('Bus already exists:', busData.busNumber);
      }
    }

    // Create sample drivers
    const drivers = [
      {
        driverId: 'DRV001',
        name: 'Rajesh Kumar',
        employeeCode: 'DRV001',
        username: 'rajesh.kumar',
        password: 'password123',
        phone: '+91-9876543210',
        email: 'rajesh@yatrik.com',
        licenseNumber: 'DL123456789',
        licenseExpiry: new Date('2025-12-31'),
        address: {
          street: '123 Main Street',
          city: 'Kochi',
          state: 'Kerala',
          pincode: '682001'
        },
        dateOfBirth: new Date('1985-05-15'),
        joiningDate: new Date('2020-01-01'),
        status: 'active',
        depotId: depot._id,
        createdBy: depot._id,
        experience: 5,
        emergencyContact: '+91-9876543211',
        bloodGroup: 'O+',
        salary: 25000
      },
      {
        driverId: 'DRV002',
        name: 'Suresh Nair',
        employeeCode: 'DRV002',
        username: 'suresh.nair',
        password: 'password123',
        phone: '+91-9876543212',
        email: 'suresh@yatrik.com',
        licenseNumber: 'DL987654321',
        licenseExpiry: new Date('2026-06-30'),
        address: {
          street: '456 Park Avenue',
          city: 'Kochi',
          state: 'Kerala',
          pincode: '682002'
        },
        dateOfBirth: new Date('1988-08-20'),
        joiningDate: new Date('2021-03-15'),
        status: 'active',
        depotId: depot._id,
        createdBy: depot._id,
        experience: 3,
        emergencyContact: '+91-9876543213',
        bloodGroup: 'A+',
        salary: 22000
      },
      {
        driverId: 'DRV003',
        name: 'Manoj Pillai',
        employeeCode: 'DRV003',
        username: 'manoj.pillai',
        password: 'password123',
        phone: '+91-9876543214',
        email: 'manoj@yatrik.com',
        licenseNumber: 'DL456789123',
        licenseExpiry: new Date('2027-03-15'),
        address: {
          street: '789 MG Road',
          city: 'Kochi',
          state: 'Kerala',
          pincode: '682003'
        },
        dateOfBirth: new Date('1982-12-10'),
        joiningDate: new Date('2019-07-01'),
        status: 'active',
        depotId: depot._id,
        createdBy: depot._id,
        experience: 7,
        emergencyContact: '+91-9876543215',
        bloodGroup: 'B+',
        salary: 28000
      }
    ];

    for (const driverData of drivers) {
      const existingDriver = await Driver.findOne({ driverId: driverData.driverId });
      if (!existingDriver) {
        try {
          const driver = new Driver(driverData);
          await driver.save();
          console.log('Created driver:', driver.name);
        } catch (error) {
          console.log('Error creating driver', driverData.driverId, ':', error.message);
        }
      } else {
        console.log('Driver already exists:', driverData.driverId);
      }
    }

    // Create sample conductors
    const conductors = [
      {
        conductorId: 'CON001',
        name: 'Priya Menon',
        employeeCode: 'CON001',
        username: 'priya.menon',
        password: 'password123',
        phone: '+91-9876543216',
        email: 'priya@yatrik.com',
        address: {
          street: '321 Church Street',
          city: 'Kochi',
          state: 'Kerala',
          pincode: '682001'
        },
        dateOfBirth: new Date('1990-03-25'),
        joiningDate: new Date('2021-01-15'),
        status: 'active',
        depotId: depot._id,
        createdBy: depot._id,
        experience: 2,
        emergencyContact: '+91-9876543217',
        bloodGroup: 'AB+',
        salary: 18000
      },
      {
        conductorId: 'CON002',
        name: 'Anil Kumar',
        employeeCode: 'CON002',
        username: 'anil.kumar',
        password: 'password123',
        phone: '+91-9876543218',
        email: 'anil@yatrik.com',
        address: {
          street: '654 Market Road',
          city: 'Kochi',
          state: 'Kerala',
          pincode: '682002'
        },
        dateOfBirth: new Date('1987-11-12'),
        joiningDate: new Date('2020-06-01'),
        status: 'active',
        depotId: depot._id,
        createdBy: depot._id,
        experience: 3,
        emergencyContact: '+91-9876543219',
        bloodGroup: 'O-',
        salary: 20000
      },
      {
        conductorId: 'CON003',
        name: 'Sunitha Raj',
        employeeCode: 'CON003',
        username: 'sunitha.raj',
        password: 'password123',
        phone: '+91-9876543220',
        email: 'sunitha@yatrik.com',
        address: {
          street: '987 College Road',
          city: 'Kochi',
          state: 'Kerala',
          pincode: '682003'
        },
        dateOfBirth: new Date('1992-07-08'),
        joiningDate: new Date('2022-02-01'),
        status: 'active',
        depotId: depot._id,
        createdBy: depot._id,
        experience: 1,
        emergencyContact: '+91-9876543221',
        bloodGroup: 'A-',
        salary: 16000
      }
    ];

    for (const conductorData of conductors) {
      const existingConductor = await Conductor.findOne({ conductorId: conductorData.conductorId });
      if (!existingConductor) {
        try {
          const conductor = new Conductor(conductorData);
          await conductor.save();
          console.log('Created conductor:', conductor.name);
        } catch (error) {
          console.log('Error creating conductor', conductorData.conductorId, ':', error.message);
        }
      } else {
        console.log('Conductor already exists:', conductorData.conductorId);
      }
    }

    // Create sample routes
    const routes = [
      {
        routeNumber: 'R001',
        routeName: 'Kochi to Thiruvananthapuram',
        startingPoint: {
          city: 'Kochi',
          state: 'Kerala',
          coordinates: { latitude: 9.9312, longitude: 76.2673 }
        },
        endingPoint: {
          city: 'Thiruvananthapuram',
          state: 'Kerala',
          coordinates: { latitude: 8.5241, longitude: 76.9361 }
        },
        totalDistance: 200,
        estimatedDuration: 300,
        baseFare: 150,
        depot: {
          depotId: depot._id,
          depotName: depot.depotName
        },
        intermediateStops: [
          { name: 'Alappuzha', distanceFromStart: 80 },
          { name: 'Kollam', distanceFromStart: 150 }
        ],
        features: ['AC', 'WiFi', 'Charging Points'],
        status: 'active',
        notes: 'Main route connecting state capital'
      },
      {
        routeNumber: 'R002',
        routeName: 'Kochi to Kozhikode',
        startingPoint: {
          city: 'Kochi',
          state: 'Kerala',
          coordinates: { latitude: 9.9312, longitude: 76.2673 }
        },
        endingPoint: {
          city: 'Kozhikode',
          state: 'Kerala',
          coordinates: { latitude: 11.2588, longitude: 75.7804 }
        },
        totalDistance: 180,
        estimatedDuration: 270,
        baseFare: 120,
        depot: {
          depotId: depot._id,
          depotName: depot.depotName
        },
        intermediateStops: [
          { name: 'Thrissur', distanceFromStart: 60 },
          { name: 'Palakkad', distanceFromStart: 120 }
        ],
        features: ['AC', 'WiFi'],
        status: 'active',
        notes: 'Northern route'
      },
      {
        routeNumber: 'R003',
        routeName: 'Kochi to Bangalore',
        startingPoint: {
          city: 'Kochi',
          state: 'Kerala',
          coordinates: { latitude: 9.9312, longitude: 76.2673 }
        },
        endingPoint: {
          city: 'Bangalore',
          state: 'Karnataka',
          coordinates: { latitude: 12.9716, longitude: 77.5946 }
        },
        totalDistance: 550,
        estimatedDuration: 600,
        baseFare: 400,
        depot: {
          depotId: depot._id,
          depotName: depot.depotName
        },
        intermediateStops: [
          { name: 'Coimbatore', distanceFromStart: 200 },
          { name: 'Salem', distanceFromStart: 350 }
        ],
        features: ['AC', 'WiFi', 'Charging Points', 'Blanket', 'Pillow'],
        status: 'active',
        notes: 'Inter-state route'
      }
    ];

    for (const routeData of routes) {
      const existingRoute = await Route.findOne({ routeNumber: routeData.routeNumber });
      if (!existingRoute) {
        try {
          const route = new Route(routeData);
          await route.save();
          console.log('Created route:', route.routeName);
        } catch (error) {
          console.log('Error creating route', routeData.routeNumber, ':', error.message);
        }
      } else {
        console.log('Route already exists:', routeData.routeNumber);
      }
    }

    console.log('Sample data creation completed successfully!');
    console.log('Created:');
    console.log('- 3 Buses');
    console.log('- 3 Drivers');
    console.log('- 3 Conductors');
    console.log('- 3 Routes');
    console.log('- 1 Depot');

  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    mongoose.connection.close();
  }
}

createSampleData();

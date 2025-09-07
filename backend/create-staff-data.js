const mongoose = require('mongoose');
const Driver = require('./models/Driver');
const Conductor = require('./models/Conductor');
const Depot = require('./models/Depot');
const User = require('./models/User');

async function createStaffData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/yatrik_erp');
    console.log('Connected to MongoDB');

    // Find depot and admin user
    const depot = await Depot.findOne();
    const adminUser = await User.findOne({ role: 'admin' });

    if (!depot) {
      console.log('No depot found, creating one...');
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

    // Clear existing data
    await Driver.deleteMany({});
    await Conductor.deleteMany({});
    console.log('Cleared existing staff data');

    // Create sample drivers
    const sampleDrivers = [
      {
        driverId: 'DRV001',
        name: 'Rajesh Kumar',
        phone: '+919876543210',
        email: 'rajesh.kumar@yatrik.com',
        username: 'rajesh.kumar',
        password: '$2a$10$hashedpassword123', // This would be properly hashed in real scenario
        address: {
          street: '123 MG Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        employeeCode: 'EMP001',
        joiningDate: new Date('2020-01-15'),
        status: 'active',
        depotId: depot._id,
        drivingLicense: {
          licenseType: 'HMV',
          licenseNumber: 'MH01-2020-123456',
          issueDate: new Date('2020-01-01'),
          expiryDate: new Date('2025-12-31'),
          issuingAuthority: 'RTO Mumbai'
        },
        experience: 5,
        assignedBus: null,
        createdBy: adminUser._id
      },
      {
        driverId: 'DRV002',
        name: 'Suresh Patel',
        phone: '+919876543211',
        email: 'suresh.patel@yatrik.com',
        username: 'suresh.patel',
        password: '$2a$10$hashedpassword123',
        address: {
          street: '456 Park Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400002'
        },
        employeeCode: 'EMP002',
        joiningDate: new Date('2019-06-10'),
        status: 'active',
        depotId: depot._id,
        drivingLicense: {
          licenseType: 'HMV',
          licenseNumber: 'MH01-2019-234567',
          issueDate: new Date('2019-06-01'),
          expiryDate: new Date('2024-11-30'),
          issuingAuthority: 'RTO Mumbai'
        },
        experience: 6,
        assignedBus: null,
        createdBy: adminUser._id
      },
      {
        driverId: 'DRV003',
        name: 'Amit Singh',
        phone: '+919876543212',
        email: 'amit.singh@yatrik.com',
        username: 'amit.singh',
        password: '$2a$10$hashedpassword123',
        address: {
          street: '789 Church Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400003'
        },
        employeeCode: 'EMP003',
        joiningDate: new Date('2021-03-20'),
        status: 'active',
        depotId: depot._id,
        drivingLicense: {
          licenseType: 'HMV',
          licenseNumber: 'MH01-2021-345678',
          issueDate: new Date('2021-03-01'),
          expiryDate: new Date('2026-03-20'),
          issuingAuthority: 'RTO Mumbai'
        },
        experience: 3,
        assignedBus: null,
        createdBy: adminUser._id
      },
      {
        driverId: 'DRV004',
        name: 'Vikram Sharma',
        phone: '+919876543213',
        email: 'vikram.sharma@yatrik.com',
        username: 'vikram.sharma',
        password: '$2a$10$hashedpassword123',
        address: {
          street: '321 Station Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400004'
        },
        employeeCode: 'EMP004',
        joiningDate: new Date('2018-09-05'),
        status: 'inactive',
        depotId: depot._id,
        drivingLicense: {
          licenseType: 'HMV',
          licenseNumber: 'MH01-2018-456789',
          issueDate: new Date('2018-09-01'),
          expiryDate: new Date('2023-09-05'),
          issuingAuthority: 'RTO Mumbai'
        },
        experience: 7,
        assignedBus: null,
        createdBy: adminUser._id
      },
      {
        driverId: 'DRV005',
        name: 'Ravi Verma',
        phone: '+919876543214',
        email: 'ravi.verma@yatrik.com',
        username: 'ravi.verma',
        password: '$2a$10$hashedpassword123',
        address: {
          street: '654 Market Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400005'
        },
        employeeCode: 'EMP005',
        joiningDate: new Date('2022-01-10'),
        status: 'active',
        depotId: depot._id,
        drivingLicense: {
          licenseType: 'HMV',
          licenseNumber: 'MH01-2022-567890',
          issueDate: new Date('2022-01-01'),
          expiryDate: new Date('2027-01-10'),
          issuingAuthority: 'RTO Mumbai'
        },
        experience: 2,
        assignedBus: null,
        createdBy: adminUser._id
      }
    ];

    // Create sample conductors
    const sampleConductors = [
      {
        conductorId: 'CON001',
        name: 'Priya Sharma',
        phone: '+919876543220',
        email: 'priya.sharma@yatrik.com',
        username: 'priya.sharma',
        password: '$2a$10$hashedpassword123',
        address: {
          street: '111 Garden Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400011'
        },
        employeeCode: 'EMP101',
        joiningDate: new Date('2020-02-15'),
        status: 'active',
        depotId: depot._id,
        badgeNumber: 'BADGE001',
        experience: 4,
        assignedBus: null,
        createdBy: adminUser._id
      },
      {
        conductorId: 'CON002',
        name: 'Anita Desai',
        phone: '+919876543221',
        email: 'anita.desai@yatrik.com',
        username: 'anita.desai',
        password: '$2a$10$hashedpassword123',
        address: {
          street: '222 Lake Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400012'
        },
        employeeCode: 'EMP102',
        joiningDate: new Date('2019-08-20'),
        status: 'active',
        depotId: depot._id,
        badgeNumber: 'BADGE002',
        experience: 5,
        assignedBus: null,
        createdBy: adminUser._id
      },
      {
        conductorId: 'CON003',
        name: 'Sunita Reddy',
        phone: '+919876543222',
        email: 'sunita.reddy@yatrik.com',
        username: 'sunita.reddy',
        password: '$2a$10$hashedpassword123',
        address: {
          street: '333 Hill Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400013'
        },
        employeeCode: 'EMP103',
        joiningDate: new Date('2021-05-10'),
        status: 'active',
        depotId: depot._id,
        badgeNumber: 'BADGE003',
        experience: 3,
        assignedBus: null,
        createdBy: adminUser._id
      },
      {
        conductorId: 'CON004',
        name: 'Meera Joshi',
        phone: '+919876543223',
        email: 'meera.joshi@yatrik.com',
        username: 'meera.joshi',
        password: '$2a$10$hashedpassword123',
        address: {
          street: '444 Beach Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400014'
        },
        employeeCode: 'EMP104',
        joiningDate: new Date('2018-12-01'),
        status: 'suspended',
        depotId: depot._id,
        badgeNumber: 'BADGE004',
        experience: 6,
        assignedBus: null,
        createdBy: adminUser._id
      },
      {
        conductorId: 'CON005',
        name: 'Kavita Nair',
        phone: '+919876543224',
        email: 'kavita.nair@yatrik.com',
        username: 'kavita.nair',
        password: '$2a$10$hashedpassword123',
        address: {
          street: '555 Temple Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400015'
        },
        employeeCode: 'EMP105',
        joiningDate: new Date('2022-03-15'),
        status: 'active',
        depotId: depot._id,
        badgeNumber: 'BADGE005',
        experience: 2,
        assignedBus: null,
        createdBy: adminUser._id
      }
    ];

    // Insert drivers
    await Driver.insertMany(sampleDrivers);
    console.log('Created', sampleDrivers.length, 'sample drivers');

    // Insert conductors
    await Conductor.insertMany(sampleConductors);
    console.log('Created', sampleConductors.length, 'sample conductors');

    // Verify data
    const driverCount = await Driver.countDocuments();
    const conductorCount = await Conductor.countDocuments();
    console.log('Total drivers in database:', driverCount);
    console.log('Total conductors in database:', conductorCount);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createStaffData();

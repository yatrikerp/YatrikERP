const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Depot = require('./models/Depot');

// Sample depot data
const sampleDepots = [
  {
    depotName: 'Central Bus Depot',
    depotCode: 'CBD001',
    address: '123 Main Street, City Center',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    phone: '+91-22-12345678',
    email: 'central@yatrik.com',
    capacity: 50,
    operatingHours: {
      start: '05:00',
      end: '23:00'
    },
    facilities: ['Maintenance Bay', 'Fuel Station', 'Driver Rest Area', 'Cafeteria'],
    status: 'active'
  },
  {
    depotName: 'North Terminal',
    depotCode: 'NT002',
    address: '456 North Avenue, Suburb',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400002',
    phone: '+91-22-12345679',
    email: 'north@yatrik.com',
    capacity: 30,
    operatingHours: {
      start: '06:00',
      end: '22:00'
    },
    facilities: ['Maintenance Bay', 'Driver Rest Area'],
    status: 'active'
  },
  {
    depotName: 'South Hub',
    depotCode: 'SH003',
    address: '789 South Road, Industrial Area',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400003',
    phone: '+91-22-12345680',
    email: 'south@yatrik.com',
    capacity: 40,
    operatingHours: {
      start: '05:30',
      end: '23:30'
    },
    facilities: ['Maintenance Bay', 'Fuel Station', 'Driver Rest Area', 'Cafeteria', 'Workshop'],
    status: 'active'
  },
  {
    depotName: 'East Station',
    depotCode: 'ES004',
    address: '321 East Street, Commercial District',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400004',
    phone: '+91-22-12345681',
    email: 'east@yatrik.com',
    capacity: 25,
    operatingHours: {
      start: '06:30',
      end: '21:30'
    },
    facilities: ['Maintenance Bay', 'Driver Rest Area'],
    status: 'active'
  },
  {
    depotName: 'West Terminal',
    depotCode: 'WT005',
    address: '654 West Boulevard, Residential Area',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400005',
    phone: '+91-22-12345682',
    email: 'west@yatrik.com',
    capacity: 35,
    operatingHours: {
      start: '05:00',
      end: '22:30'
    },
    facilities: ['Maintenance Bay', 'Fuel Station', 'Driver Rest Area', 'Cafeteria'],
    status: 'active'
  }
];

// Sample driver data
const sampleDrivers = [
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@yatrik.com',
    phone: '9876543210',
    employeeId: 'DRV001',
    joiningDate: '2023-01-15',
    salary: 35000,
    licenseNumber: 'DL123456789',
    licenseExpiry: '2025-12-31',
    status: 'active'
  },
  {
    name: 'Suresh Patel',
    email: 'suresh.patel@yatrik.com',
    phone: '9876543211',
    employeeId: 'DRV002',
    joiningDate: '2023-02-20',
    salary: 32000,
    licenseNumber: 'DL123456790',
    licenseExpiry: '2026-03-15',
    status: 'active'
  },
  {
    name: 'Amit Singh',
    email: 'amit.singh@yatrik.com',
    phone: '9876543212',
    employeeId: 'DRV003',
    joiningDate: '2023-03-10',
    salary: 38000,
    licenseNumber: 'DL123456791',
    licenseExpiry: '2025-08-20',
    status: 'active'
  },
  {
    name: 'Vikram Sharma',
    email: 'vikram.sharma@yatrik.com',
    phone: '9876543213',
    employeeId: 'DRV004',
    joiningDate: '2022-11-05',
    salary: 40000,
    licenseNumber: 'DL123456792',
    licenseExpiry: '2024-11-05',
    status: 'active'
  },
  {
    name: 'Ravi Gupta',
    email: 'ravi.gupta@yatrik.com',
    phone: '9876543214',
    employeeId: 'DRV005',
    joiningDate: '2023-04-12',
    salary: 33000,
    licenseNumber: 'DL123456793',
    licenseExpiry: '2026-04-12',
    status: 'active'
  },
  {
    name: 'Deepak Verma',
    email: 'deepak.verma@yatrik.com',
    phone: '9876543220',
    employeeId: 'DRV006',
    joiningDate: '2023-05-01',
    salary: 36000,
    licenseNumber: 'DL123456794',
    licenseExpiry: '2025-10-15',
    status: 'active'
  },
  {
    name: 'Manoj Tiwari',
    email: 'manoj.tiwari@yatrik.com',
    phone: '9876543221',
    employeeId: 'DRV007',
    joiningDate: '2023-06-15',
    salary: 34000,
    licenseNumber: 'DL123456795',
    licenseExpiry: '2026-01-20',
    status: 'active'
  },
  {
    name: 'Sanjay Mehta',
    email: 'sanjay.mehta@yatrik.com',
    phone: '9876543222',
    employeeId: 'DRV008',
    joiningDate: '2022-09-10',
    salary: 42000,
    licenseNumber: 'DL123456796',
    licenseExpiry: '2024-09-10',
    status: 'active'
  }
];

// Sample conductor data
const sampleConductors = [
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@yatrik.com',
    phone: '9876543215',
    employeeId: 'CON001',
    joiningDate: '2023-01-20',
    salary: 25000,
    status: 'active'
  },
  {
    name: 'Sunita Devi',
    email: 'sunita.devi@yatrik.com',
    phone: '9876543216',
    employeeId: 'CON002',
    joiningDate: '2023-02-15',
    salary: 24000,
    status: 'active'
  },
  {
    name: 'Kavita Singh',
    email: 'kavita.singh@yatrik.com',
    phone: '9876543217',
    employeeId: 'CON003',
    joiningDate: '2023-03-05',
    salary: 26000,
    status: 'active'
  },
  {
    name: 'Meera Patel',
    email: 'meera.patel@yatrik.com',
    phone: '9876543218',
    employeeId: 'CON004',
    joiningDate: '2022-12-10',
    salary: 28000,
    status: 'active'
  },
  {
    name: 'Anita Kumar',
    email: 'anita.kumar@yatrik.com',
    phone: '9876543219',
    employeeId: 'CON005',
    joiningDate: '2023-04-08',
    salary: 23000,
    status: 'active'
  },
  {
    name: 'Rekha Yadav',
    email: 'rekha.yadav@yatrik.com',
    phone: '9876543225',
    employeeId: 'CON006',
    joiningDate: '2023-05-20',
    salary: 27000,
    status: 'active'
  },
  {
    name: 'Pooja Agarwal',
    email: 'pooja.agarwal@yatrik.com',
    phone: '9876543226',
    employeeId: 'CON007',
    joiningDate: '2023-06-10',
    salary: 25000,
    status: 'active'
  },
  {
    name: 'Sushma Joshi',
    email: 'sushma.joshi@yatrik.com',
    phone: '9876543227',
    employeeId: 'CON008',
    joiningDate: '2022-10-15',
    salary: 29000,
    status: 'active'
  }
];

async function setupSampleData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('✅ Connected to MongoDB');

    // Step 1: Create depots
    console.log('\n🏢 Setting up depots...');
    const existingDepots = await Depot.find({});
    
    if (existingDepots.length === 0) {
      console.log('Creating sample depots...');
      for (const depotData of sampleDepots) {
        const depot = new Depot(depotData);
        await depot.save();
        console.log(`✅ Created depot: ${depotData.depotName} (${depotData.depotCode})`);
      }
    } else {
      console.log(`⚠️ Found ${existingDepots.length} existing depots, skipping depot creation`);
    }

    // Get all depots (existing + newly created)
    const depots = await Depot.find({});
    console.log(`📋 Total depots available: ${depots.length}`);

    // Step 2: Create drivers
    console.log('\n🚗 Setting up drivers...');
    const createdDrivers = [];
    
    for (let i = 0; i < sampleDrivers.length; i++) {
      const driverData = sampleDrivers[i];
      const depotIndex = i % depots.length; // Distribute drivers across depots
      const assignedDepot = depots[depotIndex];

      // Check if driver already exists
      const existingDriver = await User.findOne({ 
        $or: [
          { email: driverData.email },
          { employeeCode: driverData.employeeId }
        ]
      });

      if (existingDriver) {
        console.log(`⚠️ Driver ${driverData.name} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash('password123', 10);

      const driver = new User({
        name: driverData.name,
        email: driverData.email,
        phone: driverData.phone,
        password: hashedPassword,
        role: 'driver',
        status: driverData.status,
        depotId: assignedDepot._id,
        employeeCode: driverData.employeeId,
        joiningDate: new Date(driverData.joiningDate),
        staffDetails: {
          employeeId: driverData.employeeId,
          joiningDate: new Date(driverData.joiningDate),
          salary: driverData.salary
        },
        drivingLicense: {
          licenseNumber: driverData.licenseNumber,
          licenseExpiry: new Date(driverData.licenseExpiry)
        }
      });

      const savedDriver = await driver.save();
      createdDrivers.push(savedDriver);
      console.log(`✅ Created driver: ${driverData.name} (${driverData.employeeId}) → ${assignedDepot.depotName}`);
    }

    // Step 3: Create conductors
    console.log('\n🎫 Setting up conductors...');
    const createdConductors = [];
    
    for (let i = 0; i < sampleConductors.length; i++) {
      const conductorData = sampleConductors[i];
      const depotIndex = i % depots.length; // Distribute conductors across depots
      const assignedDepot = depots[depotIndex];

      // Check if conductor already exists
      const existingConductor = await User.findOne({ 
        $or: [
          { email: conductorData.email },
          { employeeCode: conductorData.employeeId }
        ]
      });

      if (existingConductor) {
        console.log(`⚠️ Conductor ${conductorData.name} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash('password123', 10);

      const conductor = new User({
        name: conductorData.name,
        email: conductorData.email,
        phone: conductorData.phone,
        password: hashedPassword,
        role: 'conductor',
        status: conductorData.status,
        depotId: assignedDepot._id,
        employeeCode: conductorData.employeeId,
        joiningDate: new Date(conductorData.joiningDate),
        staffDetails: {
          employeeId: conductorData.employeeId,
          joiningDate: new Date(conductorData.joiningDate),
          salary: conductorData.salary
        }
      });

      const savedConductor = await conductor.save();
      createdConductors.push(savedConductor);
      console.log(`✅ Created conductor: ${conductorData.name} (${conductorData.employeeId}) → ${assignedDepot.depotName}`);
    }

    // Step 4: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SETUP COMPLETE - SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n🏢 Depots: ${depots.length}`);
    depots.forEach((depot, index) => {
      console.log(`   ${index + 1}. ${depot.depotName} (${depot.depotCode}) - Capacity: ${depot.capacity}`);
    });

    console.log(`\n🚗 Drivers: ${createdDrivers.length} created`);
    console.log(`🎫 Conductors: ${createdConductors.length} created`);
    
    // Show depot assignments
    console.log('\n📋 DEPOT ASSIGNMENTS:');
    console.log('-'.repeat(40));
    
    for (const depot of depots) {
      const depotDrivers = createdDrivers.filter(d => d.depotId.toString() === depot._id.toString());
      const depotConductors = createdConductors.filter(c => c.depotId.toString() === depot._id.toString());
      
      console.log(`\n🏢 ${depot.depotName} (${depot.depotCode}):`);
      console.log(`   🚗 Drivers (${depotDrivers.length}):`);
      depotDrivers.forEach(driver => console.log(`      • ${driver.name} (${driver.employeeCode}) - ₹${driver.staffDetails.salary}`));
      console.log(`   🎫 Conductors (${depotConductors.length}):`);
      depotConductors.forEach(conductor => console.log(`      • ${conductor.name} (${conductor.employeeCode}) - ₹${conductor.staffDetails.salary}`));
    }

    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('-'.repeat(40));
    console.log('All staff can login with:');
    console.log('   Email: [their-email]');
    console.log('   Password: password123');
    
    console.log('\n📱 ADMIN PANEL:');
    console.log('-'.repeat(40));
    console.log('You can now:');
    console.log('   • View drivers in Driver Management');
    console.log('   • View conductors in Conductor Management');
    console.log('   • Use Bulk Assignment to assign staff to routes');
    console.log('   • Filter staff by depot in the admin panel');

    console.log('\n✨ Setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up sample data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
console.log('🚀 Starting Yatrik ERP Sample Data Setup...');
console.log('This will create sample depots, drivers, and conductors with depot assignments.\n');

setupSampleData();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Depot = require('./models/Depot');

// Sample data
const sampleDrivers = [
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@yatrik.com',
    phone: '+91-9876543210',
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
    phone: '+91-9876543211',
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
    phone: '+91-9876543212',
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
    phone: '+91-9876543213',
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
    phone: '+91-9876543214',
    employeeId: 'DRV005',
    joiningDate: '2023-04-12',
    salary: 33000,
    licenseNumber: 'DL123456793',
    licenseExpiry: '2026-04-12',
    status: 'active'
  }
];

const sampleConductors = [
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@yatrik.com',
    phone: '+91-9876543215',
    employeeId: 'CON001',
    joiningDate: '2023-01-20',
    salary: 25000,
    status: 'active'
  },
  {
    name: 'Sunita Devi',
    email: 'sunita.devi@yatrik.com',
    phone: '+91-9876543216',
    employeeId: 'CON002',
    joiningDate: '2023-02-15',
    salary: 24000,
    status: 'active'
  },
  {
    name: 'Kavita Singh',
    email: 'kavita.singh@yatrik.com',
    phone: '+91-9876543217',
    employeeId: 'CON003',
    joiningDate: '2023-03-05',
    salary: 26000,
    status: 'active'
  },
  {
    name: 'Meera Patel',
    email: 'meera.patel@yatrik.com',
    phone: '+91-9876543218',
    employeeId: 'CON004',
    joiningDate: '2022-12-10',
    salary: 28000,
    status: 'active'
  },
  {
    name: 'Anita Kumar',
    email: 'anita.kumar@yatrik.com',
    phone: '+91-9876543219',
    employeeId: 'CON005',
    joiningDate: '2023-04-08',
    salary: 23000,
    status: 'active'
  }
];

async function createSampleStaff() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('✅ Connected to MongoDB');

    // Get existing depots
    const depots = await Depot.find({});
    console.log(`📋 Found ${depots.length} depots`);

    if (depots.length === 0) {
      console.log('❌ No depots found. Please create depots first.');
      return;
    }

    // Show available depots
    depots.forEach((depot, index) => {
      console.log(`${index + 1}. ${depot.name || depot.depotName} (${depot.depotCode || depot.code})`);
    });

    // Create drivers
    console.log('\n🚗 Creating sample drivers...');
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
      console.log(`✅ Created driver: ${driverData.name} (${driverData.employeeId}) - Assigned to ${assignedDepot.name || assignedDepot.depotName}`);
    }

    // Create conductors
    console.log('\n🎫 Creating sample conductors...');
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
      console.log(`✅ Created conductor: ${conductorData.name} (${conductorData.employeeId}) - Assigned to ${assignedDepot.name || assignedDepot.depotName}`);
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`✅ Created ${createdDrivers.length} drivers`);
    console.log(`✅ Created ${createdConductors.length} conductors`);
    console.log(`🏢 Assigned to ${depots.length} depots`);
    
    // Show depot assignments
    console.log('\n🏢 Depot Assignments:');
    for (const depot of depots) {
      const depotDrivers = createdDrivers.filter(d => d.depotId.toString() === depot._id.toString());
      const depotConductors = createdConductors.filter(c => c.depotId.toString() === depot._id.toString());
      
      console.log(`\n${depot.name || depot.depotName}:`);
      console.log(`  🚗 Drivers: ${depotDrivers.length}`);
      depotDrivers.forEach(driver => console.log(`    - ${driver.name} (${driver.employeeCode})`));
      console.log(`  🎫 Conductors: ${depotConductors.length}`);
      depotConductors.forEach(conductor => console.log(`    - ${conductor.name} (${conductor.employeeCode})`));
    }

    console.log('\n🔑 Default login credentials for all staff:');
    console.log('   Email: [staff-email]');
    console.log('   Password: password123');

  } catch (error) {
    console.error('❌ Error creating sample staff:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
createSampleStaff();


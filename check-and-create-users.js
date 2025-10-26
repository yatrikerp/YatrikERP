const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./backend/models/User');
const Driver = require('./backend/models/Driver');
const Conductor = require('./backend/models/Conductor');
const Depot = require('./backend/models/Depot');

async function checkAndCreateUsers() {
  try {
    console.log('🔍 Checking database data...');
    
    // Check existing data
    const users = await User.find({}).select('name email role status');
    const drivers = await Driver.find({}).select('name email status');
    const conductors = await Conductor.find({}).select('name email status');
    const depots = await Depot.find({}).select('depotName depotCode');
    
    console.log('📊 Current data:');
    console.log('Users in User model:', users.length);
    console.log('User roles:', [...new Set(users.map(u => u.role))]);
    console.log('Drivers in Driver model:', drivers.length);
    console.log('Conductors in Conductor model:', conductors.length);
    console.log('Depots available:', depots.length);
    
    // Get a depot for creating users
    let depotId = null;
    if (depots.length > 0) {
      depotId = depots[0]._id;
      console.log('Using depot:', depots[0].depotName);
    }
    
    // Create sample drivers in User model if none exist
    const userDrivers = await User.find({ role: 'driver' });
    if (userDrivers.length === 0) {
      console.log('🚌 Creating sample drivers in User model...');
      const sampleDrivers = [
        {
          name: 'Rajesh Kumar',
          email: 'rajesh.driver@yatrik.com',
          phone: '9876543201',
          role: 'driver',
          status: 'active',
          depotId: depotId,
          password: 'driver123'
        },
        {
          name: 'Suresh Singh',
          email: 'suresh.driver@yatrik.com',
          phone: '9876543202',
          role: 'driver',
          status: 'active',
          depotId: depotId,
          password: 'driver123'
        }
      ];
      
      for (const driver of sampleDrivers) {
        const newDriver = new User(driver);
        await newDriver.save();
        console.log('✅ Created driver:', driver.name);
      }
    }
    
    // Create sample conductors in User model if none exist
    const userConductors = await User.find({ role: 'conductor' });
    if (userConductors.length === 0) {
      console.log('🎫 Creating sample conductors in User model...');
      const sampleConductors = [
        {
          name: 'Priya Sharma',
          email: 'priya.conductor@yatrik.com',
          phone: '9876543203',
          role: 'conductor',
          status: 'active',
          depotId: depotId,
          password: 'conductor123'
        },
        {
          name: 'Amit Patel',
          email: 'amit.conductor@yatrik.com',
          phone: '9876543204',
          role: 'conductor',
          status: 'active',
          depotId: depotId,
          password: 'conductor123'
        }
      ];
      
      for (const conductor of sampleConductors) {
        const newConductor = new User(conductor);
        await newConductor.save();
        console.log('✅ Created conductor:', conductor.name);
      }
    }
    
    // Create sample depot managers if none exist
    const depotManagers = await User.find({ role: 'depot_manager' });
    if (depotManagers.length === 0) {
      console.log('🏢 Creating sample depot managers...');
      const sampleManagers = [
        {
          name: 'Vikram Mehta',
          email: 'vikram.manager@yatrik.com',
          phone: '9876543205',
          role: 'depot_manager',
          status: 'active',
          depotId: depotId,
          password: 'manager123'
        },
        {
          name: 'Sunita Reddy',
          email: 'sunita.manager@yatrik.com',
          phone: '9876543206',
          role: 'depot_manager',
          status: 'active',
          depotId: depotId,
          password: 'manager123'
        }
      ];
      
      for (const manager of sampleManagers) {
        const newManager = new User(manager);
        await newManager.save();
        console.log('✅ Created depot manager:', manager.name);
      }
    }
    
    // Create sample drivers in Driver model if none exist
    if (drivers.length === 0 && depotId) {
      console.log('🚌 Creating sample drivers in Driver model...');
      const sampleDriverModel = [
        {
          driverId: 'DRV001',
          name: 'Kumar Driver',
          phone: '9876543211',
          email: 'kumar.driver@yatrik.com',
          employeeCode: 'EMP001',
          depotId: depotId,
          status: 'active',
          username: 'kumar_driver',
          password: 'driver123',
          drivingLicense: {
            licenseNumber: 'DL123456789',
            licenseType: 'HMV',
            issueDate: new Date('2020-01-01'),
            expiryDate: new Date('2030-01-01'),
            issuingAuthority: 'RTO Mumbai',
            status: 'valid'
          }
        },
        {
          driverId: 'DRV002',
          name: 'Singh Driver',
          phone: '9876543212',
          email: 'singh.driver@yatrik.com',
          employeeCode: 'EMP002',
          depotId: depotId,
          status: 'active',
          username: 'singh_driver',
          password: 'driver123',
          drivingLicense: {
            licenseNumber: 'DL987654321',
            licenseType: 'HMV',
            issueDate: new Date('2019-01-01'),
            expiryDate: new Date('2029-01-01'),
            issuingAuthority: 'RTO Delhi',
            status: 'valid'
          }
        }
      ];
      
      for (const driver of sampleDriverModel) {
        const newDriver = new Driver(driver);
        await newDriver.save();
        console.log('✅ Created driver in Driver model:', driver.name);
      }
    }
    
    // Create sample conductors in Conductor model if none exist
    if (conductors.length === 0 && depotId) {
      console.log('🎫 Creating sample conductors in Conductor model...');
      const sampleConductorModel = [
        {
          conductorId: 'CON001',
          name: 'Sharma Conductor',
          phone: '9876543213',
          email: 'sharma.conductor@yatrik.com',
          employeeCode: 'EMP003',
          depotId: depotId,
          status: 'active',
          username: 'sharma_conductor',
          password: 'conductor123'
        },
        {
          conductorId: 'CON002',
          name: 'Patel Conductor',
          phone: '9876543214',
          email: 'patel.conductor@yatrik.com',
          employeeCode: 'EMP004',
          depotId: depotId,
          status: 'active',
          username: 'patel_conductor',
          password: 'conductor123'
        }
      ];
      
      for (const conductor of sampleConductorModel) {
        const newConductor = new Conductor(conductor);
        await newConductor.save();
        console.log('✅ Created conductor in Conductor model:', conductor.name);
      }
    }
    
    // Final count
    const finalUsers = await User.find({}).select('name email role status');
    const finalDrivers = await Driver.find({}).select('name email status');
    const finalConductors = await Conductor.find({}).select('name email status');
    
    console.log('\n📊 Final data count:');
    console.log('Users in User model:', finalUsers.length);
    console.log('User roles:', [...new Set(finalUsers.map(u => u.role))]);
    console.log('Drivers in Driver model:', finalDrivers.length);
    console.log('Conductors in Conductor model:', finalConductors.length);
    
    console.log('\n✅ Sample data creation completed!');
    console.log('Now refresh your admin dashboard to see all user types.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkAndCreateUsers();











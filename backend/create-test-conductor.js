const mongoose = require('mongoose');
const Conductor = require('./models/Conductor');
const Depot = require('./models/Depot');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createTestConductor() {
  try {
    console.log('Creating test conductor...');

    // First, create or find a depot
    let depot = await Depot.findOne({ depotName: 'Central Transport Hub' });
    if (!depot) {
      depot = await Depot.create({
        depotName: 'Central Transport Hub',
        depotCode: 'CTH',
        address: '123 Main Street, City',
        phone: '+91-98765-43210',
        email: 'central@yatrik.com',
        managerName: 'John Manager',
        status: 'active'
      });
      console.log('Created depot:', depot.depotName);
    }

    // Create or find a default user for createdBy
    let defaultUser = await User.findOne({ email: 'admin@yatrik.com' });
    if (!defaultUser) {
      defaultUser = await User.create({
        name: 'System Admin',
        email: 'admin@yatrik.com',
        password: 'admin123',
        role: 'admin',
        phone: '+91-98765-43210',
        authProvider: 'local',
        isActive: true
      });
      console.log('Created default user:', defaultUser.email);
    }

    // Check if conductor already exists
    let conductor = await Conductor.findOne({ email: 'conductor@yatrik.com' });
    if (conductor) {
      console.log('Conductor already exists:', conductor.email);
      console.log('Conductor ID:', conductor._id);
      console.log('Conductor Name:', conductor.name);
      console.log('Conductor Role:', conductor.role || 'conductor');
      return conductor;
    }

    // Create test conductor
    conductor = await Conductor.create({
      conductorId: 'CON001',
      name: 'Test Conductor',
      phone: '+91-98765-43210',
      email: 'conductor@yatrik.com',
      employeeCode: 'EMP001',
      username: 'conductor',
      password: 'conductor123',
      depotId: depot._id,
      status: 'active',
      createdBy: defaultUser._id,
      address: {
        street: '123 Conductor Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      drivingLicense: {
        licenseNumber: 'DL123456789',
        licenseType: 'LMV',
        issueDate: new Date('2020-01-01'),
        expiryDate: new Date('2030-01-01'),
        issuingAuthority: 'RTO Test',
        status: 'valid'
      }
    });

    console.log('✅ Test conductor created successfully!');
    console.log('Conductor ID:', conductor._id);
    console.log('Email:', conductor.email);
    console.log('Password:', 'conductor123');
    console.log('Role:', 'conductor');
    console.log('Depot:', depot.depotName);

    // Also create a User record for authentication
    let conductorUser = await User.findOne({ email: 'conductor@yatrik.com' });
    if (!conductorUser) {
      conductorUser = await User.create({
        name: 'Test Conductor',
        email: 'conductor@yatrik.com',
        password: 'conductor123',
        role: 'conductor',
        phone: '+91-98765-43210',
        authProvider: 'local',
        isActive: true,
        depotId: depot._id
      });
      console.log('✅ Conductor user created for authentication');
    }

    console.log('\n🎯 Login Credentials:');
    console.log('Email: conductor@yatrik.com');
    console.log('Password: conductor123');
    console.log('Role: conductor');
    console.log('\n📱 Access URL: http://localhost:3000/conductor');

  } catch (error) {
    console.error('❌ Error creating test conductor:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestConductor();

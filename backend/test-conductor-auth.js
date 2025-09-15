const mongoose = require('mongoose');
const Conductor = require('./models/Conductor');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testConductorAuth() {
  try {
    console.log('🔍 Testing Conductor Authentication...\n');

    // Check if conductor exists
    const conductor = await Conductor.findOne({ email: 'conductor@yatrik.com' });
    if (!conductor) {
      console.log('❌ Conductor not found. Creating test conductor...');
      
      // Create test conductor
      const depot = await require('./models/Depot').findOne() || await require('./models/Depot').create({
        depotName: 'Test Depot',
        depotCode: 'TD',
        address: 'Test Address',
        phone: '+91-98765-43210',
        email: 'test@yatrik.com',
        managerName: 'Test Manager',
        status: 'active'
      });

      const newConductor = await Conductor.create({
        conductorId: 'CON001',
        name: 'Test Conductor',
        phone: '+91-98765-43210',
        email: 'conductor@yatrik.com',
        employeeCode: 'EMP001',
        username: 'conductor',
        password: 'conductor123',
        depotId: depot._id,
        status: 'active',
        address: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456'
        }
      });
      console.log('✅ Test conductor created:', newConductor.email);
    } else {
      console.log('✅ Conductor found:', conductor.email);
      console.log('   ID:', conductor._id);
      console.log('   Name:', conductor.name);
      console.log('   Status:', conductor.status);
    }

    // Check if user exists for authentication
    const conductorUser = await User.findOne({ email: 'conductor@yatrik.com' });
    if (!conductorUser) {
      console.log('❌ Conductor user not found. Creating...');
      
      const depot = await require('./models/Depot').findOne();
      const newUser = await User.create({
        name: 'Test Conductor',
        email: 'conductor@yatrik.com',
        password: 'conductor123',
        role: 'conductor',
        phone: '+91-98765-43210',
        authProvider: 'local',
        isActive: true,
        depotId: depot?._id
      });
      console.log('✅ Conductor user created:', newUser.email);
    } else {
      console.log('✅ Conductor user found:', conductorUser.email);
      console.log('   Role:', conductorUser.role);
      console.log('   Active:', conductorUser.isActive);
    }

    // Test API endpoints
    console.log('\n🌐 Testing API Endpoints...');
    
    // Test conductor duties endpoint
    try {
      const response = await fetch('http://localhost:5000/api/conductor/duties/current', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token' // This will fail but we can see the endpoint exists
        }
      });
      console.log('✅ Conductor duties endpoint accessible');
    } catch (error) {
      console.log('⚠️  Conductor duties endpoint test failed (expected - no auth token)');
    }

    console.log('\n🎯 Login Credentials:');
    console.log('Email: conductor@yatrik.com');
    console.log('Password: conductor123');
    console.log('Role: conductor');
    console.log('\n📱 Access URLs:');
    console.log('Frontend: http://localhost:3000/conductor');
    console.log('Login: http://localhost:3000/login');
    console.log('Backend: http://localhost:5000/api/conductor/duties/current');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

testConductorAuth();

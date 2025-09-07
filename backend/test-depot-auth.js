const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const DepotUser = require('./models/DepotUser');
const Depot = require('./models/Depot');
const User = require('./models/User');

async function testDepotAuth() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('Connected to MongoDB');

    // Find or create a depot
    let depot = await Depot.findOne();
    if (!depot) {
      console.log('No depot found. Creating a test depot...');
      depot = new Depot({
        depotCode: 'TEST001',
        depotName: 'Test Depot',
        location: 'Test City',
        capacity: 50,
        status: 'active'
      });
      await depot.save();
      console.log('Created test depot:', depot.depotName);
    }

    // Find or create a depot user
    let depotUser = await DepotUser.findOne({ depotId: depot._id });
    if (!depotUser) {
      console.log('No depot user found. Creating a test depot user...');
      depotUser = new DepotUser({
        username: 'testmanager',
        email: 'test@depot.com',
        password: 'password123',
        depotId: depot._id,
        depotCode: depot.depotCode,
        depotName: depot.depotName,
        role: 'depot_manager',
        status: 'active'
      });
      await depotUser.save();
      console.log('Created test depot user:', depotUser.username);
    }

    console.log('\n=== Depot User Details ===');
    console.log('ID:', depotUser._id);
    console.log('Username:', depotUser.username);
    console.log('Role:', depotUser.role);
    console.log('Depot ID:', depotUser.depotId);
    console.log('Status:', depotUser.status);

    // Test the auth middleware logic
    console.log('\n=== Auth Middleware Test ===');
    const userRole = depotUser.role?.toUpperCase();
    const allowedRoles = ['depot_manager', 'depot_supervisor', 'depot_operator', 'DEPOT_MANAGER', 'DEPOT_SUPERVISOR', 'DEPOT_OPERATOR', 'manager', 'MANAGER', 'supervisor', 'SUPERVISOR', 'operator', 'OPERATOR'];
    const allowedRolesUpper = allowedRoles.map(r => r.toUpperCase());
    
    console.log('User role (original):', depotUser.role);
    console.log('User role (uppercase):', userRole);
    console.log('Allowed roles (uppercase):', allowedRolesUpper);
    console.log('Is role allowed?', allowedRolesUpper.includes(userRole));

    // Test JWT token creation
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      {
        userId: depotUser._id,
        username: depotUser.username,
        role: depotUser.role || 'depot_manager',
        depotId: depotUser.depotId,
        depotCode: depotUser.depotCode,
        permissions: depotUser.permissions
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    console.log('\n=== JWT Token Test ===');
    console.log('Token created successfully');
    console.log('Token length:', token.length);

    // Test token verification
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    console.log('Token payload:', payload);

    console.log('\n=== Test completed successfully! ===');
    console.log('You can use these credentials to test:');
    console.log('Username: testmanager');
    console.log('Password: password123');
    console.log('Token:', token);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testDepotAuth();

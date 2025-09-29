const jwt = require('jsonwebtoken');
const User = require('./models/User');
const mongoose = require('mongoose');

async function getAdminToken() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');
    console.log('Connected to MongoDB');

    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found');
      return;
    }

    console.log('Admin user found:', {
      id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: adminUser._id,
        role: adminUser.role,
        email: adminUser.email
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    console.log('\n🔑 Admin Token:');
    console.log(token);
    console.log('\n📋 Use this token in your API calls:');
    console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:5000/api/admin/all-drivers`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

getAdminToken();

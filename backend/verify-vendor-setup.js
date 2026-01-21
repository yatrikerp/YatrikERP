const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function verifyVendorSetup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');
    console.log('✅ Connected to MongoDB\n');

    // Check vendor user
    const vendor = await User.findOne({ email: 'vendor@yatrik.com' });
    
    if (!vendor) {
      console.log('❌ Vendor user NOT FOUND!');
      console.log('Creating vendor user...');
      
      const newVendor = new User({
        name: 'Vendor Account',
        email: 'vendor@yatrik.com',
        phone: '9876543210',
        password: 'vendor123',
        role: 'vendor',
        status: 'active',
        authProvider: 'local'
      });
      
      await newVendor.save();
      console.log('✅ Vendor user created!');
    } else {
      console.log('✅ Vendor user exists:');
      console.log('   Email:', vendor.email);
      console.log('   Role:', vendor.role);
      console.log('   Status:', vendor.status);
      
      // Ensure role is vendor
      if (vendor.role !== 'vendor') {
        console.log('\n⚠️  Role is not "vendor", updating...');
        vendor.role = 'vendor';
        vendor.status = 'active';
        await vendor.save();
        console.log('✅ Role updated to "vendor"');
      }
    }

    // Check User model enum
    const userSchema = User.schema.path('role');
    const enumValues = userSchema.enumValues || [];
    console.log('\n📋 User model role enum values:', enumValues);
    
    if (!enumValues.includes('vendor')) {
      console.log('❌ "vendor" is NOT in the role enum!');
      console.log('⚠️  You need to restart the backend server after adding "vendor" to the enum.');
    } else {
      console.log('✅ "vendor" is in the role enum');
    }

    console.log('\n📝 Login Credentials:');
    console.log('   Email: vendor@yatrik.com');
    console.log('   Password: vendor123');
    console.log('   Expected redirect: /vendor');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

verifyVendorSetup();


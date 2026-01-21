const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function setupVendorLogin() {
  try {
    console.log('🚀 Setting up Vendor Login...\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');
    console.log('✅ Connected to MongoDB\n');

    const email = 'vendor@yatrik.com';
    const password = 'vendor123';

    // Step 1: Check/Create vendor user
    console.log('📋 Step 1: Setting up vendor user...');
    let vendor = await User.findOne({ email: email });
    
    if (!vendor) {
      console.log('   Creating new vendor user...');
      vendor = new User({
        name: 'Vendor Account',
        email: email,
        phone: '9876543210',
        password: password,
        role: 'vendor',
        status: 'active',
        authProvider: 'local'
      });
      await vendor.save();
      console.log('   ✅ Vendor user created');
    } else {
      console.log('   ✅ Vendor user exists');
    }

    // Step 2: Ensure correct settings
    console.log('\n📋 Step 2: Verifying vendor user settings...');
    let needsUpdate = false;
    
    if (vendor.role !== 'vendor') {
      console.log('   ⚠️  Role is not "vendor", updating...');
      vendor.role = 'vendor';
      needsUpdate = true;
    }
    
    if (vendor.status !== 'active') {
      console.log('   ⚠️  Status is not "active", updating...');
      vendor.status = 'active';
      needsUpdate = true;
    }
    
    // Verify password
    const vendorWithPassword = await User.findOne({ email: email }).select('+password');
    const passwordMatch = await bcrypt.compare(password, vendorWithPassword.password);
    
    if (!passwordMatch) {
      console.log('   ⚠️  Password doesn\'t match, resetting...');
      vendor.password = password; // Will be hashed by pre-save
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      await vendor.save();
      console.log('   ✅ Vendor user updated');
    } else {
      console.log('   ✅ All settings are correct');
    }

    // Step 3: Verify User model enum
    console.log('\n📋 Step 3: Verifying User model configuration...');
    const userSchema = User.schema.path('role');
    const enumValues = userSchema.enumValues || [];
    
    if (enumValues.includes('vendor')) {
      console.log('   ✅ "vendor" is in the role enum');
    } else {
      console.log('   ❌ "vendor" is NOT in the role enum!');
      console.log('   ⚠️  You need to add "vendor" to the User model enum');
      console.log('   ⚠️  Then restart the backend server');
    }

    // Step 4: Final verification
    console.log('\n📋 Step 4: Final verification...');
    const finalVendor = await User.findOne({ email: email }).select('+password');
    const finalPasswordMatch = await bcrypt.compare(password, finalVendor.password);
    
    console.log('   Email:', finalVendor.email);
    console.log('   Role:', finalVendor.role);
    console.log('   Status:', finalVendor.status);
    console.log('   Password:', finalPasswordMatch ? '✅ Correct' : '❌ Incorrect');
    
    if (finalVendor.role === 'vendor' && finalVendor.status === 'active' && finalPasswordMatch) {
      console.log('\n✅✅✅ VENDOR LOGIN SETUP COMPLETE! ✅✅✅\n');
      console.log('📝 Login Credentials:');
      console.log('   Email: vendor@yatrik.com');
      console.log('   Password: vendor123');
      console.log('   Expected Redirect: /vendor\n');
      console.log('⚠️  IMPORTANT:');
      console.log('   1. Make sure backend server is running');
      console.log('   2. If you just added "vendor" to the enum, RESTART the server');
      console.log('   3. Clear browser cache or do hard refresh (Ctrl+Shift+R)');
      console.log('   4. Try logging in with the credentials above\n');
    } else {
      console.log('\n❌ Setup incomplete. Please check the errors above.\n');
    }

  } catch (error) {
    console.error('\n❌ Error during setup:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
  }
}

setupVendorLogin();


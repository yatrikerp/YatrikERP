const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const debugLogin = async () => {
  try {
    console.log('🔍 Debugging login process...\n');

    const email = 'admin@yatrik.com';
    const password = 'admin123';

    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}\n`);

    // Step 1: Find user
    console.log('1️⃣ Finding user...');
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', {
      id: user._id,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });

    // Step 2: Check if account is locked
    console.log('\n2️⃣ Checking if account is locked...');
    if (user.isLocked && user.isLocked()) {
      console.log('❌ Account is locked');
      return;
    }
    console.log('✅ Account is not locked');

    // Step 3: Compare password
    console.log('\n3️⃣ Comparing password...');
    const isPasswordValid = await user.comparePassword(password);
    console.log(`Password comparison result: ${isPasswordValid ? '✅ VALID' : '❌ INVALID'}`);

    if (!isPasswordValid) {
      console.log('❌ Password is invalid');
      return;
    }

    console.log('✅ Password is valid!');

    // Step 4: Generate token (simulate)
    console.log('\n4️⃣ Generating token...');
    console.log('✅ Token would be generated successfully');

    console.log('\n🎉 Login would succeed!');

  } catch (error) {
    console.error('❌ Error during login debug:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
debugLogin();

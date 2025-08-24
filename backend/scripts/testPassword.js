const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const testPassword = async () => {
  try {
    console.log('Testing password comparison...');

    // Test with admin user
    const email = 'admin@yatrik.com';
    const password = 'admin123';

    console.log(`Testing login for: ${email} with password: ${password}`);

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:', {
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });

    if (user.password) {
      // Test direct bcrypt comparison
      const isMatch = await bcrypt.compare(password, user.password);
      console.log(`Direct bcrypt comparison: ${isMatch ? 'MATCH' : 'NO_MATCH'}`);

      // Test using the model method
      const isMatchMethod = await user.comparePassword(password);
      console.log(`Model method comparison: ${isMatchMethod ? 'MATCH' : 'NO_MATCH'}`);

      // Test with wrong password
      const isWrongMatch = await bcrypt.compare('wrongpassword', user.password);
      console.log(`Wrong password test: ${isWrongMatch ? 'MATCH' : 'NO_MATCH'}`);
    } else {
      console.log('No password found for user');
    }

  } catch (error) {
    console.error('Error testing password:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
testPassword();

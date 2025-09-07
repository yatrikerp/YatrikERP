const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function checkAdminUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/yatrik_erp');
    console.log('Connected to MongoDB');
    
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      console.log('Admin user found:', {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        status: adminUser.status
      });
      
      // Update password to Yatrik123
      const hashedPassword = await bcrypt.hash('Yatrik123', 10);
      await User.updateOne(
        { _id: adminUser._id },
        { password: hashedPassword }
      );
      console.log('Admin password updated to Yatrik123');
      
    } else {
      console.log('No admin user found, creating one...');
      
      // Create admin user
      const hashedPassword = await bcrypt.hash('Yatrik123', 10);
      
      const newAdmin = new User({
        name: 'Admin User',
        email: 'admin@yatrik.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      });
      
      await newAdmin.save();
      console.log('Admin user created successfully with password: Yatrik123');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdminUser();

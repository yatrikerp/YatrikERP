const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createStudentUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');
    console.log('✅ Connected to MongoDB\n');

    const email = 'student@yatrik.com';
    const password = 'student123';

    // Check if student exists
    let student = await User.findOne({ email: email });
    
    if (!student) {
      console.log('Creating student user...');
      student = new User({
        name: 'Student Account',
        email: email,
        phone: '9876543211',
        password: password,
        role: 'student',
        status: 'active',
        authProvider: 'local'
      });
      await student.save();
      console.log('✅ Student user created');
    } else {
      console.log('✅ Student user exists');
      // Update role if needed
      if (student.role !== 'student') {
        student.role = 'student';
        student.status = 'active';
        await student.save();
        console.log('✅ Updated to student role');
      }
    }

    console.log('\n📝 Student Login Credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   Role: student');
    console.log('   Redirect: /pax (passenger dashboard)');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createStudentUser();


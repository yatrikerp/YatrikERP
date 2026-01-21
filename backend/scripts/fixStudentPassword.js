const mongoose = require('mongoose');
require('dotenv').config();

const StudentPass = require('../models/StudentPass');

async function fixStudentPassword() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    const email = 'student@test.com';
    const password = 'student123';
    
    const student = await StudentPass.findOne({ 
      $or: [
        { email: email },
        { 'personalDetails.email': email }
      ]
    }).select('+password');
    
    if (!student) {
      console.log('❌ Student not found!');
      process.exit(1);
    }
    
    console.log('✅ Student found. Updating password...');
    // Set password as plain text - pre-save hook will hash it
    student.password = password;
    student.markModified('password');
    student.status = 'approved';
    student.passStatus = 'approved';
    await student.save();
    
    console.log('✅ Password updated successfully!');
    console.log('\n📋 Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixStudentPassword();

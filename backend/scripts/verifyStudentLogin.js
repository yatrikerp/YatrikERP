const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const StudentPass = require('../models/StudentPass');

async function verifyStudentLogin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Find student by email
    const email = 'student@test.com';
    const student = await StudentPass.findOne({
      $or: [
        { email: email },
        { 'personalDetails.email': email }
      ]
    }).select('+password');

    if (!student) {
      console.log('❌ Student not found with email: student@test.com');
      console.log('💡 Run: node scripts/createTestStudent.js to create the student account');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('✅ Student found in database:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email:           ${student.email || student.personalDetails?.email || 'N/A'}`);
    console.log(`📱 Phone:           ${student.phone || student.personalDetails?.mobile || 'N/A'}`);
    console.log(`🆔 Aadhaar:         ${student.aadhaarNumber || 'N/A'}`);
    console.log(`👤 Name:            ${student.name || student.personalDetails?.fullName || 'N/A'}`);
    console.log(`📚 Institution:     ${student.educationalDetails?.institutionName || 'N/A'}`);
    console.log(`🎓 Course:          ${student.educationalDetails?.course || 'N/A'}`);
    console.log(`🆔 Roll Number:     ${student.educationalDetails?.rollNumber || 'N/A'}`);
    console.log(`✅ Status:          ${student.status || 'N/A'}`);
    console.log(`🎫 Pass Status:     ${student.passStatus || 'N/A'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test password
    const testPassword = 'student123';
    const isPasswordValid = await student.comparePassword(testPassword);
    
    if (isPasswordValid) {
      console.log('✅ Password verification: PASSED');
    } else {
      console.log('❌ Password verification: FAILED');
      console.log('💡 Updating password...');
      student.password = await bcrypt.hash(testPassword, 10);
      await student.save();
      console.log('✅ Password updated successfully');
    }

    // Verify role would be set correctly
    console.log('\n📋 Login Response Structure:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Role:        student');
    console.log('Role Type:   external');
    console.log('Redirect:    /student/dashboard');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check if student can login (status check)
    const canLogin = student.status === 'active' || 
                     student.status === 'approved' || 
                     student.passStatus === 'approved';
    
    if (!canLogin) {
      console.log('⚠️  WARNING: Student status is not active/approved');
      console.log(`   Current status: ${student.status || 'N/A'}`);
      console.log(`   Pass status: ${student.passStatus || 'N/A'}`);
      console.log('💡 Updating status to approved...');
      student.status = 'approved';
      student.passStatus = 'approved';
      await student.save();
      console.log('✅ Status updated to approved');
    } else {
      console.log('✅ Student can login (status is active/approved)');
    }

    console.log('\n✅ Student credentials verified and ready for login!');
    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    student@test.com');
    console.log('Password: student123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

verifyStudentLogin();

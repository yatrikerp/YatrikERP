const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const StudentPass = require('../models/StudentPass');

async function createTestStudent() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Check if student already exists
    const existingStudent = await StudentPass.findOne({
      $or: [
        { email: 'student@test.com' },
        { 'personalDetails.email': 'student@test.com' },
        { phone: '9876543210' },
        { aadhaarNumber: '123456789012' }
      ]
    });

    if (existingStudent) {
      console.log('⚠️  Test student already exists. Deleting and recreating...');
      await StudentPass.deleteOne({ _id: existingStudent._id });
      console.log('✅ Old student record deleted');
    }
    
    // Create new test student (whether it existed before or not)
    if (!existingStudent || true) {
      // Create new test student
      const hashedPassword = await bcrypt.hash('student123', 10);
      
      const testStudent = new StudentPass({
        name: 'Test Student',
        email: 'student@test.com',
        phone: '9876543210',
        password: hashedPassword,
        aadhaarNumber: '123456789012',
        personalDetails: {
          fullName: 'Test Student',
          email: 'student@test.com',
          mobile: '9876543210',
          dateOfBirth: new Date('2000-01-15'),
          gender: 'male'
        },
        educationalDetails: {
          institutionName: 'Test University',
          course: 'B.Tech Computer Science',
          rollNumber: 'STU2024001'
        },
        travelDetails: {
          homeAddress: '123 Test Street, Test City',
          nearestBusStop: 'Test Bus Stop',
          destinationBusStop: 'University Bus Stop',
          routeNumber: 'RT-001',
          passDuration: 'yearly'
        },
        passStatus: 'approved',
        status: 'approved',
        validity: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          isActive: true
        },
        digitalPass: {
          passNumber: 'STU2024001',
          qrCode: 'QR_STU2024001',
          generatedAt: new Date()
        },
        payment: {
          amount: 5000,
          paymentStatus: 'paid',
          paymentDate: new Date()
        },
        usageHistory: [
          {
            date: new Date(),
            route: 'RT-001',
            from: 'Test Bus Stop',
            to: 'University Bus Stop',
            fare: 0,
            status: 'completed'
          }
        ]
      });

      await testStudent.save();
      console.log('✅ Test student created successfully!');
    }

    console.log('\n📋 STUDENT DASHBOARD CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    student@test.com');
    console.log('📱 Phone:    9876543210');
    console.log('🆔 Aadhaar:  123456789012');
    console.log('🔑 Password: student123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ You can login with any of the above credentials!');
    console.log('🌐 Dashboard URL: http://localhost:3000/student/dashboard\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestStudent();

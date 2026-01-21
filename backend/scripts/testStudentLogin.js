const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const StudentPass = require('../models/StudentPass');

async function testStudentLogin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    const email = 'student@test.com';
    const password = 'student123';
    
    // Simulate the exact login flow from auth.js
    console.log('🔍 Testing student login flow...\n');
    
    const normalizedIdentifier = email.toLowerCase();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier);
    
    console.log(`Email: ${email}`);
    console.log(`Normalized: ${normalizedIdentifier}`);
    console.log(`Is Email: ${isEmail}\n`);
    
    if (isEmail) {
      const student = await StudentPass.findOne({ 
        $or: [
          { email: normalizedIdentifier },
          { 'personalDetails.email': normalizedIdentifier }
        ]
      }).select('+password');
      
      if (!student) {
        console.log('❌ Student not found!');
        console.log('💡 Creating student account...');
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const newStudent = new StudentPass({
          name: 'Test Student',
          email: email,
          phone: '9876543210',
          password: hashedPassword,
          aadhaarNumber: '123456789012',
          status: 'approved',
          passStatus: 'approved',
          personalDetails: {
            fullName: 'Test Student',
            email: email,
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
            homeAddress: '123 Test Street',
            nearestBusStop: 'Test Bus Stop',
            destinationBusStop: 'University Bus Stop',
            passDuration: 'yearly'
          },
          validity: {
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            isActive: true
          },
          digitalPass: {
            passNumber: 'STU2024001',
            qrCode: 'QR_STU2024001',
            generatedAt: new Date()
          }
        });
        
        await newStudent.save();
        console.log('✅ Student created!\n');
        
        // Test login again
        const createdStudent = await StudentPass.findOne({ 
          $or: [
            { email: normalizedIdentifier },
            { 'personalDetails.email': normalizedIdentifier }
          ]
        }).select('+password');
        
        console.log('🔐 Testing password verification...');
        const isMatch = await createdStudent.comparePassword(password);
        console.log(`Password match: ${isMatch ? '✅ PASSED' : '❌ FAILED'}\n`);
        
        if (isMatch) {
          console.log('✅ Login would succeed!');
          console.log('\n📋 Response would be:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('Role: student');
          console.log('RoleType: external');
          console.log('Redirect: /student/dashboard');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }
      } else {
        console.log('✅ Student found!\n');
        console.log('Student details:');
        console.log(`  ID: ${student._id}`);
        console.log(`  Email: ${student.email || student.personalDetails?.email}`);
        console.log(`  Name: ${student.name || student.personalDetails?.fullName}`);
        console.log(`  Status: ${student.status}`);
        console.log(`  Pass Status: ${student.passStatus}\n`);
        
        console.log('🔐 Testing password verification...');
        const isMatch = await student.comparePassword(password);
        console.log(`Password match: ${isMatch ? '✅ PASSED' : '❌ FAILED'}\n`);
        
        if (!isMatch) {
          console.log('💡 Password doesn\'t match. Updating password...');
          // Set password as plain text - pre-save hook will hash it
          student.password = password;
          // Mark password as modified to trigger pre-save hook
          student.markModified('password');
          await student.save();
          console.log('✅ Password updated!\n');
          
          // Test again - need to re-fetch to get the hashed password
          const updatedStudent = await StudentPass.findOne({ 
            $or: [
              { email: normalizedIdentifier },
              { 'personalDetails.email': normalizedIdentifier }
            ]
          }).select('+password');
          
          const isMatch2 = await updatedStudent.comparePassword(password);
          console.log(`Password match after update: ${isMatch2 ? '✅ PASSED' : '❌ FAILED'}\n`);
        }
        
        if (isMatch || await student.comparePassword(password)) {
          console.log('✅ Login would succeed!');
          console.log('\n📋 Response would be:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('Role: student');
          console.log('RoleType: external');
          console.log('Redirect: /student/dashboard');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testStudentLogin();

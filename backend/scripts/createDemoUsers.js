/**
 * Create Demo Vendor and Student Users
 * For testing dashboards
 */

const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');
const StudentPass = require('../models/StudentPass');
require('dotenv').config();

async function createDemoUsers() {
  try {
    console.log('🚀 Starting demo user creation...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp');
    console.log('✅ Connected to MongoDB');

    // ============================================
    // CREATE DEMO VENDOR
    // ============================================
    console.log('\n📦 Creating Demo Vendor...');
    
    // Check if vendor already exists
    const existingVendor = await Vendor.findOne({ email: 'vendor@yatrik.com' });
    if (existingVendor) {
      console.log('⚠️  Vendor already exists, deleting...');
      await Vendor.deleteOne({ email: 'vendor@yatrik.com' });
      console.log('🗑️  Deleted existing vendor');
    }

    const vendor = new Vendor({
      companyName: 'Yatrik Demo Vendor Co.',
      companyType: 'supplier',
      email: 'vendor@yatrik.com',
      phone: '+919876543210',
      password: 'Vendor123', // Will be hashed by pre-save hook
      panNumber: 'ABCDE1234F',
      gstNumber: '29ABCDE1234F1Z5',
      address: {
        street: '123 Vendor Street',
        city: 'Kochi',
        state: 'Kerala',
        pincode: '682001',
        country: 'India'
      },
      bankDetails: {
        accountNumber: '1234567890123456',
        ifscCode: 'BANK0001234',
        bankName: 'Demo Bank',
        accountHolderName: 'Yatrik Demo Vendor Co.',
        branch: 'Kochi Main Branch'
      },
      contractDetails: {
        contractNumber: 'CONTRACT-2024-DEMO-001',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        validity: 'active',
        slaTerms: {
          deliveryTimeline: 48, // hours
          qualityThreshold: 95, // percentage
          penaltyClause: '5% penalty for late delivery'
        }
      },
      status: 'approved',
      verificationStatus: 'verified',
      autoApproved: true,
      fraudScore: 5,
      trustScore: 85,
      complianceScore: 90,
      deliveryReliabilityScore: 88,
      performanceMetrics: {
        invoiceAccuracy: 98,
        avgPaymentCycle: 14,
        rejectedInvoiceCount: 0,
        slaScore: 95,
        totalInvoices: 25,
        totalPurchaseOrders: 18
      }
    });

    await vendor.save();
    console.log('✅ Demo Vendor created successfully!');
    console.log('   📧 Email: vendor@yatrik.com');
    console.log('   🔑 Password: Vendor123');
    console.log('   🏢 Company: Yatrik Demo Vendor Co.');
    console.log('   📊 Trust Score:', vendor.trustScore);
    console.log('   ✅ Status:', vendor.status);

    // ============================================
    // CREATE DEMO STUDENT
    // ============================================
    console.log('\n🎓 Creating Demo Student...');
    
    // Check if student already exists
    const existingStudent = await StudentPass.findOne({ aadhaarNumber: '123456789012' });
    if (existingStudent) {
      console.log('⚠️  Student already exists, deleting...');
      await StudentPass.deleteOne({ aadhaarNumber: '123456789012' });
      console.log('🗑️  Deleted existing student');
    }

    const birthDate = new Date('2005-01-15');
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 year validity

    const studentPass = new StudentPass({
      aadhaarNumber: '123456789012',
      name: 'Demo Student',
      dateOfBirth: birthDate,
      age: age,
      email: 'student@yatrik.com',
      phone: '+919876543211',
      password: 'Student123', // Will be hashed by pre-save hook
      institution: {
        name: 'Kerala University',
        type: 'university',
        registrationNumber: 'UNI-KER-001',
        address: {
          street: 'University Campus',
          city: 'Thiruvananthapuram',
          state: 'Kerala',
          pincode: '695034'
        }
      },
      course: {
        name: 'Bachelor of Engineering',
        year: '3rd Year',
        department: 'Computer Science'
      },
      passType: 'student_concession',
      validityPeriod: {
        startDate: startDate,
        endDate: endDate
      },
      eligibilityStatus: 'approved',
      isEligible: true,
      aiVerified: true,
      status: 'active',
      subsidy: {
        percentage: 50,
        amountUsed: 1250,
        totalAllocated: 5000
      },
      travelHistory: [
        {
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          route: 'Kochi to Trivandrum',
          fare: 250,
          discount: 125,
          finalFare: 125
        },
        {
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          route: 'Trivandrum to Kochi',
          fare: 250,
          discount: 125,
          finalFare: 125
        }
      ]
    });

    await studentPass.save();
    console.log('✅ Demo Student created successfully!');
    console.log('   📧 Email: student@yatrik.com');
    console.log('   🔑 Password: Student123');
    console.log('   🆔 Aadhaar: 123456789012');
    console.log('   🎫 Pass Number:', studentPass.passNumber);
    console.log('   📅 Valid Until:', studentPass.validityPeriod.endDate.toDateString());
    console.log('   💰 Subsidy Used: ₹', studentPass.subsidy.amountUsed, '/ ₹', studentPass.subsidy.totalAllocated);
    console.log('   ✅ Status:', studentPass.status);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📋 DEMO USER CREDENTIALS SUMMARY');
    console.log('='.repeat(60));
    console.log('\n🏢 VENDOR DASHBOARD:');
    console.log('   URL: http://localhost:3000/vendor/home');
    console.log('   Email: vendor@yatrik.com');
    console.log('   Password: Vendor123');
    console.log('\n🎓 STUDENT DASHBOARD:');
    console.log('   URL: http://localhost:3000/student/pass');
    console.log('   Email: student@yatrik.com');
    console.log('   Password: Student123');
    console.log('   Aadhaar: 123456789012');
    console.log('\n💡 LOGIN PAGE:');
    console.log('   URL: http://localhost:3000/login');
    console.log('   Use the credentials above to login');
    console.log('\n' + '='.repeat(60));
    console.log('✅ Demo users created successfully!');
    console.log('='.repeat(60) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating demo users:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
createDemoUsers();


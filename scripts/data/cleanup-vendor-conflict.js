const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// Simple cleanup script to fix vendor login
async function cleanup() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://yatrikerp:yatrikerp123@cluster0.3qt2hfg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const email = 'vendor@yatrik.com';

    // Load models
    const StudentPass = require('./backend/models/StudentPass');
    const Vendor = require('./backend/models/Vendor');
    
    // Delete conflicting StudentPass records
    const deleteResult = await StudentPass.deleteMany({ email });
    console.log(`Deleted ${deleteResult.deletedCount} conflicting StudentPass record(s) with email ${email}\n`);
    
    // Check and update vendor
    const vendor = await Vendor.findOne({ email }).select('+password');
    if (vendor) {
      console.log('✅ Vendor found:');
      console.log(`   Company: ${vendor.companyName}`);
      console.log(`   Status: ${vendor.status}`);
      
      // Ensure vendor is approved
      if (vendor.status !== 'approved' && vendor.status !== 'active') {
        vendor.status = 'approved';
        await vendor.save();
        console.log('   ✅ Status updated to approved');
      }
      
      // Test password
      const isMatch = await vendor.comparePassword('Vendor123');
      if (!isMatch) {
        console.log('   ⚠️ Password mismatch - updating...');
        vendor.password = 'Vendor123';
        await vendor.save();
        console.log('   ✅ Password updated');
      } else {
        console.log('   ✅ Password is correct');
      }
    } else {
      console.log('❌ No vendor found - creating one...\n');
      await Vendor.create({
        companyName: 'Yatrik Demo Vendor Co.',
        email: 'vendor@yatrik.com',
        password: 'Vendor123',
        phone: '9876543210',
        panNumber: 'ABCDE1234F',
        companyType: 'supplier',
        status: 'approved',
        verificationStatus: 'verified',
        autoApproved: true,
        trustScore: 75,
        complianceScore: 75,
        deliveryReliabilityScore: 75
      });
      console.log('✅ Vendor created successfully');
    }

    await mongoose.connection.close();
    console.log('\n✅ Cleanup complete! Vendor login should now work.');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart backend server');
    console.log('   2. Try logging in with vendor@yatrik.com / Vendor123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanup();

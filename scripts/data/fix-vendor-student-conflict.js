const mongoose = require('mongoose');
require('dotenv').config();

const StudentPass = require('./backend/models/StudentPass');
const Vendor = require('./backend/models/Vendor');

async function fixConflict() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');
    console.log('✅ Connected to MongoDB');

    const email = 'vendor@yatrik.com';

    // Check for conflicting student record
    const student = await StudentPass.findOne({ email });
    if (student) {
      console.log('⚠️  Found conflicting StudentPass record with email:', email);
      console.log('   Student ID:', student._id);
      console.log('   Name:', student.name);
      console.log('   Status:', student.status);
      
      // Delete the conflicting student record
      await StudentPass.deleteOne({ email });
      console.log('✅ Deleted conflicting StudentPass record');
    } else {
      console.log('✅ No conflicting StudentPass record found');
    }

    // Check vendor record
    const vendor = await Vendor.findOne({ email });
    if (vendor) {
      console.log('✅ Vendor record exists:');
      console.log('   Vendor ID:', vendor._id);
      console.log('   Company:', vendor.companyName);
      console.log('   Status:', vendor.status);
      
      // Ensure vendor is approved
      if (vendor.status === 'pending' || vendor.status === 'rejected') {
        vendor.status = 'approved';
        await vendor.save();
        console.log('✅ Updated vendor status to approved');
      }
    } else {
      console.log('❌ No vendor record found - creating one');
      
      // Create vendor record
      const newVendor = await Vendor.create({
        companyName: 'Test Vendor Company',
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
      
      console.log('✅ Created new vendor record:', newVendor._id);
    }

    console.log('\n✅ Conflict resolution complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixConflict();

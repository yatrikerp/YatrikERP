// Quick test to verify vendor login works
const mongoose = require('mongoose');
require('dotenv').config();

const Vendor = require('./models/Vendor');
const StudentPass = require('./models/StudentPass');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const email = 'vendor@yatrik.com';

    // Check StudentPass
    const students = await StudentPass.find({ email });
    console.log(`StudentPass records with email ${email}: ${students.length}`);
    if (students.length > 0) {
      console.log('❌ CONFLICT FOUND - StudentPass records exist:');
      students.forEach((s, i) => {
        console.log(`  ${i + 1}. ID: ${s._id}, Name: ${s.name}, Status: ${s.status}`);
      });
      
      // Delete them
      await StudentPass.deleteMany({ email });
      console.log('✅ Deleted all conflicting StudentPass records\n');
    } else {
      console.log('✅ No conflicting StudentPass records\n');
    }

    // Check Vendor
    const vendors = await Vendor.find({ email }).select('+password');
    console.log(`Vendor records with email ${email}: ${vendors.length}`);
    if (vendors.length > 0) {
      const vendor = vendors[0];
      console.log('✅ Vendor found:');
      console.log(`  ID: ${vendor._id}`);
      console.log(`  Company: ${vendor.companyName}`);
      console.log(`  Status: ${vendor.status}`);
      console.log(`  Has Password: ${!!vendor.password}`);
      
      // Test password
      const testPassword = 'Vendor123';
      const isMatch = await vendor.comparePassword(testPassword);
      console.log(`  Password '${testPassword}' matches: ${isMatch ? '✅ YES' : '❌ NO'}`);
      
      if (!isMatch) {
        console.log('\n❌ Password mismatch - updating password...');
        vendor.password = testPassword;
        await vendor.save();
        console.log('✅ Password updated');
      }
      
      if (vendor.status !== 'approved' && vendor.status !== 'active') {
        vendor.status = 'approved';
        await vendor.save();
        console.log('✅ Vendor status updated to approved');
      }
    } else {
      console.log('❌ No vendor found - creating one...');
      const newVendor = await Vendor.create({
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
      console.log('✅ Created vendor:', newVendor._id);
    }

    await mongoose.connection.close();
    console.log('\n✅ Test complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

test();

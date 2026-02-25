const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Vendor = require('../models/Vendor');
const PurchaseOrder = require('../models/PurchaseOrder');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp';

async function testVendorLogin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find vendor users
    const vendorUsers = await User.find({ role: 'vendor' }).select('_id email name vendorId companyName').lean();
    console.log(`📋 Found ${vendorUsers.length} vendor users:\n`);
    
    for (const user of vendorUsers) {
      console.log(`\n👤 User: ${user.email || user.name}`);
      console.log(`   User ID: ${user._id}`);
      console.log(`   Vendor ID (from user): ${user.vendorId || 'NOT SET'}`);
      console.log(`   Company Name: ${user.companyName || 'NOT SET'}`);
      
      // Check if vendorId exists in Vendor collection
      if (user.vendorId) {
        const vendor = await Vendor.findById(user.vendorId).select('_id companyName email').lean();
        if (vendor) {
          console.log(`   ✅ Vendor found: ${vendor.companyName}`);
        } else {
          console.log(`   ❌ Vendor NOT found with ID: ${user.vendorId}`);
        }
      }
      
      // Try to find POs using user._id as vendorId
      const posByUserId = await PurchaseOrder.countDocuments({ vendorId: user._id });
      console.log(`   📦 POs with vendorId = user._id: ${posByUserId}`);
      
      // Try to find POs using user.vendorId
      if (user.vendorId) {
        const posByVendorId = await PurchaseOrder.countDocuments({ vendorId: user.vendorId });
        console.log(`   📦 POs with vendorId = user.vendorId: ${posByVendorId}`);
        
        // Try with $in
        const posByIn = await PurchaseOrder.countDocuments({
          vendorId: { $in: [new mongoose.Types.ObjectId(user.vendorId), user.vendorId.toString(), user.vendorId] }
        });
        console.log(`   📦 POs with vendorId $in: ${posByIn}`);
      }
      
      // Try to find POs by companyName
      if (user.companyName) {
        const posByName = await PurchaseOrder.countDocuments({ vendorName: user.companyName });
        console.log(`   📦 POs with vendorName = companyName: ${posByName}`);
      }
    }

    // Check all vendors
    console.log(`\n\n📋 All Vendors in Vendor collection:\n`);
    const vendors = await Vendor.find({}).select('_id companyName email').lean();
    vendors.forEach(v => {
      console.log(`  - ${v.companyName} (ID: ${v._id})`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Test completed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testVendorLogin();

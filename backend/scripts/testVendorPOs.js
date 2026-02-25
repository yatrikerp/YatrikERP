const mongoose = require('mongoose');
require('dotenv').config();

const PurchaseOrder = require('../models/PurchaseOrder');
const Vendor = require('../models/Vendor');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp';

async function testVendorPOs() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all vendors
    const vendors = await Vendor.find({}).select('_id companyName email').lean();
    console.log(`📋 Found ${vendors.length} vendors:\n`);
    vendors.forEach(v => {
      console.log(`  - ${v.companyName} (ID: ${v._id})`);
    });

    console.log('\n📦 Checking Purchase Orders...\n');

    // Check POs for each vendor
    for (const vendor of vendors) {
      const vendorId = vendor._id;
      const vendorObjectId = new mongoose.Types.ObjectId(vendorId);
      
      // Try different query formats
      const queries = [
        { vendorId: vendorObjectId },
        { vendorId: vendorId },
        { vendorId: vendorId.toString() },
        { vendorName: vendor.companyName }
      ];

      console.log(`\n🔍 Checking POs for: ${vendor.companyName}`);
      
      for (const q of queries) {
        const count = await PurchaseOrder.countDocuments(q);
        if (count > 0) {
          const pos = await PurchaseOrder.find(q)
            .select('poNumber status vendorId vendorName createdAt')
            .limit(5)
            .lean();
          console.log(`  ✅ Query ${JSON.stringify(q)}: Found ${count} POs`);
          pos.forEach(po => {
            console.log(`     - ${po.poNumber} | Status: ${po.status} | VendorId: ${po.vendorId?.toString()}`);
          });
        }
      }
    }

    // Check all POs regardless of vendor
    const allPOs = await PurchaseOrder.find({})
      .select('poNumber status vendorId vendorName createdAt')
      .limit(10)
      .lean();
    
    console.log(`\n\n📊 Total POs in database: ${await PurchaseOrder.countDocuments({})}`);
    console.log(`\n📋 Sample POs (any vendor):`);
    allPOs.forEach(po => {
      console.log(`  - ${po.poNumber} | Status: ${po.status} | Vendor: ${po.vendorName} | VendorId: ${po.vendorId?.toString()}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Test completed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testVendorPOs();

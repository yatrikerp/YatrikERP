const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const PurchaseOrder = require('../models/PurchaseOrder');
const User = require('../models/User');
const Depot = require('../models/Depot');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp';

// Sample products data
const sampleProducts = [
  {
    productCode: 'ENG-OIL-FILTER-001',
    productName: 'Engine Oil Filter Premium',
    description: 'High-quality engine oil filter for buses. Compatible with all major bus models.',
    category: 'filters',
    basePrice: 450,
    finalPrice: 450,
    taxRate: 18,
    stock: { quantity: 50, unit: 'pieces' },
    status: 'active',
    isActive: true
  },
  {
    productCode: 'BRAKE-PAD-SET-001',
    productName: 'Heavy Duty Brake Pad Set',
    description: 'Premium brake pads for heavy-duty buses. Long-lasting and reliable.',
    category: 'brakes',
    basePrice: 3200,
    finalPrice: 3200,
    taxRate: 18,
    stock: { quantity: 30, unit: 'pieces' },
    status: 'active',
    isActive: true
  },
  {
    productCode: 'BATTERY-12V-200AH',
    productName: '12V 200Ah Heavy Duty Battery',
    description: 'High-capacity battery for bus electrical systems. Maintenance-free design.',
    category: 'battery',
    basePrice: 8500,
    finalPrice: 8500,
    taxRate: 18,
    stock: { quantity: 20, unit: 'pieces' },
    status: 'active',
    isActive: true
  },
  {
    productCode: 'TIRE-12R22.5',
    productName: 'Bus Tire 12R22.5 Premium',
    description: 'Premium radial tire for buses. Excellent grip and durability.',
    category: 'tires',
    basePrice: 12500,
    finalPrice: 12500,
    taxRate: 18,
    stock: { quantity: 15, unit: 'pieces' },
    status: 'active',
    isActive: true
  },
  {
    productCode: 'HEADLIGHT-LED-001',
    productName: 'LED Headlight Assembly',
    description: 'Modern LED headlight for buses. Energy efficient and bright.',
    category: 'lights',
    basePrice: 2800,
    finalPrice: 2800,
    taxRate: 18,
    stock: { quantity: 25, unit: 'pieces' },
    status: 'active',
    isActive: true
  },
  {
    productCode: 'WIPER-BLADE-24',
    productName: 'Heavy Duty Wiper Blade 24"',
    description: 'Durable wiper blades for bus windshields. Weather-resistant.',
    category: 'wipers',
    basePrice: 650,
    finalPrice: 650,
    taxRate: 18,
    stock: { quantity: 40, unit: 'pieces' },
    status: 'active',
    isActive: true
  },
  {
    productCode: 'AIR-FILTER-HVAC',
    productName: 'HVAC Air Filter',
    description: 'High-efficiency air filter for bus HVAC systems.',
    category: 'filters',
    basePrice: 1200,
    finalPrice: 1200,
    taxRate: 18,
    stock: { quantity: 35, unit: 'pieces' },
    status: 'active',
    isActive: true
  },
  {
    productCode: 'SEAT-COVER-PREMIUM',
    productName: 'Premium Seat Cover Set',
    description: 'Comfortable and durable seat covers for passenger seats.',
    category: 'interior',
    basePrice: 850,
    finalPrice: 850,
    taxRate: 18,
    stock: { quantity: 60, unit: 'pieces' },
    status: 'active',
    isActive: true
  }
];

async function addVendorProductsAndPOs() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all vendors
    const vendors = await Vendor.find({}).select('_id companyName email phone').lean();
    
    if (vendors.length === 0) {
      console.log('❌ No vendors found! Please create vendors first.');
      process.exit(1);
    }

    console.log(`📋 Found ${vendors.length} vendors:\n`);
    vendors.forEach(v => {
      console.log(`  - ${v.companyName} (ID: ${v._id})`);
    });

    // Find admin user for creating POs
    const adminUser = await User.findOne({ role: 'admin' }).select('_id name email').lean();
    if (!adminUser) {
      console.log('⚠️ No admin user found. POs will be created without requestedBy.');
    }

    // Find a depot
    const depot = await Depot.findOne().select('_id depotName depotCode').lean();
    if (!depot) {
      console.log('⚠️ No depot found. POs will be created without depotId.');
    }

    // Process each vendor
    for (const vendor of vendors) {
      console.log(`\n\n🏭 Processing vendor: ${vendor.companyName}`);
      console.log('='.repeat(60));

      // Step 1: Add products to vendor
      console.log('\n📦 Step 1: Adding products to vendor...');
      const vendorProducts = [];

      for (const productData of sampleProducts) {
        // Make product code unique per vendor by adding vendor ID suffix
        const vendorSuffix = vendor._id.toString().substr(-6).toUpperCase();
        const uniqueProductCode = `${productData.productCode}-${vendorSuffix}`;
        
        // Check if product already exists for this vendor
        const existingProduct = await Product.findOne({
          productCode: uniqueProductCode,
          vendorId: vendor._id
        });

        if (existingProduct) {
          console.log(`  ⏭️  Product ${uniqueProductCode} already exists, skipping...`);
          vendorProducts.push(existingProduct);
        } else {
          const product = new Product({
            ...productData,
            productCode: uniqueProductCode, // Use unique product code
            vendorId: vendor._id,
            vendorName: vendor.companyName,
            vendorCompany: vendor.companyName
          });

          await product.save();
          console.log(`  ✅ Created product: ${product.productCode} - ${product.productName} (₹${product.finalPrice})`);
          vendorProducts.push(product);
        }
      }

      if (vendorProducts.length === 0) {
        console.log('  ⚠️  No products available for this vendor, skipping PO creation...');
        continue;
      }

      // Step 2: Create purchase orders with different statuses
      console.log('\n📋 Step 2: Creating purchase orders...');

      // PO 1: Pending (approved by admin, waiting for vendor)
      if (vendorProducts.length >= 2) {
        const po1Items = [
          {
            sparePartId: vendorProducts[0]._id,
            partNumber: vendorProducts[0].productCode,
            partName: vendorProducts[0].productName,
            description: vendorProducts[0].description,
            category: vendorProducts[0].category,
            quantity: 5,
            unit: vendorProducts[0].stock?.unit || 'pieces',
            unitPrice: vendorProducts[0].finalPrice,
            totalPrice: vendorProducts[0].finalPrice * 5
          },
          {
            sparePartId: vendorProducts[1]._id,
            partNumber: vendorProducts[1].productCode,
            partName: vendorProducts[1].productName,
            description: vendorProducts[1].description,
            category: vendorProducts[1].category,
            quantity: 3,
            unit: vendorProducts[1].stock?.unit || 'pieces',
            unitPrice: vendorProducts[1].finalPrice,
            totalPrice: vendorProducts[1].finalPrice * 3
          }
        ];

        const po1Subtotal = po1Items.reduce((sum, item) => sum + item.totalPrice, 0);
        const po1Tax = po1Subtotal * 0.18;
        const po1Total = po1Subtotal + po1Tax;

        const po1 = new PurchaseOrder({
          poNumber: `PO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          vendorId: vendor._id,
          vendorName: vendor.companyName,
          vendorEmail: vendor.email,
          vendorPhone: vendor.phone,
          requestedBy: adminUser?._id,
          requestedByName: adminUser?.name || 'Admin',
          depotId: depot?._id,
          depotName: depot?.depotName || 'Main Depot',
          items: po1Items,
          subtotal: po1Subtotal,
          tax: {
            cgst: po1Tax / 2,
            sgst: po1Tax / 2,
            total: po1Tax
          },
          totalAmount: po1Total,
          deliveryAddress: {
            depotId: depot?._id,
            address: depot?.depotName || 'Depot Address',
            city: 'Kochi',
            state: 'Kerala',
            pincode: '682001'
          },
          expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          paymentTerms: 'Net 30',
          notes: 'Purchase order approved by admin. Please review and accept.',
          status: 'pending', // This status is visible to vendors (admin approved)
          createdBy: adminUser?._id,
          orderDate: new Date()
        });

        await po1.save();
        console.log(`  ✅ Created PO: ${po1.poNumber} (Status: pending - visible to vendor)`);
      }

      // PO 2: Accepted by vendor
      if (vendorProducts.length >= 3) {
        const po2Items = [
          {
            sparePartId: vendorProducts[2]._id,
            partNumber: vendorProducts[2].productCode,
            partName: vendorProducts[2].productName,
            description: vendorProducts[2].description,
            category: vendorProducts[2].category,
            quantity: 2,
            unit: vendorProducts[2].stock?.unit || 'pieces',
            unitPrice: vendorProducts[2].finalPrice,
            totalPrice: vendorProducts[2].finalPrice * 2
          }
        ];

        const po2Subtotal = po2Items.reduce((sum, item) => sum + item.totalPrice, 0);
        const po2Tax = po2Subtotal * 0.18;
        const po2Total = po2Subtotal + po2Tax;

        const po2 = new PurchaseOrder({
          poNumber: `PO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          vendorId: vendor._id,
          vendorName: vendor.companyName,
          vendorEmail: vendor.email,
          vendorPhone: vendor.phone,
          requestedBy: adminUser?._id,
          requestedByName: adminUser?.name || 'Admin',
          depotId: depot?._id,
          depotName: depot?.depotName || 'Main Depot',
          items: po2Items,
          subtotal: po2Subtotal,
          tax: {
            cgst: po2Tax / 2,
            sgst: po2Tax / 2,
            total: po2Tax
          },
          totalAmount: po2Total,
          deliveryAddress: {
            depotId: depot?._id,
            address: depot?.depotName || 'Depot Address',
            city: 'Kochi',
            state: 'Kerala',
            pincode: '682001'
          },
          expectedDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          paymentTerms: 'Net 30',
          notes: 'Purchase order accepted by vendor.',
          status: 'accepted',
          createdBy: adminUser?._id,
          orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        });

        await po2.save();
        console.log(`  ✅ Created PO: ${po2.poNumber} (Status: accepted)`);
      }

      // PO 3: In Progress
      if (vendorProducts.length >= 4) {
        const po3Items = [
          {
            sparePartId: vendorProducts[3]._id,
            partNumber: vendorProducts[3].productCode,
            partName: vendorProducts[3].productName,
            description: vendorProducts[3].description,
            category: vendorProducts[3].category,
            quantity: 4,
            unit: vendorProducts[3].stock?.unit || 'pieces',
            unitPrice: vendorProducts[3].finalPrice,
            totalPrice: vendorProducts[3].finalPrice * 4
          }
        ];

        const po3Subtotal = po3Items.reduce((sum, item) => sum + item.totalPrice, 0);
        const po3Tax = po3Subtotal * 0.18;
        const po3Total = po3Subtotal + po3Tax;

        const po3 = new PurchaseOrder({
          poNumber: `PO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          vendorId: vendor._id,
          vendorName: vendor.companyName,
          vendorEmail: vendor.email,
          vendorPhone: vendor.phone,
          requestedBy: adminUser?._id,
          requestedByName: adminUser?.name || 'Admin',
          depotId: depot?._id,
          depotName: depot?.depotName || 'Main Depot',
          items: po3Items,
          subtotal: po3Subtotal,
          tax: {
            cgst: po3Tax / 2,
            sgst: po3Tax / 2,
            total: po3Tax
          },
          totalAmount: po3Total,
          deliveryAddress: {
            depotId: depot?._id,
            address: depot?.depotName || 'Depot Address',
            city: 'Kochi',
            state: 'Kerala',
            pincode: '682001'
          },
          expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          paymentTerms: 'Net 30',
          notes: 'Purchase order in progress - materials being prepared.',
          status: 'in_progress',
          createdBy: adminUser?._id,
          orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
        });

        await po3.save();
        console.log(`  ✅ Created PO: ${po3.poNumber} (Status: in_progress)`);
      }

      // PO 4: Delivered
      if (vendorProducts.length >= 5) {
        const po4Items = [
          {
            sparePartId: vendorProducts[4]._id,
            partNumber: vendorProducts[4].productCode,
            partName: vendorProducts[4].productName,
            description: vendorProducts[4].description,
            category: vendorProducts[4].category,
            quantity: 6,
            unit: vendorProducts[4].stock?.unit || 'pieces',
            unitPrice: vendorProducts[4].finalPrice,
            totalPrice: vendorProducts[4].finalPrice * 6
          }
        ];

        const po4Subtotal = po4Items.reduce((sum, item) => sum + item.totalPrice, 0);
        const po4Tax = po4Subtotal * 0.18;
        const po4Total = po4Subtotal + po4Tax;

        const po4 = new PurchaseOrder({
          poNumber: `PO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          vendorId: vendor._id,
          vendorName: vendor.companyName,
          vendorEmail: vendor.email,
          vendorPhone: vendor.phone,
          requestedBy: adminUser?._id,
          requestedByName: adminUser?.name || 'Admin',
          depotId: depot?._id,
          depotName: depot?.depotName || 'Main Depot',
          items: po4Items,
          subtotal: po4Subtotal,
          tax: {
            cgst: po4Tax / 2,
            sgst: po4Tax / 2,
            total: po4Tax
          },
          totalAmount: po4Total,
          deliveryAddress: {
            depotId: depot?._id,
            address: depot?.depotName || 'Depot Address',
            city: 'Kochi',
            state: 'Kerala',
            pincode: '682001'
          },
          expectedDeliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          paymentTerms: 'Net 30',
          notes: 'Purchase order delivered successfully.',
          status: 'delivered',
          createdBy: adminUser?._id,
          orderDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          deliveredDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        });

        await po4.save();
        console.log(`  ✅ Created PO: ${po4.poNumber} (Status: delivered)`);
      }

      console.log(`\n✅ Completed processing for ${vendor.companyName}`);
    }

    console.log('\n\n🎉 All vendors processed successfully!');
    console.log('\n📊 Summary:');
    const totalPOs = await PurchaseOrder.countDocuments({});
    const pendingPOs = await PurchaseOrder.countDocuments({ status: 'pending' });
    const acceptedPOs = await PurchaseOrder.countDocuments({ status: 'accepted' });
    const inProgressPOs = await PurchaseOrder.countDocuments({ status: 'in_progress' });
    const deliveredPOs = await PurchaseOrder.countDocuments({ status: 'delivered' });
    
    console.log(`  Total Purchase Orders: ${totalPOs}`);
    console.log(`  - Pending (visible to vendors): ${pendingPOs}`);
    console.log(`  - Accepted: ${acceptedPOs}`);
    console.log(`  - In Progress: ${inProgressPOs}`);
    console.log(`  - Delivered: ${deliveredPOs}`);

    await mongoose.disconnect();
    console.log('\n✅ Script completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
addVendorProductsAndPOs();

/**
 * Create Test Purchase Order for Vendor
 * Creates a sample purchase order so vendor can see it in their dashboard
 */

const mongoose = require('mongoose');
require('dotenv').config();

const PurchaseOrder = require('../models/PurchaseOrder');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const User = require('../models/User');
const Depot = require('../models/Depot');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';

async function createTestPurchaseOrder() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find vendor
    const vendor = await Vendor.findOne({ 
      $or: [
        { email: 'vendor@yatrik.com' },
        { companyName: { $regex: /vendor/i } }
      ]
    }) || await Vendor.findOne();

    if (!vendor) {
      console.log('❌ No vendor found!');
      process.exit(1);
    }

    console.log(`✅ Found vendor: ${vendor.companyName}\n`);

    // Find vendor's products
    const products = await Product.find({ vendorId: vendor._id, status: 'active' }).limit(3);
    
    if (products.length === 0) {
      console.log('❌ No products found for vendor!');
      console.log('💡 Please run: node scripts/addVendorProducts.js first');
      process.exit(1);
    }

    console.log(`✅ Found ${products.length} products\n`);

    // Find depot or admin user
    const depot = await Depot.findOne() || null;
    const adminUser = await User.findOne({ role: 'admin' }) || null;
    const depotUser = await User.findOne({ role: 'depot_manager' }) || null;

    const requestedBy = adminUser || depotUser || null;
    if (!requestedBy) {
      console.log('⚠️ No admin or depot manager found, creating PO without requester');
    }

    // Build PO items
    const poItems = [];
    let subtotal = 0;

    products.forEach((product, index) => {
      const quantity = [5, 3, 2][index] || 2;
      const unitPrice = product.finalPrice || product.basePrice;
      const totalPrice = quantity * unitPrice;
      subtotal += totalPrice;

      poItems.push({
        sparePartId: product._id,
        partNumber: product.productCode,
        partName: product.productName,
        description: product.description,
        category: product.category,
        quantity,
        unit: product.stock?.unit || 'pieces',
        unitPrice,
        totalPrice,
        image: product.images?.[0]?.url || null,
        specifications: product.specifications || {}
      });
    });

    // Calculate tax (18% GST)
    const taxRate = 0.18;
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    // Generate PO number
    const poNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create purchase order
    const purchaseOrder = new PurchaseOrder({
      poNumber,
      vendorId: vendor._id,
      vendorName: vendor.companyName,
      vendorEmail: vendor.email,
      vendorPhone: vendor.phone,
      requestedBy: requestedBy?._id,
      requestedByName: requestedBy?.name || requestedBy?.email || 'System',
      depotId: depot?._id,
      depotName: depot?.depotName || 'Test Depot',
      items: poItems,
      subtotal,
      tax: {
        cgst: taxAmount / 2,
        sgst: taxAmount / 2,
        total: taxAmount
      },
      totalAmount,
      deliveryAddress: {
        depotId: depot?._id,
        address: depot?.depotName || 'Test Depot Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      paymentTerms: 'Net 30',
      notes: 'Test purchase order for vendor dashboard',
      status: 'pending',
      createdBy: requestedBy?._id
    });

    await purchaseOrder.save();

    console.log('✅ Purchase Order Created!');
    console.log(`   PO Number: ${purchaseOrder.poNumber}`);
    console.log(`   Vendor: ${vendor.companyName}`);
    console.log(`   Items: ${poItems.length}`);
    console.log(`   Total Amount: ₹${totalAmount.toLocaleString('en-IN')}`);
    console.log(`   Status: ${purchaseOrder.status}\n`);

    await mongoose.disconnect();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createTestPurchaseOrder();

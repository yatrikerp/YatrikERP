/**
 * Seed Comprehensive Vendor Dashboard Data
 * Creates all necessary data for vendor dashboard to work perfectly
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Product = require('../models/Product');
const PurchaseOrder = require('../models/PurchaseOrder');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const Depot = require('../models/Depot');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';

async function seedVendorDashboardData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find or create vendor
    let vendor = await Vendor.findOne({ 
      $or: [
        { email: 'vendor@yatrik.com' },
        { companyName: { $regex: /vendor/i } }
      ]
    });

    if (!vendor) {
      console.log('❌ No vendor found!');
      console.log('💡 Please create a vendor first or update the email in this script');
      process.exit(1);
    }

    console.log(`✅ Found vendor: ${vendor.companyName} (${vendor._id})\n`);

    // Find vendor's products
    const products = await Product.find({ vendorId: vendor._id, status: 'active' });
    if (products.length === 0) {
      console.log('⚠️ No products found for vendor. Creating sample products...');
      // Create a few sample products
      for (let i = 0; i < 5; i++) {
        const product = new Product({
          vendorId: vendor._id,
          productCode: `PROD-${Date.now()}-${i}`,
          productName: `Sample Product ${i + 1}`,
          category: ['ENGINE', 'BRAKES', 'ELECTRICAL', 'SUSPENSION', 'TYRES'][i],
          basePrice: [1000, 2000, 3000, 4000, 5000][i],
          stock: {
            quantity: [10, 20, 30, 40, 50][i],
            unit: 'pieces'
          },
          status: 'active',
          isActive: true,
          description: `Sample product ${i + 1} description`
        });
        await product.save();
        products.push(product);
      }
      console.log(`✅ Created ${products.length} sample products\n`);
    } else {
      console.log(`✅ Found ${products.length} products\n`);
    }

    // Find admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('⚠️ No admin user found. Some data may not be linked properly.');
    }

    // Find depot
    let depot = await Depot.findOne();
    if (!depot) {
      console.log('⚠️ No depot found. Creating sample depot...');
      depot = new Depot({
        depotName: 'Main Depot',
        depotCode: 'DEP-001',
        address: 'Sample Depot Address',
        city: 'Sample City',
        state: 'Sample State',
        pincode: '123456'
      });
      await depot.save();
      console.log('✅ Created sample depot\n');
    }

    // 1. Create Purchase Orders (approved and sent to vendor)
    console.log('📦 Creating Purchase Orders...');
    const existingPOs = await PurchaseOrder.countDocuments({ vendorId: vendor._id });
    if (existingPOs === 0) {
      const poStatuses = ['pending', 'accepted', 'in_progress', 'delivered'];
      
      for (let i = 0; i < 5; i++) {
        const poItems = [];
        let subtotal = 0;
        const selectedProducts = products.slice(0, Math.min(3, products.length));
        
        selectedProducts.forEach((product, idx) => {
          const quantity = [2, 3, 5][idx] || 2;
          const unitPrice = product.basePrice;
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
            image: product.images?.[0]?.url || null
          });
        });

        const taxAmount = subtotal * 0.18;
        const totalAmount = subtotal + taxAmount;
        const status = poStatuses[i % poStatuses.length];

        const po = new PurchaseOrder({
          poNumber: `PO-${Date.now()}-${i}`,
          vendorId: vendor._id,
          vendorName: vendor.companyName,
          vendorEmail: vendor.email,
          vendorPhone: vendor.phone,
          requestedBy: adminUser?._id,
          requestedByName: adminUser?.name || 'Admin',
          depotId: depot._id,
          depotName: depot.depotName,
          items: poItems,
          subtotal,
          tax: {
            cgst: taxAmount / 2,
            sgst: taxAmount / 2,
            total: taxAmount
          },
          totalAmount,
          deliveryAddress: {
            depotId: depot._id,
            address: depot.depotName,
            city: depot.city || 'Sample City',
            state: depot.state || 'Sample State',
            pincode: depot.pincode || '123456'
          },
          expectedDeliveryDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
          paymentTerms: 'Net 30',
          status: status,
          orderDate: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000),
          createdBy: adminUser?._id,
          approvals: status !== 'pending' ? [{
            approvedBy: adminUser?._id,
            approvedAt: new Date(Date.now() - (i + 1) * 2 * 24 * 60 * 60 * 1000),
            level: 'admin',
            comments: 'Approved for processing'
          }] : []
        });

        if (status === 'accepted') {
          po.acceptedDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        }
        if (status === 'delivered') {
          po.actualDeliveryDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          po.deliveryStatus = {
            status: 'delivered',
            items: poItems.map((item, idx) => ({
              itemIndex: idx,
              quantityReceived: item.quantity,
              quantityAccepted: item.quantity,
              quantityRejected: 0,
              receivedDate: new Date()
            }))
          };
        }

        await po.save();
      }
      console.log('✅ Created 5 purchase orders\n');
    } else {
      console.log(`✅ Found ${existingPOs} existing purchase orders\n`);
    }

    // 2. Create Invoices
    console.log('🧾 Creating Invoices...');
    const existingInvoices = await Invoice.countDocuments({ vendorId: vendor._id });
    if (existingInvoices === 0) {
      const purchaseOrders = await PurchaseOrder.find({ 
        vendorId: vendor._id,
        status: { $in: ['accepted', 'in_progress', 'delivered'] }
      }).limit(3);

      for (let i = 0; i < purchaseOrders.length; i++) {
        const po = purchaseOrders[i];
        const invoiceStatus = ['generated', 'paid', 'approved'][i % 3];
        const invoice = new Invoice({
          invoiceNumber: `INV-${Date.now()}-${i}`,
          poNumber: po.poNumber,
          purchaseOrderId: po._id,
          vendorId: vendor._id,
          vendorName: vendor.companyName,
          buyerId: po.depotId,
          buyerName: po.depotName,
          items: po.items,
          subtotal: po.subtotal,
          tax: po.tax,
          totalAmount: po.totalAmount,
          status: invoiceStatus,
          paymentStatus: invoiceStatus === 'paid' ? 'paid' : 'pending',
          invoiceDate: new Date(Date.now() - i * 5 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          paymentTerms: po.paymentTerms,
          createdBy: adminUser?._id || vendor._id
        });

        if (invoiceStatus === 'paid') {
          invoice.paidAmount = invoice.totalAmount;
          invoice.dueAmount = 0;
          invoice.paymentDate = new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000);
        } else {
          invoice.paidAmount = 0;
          invoice.dueAmount = invoice.totalAmount;
        }

        await invoice.save();
      }
      console.log(`✅ Created ${purchaseOrders.length} invoices\n`);
    } else {
      console.log(`✅ Found ${existingInvoices} existing invoices\n`);
    }

    // 3. Update Invoices with Payment Status (Payments are derived from invoices)
    console.log('💳 Updating Invoice Payment Status...');
    const invoices = await Invoice.find({ vendorId: vendor._id });
    if (invoices.length > 0) {
      // Mark some invoices as paid
      for (let i = 0; i < Math.min(2, invoices.length); i++) {
        invoices[i].paymentStatus = 'paid';
        invoices[i].paidAmount = invoices[i].totalAmount;
        invoices[i].dueAmount = 0;
        invoices[i].paymentDate = new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000);
        invoices[i].status = 'paid';
        await invoices[i].save();
      }
      console.log(`✅ Updated payment status for ${Math.min(2, invoices.length)} invoices\n`);
    } else {
      console.log('⚠️ No invoices to update payment status\n');
    }

    // 4. Create Notifications
    console.log('🔔 Creating Notifications...');
    const vendorUser = await User.findOne({ vendorId: vendor._id }) || await User.findById(vendor.userId);
    if (vendorUser) {
      const existingNotifications = await Notification.countDocuments({ userId: vendorUser._id });
      if (existingNotifications === 0) {
        const notificationTypes = [
          { type: 'trip_assigned', message: 'New purchase order received', priority: 'high' },
          { type: 'trip_completed', message: 'Payment received for invoice', priority: 'medium' },
          { type: 'schedule_updated', message: 'Delivery scheduled for tomorrow', priority: 'medium' },
          { type: 'system_announcement', message: 'System maintenance scheduled', priority: 'low' }
        ];

        for (let i = 0; i < notificationTypes.length; i++) {
          const notif = new Notification({
            userId: vendorUser._id,
            type: notificationTypes[i].type,
            title: notificationTypes[i].message,
            message: `${notificationTypes[i].message} - ${new Date().toLocaleDateString()}`,
            priority: notificationTypes[i].priority,
            read: i > 1, // First two are unread
            createdAt: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000)
          });
          await notif.save();
        }
        console.log('✅ Created 4 notifications\n');
      } else {
        console.log(`✅ Found ${existingNotifications} existing notifications\n`);
      }
    } else {
      console.log('⚠️ No vendor user found. Skipping notifications.\n');
    }

    // 5. Create Audit Log entries
    console.log('📋 Creating Audit Log entries...');
    const vendorUserForAudit = await User.findOne({ vendorId: vendor._id }) || await User.findById(vendor.userId);
    if (vendorUserForAudit) {
      const existingAuditLogs = await AuditLog.countDocuments({ userId: vendorUserForAudit._id });
      if (existingAuditLogs === 0) {
        const auditActions = [
          { action: 'create', resource: 'product', description: 'Created new product' },
          { action: 'update', resource: 'payment', description: 'Accepted purchase order' },
          { action: 'update', resource: 'system', description: 'Updated stock quantity' },
          { action: 'update', resource: 'user', description: 'Updated vendor profile' }
        ];

        for (let i = 0; i < auditActions.length; i++) {
          const log = new AuditLog({
            userId: vendorUserForAudit._id,
            action: auditActions[i].action,
            resource: auditActions[i].resource,
            details: {
              description: auditActions[i].description
            },
            timestamp: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000)
          });
          await log.save();
        }
        console.log('✅ Created 4 audit log entries\n');
      } else {
        console.log(`✅ Found ${existingAuditLogs} existing audit log entries\n`);
      }
    } else {
      console.log('⚠️ No vendor user found. Skipping audit logs.\n');
    }

    // 6. Update vendor trust score and performance
    console.log('⭐ Updating Vendor Trust Score...');
    vendor.trustScore = 95;
    vendor.performanceRating = 92;
    vendor.status = 'approved';
    vendor.verificationStatus = 'verified';
    await vendor.save();
    console.log('✅ Updated vendor trust score to 95 and performance to 92\n');

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ VENDOR DASHBOARD DATA SEEDING COMPLETE!');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📊 Summary:');
    console.log(`   • Vendor: ${vendor.companyName}`);
    console.log(`   • Products: ${products.length}`);
    console.log(`   • Purchase Orders: ${await PurchaseOrder.countDocuments({ vendorId: vendor._id })}`);
    console.log(`   • Invoices: ${await Invoice.countDocuments({ vendorId: vendor._id })}`);
    const vendorUserSummary = await User.findOne({ vendorId: vendor._id }) || await User.findById(vendor.userId);
    if (vendorUserSummary) {
      console.log(`   • Notifications: ${await Notification.countDocuments({ userId: vendorUserSummary._id })}`);
      console.log(`   • Audit Logs: ${await AuditLog.countDocuments({ userId: vendorUserSummary._id })}`);
    }
    console.log(`   • Trust Score: ${vendor.trustScore}`);
    console.log(`   • Performance: ${vendor.performanceRating}\n`);

    await mongoose.disconnect();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedVendorDashboardData();

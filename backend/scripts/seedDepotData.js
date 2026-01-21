const mongoose = require('mongoose');
require('dotenv').config();

const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const PurchaseOrder = require('../models/PurchaseOrder');
const User = require('../models/User');
const Depot = require('../models/Depot');
const Bus = require('../models/Bus');
const Route = require('../models/Route');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';

async function seedDepotData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find or create depot
    let depot = await Depot.findOne({ depotCode: 'DEP001' });
    if (!depot) {
      depot = await Depot.findOne() || await Depot.create({
        depotCode: 'DEP001',
        depotName: 'Yatrik Depot',
        location: {
          city: 'Kochi',
          state: 'Kerala',
          country: 'India',
          coordinates: { lat: 9.9312, lng: 76.2673 }
        },
        status: 'active'
      });
    }
    console.log(`✅ Using depot: ${depot.depotName} (${depot.depotCode})\n`);

    // Find or create vendors
    let vendor1 = await Vendor.findOne({ email: 'vendor1@yatrik.com' });
    if (!vendor1) {
      vendor1 = await Vendor.create({
        companyName: 'Auto Parts Pro',
        email: 'vendor1@yatrik.com',
        phone: '+91-9876543210',
        address: '123 Industrial Area, Kochi',
        status: 'active',
        trustScore: 85,
        performanceScore: 90
      });
    }

    let vendor2 = await Vendor.findOne({ email: 'vendor2@yatrik.com' });
    if (!vendor2) {
      vendor2 = await Vendor.create({
        companyName: 'Bus Spares Co',
        email: 'vendor2@yatrik.com',
        phone: '+91-9876543211',
        address: '456 Commercial Street, Trivandrum',
        status: 'active',
        trustScore: 80,
        performanceScore: 85
      });
    }
    console.log(`✅ Vendors ready: ${vendor1.companyName}, ${vendor2.companyName}\n`);

    // Create products for vendors
    const products = [
      {
        productName: 'Bus Battery 12V 200Ah',
        productCode: 'BAT-001',
        category: 'ELECTRICAL',
        basePrice: 8500,
        finalPrice: 8500,
        vendorId: vendor1._id,
        stock: { quantity: 25, unit: 'pieces', minimum: 10 },
        status: 'active',
        isActive: true,
        moq: 1
      },
      {
        productName: 'AC Compressor',
        productCode: 'AC-001',
        category: 'HVAC',
        basePrice: 15000,
        finalPrice: 15000,
        vendorId: vendor1._id,
        stock: { quantity: 15, unit: 'pieces', minimum: 5 },
        status: 'active',
        isActive: true,
        moq: 1
      },
      {
        productName: 'Bus Tyre 10R22.5',
        productCode: 'TYR-001',
        category: 'TYRES',
        basePrice: 12000,
        finalPrice: 12000,
        vendorId: vendor2._id,
        stock: { quantity: 30, unit: 'pieces', minimum: 10 },
        status: 'active',
        isActive: true,
        moq: 2
      },
      {
        productName: 'Shock Absorber',
        productCode: 'SUS-001',
        category: 'SUSPENSION',
        basePrice: 3500,
        finalPrice: 3500,
        vendorId: vendor2._id,
        stock: { quantity: 20, unit: 'pieces', minimum: 8 },
        status: 'active',
        isActive: true,
        moq: 1
      },
      {
        productName: 'Alternator 24V',
        productCode: 'ALT-001',
        category: 'ELECTRICAL',
        basePrice: 9500,
        finalPrice: 9500,
        vendorId: vendor1._id,
        stock: { quantity: 18, unit: 'pieces', minimum: 5 },
        status: 'active',
        isActive: true,
        moq: 1
      },
      {
        productName: 'Brake Pad Set',
        productCode: 'BRK-001',
        category: 'BRAKES',
        basePrice: 2500,
        finalPrice: 2500,
        vendorId: vendor2._id,
        stock: { quantity: 40, unit: 'pieces', minimum: 15 },
        status: 'active',
        isActive: true,
        moq: 2
      }
    ];

    for (const productData of products) {
      const existing = await Product.findOne({ productCode: productData.productCode });
      if (!existing) {
        await Product.create(productData);
        console.log(`✅ Created product: ${productData.productName}`);
      } else {
        // Update stock if exists
        existing.stock = productData.stock;
        existing.isActive = true;
        existing.status = 'active';
        await existing.save();
        console.log(`✅ Updated product: ${productData.productName}`);
      }
    }
    console.log('\n');

    // Find admin or depot manager user
    const adminUser = await User.findOne({ role: 'admin' }) || 
                     await User.findOne({ role: 'depot_manager' });
    
    if (!adminUser) {
      console.log('⚠️ No admin or depot manager found. Creating purchase orders without requester.');
    }

    // Create sample purchase orders
    const allProducts = await Product.find({ status: 'active', isActive: true }).limit(6);
    
    if (allProducts.length >= 2) {
      // Create a pending approval PO
      const po1 = await PurchaseOrder.create({
        poNumber: `PO-${Date.now()}-001`,
        vendorId: vendor1._id,
        vendorName: vendor1.companyName,
        vendorEmail: vendor1.email,
        vendorPhone: vendor1.phone,
        requestedBy: adminUser?._id,
        requestedByName: adminUser?.name || 'Depot Manager',
        depotId: depot._id,
        depotName: depot.depotName,
        items: [
          {
            sparePartId: allProducts[0]._id,
            partNumber: allProducts[0].productCode,
            partName: allProducts[0].productName,
            quantity: 5,
            unitPrice: allProducts[0].finalPrice,
            totalPrice: allProducts[0].finalPrice * 5
          },
          {
            sparePartId: allProducts[1]._id,
            partNumber: allProducts[1].productCode,
            partName: allProducts[1].productName,
            quantity: 3,
            unitPrice: allProducts[1].finalPrice,
            totalPrice: allProducts[1].finalPrice * 3
          }
        ],
        subtotal: (allProducts[0].finalPrice * 5) + (allProducts[1].finalPrice * 3),
        tax: {
          cgst: ((allProducts[0].finalPrice * 5) + (allProducts[1].finalPrice * 3)) * 0.09,
          sgst: ((allProducts[0].finalPrice * 5) + (allProducts[1].finalPrice * 3)) * 0.09,
          total: ((allProducts[0].finalPrice * 5) + (allProducts[1].finalPrice * 3)) * 0.18
        },
        totalAmount: ((allProducts[0].finalPrice * 5) + (allProducts[1].finalPrice * 3)) * 1.18,
        status: 'pending_approval',
        paymentTerms: 'Net 30',
        createdBy: adminUser?._id
      });
      console.log(`✅ Created PO: ${po1.poNumber} (pending_approval)`);

      // Create an approved PO
      const po2 = await PurchaseOrder.create({
        poNumber: `PO-${Date.now()}-002`,
        vendorId: vendor2._id,
        vendorName: vendor2.companyName,
        vendorEmail: vendor2.email,
        vendorPhone: vendor2.phone,
        requestedBy: adminUser?._id,
        requestedByName: adminUser?.name || 'Depot Manager',
        depotId: depot._id,
        depotName: depot.depotName,
        items: [
          {
            sparePartId: allProducts[2]._id,
            partNumber: allProducts[2].productCode,
            partName: allProducts[2].productName,
            quantity: 10,
            unitPrice: allProducts[2].finalPrice,
            totalPrice: allProducts[2].finalPrice * 10
          }
        ],
        subtotal: allProducts[2].finalPrice * 10,
        tax: {
          cgst: (allProducts[2].finalPrice * 10) * 0.09,
          sgst: (allProducts[2].finalPrice * 10) * 0.09,
          total: (allProducts[2].finalPrice * 10) * 0.18
        },
        totalAmount: (allProducts[2].finalPrice * 10) * 1.18,
        status: 'approved',
        paymentTerms: 'Net 30',
        createdBy: adminUser?._id
      });
      console.log(`✅ Created PO: ${po2.poNumber} (approved)`);

      // Create a completed PO (paid)
      const po3 = await PurchaseOrder.create({
        poNumber: `PO-${Date.now()}-003`,
        vendorId: vendor1._id,
        vendorName: vendor1.companyName,
        vendorEmail: vendor1.email,
        vendorPhone: vendor1.phone,
        requestedBy: adminUser?._id,
        requestedByName: adminUser?.name || 'Depot Manager',
        depotId: depot._id,
        depotName: depot.depotName,
        items: [
          {
            sparePartId: allProducts[4]._id,
            partNumber: allProducts[4].productCode,
            partName: allProducts[4].productName,
            quantity: 4,
            unitPrice: allProducts[4].finalPrice,
            totalPrice: allProducts[4].finalPrice * 4
          }
        ],
        subtotal: allProducts[4].finalPrice * 4,
        tax: {
          cgst: (allProducts[4].finalPrice * 4) * 0.09,
          sgst: (allProducts[4].finalPrice * 4) * 0.09,
          total: (allProducts[4].finalPrice * 4) * 0.18
        },
        totalAmount: (allProducts[4].finalPrice * 4) * 1.18,
        status: 'completed',
        paymentTerms: 'Net 30',
        createdBy: adminUser?._id
      });
      console.log(`✅ Created PO: ${po3.poNumber} (completed/paid)`);
    }

    // Create sample routes and buses
    let route1 = await Route.findOne({ routeName: 'Kochi - Trivandrum' });
    if (!route1) {
      route1 = await Route.create({
        routeName: 'Kochi - Trivandrum',
        origin: 'Kochi',
        destination: 'Trivandrum',
        distance: 220,
        duration: 240,
        depot: { depotId: depot._id, depotName: depot.depotName },
        status: 'active'
      });
      console.log(`✅ Created route: ${route1.routeName}`);
    }

    let route2 = await Route.findOne({ routeName: 'Kochi - Bangalore' });
    if (!route2) {
      route2 = await Route.create({
        routeName: 'Kochi - Bangalore',
        origin: 'Kochi',
        destination: 'Bangalore',
        distance: 560,
        duration: 600,
        depot: { depotId: depot._id, depotName: depot.depotName },
        status: 'active'
      });
      console.log(`✅ Created route: ${route2.routeName}`);
    }

    // Create sample buses
    const buses = [
      {
        busNumber: 'KL-01-AB-1234',
        registrationNumber: 'KL-01-AB-1234',
        make: 'Tata',
        model: 'Starbus',
        year: 2022,
        capacity: 45,
        depotId: depot._id,
        status: 'active',
        routeId: route1._id
      },
      {
        busNumber: 'KL-01-CD-5678',
        registrationNumber: 'KL-01-CD-5678',
        make: 'Ashok Leyland',
        model: 'Viking',
        year: 2023,
        capacity: 50,
        depotId: depot._id,
        status: 'active',
        routeId: route2._id
      },
      {
        busNumber: 'KL-01-EF-9012',
        registrationNumber: 'KL-01-EF-9012',
        make: 'Volvo',
        model: '9400',
        year: 2021,
        capacity: 48,
        depotId: depot._id,
        status: 'active',
        routeId: route1._id
      }
    ];

    for (const busData of buses) {
      const existing = await Bus.findOne({ busNumber: busData.busNumber });
      if (!existing) {
        await Bus.create(busData);
        console.log(`✅ Created bus: ${busData.busNumber}`);
      }
    }

    console.log('\n✅ Depot data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Depot: ${depot.depotName}`);
    console.log(`   - Vendors: 2`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Purchase Orders: 3`);
    console.log(`   - Routes: 2`);
    console.log(`   - Buses: ${buses.length}`);

  } catch (error) {
    console.error('❌ Error seeding depot data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seedDepotData();

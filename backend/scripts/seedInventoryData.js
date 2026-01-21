const mongoose = require('mongoose');
require('dotenv').config();

const SparePart = require('../models/SparePart');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const Depot = require('../models/Depot');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';

async function seedInventoryData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find depot
    let depot = await Depot.findOne({ depotCode: 'DEP001' }) || await Depot.findOne();
    if (!depot) {
      console.log('⚠️ No depot found. Creating default depot...');
      depot = await Depot.create({
        depotCode: 'DEP001',
        depotName: 'Yatrik Depot',
        location: {
          city: 'Kochi',
          state: 'Kerala',
          country: 'India'
        },
        status: 'active'
      });
    }
    console.log(`✅ Using depot: ${depot.depotName}\n`);

    // Find existing vendor (don't create if doesn't exist)
    let vendor = await Vendor.findOne({ email: 'vendor1@yatrik.com' }) || 
                 await Vendor.findOne({ companyName: /Auto Parts/i }) ||
                 await Vendor.findOne();
    
    if (!vendor) {
      console.log('⚠️ No vendor found. Products will be created without vendor association.');
    } else {
      console.log(`✅ Using vendor: ${vendor.companyName}`);
    }

    // Create SpareParts (traditional inventory items)
    const spareParts = [
      {
        partName: 'Engine Oil Filter',
        partNumber: 'SP-001',
        category: 'engine',
        stock: { current: 45, minimum: 20, maximum: 100 },
        location: 'Warehouse A - Shelf 1',
        basePrice: 350,
        status: 'active',
        usageStats: {
          totalUsed: 120,
          lastUsedDate: new Date()
        }
      },
      {
        partName: 'Air Filter Element',
        partNumber: 'SP-002',
        category: 'engine',
        stock: { current: 30, minimum: 15, maximum: 80 },
        location: 'Warehouse A - Shelf 2',
        basePrice: 450,
        status: 'active',
        usageStats: {
          totalUsed: 85,
          lastUsedDate: new Date()
        }
      },
      {
        partName: 'Brake Fluid',
        partNumber: 'SP-003',
        category: 'brakes',
        stock: { current: 25, minimum: 10, maximum: 50 },
        location: 'Warehouse A - Shelf 3',
        basePrice: 280,
        status: 'active',
        usageStats: {
          totalUsed: 60,
          lastUsedDate: new Date()
        }
      },
      {
        partName: 'Coolant',
        partNumber: 'SP-004',
        category: 'engine',
        stock: { current: 40, minimum: 20, maximum: 100 },
        location: 'Warehouse A - Shelf 4',
        basePrice: 320,
        status: 'active',
        usageStats: {
          totalUsed: 95,
          lastUsedDate: new Date()
        }
      },
      {
        partName: 'Windshield Wiper Blade',
        partNumber: 'SP-005',
        category: 'electrical',
        stock: { current: 15, minimum: 10, maximum: 40 },
        location: 'Warehouse B - Shelf 1',
        basePrice: 180,
        status: 'active',
        usageStats: {
          totalUsed: 45,
          lastUsedDate: new Date()
        }
      },
      {
        partName: 'Headlight Bulb',
        partNumber: 'SP-006',
        category: 'electrical',
        stock: { current: 8, minimum: 10, maximum: 30 }, // Low stock
        location: 'Warehouse B - Shelf 2',
        basePrice: 220,
        status: 'active',
        usageStats: {
          totalUsed: 35,
          lastUsedDate: new Date()
        }
      },
      {
        partName: 'Radiator Hose',
        partNumber: 'SP-007',
        category: 'engine',
        stock: { current: 20, minimum: 15, maximum: 50 },
        location: 'Warehouse A - Shelf 5',
        basePrice: 550,
        status: 'active',
        usageStats: {
          totalUsed: 70,
          lastUsedDate: new Date()
        }
      },
      {
        partName: 'Clutch Plate',
        partNumber: 'SP-008',
        category: 'transmission',
        stock: { current: 5, minimum: 5, maximum: 20 }, // Low stock
        location: 'Warehouse C - Shelf 1',
        basePrice: 3500,
        status: 'active',
        usageStats: {
          totalUsed: 25,
          lastUsedDate: new Date()
        }
      },
      {
        partName: 'Timing Belt',
        partNumber: 'SP-009',
        category: 'engine',
        stock: { current: 12, minimum: 10, maximum: 30 },
        location: 'Warehouse A - Shelf 6',
        basePrice: 1200,
        status: 'active',
        usageStats: {
          totalUsed: 40,
          lastUsedDate: new Date()
        }
      },
      {
        partName: 'Spark Plug Set',
        partNumber: 'SP-010',
        category: 'engine',
        stock: { current: 0, minimum: 10, maximum: 40 }, // Out of stock
        location: 'Warehouse B - Shelf 3',
        basePrice: 450,
        status: 'active',
        usageStats: {
          totalUsed: 55,
          lastUsedDate: new Date()
        }
      }
    ];

    console.log('📦 Creating SpareParts...');
    for (const partData of spareParts) {
      const existing = await SparePart.findOne({ partNumber: partData.partNumber });
      if (!existing) {
        await SparePart.create(partData);
        console.log(`  ✅ Created: ${partData.partName}`);
      } else {
        // Update stock
        existing.stock = partData.stock;
        existing.status = 'active';
        await existing.save();
        console.log(`  ✅ Updated: ${partData.partName}`);
      }
    }

    // Ensure products have stock (from vendor products)
    console.log('\n📦 Updating Product stock...');
    const products = await Product.find({ status: 'active', isActive: true });
    for (const product of products) {
      if (!product.stock || product.stock.quantity === 0) {
        product.stock = {
          quantity: Math.floor(Math.random() * 30) + 10,
          unit: 'pieces',
          minimum: 5
        };
        await product.save();
        console.log(`  ✅ Updated stock for: ${product.productName}`);
      }
    }

    console.log('\n✅ Inventory data seeding completed!');
    console.log('\n📊 Summary:');
    console.log(`   - SpareParts created/updated: ${spareParts.length}`);
    console.log(`   - Products with stock: ${products.length}`);
    console.log(`   - Low stock items: ${spareParts.filter(p => p.stock.current <= p.stock.minimum).length}`);
    console.log(`   - Out of stock items: ${spareParts.filter(p => p.stock.current === 0).length}`);

  } catch (error) {
    console.error('❌ Error seeding inventory data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seedInventoryData();

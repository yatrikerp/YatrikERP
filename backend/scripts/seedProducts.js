/**
 * Seed Products for Depot Procurement
 * Based on Government Rate Contract System
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

// Category mapping from SQL to MongoDB
const categoryMap = {
  1: 'fluids',      // Engine & Lubricants
  2: 'brakes',      // Brake System
  3: 'electrical',  // Electricals
  4: 'tires',       // Tyres & Wheels
  5: 'filters',     // Filters
  6: 'interior',    // Body & Interior
  7: 'tools'        // Maintenance & Tools
};

// Unit mapping
const unitMap = {
  'Litre': 'liters',
  'Set': 'pieces',
  'Piece': 'pieces'
};

// Products data from specification
const productsData = [
  // ENGINE & LUBRICANTS
  {
    productCode: 'ENG-OIL-20W40',
    productName: 'Engine Oil 20W40 (Bus Grade)',
    category: 'fluids',
    basePrice: 340.00,
    finalPrice: 340.00,
    taxRate: 18,
    stock: { quantity: 50, unit: 'liters', minQuantity: 10 },
    warranty: { period: 0, type: 'manufacturer', description: 'No warranty' },
    rateContractFrom: new Date('2025-04-01'),
    rateContractTo: new Date('2026-03-31')
  },
  {
    productCode: 'GEAR-OIL-90',
    productName: 'Gear Oil SAE 90',
    category: 'fluids',
    basePrice: 420.00,
    finalPrice: 420.00,
    taxRate: 18,
    stock: { quantity: 40, unit: 'liters', minQuantity: 10 },
    warranty: { period: 0, type: 'manufacturer', description: 'No warranty' },
    rateContractFrom: new Date('2025-04-01'),
    rateContractTo: new Date('2026-03-31')
  },
  {
    productCode: 'COOLANT-RED',
    productName: 'Radiator Coolant (Red)',
    category: 'fluids',
    basePrice: 180.00,
    finalPrice: 180.00,
    taxRate: 18,
    stock: { quantity: 60, unit: 'liters', minQuantity: 10 },
    warranty: { period: 0, type: 'manufacturer', description: 'No warranty' },
    rateContractFrom: new Date('2025-04-01'),
    rateContractTo: new Date('2026-03-31')
  },
  
  // BRAKE SYSTEM
  {
    productCode: 'BRK-PAD-LP',
    productName: 'Brake Pad – Tata LP Series',
    category: 'brakes',
    basePrice: 1100.00,
    finalPrice: 1100.00,
    taxRate: 18,
    stock: { quantity: 25, unit: 'pieces', minQuantity: 5 },
    warranty: { period: 6, type: 'manufacturer', description: '6 months warranty' },
    rateContractFrom: new Date('2025-04-01'),
    rateContractTo: new Date('2026-03-31')
  },
  {
    productCode: 'BRK-OIL-DOT4',
    productName: 'Brake Oil DOT 4',
    category: 'brakes',
    basePrice: 260.00,
    finalPrice: 260.00,
    taxRate: 18,
    stock: { quantity: 30, unit: 'liters', minQuantity: 10 },
    warranty: { period: 0, type: 'manufacturer', description: 'No warranty' },
    rateContractFrom: new Date('2025-04-01'),
    rateContractTo: new Date('2026-03-31')
  },
  {
    productCode: 'AIR-VALVE',
    productName: 'Air Brake Relay Valve',
    category: 'brakes',
    basePrice: 4200.00,
    finalPrice: 4200.00,
    taxRate: 18,
    stock: { quantity: 15, unit: 'pieces', minQuantity: 3 },
    warranty: { period: 12, type: 'manufacturer', description: '12 months warranty' },
    rateContractFrom: new Date('2025-04-01'),
    rateContractTo: new Date('2026-03-31')
  },
  
  // ELECTRICALS
  {
    productCode: 'BAT-150AH',
    productName: 'Bus Battery 150Ah',
    category: 'battery',
    basePrice: 12500.00,
    finalPrice: 12500.00,
    taxRate: 28,
    stock: { quantity: 8, unit: 'pieces', minQuantity: 2 },
    warranty: { period: 24, type: 'manufacturer', description: '24 months warranty' },
    rateContractFrom: new Date('2025-04-01'),
    rateContractTo: new Date('2026-03-31')
  },
  {
    productCode: 'ALT-24V',
    productName: 'Alternator 24V Bus Model',
    category: 'electrical',
    basePrice: 18500.00,
    finalPrice: 18500.00,
    taxRate: 18,
    stock: { quantity: 5, unit: 'pieces', minQuantity: 2 },
    warranty: { period: 12, type: 'manufacturer', description: '12 months warranty' },
    rateContractFrom: new Date('2025-04-01'),
    rateContractTo: new Date('2026-03-31')
  },
  {
    productCode: 'HEADLAMP-24V',
    productName: 'Head Lamp 24V',
    category: 'lights',
    basePrice: 650.00,
    finalPrice: 650.00,
    taxRate: 18,
    stock: { quantity: 20, unit: 'pieces', minQuantity: 5 },
    warranty: { period: 6, type: 'manufacturer', description: '6 months warranty' },
    rateContractFrom: new Date('2025-04-01'),
    rateContractTo: new Date('2026-03-31')
  },
  
  // TYRES & WHEELS
  {
    productCode: 'TYRE-295-80',
    productName: 'Tyre 295/80 R22.5',
    category: 'tires',
    basePrice: 24500.00,
    finalPrice: 24500.00,
    taxRate: 28,
    stock: { quantity: 5, unit: 'pieces', minQuantity: 2 },
    warranty: { period: 36, type: 'manufacturer', description: '36 months warranty' },
    rateContractFrom: new Date('2025-04-01'),
    rateContractTo: new Date('2026-03-31')
  },
  {
    productCode: 'TUBE-295',
    productName: 'Tyre Tube 295',
    category: 'tires',
    basePrice: 2100.00,
    finalPrice: 2100.00,
    taxRate: 18,
    stock: { quantity: 10, unit: 'pieces', minQuantity: 3 },
    warranty: { period: 12, type: 'manufacturer', description: '12 months warranty' },
    rateContractFrom: new Date('2025-04-01'),
    rateContractTo: new Date('2026-03-31')
  },
  
  // FILTERS
  {
    productCode: 'OIL-FILTER',
    productName: 'Oil Filter – Bus Engine',
    category: 'filters',
    basePrice: 480.00,
    finalPrice: 480.00,
    taxRate: 18,
    stock: { quantity: 30, unit: 'pieces', minQuantity: 10 },
    warranty: { period: 0, type: 'manufacturer', description: 'No warranty' },
    rateContractFrom: new Date('2025-04-01'),
    rateContractTo: new Date('2026-03-31')
  },
  {
    productCode: 'AIR-FILTER',
    productName: 'Air Filter – Heavy Vehicle',
    category: 'filters',
    basePrice: 920.00,
    finalPrice: 920.00,
    taxRate: 18,
    stock: { quantity: 25, unit: 'pieces', minQuantity: 10 },
    warranty: { period: 0, type: 'manufacturer', description: 'No warranty' },
    rateContractFrom: new Date('2025-04-01'),
    rateContractTo: new Date('2026-03-31')
  },
  {
    productCode: 'FUEL-FILTER',
    productName: 'Fuel Filter – Diesel',
    category: 'filters',
    basePrice: 650.00,
    finalPrice: 650.00,
    taxRate: 18,
    stock: { quantity: 20, unit: 'pieces', minQuantity: 10 },
    warranty: { period: 0, type: 'manufacturer', description: 'No warranty' },
    rateContractFrom: new Date('2025-04-01'),
    rateContractTo: new Date('2026-03-31')
  },
  
  // BODY & INTERIOR
  {
    productCode: 'SEAT-CUSHION',
    productName: 'Passenger Seat Cushion',
    category: 'interior',
    basePrice: 1450.00,
    finalPrice: 1450.00,
    taxRate: 18,
    stock: { quantity: 15, unit: 'pieces', minQuantity: 5 },
    warranty: { period: 12, type: 'manufacturer', description: '12 months warranty' },
    rateContractFrom: new Date('2025-04-01'),
    rateContractTo: new Date('2026-03-31')
  },
  {
    productCode: 'SIDE-MIRROR',
    productName: 'Bus Side Mirror',
    category: 'exterior',
    basePrice: 1850.00,
    finalPrice: 1850.00,
    taxRate: 18,
    stock: { quantity: 12, unit: 'pieces', minQuantity: 3 },
    warranty: { period: 6, type: 'manufacturer', description: '6 months warranty' },
    rateContractFrom: new Date('2025-04-01'),
    rateContractTo: new Date('2026-03-31')
  },
  
  // MAINTENANCE & TOOLS
  {
    productCode: 'HYD-JACK',
    productName: 'Hydraulic Jack 10T',
    category: 'tools',
    basePrice: 7200.00,
    finalPrice: 7200.00,
    taxRate: 18,
    stock: { quantity: 8, unit: 'pieces', minQuantity: 2 },
    warranty: { period: 24, type: 'manufacturer', description: '24 months warranty' },
    rateContractFrom: new Date('2025-04-01'),
    rateContractTo: new Date('2026-03-31')
  },
  {
    productCode: 'GREASE-GUN',
    productName: 'Grease Gun Manual',
    category: 'tools',
    basePrice: 1350.00,
    finalPrice: 1350.00,
    taxRate: 18,
    stock: { quantity: 10, unit: 'pieces', minQuantity: 3 },
    warranty: { period: 12, type: 'manufacturer', description: '12 months warranty' },
    rateContractFrom: new Date('2025-04-01'),
    rateContractTo: new Date('2026-03-31')
  }
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik-erp';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find or create a default vendor
    let vendor = await Vendor.findOne({ email: 'vendor@yatrik.com' });
    
    if (!vendor) {
      // Create default vendor
      vendor = new Vendor({
        companyName: 'Yatrik Approved Vendor',
        email: 'vendor@yatrik.com',
        phone: '+919876543210',
        password: 'Vendor@123', // Will be hashed by pre-save hook
        status: 'approved',
        approvalStatus: 'approved',
        verificationStatus: 'verified',
        trustScore: 85,
        complianceScore: 90,
        deliveryReliabilityScore: 80
      });
      await vendor.save();
      console.log('✅ Created default vendor');
    } else {
      console.log('✅ Using existing vendor:', vendor.companyName);
    }

    // Create products
    let created = 0;
    let updated = 0;

    for (const productData of productsData) {
      try {
        const existingProduct = await Product.findOne({ productCode: productData.productCode });
        
        if (existingProduct) {
          // Update existing product
          existingProduct.productName = productData.productName;
          existingProduct.category = productData.category;
          existingProduct.basePrice = productData.basePrice;
          existingProduct.finalPrice = productData.finalPrice;
          existingProduct.taxRate = productData.taxRate;
          existingProduct.stock = productData.stock;
          existingProduct.vendorId = vendor._id;
          existingProduct.description = `Rate contracted product - ${productData.productName}. Contract period: ${productData.rateContractFrom?.toLocaleDateString()} to ${productData.rateContractTo?.toLocaleDateString()}. Warranty: ${productData.warranty?.period || 0} months.`;
          existingProduct.vendorName = vendor.companyName;
          existingProduct.vendorCompany = vendor.companyName;
          existingProduct.status = 'active';
          existingProduct.isActive = true;
          existingProduct.approvalStatus = {
            status: 'approved',
            reviewedAt: new Date()
          };
          existingProduct.priceLocked = true;
          existingProduct.priceLockedAt = new Date();
          
          await existingProduct.save();
          updated++;
          console.log(`✅ Updated: ${productData.productCode} - ${productData.productName}`);
        } else {
          // Create new product
          // Remove warranty and rate contract fields to avoid casting issues
          const { warranty, rateContractFrom, rateContractTo, ...productFields } = productData;
          
          const product = new Product({
            ...productFields,
            vendorId: vendor._id,
            vendorName: vendor.companyName,
            vendorCompany: vendor.companyName,
            status: 'active',
            isActive: true,
            approvalStatus: {
              status: 'approved',
              reviewedAt: new Date()
            },
            priceLocked: true,
            priceLockedAt: new Date(),
            description: `Rate contracted product - ${productData.productName}. Contract period: ${productData.rateContractFrom?.toLocaleDateString()} to ${productData.rateContractTo?.toLocaleDateString()}. Warranty: ${productData.warranty?.period || 0} months.`,
            tags: [productData.category, 'rate-contract', 'approved']
          });
          
          await product.save();
          created++;
          console.log(`✅ Created: ${productData.productCode} - ${productData.productName}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${productData.productCode}:`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Created: ${created} products`);
    console.log(`   Updated: ${updated} products`);
    console.log(`   Total: ${productsData.length} products`);
    
    // Verify products
    const totalProducts = await Product.countDocuments({ status: 'active', isActive: true });
    console.log(`\n✅ Total active products in database: ${totalProducts}`);
    
    console.log('\n🎉 Product seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  seedProducts()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = seedProducts;

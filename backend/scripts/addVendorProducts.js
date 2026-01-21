/**
 * Add Spare Parts Products for Vendor
 * Creates products using the Product model (used by vendor dashboard)
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';

// Spare parts data as provided by the user
const sparePartsData = [
  {
    productCode: 'ENG-001',
    productName: 'Engine Oil Filter',
    category: 'filters',
    basePrice: 520,
    busModelCompatibility: 'Diesel Bus',
    leadTime: 5,
    warranty: 12,
    moq: 10,
    gstRate: 18,
    stockQuantity: 0,
    stockUnit: 'pieces',
    description: 'Oil filtration unit',
    imageUrl: 'https://via.placeholder.com/300x200.png?text=Engine+Oil+Filter'
  },
  {
    productCode: 'ENG-002',
    productName: 'Fuel Injector',
    category: 'engine',
    basePrice: 3650,
    busModelCompatibility: 'Diesel Bus',
    leadTime: 7,
    warranty: 12,
    moq: 5,
    gstRate: 18,
    stockQuantity: 0,
    stockUnit: 'pieces',
    description: 'High pressure fuel injector',
    imageUrl: 'https://via.placeholder.com/300x200.png?text=Fuel+Injector'
  },
  {
    productCode: 'BRK-010',
    productName: 'Brake Pad Set',
    category: 'brakes',
    basePrice: 3150,
    busModelCompatibility: 'City Bus',
    leadTime: 4,
    warranty: 6,
    moq: 5,
    gstRate: 18,
    stockQuantity: 0,
    stockUnit: 'pieces',
    description: 'Front and rear brake pads',
    imageUrl: 'https://via.placeholder.com/300x200.png?text=Brake+Pad+Set'
  },
  {
    productCode: 'ELC-021',
    productName: 'Alternator',
    category: 'electrical',
    basePrice: 10200,
    busModelCompatibility: 'All Models',
    leadTime: 10,
    warranty: 12,
    moq: 2,
    gstRate: 18,
    stockQuantity: 0,
    stockUnit: 'pieces',
    description: 'Battery charging alternator',
    imageUrl: 'https://via.placeholder.com/300x200.png?text=Alternator'
  },
  {
    productCode: 'SUS-031',
    productName: 'Shock Absorber',
    category: 'suspension',
    basePrice: 4600,
    busModelCompatibility: 'All Models',
    leadTime: 6,
    warranty: 12,
    moq: 4,
    gstRate: 18,
    stockQuantity: 0,
    stockUnit: 'pieces',
    description: 'Suspension damping component',
    imageUrl: 'https://via.placeholder.com/300x200.png?text=Shock+Absorber'
  },
  {
    productCode: 'TYR-050',
    productName: 'Radial Tyre 295/80 R22.5',
    category: 'tires',
    basePrice: 19800,
    busModelCompatibility: 'Heavy Bus',
    leadTime: 8,
    warranty: 24,
    moq: 2,
    gstRate: 28,
    stockQuantity: 0,
    stockUnit: 'pieces',
    description: 'Tubeless radial bus tyre',
    imageUrl: 'https://via.placeholder.com/300x200.png?text=Bus+Tyre'
  },
  {
    productCode: 'AC-060',
    productName: 'AC Compressor',
    category: 'bus_parts',
    basePrice: 28900,
    busModelCompatibility: 'AC Bus',
    leadTime: 12,
    warranty: 12,
    moq: 1,
    gstRate: 18,
    stockQuantity: 0,
    stockUnit: 'pieces',
    description: 'Air conditioning compressor',
    imageUrl: 'https://via.placeholder.com/300x200.png?text=AC+Compressor'
  },
  {
    productCode: 'ELC-030',
    productName: 'Battery 12V 150Ah',
    category: 'battery',
    basePrice: 15800,
    busModelCompatibility: 'All Models',
    leadTime: 5,
    warranty: 18,
    moq: 2,
    gstRate: 18,
    stockQuantity: 0,
    stockUnit: 'pieces',
    description: 'Heavy duty bus battery',
    imageUrl: 'https://via.placeholder.com/300x200.png?text=Bus+Battery'
  }
];

async function addVendorProducts() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find vendor user (try multiple ways)
    let vendor = await Vendor.findOne({ 
      $or: [
        { email: 'vendor@yatrik.com' },
        { companyName: { $regex: /vendor/i } }
      ]
    });

    // If no vendor found, try to find by user
    if (!vendor) {
      const vendorUser = await User.findOne({ 
        role: 'vendor' 
      }).populate('vendorId');
      
      if (vendorUser && vendorUser.vendorId) {
        vendor = vendorUser.vendorId;
      }
    }

    // If still no vendor, get the first vendor
    if (!vendor) {
      vendor = await Vendor.findOne();
    }

    if (!vendor) {
      console.log('❌ No vendor found!');
      console.log('💡 Please create a vendor first');
      process.exit(1);
    }

    console.log(`✅ Found vendor: ${vendor.companyName} (${vendor.email || 'N/A'})\n`);
    console.log('📦 Adding spare parts products...\n');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const partData of sparePartsData) {
      try {
        // Check if product already exists
        let product = await Product.findOne({ productCode: partData.productCode });

        if (product) {
          // Update existing product
          product.productName = partData.productName;
          product.category = partData.category;
          product.basePrice = partData.basePrice;
          product.finalPrice = partData.basePrice;
          product.taxRate = partData.gstRate;
          product.description = partData.description;
          product.stock.quantity = partData.stockQuantity;
          product.stock.unit = partData.stockUnit;
          
          // Add compatible vehicle info
          if (partData.busModelCompatibility) {
            product.compatibleWith = [{
              vehicleMake: partData.busModelCompatibility.split(' ')[0] || 'All',
              vehicleModel: partData.busModelCompatibility,
              year: '2020-2024'
            }];
          }

          // Add image
          if (partData.imageUrl) {
            product.images = [{
              url: partData.imageUrl,
              isPrimary: true,
              alt: partData.productName
            }];
          }

          // Add specifications
          if (!product.specifications) {
            product.specifications = new Map();
          }
          if (partData.leadTime) product.specifications.set('leadTime', partData.leadTime.toString());
          if (partData.moq) product.specifications.set('moq', partData.moq.toString());
          if (partData.busModelCompatibility) product.specifications.set('busModelCompatibility', partData.busModelCompatibility);
          if (partData.warranty) {
            product.specifications.set('warrantyMonths', partData.warranty.toString());
            product.specifications.set('warrantyType', 'manufacturer');
          }

          product.status = 'active';
          product.isActive = true;
          product.approvalStatus = {
            status: 'approved',
            reviewedAt: new Date()
          };

          await product.save();
          updated++;
          console.log(`   ✅ Updated: ${partData.productName} (${partData.productCode})`);
        } else {
          // Create new product
          const specs = new Map();
          if (partData.leadTime) specs.set('leadTime', partData.leadTime.toString());
          if (partData.moq) specs.set('moq', partData.moq.toString());
          if (partData.busModelCompatibility) specs.set('busModelCompatibility', partData.busModelCompatibility);
          if (partData.warranty) {
            specs.set('warrantyMonths', partData.warranty.toString());
            specs.set('warrantyType', 'manufacturer');
          }

          product = new Product({
            productCode: partData.productCode,
            productName: partData.productName,
            description: partData.description,
            vendorId: vendor._id,
            vendorName: vendor.companyName,
            vendorCompany: vendor.companyName,
            category: partData.category,
            basePrice: partData.basePrice,
            finalPrice: partData.basePrice,
            taxRate: partData.gstRate,
            stock: {
              quantity: partData.stockQuantity,
              unit: partData.stockUnit,
              minQuantity: partData.moq || 1
            },
            images: partData.imageUrl ? [{
              url: partData.imageUrl,
              isPrimary: true,
              alt: partData.productName
            }] : [],
            compatibleWith: partData.busModelCompatibility ? [{
              vehicleMake: partData.busModelCompatibility.split(' ')[0] || 'All',
              vehicleModel: partData.busModelCompatibility,
              year: '2020-2024'
            }] : [],
            specifications: specs,
            status: 'active',
            isActive: true,
            approvalStatus: {
              status: 'approved',
              reviewedAt: new Date()
            }
          });

          await product.save();
          created++;
          console.log(`   ✅ Created: ${partData.productName} (${partData.productCode})`);
        }
      } catch (error) {
        console.error(`   ❌ Error with ${partData.productName}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   Created: ${created} products`);
    console.log(`   Updated: ${updated} products`);
    console.log(`   Skipped: ${skipped} products`);
    console.log(`   Total: ${created + updated + skipped} products`);
    console.log('='.repeat(50));

    // Count total products for this vendor
    const vendorProductsCount = await Product.countDocuments({
      vendorId: vendor._id
    });
    console.log(`\n✅ Total products for vendor: ${vendorProductsCount}`);

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

addVendorProducts();

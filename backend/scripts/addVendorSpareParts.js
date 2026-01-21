/**
 * Add Sample Spare Parts for Vendor
 * Creates spare parts and links them to the vendor
 */

const mongoose = require('mongoose');
require('dotenv').config();

const SparePart = require('../models/SparePart');
const Vendor = require('../models/Vendor');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';

const sampleSpareParts = [
  {
    partName: 'Engine Oil Filter',
    partNumber: 'SP-ENG-OIL-FIL-001',
    description: 'High-quality engine oil filter for bus engines. Compatible with Tata and Ashok Leyland buses.',
    category: 'filters',
    subCategory: 'oil_filter',
    basePrice: 450,
    stock: {
      current: 150,
      minimum: 20,
      maximum: 500,
      unit: 'units'
    },
    compatibleVehicles: [
      { make: 'Tata', model: 'Leyland', year: '2020-2024', busType: 'AC' },
      { make: 'Ashok Leyland', model: 'Marcopolo', year: '2020-2024', busType: 'Non-AC' }
    ],
    specifications: {
      brand: 'Mahle',
      manufacturer: 'Mahle Filters',
      weight: 0.5,
      dimensions: { length: 10, width: 10, height: 12, unit: 'cm' },
      material: 'Synthetic Fiber',
      warranty: { period: 12, type: 'manufacturer' }
    },
    status: 'active',
    isActive: true
  },
  {
    partName: 'Brake Pad Set (Front)',
    partNumber: 'SP-BRK-PAD-FR-001',
    description: 'Premium brake pad set for front wheels. High friction coefficient for better stopping power.',
    category: 'brakes',
    subCategory: 'brake_pads',
    basePrice: 2800,
    stock: {
      current: 80,
      minimum: 15,
      maximum: 200,
      unit: 'units'
    },
    compatibleVehicles: [
      { make: 'Tata', model: 'Leyland', year: '2018-2024', busType: 'AC' },
      { make: 'Ashok Leyland', model: 'Marcopolo', year: '2018-2024', busType: 'Non-AC' }
    ],
    specifications: {
      brand: 'Bosch',
      manufacturer: 'Bosch Auto Parts',
      weight: 2.5,
      dimensions: { length: 15, width: 8, height: 3, unit: 'cm' },
      material: 'Ceramic Composite',
      warranty: { period: 6, type: 'manufacturer' }
    },
    status: 'active',
    isActive: true
  },
  {
    partName: 'Air Filter Element',
    partNumber: 'SP-AIR-FIL-001',
    description: 'Heavy-duty air filter for bus engines. Provides excellent filtration and airflow.',
    category: 'filters',
    subCategory: 'air_filter',
    basePrice: 1200,
    stock: {
      current: 95,
      minimum: 25,
      maximum: 300,
      unit: 'units'
    },
    compatibleVehicles: [
      { make: 'Tata', model: 'Leyland', year: '2020-2024', busType: 'AC' },
      { make: 'Ashok Leyland', model: 'Marcopolo', year: '2020-2024', busType: 'Non-AC' }
    ],
    specifications: {
      brand: 'Mann Filter',
      manufacturer: 'Mann+Hummel',
      weight: 1.2,
      dimensions: { length: 25, width: 20, height: 5, unit: 'cm' },
      material: 'Paper & Foam',
      warranty: { period: 12, type: 'manufacturer' }
    },
    status: 'active',
    isActive: true
  },
  {
    partName: 'Shock Absorber (Front)',
    partNumber: 'SP-SUS-SHK-FR-001',
    description: 'Heavy-duty front shock absorber for bus suspension. Provides smooth ride quality.',
    category: 'suspension',
    subCategory: 'shock_absorber',
    basePrice: 4500,
    stock: {
      current: 45,
      minimum: 10,
      maximum: 100,
      unit: 'units'
    },
    compatibleVehicles: [
      { make: 'Tata', model: 'Leyland', year: '2019-2024', busType: 'AC' },
      { make: 'Ashok Leyland', model: 'Marcopolo', year: '2019-2024', busType: 'Non-AC' }
    ],
    specifications: {
      brand: 'Gabriel',
      manufacturer: 'Gabriel India',
      weight: 8.5,
      dimensions: { length: 45, width: 12, height: 12, unit: 'cm' },
      material: 'Steel & Hydraulic Fluid',
      warranty: { period: 24, type: 'manufacturer' }
    },
    status: 'active',
    isActive: true
  },
  {
    partName: 'Battery 12V 180Ah',
    partNumber: 'SP-BAT-12V-180AH',
    description: 'Heavy-duty 12V 180Ah battery for bus electrical systems. Maintenance-free design.',
    category: 'battery',
    subCategory: 'lead_acid',
    basePrice: 8500,
    stock: {
      current: 35,
      minimum: 8,
      maximum: 80,
      unit: 'units'
    },
    compatibleVehicles: [
      { make: 'Tata', model: 'Leyland', year: '2020-2024', busType: 'AC' },
      { make: 'Ashok Leyland', model: 'Marcopolo', year: '2020-2024', busType: 'Non-AC' }
    ],
    specifications: {
      brand: 'Exide',
      manufacturer: 'Exide Industries',
      weight: 45,
      dimensions: { length: 52, width: 20, height: 24, unit: 'cm' },
      material: 'Lead-Acid',
      warranty: { period: 36, type: 'manufacturer' }
    },
    status: 'active',
    isActive: true
  },
  {
    partName: 'Headlight Assembly (LED)',
    partNumber: 'SP-LGT-HDL-LED-001',
    description: 'LED headlight assembly with high beam and low beam. Energy efficient and bright.',
    category: 'lights',
    subCategory: 'headlight',
    basePrice: 3200,
    stock: {
      current: 60,
      minimum: 12,
      maximum: 150,
      unit: 'units'
    },
    compatibleVehicles: [
      { make: 'Tata', model: 'Leyland', year: '2021-2024', busType: 'AC' },
      { make: 'Ashok Leyland', model: 'Marcopolo', year: '2021-2024', busType: 'Non-AC' }
    ],
    specifications: {
      brand: 'Osram',
      manufacturer: 'Osram Automotive',
      weight: 1.8,
      dimensions: { length: 30, width: 20, height: 15, unit: 'cm' },
      material: 'Plastic & LED',
      warranty: { period: 24, type: 'manufacturer' }
    },
    status: 'active',
    isActive: true
  },
  {
    partName: 'Radiator Coolant (5L)',
    partNumber: 'SP-FLU-COOL-5L',
    description: 'Premium engine coolant concentrate. Prevents freezing and overheating.',
    category: 'fluids',
    subCategory: 'coolant',
    basePrice: 650,
    stock: {
      current: 200,
      minimum: 50,
      maximum: 500,
      unit: 'liters'
    },
    compatibleVehicles: [
      { make: 'Tata', model: 'Leyland', year: '2018-2024', busType: 'AC' },
      { make: 'Ashok Leyland', model: 'Marcopolo', year: '2018-2024', busType: 'Non-AC' }
    ],
    specifications: {
      brand: 'Castrol',
      manufacturer: 'Castrol India',
      weight: 5.5,
      dimensions: { length: 20, width: 15, height: 25, unit: 'cm' },
      material: 'Ethylene Glycol',
      warranty: { period: 12, type: 'manufacturer' }
    },
    status: 'active',
    isActive: true
  },
  {
    partName: 'Timing Belt Kit',
    partNumber: 'SP-BELT-TIM-001',
    description: 'Complete timing belt kit with tensioner and idler pulleys. OEM quality.',
    category: 'belts',
    subCategory: 'timing_belt',
    basePrice: 5500,
    stock: {
      current: 25,
      minimum: 5,
      maximum: 60,
      unit: 'units'
    },
    compatibleVehicles: [
      { make: 'Tata', model: 'Leyland', year: '2019-2024', busType: 'AC' },
      { make: 'Ashok Leyland', model: 'Marcopolo', year: '2019-2024', busType: 'Non-AC' }
    ],
    specifications: {
      brand: 'Gates',
      manufacturer: 'Gates Corporation',
      weight: 3.2,
      dimensions: { length: 120, width: 3, height: 1, unit: 'cm' },
      material: 'Reinforced Rubber',
      warranty: { period: 12, type: 'manufacturer' }
    },
    status: 'active',
    isActive: true
  },
  {
    partName: 'Windshield Wiper Blade Set',
    partNumber: 'SP-WIP-BLD-SET-001',
    description: 'Premium wiper blade set for front windshield. All-weather performance.',
    category: 'wipers',
    subCategory: 'wiper_blades',
    basePrice: 850,
    stock: {
      current: 120,
      minimum: 30,
      maximum: 300,
      unit: 'units'
    },
    compatibleVehicles: [
      { make: 'Tata', model: 'Leyland', year: '2020-2024', busType: 'AC' },
      { make: 'Ashok Leyland', model: 'Marcopolo', year: '2020-2024', busType: 'Non-AC' }
    ],
    specifications: {
      brand: 'Bosch',
      manufacturer: 'Bosch Auto Parts',
      weight: 0.3,
      dimensions: { length: 60, width: 2, height: 1, unit: 'cm' },
      material: 'Rubber & Steel',
      warranty: { period: 6, type: 'manufacturer' }
    },
    status: 'active',
    isActive: true
  },
  {
    partName: 'Fuel Filter',
    partNumber: 'SP-FUEL-FIL-001',
    description: 'High-efficiency fuel filter for diesel engines. Removes water and contaminants.',
    category: 'filters',
    subCategory: 'fuel_filter',
    basePrice: 950,
    stock: {
      current: 110,
      minimum: 25,
      maximum: 250,
      unit: 'units'
    },
    compatibleVehicles: [
      { make: 'Tata', model: 'Leyland', year: '2020-2024', busType: 'AC' },
      { make: 'Ashok Leyland', model: 'Marcopolo', year: '2020-2024', busType: 'Non-AC' }
    ],
    specifications: {
      brand: 'Mahle',
      manufacturer: 'Mahle Filters',
      weight: 0.8,
      dimensions: { length: 15, width: 10, height: 10, unit: 'cm' },
      material: 'Paper & Metal',
      warranty: { period: 12, type: 'manufacturer' }
    },
    status: 'active',
    isActive: true
  },
  {
    partName: 'Clutch Plate Set',
    partNumber: 'SP-CLT-PLT-SET-001',
    description: 'Heavy-duty clutch plate set for bus transmission. High torque capacity.',
    category: 'transmission',
    subCategory: 'clutch',
    basePrice: 6800,
    stock: {
      current: 18,
      minimum: 5,
      maximum: 40,
      unit: 'units'
    },
    compatibleVehicles: [
      { make: 'Tata', model: 'Leyland', year: '2018-2024', busType: 'AC' },
      { make: 'Ashok Leyland', model: 'Marcopolo', year: '2018-2024', busType: 'Non-AC' }
    ],
    specifications: {
      brand: 'Luk',
      manufacturer: 'Schaeffler India',
      weight: 12,
      dimensions: { length: 30, width: 30, height: 5, unit: 'cm' },
      material: 'Friction Material & Steel',
      warranty: { period: 12, type: 'manufacturer' }
    },
    status: 'active',
    isActive: true
  },
  {
    partName: 'Alternator Belt',
    partNumber: 'SP-BELT-ALT-001',
    description: 'V-ribbed alternator belt. High durability and performance.',
    category: 'belts',
    subCategory: 'alternator_belt',
    basePrice: 450,
    stock: {
      current: 140,
      minimum: 35,
      maximum: 350,
      unit: 'units'
    },
    compatibleVehicles: [
      { make: 'Tata', model: 'Leyland', year: '2019-2024', busType: 'AC' },
      { make: 'Ashok Leyland', model: 'Marcopolo', year: '2019-2024', busType: 'Non-AC' }
    ],
    specifications: {
      brand: 'Gates',
      manufacturer: 'Gates Corporation',
      weight: 0.5,
      dimensions: { length: 90, width: 1.5, height: 0.8, unit: 'cm' },
      material: 'Reinforced Rubber',
      warranty: { period: 12, type: 'manufacturer' }
    },
    status: 'active',
    isActive: true
  },
  {
    partName: 'Side Mirror Assembly',
    partNumber: 'SP-MIR-SIDE-001',
    description: 'Heavy-duty side mirror assembly with electric adjustment. Shatterproof glass.',
    category: 'mirrors',
    subCategory: 'side_mirror',
    basePrice: 2200,
    stock: {
      current: 55,
      minimum: 15,
      maximum: 120,
      unit: 'units'
    },
    compatibleVehicles: [
      { make: 'Tata', model: 'Leyland', year: '2020-2024', busType: 'AC' },
      { make: 'Ashok Leyland', model: 'Marcopolo', year: '2020-2024', busType: 'Non-AC' }
    ],
    specifications: {
      brand: 'Minda',
      manufacturer: 'Minda Industries',
      weight: 2.5,
      dimensions: { length: 25, width: 15, height: 8, unit: 'cm' },
      material: 'Plastic & Glass',
      warranty: { period: 12, type: 'manufacturer' }
    },
    status: 'active',
    isActive: true
  },
  {
    partName: 'Brake Fluid (1L)',
    partNumber: 'SP-FLU-BRK-1L',
    description: 'DOT 4 brake fluid. High boiling point for reliable braking performance.',
    category: 'fluids',
    subCategory: 'brake_fluid',
    basePrice: 350,
    stock: {
      current: 180,
      minimum: 40,
      maximum: 400,
      unit: 'liters'
    },
    compatibleVehicles: [
      { make: 'Tata', model: 'Leyland', year: '2018-2024', busType: 'AC' },
      { make: 'Ashok Leyland', model: 'Marcopolo', year: '2018-2024', busType: 'Non-AC' }
    ],
    specifications: {
      brand: 'Bosch',
      manufacturer: 'Bosch Auto Parts',
      weight: 1.1,
      dimensions: { length: 10, width: 8, height: 15, unit: 'cm' },
      material: 'Glycol Ether',
      warranty: { period: 24, type: 'manufacturer' }
    },
    status: 'active',
    isActive: true
  },
  {
    partName: 'Transmission Oil (5L)',
    partNumber: 'SP-FLU-TRN-5L',
    description: 'Premium transmission fluid for manual gearboxes. Reduces wear and smooth shifting.',
    category: 'fluids',
    subCategory: 'transmission_fluid',
    basePrice: 1200,
    stock: {
      current: 90,
      minimum: 20,
      maximum: 200,
      unit: 'liters'
    },
    compatibleVehicles: [
      { make: 'Tata', model: 'Leyland', year: '2019-2024', busType: 'AC' },
      { make: 'Ashok Leyland', model: 'Marcopolo', year: '2019-2024', busType: 'Non-AC' }
    ],
    specifications: {
      brand: 'Castrol',
      manufacturer: 'Castrol India',
      weight: 5.2,
      dimensions: { length: 20, width: 15, height: 25, unit: 'cm' },
      material: 'Mineral Oil',
      warranty: { period: 12, type: 'manufacturer' }
    },
    status: 'active',
    isActive: true
  }
];

async function addVendorSpareParts() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the vendor
    const vendor = await Vendor.findOne({ email: 'vendor@yatrik.com' });
    if (!vendor) {
      console.log('❌ Vendor not found!');
      console.log('💡 Please create vendor first: node scripts/createDemoUsers.js');
      process.exit(1);
    }

    console.log(`✅ Found vendor: ${vendor.companyName} (${vendor.email})\n`);
    console.log('📦 Adding spare parts...\n');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const partData of sampleSpareParts) {
      try {
        // Check if part already exists
        let sparePart = await SparePart.findOne({ partNumber: partData.partNumber });

        if (sparePart) {
          // Update existing part - add vendor to preferred vendors if not already there
          const vendorExists = sparePart.preferredVendors.some(
            v => v.vendorId && v.vendorId.toString() === vendor._id.toString()
          );

          if (!vendorExists) {
            sparePart.preferredVendors.push({
              vendorId: vendor._id,
              vendorName: vendor.companyName,
              price: partData.basePrice,
              leadTime: 7,
              rating: 4.5
            });
            await sparePart.save();
            updated++;
            console.log(`   ✅ Updated: ${partData.partName} (added vendor)`);
          } else {
            skipped++;
            console.log(`   ⏭️  Skipped: ${partData.partName} (already linked)`);
          }
        } else {
          // Create new part with vendor
          sparePart = new SparePart({
            ...partData,
            preferredVendors: [{
              vendorId: vendor._id,
              vendorName: vendor.companyName,
              price: partData.basePrice,
              leadTime: 7,
              rating: 4.5
            }]
          });
          await sparePart.save();
          created++;
          console.log(`   ✅ Created: ${partData.partName} (${partData.partNumber})`);
        }
      } catch (error) {
        console.error(`   ❌ Error with ${partData.partName}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   Created: ${created} spare parts`);
    console.log(`   Updated: ${updated} spare parts`);
    console.log(`   Skipped: ${skipped} spare parts`);
    console.log(`   Total: ${created + updated + skipped} spare parts`);
    console.log('='.repeat(50));

    // Count total spare parts for this vendor
    const vendorPartsCount = await SparePart.countDocuments({
      'preferredVendors.vendorId': vendor._id
    });
    console.log(`\n✅ Total spare parts linked to vendor: ${vendorPartsCount}`);

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

addVendorSpareParts();

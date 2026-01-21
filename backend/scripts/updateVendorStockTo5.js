/**
 * Update All Vendor Products Stock to 5 Pieces Each
 * Also recalculates prices based on stock quantity
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';

async function updateVendorStock() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all vendors
    const vendors = await Vendor.find({ status: 'approved' });
    console.log(`✅ Found ${vendors.length} approved vendors\n`);

    let totalUpdated = 0;
    let totalPriceRecalculated = 0;

    for (const vendor of vendors) {
      console.log(`📦 Processing vendor: ${vendor.companyName} (${vendor._id})`);
      
      // Find all active products for this vendor
      const products = await Product.find({ 
        vendorId: vendor._id,
        status: { $in: ['active', 'pending', 'draft'] }
      });

      console.log(`   Found ${products.length} products\n`);

      for (const product of products) {
        const oldStock = product.stock?.quantity || 0;
        const oldPrice = product.finalPrice || product.basePrice || 0;
        
        // Update stock to 5 pieces
        product.stock = product.stock || {};
        product.stock.quantity = 5;
        product.stock.unit = product.stock.unit || 'pieces';
        product.stock.minQuantity = product.stock.minQuantity || 2;
        product.stock.maxQuantity = product.stock.maxQuantity || 100;

        // Auto-calculate price based on stock quantity
        const basePrice = product.basePrice || 0;
        const stockQuantity = product.stock.quantity;
        
        if (stockQuantity > 0) {
          // Apply bulk discount: More stock = lower price per unit
          // Formula: price = basePrice * (1 - (stockQuantity / 1000) * 0.1)
          // Max discount: 10% when stock > 1000 units
          const discountFactor = Math.min(0.1, (stockQuantity / 1000) * 0.1);
          const adjustedPrice = basePrice * (1 - discountFactor);
          
          // Apply scarcity premium: Low stock = higher price
          // If stock < 10, add 5% premium
          if (stockQuantity < 10) {
            product.finalPrice = basePrice * 1.05;
          } else {
            product.finalPrice = Math.max(basePrice * 0.9, adjustedPrice); // Min 90% of base price
          }
          
          // Update vendor price (for purchase orders)
          product.vendorPrice = product.finalPrice;
        } else {
          // Out of stock - keep original price
          product.finalPrice = basePrice;
          product.vendorPrice = basePrice;
        }

        // Update status based on stock
        if (product.stock.quantity > 0 && product.status === 'out_of_stock') {
          product.status = 'active';
        }

        await product.save();
        totalUpdated++;
        
        if (oldPrice !== product.finalPrice) {
          totalPriceRecalculated++;
          console.log(`   ✅ ${product.productCode}: Stock ${oldStock} → 5, Price ₹${oldPrice.toFixed(2)} → ₹${product.finalPrice.toFixed(2)}`);
        } else {
          console.log(`   ✅ ${product.productCode}: Stock ${oldStock} → 5, Price ₹${product.finalPrice.toFixed(2)} (unchanged)`);
        }
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ STOCK UPDATE COMPLETE!');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`📊 Summary:`);
    console.log(`   • Products Updated: ${totalUpdated}`);
    console.log(`   • Prices Recalculated: ${totalPriceRecalculated}`);
    console.log(`   • All products now have 5 pieces stock\n`);

    await mongoose.disconnect();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

updateVendorStock();

const mongoose = require('mongoose');
require('dotenv').config();

// Test script to verify invoice PDF download functionality
async function testInvoicePDFDownload() {
  try {
    console.log('🧪 Testing Invoice PDF Download Functionality');
    console.log('='.repeat(50));

    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Import models
    const User = require('./models/User');
    
    // Create Invoice model (same as in create-sample-invoices.js)
    const invoiceSchema = new mongoose.Schema({
      invoiceNumber: { type: String, required: true, unique: true },
      poNumber: String,
      vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      date: { type: Date, default: Date.now },
      dueDate: Date,
      amount: { type: Number, required: true },
      subtotal: Number,
      taxAmount: Number,
      taxRate: { type: Number, default: 18 },
      status: { 
        type: String, 
        enum: ['pending', 'submitted', 'approved', 'paid', 'rejected'], 
        default: 'pending' 
      },
      items: [{
        description: String,
        productName: String,
        productCode: String,
        quantity: { type: Number, default: 1 },
        unitPrice: Number,
        price: Number
      }],
      notes: String,
      paymentStatus: String,
      paymentDate: Date,
      paymentMethod: String,
      clientName: String,
      clientAddress: String,
      clientEmail: String,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    const Invoice = mongoose.model('Invoice', invoiceSchema);

    // Find vendor user
    const vendorUser = await User.findOne({ role: 'vendor' });
    if (!vendorUser) {
      console.error('❌ No vendor user found. Please run create-sample-invoices.js first');
      return;
    }

    console.log('👤 Found vendor user:', {
      name: vendorUser.name,
      email: vendorUser.email,
      companyName: vendorUser.companyName
    });

    // Find invoices for this vendor
    const invoices = await Invoice.find({ vendorId: vendorUser._id }).sort({ createdAt: -1 });
    
    if (invoices.length === 0) {
      console.error('❌ No invoices found. Please run create-sample-invoices.js first');
      return;
    }

    console.log(`📄 Found ${invoices.length} invoices for vendor`);

    // Test each invoice
    for (let i = 0; i < invoices.length; i++) {
      const invoice = invoices[i];
      console.log(`\n📋 Testing Invoice ${i + 1}/${invoices.length}:`);
      console.log(`   Invoice Number: ${invoice.invoiceNumber}`);
      console.log(`   Status: ${invoice.status}`);
      console.log(`   Amount: ₹${invoice.amount?.toLocaleString('en-IN') || 0}`);
      console.log(`   Items: ${invoice.items?.length || 0}`);
      console.log(`   Date: ${new Date(invoice.date || invoice.createdAt).toLocaleDateString('en-IN')}`);
      
      // Verify required fields for PDF generation
      const requiredFields = {
        'Invoice Number': invoice.invoiceNumber,
        'Amount': invoice.amount,
        'Date': invoice.date || invoice.createdAt,
        'Status': invoice.status
      };

      let allFieldsPresent = true;
      for (const [field, value] of Object.entries(requiredFields)) {
        if (!value) {
          console.warn(`   ⚠️  Missing ${field}`);
          allFieldsPresent = false;
        } else {
          console.log(`   ✅ ${field}: ${value}`);
        }
      }

      if (allFieldsPresent) {
        console.log('   🎯 Invoice is ready for PDF generation');
      } else {
        console.log('   ❌ Invoice has missing fields - PDF generation may fail');
      }

      // Test items formatting
      if (invoice.items && invoice.items.length > 0) {
        console.log('   📦 Items breakdown:');
        invoice.items.forEach((item, idx) => {
          const itemTotal = (item.quantity || 1) * (item.unitPrice || item.price || 0);
          console.log(`      ${idx + 1}. ${item.description || item.productName || 'Item'}`);
          console.log(`         Qty: ${item.quantity || 1} × ₹${(item.unitPrice || item.price || 0).toLocaleString('en-IN')} = ₹${itemTotal.toLocaleString('en-IN')}`);
        });
      }

      // Test currency formatting
      const formattedAmount = (invoice.amount || 0).toLocaleString('en-IN');
      console.log(`   💰 Formatted Amount: ₹${formattedAmount}`);
    }

    // Test PDF filename generation
    console.log('\n📁 Testing PDF filename generation:');
    invoices.forEach((invoice, idx) => {
      const filename = `Invoice_${invoice.invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
      console.log(`   ${idx + 1}. ${filename}`);
    });

    // Test vendor information for PDF
    console.log('\n🏢 Vendor information for PDF:');
    console.log(`   Company Name: ${vendorUser.companyName || 'N/A'}`);
    console.log(`   Email: ${vendorUser.email || 'N/A'}`);
    console.log(`   Phone: ${vendorUser.phone || 'N/A'}`);

    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`   ✅ MongoDB Connection: Working`);
    console.log(`   ✅ Vendor User: Found (${vendorUser.email})`);
    console.log(`   ✅ Invoices: ${invoices.length} found`);
    console.log(`   ✅ PDF Generation: Ready to test in browser`);

    console.log('\n🎯 Next Steps:');
    console.log('1. Start the frontend development server');
    console.log('2. Login as vendor with email:', vendorUser.email);
    console.log('3. Go to "Invoice & Billing" tab');
    console.log('4. Click "View" on any invoice');
    console.log('5. Click "Download PDF" button');
    console.log('6. Verify PDF downloads with proper formatting');

    console.log('\n🔧 If PDF generation fails:');
    console.log('- Check browser console for html2pdf.js errors');
    console.log('- Verify html2pdf.js is installed in frontend');
    console.log('- Check if fallback text download works');

  } catch (error) {
    console.error('❌ Error testing invoice PDF download:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testInvoicePDFDownload();
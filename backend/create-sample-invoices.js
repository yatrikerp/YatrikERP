const mongoose = require('mongoose');
require('dotenv').config();

// Create a simple Invoice model for testing
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
const User = require('./models/User');

async function createSampleInvoices() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a vendor user
    let vendorUser = await User.findOne({ role: 'vendor' });
    if (!vendorUser) {
      console.log('📝 Creating sample vendor user...');
      vendorUser = new User({
        name: 'TATA Motors',
        email: 'tata.motors@example.com',
        phone: '+91-9876543210',
        role: 'vendor',
        companyName: 'TATA Motors Ltd',
        password: 'hashedpassword123',
        isActive: true
      });
      await vendorUser.save();
      console.log('✅ Sample vendor user created');
    }

    // Create sample invoices
    const sampleInvoices = [
      {
        invoiceNumber: 'INV-17869380367-0',
        poNumber: 'PO-17869380367-1',
        vendorId: vendorUser._id,
        date: new Date('2024-12-01'),
        dueDate: new Date('2024-12-31'),
        amount: 50000,
        subtotal: 42373,
        taxAmount: 7627,
        taxRate: 18,
        status: 'paid',
        paymentStatus: 'paid',
        paymentDate: new Date('2024-12-15'),
        paymentMethod: 'Bank Transfer',
        clientName: 'YATRIK ERP',
        clientAddress: 'Kochi, Kerala, India',
        clientEmail: 'admin@yatrikerp.com',
        items: [
          {
            description: 'Bus Engine Parts',
            productName: 'Engine Oil Filter',
            productCode: 'EOF-001',
            quantity: 10,
            unitPrice: 2500,
            price: 2500
          },
          {
            description: 'Brake System Components',
            productName: 'Brake Pads Set',
            productCode: 'BPS-002',
            quantity: 5,
            unitPrice: 3500,
            price: 3500
          }
        ],
        notes: 'Payment received on time. Thank you for your business.'
      },
      {
        invoiceNumber: 'INV-17869380295-1',
        poNumber: 'PO-17869380295-2',
        vendorId: vendorUser._id,
        date: new Date('2024-11-15'),
        dueDate: new Date('2024-12-15'),
        amount: 75000,
        subtotal: 63559,
        taxAmount: 11441,
        taxRate: 18,
        status: 'approved',
        paymentStatus: 'pending',
        clientName: 'YATRIK ERP',
        clientAddress: 'Kochi, Kerala, India',
        clientEmail: 'admin@yatrikerp.com',
        items: [
          {
            description: 'Air Conditioning System',
            productName: 'AC Compressor',
            productCode: 'ACC-003',
            quantity: 2,
            unitPrice: 15000,
            price: 15000
          },
          {
            description: 'Electrical Components',
            productName: 'LED Headlight Assembly',
            productCode: 'LHA-004',
            quantity: 4,
            unitPrice: 8500,
            price: 8500
          }
        ],
        notes: 'Invoice approved. Awaiting payment processing.'
      },
      {
        invoiceNumber: 'INV-17869380137-2',
        poNumber: 'PO-17869380137-2',
        vendorId: vendorUser._id,
        date: new Date(),
        amount: 30000,
        subtotal: 25424,
        taxAmount: 4576,
        taxRate: 18,
        status: 'pending',
        paymentStatus: 'pending',
        clientName: 'YATRIK ERP',
        clientAddress: 'Kochi, Kerala, India',
        clientEmail: 'admin@yatrikerp.com',
        items: [
          {
            description: 'Tire and Wheel Services',
            productName: 'Heavy Duty Bus Tires',
            productCode: 'HDT-005',
            quantity: 6,
            unitPrice: 4000,
            price: 4000
          }
        ],
        notes: 'New invoice submitted for review.'
      }
    ];

    // Clear existing invoices for this vendor
    await Invoice.deleteMany({ vendorId: vendorUser._id });
    console.log('🗑️ Cleared existing invoices');

    // Create new invoices
    const createdInvoices = [];
    for (const invoiceData of sampleInvoices) {
      const invoice = new Invoice(invoiceData);
      await invoice.save();
      createdInvoices.push(invoice);
      console.log(`✅ Created invoice ${invoice.invoiceNumber} - ${invoice.status}`);
    }

    console.log(`\n🎯 Summary:`);
    console.log(`- Created ${createdInvoices.length} sample invoices`);
    console.log(`- Vendor: ${vendorUser.companyName} (${vendorUser.email})`);
    console.log(`- Invoice Numbers: ${createdInvoices.map(inv => inv.invoiceNumber).join(', ')}`);
    
    console.log('\n📱 Test the vendor dashboard:');
    console.log('1. Login as vendor with email:', vendorUser.email);
    console.log('2. Go to "Invoice & Billing" tab');
    console.log('3. Click "View" button on any invoice');
    console.log('4. Verify detailed invoice modal opens');

    console.log('\n🔗 API Endpoints to test:');
    console.log('- GET /api/vendor/invoices');
    console.log('- GET /api/vendor/invoices/:id');

  } catch (error) {
    console.error('❌ Error creating sample invoices:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createSampleInvoices();
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  // Invoice Identification
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  
  // Parties
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },
  vendorName: {
    type: String,
    required: true
  },
  vendorGST: String,
  vendorPAN: String,
  vendorAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  
  // Buyer (Depot/Admin)
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Depot',
    required: true
  },
  buyerName: String,
  buyerGST: String,
  buyerAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  
  // Linked Purchase Order
  purchaseOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    required: true,
    index: true
  },
  poNumber: {
    type: String,
    required: true
  },
  
  // Line Items (copied from PO)
  items: [{
    partNumber: String,
    partName: String,
    description: String,
    quantity: Number,
    unit: String,
    unitPrice: Number,
    totalPrice: Number,
    hsnCode: String,
    taxRate: Number
  }],
  
  // Financial Details
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    cgst: {
      type: Number,
      default: 0,
      min: 0
    },
    sgst: {
      type: Number,
      default: 0,
      min: 0
    },
    igst: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  shippingCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  amountInWords: String,
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Invoice Dates
  invoiceDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  dueDate: Date,
  
  // Status & Workflow
  status: {
    type: String,
    enum: ['draft', 'generated', 'sent', 'approved', 'rejected', 'paid', 'cancelled'],
    default: 'draft',
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: Date,
  rejectionReason: String,
  
  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending',
    index: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  dueAmount: {
    type: Number,
    default: 0
  },
  paymentDate: Date,
  paymentMethod: String,
  transactionId: String,
  
  // Documents
  pdfUrl: String,
  ewayBill: String,
  
  // Notes
  notes: String,
  termsAndConditions: String,
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ vendorId: 1, status: 1 });
invoiceSchema.index({ purchaseOrderId: 1 });
invoiceSchema.index({ status: 1, invoiceDate: -1 });
invoiceSchema.index({ paymentStatus: 1 });

// Pre-save hook to generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    const year = new Date().getFullYear();
    this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  
  // Calculate due amount
  this.dueAmount = this.totalAmount - (this.paidAmount || 0);
  
  // Update payment status
  if (this.dueAmount <= 0 && this.totalAmount > 0) {
    this.paymentStatus = 'paid';
  } else if (this.paidAmount > 0 && this.dueAmount > 0) {
    this.paymentStatus = 'partial';
  } else if (this.dueDate && new Date() > this.dueDate && this.dueAmount > 0) {
    this.paymentStatus = 'overdue';
  }
  
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);

const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  // PO Identification
  poNumber: {
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
    required: [true, 'Vendor is required'],
    index: true
  },
  vendorName: {
    type: String,
    required: true
  },
  vendorEmail: String,
  vendorPhone: String,
  
  // Requester (Admin or Depot)
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedByName: String,
  depotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Depot',
    index: true
  },
  depotName: String,
  
  // Line Items
  items: [{
    sparePartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SparePart',
      required: true
    },
    partNumber: {
      type: String,
      required: true
    },
    partName: {
      type: String,
      required: true
    },
    description: String,
    category: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unit: {
      type: String,
      default: 'units'
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    image: String, // Primary image URL
    specifications: mongoose.Schema.Types.Mixed
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
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Status & Workflow
  status: {
    type: String,
    enum: [
      'draft',           // Created but not sent
      'pending_approval', // Awaiting admin approval (for large orders)
      'approved',        // Admin approved, ready to send to vendor
      'pending',         // Sent to vendor, awaiting response
      'accepted',        // Vendor accepted
      'rejected',        // Vendor rejected
      'in_progress',     // Vendor processing
      'partially_delivered',
      'delivered',       // All items delivered
      'completed',       // PO completed and closed
      'cancelled'        // Cancelled by admin/depot
    ],
    default: 'draft',
    index: true
  },
  
  // Approval threshold (orders above this amount require admin approval)
  requiresApproval: {
    type: Boolean,
    default: false
  },
  approvalThreshold: {
    type: Number,
    default: 50000 // ₹50,000 - orders above this require approval
  },
  
  // Dates
  orderDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  acceptedDate: Date,
  rejectedDate: Date,
  cancelledDate: Date,
  
  // Delivery & Tracking
  deliveryAddress: {
    depotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Depot'
    },
    address: String,
    city: String,
    state: String,
    pincode: String,
    contactPerson: String,
    contactPhone: String
  },
  trackingNumber: String,
  shippingMethod: String,
  
  // Vendor Response
  vendorResponse: {
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'counter_offer']
    },
    message: String,
    respondedAt: Date,
    counterOffer: {
      items: [{
        itemIndex: Number,
        proposedPrice: Number,
        proposedQuantity: Number,
        reason: String
      }],
      totalAmount: Number
    }
  },
  
  // Delivery Status
  deliveryStatus: {
    status: {
      type: String,
      enum: ['pending', 'in_transit', 'delivered', 'partial', 'returned']
    },
    items: [{
      itemIndex: Number,
      quantityReceived: Number,
      quantityAccepted: Number,
      quantityRejected: Number,
      rejectionReason: String,
      receivedDate: Date
    }]
  },
  
  // Quality & Inspection
  qualityCheck: {
    status: {
      type: String,
      enum: ['pending', 'passed', 'failed', 'partial']
    },
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checkedAt: Date,
    notes: String,
    issues: [{
      itemIndex: Number,
      issue: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      }
    }]
  },
  
  // Payment & Invoicing
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending'
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  invoiceNumber: String,
  paymentTerms: {
    type: String,
    default: 'Net 30'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  dueAmount: {
    type: Number,
    default: 0
  },
  
  // Documents & Attachments
  documents: [{
    type: {
      type: String,
      enum: ['po', 'invoice', 'delivery_note', 'quality_report', 'other']
    },
    url: String,
    name: String,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Notes & Communication
  notes: String,
  internalNotes: String, // Only visible to admin/depot
  vendorNotes: String,   // Notes from vendor
  
  // Approval Workflow
  approvals: [{
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    level: {
      type: String,
      enum: ['depot_manager', 'admin', 'finance']
    },
    comments: String
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String]
}, {
  timestamps: true
});

// Indexes for performance
purchaseOrderSchema.index({ poNumber: 1 });
purchaseOrderSchema.index({ vendorId: 1, status: 1 });
purchaseOrderSchema.index({ depotId: 1, status: 1 });
purchaseOrderSchema.index({ status: 1, orderDate: -1 });
purchaseOrderSchema.index({ 'items.sparePartId': 1 });

// Pre-save hook to generate PO number
purchaseOrderSchema.pre('save', async function(next) {
  if (!this.poNumber) {
    const count = await mongoose.model('PurchaseOrder').countDocuments();
    const year = new Date().getFullYear();
    this.poNumber = `PO-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  
  // Calculate totals
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    this.totalAmount = this.subtotal + (this.tax?.total || 0) + (this.shippingCharges || 0) - (this.discount || 0);
    this.dueAmount = this.totalAmount - (this.paidAmount || 0);
  }
  
  next();
});

// Method to calculate totals
purchaseOrderSchema.methods.calculateTotals = function() {
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    this.totalAmount = this.subtotal + (this.tax?.total || 0) + (this.shippingCharges || 0) - (this.discount || 0);
    this.dueAmount = this.totalAmount - (this.paidAmount || 0);
  }
};

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);

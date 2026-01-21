const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productCode: String,
  productName: String,
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  vendorName: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  taxRate: Number,
  subtotal: Number,
  taxAmount: Number,
  total: Number,
  image: String
}, { _id: true });

const orderSchema = new mongoose.Schema({
  // Order Identification
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Customer Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  userType: {
    type: String,
    enum: ['vendor', 'depot', 'admin'],
    required: true,
    index: true
  },
  userName: String,
  userEmail: String,
  
  // Order Items
  items: [orderItemSchema],
  
  // Order Summary
  summary: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    shippingCharges: {
      type: Number,
      default: 0,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  
  // Shipping Information
  shippingAddress: {
    name: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    phone: String,
    email: String
  },
  
  // Order Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  
  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'bank_transfer', 'upi', 'card']
  },
  paymentId: String,
  paidAt: Date,
  
  // Shipping Information
  trackingNumber: String,
  shippedAt: Date,
  deliveredAt: Date,
  
  // Cancellation
  cancelledAt: Date,
  cancellationReason: String,
  
  // Notes
  notes: String,
  adminNotes: String
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ userId: 1, userType: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1, paymentStatus: 1 });
orderSchema.index({ 'items.vendorId': 1 });

module.exports = mongoose.model('Order', orderSchema);

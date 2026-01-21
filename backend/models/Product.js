const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Product Identification
  productCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Vendor Information (Seller)
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
  vendorCompany: {
    type: String,
    required: true
  },
  
  // Product Details
  category: {
    type: String,
    required: true,
    enum: [
      'bus_parts', 'engine', 'transmission', 'brakes', 'suspension',
      'electrical', 'body', 'interior', 'exterior', 'tires', 'battery',
      'filters', 'fluids', 'belts', 'hoses', 'lights', 'mirrors', 'wipers',
      'tools', 'equipment', 'consumables', 'other'
    ],
    index: true
  },
  subCategory: String,
  brand: String,
  model: String,
  specifications: {
    type: Map,
    of: String
  },
  
  // Pricing
  basePrice: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  finalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 18, // GST 18%
    min: 0,
    max: 100
  },
  
  // Inventory
  stock: {
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    minQuantity: {
      type: Number,
      default: 10,
      min: 0
    },
    maxQuantity: {
      type: Number,
      default: 1000,
      min: 0
    },
    unit: {
      type: String,
      default: 'units',
      enum: ['units', 'kg', 'liters', 'meters', 'pieces', 'boxes', 'packs']
    }
  },
  
  // Images & Media
  images: [{
    url: {
      type: String,
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    alt: String
  }],
  
  // Product Status
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'inactive', 'out_of_stock', 'discontinued', 'rejected'],
    default: 'draft',
    index: true
  },
  
  // Approval workflow (for vendor-uploaded products)
  approvalStatus: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    rejectionReason: String
  },
  
  // Pricing lock (once approved, price cannot be changed without admin request)
  priceLocked: {
    type: Boolean,
    default: false
  },
  priceLockedAt: Date,
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Shipping & Delivery
  shipping: {
    weight: Number, // in kg
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: 0
    },
    freeShipping: {
      type: Boolean,
      default: false
    },
    estimatedDeliveryDays: {
      type: Number,
      default: 7,
      min: 1
    }
  },
  
  // Ratings & Reviews
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // SEO & Metadata
  keywords: [String],
  tags: [String],
  
  // Sales Metrics
  sales: {
    totalSold: {
      type: Number,
      default: 0,
      min: 0
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0
    },
    views: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Compatibility
  compatibleWith: [{
    vehicleMake: String,
    vehicleModel: String,
    year: String
  }],
  
  // Warranty
  warranty: {
    period: Number, // in months
    type: String,
    description: String
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, {
  timestamps: true
});

// Calculate final price before saving
productSchema.pre('save', function(next) {
  if (this.basePrice && this.discount) {
    this.finalPrice = this.basePrice * (1 - this.discount / 100);
  } else if (this.basePrice) {
    this.finalPrice = this.basePrice;
  }
  next();
});

// Indexes for performance
productSchema.index({ vendorId: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ 'stock.quantity': 1 });
productSchema.index({ finalPrice: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'sales.totalSold': -1 });

// Virtual for availability
productSchema.virtual('isAvailable').get(function() {
  return this.status === 'active' && this.isActive && this.stock.quantity > 0;
});

// Method to check stock availability
productSchema.methods.checkAvailability = function(quantity = 1) {
  return this.isAvailable && this.stock.quantity >= quantity;
};

// Method to reduce stock
productSchema.methods.reduceStock = async function(quantity) {
  if (this.stock.quantity >= quantity) {
    this.stock.quantity -= quantity;
    this.sales.totalSold += quantity;
    
    // Update status if stock is low
    if (this.stock.quantity <= 0) {
      this.status = 'out_of_stock';
    }
    
    await this.save();
    return true;
  }
  return false;
};

module.exports = mongoose.model('Product', productSchema);

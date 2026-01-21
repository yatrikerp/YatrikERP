const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productCode: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  vendorName: String,
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 18
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxAmount: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  image: String,
  specifications: mongoose.Schema.Types.Mixed
}, { _id: true });

const cartSchema = new mongoose.Schema({
  // Cart Owner (Can be Vendor or Depot)
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
  
  // Cart Items
  items: [cartItemSchema],
  
  // Cart Summary
  summary: {
    itemCount: {
      type: Number,
      default: 0,
      min: 0
    },
    subtotal: {
      type: Number,
      default: 0,
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
      default: 0,
      min: 0
    }
  },
  
  // Shipping Address
  shippingAddress: {
    name: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    phone: String,
    email: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'abandoned', 'converted'],
    default: 'active',
    index: true
  },
  
  // Expiration (carts expire after 30 days of inactivity)
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }
  }
}, {
  timestamps: true
});

// Indexes
cartSchema.index({ userId: 1, userType: 1, status: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to calculate cart summary
cartSchema.methods.calculateSummary = function() {
  let itemCount = 0;
  let subtotal = 0;
  let taxAmount = 0;
  
  this.items.forEach(item => {
    itemCount += item.quantity;
    subtotal += item.subtotal;
    taxAmount += item.taxAmount;
  });
  
  const shippingCharges = this.summary.shippingCharges || 0;
  const discount = this.summary.discount || 0;
  const total = subtotal + taxAmount + shippingCharges - discount;
  
  this.summary = {
    itemCount,
    subtotal,
    taxAmount,
    shippingCharges,
    discount,
    total
  };
  
  return this.summary;
};

// Method to add item to cart
cartSchema.methods.addItem = async function(itemData) {
  const existingItemIndex = this.items.findIndex(
    item => item.productId.toString() === itemData.productId.toString()
  );
  
  if (existingItemIndex >= 0) {
    // Update existing item
    const existingItem = this.items[existingItemIndex];
    existingItem.quantity += itemData.quantity || 1;
    existingItem.subtotal = existingItem.quantity * existingItem.unitPrice;
    existingItem.taxAmount = existingItem.subtotal * (existingItem.taxRate / 100);
    existingItem.total = existingItem.subtotal + existingItem.taxAmount;
  } else {
    // Add new item
    const subtotal = (itemData.quantity || 1) * itemData.unitPrice;
    const taxAmount = subtotal * ((itemData.taxRate || 18) / 100);
    
    this.items.push({
      ...itemData,
      subtotal,
      taxAmount,
      total: subtotal + taxAmount
    });
  }
  
  this.calculateSummary();
  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(
    item => item.productId.toString() !== productId.toString()
  );
  this.calculateSummary();
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId, quantity) {
  const item = this.items.find(
    item => item.productId.toString() === productId.toString()
  );
  
  if (item) {
    if (quantity <= 0) {
      return this.removeItem(productId);
    }
    
    item.quantity = quantity;
    item.subtotal = item.quantity * item.unitPrice;
    item.taxAmount = item.subtotal * (item.taxRate / 100);
    item.total = item.subtotal + item.taxAmount;
    this.calculateSummary();
    return this.save();
  }
  
  return null;
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.calculateSummary();
  return this.save();
};

module.exports = mongoose.model('Cart', cartSchema);

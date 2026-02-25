const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const { logger } = require('../src/core/logger');

// Apply auth middleware
router.use(auth);

// =================================================================
// CART MANAGEMENT
// =================================================================

// Helper to determine userType based on role (must match Cart model enum: ['vendor', 'depot', 'admin'])
const getUserType = (role) => {
  if (role === 'vendor') return 'vendor';
  if (role === 'depot_manager') return 'depot';
  // Add other roles if they can also buy
  return 'admin'; // Default for other authenticated users (admin, etc.)
};

// GET /api/cart - Get user's cart
router.get('/', async (req, res) => {
  try {
    const userId = req.user.vendorId || req.user.depotId || req.user._id;
    const userType = getUserType(req.user.role);

    let cart = await Cart.findOne({
      userId,
      userType,
      status: 'active'
    }).populate('items.productId', 'productName productCode images stock status');

    if (!cart) {
      // Create new cart
      cart = new Cart({
        userId,
        userType,
        userName: req.user.name || req.user.companyName,
        userEmail: req.user.email,
        items: [],
        summary: {
          itemCount: 0,
          subtotal: 0,
          taxAmount: 0,
          shippingCharges: 0,
          discount: 0,
          total: 0
        }
      });
      await cart.save();
    }

    res.json({
      success: true,
      data: { cart }
    });
  } catch (error) {
    logger.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
      error: error.message
    });
  }
});

// POST /api/cart/add - Add item to cart
router.post('/add', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.vendorId || req.user.depotId || req.user._id;
    const userType = getUserType(req.user.role);

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Get product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check product availability
    if (product.status !== 'active' || !product.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Product is not available'
      });
    }

    const availableStock = product.stock?.quantity || 0;
    if (availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({
      userId,
      userType,
      status: 'active'
    });

    // Check if item already exists in cart to calculate quantity difference
    let existingCartQuantity = 0;
    if (cart) {
      const existingItem = cart.items.find(
        item => item.productId.toString() === productId.toString()
      );
      if (existingItem) {
        existingCartQuantity = existingItem.quantity;
      }
    }

    // Calculate how much stock to reserve (new quantity - existing quantity in cart)
    const quantityToReserve = quantity - existingCartQuantity;

    if (!cart) {
      cart = new Cart({
        userId,
        userType,
        userName: req.user.name || req.user.companyName,
        userEmail: req.user.email,
        items: []
      });
    }

    // Prepare item data
    const itemData = {
      productId: product._id,
      productCode: product.productCode,
      productName: product.productName,
      vendorId: product.vendorId,
      vendorName: product.vendorName,
      quantity,
      unitPrice: product.finalPrice,
      taxRate: product.taxRate,
      image: product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url,
      specifications: product.specifications
    };

    await cart.addItem(itemData);

    // Decrease product stock when adding to cart (reserve stock)
    if (quantityToReserve > 0) {
      if (!product.stock) {
        product.stock = { quantity: 0, reserved: 0 };
      }
      product.stock.quantity = Math.max(0, product.stock.quantity - quantityToReserve);
      product.stock.reserved = (product.stock.reserved || 0) + quantityToReserve;
      await product.save();
    }

    res.json({
      success: true,
      message: 'Item added to cart',
      data: { cart }
    });
  } catch (error) {
    logger.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
});

// PUT /api/cart/update/:itemId - Update item quantity
router.put('/update/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.vendorId || req.user.depotId || req.user._id;
    const userType = getUserType(req.user.role);

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    const cart = await Cart.findOne({
      userId,
      userType,
      status: 'active'
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Check stock availability - try multiple ways to find item
    let item = null;
    try {
      item = cart.items.id(itemId);
    } catch (idError) {
      // If id() fails, try finding by _id string match
      item = cart.items.find(i => i._id.toString() === itemId);
    }
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
        debug: {
          itemId,
          cartItemIds: cart.items.map(i => i._id?.toString())
        }
      });
    }

    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const availableStock = product.stock?.quantity || 0;
    const oldQuantity = item.quantity || 0;
    const quantityDifference = quantity - oldQuantity;

    // Check if we have enough stock for the increase
    if (quantityDifference > 0 && availableStock < quantityDifference) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${availableStock}, Requested: ${quantityDifference}`
      });
    }

    // Update stock based on quantity change
    if (product.stock) {
      if (quantityDifference > 0) {
        // Increasing quantity - decrease stock
        product.stock.quantity = Math.max(0, product.stock.quantity - quantityDifference);
        product.stock.reserved = (product.stock.reserved || 0) + quantityDifference;
      } else if (quantityDifference < 0) {
        // Decreasing quantity - restore stock
        product.stock.quantity = (product.stock.quantity || 0) + Math.abs(quantityDifference);
        product.stock.reserved = Math.max(0, (product.stock.reserved || 0) - Math.abs(quantityDifference));
      }
      await product.save();
    }

    await cart.updateItemQuantity(item.productId, quantity);

    res.json({
      success: true,
      message: 'Cart updated',
      data: { cart }
    });
  } catch (error) {
    logger.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart',
      error: error.message
    });
  }
});

// DELETE /api/cart/remove/:itemId - Remove item from cart
router.delete('/remove/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.vendorId || req.user.depotId || req.user._id;
    const userType = getUserType(req.user.role);

    const cart = await Cart.findOne({
      userId,
      userType,
      status: 'active'
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Try to find item by _id using Mongoose subdocument id() method
    let item = null;
    try {
      // First try using Mongoose's id() method (works with ObjectId)
      item = cart.items.id(itemId);
    } catch (idError) {
      // If id() fails, try finding by _id string match
      item = cart.items.find(i => {
        const itemIdStr = i._id?.toString ? i._id.toString() : String(i._id);
        return itemIdStr === itemId || itemIdStr === String(itemId);
      });
    }

    // If still not found, try finding by productId (fallback - shouldn't happen but just in case)
    if (!item) {
      item = cart.items.find(i => {
        const itemProductId = i.productId?.toString ? i.productId.toString() : String(i.productId);
        return itemProductId === itemId || itemProductId === String(itemId);
      });
    }

    if (!item) {
      logger.warn(`Item not found in cart. itemId: ${itemId}, cart items:`, cart.items.map(i => ({
        _id: i._id?.toString(),
        productId: i.productId?.toString(),
        productName: i.productName
      })));
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
        debug: {
          itemId,
          cartItemIds: cart.items.map(i => i._id?.toString())
        }
      });
    }

    // Restore stock when removing from cart
    const product = await Product.findById(item.productId);
    if (product && product.stock) {
      const quantityToRestore = item.quantity || 0;
      product.stock.quantity = (product.stock.quantity || 0) + quantityToRestore;
      product.stock.reserved = Math.max(0, (product.stock.reserved || 0) - quantityToRestore);
      await product.save();
    }

    // Remove item by _id (subdocument removal)
    // Mongoose pull method for subdocuments - pass the _id directly
    cart.items.pull(item._id);
    cart.calculateSummary();
    await cart.save();

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: { cart }
    });
  } catch (error) {
    logger.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
});

// DELETE /api/cart/clear - Clear entire cart
router.delete('/clear', async (req, res) => {
  try {
    const userId = req.user.vendorId || req.user.depotId || req.user._id;
    const userType = getUserType(req.user.role);

    const cart = await Cart.findOne({
      userId,
      userType,
      status: 'active'
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Release all reserved stock before clearing cart
    for (const item of cart.items) {
      try {
        const product = await Product.findById(item.productId);
        if (product && product.stock) {
          const quantityToRelease = item.quantity || 0;
          product.stock.quantity = (product.stock.quantity || 0) + quantityToRelease;
          product.stock.reserved = Math.max(0, (product.stock.reserved || 0) - quantityToRelease);
          await product.save();
        }
      } catch (stockError) {
        logger.error(`Error releasing stock for product ${item.productId}:`, stockError);
        // Continue with other items even if one fails
      }
    }

    await cart.clearCart();

    res.json({
      success: true,
      message: 'Cart cleared',
      data: { cart }
    });
  } catch (error) {
    logger.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
});

// POST /api/cart/shipping - Update shipping address
router.post('/shipping', async (req, res) => {
  try {
    const shippingAddress = req.body;
    const userId = req.user.vendorId || req.user.depotId || req.user._id;
    const userType = getUserType(req.user.role);

    const cart = await Cart.findOne({
      userId,
      userType,
      status: 'active'
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.shippingAddress = shippingAddress;
    await cart.save();

    res.json({
      success: true,
      message: 'Shipping address updated',
      data: { cart }
    });
  } catch (error) {
    logger.error('Update shipping error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shipping address',
      error: error.message
    });
  }
});

// =================================================================
// BULK CART ENHANCED ENDPOINTS
// =================================================================

// GET /api/cart/enhanced - Get cart with vendor grouping and schemes
router.get('/enhanced', async (req, res) => {
  try {
    const Vendor = require('../models/Vendor');
    let SchemeEngine;
    try {
      SchemeEngine = require('../services/schemeEngine');
    } catch (e) {
      // SchemeEngine not available, create a simple fallback
      SchemeEngine = {
        applyScheme: (item, product) => {
          const quantity = item.quantity || 1;
          const unitPrice = item.unitPrice || product?.finalPrice || product?.basePrice || 0;
          const subtotal = quantity * unitPrice;
          const taxRate = item.taxRate || product?.taxRate || 18;
          const taxAmount = subtotal * (taxRate / 100);
          return {
            ...item.toObject ? item.toObject() : item,
            productName: item.productName || product?.productName || 'Product',
            productCode: item.productCode || product?.productCode || '',
            quantity,
            unitPrice,
            subtotal,
            taxAmount,
            total: subtotal + taxAmount,
            schemeDiscount: 0
          };
        }
      };
    }
    const userId = req.user.vendorId || req.user.depotId || req.user._id;
    const userType = getUserType(req.user.role);

    let cart = await Cart.findOne({
      userId,
      userType,
      status: 'active'
    }).populate('items.productId', 'productName productCode finalPrice basePrice taxRate stock status');
    
    // Convert cart items to plain objects and preserve original productId and _id
    if (cart && cart.items) {
      cart.items = cart.items.map(item => {
        const itemObj = item.toObject ? item.toObject() : { ...item };
        // CRITICAL: Preserve the item's _id (subdocument _id) for remove/update operations
        if (!itemObj._id && item._id) {
          itemObj._id = item._id;
        }
        // Preserve original productId ObjectId before population
        const originalProductId = item.productId?._id || item.productId;
        itemObj.productId = originalProductId; // Keep as ObjectId for reference
        itemObj.product = item.productId; // Keep populated product for display
        return itemObj;
      });
    }

    if (!cart || cart.items.length === 0) {
      return res.json({
        success: true,
        data: {
          cart: null,
          vendorGroups: [],
          summary: {
            itemCount: 0,
            subtotal: 0,
            taxAmount: 0,
            total: 0,
            totalDiscount: 0
          }
        }
      });
    }

    // Group items by vendor
    const vendorMap = new Map();
    const vendorIds = [...new Set(cart.items.map(item => item.vendorId.toString()))];
    const vendors = await Vendor.find({ _id: { $in: vendorIds } });

    for (const item of cart.items) {
      const vendorId = item.vendorId.toString();
      if (!vendorMap.has(vendorId)) {
        const vendor = vendors.find(v => v._id.toString() === vendorId);
        vendorMap.set(vendorId, {
          vendorId,
          vendorName: item.vendorName || vendor?.companyName || 'Unknown Vendor',
          vendorRating: vendor?.rating || 0,
          trustScore: vendor?.trustScore || 50,
          items: []
        });
      }
      vendorMap.get(vendorId).items.push(item);
    }

    const vendorGroups = Array.from(vendorMap.values()).map(group => {
      let vendorSubtotal = 0;
      let vendorTax = 0;
      let vendorDiscount = 0;

      group.items = group.items.map(item => {
        // Get product object (we stored it in 'product' field during preprocessing)
        const product = item.product || {};
        // Get original productId ObjectId (we preserved it in productId field)
        const originalProductId = item.productId;
        
        const enhancedItem = SchemeEngine.applyScheme(item, product, {});
        
        // Preserve the cart item _id for updates - CRITICAL for cart operations
        // Convert _id to string for frontend use
        if (item._id) {
          enhancedItem._id = item._id.toString ? item._id.toString() : String(item._id);
          enhancedItem.id = enhancedItem._id;
          enhancedItem.itemId = enhancedItem._id;
        } else {
          // Fallback: try to get _id from the item object
          const itemId = item.id || item.itemId || item._id;
          if (itemId) {
            enhancedItem._id = itemId.toString ? itemId.toString() : String(itemId);
            enhancedItem.id = enhancedItem._id;
            enhancedItem.itemId = enhancedItem._id;
          }
        }
        
        // Preserve productId as string for frontend use - CRITICAL for PO creation
        // Convert ObjectId to string
        if (originalProductId) {
          enhancedItem.productId = originalProductId.toString ? originalProductId.toString() : String(originalProductId);
        } else {
          // Fallback: try to get from product object
          enhancedItem.productId = product._id?.toString() || product._id || null;
        }
        
        // Also keep the populated product object for display
        if (product && typeof product === 'object') {
          enhancedItem.product = product;
        }
        
        // Preserve productName from cart item (it's already stored when added to cart)
        enhancedItem.productName = item.productName || product?.productName || enhancedItem.productName || 'Product';
        enhancedItem.productCode = item.productCode || product?.productCode || enhancedItem.productCode || '';
        
        vendorSubtotal += enhancedItem.subtotal;
        vendorTax += enhancedItem.taxAmount;
        vendorDiscount += enhancedItem.schemeDiscount || 0;
        return enhancedItem;
      });

      return {
        ...group,
        subtotal: vendorSubtotal,
        taxAmount: vendorTax,
        discount: vendorDiscount,
        total: vendorSubtotal + vendorTax - vendorDiscount
      };
    });

    res.json({
      success: true,
      data: {
        cart,
        vendorGroups,
        summary: cart.summary
      }
    });
  } catch (error) {
    logger.error('Get enhanced cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enhanced cart',
      error: error.message
    });
  }
});

module.exports = router;

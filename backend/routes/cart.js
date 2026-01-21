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

    // Check stock availability
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
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
    if (availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`
      });
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

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    await cart.removeItem(item.productId);

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
    const SchemeEngine = require('../services/schemeEngine');
    const userId = req.user.vendorId || req.user.depotId || req.user._id;
    const userType = getUserType(req.user.role);

    let cart = await Cart.findOne({
      userId,
      userType,
      status: 'active'
    }).populate('items.productId');

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
        const product = item.productId;
        const enhancedItem = SchemeEngine.applyScheme(item, product, {});
        // Preserve the cart item _id for updates - CRITICAL for cart operations
        enhancedItem._id = item._id;
        enhancedItem.id = item._id;
        enhancedItem.itemId = item._id;
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

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const { logger } = require('../src/core/logger');

// Apply auth middleware
router.use(auth);

// =================================================================
// ORDER MANAGEMENT
// =================================================================

// POST /api/orders/create - Create order from cart
router.post('/create', async (req, res) => {
  try {
    const userId = req.user._id;
    const userType = req.user.role === 'vendor' ? 'vendor' : 
                     req.user.role === 'depot_manager' ? 'depot' : 'admin';

    // Get cart
    const cart = await Cart.findOne({
      userId,
      userType,
      status: 'active'
    }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Validate stock and calculate totals
    const orderItems = [];
    let totalAmount = 0;
    let totalTax = 0;

    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.productId);
      
      if (!product || !product.checkAvailability(cartItem.quantity)) {
        return res.status(400).json({
          success: false,
          message: `Product ${cartItem.productName} is out of stock or insufficient quantity`
        });
      }

      orderItems.push({
        productId: product._id,
        productCode: product.productCode,
        productName: product.productName,
        vendorId: product.vendorId,
        vendorName: product.vendorName,
        quantity: cartItem.quantity,
        unitPrice: product.finalPrice,
        taxRate: product.taxRate,
        subtotal: cartItem.subtotal,
        taxAmount: cartItem.taxAmount,
        total: cartItem.total,
        image: cartItem.image
      });

      totalAmount += cartItem.subtotal;
      totalTax += cartItem.taxAmount;
    }

    // Create order
    const order = new Order({
      orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      userId,
      userType,
      userName: req.user.name || req.user.companyName,
      userEmail: req.user.email,
      items: orderItems,
      summary: {
        subtotal: cart.summary.subtotal,
        taxAmount: cart.summary.taxAmount,
        shippingCharges: cart.summary.shippingCharges || 0,
        discount: cart.summary.discount || 0,
        total: cart.summary.total
      },
      shippingAddress: cart.shippingAddress || {},
      status: 'pending',
      paymentStatus: 'pending'
    });

    await order.save();

    // Mark cart as converted
    cart.status = 'converted';
    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order }
    });
  } catch (error) {
    logger.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// GET /api/orders - Get user's orders
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const userType = req.user.role === 'vendor' ? 'vendor' : 
                     req.user.role === 'depot_manager' ? 'depot' : 'admin';
    const { status, page = 1, limit = 20 } = req.query;

    const query = { userId, userType };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// GET /api/orders/:id - Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    logger.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
});

module.exports = router;

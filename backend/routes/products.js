const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const Cart = require('../models/Cart');
const { auth, requireRole } = require('../middleware/auth');
const { logger } = require('../src/core/logger');

// =================================================================
// PRODUCT CATALOG (Public & Authenticated)
// =================================================================

// GET /api/products - Get all products (with filters)
router.get('/', auth, async (req, res) => {
  try {
    const {
      category,
      vendorId,
      search,
      minPrice,
      maxPrice,
      inStock,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {
      status: 'active',
      isActive: true
    };

    if (category) query.category = category;
    if (vendorId) query.vendorId = vendorId;
    if (inStock === 'true') {
      query['stock.quantity'] = { $gt: 0 };
    }
    if (minPrice || maxPrice) {
      query.finalPrice = {};
      if (minPrice) query.finalPrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.finalPrice.$lte = parseFloat(maxPrice);
    }
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('vendorId', 'companyName email phone trustScore')
        .select('-specifications -notes')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// =================================================================
// SPECIFIC ROUTES (Must come before /:id to avoid route conflicts)
// =================================================================

// GET /api/products/purchase-orders/all - Get all purchase orders (Admin & Depot only)
router.get('/purchase-orders/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'depot_manager') {
      return res.status(403).json({
        success: false,
        message: 'Only admins and depot managers can view all purchase orders'
      });
    }

    const PurchaseOrder = require('../models/PurchaseOrder');
    const { page = 1, limit = 50, status, vendorId } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (vendorId) {
      query.vendorId = vendorId;
    }
    if (req.user.role === 'depot_manager' && req.user.depotId) {
      query.depotId = req.user.depotId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const purchaseOrders = await PurchaseOrder.find(query)
      .populate('vendorId', 'companyName email phone')
      .populate('requestedBy', 'name email')
      .populate('depotId', 'depotName depotCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await PurchaseOrder.countDocuments(query);

    res.json({
      success: true,
      data: {
        purchaseOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get all purchase orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase orders',
      error: error.message
    });
  }
});

// GET /api/products/purchase-orders/pending-approval - Get purchase orders pending approval (Admin only)
router.get('/purchase-orders/pending-approval', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view pending approval purchase orders'
      });
    }

    const PurchaseOrder = require('../models/PurchaseOrder');
    const { page = 1, limit = 20 } = req.query;

    const query = { status: 'pending_approval' };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const purchaseOrders = await PurchaseOrder.find(query)
      .populate('vendorId', 'companyName email phone')
      .populate('requestedBy', 'name email')
      .populate('depotId', 'depotName depotCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await PurchaseOrder.countDocuments(query);

    res.json({
      success: true,
      data: {
        purchaseOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get pending approval purchase orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending approval purchase orders',
      error: error.message
    });
  }
});

// POST /api/products/purchase-orders/:id/approve - Approve purchase order (Admin only)
router.post('/purchase-orders/:id/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can approve purchase orders'
      });
    }

    const PurchaseOrder = require('../models/PurchaseOrder');
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    if (purchaseOrder.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: `Purchase order is not pending approval. Current status: ${purchaseOrder.status}`
      });
    }

    purchaseOrder.approvals.push({
      approvedBy: req.user._id,
      approvedAt: new Date(),
      level: 'admin',
      comments: req.body.comments || 'Approved by admin'
    });

    purchaseOrder.status = 'approved';
    purchaseOrder.updatedBy = req.user._id;

    await purchaseOrder.save();

    res.json({
      success: true,
      message: 'Purchase order approved successfully',
      data: { purchaseOrder }
    });
  } catch (error) {
    logger.error('Approve purchase order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve purchase order',
      error: error.message
    });
  }
});

// POST /api/products/purchase-orders/:id/send-to-vendor - Send approved PO to vendor (Admin only)
router.post('/purchase-orders/:id/send-to-vendor', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can send purchase orders to vendors'
      });
    }

    const PurchaseOrder = require('../models/PurchaseOrder');
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    if (purchaseOrder.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Purchase order must be approved before sending to vendor. Current status: ${purchaseOrder.status}`
      });
    }

    purchaseOrder.status = 'pending';
    purchaseOrder.orderDate = new Date();
    purchaseOrder.updatedBy = req.user._id;

    await purchaseOrder.save();

    res.json({
      success: true,
      message: 'Purchase order sent to vendor successfully',
      data: { purchaseOrder }
    });
  } catch (error) {
    logger.error('Send PO to vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send purchase order to vendor',
      error: error.message
    });
  }
});

// POST /api/products/purchase-orders/:id/reject - Reject purchase order (Admin only)
router.post('/purchase-orders/:id/reject', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can reject purchase orders'
      });
    }

    const PurchaseOrder = require('../models/PurchaseOrder');
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    if (purchaseOrder.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: `Purchase order is not pending approval. Current status: ${purchaseOrder.status}`
      });
    }

    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    purchaseOrder.status = 'cancelled';
    purchaseOrder.cancelledDate = new Date();
    purchaseOrder.internalNotes = `Rejected by admin: ${reason}`;
    purchaseOrder.updatedBy = req.user._id;

    await purchaseOrder.save();

    res.json({
      success: true,
      message: 'Purchase order rejected successfully',
      data: { purchaseOrder }
    });
  } catch (error) {
    logger.error('Reject purchase order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject purchase order',
      error: error.message
    });
  }
});

// PATCH /api/products/:id/stock - Update product stock quantity (Vendor only)
// This MUST come before /:id route
router.patch('/:id/stock', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const { quantity, operation } = req.body;

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({
        success: false,
        message: 'Quantity is required'
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (req.user.role !== 'admin') {
      if (product.vendorId.toString() !== vendorId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update stock for your own products'
        });
      }
    }

    const oldStock = product.stock.quantity || 0;
    if (operation === 'add') {
      product.stock.quantity = oldStock + parseInt(quantity);
    } else if (operation === 'subtract') {
      product.stock.quantity = Math.max(0, oldStock - parseInt(quantity));
    } else {
      product.stock.quantity = Math.max(0, parseInt(quantity));
    }

    const basePrice = product.basePrice || 0;
    const stockQuantity = product.stock.quantity;
    
    if (stockQuantity > 0) {
      const discountFactor = Math.min(0.1, (stockQuantity / 1000) * 0.1);
      const adjustedPrice = basePrice * (1 - discountFactor);
      
      if (stockQuantity < 10) {
        product.finalPrice = basePrice * 1.05;
      } else {
        product.finalPrice = Math.max(basePrice * 0.9, adjustedPrice);
      }
      
      product.vendorPrice = product.finalPrice;
    } else {
      product.finalPrice = basePrice;
      product.vendorPrice = basePrice;
    }

    if (product.stock.quantity <= 0) {
      product.status = 'out_of_stock';
    } else if (product.status === 'out_of_stock' && product.stock.quantity > 0) {
      product.status = 'active';
    }

    product.updatedBy = req.user._id;
    await product.save();

    res.json({
      success: true,
      message: 'Stock updated successfully. Price recalculated automatically.',
      data: { 
        product,
        stockQuantity: product.stock.quantity,
        finalPrice: product.finalPrice,
        vendorPrice: product.vendorPrice
      }
    });
  } catch (error) {
    logger.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: error.message
    });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', auth, async (req, res) => {
  try {
    // Don't match if it's a purchase-orders route
    if (req.params.id === 'purchase-orders') {
      return res.status(404).json({
        success: false,
        message: 'Invalid route'
      });
    }

    const product = await Product.findById(req.params.id)
      .populate('vendorId', 'companyName email phone trustScore complianceScore')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count
    await Product.findByIdAndUpdate(req.params.id, {
      $inc: { 'sales.views': 1 }
    });

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    logger.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
});

// =================================================================
// VENDOR PRODUCT MANAGEMENT
// =================================================================

// POST /api/products - Create new product (Vendor or Admin)
router.post('/', auth, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    
    // Admin can create products for any vendor, vendors can only create for themselves
    let vendorId = req.body.vendorId;
    if (!isAdmin) {
      if (req.user.role !== 'vendor') {
        return res.status(403).json({
          success: false,
          message: 'Only vendors or admins can create products'
        });
      }
      vendorId = req.user.vendorId || req.user._id;
      
      const vendor = await Vendor.findById(vendorId);
      if (!vendor || vendor.status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: 'Vendor account must be approved to list products'
        });
      }
    } else {
      // Admin creating product - verify vendor exists
      if (!vendorId) {
        return res.status(400).json({
          success: false,
          message: 'Vendor ID is required when creating products as admin'
        });
      }
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }
    }

    const vendor = await Vendor.findById(vendorId);
    const productData = {
      ...req.body,
      vendorId,
      vendorName: vendor.companyName,
      vendorCompany: vendor.companyName
    };

    // Generate product code if not provided
    if (!productData.productCode) {
      const count = await Product.countDocuments({ vendorId });
      productData.productCode = `PRD-${vendor.companyName.substring(0, 3).toUpperCase()}-${String(count + 1).padStart(5, '0')}`;
    }

    // Set createdBy for admin
    if (isAdmin) {
      productData.createdBy = req.user._id;
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    logger.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
});


// PUT /api/products/:id - Update product (Vendor only)
router.put('/:id', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Admin can update any product, vendors can only update their own
    if (req.user.role !== 'admin') {
      if (product.vendorId.toString() !== vendorId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own products'
        });
      }
    }

    Object.assign(product, req.body);
    product.updatedBy = req.user._id;
    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });
  } catch (error) {
    logger.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
});

// DELETE /api/products/:id - Delete product (Vendor only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Admin can delete any product, vendors can only delete their own
    if (req.user.role !== 'admin') {
      if (product.vendorId.toString() !== vendorId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own products'
        });
      }
    }

    product.status = 'inactive';
    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    logger.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
});

// POST /api/products/vendor/bulk-stock-update - Bulk update stock for all vendor products
router.post('/vendor/bulk-stock-update', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const { quantity, operation = 'set' } = req.body;

    if (req.user.role !== 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'Only vendors can access this endpoint'
      });
    }

    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    // Find all vendor's active products
    const products = await Product.find({ 
      vendorId: new mongoose.Types.ObjectId(vendorId),
      status: { $in: ['active', 'pending', 'draft'] }
    });

    let updated = 0;
    let priceRecalculated = 0;

    for (const product of products) {
      const oldStock = product.stock?.quantity || 0;
      const oldPrice = product.finalPrice || product.basePrice || 0;

      // Update stock
      if (operation === 'add') {
        product.stock.quantity = oldStock + parseInt(quantity);
      } else if (operation === 'subtract') {
        product.stock.quantity = Math.max(0, oldStock - parseInt(quantity));
      } else {
        product.stock.quantity = parseInt(quantity);
      }

      // Auto-calculate price
      const basePrice = product.basePrice || 0;
      const stockQuantity = product.stock.quantity;
      
      if (stockQuantity > 0) {
        const discountFactor = Math.min(0.1, (stockQuantity / 1000) * 0.1);
        const adjustedPrice = basePrice * (1 - discountFactor);
        
        if (stockQuantity < 10) {
          product.finalPrice = basePrice * 1.05;
        } else {
          product.finalPrice = Math.max(basePrice * 0.9, adjustedPrice);
        }
        
        product.vendorPrice = product.finalPrice;
      } else {
        product.finalPrice = basePrice;
        product.vendorPrice = basePrice;
      }

      // Update status
      if (product.stock.quantity > 0 && product.status === 'out_of_stock') {
        product.status = 'active';
      } else if (product.stock.quantity <= 0) {
        product.status = 'out_of_stock';
      }

      product.updatedBy = req.user._id;
      await product.save();
      updated++;

      if (oldPrice !== product.finalPrice) {
        priceRecalculated++;
      }
    }

    res.json({
      success: true,
      message: `Updated ${updated} products. ${priceRecalculated} prices recalculated.`,
      data: {
        updated,
        priceRecalculated,
        totalProducts: products.length
      }
    });
  } catch (error) {
    logger.error('Bulk stock update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: error.message
    });
  }
});

// GET /api/products/vendor/my-products - Get vendor's own products
router.get('/vendor/my-products', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    
    if (req.user.role !== 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'Only vendors can access this endpoint'
      });
    }

    const products = await Product.find({ vendorId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { products }
    });
  } catch (error) {
    logger.error('Get vendor products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// POST /api/products/bulk - Bulk create products (Vendor only)
router.post('/bulk', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    
    if (req.user.role !== 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'Only vendors can create products'
      });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor || vendor.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Vendor account must be approved to list products'
      });
    }

    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Products array is required and must not be empty'
      });
    }

    if (products.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 100 products can be added at once'
      });
    }

    const createdProducts = [];
    const errors = [];
    let productCount = await Product.countDocuments({ vendorId });

    for (let i = 0; i < products.length; i++) {
      try {
        const productData = products[i];
        
        // Validate required fields
        if (!productData.productName || !productData.basePrice) {
          errors.push({
            index: i,
            productName: productData.productName || 'Unknown',
            error: 'Product name and base price are required'
          });
          continue;
        }

        // Generate product code if not provided
        if (!productData.productCode) {
          productCount++;
          productData.productCode = `PRD-${vendor.companyName.substring(0, 3).toUpperCase()}-${String(productCount).padStart(5, '0')}`;
        }

        // Check if product code already exists
        const existingProduct = await Product.findOne({ productCode: productData.productCode });
        if (existingProduct) {
          errors.push({
            index: i,
            productName: productData.productName,
            productCode: productData.productCode,
            error: 'Product code already exists'
          });
          continue;
        }

        const newProduct = new Product({
          ...productData,
          vendorId,
          vendorName: vendor.companyName,
          vendorCompany: vendor.companyName,
          status: productData.status || 'draft',
          isActive: productData.isActive !== undefined ? productData.isActive : true,
          createdBy: req.user._id
        });

        await newProduct.save();
        createdProducts.push(newProduct);
      } catch (productError) {
        errors.push({
          index: i,
          productName: products[i].productName || 'Unknown',
          error: productError.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdProducts.length} product(s)`,
      data: {
        created: createdProducts.length,
        failed: errors.length,
        products: createdProducts,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    logger.error('Bulk create products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create products',
      error: error.message
    });
  }
});

// GET /api/products/admin/all-vendor-products - Get all vendor products (Admin only)
router.get('/admin/all-vendor-products', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access this endpoint'
      });
    }

    const {
      vendorId,
      status,
      category,
      search,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (vendorId) query.vendorId = vendorId;
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { vendorName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('vendorId', 'companyName email phone status')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get all vendor products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// GET /api/products/depot/vendor-products - Get vendor products (Depot only)
router.get('/depot/vendor-products', auth, async (req, res) => {
  try {
    if (req.user.role !== 'depot_manager' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only depot managers and admins can access this endpoint'
      });
    }

    const {
      vendorId,
      category,
      inStock,
      search,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {
      status: 'active',
      isActive: true
    };

    if (vendorId) query.vendorId = vendorId;
    if (category) query.category = category;
    if (inStock === 'true') {
      query['stock.quantity'] = { $gt: 0 };
    }
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { vendorName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('vendorId', 'companyName email phone trustScore')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get depot vendor products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// POST /api/products/vendor/bulk-spare-parts - Bulk upload spare parts (Vendor only, pending approval)
router.post('/vendor/bulk-spare-parts', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    
    if (req.user.role !== 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'Only vendors can upload spare parts'
      });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor || vendor.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Vendor account must be approved to upload products'
      });
    }

    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Products array is required and must not be empty'
      });
    }

    if (products.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 100 products can be uploaded at once'
      });
    }

    const createdProducts = [];
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      try {
        const productData = products[i];
        
        // Validate required fields
        if (!productData.partName || !productData.basePrice || !productData.ksrcPartCode) {
          errors.push({
            index: i,
            partName: productData.partName || 'Unknown',
            error: 'Part name, KSRTC part code, and base price are required'
          });
          continue;
        }

        // Check if product code already exists
        const existingProduct = await Product.findOne({ 
          $or: [
            { productCode: productData.ksrcPartCode },
            { 'specifications.ksrcPartCode': productData.ksrcPartCode }
          ]
        });
        if (existingProduct) {
          errors.push({
            index: i,
            partName: productData.partName,
            ksrcPartCode: productData.ksrcPartCode,
            error: 'Product with this KSRTC part code already exists'
          });
          continue;
        }

        // Generate product code if not provided
        let productCode = productData.ksrcPartCode.toUpperCase();
        if (!productCode.startsWith('PRD-')) {
          const count = await Product.countDocuments({ vendorId });
          productCode = `PRD-${productCode}-${String(count + 1).padStart(5, '0')}`;
        }

        // Prepare images array from imageUrl
        const images = [];
        if (productData.imageUrl && productData.imageUrl.trim()) {
          images.push({
            url: productData.imageUrl.trim(),
            isPrimary: true,
            alt: productData.partName || 'Product image'
          });
        }

        const newProduct = new Product({
          productCode,
          productName: productData.partName,
          description: productData.description || '',
          category: productData.category || 'other',
          basePrice: productData.basePrice,
          finalPrice: productData.basePrice, // Will be calculated
          taxRate: productData.gstRate || 18,
          vendorId,
          vendorName: vendor.companyName,
          vendorCompany: vendor.companyName,
          stock: {
            quantity: productData.stock?.quantity || 0,
            minQuantity: productData.stock?.minQuantity || 10,
            unit: productData.stock?.unit || 'pieces'
          },
          status: 'pending', // Pending admin approval
          isActive: false, // Not active until approved
          createdBy: req.user._id,
          images: images, // Add images array
          // Store KSRTC-specific fields in specifications
          specifications: new Map([
            ['ksrcPartCode', productData.ksrcPartCode],
            ['leadTime', productData.leadTime?.toString() || ''],
            ['warranty', productData.warranty?.toString() || ''],
            ['moq', productData.moq?.toString() || ''],
            ['busModelCompatibility', Array.isArray(productData.busModelCompatibility) 
              ? productData.busModelCompatibility.join(', ') 
              : productData.busModelCompatibility || '']
          ])
        });

        await newProduct.save();
        createdProducts.push(newProduct);
      } catch (productError) {
        errors.push({
          index: i,
          partName: products[i].partName || 'Unknown',
          error: productError.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${createdProducts.length} spare part(s). Products are pending admin approval.`,
      data: {
        created: createdProducts.length,
        failed: errors.length,
        products: createdProducts,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    logger.error('Bulk upload spare parts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload spare parts',
      error: error.message
    });
  }
});


// POST /api/products/create-purchase-order - Create purchase order from products (Admin & Depot)
router.post('/create-purchase-order', auth, async (req, res) => {
  try {
    // Check if user is admin or depot manager
    if (req.user.role !== 'admin' && req.user.role !== 'depot_manager') {
      return res.status(403).json({
        success: false,
        message: 'Only admins and depot managers can create purchase orders'
      });
    }

    const {
      vendorId,
      items, // Array of { productId, quantity, unitPrice (optional) }
      deliveryAddress,
      expectedDeliveryDate,
      paymentTerms,
      notes
    } = req.body;

    if (!vendorId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID and items are required'
      });
    }

    // Verify vendor exists
    const Vendor = require('../models/Vendor');
    const PurchaseOrder = require('../models/PurchaseOrder');
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Build PO items with product details
    const poItems = [];
    let subtotal = 0;
    let totalTaxAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.productId} not found`
        });
      }

      // Check if product belongs to the vendor
      if (product.vendorId.toString() !== vendorId) {
        return res.status(400).json({
          success: false,
          message: `Product ${product.productCode} does not belong to the selected vendor`
        });
      }

      const quantity = item.quantity || 1;
      const unitPrice = item.unitPrice || product.finalPrice || product.basePrice;
      const totalPrice = quantity * unitPrice;
      subtotal += totalPrice;

      // Calculate tax for this item
      const productTaxRate = (product.taxRate || 18) / 100;
      const itemTax = totalPrice * productTaxRate;
      totalTaxAmount += itemTax;

      poItems.push({
        sparePartId: product._id, // Using sparePartId field for compatibility
        partNumber: product.productCode,
        partName: product.productName,
        description: product.description,
        category: product.category,
        quantity,
        unit: product.stock?.unit || 'pieces',
        unitPrice,
        totalPrice,
        image: product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url,
        specifications: product.specifications || {}
      });
    }
    
    const totalAmount = subtotal + totalTaxAmount;

    // Generate PO number
    const poNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // ALL purchase orders require admin approval before sending to vendor
    const APPROVAL_THRESHOLD = 50000; // ₹50,000 (for reference)
    const requiresApproval = true; // All orders require approval
    const initialStatus = 'pending_approval'; // Always start with pending approval

    // Create purchase order
    const purchaseOrder = new PurchaseOrder({
      poNumber,
      vendorId,
      vendorName: vendor.companyName,
      vendorEmail: vendor.email,
      vendorPhone: vendor.phone,
      requestedBy: req.user._id,
      requestedByName: req.user.name || req.user.email,
      depotId: req.user.depotId,
      depotName: req.user.depotName,
      items: poItems,
      subtotal,
      tax: {
        cgst: totalTaxAmount / 2,
        sgst: totalTaxAmount / 2,
        total: totalTaxAmount
      },
      totalAmount,
      deliveryAddress: deliveryAddress || {
        depotId: req.user.depotId,
        address: req.user.depotName || 'Depot Address'
      },
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
      paymentTerms: paymentTerms || 'Net 30',
      notes,
      status: initialStatus,
      requiresApproval: requiresApproval,
      approvalThreshold: APPROVAL_THRESHOLD,
      createdBy: req.user._id
    });

    await purchaseOrder.save();

    // Populate for response
    await purchaseOrder.populate('items.sparePartId', 'productName productCode images');
    await purchaseOrder.populate('vendorId', 'companyName email phone');
    await purchaseOrder.populate('depotId', 'depotName depotCode');

    const message = requiresApproval 
      ? 'Purchase order created and pending admin approval'
      : 'Purchase order created successfully';

    res.status(201).json({
      success: true,
      message,
      data: { 
        purchaseOrder,
        requiresApproval,
        approvalThreshold: APPROVAL_THRESHOLD
      }
    });
  } catch (error) {
    logger.error('Create purchase order from products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase order',
      error: error.message
    });
  }
});


module.exports = router;

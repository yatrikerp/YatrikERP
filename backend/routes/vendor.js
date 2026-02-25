const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Vendor = require('../models/Vendor');
const PurchaseOrder = require('../models/PurchaseOrder');
const SparePart = require('../models/SparePart');
const Invoice = require('../models/Invoice');
const { auth, requireRole } = require('../middleware/auth');
const { logger } = require('../src/core/logger');

// =================================================================
// VENDOR AUTHENTICATION
// =================================================================

// POST /api/vendor/register - Vendor registration (auto-approval logic)
router.post('/register', async (req, res) => {
  try {
    const {
      companyName,
      companyType,
      email,
      phone,
      password,
      panNumber,
      gstNumber,
      address,
      bankDetails
    } = req.body;

    // Validation
    if (!companyName || !email || !password || !panNumber) {
      return res.status(400).json({
        success: false,
        message: 'Company name, email, password, and PAN are required'
      });
    }

    // Check for duplicate vendor (PAN + Company Name)
    const existingVendor = await Vendor.findOne({
      $or: [
        { email: email.toLowerCase() },
        { panNumber: panNumber.toUpperCase() },
        { companyName: { $regex: new RegExp(`^${companyName}$`, 'i') } }
      ]
    });

    if (existingVendor) {
      return res.status(400).json({
        success: false,
        message: 'Vendor already exists with this email, PAN, or company name'
      });
    }

    // Calculate fraud score (simplified - in production, use ML)
    let fraudScore = 0;
    if (!gstNumber) fraudScore += 10;
    if (!bankDetails?.accountNumber) fraudScore += 15;

    // Auto-approval logic
    const autoApproved = fraudScore < 20;
    const status = autoApproved ? 'approved' : 'pending';
    const verificationStatus = autoApproved ? 'verified' : 'pending';

    // Create vendor
    const vendor = new Vendor({
      companyName,
      companyType: companyType || 'other',
      email: email.toLowerCase(),
      phone,
      password,
      panNumber: panNumber.toUpperCase(),
      gstNumber: gstNumber?.toUpperCase(),
      address,
      bankDetails,
      status,
      verificationStatus,
      autoApproved,
      fraudScore,
      trustScore: autoApproved ? 50 : 30,
      complianceScore: autoApproved ? 50 : 30,
      deliveryReliabilityScore: 50
    });

    await vendor.save();

    // Generate token if auto-approved
    let token = null;
    if (autoApproved) {
      token = jwt.sign(
        { vendorId: vendor._id, email: vendor.email, role: 'vendor' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );
    }

    res.status(201).json({
      success: true,
      message: autoApproved ? 'Vendor registered and approved automatically' : 'Vendor registered. Pending admin approval.',
      data: {
        vendor: {
          _id: vendor._id,
          companyName: vendor.companyName,
          email: vendor.email,
          status: vendor.status,
          autoApproved: vendor.autoApproved
        },
        token
      }
    });
  } catch (error) {
    logger.error('Vendor registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// POST /api/vendor/login - Vendor login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const vendor = await Vendor.findOne({ email: email.toLowerCase() }).select('+password');

    if (!vendor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check status - allow active, approved, or pending vendors
    if (vendor.status !== 'active' && vendor.status !== 'approved' && vendor.status !== 'pending') {
      return res.status(403).json({
        success: false,
        message: `Account is ${vendor.status}. Please contact administrator.`
      });
    }

    // Verify password
    const isMatch = await vendor.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    vendor.lastLogin = new Date();
    await vendor.save();

    // Generate token (match unified auth token structure)
    const token = jwt.sign(
      { 
        userId: vendor._id,
        vendorId: vendor._id, 
        email: vendor.email, 
        role: 'vendor',
        roleType: 'external',
        name: vendor.companyName
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const vendorData = vendor.toObject();
    delete vendorData.password;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: vendor._id,
        vendorId: vendor._id,
        name: vendor.companyName,
        email: vendor.email,
        phone: vendor.phone,
        role: 'vendor',
        roleType: 'external',
        status: vendor.status,
        companyName: vendor.companyName,
        trustScore: vendor.trustScore,
        complianceScore: vendor.complianceScore,
        verificationStatus: vendor.verificationStatus
      },
      vendor: vendorData,
      redirectPath: '/vendor/dashboard'
    });
  } catch (error) {
    logger.error('Vendor login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// =================================================================
// VENDOR DASHBOARD
// =================================================================

// GET /api/vendor/dashboard - Vendor dashboard overview (Flipkart-style)
router.get('/dashboard', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get Purchase Order stats
    const poStats = await PurchaseOrder.aggregate([
      { $match: { vendorId: new mongoose.Types.ObjectId(vendorId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const statsMap = {};
    let totalRevenue = 0;
    let completedRevenue = 0;
    let pendingPayments = 0;
    
    poStats.forEach(stat => {
      statsMap[stat._id] = stat.count;
      if (['delivered', 'completed'].includes(stat._id)) {
        totalRevenue += stat.totalAmount;
        completedRevenue += stat.totalAmount;
      }
      if (stat._id === 'delivered') {
        pendingPayments += stat.totalAmount * 0.7; // 70% pending after delivery
      }
    });

    // Get total active listings (spare parts where vendor is preferred)
    const activeListings = await SparePart.countDocuments({
      'preferredVendors.vendorId': new mongoose.Types.ObjectId(vendorId),
      $or: [
        { status: { $in: ['active', 'available'] } },
        { isActive: true },
        { status: { $exists: false }, isActive: { $exists: false } } // Count all if no status field
      ]
    });

    // Get active auctions participated (mock data for now - integrate with auction system)
    const activeAuctions = await PurchaseOrder.countDocuments({
      vendorId: new mongoose.Types.ObjectId(vendorId),
      status: { $in: ['pending', 'accepted', 'in_progress'] }
    });

    // Calculate performance rating (average of trust, compliance, and delivery scores)
    const performanceRating = Math.round(
      (vendor.trustScore + vendor.complianceScore + vendor.deliveryReliabilityScore) / 3
    );

    // Generate performance graph data (last 7 days)
    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Get orders for this date (use createdAt if orderDate doesn't exist)
      const dayOrders = await PurchaseOrder.countDocuments({
        vendorId: new mongoose.Types.ObjectId(vendorId),
        $or: [
          {
            orderDate: {
              $gte: new Date(dateStr + 'T00:00:00'),
              $lt: new Date(dateStr + 'T23:59:59')
            }
          },
          {
            createdAt: {
              $gte: new Date(dateStr + 'T00:00:00'),
              $lt: new Date(dateStr + 'T23:59:59')
            }
          }
        ]
      });
      
      last7Days.push({
        date: dateStr,
        orders: dayOrders,
        revenue: dayOrders * 10000 // Mock revenue calculation
      });
    }

    // Generate alerts
    const alerts = [];
    if (statsMap.pending > 5) {
      alerts.push({
        type: 'warning',
        message: `You have ${statsMap.pending} pending purchase orders. Please review them.`,
        priority: 'high'
      });
    }
    if (vendor.trustScore < 60) {
      alerts.push({
        type: 'error',
        message: 'Your trust score is below average. Improve delivery performance to increase it.',
        priority: 'high'
      });
    }
    if (pendingPayments > 100000) {
      alerts.push({
        type: 'info',
        message: `You have ₹${pendingPayments.toLocaleString('en-IN')} in pending payments.`,
        priority: 'medium'
      });
    }
    if (activeListings === 0) {
      alerts.push({
        type: 'warning',
        message: 'You have no active listings. Add products to start receiving orders.',
        priority: 'medium'
      });
    }

    const dashboard = {
      vendor: {
        companyName: vendor.companyName,
        status: vendor.status,
        trustScore: vendor.trustScore,
        complianceScore: vendor.complianceScore,
        deliveryReliabilityScore: vendor.deliveryReliabilityScore,
        performanceRating: performanceRating,
        walletBalance: 0, // TODO: Add wallet field to Vendor model
        escrowBalance: 0 // TODO: Add escrow field to Vendor model
      },
      stats: {
        // KPI Cards
        totalActiveListings: activeListings,
        activeAuctionsParticipated: activeAuctions,
        ordersReceived: (statsMap.pending || 0) + (statsMap.accepted || 0) + (statsMap.in_progress || 0) + (statsMap.delivered || 0) + (statsMap.completed || 0),
        paymentsPending: Math.round(pendingPayments),
        paymentsCompleted: Math.round(completedRevenue * 0.3), // 30% already paid
        trustScore: vendor.trustScore,
        performanceRating: performanceRating,
        
        // Detailed stats
        pendingPOs: statsMap.pending || 0,
        acceptedPOs: statsMap.accepted || 0,
        inProgressPOs: statsMap.in_progress || 0,
        deliveredPOs: statsMap.delivered || 0,
        completedPOs: statsMap.completed || 0,
        activeWorkOrders: (statsMap.accepted || 0) + (statsMap.in_progress || 0),
        totalRevenue: totalRevenue,
        pendingPayments: Math.round(pendingPayments)
      },
      performance: {
        rating: performanceRating,
        trustScore: vendor.trustScore,
        complianceScore: vendor.complianceScore,
        deliveryReliabilityScore: vendor.deliveryReliabilityScore,
        graphData: last7Days
      },
      alerts: alerts,
      recentActivity: [] // TODO: add recent activity tracking
    };

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    logger.error('Vendor dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// GET /api/vendor/profile - Get vendor profile
router.get('/profile', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const vendor = await Vendor.findById(vendorId).select('-password');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      data: { vendor }
    });
  } catch (error) {
    logger.error('Get vendor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// PUT /api/vendor/profile - Update vendor profile
router.put('/profile', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.password;
    delete updates.status;
    delete updates.trustScore;
    delete updates._id;

    const vendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { vendor }
    });
  } catch (error) {
    logger.error('Update vendor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// =================================================================
// PURCHASE ORDERS & WORK ORDERS (Placeholder routes)
// =================================================================

// GET /api/vendor/purchase-orders - Get purchase orders (Flipkart-style with filters)
router.get('/purchase-orders', auth, async (req, res) => {
  try {
    // Get vendorId - try multiple sources
    let vendorId = req.user.vendorId || req.user._id;
    
    // If vendorId is not set, try to find vendor by user email or companyName
    if (!vendorId || vendorId.toString() === req.user._id.toString()) {
      const Vendor = require('../models/Vendor');
      const vendor = await Vendor.findOne({ 
        $or: [
          { email: req.user.email },
          { companyName: req.user.companyName || req.user.name }
        ]
      });
      if (vendor) {
        vendorId = vendor._id;
        logger.info(`🔍 [VENDOR PO FETCH] Found vendor by email/name: ${vendorId}`);
      }
    }
    
    // Log for debugging
    logger.info(`🔍 [VENDOR PO FETCH] User ID: ${req.user._id}, Vendor ID: ${vendorId}, Role: ${req.user.role}, Email: ${req.user.email}, Company: ${req.user.companyName || req.user.name}`);
    
    const { 
      status, 
      page = 1, 
      limit = 20, 
      sortBy = 'orderDate', 
      sortOrder = 'desc',
      search,
      fromDate,
      toDate
    } = req.query;

    // Build query - SHOW ALL ADMIN-APPROVED POs TO ALL VENDORS
    // All vendors can see all purchase orders that are approved by admin
    let query = {};
    
    // Get vendor name for reference (not used for filtering)
    const vendorName = req.user.companyName || req.user.name || '';
    
    // REMOVED: Vendor-specific filtering - now showing ALL approved POs to ALL vendors
    // This allows all vendors to see all admin-approved purchase orders
    // query.vendorId is NOT set, so it will return POs for all vendors
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { poNumber: { $regex: search, $options: 'i' } },
        { vendorName: { $regex: search, $options: 'i' } },
        { 'items.partName': { $regex: search, $options: 'i' } },
        { 'items.partNumber': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add status filter if provided
    if (status && status !== '') {
      query.status = status;
    } else {
      // If no status filter, show all statuses that vendor should see
      // CRITICAL: Include 'pending' status (which is set when admin approves)
      query.status = { 
        $in: ['pending', 'accepted', 'in_progress', 'partially_delivered', 'delivered', 'completed']
      };
    }
    
    logger.info(`🔍 [VENDOR PO QUERY] Showing ALL approved POs to ALL vendors. Status filter: ${status || 'all approved statuses'}`);
    logger.info(`🔍 [VENDOR PO QUERY] Full query:`, JSON.stringify(query, null, 2));
    
    // DEBUG: Check ALL approved POs in database (all vendors)
    const debugQuery = {
      status: { $in: ['pending', 'accepted', 'in_progress', 'partially_delivered', 'delivered', 'completed'] }
    };
    const allPOsDebug = await PurchaseOrder.find(debugQuery)
      .select('poNumber status vendorId vendorName createdAt orderDate')
      .limit(10)
      .lean();
    logger.info(`🔍 [DEBUG] Total approved POs in DB (all vendors): ${await PurchaseOrder.countDocuments(debugQuery)}`);
    if (allPOsDebug.length > 0) {
      logger.info(`🔍 [DEBUG] Sample approved POs:`, allPOsDebug.map(po => ({
        poNumber: po.poNumber,
        status: po.status,
        vendorId: po.vendorId?.toString(),
        vendorName: po.vendorName,
        orderDate: po.orderDate
      })));
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { poNumber: { $regex: search, $options: 'i' } },
        { vendorName: { $regex: search, $options: 'i' } },
        { 'items.partName': { $regex: search, $options: 'i' } },
        { 'items.partNumber': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (fromDate || toDate) {
      query.orderDate = {};
      if (fromDate) query.orderDate.$gte = new Date(fromDate);
      if (toDate) query.orderDate.$lte = new Date(toDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Fetch purchase orders with populated items - ALL approved POs for ALL vendors
    let purchaseOrders = await PurchaseOrder.find(query)
      .populate('items.sparePartId', 'partName partNumber images category')
      .populate('depotId', 'depotName depotCode')
      .populate('requestedBy', 'name email')
      .populate('vendorId', 'companyName email phone') // Populate vendor info so vendors can see which vendor each PO belongs to
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // REMOVED: All vendor-specific filtering and fallback queries
    // Now showing ALL approved POs to ALL vendors

    // REMOVED: Security filtering - now showing ALL approved POs to ALL vendors
    // All vendors can see all admin-approved purchase orders
    
    // Log results for debugging
    logger.info(`✅ [VENDOR PO RESULT] Found ${purchaseOrders.length} purchase orders (ALL vendors can see ALL approved POs)`);
    if (purchaseOrders.length > 0) {
      logger.info(`✅ [VENDOR PO RESULT] Sample POs:`, purchaseOrders.slice(0, 3).map(po => ({
        poNumber: po.poNumber,
        status: po.status,
        vendorId: po.vendorId?.toString(),
        vendorName: po.vendorName,
        orderDate: po.orderDate
      })));
    } else {
      logger.error(`❌ [VENDOR PO RESULT] No POs found - vendorId: ${vendorId}, vendorName: ${vendorName}`);
      logger.error(`❌ [VENDOR PO RESULT] Query used:`, JSON.stringify(query, null, 2));
    }

    // Get total count for pagination - use the SAME query to ensure vendor isolation
    // SECURITY: Always use the original query, never use purchaseOrders[0].vendorId (could be from different vendor)
    const total = await PurchaseOrder.countDocuments(query);

    // Calculate summary stats - for ALL approved POs (not vendor-specific)
    const statsQuery = {
      status: { $in: ['pending', 'accepted', 'in_progress', 'partially_delivered', 'delivered', 'completed'] }
    };
    
    const stats = {
      total: await PurchaseOrder.countDocuments(statsQuery),
      pending: await PurchaseOrder.countDocuments({ ...statsQuery, status: 'pending' }),
      accepted: await PurchaseOrder.countDocuments({ ...statsQuery, status: 'accepted' }),
      in_progress: await PurchaseOrder.countDocuments({ ...statsQuery, status: 'in_progress' }),
      delivered: await PurchaseOrder.countDocuments({ ...statsQuery, status: 'delivered' }),
      totalAmount: await PurchaseOrder.aggregate([
        { $match: statsQuery },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).then(result => result[0]?.total || 0)
    };

    res.json({
      success: true,
      data: {
        purchaseOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        stats
      }
    });
  } catch (error) {
    logger.error('Get purchase orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase orders',
      error: error.message
    });
  }
});

// GET /api/vendor/purchase-orders/:poId - Get single purchase order details
router.get('/purchase-orders/:poId', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const { poId } = req.params;

    const purchaseOrder = await PurchaseOrder.findOne({
      _id: poId,
      vendorId
    })
      .populate('items.sparePartId')
      .populate('depotId', 'depotName depotCode address')
      .populate('requestedBy', 'name email phone')
      .populate('qualityCheck.checkedBy', 'name email')
      .lean();

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    res.json({
      success: true,
      data: { purchaseOrder }
    });
  } catch (error) {
    logger.error('Get purchase order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase order',
      error: error.message
    });
  }
});

// POST /api/vendor/purchase-orders/:poId/accept - Accept purchase order
router.post('/purchase-orders/:poId/accept', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const { poId } = req.params;
    const { message, expectedDeliveryDate } = req.body;

    const purchaseOrder = await PurchaseOrder.findOne({
      _id: poId,
      vendorId,
      status: 'pending'
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found or already processed'
      });
    }

    purchaseOrder.status = 'accepted';
    purchaseOrder.acceptedDate = new Date();
    purchaseOrder.vendorResponse = {
      status: 'accepted',
      message: message || 'Purchase order accepted',
      respondedAt: new Date()
    };
    
    if (expectedDeliveryDate) {
      purchaseOrder.expectedDeliveryDate = new Date(expectedDeliveryDate);
    }

    await purchaseOrder.save();

    res.json({
      success: true,
      message: 'Purchase order accepted successfully',
      data: { purchaseOrder }
    });
  } catch (error) {
    logger.error('Accept purchase order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept purchase order',
      error: error.message
    });
  }
});

// POST /api/vendor/purchase-orders/:poId/reject - Reject purchase order
router.post('/purchase-orders/:poId/reject', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const { poId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const purchaseOrder = await PurchaseOrder.findOne({
      _id: poId,
      vendorId,
      status: 'pending'
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found or already processed'
      });
    }

    // Release reserved stock when vendor rejects PO
    const Product = require('../models/Product');
    for (const item of purchaseOrder.items) {
      try {
        const product = await Product.findById(item.sparePartId);
        if (product && product.stock) {
          const quantityToRelease = item.quantity || 0;
          product.stock.quantity = (product.stock.quantity || 0) + quantityToRelease;
          product.stock.reserved = Math.max(0, (product.stock.reserved || 0) - quantityToRelease);
          await product.save();
        }
      } catch (stockError) {
        logger.error(`Error releasing stock for product ${item.sparePartId}:`, stockError);
        // Continue with other items even if one fails
      }
    }

    purchaseOrder.status = 'rejected';
    purchaseOrder.rejectedDate = new Date();
    purchaseOrder.vendorResponse = {
      status: 'rejected',
      message: reason,
      respondedAt: new Date()
    };

    await purchaseOrder.save();

    res.json({
      success: true,
      message: 'Purchase order rejected',
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

// POST /api/vendor/purchase-orders/:poId/update-delivery - Update delivery status
router.post('/purchase-orders/:poId/update-delivery', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const { poId } = req.params;
    const { trackingNumber, shippingMethod, deliveryStatus, items } = req.body;

    const purchaseOrder = await PurchaseOrder.findOne({
      _id: poId,
      vendorId,
      status: { $in: ['accepted', 'in_progress'] }
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found or cannot be updated'
      });
    }

    if (trackingNumber) purchaseOrder.trackingNumber = trackingNumber;
    if (shippingMethod) purchaseOrder.shippingMethod = shippingMethod;
    if (deliveryStatus) {
      purchaseOrder.deliveryStatus = {
        ...purchaseOrder.deliveryStatus,
        status: deliveryStatus
      };
      
      if (deliveryStatus === 'delivered' || deliveryStatus === 'partial') {
        purchaseOrder.status = deliveryStatus === 'delivered' ? 'delivered' : 'partially_delivered';
        purchaseOrder.actualDeliveryDate = new Date();
      } else if (deliveryStatus === 'in_transit') {
        purchaseOrder.status = 'in_progress';
      }
    }
    
    if (items && Array.isArray(items)) {
      purchaseOrder.deliveryStatus.items = items;
    }

    await purchaseOrder.save();

    res.json({
      success: true,
      message: 'Delivery status updated successfully',
      data: { purchaseOrder }
    });
  } catch (error) {
    logger.error('Update delivery status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update delivery status',
      error: error.message
    });
  }
});

// PUT /api/vendor/purchase-orders/:poId/dispatch - Mark PO as dispatched
router.put('/purchase-orders/:poId/dispatch', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const { poId } = req.params;
    const { lrNumber, vehicleNumber, dispatchDate } = req.body;

    if (!lrNumber || !vehicleNumber || !dispatchDate) {
      return res.status(400).json({
        success: false,
        message: 'LR Number, Vehicle Number, and Dispatch Date are required'
      });
    }

    const purchaseOrder = await PurchaseOrder.findOne({
      _id: poId,
      vendorId,
      status: { $in: ['accepted', 'in_progress'] }
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found or cannot be dispatched'
      });
    }

    // Update PO status to dispatched - waiting for payment before delivery can start
    purchaseOrder.status = 'dispatched_awaiting_payment';
    purchaseOrder.deliveryStatus = {
      ...purchaseOrder.deliveryStatus,
      status: 'dispatched_awaiting_payment' // New status: dispatched but waiting for payment
    };
    purchaseOrder.trackingNumber = lrNumber;
    purchaseOrder.shippingMethod = vehicleNumber;
    purchaseOrder.dispatchDate = new Date(dispatchDate);
    
    // Store dispatch details in documents or notes
    if (!purchaseOrder.vendorNotes) {
      purchaseOrder.vendorNotes = '';
    }
    purchaseOrder.vendorNotes += `\nDispatched on ${new Date(dispatchDate).toLocaleDateString()} - LR: ${lrNumber}, Vehicle: ${vehicleNumber}. Waiting for payment before delivery can start.`;

    await purchaseOrder.save();

    res.json({
      success: true,
      message: 'Purchase order marked as dispatched successfully',
      data: { purchaseOrder }
    });
  } catch (error) {
    logger.error('Dispatch purchase order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dispatch purchase order',
      error: error.message
    });
  }
});

// GET /api/vendor/invoices - Get invoices (auto-generated from POs)
router.get('/invoices', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const { status, page = 1, limit = 20, fromDate, toDate } = req.query;
    
    // Build query
    const query = { vendorId: new mongoose.Types.ObjectId(vendorId) };
    if (status) query.status = status;
    if (fromDate || toDate) {
      query.invoiceDate = {};
      if (fromDate) query.invoiceDate.$gte = new Date(fromDate);
      if (toDate) query.invoiceDate.$lte = new Date(toDate);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const invoices = await Invoice.find(query)
      .populate('purchaseOrderId', 'poNumber status')
      .populate('buyerId', 'depotName depotCode')
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Invoice.countDocuments(query);
    
    // Calculate summary
    const summary = await Invoice.aggregate([
      { $match: { vendorId: new mongoose.Types.ObjectId(vendorId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          paidAmount: { $sum: '$paidAmount' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        summary: summary.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            totalAmount: item.totalAmount,
            paidAmount: item.paidAmount
          };
          return acc;
        }, {})
      }
    });
  } catch (error) {
    logger.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: error.message
    });
  }
});

// GET /api/vendor/invoices/:invoiceId - Get single invoice
router.get('/invoices/:invoiceId', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const { invoiceId } = req.params;
    
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      vendorId: new mongoose.Types.ObjectId(vendorId)
    })
      .populate('purchaseOrderId')
      .populate('buyerId')
      .populate('vendorId')
      .lean();
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.json({
      success: true,
      data: { invoice }
    });
  } catch (error) {
    logger.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: error.message
    });
  }
});

// GET /api/vendor/invoices/:invoiceId/download - Download invoice PDF
router.get('/invoices/:invoiceId/download', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const { invoiceId } = req.params;
    
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      vendorId: new mongoose.Types.ObjectId(vendorId)
    }).lean();
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    // Return PDF URL if exists, otherwise return invoice data for frontend PDF generation
    if (invoice.pdfUrl) {
      return res.json({
        success: true,
        data: { pdfUrl: invoice.pdfUrl }
      });
    }
    
    // Return invoice data for frontend to generate PDF
    res.json({
      success: true,
      data: { invoice, generatePDF: true }
    });
  } catch (error) {
    logger.error('Download invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download invoice',
      error: error.message
    });
  }
});

// GET /api/vendor/payments - Get payment tracking & ledger
router.get('/payments', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const { page = 1, limit = 20, status, fromDate, toDate } = req.query;
    
    // Get all invoices for payment tracking
    const query = { vendorId: new mongoose.Types.ObjectId(vendorId) };
    if (status) query.paymentStatus = status;
    if (fromDate || toDate) {
      query.invoiceDate = {};
      if (fromDate) query.invoiceDate.$gte = new Date(fromDate);
      if (toDate) query.invoiceDate.$lte = new Date(toDate);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const invoices = await Invoice.find(query)
      .select('invoiceNumber invoiceDate dueDate totalAmount subtotal tax paidAmount dueAmount paymentStatus paymentDate paymentMethod transactionId purchaseOrderId paymentTerms status buyerId buyerName')
      .populate('purchaseOrderId', 'poNumber')
      .populate('buyerId', 'depotName depotCode')
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Invoice.countDocuments(query);
    
    // Calculate payment summary
    const summary = await Invoice.aggregate([
      { $match: { vendorId: new mongoose.Types.ObjectId(vendorId) } },
      {
        $group: {
          _id: null,
          totalInvoiced: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          totalPending: { $sum: '$dueAmount' },
          pendingCount: {
            $sum: { $cond: [{ $gt: ['$dueAmount', 0] }, 1, 0] }
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
          }
        }
      }
    ]);
    
    const paymentSummary = summary[0] || {
      totalInvoiced: 0,
      totalPaid: 0,
      totalPending: 0,
      pendingCount: 0,
      paidCount: 0
    };
    
    // Payment flow: Invoice Approved → Payment Scheduled → Paid
    const paymentFlow = invoices.map(inv => ({
      _id: inv._id,
      invoiceId: inv._id,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      poNumber: inv.purchaseOrderId?.poNumber || inv.poNumber || 'N/A',
      purchaseOrderId: inv.purchaseOrderId?._id || inv.purchaseOrderId,
      amount: inv.totalAmount || 0,
      subtotal: inv.subtotal || 0,
      taxAmount: inv.tax?.total || 0,
      cgst: inv.tax?.cgst || 0,
      sgst: inv.tax?.sgst || 0,
      paidAmount: inv.paidAmount || 0,
      dueAmount: inv.dueAmount || (inv.totalAmount || 0) - (inv.paidAmount || 0),
      status: inv.paymentStatus || 'pending',
      invoiceStatus: inv.status || 'generated',
      paymentDate: inv.paymentDate || null,
      paymentMethod: inv.paymentMethod || null,
      transactionId: inv.transactionId || null,
      paymentTerms: inv.paymentTerms || 'Net 30',
      stage: inv.paymentStatus === 'paid' ? 'Paid' : 
             inv.paymentStatus === 'partial' ? 'Partially Paid' :
             inv.status === 'approved' ? 'Payment Scheduled' :
             inv.status === 'generated' ? 'Invoice Generated' : 'Pending Approval',
      daysOverdue: inv.dueDate ? Math.max(0, Math.floor((new Date() - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24))) : 0,
      buyerName: inv.buyerName || inv.buyerId?.depotName || 'N/A',
      buyerId: inv.buyerId?._id || inv.buyerId
    }));
    
    res.json({
      success: true,
      data: {
        payments: paymentFlow,
        summary: paymentSummary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
});

// POST /api/vendor/invoices - Submit invoice for a PO
router.post('/invoices', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const { poId, invoiceNumber, invoiceDate, invoiceAmount, gstAmount, fileUrl } = req.body;

    // Validation
    if (!poId || !invoiceNumber || !invoiceDate || !invoiceAmount) {
      return res.status(400).json({
        success: false,
        message: 'PO ID, Invoice Number, Invoice Date, and Invoice Amount are required'
      });
    }

    // Find the purchase order
    const purchaseOrder = await PurchaseOrder.findOne({
      _id: poId,
      vendorId: new mongoose.Types.ObjectId(vendorId),
      status: { $in: ['delivered', 'partially_delivered'] }
    }).populate('depotId', 'depotName depotCode address city state pincode');

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found or cannot be invoiced'
      });
    }

    // Check if invoice already exists for this PO
    const existingInvoice = await Invoice.findOne({
      purchaseOrderId: poId,
      vendorId: new mongoose.Types.ObjectId(vendorId)
    });

    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Invoice already exists for this purchase order'
      });
    }

    // Validate invoice amount matches PO amount (allow small variance for rounding)
    const amountDifference = Math.abs(invoiceAmount - purchaseOrder.totalAmount);
    if (amountDifference > 1) { // Allow 1 rupee difference for rounding
      return res.status(400).json({
        success: false,
        message: `Invoice amount (${invoiceAmount}) does not match PO amount (${purchaseOrder.totalAmount})`
      });
    }

    // Get vendor details
    const vendor = await Vendor.findById(vendorId).lean();

    // Create invoice
    const invoice = new Invoice({
      invoiceNumber: invoiceNumber.toUpperCase(),
      vendorId: new mongoose.Types.ObjectId(vendorId),
      vendorName: vendor?.companyName || purchaseOrder.vendorName,
      vendorGST: vendor?.gstNumber,
      vendorPAN: vendor?.panNumber,
      vendorAddress: vendor?.address,
      buyerId: purchaseOrder.depotId?._id || purchaseOrder.depotId,
      buyerName: purchaseOrder.depotId?.depotName || purchaseOrder.depotName,
      buyerAddress: purchaseOrder.depotId?.address || purchaseOrder.deliveryAddress,
      purchaseOrderId: poId,
      poNumber: purchaseOrder.poNumber,
      items: purchaseOrder.items.map(item => ({
        partNumber: item.partNumber,
        partName: item.partName,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        hsnCode: item.hsnCode,
        taxRate: item.taxRate
      })),
      subtotal: purchaseOrder.subtotal,
      tax: purchaseOrder.tax,
      discount: purchaseOrder.discount,
      shippingCharges: purchaseOrder.shippingCharges,
      totalAmount: invoiceAmount,
      invoiceDate: new Date(invoiceDate),
      dueDate: new Date(new Date(invoiceDate).getTime() + 30 * 24 * 60 * 60 * 1000), // Net 30
      status: 'submitted',
      paymentStatus: 'pending',
      paymentTerms: purchaseOrder.paymentTerms || 'Net 30',
      fileUrl: fileUrl || null
    });

    await invoice.save();

    // Update PO with invoice reference
    purchaseOrder.invoiceId = invoice._id;
    purchaseOrder.invoiceNumber = invoice.invoiceNumber;
    purchaseOrder.status = purchaseOrder.status === 'delivered' ? 'completed' : purchaseOrder.status;
    await purchaseOrder.save();

    res.status(201).json({
      success: true,
      message: 'Invoice submitted successfully',
      data: { invoice }
    });
  } catch (error) {
    logger.error('Submit invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit invoice',
      error: error.message
    });
  }
});

// GET /api/vendor/ledger - Get vendor ledger (Opening Balance + Invoices - Payments)
router.get('/ledger', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const { fromDate, toDate, page = 1, limit = 50 } = req.query;

    // Get vendor opening balance (if stored, otherwise 0)
    const vendor = await Vendor.findById(vendorId).select('openingBalance walletBalance').lean();
    const openingBalance = vendor?.openingBalance || 0;

    // Build date filter
    const dateFilter = {};
    if (fromDate || toDate) {
      dateFilter.invoiceDate = {};
      if (fromDate) dateFilter.invoiceDate.$gte = new Date(fromDate);
      if (toDate) dateFilter.invoiceDate.$lte = new Date(toDate);
    }

    // Get all invoices for the vendor
    const invoices = await Invoice.find({
      vendorId: new mongoose.Types.ObjectId(vendorId),
      ...dateFilter
    })
      .populate('purchaseOrderId', 'poNumber')
      .populate('buyerId', 'depotName')
      .sort({ invoiceDate: 1 })
      .lean();

    // Build ledger entries
    let runningBalance = openingBalance;
    const ledgerEntries = [];

    invoices.forEach(invoice => {
      // Invoice entry (credit - increases balance)
      ledgerEntries.push({
        date: invoice.invoiceDate,
        type: 'invoice',
        reference: invoice.invoiceNumber,
        poNumber: invoice.purchaseOrderId?.poNumber || invoice.poNumber,
        description: `Invoice ${invoice.invoiceNumber} - PO ${invoice.poNumber}`,
        debit: 0,
        credit: invoice.totalAmount,
        balance: runningBalance + invoice.totalAmount
      });
      runningBalance += invoice.totalAmount;

      // Payment entry (debit - decreases balance) if paid
      if (invoice.paidAmount > 0 && invoice.paymentDate) {
        ledgerEntries.push({
          date: invoice.paymentDate,
          type: 'payment',
          reference: invoice.transactionId || invoice.invoiceNumber,
          poNumber: invoice.purchaseOrderId?.poNumber || invoice.poNumber,
          description: `Payment received for Invoice ${invoice.invoiceNumber}`,
          debit: invoice.paidAmount,
          credit: 0,
          balance: runningBalance - invoice.paidAmount,
          paymentMethod: invoice.paymentMethod
        });
        runningBalance -= invoice.paidAmount;
      }
    });

    // Sort by date
    ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedEntries = ledgerEntries.slice(skip, skip + parseInt(limit));

    // Calculate summary
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const closingBalance = openingBalance + totalInvoiced - totalPaid;

    res.json({
      success: true,
      data: {
        openingBalance,
        closingBalance,
        totalInvoiced,
        totalPaid,
        totalPending: totalInvoiced - totalPaid,
        entries: paginatedEntries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: ledgerEntries.length,
          pages: Math.ceil(ledgerEntries.length / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get ledger error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ledger',
      error: error.message
    });
  }
});

// GET /api/vendor/trust-score - Get trust score calculation
router.get('/trust-score', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    
    // Calculate trust score based on:
    // 1. Past deliveries (on-time percentage)
    // 2. Invoice accuracy
    // 3. Delivery delays
    
    const completedPOs = await PurchaseOrder.find({
      vendorId: new mongoose.Types.ObjectId(vendorId),
      status: { $in: ['delivered', 'completed'] }
    }).lean();
    
    const totalPOs = completedPOs.length;
    let onTimeDeliveries = 0;
    let delayedDeliveries = 0;
    let totalDelayDays = 0;
    
    completedPOs.forEach(po => {
      if (po.expectedDeliveryDate && po.actualDeliveryDate) {
        const delay = (new Date(po.actualDeliveryDate) - new Date(po.expectedDeliveryDate)) / (1000 * 60 * 60 * 24);
        if (delay <= 0) {
          onTimeDeliveries++;
        } else {
          delayedDeliveries++;
          totalDelayDays += delay;
        }
      } else if (po.actualDeliveryDate) {
        onTimeDeliveries++; // No expected date, consider on-time
      }
    });
    
    const onTimePercentage = totalPOs > 0 ? (onTimeDeliveries / totalPOs) * 100 : 100;
    const avgDelayDays = delayedDeliveries > 0 ? totalDelayDays / delayedDeliveries : 0;
    
    // Trust score calculation (0-100)
    let trustScore = 50; // Base score
    
    // On-time delivery bonus (up to +40 points)
    trustScore += (onTimePercentage / 100) * 40;
    
    // Delay penalty (up to -30 points)
    if (avgDelayDays > 0) {
      trustScore -= Math.min(avgDelayDays * 5, 30);
    }
    
    // Invoice accuracy (assume 100% if no issues reported)
    trustScore += 10;
    
    trustScore = Math.max(0, Math.min(100, Math.round(trustScore)));
    
    // Update vendor trust score
    await Vendor.findByIdAndUpdate(vendorId, {
      trustScore,
      deliveryReliabilityScore: Math.round(onTimePercentage)
    });
    
    res.json({
      success: true,
      data: {
        trustScore,
        onTimePercentage: Math.round(onTimePercentage),
        totalDeliveries: totalPOs,
        onTimeDeliveries,
        delayedDeliveries,
        avgDelayDays: Math.round(avgDelayDays * 10) / 10,
        breakdown: {
          baseScore: 50,
          onTimeBonus: Math.round((onTimePercentage / 100) * 40),
          delayPenalty: Math.min(Math.round(avgDelayDays * 5), 30),
          invoiceAccuracy: 10
        }
      }
    });
  } catch (error) {
    logger.error('Get trust score error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate trust score',
      error: error.message
    });
  }
});

// GET /api/vendor/performance - Get performance & SLA dashboard
router.get('/performance', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const vendor = await Vendor.findById(vendorId);
    
    // Get performance metrics from POs
    const allPOs = await PurchaseOrder.find({
      vendorId: new mongoose.Types.ObjectId(vendorId)
    }).lean();
    
    const performanceMetrics = {
      totalOrders: allPOs.length,
      completedOrders: allPOs.filter(po => ['delivered', 'completed'].includes(po.status)).length,
      pendingOrders: allPOs.filter(po => ['pending', 'accepted', 'in_progress'].includes(po.status)).length,
      totalRevenue: allPOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0),
      avgOrderValue: allPOs.length > 0 ? 
        allPOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0) / allPOs.length : 0
    };
    
    res.json({
      success: true,
      data: {
        trustScore: vendor.trustScore,
        complianceScore: vendor.complianceScore,
        deliveryReliabilityScore: vendor.deliveryReliabilityScore,
        performanceMetrics,
        rating: vendor.rating || 0,
        totalOrders: vendor.totalOrders || 0
      }
    });
  } catch (error) {
    logger.error('Get performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance data',
      error: error.message
    });
  }
});

// GET /api/vendor/notifications - Get system-triggered notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    
    // Get recent POs for notifications
    const recentPOs = await PurchaseOrder.find({ vendorId: new mongoose.Types.ObjectId(vendorId) })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    // Get pending POs
    const pendingPOs = await PurchaseOrder.countDocuments({
      vendorId: new mongoose.Types.ObjectId(vendorId),
      status: 'pending'
    });
    
    // Get overdue deliveries
    const overdueDeliveries = await PurchaseOrder.countDocuments({
      vendorId: new mongoose.Types.ObjectId(vendorId),
      status: { $in: ['accepted', 'in_progress'] },
      expectedDeliveryDate: { $lt: new Date() }
    });
    
    // Generate notifications
    const notifications = [];
    
    if (pendingPOs > 0) {
      notifications.push({
        id: 'po-pending',
        type: 'po',
        title: 'New Purchase Orders',
        message: `You have ${pendingPOs} pending purchase order(s) awaiting your response.`,
        timestamp: new Date(),
        read: false,
        priority: 'high'
      });
    }
    
    if (overdueDeliveries > 0) {
      notifications.push({
        id: 'delivery-overdue',
        type: 'delivery',
        title: 'Delivery Deadline Reminder',
        message: `You have ${overdueDeliveries} delivery(ies) past their expected date.`,
        timestamp: new Date(),
        read: false,
        priority: 'high'
      });
    }
    
    if (recentPOs.length > 0) {
      recentPOs.forEach((po, idx) => {
        if (po.status === 'pending' && idx < 3) {
          notifications.push({
            id: `po-${po._id}`,
            type: 'po',
            title: 'New Purchase Order',
            message: `You have received a new PO: ${po.poNumber}`,
            timestamp: po.createdAt || new Date(),
            read: false,
            priority: 'medium',
            poNumber: po.poNumber
          });
        }
      });
    }
    
    res.json({
      success: true,
      data: { notifications }
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// GET /api/vendor/audit-log - Get audit and compliance log
router.get('/audit-log', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const { page = 1, limit = 50 } = req.query;
    
    // Get POs for audit log
    const purchaseOrders = await PurchaseOrder.find({ vendorId: new mongoose.Types.ObjectId(vendorId) })
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();
    
    // Get invoices for audit log
    const invoices = await Invoice.find({ vendorId: new mongoose.Types.ObjectId(vendorId) })
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();
    
    // Build audit log
    const auditLog = [];
    
    purchaseOrders.forEach(po => {
      if (po.acceptedDate) {
        auditLog.push({
          id: `po-accept-${po._id}`,
          action: 'PO_ACCEPTED',
          description: `Accepted Purchase Order ${po.poNumber}`,
          timestamp: po.acceptedDate,
          poNumber: po.poNumber,
          amount: po.totalAmount
        });
      }
      if (po.rejectedDate) {
        auditLog.push({
          id: `po-reject-${po._id}`,
          action: 'PO_REJECTED',
          description: `Rejected Purchase Order ${po.poNumber}`,
          timestamp: po.rejectedDate,
          poNumber: po.poNumber,
          reason: po.vendorResponse?.message
        });
      }
      if (po.actualDeliveryDate) {
        auditLog.push({
          id: `po-delivery-${po._id}`,
          action: 'DELIVERY_UPDATED',
          description: `Updated delivery status to "${po.status}" for ${po.poNumber}`,
          timestamp: po.actualDeliveryDate,
          poNumber: po.poNumber,
          trackingNumber: po.trackingNumber
        });
      }
    });
    
    invoices.forEach(inv => {
      auditLog.push({
        id: `inv-view-${inv._id}`,
        action: 'INVOICE_GENERATED',
        description: `Invoice ${inv.invoiceNumber} generated from PO ${inv.poNumber}`,
        timestamp: inv.invoiceDate || inv.createdAt,
        invoiceNumber: inv.invoiceNumber,
        poNumber: inv.poNumber,
        amount: inv.totalAmount
      });
      
      if (inv.paymentDate) {
        auditLog.push({
          id: `inv-payment-${inv._id}`,
          action: 'PAYMENT_RECEIVED',
          description: `Payment received for Invoice ${inv.invoiceNumber}`,
          timestamp: inv.paymentDate,
          invoiceNumber: inv.invoiceNumber,
          amount: inv.paidAmount
        });
      }
    });
    
    // Sort by timestamp
    auditLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
      success: true,
      data: {
        auditLog: auditLog.slice(0, parseInt(limit)),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: auditLog.length
        }
      }
    });
  } catch (error) {
    logger.error('Get audit log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log',
      error: error.message
    });
  }
});

// GET /api/vendor/debug/purchase-orders - Debug endpoint to check PO visibility
router.get('/debug/purchase-orders', auth, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    
    // Get all POs for this vendor (any status) - try multiple vendorId formats
    const allPOs = await PurchaseOrder.find({
      $or: [
        { vendorId: mongoose.Types.ObjectId.isValid(vendorId) ? new mongoose.Types.ObjectId(vendorId) : vendorId },
        { vendorId: vendorId.toString() },
        { vendorName: req.user.companyName || req.user.name }
      ]
    })
      .select('poNumber status vendorId vendorName createdAt orderDate')
      .lean();
    
    // Get pending POs specifically
    const pendingPOs = await PurchaseOrder.find({
      $or: [
        { vendorId: mongoose.Types.ObjectId.isValid(vendorId) ? new mongoose.Types.ObjectId(vendorId) : vendorId },
        { vendorId: vendorId.toString() }
      ],
      status: 'pending'
    })
      .select('poNumber status vendorId vendorName createdAt orderDate')
      .lean();
    
    res.json({
      success: true,
      debug: {
        vendorId: vendorId,
        vendorIdType: typeof vendorId,
        vendorIdIsObjectId: mongoose.Types.ObjectId.isValid(vendorId),
        userCompanyName: req.user.companyName || req.user.name,
        totalPOs: allPOs.length,
        pendingPOs: pendingPOs.length,
        allPOs: allPOs.map(po => ({
          poNumber: po.poNumber,
          status: po.status,
          vendorId: po.vendorId?.toString(),
          vendorName: po.vendorName,
          createdAt: po.createdAt,
          orderDate: po.orderDate
        })),
        pendingPOsList: pendingPOs.map(po => ({
          poNumber: po.poNumber,
          status: po.status,
          vendorId: po.vendorId?.toString(),
          vendorName: po.vendorName
        }))
      }
    });
  } catch (error) {
    logger.error('Debug PO endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;





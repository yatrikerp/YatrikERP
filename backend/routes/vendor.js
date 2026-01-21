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
    console.error('Vendor registration error:', error);
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

    // Check if account is locked
    if (vendor.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked. Please try again later.'
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
      vendor.loginAttempts += 1;
      if (vendor.loginAttempts >= 5) {
        vendor.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
      }
      await vendor.save();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts
    vendor.loginAttempts = 0;
    vendor.lockUntil = null;
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
    console.error('Vendor login error:', error);
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
    console.error('Vendor dashboard error:', error);
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
    console.error('Get vendor profile error:', error);
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
    console.error('Update vendor profile error:', error);
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
    const vendorId = req.user.vendorId || req.user._id;
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

    // Build query
    const query = { vendorId };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { poNumber: { $regex: search, $options: 'i' } },
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

    // Fetch purchase orders with populated items
    const purchaseOrders = await PurchaseOrder.find(query)
      .populate('items.sparePartId', 'partName partNumber images category')
      .populate('depotId', 'depotName depotCode')
      .populate('requestedBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await PurchaseOrder.countDocuments(query);

    // Calculate summary stats
    const stats = {
      total: await PurchaseOrder.countDocuments({ vendorId }),
      pending: await PurchaseOrder.countDocuments({ vendorId, status: 'pending' }),
      accepted: await PurchaseOrder.countDocuments({ vendorId, status: 'accepted' }),
      in_progress: await PurchaseOrder.countDocuments({ vendorId, status: 'in_progress' }),
      delivered: await PurchaseOrder.countDocuments({ vendorId, status: 'delivered' }),
      totalAmount: await PurchaseOrder.aggregate([
        { $match: { vendorId: new mongoose.Types.ObjectId(vendorId) } },
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
    console.error('Get purchase orders error:', error);
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
    console.error('Get purchase order error:', error);
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
    console.error('Accept purchase order error:', error);
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
    console.error('Reject purchase order error:', error);
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
    console.error('Update delivery status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update delivery status',
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
    console.error('Get invoices error:', error);
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
    console.error('Get invoice error:', error);
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
    console.error('Download invoice error:', error);
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
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
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
    console.error('Get trust score error:', error);
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
    console.error('Get performance error:', error);
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
    console.error('Get notifications error:', error);
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
    console.error('Get audit log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log',
      error: error.message
    });
  }
});

module.exports = router;





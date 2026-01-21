/**
 * Vendor Controller
 * Handles all HTTP requests for vendor endpoints
 */

const vendorService = require('../services/vendorService');
// Logger - use console if logger not available
let logger;
try {
  logger = require('../src/core/logger').logger;
} catch (e) {
  logger = console;
}

/**
 * GET /api/vendor/dashboard
 * Get vendor dashboard overview with stats and KPIs
 */
const getDashboard = async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    
    const dashboard = await vendorService.getDashboardData(vendorId);
    
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    logger.error('Vendor dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message,
      data: {
        vendor: {},
        stats: {
          activeWorkOrders: 0,
          pendingPOs: 0,
          totalRevenue: 0,
          pendingPayments: 0,
          ordersReceived: 0,
          completedPOs: 0,
          inProgressPOs: 0,
          totalActiveListings: 0
        },
        alerts: []
      }
    });
  }
};

/**
 * GET /api/vendor/profile
 * Get vendor profile information
 */
const getProfile = async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    
    const profile = await vendorService.getProfile(vendorId);
    
    res.json({
      success: true,
      data: {
        vendor: profile
      }
    });
  } catch (error) {
    logger.error('Vendor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message,
      data: {
        vendor: {}
      }
    });
  }
};

/**
 * GET /api/vendor/purchase-orders
 * Get list of purchase orders for the vendor
 */
const getPurchaseOrders = async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const { status, page = 1, limit = 20 } = req.query;
    
    const result = await vendorService.getPurchaseOrders(vendorId, {
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get purchase orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase orders',
      error: error.message,
      data: {
        purchaseOrders: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        }
      }
    });
  }
};

/**
 * GET /api/vendor/invoices
 * Get list of invoices for the vendor
 */
const getInvoices = async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const { status, page = 1, limit = 20, fromDate, toDate } = req.query;
    
    const result = await vendorService.getInvoices(vendorId, {
      status,
      page: parseInt(page),
      limit: parseInt(limit),
      fromDate,
      toDate
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: error.message,
      data: {
        invoices: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        },
        summary: {}
      }
    });
  }
};

/**
 * GET /api/vendor/payments
 * Get payment ledger and history
 */
const getPayments = async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const { status, page = 1, limit = 20 } = req.query;
    
    const result = await vendorService.getPayments(vendorId, {
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message,
      data: {
        payments: [],
        summary: {
          totalInvoiced: 0,
          totalPaid: 0,
          totalPending: 0,
          paidCount: 0
        }
      }
    });
  }
};

/**
 * GET /api/vendor/trust-score
 * Get vendor trust score and breakdown
 */
const getTrustScore = async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    
    const trustScore = await vendorService.getTrustScore(vendorId);
    
    res.json({
      success: true,
      data: trustScore
    });
  } catch (error) {
    logger.error('Get trust score error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trust score',
      error: error.message,
      data: {
        trustScore: 0,
        onTimePercentage: 0,
        totalDeliveries: 0,
        onTimeDeliveries: 0,
        delayedDeliveries: 0,
        avgDelayDays: 0,
        breakdown: {
          baseScore: 50,
          onTimeBonus: 0,
          delayPenalty: 0,
          invoiceAccuracy: 10
        }
      }
    });
  }
};

/**
 * GET /api/vendor/notifications
 * Get system-triggered notifications
 */
const getNotifications = async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    
    const notifications = await vendorService.getNotifications(vendorId);
    
    res.json({
      success: true,
      data: {
        notifications
      }
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
      data: {
        notifications: []
      }
    });
  }
};

/**
 * GET /api/vendor/audit-log
 * Get audit and compliance log
 */
const getAuditLog = async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const { page = 1, limit = 50 } = req.query;
    
    const result = await vendorService.getAuditLog(vendorId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get audit log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log',
      error: error.message,
      data: {
        auditLog: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0
        }
      }
    });
  }
};

/**
 * GET /api/vendor/spare-parts
 * Get list of spare parts for the vendor
 */
const getSpareParts = async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user._id;
    const { category, status, search, page = 1, limit = 20 } = req.query;
    
    const result = await vendorService.getSpareParts(vendorId, {
      category,
      status,
      search,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get spare parts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch spare parts',
      error: error.message,
      data: {
        spareParts: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        },
        categories: []
      }
    });
  }
};

module.exports = {
  getDashboard,
  getProfile,
  getPurchaseOrders,
  getInvoices,
  getPayments,
  getTrustScore,
  getNotifications,
  getAuditLog,
  getSpareParts
};

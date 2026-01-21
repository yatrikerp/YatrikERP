/**
 * Vendor Service
 * Business logic for vendor operations
 */

const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');
const PurchaseOrder = require('../models/PurchaseOrder');
const Invoice = require('../models/Invoice');
const SparePart = require('../models/SparePart');
// Logger - use console if logger not available
let logger;
try {
  logger = require('../src/core/logger').logger;
} catch (e) {
  logger = console;
}

/**
 * Get dashboard data for vendor
 */
const getDashboardData = async (vendorId) => {
  try {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
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
        totalRevenue += stat.totalAmount || 0;
        completedRevenue += stat.totalAmount || 0;
      }
      if (stat._id === 'delivered') {
        pendingPayments += (stat.totalAmount || 0) * 0.7; // 70% pending after delivery
      }
    });

    // Get total active listings
    const activeListings = await SparePart.countDocuments({
      'preferredVendors.vendorId': new mongoose.Types.ObjectId(vendorId),
      $or: [
        { status: { $in: ['active', 'available'] } },
        { isActive: true },
        { status: { $exists: false }, isActive: { $exists: false } }
      ]
    });

    // Get active purchase orders
    const activeAuctions = await PurchaseOrder.countDocuments({
      vendorId: new mongoose.Types.ObjectId(vendorId),
      status: { $in: ['pending', 'accepted', 'in_progress'] }
    });

    // Calculate performance rating
    const performanceRating = Math.round(
      ((vendor.trustScore || 0) + (vendor.complianceScore || 0) + (vendor.deliveryReliabilityScore || 0)) / 3
    );

    // Generate performance graph data (last 7 days)
    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
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
    if ((statsMap.pending || 0) > 5) {
      alerts.push({
        type: 'warning',
        message: `You have ${statsMap.pending} pending purchase orders. Please review them.`,
        priority: 'high'
      });
    }
    if ((vendor.trustScore || 0) < 60) {
      alerts.push({
        type: 'error',
        message: 'Your trust score is below average. Improve delivery performance to increase it.',
        priority: 'high'
      });
    }
    if (pendingPayments > 100000) {
      alerts.push({
        type: 'info',
        message: `You have ₹${Math.round(pendingPayments).toLocaleString('en-IN')} in pending payments.`,
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

    return {
      vendor: {
        _id: vendor._id,
        companyName: vendor.companyName,
        email: vendor.email,
        phone: vendor.phone,
        status: vendor.status,
        trustScore: vendor.trustScore || 0,
        complianceScore: vendor.complianceScore || 0,
        deliveryReliabilityScore: vendor.deliveryReliabilityScore || 0,
        performanceRating: performanceRating,
        verificationStatus: vendor.verificationStatus || 'pending'
      },
      stats: {
        activeWorkOrders: (statsMap.accepted || 0) + (statsMap['in_progress'] || 0),
        pendingPOs: statsMap.pending || 0,
        completedPOs: statsMap.completed || 0,
        inProgressPOs: statsMap['in_progress'] || 0,
        totalRevenue: totalRevenue || 0,
        pendingPayments: Math.round(pendingPayments),
        ordersReceived: Object.values(statsMap).reduce((a, b) => a + b, 0),
        totalActiveListings: activeListings || 0
      },
      performance: {
        rating: performanceRating,
        trustScore: vendor.trustScore || 0,
        complianceScore: vendor.complianceScore || 0,
        deliveryReliabilityScore: vendor.deliveryReliabilityScore || 0,
        graphData: last7Days
      },
      alerts: alerts
    };
  } catch (error) {
    logger.error('Get dashboard data error:', error);
    throw error;
  }
};

/**
 * Get vendor profile
 */
const getProfile = async (vendorId) => {
  try {
    const vendor = await Vendor.findById(vendorId).select('-password');
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    return vendor.toObject();
  } catch (error) {
    logger.error('Get profile error:', error);
    throw error;
  }
};

/**
 * Get purchase orders
 */
const getPurchaseOrders = async (vendorId, options = {}) => {
  try {
    const { status, page = 1, limit = 20 } = options;
    
    const query = { vendorId: new mongoose.Types.ObjectId(vendorId) };
    
    // Vendors should only see purchase orders that have been sent to them
    // (not draft or pending_approval status)
    query.status = { 
      $nin: ['draft', 'pending_approval', 'cancelled'] 
    };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    const purchaseOrders = await PurchaseOrder.find(query)
      .populate('depotId', 'depotName depotCode')
      .populate('requestedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await PurchaseOrder.countDocuments(query);
    
    return {
      purchaseOrders: purchaseOrders || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Get purchase orders error:', error);
    throw error;
  }
};

/**
 * Get invoices
 */
const getInvoices = async (vendorId, options = {}) => {
  try {
    const { status, page = 1, limit = 20, fromDate, toDate } = options;
    
    const query = { vendorId: new mongoose.Types.ObjectId(vendorId) };
    if (status && status !== 'all') {
      query.status = status;
    }
    if (fromDate || toDate) {
      query.invoiceDate = {};
      if (fromDate) query.invoiceDate.$gte = new Date(fromDate);
      if (toDate) query.invoiceDate.$lte = new Date(toDate);
    }
    
    const skip = (page - 1) * limit;
    const invoices = await Invoice.find(query)
      .populate('purchaseOrderId', 'poNumber status')
      .populate('buyerId', 'depotName depotCode')
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(limit)
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
    
    const summaryMap = summary.reduce((acc, item) => {
      acc[item._id] = {
        count: item.count,
        totalAmount: item.totalAmount,
        paidAmount: item.paidAmount
      };
      return acc;
    }, {});
    
    return {
      invoices: invoices || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary: summaryMap
    };
  } catch (error) {
    logger.error('Get invoices error:', error);
    throw error;
  }
};

/**
 * Get payments
 */
const getPayments = async (vendorId, options = {}) => {
  try {
    const { status, page = 1, limit = 20 } = options;
    
    // Get invoices and convert to payment format
    const invoiceQuery = { vendorId: new mongoose.Types.ObjectId(vendorId) };
    if (status && status !== 'all') {
      if (status === 'pending') {
        invoiceQuery.paymentStatus = { $in: ['pending', 'partial'] };
      } else if (status === 'paid') {
        invoiceQuery.paymentStatus = 'paid';
      }
    }
    
    const skip = (page - 1) * limit;
    const invoices = await Invoice.find(invoiceQuery)
      .populate('purchaseOrderId', 'poNumber')
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Invoice.countDocuments(invoiceQuery);
    
    // Convert invoices to payment format
    const payments = invoices.map(inv => ({
      invoiceNumber: inv.invoiceNumber,
      poNumber: inv.purchaseOrderId?.poNumber || inv.poNumber || 'N/A',
      amount: inv.totalAmount || 0,
      paidAmount: inv.paidAmount || 0,
      dueAmount: inv.dueAmount || 0,
      stage: inv.status === 'paid' ? 'Paid' : 
             inv.status === 'approved' ? 'Payment Scheduled' :
             inv.paymentStatus === 'partial' ? 'Partially Paid' : 'Pending',
      paymentDate: inv.paymentDate || null
    }));
    
    // Calculate summary
    const summaryResult = await Invoice.aggregate([
      { $match: { vendorId: new mongoose.Types.ObjectId(vendorId) } },
      {
        $group: {
          _id: null,
          totalInvoiced: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
          }
        }
      }
    ]);
    
    const summary = summaryResult[0] || {
      totalInvoiced: 0,
      totalPaid: 0,
      paidCount: 0
    };
    summary.totalPending = (summary.totalInvoiced || 0) - (summary.totalPaid || 0);
    
    return {
      payments: payments || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary
    };
  } catch (error) {
    logger.error('Get payments error:', error);
    throw error;
  }
};

/**
 * Get trust score
 */
const getTrustScore = async (vendorId) => {
  try {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Get delivery performance
    const deliveries = await PurchaseOrder.find({
      vendorId: new mongoose.Types.ObjectId(vendorId),
      status: { $in: ['delivered', 'completed'] }
    }).lean();

    const totalDeliveries = deliveries.length;
    const onTimeDeliveries = deliveries.filter(po => {
      if (!po.expectedDeliveryDate || !po.actualDeliveryDate) return false;
      return new Date(po.actualDeliveryDate) <= new Date(po.expectedDeliveryDate);
    }).length;
    
    const delayedDeliveries = totalDeliveries - onTimeDeliveries;
    const onTimePercentage = totalDeliveries > 0 
      ? Math.round((onTimeDeliveries / totalDeliveries) * 100) 
      : 100;

    // Calculate average delay
    let totalDelayDays = 0;
    let delayedCount = 0;
    deliveries.forEach(po => {
      if (po.expectedDeliveryDate && po.actualDeliveryDate) {
        const delay = Math.max(0, 
          Math.ceil((new Date(po.actualDeliveryDate) - new Date(po.expectedDeliveryDate)) / (1000 * 60 * 60 * 24))
        );
        if (delay > 0) {
          totalDelayDays += delay;
          delayedCount++;
        }
      }
    });
    const avgDelayDays = delayedCount > 0 ? Math.round(totalDelayDays / delayedCount) : 0;

    // Calculate trust score breakdown
    const baseScore = 50;
    const onTimeBonus = Math.min(30, Math.round(onTimePercentage * 0.3));
    const delayPenalty = Math.min(20, avgDelayDays * 2);
    const invoiceAccuracy = 10; // Placeholder - would calculate from invoice accuracy
    
    const trustScore = Math.max(0, Math.min(100, 
      baseScore + onTimeBonus - delayPenalty + invoiceAccuracy
    ));

    // Update vendor trust score
    if (vendor.trustScore !== trustScore) {
      await Vendor.findByIdAndUpdate(vendorId, { trustScore });
    }

    return {
      trustScore,
      onTimePercentage,
      totalDeliveries,
      onTimeDeliveries,
      delayedDeliveries,
      avgDelayDays,
      breakdown: {
        baseScore,
        onTimeBonus,
        delayPenalty,
        invoiceAccuracy
      }
    };
  } catch (error) {
    logger.error('Get trust score error:', error);
    throw error;
  }
};

/**
 * Get notifications
 */
const getNotifications = async (vendorId) => {
  try {
    const notifications = [];
    
    // Get pending POs
    const pendingPOs = await PurchaseOrder.countDocuments({
      vendorId: new mongoose.Types.ObjectId(vendorId),
      status: 'pending'
    });
    
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
    
    // Get overdue deliveries
    const overdueDeliveries = await PurchaseOrder.countDocuments({
      vendorId: new mongoose.Types.ObjectId(vendorId),
      status: { $in: ['accepted', 'in_progress'] },
      expectedDeliveryDate: { $lt: new Date() }
    });
    
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
    
    // Get recent POs
    const recentPOs = await PurchaseOrder.find({
      vendorId: new mongoose.Types.ObjectId(vendorId),
      status: 'pending'
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    
    recentPOs.forEach((po, idx) => {
      notifications.push({
        id: `po-${po._id}`,
        type: 'po',
        title: 'New Purchase Order',
        message: `You have received a new PO: ${po.poNumber || po._id}`,
        timestamp: po.createdAt || new Date(),
        read: false,
        priority: 'medium',
        poNumber: po.poNumber
      });
    });
    
    return notifications;
  } catch (error) {
    logger.error('Get notifications error:', error);
    throw error;
  }
};

/**
 * Get audit log
 */
const getAuditLog = async (vendorId, options = {}) => {
  try {
    const { page = 1, limit = 50 } = options;
    
    const auditLog = [];
    
    // Get POs for audit log
    const purchaseOrders = await PurchaseOrder.find({
      vendorId: new mongoose.Types.ObjectId(vendorId)
    })
      .sort({ updatedAt: -1 })
      .limit(limit * 2) // Get more to filter
      .lean();
    
    // Get invoices for audit log
    const invoices = await Invoice.find({
      vendorId: new mongoose.Types.ObjectId(vendorId)
    })
      .sort({ updatedAt: -1 })
      .limit(limit * 2)
      .lean();
    
    // Build audit log from POs
    purchaseOrders.forEach(po => {
      if (po.acceptedDate) {
        auditLog.push({
          id: `po-accept-${po._id}`,
          action: 'PO_ACCEPTED',
          description: `Accepted Purchase Order ${po.poNumber || po._id}`,
          timestamp: po.acceptedDate,
          poNumber: po.poNumber || po._id.toString(),
          amount: po.totalAmount || 0
        });
      }
      if (po.rejectedDate) {
        auditLog.push({
          id: `po-reject-${po._id}`,
          action: 'PO_REJECTED',
          description: `Rejected Purchase Order ${po.poNumber || po._id}`,
          timestamp: po.rejectedDate,
          poNumber: po.poNumber || po._id.toString(),
          reason: po.vendorResponse?.message || 'No reason provided'
        });
      }
      if (po.actualDeliveryDate) {
        auditLog.push({
          id: `po-delivery-${po._id}`,
          action: 'DELIVERY_UPDATED',
          description: `Updated delivery status to "${po.status}" for ${po.poNumber || po._id}`,
          timestamp: po.actualDeliveryDate,
          poNumber: po.poNumber || po._id.toString(),
          trackingNumber: po.trackingNumber || null
        });
      }
    });
    
    // Build audit log from invoices
    invoices.forEach(inv => {
      auditLog.push({
        id: `inv-view-${inv._id}`,
        action: 'INVOICE_GENERATED',
        description: `Invoice ${inv.invoiceNumber} generated from PO ${inv.poNumber || 'N/A'}`,
        timestamp: inv.invoiceDate || inv.createdAt,
        invoiceNumber: inv.invoiceNumber,
        poNumber: inv.poNumber || 'N/A',
        amount: inv.totalAmount || 0
      });
      
      if (inv.paymentDate) {
        auditLog.push({
          id: `inv-payment-${inv._id}`,
          action: 'PAYMENT_RECEIVED',
          description: `Payment received for Invoice ${inv.invoiceNumber}`,
          timestamp: inv.paymentDate,
          invoiceNumber: inv.invoiceNumber,
          amount: inv.paidAmount || 0
        });
      }
    });
    
    // Sort by timestamp and paginate
    auditLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const total = auditLog.length;
    const paginatedLog = auditLog.slice((page - 1) * limit, page * limit);
    
    return {
      auditLog: paginatedLog,
      pagination: {
        page,
        limit,
        total
      }
    };
  } catch (error) {
    logger.error('Get audit log error:', error);
    throw error;
  }
};

/**
 * Get spare parts
 */
const getSpareParts = async (vendorId, options = {}) => {
  try {
    const { category, status, search, page = 1, limit = 20 } = options;
    
    const query = {
      'preferredVendors.vendorId': new mongoose.Types.ObjectId(vendorId)
    };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    if (status && status !== 'all') {
      query.status = status;
    } else {
      query.status = { $in: ['active', 'inactive'] };
    }
    if (search) {
      query.$or = [
        { partName: { $regex: search, $options: 'i' } },
        { partNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    const spareParts = await SparePart.find(query)
      .populate('preferredVendors.vendorId', 'companyName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get vendor-specific pricing
    const sparePartsWithVendorPrice = spareParts.map(part => {
      const vendorInfo = part.preferredVendors?.find(
        v => v.vendorId && (v.vendorId._id?.toString() === vendorId.toString() || v.vendorId.toString() === vendorId.toString())
      );
      return {
        ...part,
        vendorPrice: vendorInfo?.price || part.basePrice,
        leadTime: vendorInfo?.leadTime || 7,
        rating: vendorInfo?.rating || 0,
        preferredVendors: undefined // Remove from response
      };
    });
    
    const total = await SparePart.countDocuments(query);
    
    // Get categories
    const categories = await SparePart.distinct('category', query);
    
    return {
      spareParts: sparePartsWithVendorPrice || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      categories
    };
  } catch (error) {
    logger.error('Get spare parts error:', error);
    throw error;
  }
};

module.exports = {
  getDashboardData,
  getProfile,
  getPurchaseOrders,
  getInvoices,
  getPayments,
  getTrustScore,
  getNotifications,
  getAuditLog,
  getSpareParts
};

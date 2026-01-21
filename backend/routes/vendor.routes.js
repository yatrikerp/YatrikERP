/**
 * Vendor Routes
 * All vendor API endpoints
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const vendorController = require('../controllers/vendorController');

// =================================================================
// VENDOR DASHBOARD ENDPOINTS
// =================================================================

/**
 * GET /api/vendor/dashboard
 * Get vendor dashboard overview with stats and KPIs
 */
router.get('/dashboard', auth, vendorController.getDashboard);

/**
 * GET /api/vendor/profile
 * Get vendor profile information
 */
router.get('/profile', auth, vendorController.getProfile);

/**
 * GET /api/vendor/purchase-orders
 * Get list of purchase orders for the vendor
 * Query params: status, page, limit
 */
router.get('/purchase-orders', auth, vendorController.getPurchaseOrders);

/**
 * GET /api/vendor/invoices
 * Get list of invoices for the vendor
 * Query params: status, page, limit, fromDate, toDate
 */
router.get('/invoices', auth, vendorController.getInvoices);

/**
 * GET /api/vendor/payments
 * Get payment ledger and history
 * Query params: status, page, limit
 */
router.get('/payments', auth, vendorController.getPayments);

/**
 * GET /api/vendor/trust-score
 * Get vendor trust score and breakdown
 */
router.get('/trust-score', auth, vendorController.getTrustScore);

/**
 * GET /api/vendor/notifications
 * Get system-triggered notifications
 */
router.get('/notifications', auth, vendorController.getNotifications);

/**
 * GET /api/vendor/audit-log
 * Get audit and compliance log
 * Query params: page, limit
 */
router.get('/audit-log', auth, vendorController.getAuditLog);

/**
 * GET /api/vendor/spare-parts
 * Get list of spare parts for the vendor
 * Query params: category, status, search, page, limit
 */
router.get('/spare-parts', auth, vendorController.getSpareParts);

module.exports = router;

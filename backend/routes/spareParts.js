const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SparePart = require('../models/SparePart');
const PurchaseOrder = require('../models/PurchaseOrder');
const Vendor = require('../models/Vendor');
const { auth, requireRole } = require('../middleware/auth');

// =================================================================
// SPARE PARTS MANAGEMENT (Admin & Depot)
// =================================================================

// GET /api/spare-parts - Get all spare parts with filters
router.get('/', auth, async (req, res) => {
  try {
    const {
      category,
      status,
      search,
      page = 1,
      limit = 50,
      sortBy = 'partName',
      sortOrder = 'asc',
      lowStock,
      needsReorder
    } = req.query;

    const query = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (lowStock === 'true') {
      query.$expr = {
        $lte: ['$stock.current', '$stock.minimum']
      };
    }
    if (needsReorder === 'true') {
      query.$expr = {
        $lte: ['$stock.current', '$procurementDetails.reorderPoint']
      };
    }
    if (search) {
      query.$or = [
        { partName: { $regex: search, $options: 'i' } },
        { partNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const spareParts = await SparePart.find(query)
      .populate('preferredVendors.vendorId', 'companyName email phone')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await SparePart.countDocuments(query);

    // Get categories for filter
    const categories = await SparePart.distinct('category');

    res.json({
      success: true,
      data: {
        spareParts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        categories,
        filters: {
          category,
          status,
          search,
          lowStock,
          needsReorder
        }
      }
    });
  } catch (error) {
    console.error('Get spare parts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch spare parts',
      error: error.message
    });
  }
});

// GET /api/spare-parts/:id - Get single spare part
router.get('/:id', auth, async (req, res) => {
  try {
    const sparePart = await SparePart.findById(req.params.id)
      .populate('preferredVendors.vendorId', 'companyName email phone status trustScore')
      .lean();

    if (!sparePart) {
      return res.status(404).json({
        success: false,
        message: 'Spare part not found'
      });
    }

    res.json({
      success: true,
      data: { sparePart }
    });
  } catch (error) {
    console.error('Get spare part error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch spare part',
      error: error.message
    });
  }
});

// POST /api/spare-parts - Create new spare part
router.post('/', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const sparePartData = req.body;
    sparePartData.createdBy = req.user._id;

    const sparePart = new SparePart(sparePartData);
    await sparePart.save();

    res.status(201).json({
      success: true,
      message: 'Spare part created successfully',
      data: { sparePart }
    });
  } catch (error) {
    console.error('Create spare part error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create spare part',
      error: error.message
    });
  }
});

// PUT /api/spare-parts/:id - Update spare part
router.put('/:id', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const updates = req.body;
    updates.updatedBy = req.user._id;

    const sparePart = await SparePart.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!sparePart) {
      return res.status(404).json({
        success: false,
        message: 'Spare part not found'
      });
    }

    res.json({
      success: true,
      message: 'Spare part updated successfully',
      data: { sparePart }
    });
  } catch (error) {
    console.error('Update spare part error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update spare part',
      error: error.message
    });
  }
});

// DELETE /api/spare-parts/:id - Delete spare part
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const sparePart = await SparePart.findByIdAndDelete(req.params.id);

    if (!sparePart) {
      return res.status(404).json({
        success: false,
        message: 'Spare part not found'
      });
    }

    res.json({
      success: true,
      message: 'Spare part deleted successfully'
    });
  } catch (error) {
    console.error('Delete spare part error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete spare part',
      error: error.message
    });
  }
});

// =================================================================
// PURCHASE ORDER CREATION (Admin & Depot)
// =================================================================

// POST /api/spare-parts/create-po - Create purchase order
router.post('/create-po', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const {
      vendorId,
      items, // Array of { sparePartId, quantity, unitPrice }
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
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Build PO items with spare part details
    const poItems = [];
    let subtotal = 0;

    for (const item of items) {
      const sparePart = await SparePart.findById(item.sparePartId);
      if (!sparePart) {
        return res.status(404).json({
          success: false,
          message: `Spare part ${item.sparePartId} not found`
        });
      }

      const quantity = item.quantity || 1;
      const unitPrice = item.unitPrice || sparePart.basePrice;
      const totalPrice = quantity * unitPrice;
      subtotal += totalPrice;

      poItems.push({
        sparePartId: sparePart._id,
        partNumber: sparePart.partNumber,
        partName: sparePart.partName,
        description: sparePart.description,
        category: sparePart.category,
        quantity,
        unit: sparePart.stock.unit,
        unitPrice,
        totalPrice,
        image: sparePart.images?.find(img => img.isPrimary)?.url || sparePart.images?.[0]?.url,
        specifications: sparePart.specifications
      });
    }

    // Calculate tax (simplified - 18% GST)
    const taxRate = 0.18;
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

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
      requestedByName: req.user.name,
      depotId: req.user.depotId,
      depotName: req.user.depotName,
      items: poItems,
      subtotal,
      tax: {
        cgst: taxAmount / 2,
        sgst: taxAmount / 2,
        total: taxAmount
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
      requiresApproval: requiresApproval || true, // All orders require approval
      approvalThreshold: APPROVAL_THRESHOLD,
      createdBy: req.user._id
    });

    await purchaseOrder.save();

    // Populate for response
    await purchaseOrder.populate('items.sparePartId', 'partName partNumber images');
    await purchaseOrder.populate('vendorId', 'companyName email phone');
    await purchaseOrder.populate('depotId', 'depotName depotCode');

    const message = 'Purchase order created and pending admin approval';

    res.status(201).json({
      success: true,
      message,
      data: { 
        purchaseOrder,
        requiresApproval: true,
        approvalThreshold: APPROVAL_THRESHOLD
      }
    });
  } catch (error) {
    console.error('Create purchase order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase order',
      error: error.message
    });
  }
});

// POST /api/spare-parts/:id/qr-code - Generate QR code for spare part
router.post('/:id/qr-code', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const part = await SparePart.findById(id);
    if (!part) {
      return res.status(404).json({
        success: false,
        message: 'Spare part not found'
      });
    }

    // Generate QR code data
    const qrData = {
      partId: part._id.toString(),
      partNumber: part.partNumber,
      partName: part.partName,
      category: part.category,
      timestamp: new Date().toISOString()
    };

    // Update part with QR code
    part.qrCode = JSON.stringify(qrData);
    await part.save();

    res.json({
      success: true,
      message: 'QR code generated successfully',
      data: {
        qrCode: part.qrCode,
        partNumber: part.partNumber,
        partName: part.partName
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code',
      error: error.message
    });
  }
});

module.exports = router;

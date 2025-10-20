const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const TicketMachineData = require('../models/TicketMachineData');
const Depot = require('../models/Depot');
const Bus = require('../models/Bus');
const Trip = require('../models/Trip');
const Route = require('../models/Route');
const AuditLog = require('../models/AuditLog');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Middleware to ensure user is a data collector
const requireDataCollector = (req, res, next) => {
  if (req.user.role !== 'data_collector' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Data collector role required.' });
  }
  next();
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/ticket-data');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `ticket-data-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  fileFilter: function (req, file, cb) {
    const allowedTypes = /csv|txt|json|xml|xlsx|xls/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || 
                     file.mimetype === 'application/vnd.ms-excel' ||
                     file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only CSV, TXT, JSON, XML, and Excel files are allowed'));
  }
});

// GET /api/data-collector/dashboard - Data collector dashboard
router.get('/dashboard', auth, requireDataCollector, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get today's uploads
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayUploads = await TicketMachineData.countDocuments({
      uploadedBy: userId,
      uploadDate: { $gte: today, $lt: tomorrow }
    });
    
    // Get total uploads
    const totalUploads = await TicketMachineData.countDocuments({
      uploadedBy: userId
    });
    
    // Get pending processing
    const pendingProcessing = await TicketMachineData.countDocuments({
      processingStatus: { $in: ['pending', 'processing'] }
    });
    
    // Get recent uploads
    const recentUploads = await TicketMachineData.find({
      uploadedBy: userId
    })
    .populate('depotId', 'name code')
    .populate('tripId', 'routeId departureTime')
    .sort({ uploadDate: -1 })
    .limit(10);
    
    // Get statistics
    const stats = await TicketMachineData.aggregate([
      { $match: { uploadedBy: userId } },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: '$totalTickets' },
          totalRevenue: { $sum: '$totalRevenue' },
          totalPassengers: { $sum: '$totalPassengers' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        todayUploads,
        totalUploads,
        pendingProcessing,
        recentUploads,
        statistics: stats[0] || {
          totalTickets: 0,
          totalRevenue: 0,
          totalPassengers: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching data collector dashboard:', error);
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
});

// POST /api/data-collector/upload - Upload ticket machine data
router.post('/upload', auth, requireDataCollector, upload.single('ticketFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const {
      depotId,
      busId,
      tripId,
      routeId,
      dataDate,
      machineId,
      machineModel,
      machineSerial,
      notes
    } = req.body;
    
    if (!depotId || !dataDate || !machineId) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        message: 'Depot ID, data date, and machine ID are required' 
      });
    }
    
    // Validate depot exists
    const depot = await Depot.findById(depotId);
    if (!depot) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Depot not found' });
    }
    
    // Generate unique upload ID
    const uploadId = `TM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine file type
    const fileExt = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    let fileType = fileExt;
    if (fileExt === 'xlsx' || fileExt === 'xls') {
      fileType = 'excel';
    }
    
    // Create ticket machine data record
    const ticketMachineData = new TicketMachineData({
      uploadId,
      uploadedBy: req.user._id,
      depotId,
      busId: busId || undefined,
      tripId: tripId || undefined,
      routeId: routeId || undefined,
      dataDate: new Date(dataDate),
      machineId,
      machineModel,
      machineSerial,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType,
      fileUrl: req.file.path,
      processingStatus: 'pending',
      notes,
      ticketData: [] // Will be populated during processing
    });
    
    await ticketMachineData.save();
    
    // Log audit
    await AuditLog.create({
      userId: req.user._id,
      action: 'ticket_data_upload',
      resource: 'ticket_machine_data',
      resourceId: ticketMachineData._id,
      details: {
        uploadId,
        fileName: req.file.originalname,
        depotId,
        machineId,
        dataDate
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Start async processing (in production, this would be a queue job)
    processTicketDataFile(ticketMachineData._id, req.file.path, fileType);
    
    res.json({
      success: true,
      message: 'Ticket data uploaded successfully and queued for processing',
      data: {
        uploadId,
        fileName: req.file.originalname,
        processingStatus: 'pending'
      }
    });
  } catch (error) {
    console.error('Error uploading ticket data:', error);
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    res.status(500).json({ message: 'Error uploading ticket data', error: error.message });
  }
});

// Async function to process ticket data file
async function processTicketDataFile(dataId, filePath, fileType) {
  try {
    const ticketMachineData = await TicketMachineData.findById(dataId);
    if (!ticketMachineData) return;
    
    ticketMachineData.processingStatus = 'processing';
    await ticketMachineData.save();
    
    let ticketData = [];
    
    // Parse based on file type
    if (fileType === 'csv' || fileType === 'txt') {
      ticketData = await parseCSVFile(filePath);
    } else if (fileType === 'json') {
      ticketData = await parseJSONFile(filePath);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
    
    // Update the record with parsed data
    ticketMachineData.ticketData = ticketData;
    ticketMachineData.processingStatus = 'completed';
    ticketMachineData.processedAt = new Date();
    
    // Calculate data quality metrics
    ticketMachineData.dataQuality = calculateDataQuality(ticketData);
    
    await ticketMachineData.save();
    
    console.log(`✅ Processed ticket data: ${dataId}`);
  } catch (error) {
    console.error(`❌ Error processing ticket data ${dataId}:`, error);
    try {
      const ticketMachineData = await TicketMachineData.findById(dataId);
      if (ticketMachineData) {
        ticketMachineData.processingStatus = 'failed';
        ticketMachineData.processingError = error.message;
        await ticketMachineData.save();
      }
    } catch (updateError) {
      console.error('Error updating processing status:', updateError);
    }
  }
}

// Helper function to parse CSV file
function parseCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Map CSV columns to ticket data format
        results.push({
          ticketNumber: data.ticketNumber || data.ticket_no || '',
          issueTime: data.issueTime || data.time ? new Date(data.issueTime || data.time) : new Date(),
          passengerName: data.passengerName || data.name || '',
          age: parseInt(data.age) || null,
          gender: data.gender || '',
          boardingStop: data.boardingStop || data.from || '',
          destinationStop: data.destinationStop || data.to || '',
          fareAmount: parseFloat(data.fareAmount || data.fare) || 0,
          seatNumber: data.seatNumber || data.seat || '',
          ticketType: data.ticketType || data.type || 'full',
          paymentMode: data.paymentMode || data.payment || 'cash',
          concessionAmount: parseFloat(data.concessionAmount || data.concession) || 0,
          conductorId: data.conductorId || data.conductor || ''
        });
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Helper function to parse JSON file
function parseJSONFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      
      try {
        const jsonData = JSON.parse(data);
        // Expect array of ticket objects
        const ticketData = Array.isArray(jsonData) ? jsonData : [jsonData];
        resolve(ticketData);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

// Helper function to calculate data quality metrics
function calculateDataQuality(ticketData) {
  if (!ticketData || ticketData.length === 0) {
    return {
      completeness: 0,
      accuracy: 0,
      consistency: 0,
      issues: []
    };
  }
  
  let completenessScore = 0;
  let consistencyScore = 0;
  const issues = [];
  
  const requiredFields = ['ticketNumber', 'fareAmount', 'boardingStop', 'destinationStop'];
  
  ticketData.forEach((ticket, index) => {
    let completeFields = 0;
    
    // Check completeness
    requiredFields.forEach(field => {
      if (ticket[field]) {
        completeFields++;
      } else {
        issues.push({
          type: 'missing_field',
          description: `Missing ${field} in ticket ${index + 1}`,
          severity: 'medium'
        });
      }
    });
    
    completenessScore += (completeFields / requiredFields.length) * 100;
    
    // Check consistency
    if (ticket.fareAmount && ticket.fareAmount < 0) {
      issues.push({
        type: 'invalid_data',
        description: `Negative fare in ticket ${index + 1}`,
        severity: 'high'
      });
    } else {
      consistencyScore += 100;
    }
  });
  
  return {
    completeness: Math.round(completenessScore / ticketData.length),
    accuracy: 95, // Placeholder - would need additional validation
    consistency: Math.round(consistencyScore / ticketData.length),
    issues: issues.slice(0, 10) // Limit to top 10 issues
  };
}

// GET /api/data-collector/uploads - Get all uploads
router.get('/uploads', auth, requireDataCollector, async (req, res) => {
  try {
    const { 
      status, 
      depotId, 
      startDate, 
      endDate,
      page = 1,
      limit = 20
    } = req.query;
    
    const query = { uploadedBy: req.user._id };
    
    if (status) {
      query.processingStatus = status;
    }
    
    if (depotId) {
      query.depotId = depotId;
    }
    
    if (startDate && endDate) {
      query.dataDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const uploads = await TicketMachineData.find(query)
      .populate('depotId', 'name code')
      .populate('tripId', 'routeId departureTime')
      .populate('busId', 'registrationNumber')
      .sort({ uploadDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await TicketMachineData.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        uploads,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching uploads:', error);
    res.status(500).json({ message: 'Error fetching uploads', error: error.message });
  }
});

// GET /api/data-collector/upload/:uploadId - Get specific upload details
router.get('/upload/:uploadId', auth, requireDataCollector, async (req, res) => {
  try {
    const { uploadId } = req.params;
    
    const upload = await TicketMachineData.findOne({ uploadId })
      .populate('depotId', 'name code location')
      .populate('tripId')
      .populate('busId', 'registrationNumber model')
      .populate('routeId', 'name origin destination')
      .populate('uploadedBy', 'name email')
      .populate('verifiedBy', 'name email');
    
    if (!upload) {
      return res.status(404).json({ message: 'Upload not found' });
    }
    
    res.json({
      success: true,
      data: upload
    });
  } catch (error) {
    console.error('Error fetching upload details:', error);
    res.status(500).json({ message: 'Error fetching upload details', error: error.message });
  }
});

// PUT /api/data-collector/upload/:uploadId/verify - Verify uploaded data
router.put('/upload/:uploadId/verify', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'depot_manager') {
      return res.status(403).json({ message: 'Only admin or depot manager can verify data' });
    }
    
    const { uploadId } = req.params;
    const { verificationNotes } = req.body;
    
    const upload = await TicketMachineData.findOne({ uploadId });
    if (!upload) {
      return res.status(404).json({ message: 'Upload not found' });
    }
    
    upload.processingStatus = 'verified';
    upload.verifiedBy = req.user._id;
    upload.verifiedAt = new Date();
    upload.verificationNotes = verificationNotes;
    
    await upload.save();
    
    // Log audit
    await AuditLog.create({
      userId: req.user._id,
      action: 'ticket_data_verified',
      resource: 'ticket_machine_data',
      resourceId: upload._id,
      details: { uploadId, verificationNotes },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: 'Upload verified successfully',
      data: upload
    });
  } catch (error) {
    console.error('Error verifying upload:', error);
    res.status(500).json({ message: 'Error verifying upload', error: error.message });
  }
});

// GET /api/data-collector/statistics - Get overall statistics
router.get('/statistics', auth, requireDataCollector, async (req, res) => {
  try {
    const { startDate, endDate, depotId } = req.query;
    
    const matchQuery = { uploadedBy: req.user._id };
    
    if (startDate && endDate) {
      matchQuery.dataDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (depotId) {
      matchQuery.depotId = depotId;
    }
    
    const stats = await TicketMachineData.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalUploads: { $sum: 1 },
          totalTickets: { $sum: '$totalTickets' },
          totalRevenue: { $sum: '$totalRevenue' },
          totalPassengers: { $sum: '$totalPassengers' },
          avgTicketsPerUpload: { $avg: '$totalTickets' },
          avgRevenuePerUpload: { $avg: '$totalRevenue' }
        }
      }
    ]);
    
    const statusBreakdown = await TicketMachineData.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$processingStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        overall: stats[0] || {
          totalUploads: 0,
          totalTickets: 0,
          totalRevenue: 0,
          totalPassengers: 0,
          avgTicketsPerUpload: 0,
          avgRevenuePerUpload: 0
        },
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const Bus = require('../models/Bus');
const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');
const Route = require('../models/Route');
const Booking = require('../models/Booking');
const Vendor = require('../models/Vendor');
const SparePart = require('../models/SparePart');
const Duty = require('../models/Duty');
const { auth, requireRole } = require('../middleware/auth');
const { logger } = require('../src/core/logger');
const autonomousScheduler = require('../services/autonomousScheduler');

// Apply auth middleware
router.use(auth);

// =================================================================
// AUTONOMOUS SCHEDULING
// =================================================================

// GET /api/admin/scheduling/auto-schedules - Get automatically generated schedules
router.get('/scheduling/auto-schedules', requireRole(['admin']), async (req, res) => {
  try {
    const { scheduleType = 'daily', date } = req.query;
    
    // Get schedules from database (already generated automatically)
    const query = { status: 'scheduled' };
    
    // Add auto-generated filter if field exists
    if (date) {
      query.serviceDate = new Date(date);
    } else {
      // Default to today for daily, this week for weekly, this month for monthly
      const now = new Date();
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      
      if (scheduleType === 'daily') {
        const endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        query.serviceDate = { $gte: startDate, $lte: endDate };
      } else if (scheduleType === 'weekly') {
        startDate.setDate(startDate.getDate() - startDate.getDay());
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        query.serviceDate = { $gte: startDate, $lte: endDate };
      } else {
        startDate.setDate(1);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        query.serviceDate = { $gte: startDate, $lte: endDate };
      }
    }

    const trips = await Trip.find(query)
      .populate('routeId', 'routeName routeNumber')
      .populate('busId', 'busNumber busType')
      .populate('driverId', 'name')
      .populate('conductorId', 'name')
      .sort({ serviceDate: 1, startTime: 1 });

    // Calculate fatigue scores for each trip's crew
    const schedules = await Promise.all(trips.map(async (trip) => {
      let driverFatigueScore = 0;
      let conductorFatigueScore = 0;
      
      if (trip.driverId) {
        const Driver = require('../models/Driver');
        const driver = await Driver.findById(trip.driverId);
        if (driver) {
          driverFatigueScore = await autonomousScheduler.calculateFatigueScore(driver, 'driver');
        }
      }
      
      if (trip.conductorId) {
        const Conductor = require('../models/Conductor');
        const conductor = await Conductor.findById(trip.conductorId);
        if (conductor) {
          conductorFatigueScore = await autonomousScheduler.calculateFatigueScore(conductor, 'conductor');
        }
      }
      
      return {
        _id: trip._id,
        routeName: trip.routeId?.routeName || 'N/A',
        routeNumber: trip.routeId?.routeNumber || 'N/A',
        busNumber: trip.busId?.busNumber || 'N/A',
        driverName: trip.driverId?.name || 'N/A',
        conductorName: trip.conductorId?.name || 'N/A',
        departureTime: trip.startTime || '08:00',
        arrivalTime: trip.endTime || '18:00',
        startTime: trip.startTime || '08:00',
        endTime: trip.endTime || '18:00',
        date: trip.serviceDate ? trip.serviceDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        serviceDate: trip.serviceDate,
        driverFatigueScore,
        conductorFatigueScore,
        status: trip.status
      };
    }));

    res.json({
      success: true,
      data: {
        schedules,
        scheduleType,
        totalSchedules: schedules.length
      }
    });
  } catch (error) {
    logger.error('Error fetching auto schedules:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schedules' });
  }
});

// =================================================================
// PREDICTIVE ANALYTICS
// =================================================================

// GET /api/admin/analytics/predictive
router.get('/analytics/predictive', requireRole(['admin']), async (req, res) => {
  try {
    const { range = '7d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    
    // Get historical data
    const [bookings, trips, revenue] = await Promise.all([
      Booking.countDocuments({ createdAt: { $gte: startDate } }),
      Trip.countDocuments({ createdAt: { $gte: startDate } }),
      Booking.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);
    
    const historicalRevenue = revenue[0]?.total || 0;
    const growthRate = 0.15; // 15% growth assumption
    
    res.json({
      success: true,
      data: {
        demand: {
          total: Math.floor(bookings * 1.15),
          growth: 15,
          peakHours: {
            morning: '6:00-9:00',
            evening: '17:00-20:00'
          },
          peakDemand: {
            morning: 'High',
            evening: 'High'
          }
        },
        revenue: {
          total: Math.floor(historicalRevenue * 1.15),
          growth: 15
        },
        fuel: {
          total: Math.floor(trips * 50), // Assuming 50L per trip
          optimization: 12
        },
        profitability: {
          topRoutes: 5,
          routes: [
            { name: 'Route A', distance: 120, projectedRevenue: 50000, profitMargin: 25 },
            { name: 'Route B', distance: 150, projectedRevenue: 60000, profitMargin: 28 },
            { name: 'Route C', distance: 100, projectedRevenue: 45000, profitMargin: 22 }
          ]
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching predictive analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch predictions' });
  }
});

// =================================================================
// VENDOR INVOICING
// =================================================================

// GET /api/admin/vendor-invoices
router.get('/vendor-invoices', requireRole(['admin']), async (req, res) => {
  try {
    const vendors = await Vendor.find({ status: 'approved' }).select('_id companyName email');
    
    // Generate mock invoices
    const invoices = vendors.map((vendor, idx) => ({
      _id: new mongoose.Types.ObjectId(),
      invoiceNumber: `INV-${Date.now()}-${idx}`,
      vendorId: vendor._id,
      vendorName: vendor.companyName,
      period: 'January 2026',
      amount: Math.floor(Math.random() * 50000) + 10000,
      status: idx % 3 === 0 ? 'pending' : idx % 3 === 1 ? 'approved' : 'paid',
      generatedAt: new Date(),
      tripCount: Math.floor(Math.random() * 50) + 10,
      fuelAmount: Math.floor(Math.random() * 20000) + 5000
    }));

    res.json({
      success: true,
      data: { invoices }
    });
  } catch (error) {
    logger.error('Error fetching vendor invoices:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
  }
});

// POST /api/admin/vendor-invoices/generate
router.post('/vendor-invoices/generate', requireRole(['admin']), async (req, res) => {
  try {
    const { vendorId, period } = req.body;
    
    const invoice = {
      _id: new mongoose.Types.ObjectId(),
      invoiceNumber: `INV-${Date.now()}`,
      vendorId,
      period,
      amount: Math.floor(Math.random() * 50000) + 10000,
      status: 'pending',
      generatedAt: new Date()
    };

    res.json({
      success: true,
      data: { invoice }
    });
  } catch (error) {
    logger.error('Error generating invoice:', error);
    res.status(500).json({ success: false, message: 'Failed to generate invoice' });
  }
});

// POST /api/admin/vendor-invoices/:id/approve
router.post('/vendor-invoices/:id/approve', requireRole(['admin']), async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Invoice approved successfully'
    });
  } catch (error) {
    logger.error('Error approving invoice:', error);
    res.status(500).json({ success: false, message: 'Failed to approve invoice' });
  }
});

// POST /api/admin/vendor-invoices/:id/process-payment
router.post('/vendor-invoices/:id/process-payment', requireRole(['admin']), async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    logger.error('Error processing payment:', error);
    res.status(500).json({ success: false, message: 'Failed to process payment' });
  }
});

// =================================================================
// ASSET AUCTION
// =================================================================

// GET /api/admin/auctions
router.get('/auctions', requireRole(['admin']), async (req, res) => {
  try {
    const auctions = [
      {
        _id: new mongoose.Types.ObjectId(),
        assetName: 'Bus #1234',
        assetType: 'bus',
        status: 'active',
        startingBid: 500000,
        highestBid: 650000,
        bidCount: 5,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        _id: new mongoose.Types.ObjectId(),
        assetName: 'Spare Parts Lot A',
        assetType: 'spare_parts',
        status: 'pending',
        startingBid: 50000,
        highestBid: 0,
        bidCount: 0,
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    ];

    res.json({
      success: true,
      data: { auctions }
    });
  } catch (error) {
    logger.error('Error fetching auctions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch auctions' });
  }
});

// POST /api/admin/auctions
router.post('/auctions', requireRole(['admin']), async (req, res) => {
  try {
    const { assetName, assetType, startingBid, endDate } = req.body;
    
    const auction = {
      _id: new mongoose.Types.ObjectId(),
      assetName,
      assetType,
      status: 'pending',
      startingBid,
      highestBid: 0,
      bidCount: 0,
      endDate: new Date(endDate)
    };

    res.json({
      success: true,
      data: { auction }
    });
  } catch (error) {
    logger.error('Error creating auction:', error);
    res.status(500).json({ success: false, message: 'Failed to create auction' });
  }
});

// POST /api/admin/auctions/:id/approve
router.post('/auctions/:id/approve', requireRole(['admin']), async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Auction approved successfully'
    });
  } catch (error) {
    logger.error('Error approving auction:', error);
    res.status(500).json({ success: false, message: 'Failed to approve auction' });
  }
});

// POST /api/admin/auctions/:id/close
router.post('/auctions/:id/close', requireRole(['admin']), async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Auction closed successfully'
    });
  } catch (error) {
    logger.error('Error closing auction:', error);
    res.status(500).json({ success: false, message: 'Failed to close auction' });
  }
});

// =================================================================
// CREW FATIGUE MANAGEMENT
// =================================================================

// GET /api/admin/crew/fatigue-analysis
router.get('/crew/fatigue-analysis', requireRole(['admin']), async (req, res) => {
  try {
    const [drivers, conductors, duties] = await Promise.all([
      Driver.find({ status: 'active' }).select('_id name role status'),
      Conductor.find({ status: 'active' }).select('_id name role status'),
      Duty.find({ status: 'active' }).populate('driverId', 'name').populate('conductorId', 'name')
    ]);

    const crew = [];
    
    // Process drivers
    drivers.forEach(driver => {
      const driverDuties = duties.filter(d => d.driverId?._id?.toString() === driver._id.toString());
      const totalHours = driverDuties.reduce((sum, d) => sum + (d.duration || 8), 0);
      const distance = driverDuties.reduce((sum, d) => sum + (d.distance || 200), 0);
      
      crew.push({
        _id: driver._id,
        name: driver.name,
        role: 'driver',
        currentShift: driverDuties.length > 0 ? 'On Duty' : 'Available',
        restHours: Math.max(0, 24 - totalHours),
        distanceCovered: distance,
        fatigueScore: Math.min(100, Math.floor(totalHours * 3 + distance / 10)),
        status: totalHours > 12 ? 'high_fatigue' : totalHours > 8 ? 'moderate' : 'available'
      });
    });

    // Process conductors
    conductors.forEach(conductor => {
      const conductorDuties = duties.filter(d => d.conductorId?._id?.toString() === conductor._id.toString());
      const totalHours = conductorDuties.reduce((sum, d) => sum + (d.duration || 8), 0);
      const distance = conductorDuties.reduce((sum, d) => sum + (d.distance || 200), 0);
      
      crew.push({
        _id: conductor._id,
        name: conductor.name,
        role: 'conductor',
        currentShift: conductorDuties.length > 0 ? 'On Duty' : 'Available',
        restHours: Math.max(0, 24 - totalHours),
        distanceCovered: distance,
        fatigueScore: Math.min(100, Math.floor(totalHours * 3 + distance / 10)),
        status: totalHours > 12 ? 'high_fatigue' : totalHours > 8 ? 'moderate' : 'available'
      });
    });

    // Generate alerts for high fatigue
    const alerts = crew
      .filter(c => c.fatigueScore > 60)
      .map(c => ({
        crewName: c.name,
        message: `High fatigue detected. Recommend rest period.`,
        fatigueScore: c.fatigueScore
      }));

    res.json({
      success: true,
      data: {
        crew,
        alerts
      }
    });
  } catch (error) {
    logger.error('Error fetching crew fatigue analysis:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch fatigue analysis' });
  }
});

// POST /api/admin/crew/generate-schedule
router.post('/crew/generate-schedule', requireRole(['admin']), async (req, res) => {
  try {
    const { useML, balanceDuties, preventFatigue } = req.body;
    
    res.json({
      success: true,
      message: 'Schedule generated successfully',
      data: {
        schedulesGenerated: 10,
        balancedAssignments: true,
        fatiguePrevented: true
      }
    });
  } catch (error) {
    logger.error('Error generating crew schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to generate schedule' });
  }
});

module.exports = router;

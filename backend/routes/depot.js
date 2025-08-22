const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Depot = require('../models/Depot');

// Middleware to verify depot manager access
const verifyDepotManager = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    const user = await User.findById(payload.userId);
    
    if (!user || user.role !== 'depot_manager') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[Depot Auth] Error:', error);
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Apply middleware to all depot routes
router.use(verifyDepotManager);

// GET /api/depot - Basic depot info
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Depot endpoint' });
});

// GET /api/depot/overview - Depot overview and KPIs
router.get('/overview', async (req, res) => {
  try {
    // For now, provide mock data since depotId might not be set
    // In production, this should fetch from actual depot database
    const overview = {
      depot: {
        name: req.user.depotId ? 'Depot Name' : 'Test Depot',
        address: req.user.depotId ? 'Depot Address' : 'Test Address, Test City',
        phone: req.user.depotId ? 'Depot Phone' : '+91 98765 43210',
        manager: req.user.name
      },
      kpis: {
        revenueToday: 125000,
        activeTrips: 5,
        idleBuses: 2,
        delays: 1,
        loadFactor: 0.76,
        onTime: 0.8
      }
    };

    res.json({ success: true, data: overview });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch overview' });
  }
});

// GET /api/depot/buses - List of buses in depot
router.get('/buses', async (req, res) => {
  try {
    // Mock data for now - replace with actual bus queries
    const buses = [
      { _id: '101', number: 'KL-07-AB-101', type: 'AC Seater 2+2', capacity: 40, status: 'active' },
      { _id: '102', number: 'KL-07-AB-102', type: 'Non-AC Seater 2+3', capacity: 50, status: 'in_use' },
      { _id: '103', number: 'KL-07-AB-103', type: 'Sleeper 2+1', capacity: 30, status: 'maintenance' }
    ];

    res.json({ success: true, data: buses });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch buses' });
  }
});

// GET /api/depot/staff - List of drivers and conductors
router.get('/staff', async (req, res) => {
  try {
    // Mock data for now - replace with actual staff queries
    const staff = {
      drivers: [
        { _id: 'd1', name: 'Driver A', status: 'available' },
        { _id: 'd2', name: 'Driver B', status: 'on_trip' }
      ],
      conductors: [
        { _id: 'c1', name: 'Conductor A', status: 'available' },
        { _id: 'c2', name: 'Conductor B', status: 'on_trip' }
      ]
    };

    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch staff' });
  }
});

// GET /api/depot/trips - List of trips
router.get('/trips', async (req, res) => {
  try {
    const { date } = req.query;
    
    // Mock data for now - replace with actual trip queries
    const trips = [
      { 
        _id: 't1', 
        bus: '101', 
        route: 'Kochi → Kottayam', 
        depart: new Date().setHours(7,0,0,0), 
        arrive: new Date().setHours(9,0,0,0), 
        status: 'scheduled', 
        fare: 220 
      },
      { 
        _id: 't2', 
        bus: '102', 
        route: 'Kochi → Thrissur', 
        depart: new Date().setHours(8,0,0,0), 
        arrive: new Date().setHours(10,0,0,0), 
        status: 'running', 
        fare: 180 
      }
    ];

    res.json({ success: true, data: trips });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch trips' });
  }
});

// GET /api/depot/tracking/live - Live tracking data
router.get('/tracking/live', async (req, res) => {
  try {
    // Mock data for now - replace with actual GPS tracking
    const live = [
      { label: 'Bus 102', lat: 10.02, lng: 76.31, speed: 46, status: 'running' },
      { label: 'Bus 104', lat: 9.98, lng: 76.35, speed: 0, status: 'stopped' }
    ];

    res.json({ success: true, data: live });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch tracking data' });
  }
});

module.exports = router;

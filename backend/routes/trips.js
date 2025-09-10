const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const FarePolicy = require('../models/FarePolicy');
const GPSPing = require('../models/GPSPing');

// GET /api/trips/search?from&to&date
router.get('/search', async (req, res) => {
  try {
    const { from, to, date } = req.query;
    console.log('🔍 Trip search request:', { from, to, date });
    
    const serviceDate = date ? new Date(date) : new Date();
    console.log('📅 Searching for date:', serviceDate.toDateString());

    const routes = await Route.find({}).lean();
    const policy = await FarePolicy.findOne({ active: true }).lean();

    // Search for trips on the specified date
    const startOfDay = new Date(serviceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(serviceDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('📅 Date range:', { startOfDay, endOfDay });

    const trips = await Trip.find({ 
      serviceDate: { 
        $gte: startOfDay, 
        $lte: endOfDay 
      } 
    }).lean();
    
    console.log('🚌 Found trips:', trips.length);

    const baseFare = policy?.baseFare ?? 50;
    const perKm = policy?.perKm ?? 2;

    // Filter trips by route criteria
    const filteredTrips = trips.filter(trip => {
      const route = routes.find(r => r._id.toString() === trip.routeId.toString());
      if (!route) {
        console.log('❌ No route found for trip:', trip._id);
        return false;
      }
      
      console.log('🔍 Checking route:', route.routeName, 'for cities:', from, 'to', to);
      
      // Match against the nested city structure in Route model
      const fromMatch = route.startingPoint?.city?.toLowerCase().includes(from.toLowerCase()) ||
                       route.routeName?.toLowerCase().includes(from.toLowerCase()) ||
                       (route.startingPoint?.city && from.toLowerCase().includes(route.startingPoint.city.toLowerCase()));
      const toMatch = route.endingPoint?.city?.toLowerCase().includes(to.toLowerCase()) ||
                     route.routeName?.toLowerCase().includes(to.toLowerCase()) ||
                     (route.endingPoint?.city && to.toLowerCase().includes(route.endingPoint.city.toLowerCase()));
      
      console.log('✅ Route match:', { fromMatch, toMatch, route: route.routeName });
      
      return fromMatch && toMatch;
    });
    
    console.log('🎯 Filtered trips:', filteredTrips.length);

    const items = filteredTrips.map(t => {
      const route = routes.find(r => r._id.toString() === t.routeId.toString());
      const distanceKm = route?.totalDistance ?? 100;
      const fare = t.fare || Math.round(baseFare + distanceKm * perKm);
      return {
        _id: t._id,
        routeName: route?.routeName || 'Route',
        routeNumber: route?.routeNumber || '',
        startTime: t.startTime,
        endTime: t.endTime,
        serviceDate: t.serviceDate,
        status: t.status,
        distanceKm,
        fare,
        capacity: t.capacity,
        availableSeats: t.availableSeats,
        bookedSeats: t.bookedSeats,
        fromCity: route?.startingPoint?.city || '',
        toCity: route?.endingPoint?.city || ''
      };
    });
    
    console.log('📊 Final results:', items.length, 'trips');

    res.json({ ok: true, data: { trips: items } });
  } catch (err) {
    res.status(500).json({ ok: false, code: 'SEARCH_ERROR', message: 'Failed to search trips' });
  }
});

// GET /api/eta?tripId&stopId
router.get('/eta', async (req, res) => {
  try {
    const { tripId } = req.query;
    const last = await GPSPing.findOne({ tripId }).sort({ at: -1 }).lean();
    // Phase-0: mock ETA
    const etaMinutes = last ? Math.max(5, 60 - Math.floor((Date.now() - new Date(last.at).getTime())/60000)) : 45;
    res.json({ ok: true, data: { etaMinutes } });
  } catch (err) {
    res.status(500).json({ ok: false, code: 'ETA_ERROR', message: 'Failed to compute ETA' });
  }
});

// GET /api/trips/:id - Get trip details by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Getting trip details for ID:', id);
    
    const trip = await Trip.findById(id)
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint totalDistance')
      .populate('busId', 'busNumber busType capacity')
      .populate('depotId', 'depotName')
      .lean();
    
    if (!trip) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Trip not found' 
      });
    }
    
    console.log('✅ Trip found:', trip.routeId?.routeName);
    
    res.json({ 
      ok: true, 
      data: {
        _id: trip._id,
        routeName: trip.routeId?.routeName || 'Route',
        routeNumber: trip.routeId?.routeNumber || '',
        startTime: trip.startTime,
        endTime: trip.endTime,
        serviceDate: trip.serviceDate,
        status: trip.status,
        fare: trip.fare,
        capacity: trip.capacity,
        availableSeats: trip.availableSeats,
        bookedSeats: trip.bookedSeats,
        fromCity: trip.routeId?.startingPoint?.city || '',
        toCity: trip.routeId?.endingPoint?.city || '',
        distanceKm: trip.routeId?.totalDistance || 0,
        busNumber: trip.busId?.busNumber || '',
        busType: trip.busId?.busType || '',
        depotName: trip.depotId?.depotName || ''
      }
    });
  } catch (err) {
    console.error('❌ Get trip details error:', err);
    res.status(500).json({ 
      ok: false, 
      message: 'Failed to get trip details',
      error: err.message 
    });
  }
});

module.exports = router;

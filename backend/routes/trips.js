const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const FarePolicy = require('../models/FarePolicy');
const GPSPing = require('../models/GPSPing');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Trips API is working' });
});

// GET /api/trips/search?from&to&date
router.get('/search', async (req, res) => {
  try {
    const { from, to, date } = req.query;
    const serviceDate = date ? new Date(date) : new Date();

    const routes = await Route.find({}).lean();
    const policy = await FarePolicy.findOne({ active: true }).lean();

    const trips = await Trip.find({ serviceDate: { $gte: new Date(serviceDate.toDateString()), $lt: new Date(new Date(serviceDate.toDateString()).getTime() + 24*60*60*1000) } }).lean();

    const baseFare = policy?.baseFare ?? 50;
    const perKm = policy?.perKm ?? 2;

    // Filter trips by route criteria
    const filteredTrips = trips.filter(trip => {
      const route = routes.find(r => r._id.toString() === trip.routeId.toString());
      if (!route) return false;
      
      // Match against the nested city structure in Route model
      const fromMatch = route.startingPoint?.city?.toLowerCase().includes(from.toLowerCase()) ||
                       route.routeName?.toLowerCase().includes(from.toLowerCase());
      const toMatch = route.endingPoint?.city?.toLowerCase().includes(to.toLowerCase()) ||
                     route.routeName?.toLowerCase().includes(to.toLowerCase());
      
      return fromMatch && toMatch;
    });

    const items = filteredTrips.map(t => {
      const route = routes.find(r => r._id.toString() === t.routeId.toString());
      const distanceKm = route?.totalDistance ?? 100;
      const fare = Math.round(baseFare + distanceKm * perKm);
      return {
        _id: t._id,
        routeName: route?.routeName || 'Route',
        startTime: t.startTime,
        serviceDate: t.serviceDate,
        status: t.status,
        distanceKm,
        fare
      };
    });

    res.json({ ok: true, data: { trips: items } });
  } catch (err) {
    res.status(500).json({ ok: false, code: 'SEARCH_ERROR', message: 'Failed to search trips' });
  }
});

// GET /api/trips/list?date=YYYY-MM-DD
// Public endpoint to list all scheduled trips for a date (default: today)
router.get('/list', async (req, res) => {
  try {
    const { date } = req.query;
    const serviceDate = date ? new Date(date) : new Date();

    const startOfDay = new Date(serviceDate.toDateString());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const [routes, policy, trips] = await Promise.all([
      Route.find({}).lean(),
      FarePolicy.findOne({ active: true }).lean(),
      Trip.find({ serviceDate: { $gte: startOfDay, $lt: endOfDay } }).lean()
    ]);

    const baseFare = policy?.baseFare ?? 50;
    const perKm = policy?.perKm ?? 2;

    const items = trips.map(t => {
      const route = routes.find(r => r._id.toString() === t.routeId.toString());
      const distanceKm = route?.totalDistance ?? 100;
      const fare = Math.round(baseFare + distanceKm * perKm);
      return {
        _id: t._id,
        routeName: route?.routeName || 'Route',
        routeNumber: route?.routeNumber || '',
        from: route?.startingPoint?.city || route?.startingPoint?.name || '',
        to: route?.endingPoint?.city || route?.endingPoint?.name || '',
        startTime: t.startTime,
        endTime: t.endTime,
        duration: undefined,
        busType: t.busType || (t.bus && t.bus.busType) || '',
        operator: (t.bus && (t.bus.operatorName || t.bus.operator)) || '',
        amenities: [],
        features: [],
        fare,
        availableSeats: t.availableSeats ?? 0,
        rating: undefined,
        reviews: undefined
      };
    });

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('List trips error:', error);
    res.status(500).json({ success: false, message: 'Failed to list trips' });
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

// GET /api/trips/:id - Get individual trip details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const trip = await Trip.findById(id)
      .populate('routeId', 'routeName startingPoint endingPoint routeNumber')
      .populate('busId', 'busNumber busType capacity amenities operatorName')
      .populate('depotId', 'name location')
      .lean();

    if (!trip) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trip not found' 
      });
    }

    // Normalize the trip data for frontend
    const normalizedTrip = {
      _id: trip._id,
      from: trip.routeId?.startingPoint?.city || trip.routeId?.startingPoint?.location || 'Unknown',
      to: trip.routeId?.endingPoint?.city || trip.routeId?.endingPoint?.location || 'Unknown',
      routeName: trip.routeId?.routeName || `${trip.from} → ${trip.to}`,
      routeNumber: trip.routeId?.routeNumber || '',
      departureTime: trip.startTime,
      arrivalTime: trip.endTime,
      fare: trip.fare || 0,
      capacity: trip.capacity || 30,
      availableSeats: trip.availableSeats || trip.capacity || 30,
      busType: trip.busId?.busType || 'Standard',
      operator: trip.busId?.operatorName || 'Unknown',
      amenities: trip.busId?.amenities || [],
      status: trip.status,
      bookingOpen: trip.bookingOpen !== false,
      serviceDate: trip.serviceDate
    };

    res.json({ 
      success: true, 
      data: normalizedTrip 
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch trip details',
      error: error.message 
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const FarePolicy = require('../models/FarePolicy');
const GPSPing = require('../models/GPSPing');

// GET /api/trips/all - Get all scheduled trips
router.get('/all', async (req, res) => {
  try {
    console.log('🚌 Fetching all scheduled trips');
    
    const routes = await Route.find({}).lean();
    const policy = await FarePolicy.findOne({ active: true }).lean();
    
    // Get date filter from query params
    const { date } = req.query;
    let dateFilter = {};
    
    if (date) {
      // Filter by specific date
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      dateFilter = {
        serviceDate: { 
          $gte: startOfDay, 
          $lte: endOfDay 
        }
      };
    } else {
      // Get all trips from today onwards
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter = { serviceDate: { $gte: today } };
    }
    
    const trips = await Trip.find({ 
      ...dateFilter,
      status: { $in: ['scheduled', 'running'] }
    })
    .populate('routeId', 'routeName startingPoint endingPoint totalDistance')
    .populate('busId', 'busNumber busType capacity amenities')
    .populate('driverId', 'name')
    .populate('conductorId', 'name')
    .sort({ serviceDate: 1, startTime: 1 })
    .lean();
    
    console.log('🚌 Found trips:', trips.length);

    const baseFare = policy?.baseFare ?? 50;
    const perKm = policy?.perKm ?? 2;

    // Transform trips for frontend
    const transformedTrips = trips.map(trip => {
      const route = routes.find(r => r._id.toString() === trip.routeId._id.toString());
      
      return {
        _id: trip._id,
        routeName: route?.routeName || trip.routeId?.routeName || 'Unknown Route',
        fromCity: typeof route?.startingPoint === 'object' ? 
          (route.startingPoint?.city || route.startingPoint?.location || 'Unknown') : 
          (route?.startingPoint || trip.routeId?.startingPoint || 'Unknown'),
        toCity: typeof route?.endingPoint === 'object' ? 
          (route.endingPoint?.city || route.endingPoint?.location || 'Unknown') : 
          (route?.endingPoint || trip.routeId?.endingPoint || 'Unknown'),
        startTime: trip.startTime,
        endTime: trip.endTime,
        date: trip.serviceDate,
        fare: trip.fare || (route?.totalDistance ? baseFare + (route.totalDistance * perKm) : baseFare),
        availableSeats: trip.availableSeats || trip.capacity || 0,
        capacity: trip.capacity || trip.busId?.capacity?.total || 0,
        busType: trip.busId?.busType || 'AC Sleeper',
        operator: 'Kerala State Transport',
        amenities: trip.busId?.amenities || ['Wifi', 'Charging', 'Refreshments'],
        distanceKm: route?.totalDistance || 0,
        rating: 4.5,
        totalRatings: 128,
        status: trip.status,
        driver: trip.driverId?.name || 'TBD',
        conductor: trip.conductorId?.name || 'TBD'
      };
    });

    res.json({
      success: true,
      data: {
        trips: transformedTrips,
        total: transformedTrips.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching all trips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trips',
      error: error.message
    });
  }
});

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

    // Include scheduled AND running trips with bookingOpen=true
    const trips = await Trip.find({ 
      serviceDate: { 
        $gte: startOfDay, 
        $lte: endOfDay 
      },
      status: { $in: ['scheduled', 'running', 'boarding'] },
      bookingOpen: true
    })
    .populate('routeId', 'routeName routeNumber startingPoint endingPoint totalDistance')
    .populate('busId', 'busNumber busType capacity')
    .lean();
    
    console.log('🚌 Found trips:', trips.length);

    const baseFare = policy?.baseFare ?? 50;
    const perKm = policy?.perKm ?? 2;

    // Filter trips by route criteria
    const filteredTrips = trips.filter(trip => {
      const route = trip.routeId; // already populated
      if (!route) {
        console.log('❌ No route found for trip:', trip._id);
        return false;
      }
      
      console.log('🔍 Checking route:', route.routeName, 'for cities:', from, 'to', to);
      
      // Normalize city names for flexible matching
      const normFrom = (from || '').toLowerCase().trim();
      const normTo = (to || '').toLowerCase().trim();
      const routeStartCity = (route.startingPoint?.city || route.startingPoint || '').toLowerCase().trim();
      const routeEndCity = (route.endingPoint?.city || route.endingPoint || '').toLowerCase().trim();
      
      // Match if from/to partially match route start/end (e.g., 'Kochi' matches 'KOCHI' or 'kochi')
      const fromMatch = routeStartCity.includes(normFrom) || normFrom.includes(routeStartCity);
      const toMatch = routeEndCity.includes(normTo) || normTo.includes(routeEndCity);
      
      console.log('✅ Route match:', { fromMatch, toMatch, route: route.routeName, routeStartCity, routeEndCity });
      
      return fromMatch && toMatch;
    });
    
    console.log('🎯 Filtered trips:', filteredTrips.length);

    const items = filteredTrips.map(t => {
      const route = t.routeId; // already populated
      const bus = t.busId; // already populated
      const distanceKm = route?.totalDistance ?? 100;
      const fare = t.fare || Math.round(baseFare + distanceKm * perKm);
      return {
        _id: t._id,
        tripId: t._id,
        routeName: route?.routeName || 'Route',
        routeNumber: route?.routeNumber || '',
        startTime: t.startTime,
        endTime: t.endTime,
        serviceDate: t.serviceDate,
        status: t.status,
        distanceKm,
        fare,
        capacity: t.capacity,
        availableSeats: t.availableSeats ?? t.capacity,
        bookedSeats: t.bookedSeats ?? 0,
        busType: bus?.busType || 'Standard',
        busNumber: bus?.busNumber || 'N/A',
        bookingOpen: t.bookingOpen !== false,
        fromCity: typeof route?.startingPoint === 'object' ? 
          (route.startingPoint?.city || route.startingPoint?.location || 'Unknown') : 
          (route?.startingPoint || 'Unknown'),
        toCity: typeof route?.endingPoint === 'object' ? 
          (route.endingPoint?.city || route.endingPoint?.location || 'Unknown') : 
          (route?.endingPoint || 'Unknown')
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

// GET /api/trips/depot/:depotId - Get trips for specific depot
router.get('/depot/:depotId', async (req, res) => {
  try {
    const { depotId } = req.params;
    const { date, status } = req.query;
    
    console.log(`🏢 Fetching trips for depot: ${depotId}`);
    
    let query = { depotId };
    
    // Add date filter if provided
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.serviceDate = { 
        $gte: startOfDay, 
        $lte: endOfDay 
      };
    }
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    const trips = await Trip.find(query)
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
      .populate('busId', 'busNumber registrationNumber busType capacity')
      .populate('driverId', 'name email phone')
      .populate('conductorId', 'name email phone')
      .populate('depotId', 'depotName depotCode location')
      .sort({ startTime: 1 })
      .lean();
    
    console.log(`✅ Found ${trips.length} trips for depot ${depotId}`);
    
    res.json({
      success: true,
      data: {
        trips,
        count: trips.length,
        depotId
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching depot trips:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch depot trips',
      details: error.message
    });
  }
});

// GET /api/trips/driver/:driverId - Get trips for specific driver
router.get('/driver/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { date, status } = req.query;
    
    console.log(`👨‍💼 Fetching trips for driver: ${driverId}`);
    
    let query = { driverId };
    
    // Add date filter if provided
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.serviceDate = { 
        $gte: startOfDay, 
        $lte: endOfDay 
      };
    }
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    const trips = await Trip.find(query)
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
      .populate('busId', 'busNumber registrationNumber busType capacity')
      .populate('driverId', 'name email phone')
      .populate('conductorId', 'name email phone')
      .populate('depotId', 'depotName depotCode location')
      .sort({ startTime: 1 })
      .lean();
    
    console.log(`✅ Found ${trips.length} trips for driver ${driverId}`);
    
    res.json({
      success: true,
      data: {
        trips,
        count: trips.length,
        driverId
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching driver trips:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch driver trips',
      details: error.message
    });
  }
});

// GET /api/trips/conductor/:conductorId - Get trips for specific conductor
router.get('/conductor/:conductorId', async (req, res) => {
  try {
    const { conductorId } = req.params;
    const { date, status } = req.query;
    
    console.log(`👨‍💼 Fetching trips for conductor: ${conductorId}`);
    
    let query = { conductorId };
    
    // Add date filter if provided
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.serviceDate = { 
        $gte: startOfDay, 
        $lte: endOfDay 
      };
    }
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    const trips = await Trip.find(query)
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
      .populate('busId', 'busNumber registrationNumber busType capacity')
      .populate('driverId', 'name email phone')
      .populate('conductorId', 'name email phone')
      .populate('depotId', 'depotName depotCode location')
      .sort({ startTime: 1 })
      .lean();
    
    console.log(`✅ Found ${trips.length} trips for conductor ${conductorId}`);
    
    res.json({
      success: true,
      data: {
        trips,
        count: trips.length,
        conductorId
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching conductor trips:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conductor trips',
      details: error.message
    });
  }
});

module.exports = router;

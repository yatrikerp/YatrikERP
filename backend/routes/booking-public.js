const express = require('express');
const router = express.Router();
const BookingService = require('../services/bookingService');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const FarePolicy = require('../models/FarePolicy');

// ===== PUBLIC ROUTES (NO AUTH REQUIRED) =====

// GET /api/booking/cities - Get all available cities from routes
router.get('/cities', async (req, res) => {
  try {
    console.log('Fetching cities from routes...');
    const routes = await Route.find({ status: 'active' })
      .select('startingPoint.city endingPoint.city')
      .lean();

    console.log('Found routes:', routes.length);

    const cities = new Set();
    
    routes.forEach(route => {
      if (route.startingPoint?.city) {
        cities.add(route.startingPoint.city);
      }
      if (route.endingPoint?.city) {
        cities.add(route.endingPoint.city);
      }
    });

    const citiesList = Array.from(cities).sort();
    console.log('Cities found:', citiesList);

    res.json({
      success: true,
      data: {
        cities: citiesList,
        count: citiesList.length
      }
    });

  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities',
      error: error.message
    });
  }
});

// POST /api/booking/search - Search trips for booking (public access)
router.post('/search', async (req, res) => {
  try {
    console.log('Search request:', req.body);
    const { from, to, departureDate, passengers = 1 } = req.body;

    if (!from || !to || !departureDate) {
      return res.status(400).json({
        success: false,
        message: 'From, to, and departure date are required'
      });
    }

    console.log('Searching trips for:', { from, to, departureDate, passengers });

    const trips = await BookingService.searchTrips({
      from,
      to,
      departureDate,
      passengers
    });

    console.log('Found trips:', trips.length);

    res.json({
      success: true,
      data: {
        trips,
        searchCriteria: {
          from,
          to,
          departureDate,
          passengers
        }
      }
    });

  } catch (error) {
    console.error('Search trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search trips',
      error: error.message
    });
  }
});

// GET /api/booking/search-proxy?from&to&date
// Public: query trips by cities via GET to support frontend search page linking
router.get('/search-proxy', async (req, res) => {
  try {
    const { from, to, date } = req.query;
    if (!from || !to || !date) {
      return res.status(400).json({ success: false, message: 'from, to and date are required' });
    }

    const trips = await BookingService.searchTrips({ from, to, departureDate: date, passengers: 1 });
    res.json({ success: true, data: { trips } });
  } catch (error) {
    console.error('Search proxy error:', error);
    res.status(500).json({ success: false, message: 'Failed to search trips' });
  }
});

// GET /api/booking/list?date=YYYY-MM-DD
// Public: list all trips available for a given date
router.get('/list', async (req, res) => {
  try {
    const { date } = req.query;
    const serviceDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(serviceDate.toDateString());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const [routes, policy, trips] = await Promise.all([
      Route.find({}).lean(),
      FarePolicy.findOne({ active: true }).lean(),
      Trip.find({ serviceDate: { $gte: startOfDay, $lt: endOfDay }, status: 'scheduled', bookingOpen: true }).lean()
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
        busType: t.busType || '',
        operator: '',
        amenities: [],
        features: [],
        fare,
        availableSeats: t.availableSeats ?? 0,
      };
    });

    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Public list trips error:', error);
    res.status(500).json({ success: false, message: 'Failed to list trips' });
  }
});

module.exports = router;


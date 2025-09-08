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

module.exports = router;

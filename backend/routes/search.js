const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Stop = require('../models/Stop');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const { auth } = require('../middleware/auth');

// Rate limiting for search queries - More lenient for better UX
const rateLimit = require('express-rate-limit');
const searchLimiter = rateLimit({
  windowMs: 1000, // 1 second window
  max: 10, // Allow 10 requests per second
  message: 'Search rate limit exceeded. Please wait before searching again.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// GET /api/search/locations - Location autosuggest
router.get('/locations', 
  searchLimiter,
  query('q').trim().isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { q } = req.query;
      
      // Search in stops, cities, and landmarks
      const stops = await Stop.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { 'location.address.city': { $regex: q, $options: 'i' } },
          { 'location.address.state': { $regex: q, $options: 'i' } },
          { landmarks: { $regex: q, $options: 'i' } }
        ],
        isActive: true
      })
      .select('name code location.address.city location.address.state type category')
      .limit(10)
      .sort({ category: -1, name: 1 }); // Major stops first

      // Format results for autosuggest
      const results = stops.map(stop => ({
        id: stop._id,
        name: stop.name,
        code: stop.code,
        city: stop.location.address.city,
        state: stop.location.address.state,
        type: stop.type,
        category: stop.category,
        displayText: `${stop.name}, ${stop.location.address.city || ''} ${stop.location.address.state || ''}`.trim()
      }));

      res.json({
        success: true,
        data: results,
        query: q
      });

    } catch (error) {
      console.error('Location search error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to search locations' 
      });
    }
  }
);

// GET /api/search/autocomplete - Enhanced autocomplete for search card
router.get('/autocomplete', 
  searchLimiter,
  query('q').trim().isLength({ min: 1 }).withMessage('Search query must be at least 1 character'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { q } = req.query;
      
      // Search in multiple sources for comprehensive results
      const [stops, routes, cities] = await Promise.all([
        // Search stops
        Stop.find({
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { 'location.address.city': { $regex: q, $options: 'i' } },
            { 'location.address.state': { $regex: q, $options: 'i' } }
          ],
          isActive: true
        })
        .select('name code location.address.city location.address.state type category')
        .limit(5)
        .sort({ category: -1, name: 1 }),

        // Search routes for popular destinations
        Route.find({
          $or: [
            { routeName: { $regex: q, $options: 'i' } },
            { 'startingPoint.city': { $regex: q, $options: 'i' } },
            { 'endingPoint.city': { $regex: q, $options: 'i' } }
          ],
          status: 'active'
        })
        .select('routeName routeNumber startingPoint endingPoint')
        .limit(3)
        .sort({ routeName: 1 }),

        // Get unique cities from routes
        Route.aggregate([
          {
            $match: {
              $or: [
                { 'startingPoint.city': { $regex: q, $options: 'i' } },
                { 'endingPoint.city': { $regex: q, $options: 'i' } }
              ],
              status: 'active'
            }
          },
          {
            $project: {
              cities: [
                { city: '$startingPoint.city', type: 'starting' },
                { city: '$endingPoint.city', type: 'ending' }
              ]
            }
          },
          { $unwind: '$cities' },
          {
            $group: {
              _id: '$cities.city',
              type: { $first: '$cities.type' },
              count: { $sum: 1 }
            }
          },
          { $match: { _id: { $ne: null } } },
          { $sort: { count: -1, _id: 1 } },
          { $limit: 5 }
        ])
      ]);

      // Format results with different types and priorities
      const suggestions = [];

      // Add stops (highest priority)
      stops.forEach(stop => {
        suggestions.push({
          id: stop._id,
          name: stop.name,
          city: stop.location.address.city || stop.name,
          state: stop.location.address.state,
          type: 'stop',
          category: stop.category,
          displayText: `${stop.name}, ${stop.location.address.city || ''}`.trim(),
          priority: stop.category === 'major' ? 1 : 2
        });
      });

      // Add cities from routes
      cities.forEach(cityData => {
        if (cityData._id && !suggestions.some(s => s.city === cityData._id)) {
          suggestions.push({
            id: `city_${cityData._id}`,
            name: cityData._id,
            city: cityData._id,
            state: 'Kerala',
            type: 'city',
            category: 'popular',
            displayText: cityData._id,
            priority: 3,
            routeCount: cityData.count
          });
        }
      });

      // Add route destinations
      routes.forEach(route => {
        const startCity = route.startingPoint.city;
        const endCity = route.endingPoint.city;
        
        [startCity, endCity].forEach(city => {
          if (city && !suggestions.some(s => s.city === city)) {
            suggestions.push({
              id: `route_${route._id}_${city}`,
              name: city,
              city: city,
              state: 'Kerala',
              type: 'route_destination',
              category: 'popular',
              displayText: city,
              priority: 4,
              routeName: route.routeName
            });
          }
        });
      });

      // Sort by priority and relevance
      suggestions.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.name.localeCompare(b.name);
      });

      // Limit to 8 suggestions
      const finalSuggestions = suggestions.slice(0, 8);

      res.json({
        success: true,
        data: {
          suggestions: finalSuggestions,
          query: q,
          total: finalSuggestions.length
        }
      });

    } catch (error) {
      console.error('Autocomplete search error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to search suggestions' 
      });
    }
  }
);

module.exports = router;

const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Stop = require('../models/Stop');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const { auth } = require('../middleware/auth');

// Rate limiting for search queries
const rateLimit = require('express-rate-limit');
const searchLimiter = rateLimit({
  windowMs: 800, // 800ms as per spec
  max: 1, // 1 request per window
  message: 'Search rate limit exceeded. Please wait before searching again.',
  standardHeaders: true,
  legacyHeaders: false,
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

module.exports = router;

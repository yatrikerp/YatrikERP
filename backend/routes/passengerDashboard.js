const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const Route = require('../models/Route');
const Booking = require('../models/Booking');
const { auth } = require('../middleware/auth');

// Get scheduled trips for passenger dashboard
router.get('/scheduled-trips', auth, async (req, res) => {
  try {
    const { limit = 10, days = 7 } = req.query;
    
    // Get trips for next 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + parseInt(days));
    
    const scheduledTrips = await Trip.find({
      serviceDate: {
        $gte: today,
        $lte: futureDate
      },
      status: { $in: ['scheduled', 'booking'] },
      bookingOpen: true,
      availableSeats: { $gt: 0 }
    })
    .populate('routeId', 'routeName routeNumber sourceCity destinationCity distance category')
    .populate('busId', 'registrationNumber busType totalSeats')
    .populate('depotId', 'name depotCode')
    .sort({ serviceDate: 1, startTime: 1 })
    .limit(parseInt(limit))
    .lean();

    // Format the response
    const formattedTrips = scheduledTrips.map(trip => ({
      tripId: trip._id,
      route: {
        id: trip.routeId?._id,
        name: trip.routeId?.routeName,
        number: trip.routeId?.routeNumber,
        from: trip.routeId?.sourceCity,
        to: trip.routeId?.destinationCity,
        distance: trip.routeId?.distance,
        category: trip.routeId?.category
      },
      bus: {
        id: trip.busId?._id,
        registration: trip.busId?.registrationNumber,
        type: trip.busId?.busType,
        totalSeats: trip.busId?.totalSeats
      },
      depot: {
        id: trip.depotId?._id,
        name: trip.depotId?.name,
        code: trip.depotId?.depotCode
      },
      schedule: {
        date: trip.serviceDate,
        departureTime: trip.startTime,
        arrivalTime: trip.endTime
      },
      pricing: {
        baseFare: trip.fare,
        currentFare: trip.getCurrentFare ? trip.getCurrentFare() : trip.fare
      },
      availability: {
        totalSeats: trip.capacity,
        availableSeats: trip.availableSeats,
        bookedSeats: trip.bookedSeats,
        occupancyRate: ((trip.bookedSeats / trip.capacity) * 100).toFixed(2)
      },
      status: trip.status,
      bookingOpen: trip.bookingOpen
    }));

    res.json({
      success: true,
      count: formattedTrips.length,
      data: formattedTrips
    });
    
  } catch (error) {
    console.error('Error fetching scheduled trips:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduled trips',
      message: error.message
    });
  }
});

// Get popular routes based on booking analytics
router.get('/popular-routes', auth, async (req, res) => {
  try {
    const { limit = 5, days = 30 } = req.query;
    
    // Get bookings from last 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Aggregate bookings by route
    const popularRoutes = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'completed'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$routeId',
          totalBookings: { $sum: 1 },
          totalPassengers: { $sum: { $size: '$seats' } },
          totalRevenue: { $sum: '$pricing.totalAmount' },
          avgFare: { $avg: '$pricing.totalAmount' }
        }
      },
      {
        $sort: { totalBookings: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Populate route details
    const populatedRoutes = await Route.populate(popularRoutes, {
      path: '_id',
      select: 'routeName routeNumber sourceCity destinationCity distance category status'
    });

    // Get upcoming trips for each popular route
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const routesWithTrips = await Promise.all(
      populatedRoutes.map(async (routeData) => {
        const route = routeData._id;
        
        if (!route) return null;

        // Find next available trip for this route
        const nextTrip = await Trip.findOne({
          routeId: route._id,
          serviceDate: { $gte: today },
          status: 'scheduled',
          bookingOpen: true,
          availableSeats: { $gt: 0 }
        })
        .populate('busId', 'registrationNumber busType')
        .sort({ serviceDate: 1, startTime: 1 })
        .lean();

        return {
          route: {
            id: route._id,
            name: route.routeName,
            number: route.routeNumber,
            from: route.sourceCity,
            to: route.destinationCity,
            distance: route.distance,
            category: route.category,
            status: route.status
          },
          popularity: {
            totalBookings: routeData.totalBookings,
            totalPassengers: routeData.totalPassengers,
            totalRevenue: routeData.totalRevenue,
            averageFare: Math.round(routeData.avgFare),
            rank: populatedRoutes.indexOf(routeData) + 1
          },
          nextAvailableTrip: nextTrip ? {
            tripId: nextTrip._id,
            date: nextTrip.serviceDate,
            departureTime: nextTrip.startTime,
            arrivalTime: nextTrip.endTime,
            fare: nextTrip.fare,
            availableSeats: nextTrip.availableSeats,
            busType: nextTrip.busId?.busType
          } : null
        };
      })
    );

    // Filter out null entries
    const validRoutes = routesWithTrips.filter(r => r !== null);

    res.json({
      success: true,
      count: validRoutes.length,
      period: `Last ${days} days`,
      data: validRoutes
    });
    
  } catch (error) {
    console.error('Error fetching popular routes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular routes',
      message: error.message
    });
  }
});

// Get trending routes (based on recent booking surge)
router.get('/trending-routes', auth, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    // Compare last 7 days vs previous 7 days
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const prev7Days = new Date(last7Days);
    prev7Days.setDate(prev7Days.getDate() - 7);

    // Get bookings for last 7 days
    const recentBookings = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'completed'] },
          createdAt: { $gte: last7Days }
        }
      },
      {
        $group: {
          _id: '$routeId',
          recentBookings: { $sum: 1 }
        }
      }
    ]);

    // Get bookings for previous 7 days
    const previousBookings = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'completed'] },
          createdAt: { $gte: prev7Days, $lt: last7Days }
        }
      },
      {
        $group: {
          _id: '$routeId',
          previousBookings: { $sum: 1 }
        }
      }
    ]);

    // Calculate growth rate
    const trendingRoutes = recentBookings.map(recent => {
      const previous = previousBookings.find(
        p => p._id.toString() === recent._id.toString()
      );
      const prevCount = previous ? previous.previousBookings : 1;
      const growthRate = ((recent.recentBookings - prevCount) / prevCount) * 100;
      
      return {
        _id: recent._id,
        recentBookings: recent.recentBookings,
        previousBookings: prevCount,
        growthRate: Math.round(growthRate)
      };
    })
    .filter(route => route.growthRate > 20) // Only routes with >20% growth
    .sort((a, b) => b.growthRate - a.growthRate)
    .slice(0, parseInt(limit));

    // Populate route details
    const populatedRoutes = await Route.populate(trendingRoutes, {
      path: '_id',
      select: 'routeName routeNumber sourceCity destinationCity category'
    });

    const formattedRoutes = populatedRoutes.map(route => ({
      route: {
        id: route._id._id,
        name: route._id.routeName,
        number: route._id.routeNumber,
        from: route._id.sourceCity,
        to: route._id.destinationCity,
        category: route._id.category
      },
      trend: {
        recentBookings: route.recentBookings,
        previousBookings: route.previousBookings,
        growthRate: route.growthRate,
        trending: route.growthRate > 50 ? 'hot' : 'rising'
      }
    }));

    res.json({
      success: true,
      count: formattedRoutes.length,
      data: formattedRoutes
    });
    
  } catch (error) {
    console.error('Error fetching trending routes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending routes',
      message: error.message
    });
  }
});

// Get quick search suggestions (popular source-destination pairs)
router.get('/quick-search-suggestions', auth, async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    // Get most searched/booked source-destination pairs
    const suggestions = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'completed'] },
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }
      },
      {
        $group: {
          _id: {
            from: '$journey.from',
            to: '$journey.to'
          },
          count: { $sum: 1 },
          avgFare: { $avg: '$pricing.totalAmount' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Check if trips are available for today/tomorrow
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const suggestionsWithAvailability = await Promise.all(
      suggestions.map(async (sug) => {
        // Find if routes exist for this source-destination
        const routes = await Route.find({
          sourceCity: sug._id.from,
          destinationCity: sug._id.to,
          status: 'active'
        }).select('_id');

        const routeIds = routes.map(r => r._id);

        // Check available trips
        const availableTrips = await Trip.countDocuments({
          routeId: { $in: routeIds },
          serviceDate: { $gte: today, $lte: tomorrow },
          status: 'scheduled',
          bookingOpen: true,
          availableSeats: { $gt: 0 }
        });

        return {
          from: sug._id.from,
          to: sug._id.to,
          bookingCount: sug.count,
          averageFare: Math.round(sug.avgFare),
          availableTrips: availableTrips,
          availability: availableTrips > 0 ? 'available' : 'check_dates'
        };
      })
    );

    res.json({
      success: true,
      count: suggestionsWithAvailability.length,
      data: suggestionsWithAvailability
    });
    
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search suggestions',
      message: error.message
    });
  }
});

// Get dashboard summary for passenger
router.get('/dashboard-summary', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // User's upcoming bookings
    const upcomingBookings = await Booking.countDocuments({
      createdBy: userId,
      status: { $in: ['confirmed', 'pending'] },
      'journey.departureDate': { $gte: today }
    });

    // User's past trips
    const completedTrips = await Booking.countDocuments({
      createdBy: userId,
      status: 'completed'
    });

    // Total available trips today
    const availableToday = await Trip.countDocuments({
      serviceDate: today,
      status: 'scheduled',
      bookingOpen: true,
      availableSeats: { $gt: 0 }
    });

    // User's wallet balance (if exists)
    const User = require('../models/User');
    const user = await User.findById(userId).select('wallet');
    const walletBalance = user?.wallet?.balance || 0;

    res.json({
      success: true,
      data: {
        upcomingBookings,
        completedTrips,
        availableTripsToday: availableToday,
        walletBalance
      }
    });
    
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard summary',
      message: error.message
    });
  }
});

module.exports = router;


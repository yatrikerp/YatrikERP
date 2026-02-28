const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorizeRoles");
const StateMetrics = require("../models/StateMetrics");
const RouteHealth = require("../models/RouteHealth");
const DepotScore = require("../models/DepotScore");
const PolicyOverride = require("../models/PolicyOverride");
const SystemAlert = require("../models/SystemAlert");
const Policy = require("../models/Policy");
const Route = require("../models/Route");
const Trip = require("../models/Trip");
const Booking = require("../models/Booking");
const Depot = require("../models/Depot");
const Bus = require("../models/Bus");
const { logger } = require("../src/core/logger");

// Test endpoint (no auth) to verify routes are loaded
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "State routes are working",
    timestamp: new Date().toISOString(),
  });
});

// All routes require authentication and STATE_TRANSPORT_AUTHORITY role
// Note: /test endpoint is above this, so it doesn't require auth
router.use((req, res, next) => {
  // Log route access attempts for debugging
  logger.info(`State route accessed: ${req.method} ${req.path}`);
  next();
});

router.use(auth, authorizeRoles("state_transport_authority", "super_admin"));

/**
 * GET /api/state/dashboard
 * Main state command dashboard - aggregated metrics
 */
router.get("/dashboard", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get or create today's metrics
    let metrics = await StateMetrics.findOne({ date: { $gte: today } });

    if (!metrics) {
      // Calculate fresh metrics
      metrics = await calculateStateMetrics(today);
    }

    // Get recent alerts
    const alerts = await SystemAlert.find({
      status: { $in: ["active", "acknowledged"] },
    })
      .sort({ priority: -1, detectedAt: -1 })
      .limit(20)
      .populate("scopeId", "name")
      .lean();

    // Get active policies
    const activePolicies = await PolicyOverride.find({
      isActive: true,
      status: "active",
      startTime: { $lte: new Date() },
      endTime: { $gte: new Date() },
    })
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        metrics: metrics.toObject(),
        alerts,
        activePolicies,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    logger.error("State dashboard error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch state dashboard data",
    });
  }
});

/**
 * GET /api/state/live-map
 * Live Kerala mobility map - all buses with status
 */
router.get("/live-map", async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Get all running trips
    const runningTrips = await Trip.find({
      status: "running",
      date: { $gte: today },
    })
      .populate("routeId", "origin destination stops")
      .populate("busId", "busNumber registrationNumber")
      .lean();

    // Get all buses with GPS data (if available)
    const buses = await Bus.find({
      status: { $in: ["active", "on_route"] },
    })
      .select("busNumber registrationNumber depotId currentLocation status")
      .lean();

    // Format bus data for map
    const mapData = runningTrips.map((trip) => {
      const bus = buses.find(
        (b) => b._id.toString() === trip.busId?._id?.toString(),
      );

      // Determine status color
      let statusColor = "grey";
      if (trip.status === "running") {
        const delay = trip.actualDepartureTime
          ? (new Date() - new Date(trip.actualDepartureTime)) / 60000
          : 0;
        if (delay < 15) statusColor = "green";
        else if (delay < 30) statusColor = "yellow";
        else statusColor = "red";
      }

      return {
        tripId: trip._id,
        busNumber: bus?.busNumber || trip.busId?.busNumber,
        route: {
          origin: trip.routeId?.origin,
          destination: trip.routeId?.destination,
          stops: trip.routeId?.stops || [],
        },
        status: trip.status,
        statusColor,
        location: bus?.currentLocation || null,
        delay: trip.delay || 0,
      };
    });

    res.json({
      success: true,
      data: {
        buses: mapData,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error("Live map error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch live map data",
    });
  }
});

/**
 * GET /api/state/revenue
 * State revenue command - detailed revenue analytics
 */
router.get("/revenue", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Calculate hour-wise revenue for today
    const hourWiseRevenue = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(today);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hour + 1, 0, 0, 0);

      const bookings = await Booking.find({
        status: "confirmed",
        createdAt: { $gte: hourStart, $lt: hourEnd },
      }).lean();

      const revenue = bookings.reduce(
        (sum, b) => sum + (b.totalAmount || 0),
        0,
      );
      hourWiseRevenue.push({ hour, revenue });
    }

    // Route-wise revenue
    const routeRevenue = await Booking.aggregate([
      {
        $match: {
          status: "confirmed",
          createdAt: { $gte: today },
        },
      },
      {
        $group: {
          _id: "$routeId",
          revenue: { $sum: "$totalAmount" },
          bookings: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "routes",
          localField: "_id",
          foreignField: "_id",
          as: "route",
        },
      },
      {
        $unwind: { path: "$route", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          routeId: "$_id",
          routeName: {
            $concat: ["$route.origin", " → ", "$route.destination"],
          },
          revenue: 1,
          bookings: 1,
        },
      },
      {
        $sort: { revenue: -1 },
      },
      {
        $limit: 20,
      },
    ]);

    // Depot profit/loss summary
    const depotSummary = await Booking.aggregate([
      {
        $match: {
          status: "confirmed",
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $lookup: {
          from: "trips",
          localField: "tripId",
          foreignField: "_id",
          as: "trip",
        },
      },
      {
        $unwind: { path: "$trip", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "buses",
          localField: "trip.busId",
          foreignField: "_id",
          as: "bus",
        },
      },
      {
        $unwind: { path: "$bus", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: "$bus.depotId",
          revenue: { $sum: "$totalAmount" },
          bookings: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "depots",
          localField: "_id",
          foreignField: "_id",
          as: "depot",
        },
      },
      {
        $unwind: { path: "$depot", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          depotId: "$_id",
          depotName: "$depot.depotName",
          revenue: 1,
          bookings: 1,
          profit: { $subtract: ["$revenue", 0] }, // Placeholder - would calculate actual profit
        },
      },
      {
        $sort: { revenue: -1 },
      },
    ]);

    // Today's totals
    const todayBookings = await Booking.find({
      status: "confirmed",
      createdAt: { $gte: today },
    }).lean();

    const todayRevenue = todayBookings.reduce(
      (sum, b) => sum + (b.totalAmount || 0),
      0,
    );

    res.json({
      success: true,
      data: {
        today: {
          revenue: todayRevenue,
          bookings: todayBookings.length,
        },
        hourWise: hourWiseRevenue,
        routeWise: routeRevenue,
        depotSummary,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error("Revenue analytics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch revenue data",
    });
  }
});

/**
 * GET /api/state/load-occupancy
 * Load & occupancy intelligence
 */
router.get("/load-occupancy", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get trips with occupancy data
    const trips = await Trip.find({
      date: { $gte: today },
      status: { $in: ["scheduled", "running", "completed"] },
    })
      .populate("routeId", "origin destination")
      .populate("busId", "capacity")
      .lean();

    // Calculate occupancy for each trip
    const occupancyData = await Promise.all(
      trips.map(async (trip) => {
        const bookings = await Booking.countDocuments({
          tripId: trip._id,
          status: "confirmed",
        });

        const capacity = trip.busId?.capacity || 50;
        const occupancy = capacity > 0 ? (bookings / capacity) * 100 : 0;

        return {
          tripId: trip._id,
          route: trip.routeId
            ? `${trip.routeId.origin} → ${trip.routeId.destination}`
            : "Unknown",
          capacity,
          bookings,
          occupancy: Math.round(occupancy),
          status:
            occupancy > 90
              ? "overcrowded"
              : occupancy < 30
                ? "underutilized"
                : "optimal",
        };
      }),
    );

    const overcrowded = occupancyData.filter((t) => t.status === "overcrowded");
    const underutilized = occupancyData.filter(
      (t) => t.status === "underutilized",
    );

    res.json({
      success: true,
      data: {
        overcrowded: overcrowded.slice(0, 20),
        underutilized: underutilized.slice(0, 20),
        summary: {
          totalTrips: occupancyData.length,
          overcrowdedCount: overcrowded.length,
          underutilizedCount: underutilized.length,
          averageOccupancy: Math.round(
            occupancyData.reduce((sum, t) => sum + t.occupancy, 0) /
              occupancyData.length || 0,
          ),
        },
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error("Load occupancy error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch occupancy data",
    });
  }
});

/**
 * GET /api/state/citizen-pain
 * Citizen pain index - complaints and dissatisfaction metrics
 */
router.get("/citizen-pain", async (req, res) => {
  try {
    // This would integrate with complaints system
    // For now, using booking cancellations and delays as proxy

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    // Cancelled bookings (pain indicator)
    const cancellations = await Booking.find({
      status: "cancelled",
      createdAt: { $gte: last7Days },
    }).lean();

    // Delayed trips
    const delayedTrips = await Trip.find({
      delay: { $gt: 15 }, // More than 15 minutes delay
      date: { $gte: last7Days },
    }).lean();

    // Calculate pain index (0-100 scale)
    // Higher cancellations and delays = higher pain
    const cancellationRate =
      cancellations.length /
      Math.max(
        1,
        await Booking.countDocuments({ createdAt: { $gte: last7Days } }),
      );
    const delayRate =
      delayedTrips.length /
      Math.max(1, await Trip.countDocuments({ date: { $gte: last7Days } }));

    const painIndex = Math.min(
      100,
      Math.round((cancellationRate * 50 + delayRate * 50) * 100),
    );

    res.json({
      success: true,
      data: {
        painIndex,
        metrics: {
          cancellations: cancellations.length,
          delayedTrips: delayedTrips.length,
          cancellationRate: Math.round(cancellationRate * 100),
          delayRate: Math.round(delayRate * 100),
        },
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error("Citizen pain index error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch citizen pain data",
    });
  }
});

/**
 * GET /api/state/alerts
 * System alert center
 */
router.get("/alerts", async (req, res) => {
  try {
    const { severity, status, limit = 50 } = req.query;

    const query = {};
    if (severity) query.severity = severity;
    if (status) query.status = status;

    const alerts = await SystemAlert.find(query)
      .sort({ priority: -1, detectedAt: -1 })
      .limit(parseInt(limit))
      .populate("scopeId", "name")
      .populate("acknowledgedBy", "name email")
      .populate("resolvedBy", "name email")
      .lean();

    res.json({
      success: true,
      data: {
        alerts,
        summary: {
          total: alerts.length,
          critical: alerts.filter((a) => a.severity === "critical").length,
          high: alerts.filter((a) => a.severity === "high").length,
          active: alerts.filter((a) => a.status === "active").length,
        },
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error("Alerts error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch alerts",
    });
  }
});

/**
 * GET /api/state/policies
 * Get all policies (active and inactive)
 */
router.get("/policies", async (req, res) => {
  try {
    const { status, type } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.policyType = type;

    const policies = await PolicyOverride.find(query)
      .populate("approvedBy", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: policies,
    });
  } catch (error) {
    logger.error("Policies error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch policies",
    });
  }
});

/**
 * POST /api/state/policy/apply
 * Activate or deactivate a policy (State Authority only)
 */
router.post("/policy/apply", async (req, res) => {
  try {
    const { policyId, action } = req.body; // action: 'activate' or 'deactivate'

    if (!policyId || !action) {
      return res.status(400).json({
        success: false,
        error: "Policy ID and action are required",
      });
    }

    const policy = await PolicyOverride.findById(policyId);
    if (!policy) {
      return res.status(404).json({
        success: false,
        error: "Policy not found",
      });
    }

    if (action === "activate") {
      policy.isActive = true;
      policy.status = "active";
      policy.approvedBy = req.user._id;
      policy.approvedAt = new Date();
    } else if (action === "deactivate") {
      policy.isActive = false;
      policy.status = "cancelled";
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Use "activate" or "deactivate"',
      });
    }

    await policy.save();

    res.json({
      success: true,
      data: policy,
      message: `Policy ${action}d successfully`,
    });
  } catch (error) {
    logger.error("Policy apply error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to apply policy",
    });
  }
});

/**
 * POST /api/state/policy/create
 * Create a new policy override (Admin can create, State Authority approves)
 */
router.post(
  "/policy/create",
  authorizeRoles("admin", "super_admin", "state_transport_authority"),
  async (req, res) => {
    try {
      const {
        policyName,
        policyType,
        description,
        scope,
        scopeIds,
        parameters,
        startTime,
        endTime,
      } = req.body;

      if (!policyName || !policyType || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          error: "Policy name, type, start time, and end time are required",
        });
      }

      const policy = new PolicyOverride({
        policyName,
        policyType,
        description: description || "",
        scope: scope || "statewide",
        scopeIds: scopeIds || [],
        parameters: parameters || {},
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        createdBy: req.user._id,
        approvedBy:
          req.user.role === "state_transport_authority" ? req.user._id : null,
        approvedAt:
          req.user.role === "state_transport_authority" ? new Date() : null,
        status:
          req.user.role === "state_transport_authority" ? "active" : "pending",
        isActive: req.user.role === "state_transport_authority",
      });

      await policy.save();

      res.json({
        success: true,
        data: policy,
        message: "Policy created successfully",
      });
    } catch (error) {
      logger.error("Policy create error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create policy",
      });
    }
  },
);

/**
 * Helper function to calculate state metrics
 */
async function calculateStateMetrics(date) {
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Calculate revenue
  const todayBookings = await Booking.find({
    status: "confirmed",
    createdAt: { $gte: today },
  }).lean();
  const todayRevenue = todayBookings.reduce(
    (sum, b) => sum + (b.totalAmount || 0),
    0,
  );

  const yesterdayBookings = await Booking.find({
    status: "confirmed",
    createdAt: { $gte: yesterday, $lt: today },
  }).lean();
  const yesterdayRevenue = yesterdayBookings.reduce(
    (sum, b) => sum + (b.totalAmount || 0),
    0,
  );

  // Calculate hour-wise revenue
  const hourWise = [];
  for (let hour = 0; hour < 24; hour++) {
    const hourStart = new Date(today);
    hourStart.setHours(hour, 0, 0, 0);
    const hourEnd = new Date(hourStart);
    hourEnd.setHours(hour + 1, 0, 0, 0);

    const bookings = await Booking.find({
      status: "confirmed",
      createdAt: { $gte: hourStart, $lt: hourEnd },
    }).lean();

    const revenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    hourWise.push({ hour, amount: revenue });
  }

  // Operational metrics
  const totalTrips = await Trip.countDocuments();
  const runningTrips = await Trip.countDocuments({ status: "running" });
  const completedTrips = await Trip.countDocuments({ status: "completed" });
  const cancelledTrips = await Trip.countDocuments({ status: "cancelled" });

  // Fleet metrics
  const totalBuses = await Bus.countDocuments();
  const activeBuses = await Bus.countDocuments({ status: "active" });
  const onRouteBuses = await Bus.countDocuments({ status: "on_route" });
  const maintenanceBuses = await Bus.countDocuments({ status: "maintenance" });

  // Create metrics document
  const metrics = new StateMetrics({
    date: today,
    revenue: {
      today: todayRevenue,
      yesterday: yesterdayRevenue,
      thisWeek: 0, // Would calculate from startOfWeek
      thisMonth: 0, // Would calculate from startOfMonth
      hourWise,
    },
    operations: {
      totalTrips,
      runningTrips,
      completedTrips,
      cancelledTrips,
      onTimeTrips: 0, // Would calculate from trip delays
      delayedTrips: 0,
      averageDelay: 0,
    },
    fleet: {
      totalBuses,
      activeBuses,
      onRouteBuses,
      maintenanceBuses,
      breakdownBuses: 0,
    },
    routes: {
      totalRoutes: await Route.countDocuments(),
      activeRoutes: await Route.countDocuments({ status: "active" }),
      overcrowdedRoutes: [],
      underutilizedRoutes: [],
    },
    depots: {
      totalDepots: await Depot.countDocuments(),
      activeDepots: await Depot.countDocuments({ status: "active" }),
      depotPerformance: [],
    },
    citizens: {
      totalBookings: await Booking.countDocuments(),
      todayBookings: todayBookings.length,
      totalComplaints: 0,
      pendingComplaints: 0,
      resolvedComplaints: 0,
      painIndex: 0,
    },
    systemHealth: {
      apiUptime: 100,
      databaseStatus: "healthy",
      activeConnections: 0,
      errorRate: 0,
    },
  });

  await metrics.save();
  return metrics;
}

module.exports = router;

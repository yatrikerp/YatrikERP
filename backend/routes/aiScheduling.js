const express = require("express");
const router = express.Router();
const DemandPredictionService = require("../services/demandPredictionService");
const CrewFatigueService = require("../services/crewFatigueService");
const GeneticSchedulerService = require("../services/geneticSchedulerService");
const { auth, requireRole } = require("../middleware/auth");

// Helper function for role-based auth
const authRole = (roles) => [auth, requireRole(roles)];
const adminAuth = authRole(["admin", "depot_manager"]);

/**
 * AI Scheduling Routes
 * Implements research-based autonomous scheduling with fatigue awareness
 */

// ==================== DEMAND PREDICTION ====================

/**
 * POST /api/ai-scheduling/predict-demand
 * Predict passenger demand for a route
 */
router.post("/predict-demand", adminAuth, async (req, res) => {
  try {
    const { routeId, predictionDate, timeSlot } = req.body;

    if (!routeId || !predictionDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "Route ID, prediction date, and time slot are required",
      });
    }

    const prediction = await DemandPredictionService.predictDemand(
      routeId,
      new Date(predictionDate),
      timeSlot,
    );

    res.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error("Demand prediction error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to predict demand",
      error: error.message,
    });
  }
});

/**
 * POST /api/ai-scheduling/batch-predict
 * Batch predict demand for multiple routes and dates
 */
router.post("/batch-predict", adminAuth, async (req, res) => {
  try {
    const { routeIds, startDate, endDate, timeSlots } = req.body;

    if (!routeIds || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Route IDs, start date, and end date are required",
      });
    }

    const defaultTimeSlots = timeSlots || [
      "06:00",
      "09:00",
      "12:00",
      "15:00",
      "18:00",
      "21:00",
    ];

    const predictions = await DemandPredictionService.batchPredict(
      routeIds,
      new Date(startDate),
      new Date(endDate),
      defaultTimeSlots,
    );

    res.json({
      success: true,
      count: predictions.length,
      data: predictions,
    });
  } catch (error) {
    console.error("Batch prediction error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to batch predict demand",
      error: error.message,
    });
  }
});

/**
 * GET /api/ai-scheduling/predictions/:routeId
 * Get demand predictions for a route
 */
router.get("/predictions/:routeId", adminAuth, async (req, res) => {
  try {
    const { routeId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { routeId };

    if (startDate && endDate) {
      query.predictionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const DemandPrediction = require("../models/DemandPrediction");
    const predictions = await DemandPrediction.find(query)
      .sort({ predictionDate: 1, timeSlot: 1 })
      .populate("routeId", "routeName routeNumber");

    res.json({
      success: true,
      count: predictions.length,
      data: predictions,
    });
  } catch (error) {
    console.error("Get predictions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get predictions",
      error: error.message,
    });
  }
});

// ==================== CREW FATIGUE ====================

/**
 * POST /api/ai-scheduling/calculate-fatigue
 * Calculate fatigue score for a crew member
 */
router.post("/calculate-fatigue", adminAuth, async (req, res) => {
  try {
    const { crewId, crewType, date } = req.body;

    if (!crewId || !crewType) {
      return res.status(400).json({
        success: false,
        message: "Crew ID and crew type are required",
      });
    }

    const targetDate = date ? new Date(date) : new Date();

    const fatigueRecord = await CrewFatigueService.calculateFatigueScore(
      crewId,
      crewType,
      targetDate,
    );

    res.json({
      success: true,
      data: fatigueRecord,
    });
  } catch (error) {
    console.error("Fatigue calculation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate fatigue",
      error: error.message,
    });
  }
});

/**
 * POST /api/ai-scheduling/batch-calculate-fatigue
 * Calculate fatigue for all crew in a depot
 */
router.post("/batch-calculate-fatigue", adminAuth, async (req, res) => {
  try {
    const { depotId, date } = req.body;

    if (!depotId) {
      return res.status(400).json({
        success: false,
        message: "Depot ID is required",
      });
    }

    const targetDate = date ? new Date(date) : new Date();

    const results = await CrewFatigueService.batchCalculateFatigue(
      depotId,
      targetDate,
    );

    res.json({
      success: true,
      data: results,
      summary: {
        totalDrivers: results.drivers.length,
        totalConductors: results.conductors.length,
        highFatigueDrivers: results.drivers.filter((d) => d.fatigueScore >= 50)
          .length,
        highFatigueConductors: results.conductors.filter(
          (c) => c.fatigueScore >= 50,
        ).length,
      },
    });
  } catch (error) {
    console.error("Batch fatigue calculation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to batch calculate fatigue",
      error: error.message,
    });
  }
});

/**
 * GET /api/ai-scheduling/eligible-crew
 * Get eligible crew members for assignment
 */
router.get("/eligible-crew", adminAuth, async (req, res) => {
  try {
    const { depotId, crewType, date, maxFatigueScore } = req.query;

    if (!depotId || !crewType) {
      return res.status(400).json({
        success: false,
        message: "Depot ID and crew type are required",
      });
    }

    const targetDate = date ? new Date(date) : new Date();
    const maxFatigue = maxFatigueScore ? parseInt(maxFatigueScore) : 50;

    const eligibleCrew = await CrewFatigueService.getEligibleCrew(
      depotId,
      crewType,
      targetDate,
      maxFatigue,
    );

    res.json({
      success: true,
      count: eligibleCrew.length,
      data: eligibleCrew,
    });
  } catch (error) {
    console.error("Get eligible crew error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get eligible crew",
      error: error.message,
    });
  }
});

/**
 * GET /api/ai-scheduling/fatigue-report/:depotId
 * Get comprehensive fatigue report for a depot
 */
router.get("/fatigue-report/:depotId", adminAuth, async (req, res) => {
  try {
    const { depotId } = req.params;
    const { startDate, endDate } = req.query;

    const CrewFatigue = require("../models/CrewFatigue");

    const query = { depotId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const fatigueRecords = await CrewFatigue.find(query)
      .populate("crewId", "name employeeCode")
      .sort({ date: -1, fatigueScore: -1 });

    // Calculate statistics
    const stats = {
      totalRecords: fatigueRecords.length,
      avgFatigueScore:
        fatigueRecords.length > 0
          ? Math.round(
              fatigueRecords.reduce((sum, r) => sum + r.fatigueScore, 0) /
                fatigueRecords.length,
            )
          : 0,
      highFatigueCount: fatigueRecords.filter((r) => r.fatigueScore >= 50)
        .length,
      criticalFatigueCount: fatigueRecords.filter((r) => r.fatigueScore >= 70)
        .length,
      ineligibleCount: fatigueRecords.filter(
        (r) => !r.eligibilityStatus.isEligible,
      ).length,
    };

    res.json({
      success: true,
      stats,
      data: fatigueRecords,
    });
  } catch (error) {
    console.error("Fatigue report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate fatigue report",
      error: error.message,
    });
  }
});

// ==================== GENETIC ALGORITHM SCHEDULING ====================

/**
 * POST /api/ai-scheduling/genetic-schedule
 * Schedule trips using Genetic Algorithm
 */
router.post("/genetic-schedule", adminAuth, async (req, res) => {
  try {
    const { depotId, startDate, endDate, options } = req.body;

    if (!depotId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Depot ID, start date, and end date are required",
      });
    }

    console.log(
      `🧬 Starting Genetic Algorithm scheduling for depot ${depotId}`,
    );

    const result = await GeneticSchedulerService.scheduleWithGA(
      depotId,
      new Date(startDate),
      new Date(endDate),
      options || {},
    );

    res.json({
      success: true,
      message: "Genetic Algorithm scheduling completed",
      data: result,
    });
  } catch (error) {
    console.error("Genetic scheduling error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to schedule with Genetic Algorithm",
      error: error.message,
    });
  }
});

/**
 * GET /api/ai-scheduling/analytics
 * Get AI scheduling analytics and insights
 */
router.get("/analytics", adminAuth, async (req, res) => {
  try {
    const { depotId, startDate, endDate } = req.query;

    const DemandPrediction = require("../models/DemandPrediction");
    const CrewFatigue = require("../models/CrewFatigue");

    const dateFilter =
      startDate && endDate
        ? {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          }
        : {};

    // Demand analytics
    const demandStats = await DemandPrediction.aggregate([
      ...(Object.keys(dateFilter).length > 0
        ? [{ $match: { predictionDate: dateFilter } }]
        : []),
      {
        $group: {
          _id: null,
          totalPredictions: { $sum: 1 },
          avgPredictedPassengers: { $avg: "$predictedPassengers" },
          avgConfidence: { $avg: "$confidenceScore" },
          highDemandCount: {
            $sum: { $cond: [{ $eq: ["$demandLevel", "high"] }, 1, 0] },
          },
          veryHighDemandCount: {
            $sum: { $cond: [{ $eq: ["$demandLevel", "very_high"] }, 1, 0] },
          },
        },
      },
    ]);

    // Fatigue analytics
    const fatigueQuery = depotId ? { depotId } : {};
    if (Object.keys(dateFilter).length > 0) {
      fatigueQuery.date = dateFilter;
    }

    const fatigueStats = await CrewFatigue.aggregate([
      { $match: fatigueQuery },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          avgFatigueScore: { $avg: "$fatigueScore" },
          highFatigueCount: {
            $sum: { $cond: [{ $gte: ["$fatigueScore", 50] }, 1, 0] },
          },
          criticalFatigueCount: {
            $sum: { $cond: [{ $gte: ["$fatigueScore", 70] }, 1, 0] },
          },
          ineligibleCount: {
            $sum: {
              $cond: [{ $eq: ["$eligibilityStatus.isEligible", false] }, 1, 0],
            },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        demand: demandStats[0] || {},
        fatigue: fatigueStats[0] || {},
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get analytics",
      error: error.message,
    });
  }
});

module.exports = router;

const mongoose = require("mongoose");

/**
 * Crew Fatigue Model
 * Tracks fatigue metrics for drivers and conductors
 * Based on research: Autonomous AI Scheduling and Crew Fatigue-Aware Optimization
 */
const crewFatigueSchema = new mongoose.Schema(
  {
    crewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    crewType: {
      type: String,
      enum: ["driver", "conductor"],
      required: true,
    },
    depotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Depot",
      required: true,
    },

    // Date for which fatigue is calculated
    date: {
      type: Date,
      required: true,
    },

    // Fatigue Score (0-100, higher = more fatigued)
    fatigueScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },

    // Workload Parameters
    workloadMetrics: {
      dailyWorkingHours: {
        type: Number,
        default: 0,
      },
      totalDistanceCovered: {
        type: Number,
        default: 0,
      },
      consecutiveWorkingDays: {
        type: Number,
        default: 0,
      },
      nightShiftCount: {
        type: Number,
        default: 0,
      },
      restHoursSinceLastShift: {
        type: Number,
        default: 8,
      },
      tripsCompletedToday: {
        type: Number,
        default: 0,
      },
      longDistanceTrips: {
        type: Number,
        default: 0,
      },
    },

    // Fatigue Components (weighted factors)
    fatigueComponents: {
      workHoursFatigue: {
        type: Number,
        default: 0,
      },
      distanceFatigue: {
        type: Number,
        default: 0,
      },
      consecutiveDaysFatigue: {
        type: Number,
        default: 0,
      },
      nightShiftFatigue: {
        type: Number,
        default: 0,
      },
      restDeficitFatigue: {
        type: Number,
        default: 0,
      },
    },

    // Eligibility Status
    eligibilityStatus: {
      isEligible: {
        type: Boolean,
        default: true,
      },
      reason: {
        type: String,
        default: "",
      },
      recommendedRestHours: {
        type: Number,
        default: 0,
      },
    },

    // Historical Trend (last 7 days average)
    weeklyAverageFatigue: {
      type: Number,
      default: 0,
    },

    // Alerts
    alerts: [
      {
        type: {
          type: String,
          enum: [
            "high_fatigue",
            "rest_required",
            "consecutive_days",
            "night_shift_limit",
          ],
        },
        message: String,
        severity: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Metadata
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
    calculatedBy: {
      type: String,
      default: "system",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
crewFatigueSchema.index({ crewId: 1, date: -1 });
crewFatigueSchema.index({ depotId: 1, date: -1 });
crewFatigueSchema.index({ fatigueScore: -1 });
crewFatigueSchema.index({ "eligibilityStatus.isEligible": 1 });

module.exports = mongoose.model("CrewFatigue", crewFatigueSchema);

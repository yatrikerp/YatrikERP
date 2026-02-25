const mongoose = require("mongoose");

/**
 * Demand Prediction Model
 * Stores AI-based passenger demand predictions
 * Based on research: AI-Based Passenger Demand Prediction using LSTM
 */
const demandPredictionSchema = new mongoose.Schema(
  {
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
      required: true,
    },

    // Prediction Date and Time
    predictionDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true, // Format: "HH:mm"
    },

    // Predicted Demand
    predictedPassengers: {
      type: Number,
      required: true,
      min: 0,
    },

    // Confidence Level (0-1)
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 0.5,
    },

    // Historical Data Used
    historicalData: {
      avgPassengersLast7Days: Number,
      avgPassengersLast30Days: Number,
      sameWeekdayAverage: Number,
      seasonalFactor: Number,
    },

    // Contextual Factors
    contextFactors: {
      dayOfWeek: {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
      isWeekend: Boolean,
      isHoliday: Boolean,
      isSpecialEvent: Boolean,
      weatherCondition: {
        type: String,
        enum: ["clear", "rain", "heavy_rain", "fog", "unknown"],
      },
      isPeakHour: Boolean,
    },

    // Demand Category
    demandLevel: {
      type: String,
      enum: ["very_low", "low", "medium", "high", "very_high"],
      required: true,
    },

    // Recommended Resources
    recommendations: {
      recommendedBuses: {
        type: Number,
        min: 0,
      },
      recommendedBusType: {
        type: String,
        enum: [
          "ordinary",
          "fast_passenger",
          "super_fast",
          "deluxe_express",
          "low_floor_ac",
        ],
      },
      recommendedFrequency: {
        type: Number, // minutes between buses
        min: 0,
      },
    },

    // Actual vs Predicted (filled after trip completion)
    actualData: {
      actualPassengers: Number,
      accuracy: Number, // percentage
      error: Number,
      recordedAt: Date,
    },

    // Model Information
    modelInfo: {
      modelVersion: {
        type: String,
        default: "v1.0",
      },
      algorithm: {
        type: String,
        default: "LSTM",
      },
      trainedOn: Date,
      features: [String],
    },

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
demandPredictionSchema.index({ routeId: 1, predictionDate: 1, timeSlot: 1 });
demandPredictionSchema.index({ predictionDate: 1 });
demandPredictionSchema.index({ demandLevel: 1 });
demandPredictionSchema.index({ "recommendations.recommendedBuses": 1 });

module.exports = mongoose.model("DemandPrediction", demandPredictionSchema);

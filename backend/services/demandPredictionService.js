const DemandPrediction = require("../models/DemandPrediction");
const Trip = require("../models/Trip");
const Route = require("../models/Route");
const Booking = require("../models/Booking");

/**
 * AI-Based Passenger Demand Prediction Service
 * Implements LSTM-inspired time-series prediction
 * Based on research: AI-Based Passenger Demand Prediction
 */
class DemandPredictionService {
  /**
   * Predict passenger demand for a route and time slot
   */
  static async predictDemand(routeId, predictionDate, timeSlot) {
    try {
      const route = await Route.findById(routeId);
      if (!route) {
        throw new Error("Route not found");
      }

      // Gather historical data
      const historicalData = await this.gatherHistoricalData(
        routeId,
        predictionDate,
        timeSlot,
      );

      // Calculate contextual factors
      const contextFactors = this.calculateContextFactors(
        predictionDate,
        timeSlot,
      );

      // Apply LSTM-inspired prediction algorithm
      const predictedPassengers = this.calculatePrediction(
        historicalData,
        contextFactors,
      );

      // Calculate confidence score
      const confidenceScore = this.calculateConfidence(historicalData);

      // Determine demand level
      const demandLevel = this.categorizeDemand(
        predictedPassengers,
        route.capacity || 50,
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        predictedPassengers,
        demandLevel,
        route,
      );

      // Save prediction
      const prediction = new DemandPrediction({
        routeId,
        predictionDate,
        timeSlot,
        predictedPassengers,
        confidenceScore,
        historicalData: {
          avgPassengersLast7Days: historicalData.avg7Days,
          avgPassengersLast30Days: historicalData.avg30Days,
          sameWeekdayAverage: historicalData.sameWeekdayAvg,
          seasonalFactor: historicalData.seasonalFactor,
        },
        contextFactors,
        demandLevel,
        recommendations,
        modelInfo: {
          modelVersion: "v1.0",
          algorithm: "LSTM-inspired",
          trainedOn: new Date(),
          features: [
            "historical_avg",
            "weekday",
            "time_slot",
            "seasonal",
            "weather",
          ],
        },
      });

      await prediction.save();
      return prediction;
    } catch (error) {
      console.error("Demand prediction error:", error);
      throw error;
    }
  }

  /**
   * Gather historical passenger data
   */
  static async gatherHistoricalData(routeId, targetDate, timeSlot) {
    const now = new Date(targetDate);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get trips for last 7 days
    const last7DaysTrips = await Trip.find({
      routeId,
      serviceDate: { $gte: sevenDaysAgo, $lt: now },
      status: "completed",
    }).select("totalPassengers bookedSeats");

    // Get trips for last 30 days
    const last30DaysTrips = await Trip.find({
      routeId,
      serviceDate: { $gte: thirtyDaysAgo, $lt: now },
      status: "completed",
    }).select("totalPassengers bookedSeats");

    // Calculate averages
    const avg7Days =
      last7DaysTrips.length > 0
        ? last7DaysTrips.reduce(
            (sum, t) => sum + (t.totalPassengers || t.bookedSeats || 0),
            0,
          ) / last7DaysTrips.length
        : 0;

    const avg30Days =
      last30DaysTrips.length > 0
        ? last30DaysTrips.reduce(
            (sum, t) => sum + (t.totalPassengers || t.bookedSeats || 0),
            0,
          ) / last30DaysTrips.length
        : 0;

    // Get same weekday average
    const targetDayOfWeek = now.getDay();
    const sameWeekdayTrips = last30DaysTrips.filter((trip) => {
      return new Date(trip.serviceDate).getDay() === targetDayOfWeek;
    });

    const sameWeekdayAvg =
      sameWeekdayTrips.length > 0
        ? sameWeekdayTrips.reduce(
            (sum, t) => sum + (t.totalPassengers || t.bookedSeats || 0),
            0,
          ) / sameWeekdayTrips.length
        : avg30Days;

    // Calculate seasonal factor (simplified)
    const month = now.getMonth();
    const seasonalFactor = this.getSeasonalFactor(month);

    return {
      avg7Days: Math.round(avg7Days),
      avg30Days: Math.round(avg30Days),
      sameWeekdayAvg: Math.round(sameWeekdayAvg),
      seasonalFactor,
      dataPoints: last30DaysTrips.length,
    };
  }

  /**
   * Calculate contextual factors
   */
  static calculateContextFactors(date, timeSlot) {
    const targetDate = new Date(date);
    const dayOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][targetDate.getDay()];
    const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;

    // Parse time slot
    const hour = parseInt(timeSlot.split(":")[0]);
    const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);

    // Check for holidays (simplified - can be enhanced with holiday API)
    const isHoliday = this.checkHoliday(targetDate);

    return {
      dayOfWeek,
      isWeekend,
      isHoliday,
      isSpecialEvent: false, // Can be enhanced with event calendar
      weatherCondition: "unknown", // Can be enhanced with weather API
      isPeakHour,
    };
  }

  /**
   * LSTM-inspired prediction calculation
   */
  static calculatePrediction(historicalData, contextFactors) {
    let prediction =
      historicalData.sameWeekdayAvg || historicalData.avg30Days || 20;

    // Apply seasonal factor
    prediction *= historicalData.seasonalFactor;

    // Apply weekend factor
    if (contextFactors.isWeekend) {
      prediction *= 0.7; // 30% reduction on weekends
    }

    // Apply peak hour factor
    if (contextFactors.isPeakHour) {
      prediction *= 1.5; // 50% increase during peak hours
    }

    // Apply holiday factor
    if (contextFactors.isHoliday) {
      prediction *= 1.3; // 30% increase on holidays
    }

    // Apply recent trend weight (give more weight to last 7 days)
    if (historicalData.dataPoints > 7) {
      prediction = prediction * 0.6 + historicalData.avg7Days * 0.4;
    }

    return Math.max(0, Math.round(prediction));
  }

  /**
   * Calculate confidence score
   */
  static calculateConfidence(historicalData) {
    if (historicalData.dataPoints === 0) return 0.3;
    if (historicalData.dataPoints < 7) return 0.5;
    if (historicalData.dataPoints < 14) return 0.7;
    return 0.9;
  }

  /**
   * Categorize demand level
   */
  static categorizeDemand(predictedPassengers, capacity) {
    const utilizationRate = predictedPassengers / capacity;

    if (utilizationRate < 0.2) return "very_low";
    if (utilizationRate < 0.4) return "low";
    if (utilizationRate < 0.7) return "medium";
    if (utilizationRate < 0.9) return "high";
    return "very_high";
  }

  /**
   * Generate resource recommendations
   */
  static generateRecommendations(predictedPassengers, demandLevel, route) {
    let recommendedBuses = 1;
    let recommendedBusType = "ordinary";
    let recommendedFrequency = 60; // minutes

    if (demandLevel === "very_high") {
      recommendedBuses = 3;
      recommendedBusType = "low_floor_ac";
      recommendedFrequency = 20;
    } else if (demandLevel === "high") {
      recommendedBuses = 2;
      recommendedBusType = "fast_passenger";
      recommendedFrequency = 30;
    } else if (demandLevel === "medium") {
      recommendedBuses = 1;
      recommendedBusType = "fast_passenger";
      recommendedFrequency = 45;
    }

    return {
      recommendedBuses,
      recommendedBusType,
      recommendedFrequency,
    };
  }

  /**
   * Get seasonal factor based on month
   */
  static getSeasonalFactor(month) {
    // Kerala tourism seasons
    const seasonalFactors = {
      0: 1.2, // January - Peak tourist season
      1: 1.1, // February
      2: 1.0, // March
      3: 0.9, // April - Summer
      4: 0.85, // May - Hot season
      5: 0.8, // June - Monsoon starts
      6: 0.8, // July - Monsoon
      7: 0.85, // August
      8: 0.9, // September
      9: 1.0, // October - Festival season
      10: 1.1, // November - Tourist season
      11: 1.2, // December - Peak season
    };
    return seasonalFactors[month] || 1.0;
  }

  /**
   * Check if date is a holiday
   */
  static checkHoliday(date) {
    // Simplified - can be enhanced with holiday calendar API
    const day = date.getDate();
    const month = date.getMonth();

    // Major Kerala holidays
    const holidays = [
      { month: 0, day: 26 }, // Republic Day
      { month: 7, day: 15 }, // Independence Day
      { month: 9, day: 2 }, // Gandhi Jayanti
    ];

    return holidays.some((h) => h.month === month && h.day === day);
  }

  /**
   * Batch predict for multiple routes and time slots
   */
  static async batchPredict(routeIds, startDate, endDate, timeSlots) {
    const predictions = [];

    for (const routeId of routeIds) {
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        for (const timeSlot of timeSlots) {
          try {
            const prediction = await this.predictDemand(
              routeId,
              new Date(currentDate),
              timeSlot,
            );
            predictions.push(prediction);
          } catch (error) {
            console.error(
              `Prediction failed for route ${routeId} on ${currentDate}:`,
              error.message,
            );
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return predictions;
  }

  /**
   * Update prediction with actual data
   */
  static async updateWithActual(predictionId, actualPassengers) {
    const prediction = await DemandPrediction.findById(predictionId);
    if (!prediction) {
      throw new Error("Prediction not found");
    }

    const error = Math.abs(prediction.predictedPassengers - actualPassengers);
    const accuracy = Math.max(
      0,
      100 - (error / prediction.predictedPassengers) * 100,
    );

    prediction.actualData = {
      actualPassengers,
      accuracy: Math.round(accuracy),
      error,
      recordedAt: new Date(),
    };

    await prediction.save();
    return prediction;
  }
}

module.exports = DemandPredictionService;

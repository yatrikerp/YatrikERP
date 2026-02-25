const CrewFatigue = require("../models/CrewFatigue");
const Trip = require("../models/Trip");
const User = require("../models/User");
const Duty = require("../models/Duty");

/**
 * Crew Fatigue-Aware Service
 * Implements scientific fatigue modeling and monitoring
 * Based on research: Crew Fatigue-Aware Optimization
 */
class CrewFatigueService {
  // Fatigue calculation weights
  static FATIGUE_WEIGHTS = {
    workHours: 0.25,
    distance: 0.2,
    consecutiveDays: 0.2,
    nightShifts: 0.2,
    restDeficit: 0.15,
  };

  // Thresholds
  static THRESHOLDS = {
    maxDailyHours: 12,
    maxConsecutiveDays: 6,
    minRestHours: 8,
    maxNightShiftsPerWeek: 3,
    maxDistancePerDay: 500, // km
    criticalFatigueScore: 70,
    highFatigueScore: 50,
  };

  /**
   * Calculate comprehensive fatigue score for a crew member
   */
  static async calculateFatigueScore(crewId, crewType, date = new Date()) {
    try {
      const crew = await User.findById(crewId);
      if (!crew) {
        throw new Error("Crew member not found");
      }

      // Gather workload data
      const workloadMetrics = await this.gatherWorkloadMetrics(
        crewId,
        crewType,
        date,
      );

      // Calculate individual fatigue components
      const fatigueComponents =
        this.calculateFatigueComponents(workloadMetrics);

      // Calculate overall fatigue score (weighted sum)
      const fatigueScore =
        this.calculateWeightedFatigueScore(fatigueComponents);

      // Determine eligibility
      const eligibilityStatus = this.determineEligibility(
        fatigueScore,
        workloadMetrics,
      );

      // Calculate weekly average
      const weeklyAverageFatigue = await this.calculateWeeklyAverage(
        crewId,
        date,
      );

      // Generate alerts
      const alerts = this.generateFatigueAlerts(
        fatigueScore,
        workloadMetrics,
        eligibilityStatus,
      );

      // Save or update fatigue record
      const fatigueRecord = await CrewFatigue.findOneAndUpdate(
        { crewId, date: this.normalizeDate(date) },
        {
          crewId,
          crewType,
          depotId: crew.depotId,
          date: this.normalizeDate(date),
          fatigueScore,
          workloadMetrics,
          fatigueComponents,
          eligibilityStatus,
          weeklyAverageFatigue,
          alerts,
          calculatedAt: new Date(),
        },
        { upsert: true, new: true },
      );

      return fatigueRecord;
    } catch (error) {
      console.error("Fatigue calculation error:", error);
      throw error;
    }
  }

  /**
   * Gather workload metrics for crew member
   */
  static async gatherWorkloadMetrics(crewId, crewType, targetDate) {
    const today = this.normalizeDate(targetDate);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get trips for today
    const todayTrips = await Trip.find({
      [crewType === "driver" ? "driverId" : "conductorId"]: crewId,
      serviceDate: today,
      status: { $in: ["completed", "running"] },
    }).populate("routeId", "totalDistance estimatedDuration");

    // Get trips for last 7 days
    const weekTrips = await Trip.find({
      [crewType === "driver" ? "driverId" : "conductorId"]: crewId,
      serviceDate: { $gte: sevenDaysAgo, $lte: today },
      status: { $in: ["completed", "running"] },
    }).populate("routeId", "totalDistance estimatedDuration");

    // Calculate daily working hours
    let dailyWorkingHours = 0;
    let totalDistanceCovered = 0;
    let tripsCompletedToday = todayTrips.length;
    let longDistanceTrips = 0;

    todayTrips.forEach((trip) => {
      const duration = trip.routeId?.estimatedDuration || 0;
      dailyWorkingHours += duration / 60; // Convert minutes to hours

      const distance = trip.routeId?.totalDistance || 0;
      totalDistanceCovered += distance;

      if (distance > 200) {
        longDistanceTrips++;
      }
    });

    // Calculate consecutive working days
    const consecutiveWorkingDays = await this.calculateConsecutiveDays(
      crewId,
      crewType,
      today,
    );

    // Count night shifts in last 7 days
    const nightShiftCount = weekTrips.filter((trip) => {
      const startTime = trip.startTime || "08:00";
      const hour = parseInt(startTime.split(":")[0]);
      return hour >= 22 || hour <= 6;
    }).length;

    // Calculate rest hours since last shift
    const restHoursSinceLastShift = await this.calculateRestHours(
      crewId,
      crewType,
      today,
    );

    return {
      dailyWorkingHours: Math.round(dailyWorkingHours * 10) / 10,
      totalDistanceCovered: Math.round(totalDistanceCovered),
      consecutiveWorkingDays,
      nightShiftCount,
      restHoursSinceLastShift,
      tripsCompletedToday,
      longDistanceTrips,
    };
  }

  /**
   * Calculate individual fatigue components
   */
  static calculateFatigueComponents(metrics) {
    // Work hours fatigue (0-100)
    const workHoursFatigue = Math.min(
      100,
      (metrics.dailyWorkingHours / this.THRESHOLDS.maxDailyHours) * 100,
    );

    // Distance fatigue (0-100)
    const distanceFatigue = Math.min(
      100,
      (metrics.totalDistanceCovered / this.THRESHOLDS.maxDistancePerDay) * 100,
    );

    // Consecutive days fatigue (0-100)
    const consecutiveDaysFatigue = Math.min(
      100,
      (metrics.consecutiveWorkingDays / this.THRESHOLDS.maxConsecutiveDays) *
        100,
    );

    // Night shift fatigue (0-100)
    const nightShiftFatigue = Math.min(
      100,
      (metrics.nightShiftCount / this.THRESHOLDS.maxNightShiftsPerWeek) * 100,
    );

    // Rest deficit fatigue (0-100)
    const restDeficitFatigue = Math.max(
      0,
      100 -
        (metrics.restHoursSinceLastShift / this.THRESHOLDS.minRestHours) * 100,
    );

    return {
      workHoursFatigue: Math.round(workHoursFatigue),
      distanceFatigue: Math.round(distanceFatigue),
      consecutiveDaysFatigue: Math.round(consecutiveDaysFatigue),
      nightShiftFatigue: Math.round(nightShiftFatigue),
      restDeficitFatigue: Math.round(restDeficitFatigue),
    };
  }

  /**
   * Calculate weighted fatigue score
   */
  static calculateWeightedFatigueScore(components) {
    const score =
      components.workHoursFatigue * this.FATIGUE_WEIGHTS.workHours +
      components.distanceFatigue * this.FATIGUE_WEIGHTS.distance +
      components.consecutiveDaysFatigue * this.FATIGUE_WEIGHTS.consecutiveDays +
      components.nightShiftFatigue * this.FATIGUE_WEIGHTS.nightShifts +
      components.restDeficitFatigue * this.FATIGUE_WEIGHTS.restDeficit;

    return Math.min(100, Math.round(score));
  }

  /**
   * Determine crew eligibility for assignment
   */
  static determineEligibility(fatigueScore, metrics) {
    const reasons = [];
    let isEligible = true;
    let recommendedRestHours = 0;

    // Check fatigue score
    if (fatigueScore >= this.THRESHOLDS.criticalFatigueScore) {
      isEligible = false;
      reasons.push("Critical fatigue level");
      recommendedRestHours = 24;
    } else if (fatigueScore >= this.THRESHOLDS.highFatigueScore) {
      reasons.push("High fatigue - limit to short routes");
      recommendedRestHours = 12;
    }

    // Check daily hours
    if (metrics.dailyWorkingHours >= this.THRESHOLDS.maxDailyHours) {
      isEligible = false;
      reasons.push("Maximum daily hours reached");
    }

    // Check consecutive days
    if (metrics.consecutiveWorkingDays >= this.THRESHOLDS.maxConsecutiveDays) {
      isEligible = false;
      reasons.push("Maximum consecutive working days reached");
      recommendedRestHours = Math.max(recommendedRestHours, 48);
    }

    // Check rest hours
    if (metrics.restHoursSinceLastShift < this.THRESHOLDS.minRestHours) {
      isEligible = false;
      reasons.push("Insufficient rest since last shift");
      recommendedRestHours = Math.max(
        recommendedRestHours,
        this.THRESHOLDS.minRestHours - metrics.restHoursSinceLastShift,
      );
    }

    return {
      isEligible,
      reason: reasons.join("; ") || "Eligible for duty",
      recommendedRestHours,
    };
  }

  /**
   * Calculate consecutive working days
   */
  static async calculateConsecutiveDays(crewId, crewType, targetDate) {
    let consecutiveDays = 0;
    let currentDate = new Date(targetDate);

    for (let i = 0; i < 14; i++) {
      const dayStart = this.normalizeDate(currentDate);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const tripCount = await Trip.countDocuments({
        [crewType === "driver" ? "driverId" : "conductorId"]: crewId,
        serviceDate: { $gte: dayStart, $lte: dayEnd },
        status: { $in: ["completed", "running", "scheduled"] },
      });

      if (tripCount > 0) {
        consecutiveDays++;
      } else {
        break;
      }

      currentDate.setDate(currentDate.getDate() - 1);
    }

    return consecutiveDays;
  }

  /**
   * Calculate rest hours since last shift
   */
  static async calculateRestHours(crewId, crewType, targetDate) {
    const lastTrip = await Trip.findOne({
      [crewType === "driver" ? "driverId" : "conductorId"]: crewId,
      serviceDate: { $lt: targetDate },
      status: { $in: ["completed"] },
    }).sort({ serviceDate: -1, endTime: -1 });

    if (!lastTrip) {
      return 24; // No previous trip, assume well-rested
    }

    const lastTripEnd = new Date(lastTrip.serviceDate);
    const [hours, minutes] = (lastTrip.endTime || "18:00").split(":");
    lastTripEnd.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const restHours = (targetDate - lastTripEnd) / (1000 * 60 * 60);
    return Math.max(0, Math.round(restHours * 10) / 10);
  }

  /**
   * Calculate weekly average fatigue
   */
  static async calculateWeeklyAverage(crewId, targetDate) {
    const sevenDaysAgo = new Date(targetDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weekRecords = await CrewFatigue.find({
      crewId,
      date: { $gte: sevenDaysAgo, $lt: targetDate },
    }).select("fatigueScore");

    if (weekRecords.length === 0) return 0;

    const avgFatigue =
      weekRecords.reduce((sum, r) => sum + r.fatigueScore, 0) /
      weekRecords.length;
    return Math.round(avgFatigue);
  }

  /**
   * Generate fatigue alerts
   */
  static generateFatigueAlerts(fatigueScore, metrics, eligibilityStatus) {
    const alerts = [];

    if (fatigueScore >= this.THRESHOLDS.criticalFatigueScore) {
      alerts.push({
        type: "high_fatigue",
        message: "Critical fatigue level - immediate rest required",
        severity: "critical",
      });
    } else if (fatigueScore >= this.THRESHOLDS.highFatigueScore) {
      alerts.push({
        type: "high_fatigue",
        message: "High fatigue level - assign only short routes",
        severity: "high",
      });
    }

    if (metrics.consecutiveWorkingDays >= this.THRESHOLDS.maxConsecutiveDays) {
      alerts.push({
        type: "consecutive_days",
        message: `${metrics.consecutiveWorkingDays} consecutive working days - rest day required`,
        severity: "high",
      });
    }

    if (metrics.nightShiftCount >= this.THRESHOLDS.maxNightShiftsPerWeek) {
      alerts.push({
        type: "night_shift_limit",
        message: "Night shift limit reached for this week",
        severity: "medium",
      });
    }

    if (!eligibilityStatus.isEligible) {
      alerts.push({
        type: "rest_required",
        message: `Rest required: ${eligibilityStatus.reason}`,
        severity: "high",
      });
    }

    return alerts;
  }

  /**
   * Get eligible crew members for a trip
   */
  static async getEligibleCrew(depotId, crewType, date, maxFatigueScore = 50) {
    const crew = await User.find({
      depotId,
      role: crewType,
      isActive: true,
    });

    const eligibleCrew = [];

    for (const member of crew) {
      const fatigueRecord = await this.calculateFatigueScore(
        member._id,
        crewType,
        date,
      );

      if (
        fatigueRecord.eligibilityStatus.isEligible &&
        fatigueRecord.fatigueScore <= maxFatigueScore
      ) {
        eligibleCrew.push({
          ...member.toObject(),
          fatigueScore: fatigueRecord.fatigueScore,
          fatigueLevel: this.getFatigueLevel(fatigueRecord.fatigueScore),
        });
      }
    }

    // Sort by fatigue score (lowest first)
    eligibleCrew.sort((a, b) => a.fatigueScore - b.fatigueScore);

    return eligibleCrew;
  }

  /**
   * Get fatigue level description
   */
  static getFatigueLevel(score) {
    if (score < 20) return "very_low";
    if (score < 40) return "low";
    if (score < 60) return "moderate";
    if (score < 80) return "high";
    return "very_high";
  }

  /**
   * Normalize date to start of day
   */
  static normalizeDate(date) {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  /**
   * Batch calculate fatigue for all crew in a depot
   */
  static async batchCalculateFatigue(depotId, date = new Date()) {
    const drivers = await User.find({
      depotId,
      role: "driver",
      isActive: true,
    });
    const conductors = await User.find({
      depotId,
      role: "conductor",
      isActive: true,
    });

    const results = {
      drivers: [],
      conductors: [],
    };

    for (const driver of drivers) {
      try {
        const fatigue = await this.calculateFatigueScore(
          driver._id,
          "driver",
          date,
        );
        results.drivers.push(fatigue);
      } catch (error) {
        console.error(
          `Failed to calculate fatigue for driver ${driver._id}:`,
          error.message,
        );
      }
    }

    for (const conductor of conductors) {
      try {
        const fatigue = await this.calculateFatigueScore(
          conductor._id,
          "conductor",
          date,
        );
        results.conductors.push(fatigue);
      } catch (error) {
        console.error(
          `Failed to calculate fatigue for conductor ${conductor._id}:`,
          error.message,
        );
      }
    }

    return results;
  }
}

module.exports = CrewFatigueService;

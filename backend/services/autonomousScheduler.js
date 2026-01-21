const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const Bus = require('../models/Bus');
const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');
const Route = require('../models/Route');
const Duty = require('../models/Duty');
const { logger } = require('../src/core/logger');

/**
 * Autonomous Scheduler Service
 * Fully automatic schedule generation with crew fatigue monitoring
 */

// Calculate crew fatigue score
const calculateFatigueScore = async (crewMember, crewType) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get duties for the last 7 days
    const duties = await Duty.find({
      [crewType === 'driver' ? 'driverId' : 'conductorId']: crewMember._id,
      date: { $gte: today },
      status: { $in: ['completed', 'active'] }
    }).populate('tripId', 'distance duration');

    let totalDistance = 0;
    let totalHours = 0;
    let tripCount = 0;
    let nightDutyCount = 0;
    
    duties.forEach(duty => {
      const trip = duty.tripId;
      if (trip) {
        totalDistance += trip.distance || 0;
        totalHours += trip.duration || 8; // Default 8 hours
        tripCount++;
        
        // Check for night duty (22:00 - 06:00)
        const startTime = duty.startTime || '08:00';
        const hour = parseInt(startTime.split(':')[0]);
        if (hour >= 22 || hour < 6) {
          nightDutyCount++;
        }
      }
    });

    // Calculate fatigue score (0-100, higher = more fatigued)
    let fatigueScore = 0;
    
    // Distance factor (0-30 points)
    fatigueScore += Math.min(30, (totalDistance / 1000) * 0.5);
    
    // Hours factor (0-30 points)
    fatigueScore += Math.min(30, (totalHours / 24) * 30);
    
    // Trip count factor (0-20 points)
    fatigueScore += Math.min(20, tripCount * 2);
    
    // Night duty factor (0-20 points)
    fatigueScore += Math.min(20, nightDutyCount * 5);
    
    return Math.min(100, Math.round(fatigueScore));
  } catch (error) {
    logger.error('Error calculating fatigue score:', error);
    return 50; // Default moderate fatigue
  }
};

// Check if crew is eligible for assignment
const isCrewEligible = (fatigueScore, restHours) => {
  // Highly fatigued (score > 70) - not eligible
  if (fatigueScore > 70) return false;
  
  // Moderately fatigued (score > 50) - limited assignment
  if (fatigueScore > 50 && restHours < 8) return false;
  
  // Fit crew - eligible
  return true;
};

// Calculate rest hours since last duty
const calculateRestHours = async (crewMember, crewType) => {
  try {
    const lastDuty = await Duty.findOne({
      [crewType === 'driver' ? 'driverId' : 'conductorId']: crewMember._id,
      status: 'completed'
    }).sort({ endTime: -1 });

    if (!lastDuty || !lastDuty.endTime) {
      return 24; // No previous duty, fully rested
    }

    const lastEndTime = new Date(lastDuty.endTime);
    const now = new Date();
    const hoursSince = (now - lastEndTime) / (1000 * 60 * 60);
    
    return Math.max(0, hoursSince);
  } catch (error) {
    logger.error('Error calculating rest hours:', error);
    return 24; // Default fully rested
  }
};

// Find eligible driver-conductor pairs
const findEligibleCrewPairs = async (depotId, requiredCount = 1) => {
  try {
    const [drivers, conductors] = await Promise.all([
      Driver.find({ status: 'active', depotId: depotId || { $exists: true } }),
      Conductor.find({ status: 'active', depotId: depotId || { $exists: true } })
    ]);

    const eligiblePairs = [];
    
    for (const driver of drivers) {
      const driverFatigue = await calculateFatigueScore(driver, 'driver');
      const driverRest = await calculateRestHours(driver, 'driver');
      
      if (!isCrewEligible(driverFatigue, driverRest)) {
        continue;
      }

      for (const conductor of conductors) {
        const conductorFatigue = await calculateFatigueScore(conductor, 'conductor');
        const conductorRest = await calculateRestHours(conductor, 'conductor');
        
        if (!isCrewEligible(conductorFatigue, conductorRest)) {
          continue;
        }

        // Calculate combined score (lower is better)
        const combinedScore = (driverFatigue + conductorFatigue) / 2;
        const combinedRest = Math.min(driverRest, conductorRest);
        
        eligiblePairs.push({
          driver,
          conductor,
          driverFatigue,
          conductorFatigue,
          combinedScore,
          combinedRest
        });
      }
    }

    // Sort by combined score (best pairs first) and rest hours
    eligiblePairs.sort((a, b) => {
      if (a.combinedScore !== b.combinedScore) {
        return a.combinedScore - b.combinedScore;
      }
      return b.combinedRest - a.combinedRest;
    });

    return eligiblePairs.slice(0, requiredCount);
  } catch (error) {
    logger.error('Error finding eligible crew pairs:', error);
    return [];
  }
};

// Check for scheduling conflicts
const checkConflicts = async (busId, driverId, conductorId, startTime, endTime, date) => {
  try {
    const scheduleDate = new Date(date);
    scheduleDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(scheduleDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Check bus conflicts
    const busConflicts = await Trip.countDocuments({
      busId,
      serviceDate: { $gte: scheduleDate, $lt: nextDay },
      status: { $in: ['scheduled', 'active', 'boarding', 'running'] },
      $or: [
        { 
          startTime: { $lte: endTime }, 
          endTime: { $gte: startTime } 
        }
      ]
    });

    // Check driver conflicts
    const driverConflicts = await Trip.countDocuments({
      driverId,
      serviceDate: { $gte: scheduleDate, $lt: nextDay },
      status: { $in: ['scheduled', 'active', 'boarding', 'running'] },
      $or: [
        { 
          startTime: { $lte: endTime }, 
          endTime: { $gte: startTime } 
        }
      ]
    });

    // Check conductor conflicts
    const conductorConflicts = await Trip.countDocuments({
      conductorId,
      serviceDate: { $gte: scheduleDate, $lt: nextDay },
      status: { $in: ['scheduled', 'active', 'boarding', 'running'] },
      $or: [
        { 
          startTime: { $lte: endTime }, 
          endTime: { $gte: startTime } 
        }
      ]
    });

    return {
      hasConflict: busConflicts > 0 || driverConflicts > 0 || conductorConflicts > 0,
      busConflicts,
      driverConflicts,
      conductorConflicts
    };
  } catch (error) {
    logger.error('Error checking conflicts:', error);
    return { hasConflict: true };
  }
};

// Generate automatic schedule
const generateAutomaticSchedule = async (scheduleType = 'daily') => {
  try {
    logger.info(`🚀 Starting automatic schedule generation: ${scheduleType}`);
    
    // Determine date range
    const now = new Date();
    const startDate = new Date(now);
    const days = scheduleType === 'daily' ? 1 : scheduleType === 'weekly' ? 7 : 30;
    
    // Get active routes and buses
    const [routes, buses] = await Promise.all([
      Route.find({ status: 'active' }).populate('depotId'),
      Bus.find({ status: 'active', maintenanceStatus: { $ne: 'in_maintenance' } })
    ]);

    const generatedSchedules = [];
    const conflicts = [];
    
    for (let i = 0; i < days; i++) {
      const scheduleDate = new Date(startDate);
      scheduleDate.setDate(scheduleDate.getDate() + i);
      const dateStr = scheduleDate.toISOString().split('T')[0];
      
      for (const route of routes) {
        const depotId = route.depotId?._id || route.depotId;
        
        // Find eligible crew pairs for this depot
        const crewPairs = await findEligibleCrewPairs(depotId, 1);
        
        if (crewPairs.length === 0) {
          logger.warn(`⚠️ No eligible crew pairs found for route ${route.routeName} on ${dateStr}`);
          continue;
        }

        // Find available bus for this depot
        const availableBus = buses.find(bus => 
          (!bus.depotId || bus.depotId.toString() === depotId?.toString()) &&
          bus.status === 'active' &&
          bus.maintenanceStatus !== 'in_maintenance'
        );

        if (!availableBus) {
          logger.warn(`⚠️ No available bus found for route ${route.routeName} on ${dateStr}`);
          continue;
        }

        const crewPair = crewPairs[0];
        const startTime = '08:00';
        const endTime = '18:00';
        
        // Check for conflicts
        const conflictCheck = await checkConflicts(
          availableBus._id,
          crewPair.driver._id,
          crewPair.conductor._id,
          startTime,
          endTime,
          dateStr
        );

        if (conflictCheck.hasConflict) {
          conflicts.push({
            route: route.routeName,
            date: dateStr,
            reason: 'Schedule conflict detected'
          });
          continue;
        }

        // Create schedule entry
        const schedule = {
          routeId: route._id,
          routeName: route.routeName,
          routeNumber: route.routeNumber,
          busId: availableBus._id,
          busNumber: availableBus.busNumber,
          driverId: crewPair.driver._id,
          driverName: crewPair.driver.name,
          conductorId: crewPair.conductor._id,
          conductorName: crewPair.conductor.name,
          date: dateStr,
          startTime,
          endTime,
          status: 'scheduled',
          driverFatigueScore: crewPair.driverFatigue,
          conductorFatigueScore: crewPair.conductorFatigue,
          combinedFatigueScore: crewPair.combinedScore
        };

        generatedSchedules.push(schedule);
      }
    }

    logger.info(`✅ Generated ${generatedSchedules.length} schedules with ${conflicts.length} conflicts`);
    
    return {
      success: true,
      schedules: generatedSchedules,
      conflicts,
      summary: {
        totalGenerated: generatedSchedules.length,
        conflicts: conflicts.length,
        scheduleType,
        generatedAt: new Date()
      }
    };
  } catch (error) {
    logger.error('Error generating automatic schedule:', error);
    throw error;
  }
};

module.exports = {
  generateAutomaticSchedule,
  calculateFatigueScore,
  findEligibleCrewPairs,
  checkConflicts,
  isCrewEligible
};

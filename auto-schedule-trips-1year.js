#!/usr/bin/env node
/**
 * AUTO-SCHEDULE TRIPS FOR 1 YEAR (CYCLICAL PATTERN)
 * 
 * This script automatically schedules trips for all routes
 * for the next 365 days with cyclical weekly patterns
 * 
 * Features:
 * - Weekly recurring patterns (Monday-Sunday cycles)
 * - Seasonal adjustments (peak/off-peak periods)
 * - Holiday considerations
 * - Weekend vs weekday schedules
 * - Monthly maintenance windows
 * - Automatic crew rotation
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Trip = require('./backend/models/Trip');
const Route = require('./backend/models/Route');
const Bus = require('./backend/models/Bus');
const User = require('./backend/models/User');
const Depot = require('./backend/models/Depot');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik';
const DAYS_TO_SCHEDULE = 365; // Full year

// Enhanced time slots for better coverage
const WEEKDAY_TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', // Morning rush
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', // Regular morning
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', // Lunch period
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', // Afternoon
  '18:00', '18:30', '19:00', '19:30', '20:00' // Evening rush
]; // 29 slots for weekdays

const WEEKEND_TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', // Morning
  '12:00', '13:00', '14:00', '15:00', '16:00', // Afternoon
  '17:00', '18:00', '19:00' // Evening
]; // 13 slots for weekends

// Seasonal adjustments
const SEASONAL_MULTIPLIERS = {
  'spring': 1.0,    // March-May: Normal frequency
  'summer': 1.2,    // June-August: Peak travel season
  'autumn': 0.9,    // September-November: Slightly reduced
  'winter': 0.8     // December-February: Reduced frequency
};

// Holiday periods (dates when service is reduced)
const HOLIDAY_PERIODS = [
  { name: 'New Year', start: '2024-12-31', end: '2024-01-02', multiplier: 0.5 },
  { name: 'Easter', start: '2024-03-29', end: '2024-04-01', multiplier: 0.7 },
  { name: 'Summer Break', start: '2024-07-15', end: '2024-07-31', multiplier: 0.6 },
  { name: 'Diwali', start: '2024-11-01', end: '2024-11-03', multiplier: 0.7 },
  { name: 'Christmas', start: '2024-12-24', end: '2024-12-26', multiplier: 0.5 }
];

// Maintenance windows (when certain buses are unavailable)
const MAINTENANCE_WINDOWS = [
  { month: 3, weeks: [2, 3] },   // March: Weeks 2-3
  { month: 6, weeks: [1, 4] },   // June: Weeks 1, 4
  { month: 9, weeks: [2] },      // September: Week 2
  { month: 12, weeks: [1, 2] }   // December: Weeks 1-2
];

async function connect() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

function getSeason(date) {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function isHoliday(date) {
  const dateStr = date.toISOString().split('T')[0];
  return HOLIDAY_PERIODS.some(holiday => 
    dateStr >= holiday.start && dateStr <= holiday.end
  );
}

function getHolidayMultiplier(date) {
  const dateStr = date.toISOString().split('T')[0];
  const holiday = HOLIDAY_PERIODS.find(h => 
    dateStr >= h.start && dateStr <= h.end
  );
  return holiday ? holiday.multiplier : 1.0;
}

function isMaintenancePeriod(date) {
  const month = date.getMonth() + 1;
  const week = Math.ceil(date.getDate() / 7);
  
  return MAINTENANCE_WINDOWS.some(window => 
    window.month === month && window.weeks.includes(week)
  );
}

function getDayOfWeek(date) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

function calculateEndTime(startTime, durationMinutes) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

function getTimeSlotsForDate(date) {
  if (isWeekend(date)) {
    return WEEKEND_TIME_SLOTS;
  }
  return WEEKDAY_TIME_SLOTS;
}

function getTripFrequencyForDate(date, route) {
  let baseFrequency = isWeekend(date) ? 13 : 29; // Base slots
  
  // Apply seasonal multiplier
  const season = getSeason(date);
  const seasonalMultiplier = SEASONAL_MULTIPLIERS[season];
  
  // Apply holiday multiplier
  const holidayMultiplier = getHolidayMultiplier(date);
  
  // Apply route-specific adjustments
  const routeMultiplier = route.isPopular ? 1.2 : 1.0;
  
  // Calculate final frequency
  const finalFrequency = Math.round(baseFrequency * seasonalMultiplier * holidayMultiplier * routeMultiplier);
  
  return Math.max(1, Math.min(finalFrequency, baseFrequency));
}

async function autoScheduleTripsYearly() {
  try {
    console.log('\n🚀 STARTING YEARLY AUTOMATIC TRIP SCHEDULING');
    console.log(`📅 Scheduling trips for next ${DAYS_TO_SCHEDULE} days (1 full year)`);
    console.log(`🔄 Using cyclical weekly patterns with seasonal adjustments\n`);

    // Fetch all active resources
    console.log('📊 Fetching resources...');
    const [routes, buses, drivers, conductors, depots] = await Promise.all([
      Route.find({ status: 'active', isActive: true }).lean(),
      Bus.find({ status: { $in: ['active', 'idle'] } }).populate('depotId').lean(),
      User.find({ role: 'driver', status: 'active' }).lean(),
      User.find({ role: 'conductor', status: 'active' }).lean(),
      Depot.find({ status: 'active', isActive: true }).lean()
    ]);

    console.log(`✅ Found ${routes.length} routes`);
    console.log(`✅ Found ${buses.length} buses`);
    console.log(`✅ Found ${drivers.length} drivers`);
    console.log(`✅ Found ${conductors.length} conductors`);
    console.log(`✅ Found ${depots.length} depots\n`);

    if (routes.length === 0 || buses.length === 0) {
      console.error('❌ No routes or buses found. Cannot schedule trips.');
      return;
    }

    // Group buses by depot
    const busesByDepot = {};
    buses.forEach(bus => {
      const depotId = bus.depotId?._id?.toString() || 'unknown';
      if (!busesByDepot[depotId]) busesByDepot[depotId] = [];
      busesByDepot[depotId].push(bus);
    });

    // Group crew by depot
    const driversByDepot = {};
    const conductorsByDepot = {};
    
    drivers.forEach(driver => {
      const depotId = driver.depotId?.toString() || 'all';
      if (!driversByDepot[depotId]) driversByDepot[depotId] = [];
      driversByDepot[depotId].push(driver);
    });

    conductors.forEach(conductor => {
      const depotId = conductor.depotId?.toString() || 'all';
      if (!conductorsByDepot[depotId]) conductorsByDepot[depotId] = [];
      conductorsByDepot[depotId].push(conductor);
    });

    // Generate trips for the entire year
    const tripsToCreate = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('🔄 Generating yearly trip schedule...\n');

    let totalTrips = 0;
    let weekNumber = 1;
    let currentWeekStart = new Date(today);

    for (let dayOffset = 0; dayOffset < DAYS_TO_SCHEDULE; dayOffset++) {
      const serviceDate = new Date(today);
      serviceDate.setDate(serviceDate.getDate() + dayOffset);
      
      // Track weekly progress
      if (dayOffset % 7 === 0) {
        console.log(`📅 Week ${weekNumber}: ${currentWeekStart.toDateString()} to ${new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toDateString()}`);
        weekNumber++;
        currentWeekStart = new Date(serviceDate);
      }

      const dayOfWeek = getDayOfWeek(serviceDate);
      const isWeekendDay = isWeekend(serviceDate);
      const season = getSeason(serviceDate);
      const isHolidayDay = isHoliday(serviceDate);
      const isMaintenanceDay = isMaintenancePeriod(serviceDate);

      // Progress indicator
      if (dayOffset % 30 === 0) {
        const progress = Math.round((dayOffset / DAYS_TO_SCHEDULE) * 100);
        console.log(`   📊 Progress: ${progress}% (${dayOffset}/${DAYS_TO_SCHEDULE} days) - ${serviceDate.toDateString()}`);
      }

      let dayTrips = 0;

      for (const route of routes) {
        // Get route's depot
        const routeDepotId = route.depot?.depotId?.toString() || route.depotId?.toString();
        const routeBuses = busesByDepot[routeDepotId] || buses;
        const routeDrivers = driversByDepot[routeDepotId] || drivers;
        const routeConductors = conductorsByDepot[routeDepotId] || conductors;

        if (routeBuses.length === 0) continue;

        // Get available buses (excluding maintenance)
        const availableBuses = isMaintenanceDay 
          ? routeBuses.filter((_, index) => index % 2 === 0) // Every other bus for maintenance
          : routeBuses;

        // Calculate trip frequency for this date
        const timeSlots = getTimeSlotsForDate(serviceDate);
        const tripFrequency = getTripFrequencyForDate(serviceDate, route);
        const actualTrips = Math.min(tripFrequency, availableBuses.length);

        // Create trips for this route
        for (let tripIndex = 0; tripIndex < actualTrips; tripIndex++) {
          const bus = availableBuses[tripIndex % availableBuses.length];
          const driver = routeDrivers[tripIndex % routeDrivers.length];
          const conductor = routeConductors[tripIndex % routeConductors.length];
          const startTime = timeSlots[tripIndex % timeSlots.length];
          const durationMinutes = route.estimatedDuration || route.duration || 120;
          const endTime = calculateEndTime(startTime, durationMinutes);

          // Calculate seasonal fare adjustment
          const baseFare = route.baseFare || 100;
          const seasonalFare = Math.round(baseFare * SEASONAL_MULTIPLIERS[season]);

          const trip = {
            routeId: route._id,
            busId: bus._id,
            driverId: driver?._id,
            conductorId: conductor?._id,
            depotId: routeDepotId || bus.depotId?._id,
            serviceDate: serviceDate,
            startTime: startTime,
            endTime: endTime,
            status: 'scheduled',
            fare: seasonalFare,
            capacity: bus.capacity?.total || 45,
            availableSeats: bus.capacity?.total || 45,
            bookedSeats: 0,
            bookingOpen: true,
            notes: `Yearly scheduled trip - ${route.routeName} (${season}, ${dayOfWeek}${isHolidayDay ? ', Holiday' : ''}${isMaintenanceDay ? ', Maintenance Period' : ''})`,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Additional metadata for yearly scheduling
            schedulingMetadata: {
              year: serviceDate.getFullYear(),
              week: Math.ceil((serviceDate - new Date(serviceDate.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000)),
              dayOfWeek: dayOfWeek,
              season: season,
              isWeekend: isWeekendDay,
              isHoliday: isHolidayDay,
              isMaintenance: isMaintenanceDay,
              tripPattern: 'yearly_cycle'
            }
          };

          tripsToCreate.push(trip);
          dayTrips++;
        }
      }

      // Log daily summary
      if (dayOffset % 7 === 6) { // End of week
        console.log(`   ✅ Week completed: ${dayTrips} trips scheduled`);
      }
      
      totalTrips += dayTrips;
    }

    console.log(`\n📊 Total trips to create: ${totalTrips}`);
    console.log(`📈 Average trips per day: ${Math.round(totalTrips / DAYS_TO_SCHEDULE)}`);
    
    // Clear existing scheduled trips for next year
    console.log('\n🗑️ Clearing existing scheduled trips for next year...');
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + DAYS_TO_SCHEDULE);
    
    const deleteResult = await Trip.deleteMany({
      serviceDate: { $gte: today, $lt: endDate },
      status: 'scheduled'
    });
    console.log(`✅ Cleared ${deleteResult.deletedCount} existing scheduled trips`);

    // Insert new trips in batches
    console.log('\n💾 Inserting trips into database...');
    const batchSize = 50; // Smaller batches for better performance
    let insertedCount = 0;

    for (let i = 0; i < tripsToCreate.length; i += batchSize) {
      const batch = tripsToCreate.slice(i, i + batchSize);
      try {
        await Trip.insertMany(batch, { ordered: false });
        insertedCount += batch.length;
        const progress = Math.round((insertedCount / tripsToCreate.length) * 100);
        process.stdout.write(`\r   Progress: ${progress}% (${insertedCount}/${tripsToCreate.length} trips)`);
      } catch (error) {
        console.error(`\n   ⚠️ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      }
    }

    console.log('\n\n✅ YEARLY TRIP SCHEDULING COMPLETE!');
    console.log(`📊 Successfully created ${insertedCount} trips`);
    console.log(`📅 Coverage: ${DAYS_TO_SCHEDULE} days (${today.toDateString()} to ${endDate.toDateString()})`);
    console.log(`🔄 Pattern: Cyclical weekly schedules with seasonal adjustments`);
    console.log(`🚌 Routes: ${routes.length} with variable frequency based on season/day`);
    console.log(`⏰ Service hours: 6:00 AM to 8:00 PM (weekdays), 7:00 AM to 7:00 PM (weekends)\n`);

    // Show detailed statistics
    console.log('📈 YEARLY SCHEDULING STATISTICS:');
    console.log(`   Total trips scheduled: ${insertedCount}`);
    console.log(`   Average per day: ${Math.round(insertedCount / DAYS_TO_SCHEDULE)}`);
    console.log(`   Weekday trips: ${WEEKDAY_TIME_SLOTS.length} slots per route`);
    console.log(`   Weekend trips: ${WEEKEND_TIME_SLOTS.length} slots per route`);
    console.log(`   Seasonal adjustments: ${Object.keys(SEASONAL_MULTIPLIERS).join(', ')}`);
    console.log(`   Holiday periods: ${HOLIDAY_PERIODS.length} periods with reduced service`);
    console.log(`   Maintenance windows: ${MAINTENANCE_WINDOWS.length} periods`);
    
    // Monthly breakdown
    console.log('\n📅 MONTHLY BREAKDOWN:');
    const monthlyStats = {};
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(today.getFullYear(), i, 1);
      const monthEnd = new Date(today.getFullYear(), i + 1, 0);
      const monthTrips = tripsToCreate.filter(trip => 
        trip.serviceDate >= monthStart && trip.serviceDate <= monthEnd
      ).length;
      const monthName = monthStart.toLocaleString('default', { month: 'long' });
      monthlyStats[monthName] = monthTrips;
      console.log(`   ${monthName}: ${monthTrips} trips`);
    }

    console.log('\n🎉 Your yearly trip schedule is now active!');
    console.log('📱 View trips at: http://localhost:5173/admin/streamlined-trips');
    console.log('📊 Monitor at: http://localhost:5173/admin/mass-scheduling');

  } catch (error) {
    console.error('\n❌ Error during yearly auto-scheduling:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the yearly scheduler
connect().then(() => {
  autoScheduleTripsYearly().then(() => {
    console.log('\n✅ Yearly auto-scheduling completed successfully!');
    process.exit(0);
  }).catch((error) => {
    console.error('\n❌ Yearly auto-scheduling failed:', error);
    process.exit(1);
  });
});


const express = require('express');
const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const User = require('../models/User');
const Depot = require('../models/Depot');
const router = express.Router();

// Generate 4 trips per depot with auto-assignments
router.post('/generate-4-per-depot', async (req, res) => {
  try {
    const { date } = req.body || {};
    const serviceDate = date ? new Date(date) : new Date();
    serviceDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(serviceDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Load resources
    const [depots, routes, buses, drivers, conductors] = await Promise.all([
      Depot.find({ status: 'active', isActive: true }).lean(),
      Route.find({ status: 'active', isActive: true }).lean(),
      Bus.find({ status: { $in: ['active', 'idle'] } }).populate('depotId').lean(),
      User.find({ role: 'driver', status: 'active' }).lean(),
      User.find({ role: 'conductor', status: 'active' }).lean()
    ]);

    if (!depots.length || !routes.length || !buses.length) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient resources to generate trips'
      });
    }

    // Build quick lookups
    const driversByDepotId = drivers.reduce((acc, d) => {
      const key = d.depotId ? d.depotId.toString() : 'unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(d);
      return acc;
    }, {});

    const conductorsByDepotId = conductors.reduce((acc, c) => {
      const key = c.depotId ? c.depotId.toString() : 'unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(c);
      return acc;
    }, {});

    // For each depot, pick 4 routes that belong to that depot (or fallback any)
    const tripsToInsert = [];
    const hourSlots = ['06:00', '09:00', '12:00', '15:00', '18:00'];

    for (const depot of depots) {
      const depotIdStr = depot._id.toString();

      const depotRoutes = routes.filter(r => r.depot && r.depot.depotId && r.depot.depotId.toString() === depotIdStr);
      const chosenRoutes = (depotRoutes.length ? depotRoutes : routes).slice(0, 4);

      // Available buses for this depot not already scheduled on that date
      const depotBuses = buses.filter(b => b.depotId && b.depotId._id && b.depotId._id.toString() === depotIdStr);

      // Find already scheduled bus IDs for this depot on the date
      const scheduledTrips = await Trip.find({
        depotId: depot._id,
        serviceDate: { $gte: serviceDate, $lt: nextDate },
        status: { $in: ['scheduled', 'running'] }
      }).select('busId startTime').lean();
      const scheduledBusIds = new Set(scheduledTrips.map(t => t.busId?.toString()).filter(Boolean));

      // Filter buses not used that day
      const availableDepotBuses = depotBuses.filter(b => !scheduledBusIds.has(b._id.toString()));

      // Crew pools
      const depotDrivers = driversByDepotId[depotIdStr] || drivers;
      const depotConductors = conductorsByDepotId[depotIdStr] || conductors;

      let slotIndex = 0;
      for (let i = 0; i < chosenRoutes.length; i++) {
        const route = chosenRoutes[i];
        const bus = availableDepotBuses[i % Math.max(1, availableDepotBuses.length)];
        if (!bus) continue;

        const driver = depotDrivers[i % Math.max(1, depotDrivers.length)];
        const conductor = depotConductors[i % Math.max(1, depotConductors.length)];

        const startTime = hourSlots[(slotIndex++) % hourSlots.length];
        const durationMinutes = route.estimatedDuration || route.duration || 120;
        const [sh, sm] = startTime.split(':').map(n => parseInt(n, 10));
        const endMinutes = sh * 60 + sm + durationMinutes;
        const eh = Math.floor(endMinutes / 60) % 24;
        const em = endMinutes % 60;
        const endTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

        // Fare: baseFare + distance * farePerKm when available; fallback 50
        const baseFare = Number(route.baseFare) || 50;
        const farePerKm = Number(route.farePerKm) || 2;
        const distanceKm = Number(route.totalDistance) || 0;
        const fare = distanceKm > 0 ? Math.round(baseFare + distanceKm * farePerKm) : baseFare;

        const capacity = bus?.capacity?.total || 40;

        tripsToInsert.push({
          routeId: route._id,
          busId: bus._id,
          driverId: driver?._id,
          conductorId: conductor?._id,
          depotId: depot._id,
          serviceDate: serviceDate,
          startTime,
          endTime,
          status: 'scheduled',
          fare,
          capacity,
          availableSeats: capacity,
          bookedSeats: 0,
          bookingOpen: true,
          cancellationPolicy: { hoursBeforeDeparture: 2, refundPercentage: 80 }
        });
      }
    }

    // Insert
    let created = 0;
    let createdTrips = [];
    if (tripsToInsert.length) {
      const result = await Trip.insertMany(tripsToInsert);
      created = result.length;

      // Mark buses as assigned with currentTrip for instant reflection in Bus Management
      const busUpdates = result.map(t => Bus.findByIdAndUpdate(
        t.busId,
        {
          status: 'assigned',
          currentTrip: t._id,
          currentRoute: {
            routeId: t.routeId,
            assignedAt: new Date()
          }
        },
        { new: false }
      ));
      await Promise.allSettled(busUpdates);

      // Return minimal trip info for instant UI update
      createdTrips = result.map(t => ({
        _id: t._id,
        routeId: t.routeId,
        busId: t.busId,
        driverId: t.driverId,
        conductorId: t.conductorId,
        depotId: t.depotId,
        serviceDate: t.serviceDate,
        startTime: t.startTime,
        endTime: t.endTime,
        status: t.status,
        fare: t.fare,
        capacity: t.capacity,
        availableSeats: t.availableSeats,
        bookedSeats: t.bookedSeats
      }));
    }

    return res.json({
      success: true,
      message: `Created ${created} trips (up to 4 per depot)`,
      data: { trips: createdTrips }
    });
  } catch (err) {
    console.error('Error generating 4 trips per depot:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate trips', error: err.message });
  }
});

// Finalize schedule: ensure all scheduled trips have assigned bus, driver, conductor by depot
router.post('/finalize-schedule', async (req, res) => {
  try {
    const { date } = req.body || {};
    const serviceDate = date ? new Date(date) : new Date();
    serviceDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(serviceDate); nextDate.setDate(nextDate.getDate() + 1);

    const [depots, drivers, conductors, buses] = await Promise.all([
      Depot.find({ status: 'active', isActive: true }).lean(),
      User.find({ role: 'driver', status: 'active' }).lean(),
      User.find({ role: 'conductor', status: 'active' }).lean(),
      Bus.find({ status: { $in: ['active', 'idle', 'assigned'] } }).populate('depotId').lean()
    ]);

    const driversByDepot = drivers.reduce((a, d) => {
      const k = d.depotId ? d.depotId.toString() : 'unknown';
      if (!a[k]) a[k] = []; a[k].push(d); return a;
    }, {});
    const conductorsByDepot = conductors.reduce((a, c) => {
      const k = c.depotId ? c.depotId.toString() : 'unknown';
      if (!a[k]) a[k] = []; a[k].push(c); return a;
    }, {});

    const trips = await Trip.find({
      serviceDate: { $gte: serviceDate, $lt: nextDate },
      status: { $in: ['scheduled'] }
    }).lean();

    let updated = 0;
    const ops = [];
    for (const depot of depots) {
      const depotId = depot._id.toString();
      const depotTrips = trips.filter(t => t.depotId?.toString() === depotId);
      if (!depotTrips.length) continue;

      const depotBuses = buses.filter(b => b.depotId && b.depotId._id && b.depotId._id.toString() === depotId);
      const usedBusIds = new Set();
      const usedDrivers = new Set();
      const usedConductors = new Set();

      for (let i = 0; i < depotTrips.length; i++) {
        const t = depotTrips[i];
        const bus = depotBuses.find(b => !usedBusIds.has(b._id.toString()));
        const driver = (driversByDepot[depotId] || drivers).find(d => !usedDrivers.has(d._id.toString()));
        const conductor = (conductorsByDepot[depotId] || conductors).find(c => !usedConductors.has(c._id.toString()));
        if (!bus || !driver || !conductor) continue;

        usedBusIds.add(bus._id.toString());
        usedDrivers.add(driver._id.toString());
        usedConductors.add(conductor._id.toString());

        ops.push(
          Trip.findByIdAndUpdate(t._id, { busId: bus._id, driverId: driver._id, conductorId: conductor._id }, { new: false })
        );
        ops.push(
          Bus.findByIdAndUpdate(bus._id, {
            status: 'assigned',
            currentTrip: t._id,
            currentRoute: { routeId: t.routeId, assignedAt: new Date() }
          }, { new: false })
        );
        updated++;
      }
    }

    if (ops.length) await Promise.allSettled(ops);

    return res.json({ success: true, message: 'Schedule finalized', data: { tripsUpdated: updated } });
  } catch (err) {
    console.error('Error finalizing schedule:', err);
    return res.status(500).json({ success: false, message: 'Failed to finalize schedule', error: err.message });
  }
});

// Generate exactly 100 trips with proper assignment
router.post('/generate-100-trips', async (req, res) => {
  try {
    console.log('🚀 Starting 100 trips generation...');
    
    // Clear all existing trips
    console.log('🗑️ Clearing existing trips...');
    const deleteResult = await Trip.deleteMany({});
    console.log(`✅ Cleared ${deleteResult.deletedCount} existing trips`);

    // Fetch all available data
    const depots = await Depot.find({ status: 'active', isActive: true }).lean();
    const routes = await Route.find({ status: 'active', isActive: true }).lean();
    const buses = await Bus.find({ status: { $in: ['active', 'idle'] } }).populate('depotId').lean();
    const drivers = await User.find({ role: 'driver', status: 'active' }).lean();
    const conductors = await User.find({ role: 'conductor', status: 'active' }).lean();

    console.log(`📊 Available resources:`);
    console.log(`   Depots: ${depots.length}`);    console.log(`   Routes: ${routes.length}`);
    console.log(`   Buses: ${buses.length}`);
    console.log(`   Drivers: ${drivers.length}`);
    console.log(`   Conductors: ${conductors.length}`);

    // Calculate maximum trips we can create based on available resources
    const maxTrips = Math.min(buses.length, routes.length, 100);
    
    if (maxTrips < 10) {
      return res.status(400).json({
        success: false,
        error: `Insufficient resources. Need at least 10 buses and routes to create trips. Available: ${buses.length} buses, ${routes.length} routes.`
      });
    }

    console.log(`🎯 Will create ${maxTrips} trips using available resources`);

    // Group routes by origin city for logical assignment
    const normalizeCityName = (name) => {
      return name.toUpperCase().replace(/[^A-Z]/g, '');
    };

    const routesByOriginCity = {};
    routes.forEach(route => {
      const match = route.routeName.match(/^(\w+)\s+to\s+(\w+)/i);
      if (match && match[1]) {
        const originCity = normalizeCityName(match[1]);
        if (!routesByOriginCity[originCity]) {
          routesByOriginCity[originCity] = [];
        }
        routesByOriginCity[originCity].push(route);
      }
    });

    // Create trips based on available resources
    const allTripsToCreate = [];
    const usedBuses = new Set();
    const usedDrivers = new Set();
    const usedConductors = new Set();

    // Distribute trips across depots
    const tripsPerDepot = Math.floor(maxTrips / depots.length);
    const remainingTrips = maxTrips % depots.length;

    let tripCount = 0;
    for (let i = 0; i < depots.length && tripCount < maxTrips; i++) {
      const depot = depots[i];
      const depotCity = normalizeCityName(depot.location.city);
      const availableBusesForDepot = buses.filter(b => 
        b.depotId && 
        b.depotId._id.toString() === depot._id.toString() && 
        !usedBuses.has(b._id.toString())
      );
      const availableRoutesFromDepotCity = routesByOriginCity[depotCity] || [];

      // Calculate how many trips this depot should get
      const depotTripCount = tripsPerDepot + (i < remainingTrips ? 1 : 0);
      const actualTripCount = Math.min(
        depotTripCount,
        availableBusesForDepot.length,
        availableRoutesFromDepotCity.length || routes.length
      );

      console.log(`🏢 ${depot.depotName}: Creating ${actualTripCount} trips`);

      for (let j = 0; j < actualTripCount && tripCount < maxTrips; j++) {
        // Select resources
        const selectedBus = availableBusesForDepot[j % availableBusesForDepot.length];
        const selectedRoute = availableRoutesFromDepotCity.length > 0 
          ? availableRoutesFromDepotCity[j % availableRoutesFromDepotCity.length]
          : routes[tripCount % routes.length];
        const selectedDriver = drivers[tripCount % drivers.length];
        const selectedConductor = conductors[tripCount % conductors.length];

        // Generate departure time (6 AM to 10 PM, distributed evenly)
        const hour = 6 + Math.floor((tripCount * 16) / 100); // Distribute across 16 hours
        const minute = (tripCount * 15) % 60; // 15-minute intervals
        const departureTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // Calculate arrival time
        const routeDuration = selectedRoute.duration || 120; // Default 2 hours
        const departureMinutes = hour * 60 + minute;
        const arrivalMinutes = departureMinutes + routeDuration;
        const arrivalHour = Math.floor(arrivalMinutes / 60) % 24;
        const arrivalMinute = arrivalMinutes % 60;
        const arrivalTime = `${arrivalHour.toString().padStart(2, '0')}:${arrivalMinute.toString().padStart(2, '0')}`;

        const trip = {
          routeId: selectedRoute._id,
          busId: selectedBus._id,
          driverId: selectedDriver._id,
          conductorId: selectedConductor._id,
          depotId: depot._id,
          serviceDate: new Date(),
          startTime: departureTime,
          endTime: arrivalTime,
          status: 'scheduled',
          fare: selectedRoute.baseFare || 50,
          capacity: selectedBus.capacity.total,
          availableSeats: selectedBus.capacity.total,
          bookedSeats: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        allTripsToCreate.push(trip);
        usedBuses.add(selectedBus._id.toString());
        usedDrivers.add(selectedDriver._id.toString());
        usedConductors.add(selectedConductor._id.toString());
        
        tripCount++;
      }
    }

    // Insert trips in batches
    console.log(`💾 Inserting ${allTripsToCreate.length} trips to database...`);
    if (allTripsToCreate.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < allTripsToCreate.length; i += batchSize) {
        const batch = allTripsToCreate.slice(i, i + batchSize);
        await Trip.insertMany(batch);
        console.log(`   📦 Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allTripsToCreate.length / batchSize)}`);
      }
    }

    // Verify final count
    const finalCount = await Trip.countDocuments();
    
    console.log('🎉 TRIPS GENERATION COMPLETE!');
    console.log(`   📊 Total trips created: ${allTripsToCreate.length}`);
    console.log(`   📊 Total trips in database: ${finalCount}`);
    console.log(`   🚌 Buses utilized: ${usedBuses.size}`);
    console.log(`   👨‍💼 Drivers utilized: ${usedDrivers.size}`);
    console.log(`   👨‍💼 Conductors utilized: ${usedConductors.size}`);

    res.json({
      success: true,
      message: `Successfully generated ${allTripsToCreate.length} trips using available resources`,
      data: {
        tripsCreated: allTripsToCreate.length,
        totalInDatabase: finalCount,
        busesUsed: usedBuses.size,
        driversUsed: usedDrivers.size,
        conductorsUsed: usedConductors.size,
        maxPossibleTrips: maxTrips
      }
    });

  } catch (error) {
    console.error('❌ Error generating 100 trips:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate trips',
      details: error.message
    });
  }
});

// Get current trip count
router.get('/trip-count', async (req, res) => {
  try {
    const totalTrips = await Trip.countDocuments();
    const tripsByStatus = await Trip.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        total: totalTrips,
        byStatus: tripsByStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get trip count',
      details: error.message
    });
  }
});

// Clear all trips endpoint
router.post('/clear-all', async (req, res) => {
  try {
    console.log('🗑️ Clearing all trips...');
    
    const deleteResult = await Trip.deleteMany({});
    console.log(`✅ Cleared ${deleteResult.deletedCount} trips`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${deleteResult.deletedCount} trips`,
      data: {
        deletedCount: deleteResult.deletedCount
      }
    });
    
  } catch (error) {
    console.error('❌ Error clearing trips:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear trips',
      details: error.message
    });
  }
});

module.exports = router;

require("dotenv").config();
const mongoose = require("mongoose");
const Trip = require("./models/Trip");
const Route = require("./models/Route");
const Bus = require("./models/Bus");
const Depot = require("./models/Depot");

async function scheduleTripsForToday() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log("\n📅 Scheduling trips for:", today.toDateString());

    // Get all active routes
    const routes = await Route.find({ status: "active" }).limit(20).lean();
    console.log(`\n🛣️  Found ${routes.length} active routes`);

    // Get all available buses
    const buses = await Bus.find({ status: "active" }).limit(20).lean();
    console.log(`🚌 Found ${buses.length} available buses`);

    // Get all depots
    const depots = await Depot.find({}).lean();
    console.log(`🏢 Found ${depots.length} depots`);

    if (routes.length === 0 || buses.length === 0 || depots.length === 0) {
      console.log("\n❌ Missing required data (routes, buses, or depots)");
      await mongoose.connection.close();
      return;
    }

    const tripsToCreate = [];
    const timeslots = [
      { start: "06:00", end: "10:00" },
      { start: "08:00", end: "12:00" },
      { start: "10:00", end: "14:00" },
      { start: "12:00", end: "16:00" },
      { start: "14:00", end: "18:00" },
      { start: "16:00", end: "20:00" },
      { start: "18:00", end: "22:00" },
      { start: "20:00", end: "00:00" },
    ];

    // Create trips for each route
    for (let i = 0; i < Math.min(routes.length, 10); i++) {
      const route = routes[i];
      const bus = buses[i % buses.length];
      const depot = depots[i % depots.length];

      // Create 2-3 trips per route for today
      const numTrips = 2 + Math.floor(Math.random() * 2); // 2-3 trips

      for (let j = 0; j < numTrips; j++) {
        const timeslot = timeslots[j % timeslots.length];

        const trip = {
          routeId: route._id,
          busId: bus._id,
          depotId: depot._id,
          serviceDate: today,
          startTime: timeslot.start,
          endTime: timeslot.end,
          fare: route.baseFare || 100 + Math.floor(Math.random() * 400),
          status: "scheduled",
          bookingOpen: true,
          capacity: bus.capacity?.total || bus.capacity || 40,
          availableSeats: bus.capacity?.total || bus.capacity || 40,
          bookedSeats: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        tripsToCreate.push(trip);
      }
    }

    console.log(`\n📝 Creating ${tripsToCreate.length} trips...`);

    // Insert trips
    const result = await Trip.insertMany(tripsToCreate);
    console.log(`✅ Successfully created ${result.length} trips`);

    // Show sample trips
    console.log("\n📋 Sample trips created:");
    const sampleTrips = await Trip.find({
      serviceDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    })
      .populate("routeId", "routeName startingPoint endingPoint")
      .populate("busId", "busNumber")
      .limit(10)
      .lean();

    sampleTrips.forEach((trip, i) => {
      console.log(`\n${i + 1}. ${trip.routeId?.routeName || "Unknown Route"}`);
      console.log(
        `   From: ${trip.routeId?.startingPoint?.city || trip.routeId?.startingPoint || "N/A"}`,
      );
      console.log(
        `   To: ${trip.routeId?.endingPoint?.city || trip.routeId?.endingPoint || "N/A"}`,
      );
      console.log(`   Bus: ${trip.busId?.busNumber || "N/A"}`);
      console.log(`   Time: ${trip.startTime} - ${trip.endTime}`);
      console.log(`   Fare: ₹${trip.fare}`);
      console.log(`   Status: ${trip.status}`);
    });

    // Also schedule for next 7 days
    console.log("\n📅 Scheduling trips for next 7 days...");

    for (let day = 1; day <= 7; day++) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + day);

      const futureTrips = tripsToCreate.map((trip) => ({
        ...trip,
        serviceDate: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await Trip.insertMany(futureTrips);
      console.log(
        `✅ Created ${futureTrips.length} trips for ${futureDate.toDateString()}`,
      );
    }

    console.log("\n✅ All trips scheduled successfully!");

    await mongoose.connection.close();
    console.log("✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

scheduleTripsForToday();

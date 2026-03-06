/**
 * Test Autonomous Scheduling Logic Directly (No Server Required)
 */

const mongoose = require("mongoose");
const Route = require("./models/Route");
const Bus = require("./models/Bus");
const Driver = require("./models/Driver");
const Conductor = require("./models/Conductor");
const Depot = require("./models/Depot");
const Booking = require("./models/Booking");

require("dotenv").config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/yatrik-erp";

async function testDirectScheduling() {
  console.log("🧪 Testing Autonomous Scheduling Logic Directly...\n");

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    console.log("📊 STEP 1: Data Aggregation...");
    const [routes, buses, drivers, conductors, depots, bookings] =
      await Promise.all([
        Route.find({ status: "active" })
          .select(
            "routeName routeNumber totalDistance estimatedDuration startingPoint endingPoint depot",
          )
          .lean(),
        Bus.find({
          status: "active",
          maintenanceStatus: { $ne: "in_maintenance" },
        })
          .populate("depotId", "name")
          .select("busNumber capacity status depotId")
          .lean(),
        Driver.find({ status: "active" })
          .populate("depotId", "name")
          .select("name employeeCode depotId")
          .lean(),
        Conductor.find({ status: "active" })
          .populate("depotId", "name")
          .select("name employeeCode depotId")
          .lean(),
        Depot.find({ status: "active" }).select("name location").lean(),
        Booking.find({ status: "confirmed" }).countDocuments(),
      ]);

    console.log(`✅ Aggregated:`);
    console.log(`   Routes: ${routes.length}`);
    console.log(`   Buses: ${buses.length}`);
    console.log(`   Drivers: ${drivers.length}`);
    console.log(`   Conductors: ${conductors.length}`);
    console.log(`   Depots: ${depots.length}`);
    console.log(`   Bookings: ${bookings}\n`);

    // Check data structure
    if (routes.length > 0) {
      console.log("📍 Sample Route Structure:");
      const sampleRoute = routes[0];
      console.log(`   Route Name: ${sampleRoute.routeName}`);
      console.log(`   Route Number: ${sampleRoute.routeNumber}`);
      console.log(`   Depot: ${JSON.stringify(sampleRoute.depot)}`);
      console.log(`   Depot ID: ${sampleRoute.depot?.depotId}`);
      console.log("");
    }

    if (buses.length > 0) {
      console.log("🚌 Sample Bus Structure:");
      const sampleBus = buses[0];
      console.log(`   Bus Number: ${sampleBus.busNumber}`);
      console.log(`   Depot ID: ${sampleBus.depotId}`);
      console.log(`   Depot (populated): ${JSON.stringify(sampleBus.depotId)}`);
      console.log("");
    }

    if (drivers.length > 0) {
      console.log("👨‍✈️ Sample Driver Structure:");
      const sampleDriver = drivers[0];
      console.log(`   Name: ${sampleDriver.name}`);
      console.log(`   Employee Code: ${sampleDriver.employeeCode}`);
      console.log(`   Depot ID: ${sampleDriver.depotId}`);
      console.log(
        `   Depot (populated): ${JSON.stringify(sampleDriver.depotId)}`,
      );
      console.log("");
    }

    // Test depot ID extraction
    console.log("🔍 Testing Depot ID Extraction:");
    if (routes.length > 0) {
      const route = routes[0];
      const routeDepotId = route.depot?.depotId?.toString();
      console.log(`   Route Depot ID: ${routeDepotId || "NOT FOUND"}`);
    }

    if (buses.length > 0) {
      const bus = buses[0];
      const busDepotId =
        bus.depotId?._id?.toString() || bus.depotId?.toString();
      console.log(`   Bus Depot ID: ${busDepotId || "NOT FOUND"}`);
    }

    if (drivers.length > 0) {
      const driver = drivers[0];
      const driverDepotId =
        driver.depotId?._id?.toString() || driver.depotId?.toString();
      console.log(`   Driver Depot ID: ${driverDepotId || "NOT FOUND"}`);
    }

    console.log("\n✅ Data structure test complete!");
    console.log("\n📝 Summary:");
    console.log("   - Routes use: depot.depotId (ObjectId)");
    console.log("   - Buses use: depotId (ObjectId, can be populated)");
    console.log("   - Drivers use: depotId (ObjectId, can be populated)");
    console.log("   - Conductors use: depotId (ObjectId, can be populated)");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

testDirectScheduling();

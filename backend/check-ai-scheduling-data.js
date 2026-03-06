/**
 * Check AI Scheduling Data Availability
 * Verifies if the database has sufficient data for autonomous scheduling
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

async function checkData() {
  console.log("🔍 Checking AI Scheduling Data Availability...\n");

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Check all required collections
    const [
      routeCount,
      busCount,
      driverCount,
      conductorCount,
      depotCount,
      bookingCount,
    ] = await Promise.all([
      Route.countDocuments({ status: "active" }),
      Bus.countDocuments({
        status: "active",
        maintenanceStatus: { $ne: "in_maintenance" },
      }),
      Driver.countDocuments({ status: "active" }),
      Conductor.countDocuments({ status: "active" }),
      Depot.countDocuments({ status: "active" }),
      Booking.countDocuments({ status: "confirmed" }),
    ]);

    console.log("📊 Data Availability Report");
    console.log("═".repeat(50));
    console.log(`Routes (active):      ${routeCount}`);
    console.log(`Buses (active):       ${busCount}`);
    console.log(`Drivers (active):     ${driverCount}`);
    console.log(`Conductors (active):  ${conductorCount}`);
    console.log(`Depots (active):      ${depotCount}`);
    console.log(`Bookings (confirmed): ${bookingCount}`);
    console.log("═".repeat(50));

    // Check minimum requirements
    const requirements = {
      routes: { current: routeCount, minimum: 1, status: routeCount >= 1 },
      buses: { current: busCount, minimum: 1, status: busCount >= 1 },
      drivers: { current: driverCount, minimum: 1, status: driverCount >= 1 },
      conductors: {
        current: conductorCount,
        minimum: 1,
        status: conductorCount >= 1,
      },
      depots: { current: depotCount, minimum: 1, status: depotCount >= 1 },
    };

    console.log("\n✅ Requirements Check");
    console.log("─".repeat(50));

    let allRequirementsMet = true;
    for (const [resource, data] of Object.entries(requirements)) {
      const status = data.status ? "✓" : "✗";
      const statusText = data.status ? "OK" : "INSUFFICIENT";
      console.log(
        `${status} ${resource.padEnd(15)}: ${data.current}/${data.minimum} - ${statusText}`,
      );
      if (!data.status) allRequirementsMet = false;
    }

    console.log("\n");

    if (allRequirementsMet) {
      console.log("🎉 All requirements met! AI Scheduling is ready to use.");
      console.log("\nYou can now:");
      console.log(
        "1. Access: http://localhost:3000/admin/autonomous-scheduling",
      );
      console.log('2. Click "Run Full AI Fleet Scheduling" button');
      console.log("3. View the optimized schedule results");
    } else {
      console.log("⚠️  Insufficient data for AI Scheduling!");
      console.log("\nTo fix this, run one of these scripts:");
      console.log("1. node backend/check-and-create-sample-data.js");
      console.log("2. node backend/create-sample-data.js");
      console.log("3. node backend/setup-all-depots.js");
      console.log("\nOr create data manually through the admin panel.");
    }

    // Show sample data from each collection
    if (routeCount > 0) {
      console.log("\n📍 Sample Routes:");
      const sampleRoutes = await Route.find({ status: "active" })
        .limit(3)
        .select("routeName routeNumber origin destination");
      sampleRoutes.forEach((route) => {
        console.log(
          `  - ${route.routeName} (${route.routeNumber}): ${route.origin} → ${route.destination}`,
        );
      });
    }

    if (busCount > 0) {
      console.log("\n🚌 Sample Buses:");
      const sampleBuses = await Bus.find({
        status: "active",
        maintenanceStatus: { $ne: "in_maintenance" },
      })
        .limit(3)
        .populate("depotId", "name")
        .select("busNumber capacity depotId");
      sampleBuses.forEach((bus) => {
        console.log(
          `  - ${bus.busNumber} (Capacity: ${bus.capacity}) - Depot: ${bus.depotId?.name || "N/A"}`,
        );
      });
    }

    if (driverCount > 0) {
      console.log("\n👨‍✈️ Sample Drivers:");
      const sampleDrivers = await Driver.find({ status: "active" })
        .limit(3)
        .populate("depotId", "name")
        .select("name employeeCode depotId");
      sampleDrivers.forEach((driver) => {
        console.log(
          `  - ${driver.name} (${driver.employeeCode}) - Depot: ${driver.depotId?.name || "N/A"}`,
        );
      });
    }

    console.log("\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

checkData().catch(console.error);

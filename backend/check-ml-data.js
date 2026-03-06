/**
 * Quick script to check if you have enough data for ML training
 */

const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const Trip = require("./models/Trip");
const CrewFatigue = require("./models/CrewFatigue");
const Route = require("./models/Route");
const Booking = require("./models/Booking");

async function checkData() {
  try {
    console.log("🔌 Connecting to MongoDB...");

    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/yatrik-erp",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000,
      },
    );

    console.log("✅ Connected successfully!\n");

    // Count documents
    console.log("📊 Checking available data...\n");

    const tripCount = await Trip.countDocuments();
    const completedTrips = await Trip.countDocuments({ status: "completed" });
    const fatigueCount = await CrewFatigue.countDocuments();
    const routeCount = await Route.countDocuments({ status: "active" });
    const bookingCount = await Booking.countDocuments();

    console.log("=".repeat(60));
    console.log("DATA AVAILABILITY REPORT");
    console.log("=".repeat(60));

    console.log("\n📍 Trips:");
    console.log(`   Total trips: ${tripCount}`);
    console.log(`   Completed trips: ${completedTrips}`);
    console.log(
      `   Status: ${completedTrips >= 1000 ? "✅ Ready for ML" : `❌ Need ${1000 - completedTrips} more`}`,
    );

    console.log("\n😴 Crew Fatigue:");
    console.log(`   Fatigue records: ${fatigueCount}`);
    console.log(
      `   Status: ${fatigueCount >= 500 ? "✅ Ready for ML" : `❌ Need ${500 - fatigueCount} more`}`,
    );

    console.log("\n🚌 Routes:");
    console.log(`   Active routes: ${routeCount}`);
    console.log(
      `   Status: ${routeCount >= 10 ? "✅ Good" : "⚠️  Limited routes"}`,
    );

    console.log("\n🎫 Bookings:");
    console.log(`   Total bookings: ${bookingCount}`);
    console.log(
      `   Status: ${bookingCount >= 500 ? "✅ Good" : "⚠️  Limited bookings"}`,
    );

    console.log("\n" + "=".repeat(60));
    console.log("ML READINESS ASSESSMENT");
    console.log("=".repeat(60));

    const demandReady = completedTrips >= 1000;
    const fatigueReady = fatigueCount >= 500;

    console.log("\n🎯 Passenger Demand Prediction:");
    if (demandReady) {
      console.log("   ✅ READY - You have enough data to train!");
      console.log('   Next: Run "node ml-research/collect_training_data.js"');
    } else if (completedTrips >= 100) {
      console.log(
        "   ⚠️  LIMITED DATA - You can train but results may be poor",
      );
      console.log(
        `   Recommendation: Collect ${1000 - completedTrips} more trips for better results`,
      );
    } else {
      console.log("   ❌ NOT READY - Need more data");
      console.log(`   Recommendation: Run system for 2-3 more months`);
      console.log(`   OR use sample data generation script`);
    }

    console.log("\n🧠 Crew Fatigue Prediction:");
    if (fatigueReady) {
      console.log("   ✅ READY - You have enough data to train!");
    } else if (fatigueCount >= 100) {
      console.log(
        "   ⚠️  LIMITED DATA - You can train but results may be poor",
      );
      console.log(
        `   Recommendation: Collect ${500 - fatigueCount} more records`,
      );
    } else {
      console.log("   ❌ NOT READY - Need more data");
      console.log(
        `   Recommendation: Run fatigue monitoring for 1-2 more months`,
      );
    }

    console.log("\n" + "=".repeat(60));
    console.log("RECOMMENDATIONS");
    console.log("=".repeat(60));

    if (demandReady) {
      console.log("\n✅ You're ready to start ML training!");
      console.log("\nNext steps:");
      console.log("1. Run: node ml-research/collect_training_data.js");
      console.log("2. Upload data to Google Colab");
      console.log("3. Train your first model!");
    } else if (completedTrips >= 100) {
      console.log("\n⚠️  You have limited data but can proceed:");
      console.log(
        "\nOption 1: Train with current data (may have lower accuracy)",
      );
      console.log("   Run: node ml-research/collect_training_data.js");
      console.log("\nOption 2: Generate sample data for testing");
      console.log("   Run: node backend/check-and-create-sample-data.js");
      console.log("\nOption 3: Wait for more real data (recommended)");
      console.log("   Continue running your system for 1-2 more months");
    } else {
      console.log("\n❌ Not enough data yet");
      console.log("\nOptions:");
      console.log("1. Generate sample data for testing:");
      console.log("   Run: node backend/check-and-create-sample-data.js");
      console.log("\n2. Wait for real data:");
      console.log("   Continue running your system for 2-3 months");
      console.log("   Target: 1000+ completed trips");
    }

    console.log("\n" + "=".repeat(60));
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("\n🔧 Troubleshooting:");
    console.error("1. Make sure MongoDB is running");
    console.error("2. Check your .env file for MONGODB_URI");
    console.error("3. Verify connection string is correct");
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the check
checkData();

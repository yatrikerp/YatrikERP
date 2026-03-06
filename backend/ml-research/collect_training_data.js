/**
 * Data Collection Script for ML Training
 * Exports historical data from MongoDB for model training
 */

const mongoose = require("mongoose");
const fs = require("fs").promises;
const Trip = require("../models/Trip");
const Booking = require("../models/Booking");
const CrewFatigue = require("../models/CrewFatigue");
const DemandPrediction = require("../models/DemandPrediction");
const Route = require("../models/Route");
const User = require("../models/User");

// Connect to MongoDB with increased timeout
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/yatrik-erp",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  },
);

/**
 * Collect demand prediction training data
 */
async function collectDemandData() {
  console.log("📊 Collecting demand prediction data...");

  const trips = await Trip.find({
    status: "completed",
    serviceDate: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }, // Last 6 months
  })
    .populate("routeId", "routeName totalDistance")
    .lean();

  const demandData = trips.map((trip) => {
    const date = new Date(trip.serviceDate);
    const hour = parseInt(trip.startTime?.split(":")[0] || 8);

    return {
      trip_id: trip._id,
      route_id: trip.routeId?._id,
      route_name: trip.routeId?.routeName,
      date: date.toISOString().split("T")[0],
      day_of_week: date.getDay(),
      month: date.getMonth() + 1,
      hour: hour,
      time_slot: trip.startTime,
      is_weekend: date.getDay() === 0 || date.getDay() === 6,
      is_peak_hour: (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19),
      passengers: trip.totalPassengers || trip.bookedSeats || 0,
      capacity: trip.capacity || 50,
      utilization: ((trip.totalPassengers || 0) / (trip.capacity || 50)) * 100,
      distance: trip.routeId?.totalDistance || 0,
      fare: trip.fare || 0,
      revenue: (trip.totalPassengers || 0) * (trip.fare || 0),
    };
  });

  await fs.writeFile(
    "ml-research/data/demand_training_data.json",
    JSON.stringify(demandData, null, 2),
  );

  console.log(`✅ Collected ${demandData.length} demand records`);
  return demandData;
}

/**
 * Collect crew fatigue training data
 */
async function collectFatigueData() {
  console.log("😴 Collecting crew fatigue data...");

  const fatigueRecords = await CrewFatigue.find({
    date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 3 months
  })
    .populate("crewId", "name age experience")
    .lean();

  const fatigueData = fatigueRecords.map((record) => ({
    crew_id: record.crewId?._id,
    crew_name: record.crewId?.name,
    crew_type: record.crewType,
    age: record.crewId?.age || 35,
    experience_years: record.crewId?.experience || 5,
    date: record.date.toISOString().split("T")[0],
    fatigue_score: record.fatigueScore,
    daily_working_hours: record.workloadMetrics?.dailyWorkingHours || 0,
    total_distance_covered: record.workloadMetrics?.totalDistanceCovered || 0,
    consecutive_working_days:
      record.workloadMetrics?.consecutiveWorkingDays || 0,
    night_shift_count: record.workloadMetrics?.nightShiftCount || 0,
    rest_hours_since_last_shift:
      record.workloadMetrics?.restHoursSinceLastShift || 8,
    trips_completed_today: record.workloadMetrics?.tripsCompletedToday || 0,
    long_distance_trips: record.workloadMetrics?.longDistanceTrips || 0,
    is_eligible: record.eligibilityStatus?.isEligible || false,
    weekly_average_fatigue: record.weeklyAverageFatigue || 0,
  }));

  await fs.writeFile(
    "ml-research/data/fatigue_training_data.json",
    JSON.stringify(fatigueData, null, 2),
  );

  console.log(`✅ Collected ${fatigueData.length} fatigue records`);
  return fatigueData;
}

/**
 * Collect route performance data
 */
async function collectRoutePerformance() {
  console.log("🚌 Collecting route performance data...");

  const routes = await Route.find({ status: "active" }).lean();
  const routeStats = [];

  for (const route of routes) {
    const trips = await Trip.find({
      routeId: route._id,
      status: "completed",
      serviceDate: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    }).lean();

    if (trips.length === 0) continue;

    const avgPassengers =
      trips.reduce((sum, t) => sum + (t.totalPassengers || 0), 0) /
      trips.length;
    const avgUtilization = (avgPassengers / (route.capacity || 50)) * 100;
    const totalRevenue = trips.reduce(
      (sum, t) => sum + (t.totalPassengers || 0) * (t.fare || 0),
      0,
    );

    routeStats.push({
      route_id: route._id,
      route_name: route.routeName,
      origin: route.origin,
      destination: route.destination,
      distance: route.totalDistance,
      duration: route.estimatedDuration,
      base_fare: route.baseFare,
      trip_count: trips.length,
      avg_passengers: Math.round(avgPassengers),
      avg_utilization: Math.round(avgUtilization),
      total_revenue: totalRevenue,
      revenue_per_trip: Math.round(totalRevenue / trips.length),
    });
  }

  await fs.writeFile(
    "ml-research/data/route_performance_data.json",
    JSON.stringify(routeStats, null, 2),
  );

  console.log(`✅ Collected ${routeStats.length} route performance records`);
  return routeStats;
}

/**
 * Generate summary statistics
 */
async function generateSummary(demandData, fatigueData, routeData) {
  const summary = {
    collection_date: new Date().toISOString(),
    data_period: "6 months (demand), 3 months (fatigue)",
    statistics: {
      demand: {
        total_records: demandData.length,
        unique_routes: new Set(demandData.map((d) => d.route_id)).size,
        avg_passengers: Math.round(
          demandData.reduce((sum, d) => sum + d.passengers, 0) /
            demandData.length,
        ),
        avg_utilization: Math.round(
          demandData.reduce((sum, d) => sum + d.utilization, 0) /
            demandData.length,
        ),
        date_range: {
          start: demandData[0]?.date,
          end: demandData[demandData.length - 1]?.date,
        },
      },
      fatigue: {
        total_records: fatigueData.length,
        unique_crew: new Set(fatigueData.map((f) => f.crew_id)).size,
        avg_fatigue_score: Math.round(
          fatigueData.reduce((sum, f) => sum + f.fatigue_score, 0) /
            fatigueData.length,
        ),
        high_fatigue_count: fatigueData.filter((f) => f.fatigue_score >= 70)
          .length,
        ineligible_count: fatigueData.filter((f) => !f.is_eligible).length,
      },
      routes: {
        total_routes: routeData.length,
        avg_passengers_per_route: Math.round(
          routeData.reduce((sum, r) => sum + r.avg_passengers, 0) /
            routeData.length,
        ),
        total_revenue: routeData.reduce((sum, r) => sum + r.total_revenue, 0),
      },
    },
    ml_readiness: {
      demand_prediction: demandData.length >= 1000 ? "Ready" : "Need more data",
      fatigue_prediction:
        fatigueData.length >= 500 ? "Ready" : "Need more data",
      recommended_next_steps: [
        "Export data to CSV for Python ML training",
        "Perform exploratory data analysis (EDA)",
        "Train LSTM model for demand prediction",
        "Train Random Forest/XGBoost for fatigue prediction",
        "Validate models with cross-validation",
        "Deploy models and integrate with backend",
      ],
    },
  };

  await fs.writeFile(
    "ml-research/data/data_summary.json",
    JSON.stringify(summary, null, 2),
  );

  console.log("\n📈 Data Collection Summary:");
  console.log(JSON.stringify(summary, null, 2));

  return summary;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log("🚀 Starting ML training data collection...\n");

    // Wait for MongoDB connection
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connection.asPromise();
    console.log("✅ MongoDB connected successfully\n");

    // Create data directory
    await fs.mkdir("ml-research/data", { recursive: true });

    // Collect all data
    const demandData = await collectDemandData();
    const fatigueData = await collectFatigueData();
    const routeData = await collectRoutePerformance();

    // Generate summary
    await generateSummary(demandData, fatigueData, routeData);

    console.log("\n✅ Data collection complete!");
    console.log("📁 Files saved in ml-research/data/");
    console.log("\nNext steps:");
    console.log("1. Convert JSON to CSV: node ml-research/json_to_csv.js");
    console.log("2. Run EDA: python ml-research/exploratory_analysis.py");
    console.log("3. Train models: python ml-research/train_models.py");
  } catch (error) {
    console.error("❌ Error collecting data:", error);
    console.error("\n🔧 Troubleshooting:");
    console.error("1. Make sure MongoDB is running");
    console.error("2. Check your .env file for MONGODB_URI");
    console.error(
      "3. Verify backend server is not already using the connection",
    );
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  collectDemandData,
  collectFatigueData,
  collectRoutePerformance,
  generateSummary,
};

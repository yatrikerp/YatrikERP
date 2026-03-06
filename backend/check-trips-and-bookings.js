require("dotenv").config();
const mongoose = require("mongoose");
const Trip = require("./models/Trip");
const Booking = require("./models/Booking");
const Route = require("./models/Route");
const Bus = require("./models/Bus");

async function checkTripsAndBookings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check trips
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log("\n📅 Checking trips for today:", today.toDateString());

    const tripsToday = await Trip.find({
      serviceDate: { $gte: today, $lt: tomorrow },
      status: { $in: ["scheduled", "running", "boarding"] },
      bookingOpen: true,
    })
      .populate("routeId", "routeName startingPoint endingPoint")
      .populate("busId", "busNumber")
      .lean();

    console.log(`\n🚌 Found ${tripsToday.length} trips for today:`);
    tripsToday.forEach((trip, i) => {
      console.log(`\n${i + 1}. Trip ID: ${trip._id}`);
      console.log(`   Route: ${trip.routeId?.routeName || "N/A"}`);
      console.log(
        `   From: ${trip.routeId?.startingPoint?.city || trip.routeId?.startingPoint || "N/A"}`,
      );
      console.log(
        `   To: ${trip.routeId?.endingPoint?.city || trip.routeId?.endingPoint || "N/A"}`,
      );
      console.log(`   Bus: ${trip.busId?.busNumber || "N/A"}`);
      console.log(`   Time: ${trip.startTime} - ${trip.endTime}`);
      console.log(`   Status: ${trip.status}`);
      console.log(`   Booking Open: ${trip.bookingOpen}`);
    });

    // Check all scheduled trips (next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const allTrips = await Trip.find({
      serviceDate: { $gte: today, $lt: nextWeek },
      status: { $in: ["scheduled", "running", "boarding"] },
      bookingOpen: true,
    }).countDocuments();

    console.log(`\n📊 Total scheduled trips (next 7 days): ${allTrips}`);

    // Check routes
    const routes = await Route.find({}).lean();
    console.log(`\n🛣️  Total routes in database: ${routes.length}`);

    if (routes.length > 0) {
      console.log("\nSample routes:");
      routes.slice(0, 5).forEach((route, i) => {
        console.log(
          `${i + 1}. ${route.routeName} (${route.startingPoint?.city || route.startingPoint} → ${route.endingPoint?.city || route.endingPoint})`,
        );
      });
    }

    // Check bookings
    const totalBookings = await Booking.countDocuments();
    console.log(`\n🎫 Total bookings in database: ${totalBookings}`);

    // Check bookings for ritotensy user
    const User = require("./models/User");
    const user = await User.findOne({ email: "ritotensy@gmail.com" });

    if (user) {
      console.log(`\n👤 User found: ${user.name} (${user.email})`);
      console.log(`   User ID: ${user._id}`);
      console.log(`   Role: ${user.role}`);

      const userBookings = await Booking.find({ createdBy: user._id })
        .populate("tripId")
        .lean();

      console.log(`\n🎫 Bookings for ${user.email}: ${userBookings.length}`);

      if (userBookings.length > 0) {
        console.log("\nBooking details:");
        userBookings.forEach((booking, i) => {
          console.log(
            `\n${i + 1}. Booking ID: ${booking.bookingId || booking._id}`,
          );
          console.log(`   Status: ${booking.status}`);
          console.log(`   From: ${booking.journey?.from || "N/A"}`);
          console.log(`   To: ${booking.journey?.to || "N/A"}`);
          console.log(`   Date: ${booking.journey?.departureDate || "N/A"}`);
          console.log(
            `   Seats: ${booking.seats?.map((s) => s.seatNumber).join(", ") || "N/A"}`,
          );
          console.log(`   Amount: ₹${booking.pricing?.totalAmount || 0}`);
          console.log(`   Created: ${booking.createdAt}`);
        });
      } else {
        console.log("   No bookings found for this user");
      }
    } else {
      console.log("\n❌ User ritotensy@gmail.com not found");
    }

    // Check if there are any trips at all
    const anyTrips = await Trip.countDocuments();
    console.log(`\n📊 Total trips in database (all statuses): ${anyTrips}`);

    if (anyTrips === 0) {
      console.log("\n⚠️  WARNING: No trips found in database!");
      console.log(
        "   You may need to run the trip scheduling script to create trips.",
      );
      console.log("   Run: node backend/auto-schedule-trips-30days.js");
    }

    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkTripsAndBookings();

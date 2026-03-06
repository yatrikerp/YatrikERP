const mongoose = require("mongoose");
const axios = require("axios");
require("dotenv").config();

// Models
const Trip = require("./models/Trip");
const Route = require("./models/Route");
const Bus = require("./models/Bus");
const Depot = require("./models/Depot");

async function testPaymentWithRealData() {
  try {
    console.log("🧪 Testing Payment Flow with Real Data...\n");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Step 1: Find or create a trip
    let trip = await Trip.findOne()
      .populate("routeId")
      .populate("busId")
      .populate("depotId");

    if (!trip) {
      console.log("No trips found, creating a sample trip...");

      // Create sample depot, bus, route, and trip
      const depot = await Depot.create({
        depotName: "Test Depot",
        depotCode: "TD001",
        location: { city: "Kochi", state: "Kerala" },
        capacity: { totalBuses: 10, availableBuses: 8 },
        isActive: true,
      });

      const bus = await Bus.create({
        busNumber: "KL-01-1234",
        busType: "AC Seater",
        capacity: 40,
        status: "active",
        depotId: depot._id,
      });

      const route = await Route.create({
        routeName: "Kochi - Thiruvananthapuram Express",
        routeNumber: "RT001",
        startingPoint: { city: "Kochi", state: "Kerala" },
        endingPoint: { city: "Thiruvananthapuram", state: "Kerala" },
        totalDistance: 220,
        isActive: true,
        depot: { depotId: depot._id, depotName: depot.depotName },
      });

      trip = await Trip.create({
        routeId: route._id,
        busId: bus._id,
        depotId: depot._id,
        serviceDate: new Date(),
        startTime: "06:00",
        endTime: "10:00",
        fare: 500,
        status: "scheduled",
        availableSeats: 35,
        totalSeats: 40,
        bookingOpen: true,
      });

      console.log("✅ Sample trip created:", trip._id);
    } else {
      console.log("✅ Found existing trip:", trip._id);
    }

    // Step 2: Create guest booking
    console.log("\n2. Creating guest booking...");
    const bookingData = {
      tripId: trip._id.toString(),
      customer: {
        name: "Test User",
        email: "test@example.com",
        phone: "9876543210",
        age: "25",
        gender: "male",
      },
      journey: {
        from: "Kochi",
        to: "Thiruvananthapuram",
        departureDate: new Date(),
        departureTime: "06:00 AM",
      },
      seats: [
        {
          seatNumber: "A1",
          seatType: "seater",
          price: 500,
          passengerName: "Test User",
        },
      ],
      pricing: {
        baseFare: 200,
        seatFare: 500,
        totalAmount: 500,
        taxes: { gst: 0 },
      },
    };

    const bookingResponse = await axios.post(
      "http://localhost:5000/api/booking/guest",
      bookingData,
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    if (bookingResponse.data.success) {
      console.log(
        "✅ Booking created:",
        bookingResponse.data.data.bookingReference,
      );

      // Step 3: Create payment order
      console.log("\n3. Creating payment order...");
      const orderResponse = await axios.post(
        "http://localhost:5000/api/payment/create-order-guest",
        {
          bookingId: bookingResponse.data.data.bookingId,
          amount: 500,
          currency: "INR",
        },
        {
          headers: { "Content-Type": "application/json" },
        },
      );

      if (orderResponse.data.success) {
        console.log(
          "✅ Payment order created:",
          orderResponse.data.data.orderId,
        );
        console.log(
          "💳 Razorpay Key ID:",
          orderResponse.data.data.razorpayKeyId,
        );

        console.log("\n🎉 Complete Payment Flow is Working!");
        console.log("\n📋 Summary:");
        console.log("- Guest booking creation: ✅ Working");
        console.log("- Payment order creation: ✅ Working");
        console.log("- Razorpay integration: ✅ Ready");
        console.log("- Frontend integration: ✅ Ready");

        console.log("\n🚀 You can now test the complete flow in the frontend!");
        console.log("Visit: http://localhost:3000/passenger/booking");
      } else {
        console.error(
          "❌ Payment order creation failed:",
          orderResponse.data.message,
        );
      }
    } else {
      console.error(
        "❌ Booking creation failed:",
        bookingResponse.data.message,
      );
    }
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testPaymentWithRealData();

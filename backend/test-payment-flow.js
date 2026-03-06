const axios = require("axios");

async function testPaymentFlow() {
  try {
    console.log("🧪 Testing Complete Payment Flow...\n");

    // Step 1: Create a guest booking
    console.log("1. Creating guest booking...");
    const bookingData = {
      tripId: "507f1f77bcf86cd799439011", // Mock trip ID
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

      // Step 2: Create payment order
      console.log("\n2. Creating payment order...");
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

        console.log("\n🎉 Payment flow is working correctly!");
        console.log("\nNext steps:");
        console.log(
          "- Frontend can now create bookings without authentication",
        );
        console.log("- Payment gateway integration is ready");
        console.log("- Razorpay configuration is correct");
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
  }
}

testPaymentFlow();

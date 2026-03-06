/**
 * Test Autonomous Scheduling with Authentication
 */

const axios = require("axios");
const mongoose = require("mongoose");
const User = require("./models/User");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/yatrik-erp";
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

async function testWithAuth() {
  console.log("🧪 Testing Autonomous Scheduling with Authentication...\n");

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find or create admin user
    let admin = await User.findOne({
      role: "admin",
      email: "admin@yatrik.com",
    });

    if (!admin) {
      console.log("⚠️  No admin user found. Creating one...");
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash("admin123", 10);

      admin = await User.create({
        name: "System Administrator",
        email: "admin@yatrik.com",
        password: hashedPassword,
        role: "admin",
        phone: "9999999999",
        isActive: true,
      });
      console.log("✅ Admin user created\n");
    } else {
      console.log("✅ Admin user found\n");
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: admin._id,
        email: admin.email,
        role: admin.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    console.log("🔑 Generated JWT token\n");

    // Test the autonomous scheduling endpoint
    console.log("📡 Calling POST /api/admin/ai/autonomous/schedule");
    console.log("   with authentication...\n");

    const response = await axios.post(
      "http://localhost:5000/api/admin/ai/autonomous/schedule",
      {
        scheduleType: "daily",
        days: 7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        validateStatus: () => true, // Accept any status code
      },
    );

    console.log(`📊 Response Status: ${response.status}\n`);

    if (response.status === 200) {
      console.log("✅ SUCCESS! Autonomous scheduling completed\n");
      console.log("📦 Response Summary:");
      console.log(
        `   Schedules Generated: ${response.data.data?.schedulesGenerated || 0}`,
      );
      console.log(
        `   Optimization Score: ${response.data.data?.optimizationScore || 0}%`,
      );
      console.log(
        `   Conflicts: ${response.data.data?.conflictsRemaining || 0}`,
      );
      console.log(
        `   Execution Time: ${response.data.data?.metadata?.executionTime || 0}s`,
      );

      if (response.data.data?.schedule?.length > 0) {
        console.log(`\n   Sample Schedule (first 3):`);
        response.data.data.schedule.slice(0, 3).forEach((trip, i) => {
          console.log(
            `   ${i + 1}. ${trip.routeName} - ${trip.departureTime} (Bus: ${trip.busNumber})`,
          );
        });
      }
    } else {
      console.log("❌ FAILED! Error response:\n");
      console.log(JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.error("\n📦 Response Status:", error.response.status);
      console.error(
        "📦 Response Data:",
        JSON.stringify(error.response.data, null, 2),
      );
    }
    if (error.stack) {
      console.error("\n📚 Stack Trace:");
      console.error(error.stack);
    }
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

testWithAuth();

/**
 * Test Schedule Response Structure
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

async function testScheduleResponse() {
  console.log("🧪 Testing Schedule Response Structure...\n");

  try {
    await mongoose.connect(MONGODB_URI);

    let admin = await User.findOne({
      role: "admin",
      email: "admin@yatrik.com",
    });
    const token = jwt.sign(
      { userId: admin._id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    const response = await axios.post(
      "http://localhost:5000/api/admin/ai/autonomous/schedule",
      { scheduleType: "daily", days: 7 },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        validateStatus: () => true,
      },
    );

    if (response.status === 200 && response.data.data) {
      const data = response.data.data;

      console.log("✅ API Response Successful\n");
      console.log("📊 Summary:");
      console.log(`   Schedules Generated: ${data.schedulesGenerated}`);
      console.log(`   Optimization Score: ${data.optimizationScore}%`);
      console.log(`   Conflicts: ${data.conflictsRemaining}`);
      console.log(`   Execution Time: ${data.metadata?.executionTime}s\n`);

      if (data.schedule && data.schedule.length > 0) {
        console.log("📋 First Schedule Item Structure:");
        console.log(JSON.stringify(data.schedule[0], null, 2));
        console.log("\n");

        console.log("🔍 Available Fields:");
        console.log(Object.keys(data.schedule[0]).join(", "));
        console.log("\n");
      }

      console.log("📦 Full Response Structure:");
      console.log("   - schedulesGenerated:", data.schedulesGenerated);
      console.log("   - optimizationScore:", data.optimizationScore);
      console.log("   - conflictsRemaining:", data.conflictsRemaining);
      console.log("   - schedule array length:", data.schedule?.length || 0);
      console.log("   - conflicts array length:", data.conflicts?.length || 0);
      console.log("   - summary:", Object.keys(data.summary || {}).join(", "));
      console.log(
        "   - utilization:",
        Object.keys(data.utilization || {}).join(", "),
      );
      console.log(
        "   - metadata:",
        Object.keys(data.metadata || {}).join(", "),
      );
    } else {
      console.log("❌ API Error:", response.data);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testScheduleResponse();

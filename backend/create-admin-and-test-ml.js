const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const axios = require("axios");
require("dotenv").config();

// User model
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  status: String,
});

const User = mongoose.model("User", userSchema);

async function createAdminAndTestML() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Create or find admin user
    let admin = await User.findOne({ email: "admin@yatrik.com" });
    if (!admin) {
      admin = new User({
        name: "Admin",
        email: "admin@yatrik.com",
        password: "hashed_password",
        role: "admin",
        status: "active",
      });
      await admin.save();
      console.log("✅ Admin user created");
    } else {
      console.log("✅ Admin user found");
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: admin._id,
        email: admin.email,
        role: "admin",
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" },
    );

    console.log("✅ Admin token generated");

    // Test ML endpoints
    console.log("\n🚀 Testing ML Analytics...");

    const headers = { Authorization: `Bearer ${token}` };

    // 1. Health check
    console.log("\n1. Health Check:");
    const health = await axios.get("http://localhost:5000/api/ai/health", {
      headers,
    });
    console.log(JSON.stringify(health.data, null, 2));

    // 2. Get all models
    console.log("\n2. All Models:");
    const models = await axios.get("http://localhost:5000/api/ai/analytics", {
      headers,
    });
    console.log(`Found ${models.data.data.models.length} models`);

    // 3. Run all models
    console.log("\n3. Running All Models:");
    const runAll = await axios.post(
      "http://localhost:5000/api/ai/analytics/run-all",
      {},
      { headers },
    );
    console.log(JSON.stringify(runAll.data, null, 2));

    // 4. Get comparison
    console.log("\n4. Model Comparison:");
    const comparison = await axios.get(
      "http://localhost:5000/api/ai/analytics/comparison",
      { headers },
    );
    console.log(JSON.stringify(comparison.data, null, 2));

    console.log("\n✅ All ML models tested successfully!");
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createAdminAndTestML();

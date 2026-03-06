require("dotenv").config();
const mongoose = require("mongoose");

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// User Schema (simplified)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  role: String,
  isActive: Boolean,
  createdAt: Date,
});

const User = mongoose.model("User", userSchema);

async function listUsers() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get all users
    const users = await User.find({})
      .select("name email phone role isActive createdAt")
      .lean();

    if (users.length === 0) {
      console.log("ℹ️  No users found in database");
      return;
    }

    console.log(`📊 Found ${users.length} users:\n`);
    console.log("═".repeat(80));

    // Group by role
    const usersByRole = users.reduce((acc, user) => {
      const role = user.role || "unknown";
      if (!acc[role]) acc[role] = [];
      acc[role].push(user);
      return acc;
    }, {});

    // Display users by role
    Object.keys(usersByRole).forEach((role) => {
      console.log(`\n🎭 ${role.toUpperCase()} (${usersByRole[role].length})`);
      console.log("─".repeat(80));

      usersByRole[role].forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name || "No Name"}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   📱 Phone: ${user.phone || "N/A"}`);
        console.log(`   ✅ Active: ${user.isActive ? "Yes" : "No"}`);
        console.log(
          `   📅 Created: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}`,
        );
      });
    });

    console.log("\n" + "═".repeat(80));
    console.log("\n💡 Test Credentials (if available):");
    console.log("   Email: passenger@test.com");
    console.log("   Password: password123");
    console.log("\n   Or create a new test user by running:");
    console.log("   node backend/create-test-passenger.js");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

listUsers();

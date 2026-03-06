const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/yatrik",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
);

const User = require("./models/User");

async function createTestPassenger() {
  try {
    console.log("🔍 Checking for test passenger...");

    // Check if passenger exists
    let passenger = await User.findOne({ email: "passenger@example.com" });

    if (passenger) {
      console.log("✅ Test passenger already exists:");
      console.log("   Email:", passenger.email);
      console.log("   Name:", passenger.name);
      console.log("   Role:", passenger.role);
      console.log("   Status:", passenger.status);
      console.log("   ID:", passenger._id);

      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash("password123", 10);
      passenger.password = hashedPassword;
      passenger.status = "active";
      await passenger.save();
      console.log("✅ Password updated to: password123");
    } else {
      console.log("📝 Creating test passenger...");

      // Create new passenger
      const hashedPassword = await bcrypt.hash("password123", 10);

      passenger = new User({
        name: "Test Passenger",
        email: "passenger@example.com",
        phone: "+919876543210",
        password: hashedPassword,
        role: "passenger",
        roleType: "external",
        status: "active",
        profileCompleted: true,
        emailVerified: true,
      });

      await passenger.save();

      console.log("✅ Test passenger created successfully!");
      console.log("   Email: passenger@example.com");
      console.log("   Password: password123");
      console.log("   Name:", passenger.name);
      console.log("   Role:", passenger.role);
      console.log("   ID:", passenger._id);
    }

    console.log("\n🎉 Test passenger is ready!");
    console.log("\nLogin credentials:");
    console.log("   Email: passenger@example.com");
    console.log("   Password: password123");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
  }
}

createTestPassenger();

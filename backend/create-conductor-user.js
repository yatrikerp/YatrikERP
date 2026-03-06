const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://yatrikerp:yatrikerp123@cluster0.3qt2hfg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  role: String,
  depotId: mongoose.Schema.Types.ObjectId,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

async function createConductorUser() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if conductor already exists
    const existingConductor = await User.findOne({
      email: "conductor@yatrik.com",
    });

    if (existingConductor) {
      console.log("⚠️  Conductor user already exists");
      console.log("📧 Email: conductor@yatrik.com");
      console.log("🔑 Password: Conductor@123");
      await mongoose.connection.close();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("Conductor@123", 10);

    // Create conductor user
    const conductor = new User({
      name: "Test Conductor",
      email: "conductor@yatrik.com",
      password: hashedPassword,
      phone: "+919876543210",
      role: "conductor",
      isActive: true,
    });

    await conductor.save();

    console.log("✅ Conductor user created successfully!");
    console.log("\n📋 Conductor Login Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email: conductor@yatrik.com");
    console.log("🔑 Password: Conductor@123");
    console.log("👤 Role: Conductor");
    console.log("📱 Phone: +919876543210");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

createConductorUser();

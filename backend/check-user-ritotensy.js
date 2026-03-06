const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
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

async function checkUser() {
  try {
    console.log("🔍 Checking user: ritotensy@gmail.com\n");

    // Find the user
    const user = await User.findOne({ email: "ritotensy@gmail.com" });

    if (!user) {
      console.log("❌ User not found in database!");
      console.log("\n💡 This user needs to be created.");
      console.log("   Either register via the app or create manually.");
      return;
    }

    console.log("✅ User found in database:");
    console.log("   ID:", user._id);
    console.log("   Name:", user.name);
    console.log("   Email:", user.email);
    console.log("   Phone:", user.phone || "N/A");
    console.log("   Role:", user.role);
    console.log("   RoleType:", user.roleType || "N/A");
    console.log("   Status:", user.status);
    console.log("   Created:", user.createdAt);
    console.log("");

    // Check if status is active
    if (user.status !== "active") {
      console.log("⚠️  User status is NOT active!");
      console.log("   Updating status to active...");
      user.status = "active";
      await user.save();
      console.log("✅ Status updated to active");
    } else {
      console.log("✅ User status is active");
    }

    // Check if role is passenger
    if (user.role !== "passenger") {
      console.log("⚠️  User role is NOT passenger!");
      console.log("   Current role:", user.role);
      console.log("   Updating role to passenger...");
      user.role = "passenger";
      user.roleType = "external";
      await user.save();
      console.log("✅ Role updated to passenger");
    } else {
      console.log("✅ User role is passenger");
    }

    // Generate a test token
    console.log("\n🔑 Generating test token...");
    const token = jwt.sign(
      {
        userId: user._id,
        role: "PASSENGER",
        roleType: "external",
        name: user.name,
        email: user.email,
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" },
    );

    console.log("✅ Token generated successfully");
    console.log("   Token preview:", token.substring(0, 50) + "...");

    // Verify the token
    console.log("\n🔍 Verifying token...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    console.log("✅ Token verified successfully");
    console.log("   Decoded userId:", decoded.userId);
    console.log("   Decoded role:", decoded.role);
    console.log("   Decoded email:", decoded.email);

    // Check if userId matches
    if (decoded.userId.toString() === user._id.toString()) {
      console.log("✅ Token userId matches database user ID");
    } else {
      console.log("❌ Token userId does NOT match database user ID");
    }

    console.log("\n✅ User is ready for login!");
    console.log("\nLogin Credentials:");
    console.log("   Email: ritotensy@gmail.com");
    console.log("   Password: Yatrik123");
    console.log(
      "\n💡 The user should now be able to login and access the dashboard.",
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
  }
}

checkUser();

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

async function testPassengerLogin() {
  try {
    console.log("🔍 Searching for passenger users in database...\n");

    // Find all passenger users
    const passengers = await User.find({ role: "passenger" })
      .select("_id name email phone role status createdAt")
      .lean();

    if (passengers.length === 0) {
      console.log("❌ No passenger users found in database!");
      console.log("\n📝 Creating a test passenger...");

      const hashedPassword = await bcrypt.hash("password123", 10);

      const newPassenger = new User({
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

      await newPassenger.save();

      console.log("✅ Test passenger created!");
      console.log("\nLogin Credentials:");
      console.log("   Email: passenger@example.com");
      console.log("   Password: password123");
      console.log("   ID:", newPassenger._id);
    } else {
      console.log(`✅ Found ${passengers.length} passenger user(s):\n`);

      passengers.forEach((passenger, index) => {
        console.log(`${index + 1}. Passenger Details:`);
        console.log(`   Name: ${passenger.name}`);
        console.log(`   Email: ${passenger.email}`);
        console.log(`   Phone: ${passenger.phone || "N/A"}`);
        console.log(`   Status: ${passenger.status}`);
        console.log(`   ID: ${passenger._id}`);
        console.log(`   Created: ${passenger.createdAt}`);
        console.log("");
      });

      console.log(
        "📋 Use any of these credentials to login to the Flutter app",
      );
      console.log(
        "💡 If you don't know the password, you can reset it using the web app",
      );
      console.log("   or update it directly in the database\n");

      // Check if passenger@example.com exists
      const testPassenger = passengers.find(
        (p) => p.email === "passenger@example.com",
      );
      if (testPassenger) {
        console.log("✅ Test passenger (passenger@example.com) exists!");
        console.log("   You can use this for testing");
        console.log("   Password should be: password123");

        // Update password to ensure it's correct
        const hashedPassword = await bcrypt.hash("password123", 10);
        await User.findByIdAndUpdate(testPassenger._id, {
          password: hashedPassword,
          status: "active",
        });
        console.log("   ✅ Password updated to: password123");
      }
    }

    console.log("\n🎯 Next Steps:");
    console.log("1. Use the credentials above in your Flutter app");
    console.log("2. Make sure backend is running: npm start");
    console.log("3. Run Flutter app: flutter run");
    console.log("4. Login with the email and password shown above");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
  }
}

testPassengerLogin();

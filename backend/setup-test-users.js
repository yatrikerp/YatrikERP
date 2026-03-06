require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI || "your_mongodb_connection_string";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  role: String,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

const testUsers = [
  {
    name: "Test Passenger",
    email: "test@gmail.com",
    password: "Test@123",
    phone: "9876543210",
    role: "passenger",
  },
  {
    name: "Admin User",
    email: "admin@yatrik.com",
    password: "Admin@123",
    phone: "9876543211",
    role: "admin",
  },
];

async function createUsers() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    for (const userData of testUsers) {
      try {
        const existingUser = await User.findOne({ email: userData.email });

        if (existingUser) {
          console.log(`ℹ️  User exists: ${userData.email}`);
          await User.updateOne(
            { email: userData.email },
            { $set: { password: await bcrypt.hash(userData.password, 12) } },
          );
          console.log(`✅ Password updated for: ${userData.email}\n`);
        } else {
          const hashedPassword = await bcrypt.hash(userData.password, 12);
          await User.create({ ...userData, password: hashedPassword });
          console.log(`✅ Created: ${userData.email}\n`);
        }
      } catch (err) {
        console.log(`❌ Error with ${userData.email}: ${err.message}\n`);
      }
    }

    console.log("\n🎉 Setup complete! Use these credentials:\n");
    testUsers.forEach((user) => {
      console.log(`${user.role.toUpperCase()}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}\n`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

createUsers();

const axios = require("axios");
const mongoose = require("mongoose");
const User = require("./models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/yatrik-erp";
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

(async () => {
  await mongoose.connect(MONGODB_URI);
  const admin = await User.findOne({
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

  const data = response.data.data;
  console.log("\n✅ Response Fields:");
  console.log(
    JSON.stringify(
      {
        schedulesGenerated: data.schedulesGenerated,
        busesAssigned: data.busesAssigned,
        driversAssigned: data.driversAssigned,
        conductorsAssigned: data.conductorsAssigned,
        optimizationScore: data.optimizationScore,
        conflictsRemaining: data.conflictsRemaining,
        scheduleLength: data.schedule?.length,
        summaryKeys: Object.keys(data.summary || {}),
        utilizationKeys: Object.keys(data.utilization || {}),
      },
      null,
      2,
    ),
  );

  await mongoose.disconnect();
})();

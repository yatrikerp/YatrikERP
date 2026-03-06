/**
 * Test Autonomous Scheduling API
 */

const axios = require("axios");

async function testAPI() {
  console.log("🧪 Testing Autonomous Scheduling API...\n");

  try {
    // Test without authentication first to see the error
    console.log("📡 Calling POST /api/admin/ai/autonomous/schedule");

    const response = await axios.post(
      "http://localhost:5000/api/admin/ai/autonomous/schedule",
      {
        scheduleType: "daily",
        days: 7,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        validateStatus: () => true, // Accept any status code
      },
    );

    console.log(`\n📊 Response Status: ${response.status}`);
    console.log("📦 Response Data:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.error("Response Status:", error.response.status);
      console.error("Response Data:", error.response.data);
    }
  }
}

testAPI();

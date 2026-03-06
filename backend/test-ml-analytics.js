const axios = require("axios");

async function testMLAnalytics() {
  try {
    console.log("🚀 Testing ML Analytics endpoints...");

    // Test health endpoint first
    console.log("\n1. Testing ML Health...");
    const healthResponse = await axios.get(
      "http://localhost:5000/api/ai/health",
      {
        headers: {
          Authorization: "Bearer admin-token-placeholder",
        },
      },
    );
    console.log("✅ Health:", healthResponse.data);

    // Get all models
    console.log("\n2. Getting all models...");
    const modelsResponse = await axios.get(
      "http://localhost:5000/api/ai/analytics",
      {
        headers: {
          Authorization: "Bearer admin-token-placeholder",
        },
      },
    );
    console.log("✅ Models:", modelsResponse.data);

    // Run all models
    console.log("\n3. Running all ML models...");
    const runAllResponse = await axios.post(
      "http://localhost:5000/api/ai/analytics/run-all",
      {},
      {
        headers: {
          Authorization: "Bearer admin-token-placeholder",
        },
      },
    );
    console.log(
      "✅ Run All Results:",
      JSON.stringify(runAllResponse.data, null, 2),
    );

    // Get model comparison
    console.log("\n4. Getting model comparison...");
    const comparisonResponse = await axios.get(
      "http://localhost:5000/api/ai/analytics/comparison",
      {
        headers: {
          Authorization: "Bearer admin-token-placeholder",
        },
      },
    );
    console.log(
      "✅ Comparison:",
      JSON.stringify(comparisonResponse.data, null, 2),
    );
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

testMLAnalytics();

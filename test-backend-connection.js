// Quick test to check if backend is accessible
const https = require("https");

const BACKEND_URL = "https://yatrikerp.onrender.com";

console.log("🔍 Testing backend connection...\n");

// Test 1: Health check
console.log("Test 1: Health Check");
https
  .get(`${BACKEND_URL}/api/health`, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      if (res.statusCode === 200) {
        console.log("✅ Backend is UP and running!");
        console.log(`   Response: ${data}\n`);

        // Test 2: Login test
        testLogin();
      } else {
        console.log(`❌ Health check failed with status: ${res.statusCode}\n`);
      }
    });
  })
  .on("error", (err) => {
    console.log("❌ Cannot connect to backend");
    console.log(`   Error: ${err.message}\n`);
    console.log("💡 Possible reasons:");
    console.log("   - Backend is sleeping (first request takes 30-60 seconds)");
    console.log("   - No internet connection");
    console.log("   - Backend is down\n");
  });

function testLogin() {
  console.log("Test 2: Login API");

  const postData = JSON.stringify({
    email: "passenger@yatrik.com",
    password: "Passenger@123",
  });

  const options = {
    hostname: "yatrikerp.onrender.com",
    port: 443,
    path: "/api/auth/login",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": postData.length,
    },
  };

  const req = https.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      if (res.statusCode === 200) {
        console.log("✅ Login API is working!");
        const response = JSON.parse(data);
        console.log(`   User: ${response.user?.name || "Unknown"}`);
        console.log(`   Role: ${response.user?.role || "Unknown"}`);
        console.log(`   Token: ${response.token ? "Generated" : "Missing"}\n`);

        console.log("🎉 All tests passed! Backend is ready for Flutter app.\n");
        console.log("📱 You can now login to the Flutter app with:");
        console.log("   Email: passenger@yatrik.com");
        console.log("   Password: Passenger@123\n");
      } else {
        console.log(`❌ Login failed with status: ${res.statusCode}`);
        console.log(`   Response: ${data}\n`);
      }
    });
  });

  req.on("error", (err) => {
    console.log("❌ Login test failed");
    console.log(`   Error: ${err.message}\n`);
  });

  req.write(postData);
  req.end();
}

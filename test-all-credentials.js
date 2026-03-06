// Test all possible login credentials
const https = require("https");

const BACKEND_URL = "https://yatrikerp.onrender.com";

const testAccounts = [
  {
    email: "passenger@yatrik.com",
    password: "Passenger@123",
    role: "Passenger",
  },
  { email: "admin@yatrik.com", password: "Admin@123", role: "Admin" },
  {
    email: "conductor@yatrik.com",
    password: "Conductor@123",
    role: "Conductor",
  },
  { email: "depot@yatrik.com", password: "Depot@123", role: "Depot Manager" },
  {
    email: "superadmin@yatrik.com",
    password: "SuperAdmin@123",
    role: "Super Admin",
  },
  { email: "vendor@yatrik.com", password: "Vendor@123", role: "Vendor" },
  // Try common variations
  { email: "test@test.com", password: "test123", role: "Test" },
  { email: "admin@admin.com", password: "admin123", role: "Admin Alt" },
];

console.log("🔍 Testing all login credentials...\n");

let testIndex = 0;

function testNextAccount() {
  if (testIndex >= testAccounts.length) {
    console.log("\n✅ Testing complete!");
    console.log("\n📝 Working credentials will be shown above.");
    return;
  }

  const account = testAccounts[testIndex];
  testIndex++;

  const postData = JSON.stringify({
    email: account.email,
    password: account.password,
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
        const response = JSON.parse(data);
        console.log(`✅ ${account.role}: ${account.email}`);
        console.log(`   Password: ${account.password}`);
        console.log(`   User: ${response.user?.name || "Unknown"}`);
        console.log(`   Role: ${response.user?.role || "Unknown"}\n`);
      } else {
        console.log(`❌ ${account.role}: ${account.email} - Failed`);
      }

      // Test next account after a short delay
      setTimeout(testNextAccount, 500);
    });
  });

  req.on("error", (err) => {
    console.log(`❌ ${account.role}: ${account.email} - Error: ${err.message}`);
    setTimeout(testNextAccount, 500);
  });

  req.write(postData);
  req.end();
}

// Start testing
testNextAccount();

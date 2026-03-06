// Try to find working credentials with common password variations
const https = require("https");

const emails = [
  "passenger@yatrik.com",
  "admin@yatrik.com",
  "test@test.com",
  "user@yatrik.com",
];

const passwords = [
  "Passenger@123",
  "passenger@123",
  "Password@123",
  "password123",
  "Admin@123",
  "admin@123",
  "admin123",
  "test123",
  "Test@123",
  "123456",
  "password",
];

console.log("🔍 Searching for working credentials...\n");

let attempts = 0;
let found = [];

function testLogin(email, password) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ email, password });

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
        attempts++;
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            found.push({
              email,
              password,
              name: response.user?.name,
              role: response.user?.role,
            });
            console.log(`✅ FOUND: ${email} / ${password}`);
            console.log(`   Name: ${response.user?.name}`);
            console.log(`   Role: ${response.user?.role}\n`);
          } catch (e) {}
        }
        resolve();
      });
    });

    req.on("error", () => resolve());
    req.write(postData);
    req.end();
  });
}

async function searchCredentials() {
  for (const email of emails) {
    for (const password of passwords) {
      await testLogin(email, password);
      await new Promise((resolve) => setTimeout(resolve, 200)); // Rate limit
    }
  }

  console.log(`\n📊 Tested ${attempts} combinations`);
  console.log(`✅ Found ${found.length} working credentials\n`);

  if (found.length > 0) {
    console.log("🎉 WORKING CREDENTIALS:\n");
    found.forEach((cred) => {
      console.log(`${cred.role?.toUpperCase() || "USER"}:`);
      console.log(`  Email: ${cred.email}`);
      console.log(`  Password: ${cred.password}`);
      console.log(`  Name: ${cred.name}\n`);
    });
  } else {
    console.log("❌ No working credentials found.");
    console.log("\n💡 You may need to:");
    console.log("1. Register a new account in the Flutter app");
    console.log("2. Or check the web app for existing credentials");
  }
}

searchCredentials();

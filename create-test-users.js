// Create test users in production database
const https = require("https");

const BACKEND_URL = "https://yatrikerp.onrender.com";

const testUsers = [
  {
    name: "Test Passenger",
    email: "passenger@yatrik.com",
    password: "Passenger@123",
    phone: "9876543210",
    role: "passenger",
  },
  {
    name: "Test Admin",
    email: "admin@yatrik.com",
    password: "Admin@123",
    phone: "9876543211",
    role: "admin",
  },
  {
    name: "Test Conductor",
    email: "conductor@yatrik.com",
    password: "Conductor@123",
    phone: "9876543212",
    role: "conductor",
  },
  {
    name: "Test Depot Manager",
    email: "depot@yatrik.com",
    password: "Depot@123",
    phone: "9876543213",
    role: "depot_manager",
  },
];

console.log("🔧 Creating test users in production database...\n");

let userIndex = 0;

function createNextUser() {
  if (userIndex >= testUsers.length) {
    console.log("\n✅ All users created! Testing login...\n");
    setTimeout(testAllLogins, 1000);
    return;
  }

  const user = testUsers[userIndex];
  userIndex++;

  const postData = JSON.stringify(user);

  const options = {
    hostname: "yatrikerp.onrender.com",
    port: 443,
    path: "/api/auth/register",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": postData.length,
    },
  };

  console.log(`Creating ${user.role}: ${user.email}...`);

  const req = https.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log(`✅ Created: ${user.email}`);
      } else if (res.statusCode === 400 && data.includes("already exists")) {
        console.log(`ℹ️  Already exists: ${user.email}`);
      } else {
        console.log(`❌ Failed: ${user.email} - ${data}`);
      }

      setTimeout(createNextUser, 500);
    });
  });

  req.on("error", (err) => {
    console.log(`❌ Error creating ${user.email}: ${err.message}`);
    setTimeout(createNextUser, 500);
  });

  req.write(postData);
  req.end();
}

function testAllLogins() {
  console.log("🔍 Testing all created accounts...\n");

  let testIndex = 0;

  function testNextLogin() {
    if (testIndex >= testUsers.length) {
      console.log(
        "\n🎉 Setup complete! You can now use these credentials in the Flutter app:\n",
      );
      testUsers.forEach((user) => {
        console.log(`${user.role.toUpperCase()}:`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Password: ${user.password}\n`);
      });
      return;
    }

    const user = testUsers[testIndex];
    testIndex++;

    const postData = JSON.stringify({
      email: user.email,
      password: user.password,
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
          console.log(`✅ ${user.role}: ${user.email} - Login works!`);
          console.log(`   Name: ${response.user?.name}`);
          console.log(`   Role: ${response.user?.role}\n`);
        } else {
          console.log(`❌ ${user.role}: ${user.email} - Login failed`);
        }

        setTimeout(testNextLogin, 500);
      });
    });

    req.on("error", (err) => {
      console.log(`❌ ${user.role}: ${user.email} - Error: ${err.message}`);
      setTimeout(testNextLogin, 500);
    });

    req.write(postData);
    req.end();
  }

  testNextLogin();
}

// Start creating users
createNextUser();

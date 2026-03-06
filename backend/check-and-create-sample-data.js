const mongoose = require("mongoose");
require("dotenv").config();

const Route = require("./models/Route");
const Bus = require("./models/Bus");
const Driver = require("./models/Driver");
const Conductor = require("./models/Conductor");
const Depot = require("./models/Depot");
const User = require("./models/User");

async function checkAndCreateSampleData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/yatrik-erp",
    );
    console.log("✅ Connected to MongoDB");

    // Check existing data
    const [routeCount, busCount, driverCount, conductorCount, depotCount] =
      await Promise.all([
        Route.countDocuments({ status: "active" }),
        Bus.countDocuments({ status: "active" }),
        Driver.countDocuments({ status: "active" }),
        Conductor.countDocuments({ status: "active" }),
        Depot.countDocuments({ status: "active" }),
      ]);

    console.log("\n📊 Current Data Status:");
    console.log(`Routes: ${routeCount}`);
    console.log(`Buses: ${busCount}`);
    console.log(`Drivers: ${driverCount}`);
    console.log(`Conductors: ${conductorCount}`);
    console.log(`Depots: ${depotCount}`);

    if (
      routeCount === 0 ||
      busCount === 0 ||
      driverCount === 0 ||
      conductorCount === 0 ||
      depotCount === 0
    ) {
      console.log("\n⚠️  Missing data detected! Creating sample data...\n");

      // Get or create admin user
      let adminUser = await User.findOne({ role: "admin" });
      if (!adminUser) {
        console.log("Creating admin user...");
        adminUser = await User.create({
          name: "System Admin",
          email: "admin@yatrik.com",
          password: "$2a$10$XYZ123", // Hashed password
          role: "admin",
          phone: "9999999999",
        });
      }

      // Create depot if needed
      let depot;
      if (depotCount === 0) {
        console.log("Creating sample depot...");
        depot = await Depot.create({
          name: "Thiruvananthapuram Central Depot",
          code: "TVM-01",
          location: {
            address: "Central Station Road",
            city: "Thiruvananthapuram",
            state: "Kerala",
            pincode: "695001",
            coordinates: {
              type: "Point",
              coordinates: [76.9366, 8.5241],
            },
          },
          capacity: 100,
          status: "active",
          contactPerson: {
            name: "Depot Manager",
            phone: "9876543210",
            email: "depot@yatrik.com",
          },
          createdBy: adminUser._id,
        });
        console.log(`✅ Created depot: ${depot.name}`);
      } else {
        depot = await Depot.findOne({ status: "active" });
      }

      // Create routes if needed
      if (routeCount === 0) {
        console.log("Creating sample routes...");
        const routes = [
          {
            routeName: "Thiruvananthapuram - Kochi Express",
            routeNumber: "TVM-KCH-001",
            origin: "Thiruvananthapuram",
            destination: "Kochi",
            distance: 215,
            estimatedDuration: 240,
            baseFare: 250,
            status: "active",
            depotId: depot._id,
            createdBy: adminUser._id,
          },
          {
            routeName: "Kochi - Kozhikode Fast",
            routeNumber: "KCH-KZD-002",
            origin: "Kochi",
            destination: "Kozhikode",
            distance: 195,
            estimatedDuration: 220,
            baseFare: 220,
            status: "active",
            depotId: depot._id,
            createdBy: adminUser._id,
          },
          {
            routeName: "Thiruvananthapuram - Kollam Local",
            routeNumber: "TVM-KLM-003",
            origin: "Thiruvananthapuram",
            destination: "Kollam",
            distance: 71,
            estimatedDuration: 90,
            baseFare: 80,
            status: "active",
            depotId: depot._id,
            createdBy: adminUser._id,
          },
          {
            routeName: "Kochi - Thrissur Express",
            routeNumber: "KCH-TSR-004",
            origin: "Kochi",
            destination: "Thrissur",
            distance: 74,
            estimatedDuration: 95,
            baseFare: 85,
            status: "active",
            depotId: depot._id,
            createdBy: adminUser._id,
          },
          {
            routeName: "Kozhikode - Kannur Fast",
            routeNumber: "KZD-KNR-005",
            origin: "Kozhikode",
            destination: "Kannur",
            distance: 92,
            estimatedDuration: 110,
            baseFare: 95,
            status: "active",
            depotId: depot._id,
            createdBy: adminUser._id,
          },
        ];

        await Route.insertMany(routes);
        console.log(`✅ Created ${routes.length} routes`);
      }

      // Create buses if needed
      if (busCount === 0) {
        console.log("Creating sample buses...");
        const buses = [];
        for (let i = 1; i <= 15; i++) {
          buses.push({
            busNumber: `KL-01-${String(i).padStart(4, "0")}`,
            registrationNumber: `KL01AB${String(i).padStart(4, "0")}`,
            capacity: 50,
            busType: i % 3 === 0 ? "ac" : "non-ac",
            status: "active",
            maintenanceStatus: "operational",
            depotId: depot._id,
            manufacturer: "Ashok Leyland",
            model: "Viking",
            yearOfManufacture: 2020 + (i % 5),
            fuelType: "diesel",
            fuelCapacity: 200,
            currentOdometer: Math.floor(Math.random() * 50000) + 10000,
            createdBy: adminUser._id,
          });
        }
        await Bus.insertMany(buses);
        console.log(`✅ Created ${buses.length} buses`);
      }

      // Create drivers if needed
      if (driverCount === 0) {
        console.log("Creating sample drivers...");
        const drivers = [];
        for (let i = 1; i <= 20; i++) {
          drivers.push({
            driverId: `DRV${String(i).padStart(4, "0")}`,
            name: `Driver ${i}`,
            phone: `98765${String(i).padStart(5, "0")}`,
            email: `driver${i}@yatrik.com`,
            employeeCode: `EMP-D-${String(i).padStart(4, "0")}`,
            username: `driver${i}`,
            password: "$2a$10$XYZ123", // Hashed password
            status: "active",
            depotId: depot._id,
            drivingLicense: {
              licenseNumber: `KL01${String(i).padStart(10, "0")}`,
              licenseType: "HMV",
              issueDate: new Date("2020-01-01"),
              expiryDate: new Date("2030-12-31"),
              issuingAuthority: "Kerala RTO",
              status: "valid",
            },
            createdBy: adminUser._id,
          });
        }
        await Driver.insertMany(drivers);
        console.log(`✅ Created ${drivers.length} drivers`);
      }

      // Create conductors if needed
      if (conductorCount === 0) {
        console.log("Creating sample conductors...");
        const conductors = [];
        for (let i = 1; i <= 20; i++) {
          conductors.push({
            conductorId: `CND${String(i).padStart(4, "0")}`,
            name: `Conductor ${i}`,
            phone: `98764${String(i).padStart(5, "0")}`,
            email: `conductor${i}@yatrik.com`,
            employeeCode: `EMP-C-${String(i).padStart(4, "0")}`,
            username: `conductor${i}`,
            password: "$2a$10$XYZ123", // Hashed password
            status: "active",
            depotId: depot._id,
            createdBy: adminUser._id,
          });
        }
        await Conductor.insertMany(conductors);
        console.log(`✅ Created ${conductors.length} conductors`);
      }

      console.log("\n✅ Sample data creation complete!");
    } else {
      console.log("\n✅ All required data exists. No action needed.");
    }

    // Final count
    const [
      finalRoutes,
      finalBuses,
      finalDrivers,
      finalConductors,
      finalDepots,
    ] = await Promise.all([
      Route.countDocuments({ status: "active" }),
      Bus.countDocuments({ status: "active" }),
      Driver.countDocuments({ status: "active" }),
      Conductor.countDocuments({ status: "active" }),
      Depot.countDocuments({ status: "active" }),
    ]);

    console.log("\n📊 Final Data Status:");
    console.log(`Routes: ${finalRoutes}`);
    console.log(`Buses: ${finalBuses}`);
    console.log(`Drivers: ${finalDrivers}`);
    console.log(`Conductors: ${finalConductors}`);
    console.log(`Depots: ${finalDepots}`);

    console.log("\n✅ System is ready for autonomous scheduling!");
    console.log(
      "🚀 You can now access: http://localhost:3000/admin/autonomous-scheduling",
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 Database connection closed");
  }
}

checkAndCreateSampleData();

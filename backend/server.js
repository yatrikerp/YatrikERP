const express = require("express");
const compression = require("compression");
const helmet = require("helmet");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const favicon = require("serve-favicon");
const passport = require("passport");
const session = require("express-session");
const { createServer } = require("http");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");
const { logger } = require("./src/core/logger");
require("dotenv").config();

// Validate environment variables before starting
const { validateEnv } = require("./src/config/env");
validateEnv();

const app = express();

// Express performance and security tuning
app.disable("x-powered-by");
app.set("trust proxy", 1);

// Middleware
const defaultCorsOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5000",
  "https://yatrikerp.live",
  "https://www.yatrikerp.live",
  "https://yatrikerp.onrender.com",
  "https://yatrik-frontend-app.onrender.com",
];

const corsOrigins = process.env.CORS_ORIGIN
  ? [
      ...defaultCorsOrigins,
      ...process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    ]
  : defaultCorsOrigins;

// Enhanced CORS configuration
logger.info("🌐 CORS Origins:", corsOrigins);
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (corsOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn(`⚠️ CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 200,
  }),
);

// Explicit OPTIONS handler for preflight requests
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS,PATCH",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,X-Requested-With,Accept,Origin",
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Max-Age", "86400");
  res.sendStatus(200);
});
// HTTP compression (apply early)
app.use(compression({ threshold: 1024 }));

// Secure defaults and sane headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(express.json());
app.use(favicon(path.join(__dirname, "../frontend/public/favicon.ico")));
// app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Enforce no-cache for all API responses to ensure live data
app.use("/api", (req, res, next) => {
  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

// Session configuration for OAuth
app.use(
  session({
    secret: process.env.SESSION_SECRET || "yatrik-erp-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Configure passport strategies
require("./config/passport");

// Connect to MongoDB with enhanced error handling

const mongoOptions = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  retryWrites: true,
  retryReads: true,
};

// Connect to MongoDB and start server
async function startServer() {
  try {
    logger.info("🔌 Attempting MongoDB connection...");

    // Use Atlas MongoDB only
    const connectionUri = process.env.MONGODB_URI;

    if (!connectionUri) {
      throw new Error(
        "MONGODB_URI environment variable is required. Please set it in your .env file.",
      );
    }

    logger.info("📡 Using Atlas MongoDB");
    logger.info(
      "🔗 Connection URI:",
      connectionUri.replace(/\/\/.*@/, "//***:***@"),
    ); // Hide credentials

    await mongoose.connect(connectionUri, mongoOptions);
    logger.info("✅ Connected to Atlas MongoDB successfully");
    logger.info("📊 Database ready for operations");

    // Start automatic schedule generator
    try {
      const autoScheduleGenerator = require('./services/autoScheduleGenerator');
      autoScheduleGenerator.initializeSchedulers();
      logger.info('🚀 Automatic schedule generator started');
    } catch (error) {
      logger.error('❌ Failed to start automatic schedule generator:', error.message);
    }

    // Start the server after database connection
    const PORT = process.env.PORT || 5000;

    // Create HTTP server
    const server = createServer(app);

    // Initialize Socket.IO
    const io = new Server(server, {
      cors: {
        origin: corsOrigins,
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      },
    });

    // Store io instance for use in routes
    app.set("io", io);

    // Setup WebSocket for schedule queue
    const { setWebSocketServer } = require("./services/scheduleQueue");
    setWebSocketServer(io);

    // Setup WebSocket for AI Schedule (async job progress)
    const {
      initializeAIScheduleWebSocket,
    } = require("./services/aiScheduleWebSocket");
    initializeAIScheduleWebSocket(io);

    // WebSocket connection handler
    io.on("connection", (socket) => {
      logger.info(`🔌 Client connected: ${socket.id}`);

      // Join job-specific room
      socket.on("subscribe-job", (jobId) => {
        socket.join(`job-${jobId}`);
        logger.info(`📡 Client subscribed to job: ${jobId}`);
      });

      socket.on("unsubscribe-job", (jobId) => {
        socket.leave(`job-${jobId}`);
        logger.info(`📡 Client unsubscribed from job: ${jobId}`);
      });

      socket.on("disconnect", () => {
        logger.info(`🔌 Client disconnected: ${socket.id}`);
      });
    });

    server.listen(PORT, () => {
      logger.info(`Starting server...`);
      logger.info(`Port: ${PORT}`);
      logger.info(`Server running on port ${PORT}`);
      logger.info("Socket.IO server ready");
      logger.info(`Health endpoint: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error("❌ MongoDB connection error:", error.message);
    logger.error("🔍 Error details:", {
      name: error.name,
      code: error.code,
      codeName: error.codeName,
    });
    process.exit(1);
  }
}

startServer();

const db = mongoose.connection;

// Enhanced database event handlers
db.on("error", (error) => {
  logger.error("❌ MongoDB connection error:", error);
  logger.error("🔍 Error details:", {
    name: error.name,
    message: error.message,
    code: error.code,
  });
});

db.on("disconnected", () => {
  logger.warn("⚠️ MongoDB disconnected");
});

db.on("reconnected", () => {
  logger.info("🔄 MongoDB reconnected");
});

db.on("open", () => {
  logger.info("🚀 MongoDB connection opened");
});

// Global process error handlers to avoid unexpected crashes
process.on("unhandledRejection", (reason) => {
  try {
    logger.error("Unhandled Promise Rejection:", reason);
  } catch {}
});

process.on("uncaughtException", (error) => {
  try {
    logger.error("Uncaught Exception:", error);
  } catch {}
});

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("🛑 Received SIGINT. Graceful shutdown...");
  try {
    await mongoose.connection.close();
    logger.info("✅ MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
});
db.once("open", () => {
  logger.info("Connected to MongoDB");
});

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: "Too many login attempts. Try again later.",
});

// Routes
app.use("/api/auth", authLimiter);
app.use("/api/auth", require("./routes/auth"));
app.use("/api/auth", require("./routes/unifiedAuth")); // Unified login system
app.use("/api/otp", require("./routes/otp"));
app.use("/api/depot-auth", require("./routes/depotAuth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/admin", require("./routes/bulkAssignment"));
app.use("/api/admin", require("./routes/aiScheduler"));
app.use("/api/admin", require("./routes/adminAdvancedFeatures"));
app.use("/api/admin/ai", require("./routes/adminAIScheduling"));
app.use("/api/scheduler", require("./routes/schedulerV2"));
console.log('📋 Registering depot routes...');
try {
  app.use("/api/depot", require("./routes/depot"));
  console.log('✅ Depot routes registered at /api/depot');
} catch (error) {
  console.error('❌ Failed to load depot routes:', error.message);
  console.error('   Stack:', error.stack);
}
app.use("/api/depots", require("./routes/depots"));
app.use("/api/admin/depot-users", require("./routes/depotUsers"));
app.use("/api/passenger", require("./routes/passenger"));
app.use("/api/users", require("./routes/users"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/bus-schedule", require("./routes/busSchedule"));
app.use("/api/driver", require("./routes/driver"));
app.use("/api/conductor", require("./routes/conductor"));
app.use("/api/staff", require("./routes/staff"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/seats", require("./routes/seats"));
app.use("/api/tracking", require("./routes/tracking"));
app.use("/api/booking", require("./routes/booking"));
app.use("/api/booking", require("./routes/ticketPNR")); // Ticket PNR lookup endpoint
console.log('📋 Registering route endpoints...');
app.use("/api/routes", require("./routes/routes"));
console.log('✅ Routes registered at /api/routes (/, /cities, /popular, etc.)');
app.use("/api/trips", require("./routes/trips"));
app.use("/api/stops", require("./routes/stops"));
app.use("/api/status", require("./routes/status"));
app.use("/api/email", require("./routes/emailStatus"));

// Vendor routes - Use direct vendor.js routes (most reliable)
console.log('📋 Registering vendor routes...');
try {
  const vendorRoutes = require("./routes/vendor");
  app.use("/api/vendor", vendorRoutes);
  console.log('✅ Vendor routes registered at /api/vendor');
  if (vendorRoutes && vendorRoutes.stack) {
    console.log('   Total endpoints:', vendorRoutes.stack.length);
    // Log key routes
    const keyRoutes = ['/dashboard', '/profile', '/purchase-orders', '/invoices', '/payments', '/trust-score', '/notifications', '/audit-log'];
    vendorRoutes.stack.forEach((route) => {
      if (route.route) {
        const methods = Object.keys(route.route.methods || {}).filter(m => route.route.methods[m]).join(', ').toUpperCase();
        const path = route.route.path || 'N/A';
        if (keyRoutes.some(key => path.includes(key))) {
          console.log(`   ${methods.padEnd(6)} /api/vendor${path}`);
        }
      }
    });
  }
} catch (error) {
  console.error('❌ Failed to load vendor routes:', error.message);
  console.error('   Stack:', error.stack);
  // Try vendor.routes.js as fallback
  try {
    const controllerRoutes = require("./routes/vendor.routes");
    app.use("/api/vendor", controllerRoutes);
    console.log('⚠️  Using vendor.routes.js (controller-based)');
  } catch (fallbackError) {
    console.error('❌ Both vendor route files failed to load');
    console.error('   Fallback error:', fallbackError.message);
  }
}

app.use("/api/student", require("./routes/studentPass"));
app.use("/api/spare-parts", require("./routes/spareParts"));
app.use("/api/products", require("./routes/products"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/search", require("./routes/search"));
app.use("/api/auto-scheduler", require("./routes/autoScheduler"));
app.use("/api/trip-generator", require("./routes/tripGenerator"));
app.use("/api/alerts", require("./routes/alerts"));
app.use("/api/fastest-route", require("./routes/fastestRoute"));
app.use("/api/fare-policy", require("./routes/farePolicy"));
app.use("/api/admin/routes", require("./routes/conductorPricing"));
app.use("/api/conductor", require("./routes/conductorPricing"));
app.use("/api/bulk-scheduler", require("./routes/bulkTripScheduler-fixed"));
// app.use('/api/passenger-dashboard', require('./routes/passengerDashboard'));
app.use("/api/support", require("./routes/support"));
app.use("/api/data-collector", require("./routes/dataCollector"));
app.use("/api/fuel", require("./routes/fuel"));
app.use("/api/ai", require("./routes/mlAnalytics"));
app.use("/api/ml-recommendations", require("./routes/mlRecommendations"));

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const dbStatus =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    const apiStatus = "running";

    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      api: apiStatus,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Central Express error handler (ensures single JSON response)
app.use((err, req, res, next) => {
  try {
    logger.error("Express error handler:", err);
  } catch {}
  if (res.headersSent) {
    return next(err);
  }
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || "Internal server error" });
});

// NOTE: Fallback routes are defined AFTER main routes
// They should only fire if main routes don't handle the request
// Development fallback for depot endpoints to avoid 404s while wiring auth/depot middleware
app.get("/api/depot/health", (req, res) => {
  try {
    res.json({ success: true, message: "Depot routes are working" });
  } catch (_) {
    res.json({ success: true });
  }
});

app.get("/api/depot/info", (req, res, next) => {
  // If the depot router handled this already, skip fallback
  if (res.headersSent) return;
  // Only use fallback if main route didn't handle
  logger.warn("[Fallback] Serving /api/depot/info - Main route may not be registered");
  return res.json({
    success: true,
    data: {
      name: "Yatrik Depot",
      location: "Kerala, India",
      manager: "Depot Manager",
      revenue: "₹0",
      revenueChange: "+0%",
      trips: "0",
      tripsChange: "+0%",
      occupancy: "0%",
      occupancyChange: "+0%",
      fuelEfficiency: "0 km/L",
      fuelEfficiencyChange: "+0%",
      ticketSales: "0",
      ticketSalesChange: "+0%",
      punctuality: "0%",
      punctualityChange: "+0%",
      breakdowns: "0",
      breakdownsChange: "+0%",
      activeBuses: "0",
      activeBusesChange: "+0",
      totalRoutes: "0",
      totalRoutesChange: "+0",
    },
  });
});

// REMOVED: Fallback route for /api/depot/dashboard
// The main route in depot.js should handle this
// If you see this fallback firing, it means the main route isn't registered

// Additional fallbacks for depot lists to prevent 404s during setup
app.get("/api/depot/buses", (req, res, next) => {
  if (res.headersSent) return;
  logger.warn("[Fallback] Serving /api/depot/buses");
  return res.json({
    success: true,
    data: {
      buses: [],
      stats: { totalBuses: 0, availableBuses: 0, maintenanceBuses: 0 },
    },
  });
});

app.get("/api/depot/routes", (req, res, next) => {
  if (res.headersSent) return;
  logger.warn("[Fallback] Serving /api/depot/routes");
  return res.json({
    success: true,
    data: {
      routes: [],
      stats: {
        totalRoutes: 0,
        activeRoutes: 0,
        inactiveRoutes: 0,
        totalDistance: 0,
      },
    },
  });
});

app.get("/api/depot/drivers", (req, res, next) => {
  if (res.headersSent) return;
  logger.warn("[Fallback] Serving /api/depot/drivers");
  return res.json({
    success: true,
    data: { drivers: [], stats: { totalDrivers: 0 } },
  });
});

app.get("/api/depot/conductors", (req, res, next) => {
  if (res.headersSent) return;
  logger.warn("[Fallback] Serving /api/depot/conductors");
  return res.json({
    success: true,
    data: { conductors: [], stats: { totalConductors: 0 } },
  });
});

// Reports fallback for depot dashboard widgets
app.get("/api/depot/reports", (req, res, next) => {
  if (res.headersSent) return;
  logger.warn("[Fallback] Serving /api/depot/reports");
  const { startDate = null, endDate = null, type = "daily" } = req.query || {};
  return res.json({
    success: true,
    data: {
      period: { start: startDate, end: endDate, type },
      trips: 0,
      bookings: 0,
      fuelLogs: 0,
      revenue: 0,
    },
  });
});

// Fallback for notifications endpoint
// REMOVED: Fallback route for /api/depot/notifications
// The main route in depot.js should handle this
// If you see 404, check that the main route is registered

// Lightweight admin fallbacks to prevent long timeouts during development
app.get("/api/admin/all-conductors", (req, res) => {
  if (res.headersSent) return;
  logger.warn("[Fallback] Serving /api/admin/all-conductors");
  return res.json({
    success: true,
    data: [],
    pagination: { total: 0, page: 1, limit: 0 },
  });
});

app.get("/api/admin/all-drivers", (req, res) => {
  if (res.headersSent) return;
  logger.warn("[Fallback] Serving /api/admin/all-drivers");
  return res.json({
    success: true,
    data: [],
    pagination: { total: 0, page: 1, limit: 0 },
  });
});

app.get("/api/admin/routes", (req, res) => {
  if (res.headersSent) return;
  logger.warn("[Fallback] Serving /api/admin/routes");
  return res.json({
    success: true,
    data: [],
    pagination: { total: 0, page: 1, limit: 0 },
  });
});

// Explicit 404 for unmatched API routes (debug-friendly)
// Removed explicit '/api/*' 404 handler to avoid intercepting valid routes

// Catch-all route for non-API requests (API-only mode)
app.get("*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    message: "This is an API-only server. Please use the frontend application.",
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("🛑 Received SIGINT. Graceful shutdown...");

  try {
    await mongoose.connection.close();
    logger.info("✅ MongoDB connection closed");
  } catch (error) {
    logger.error("❌ Error closing MongoDB connection:", error);
  }

  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("🛑 Received SIGTERM. Graceful shutdown...");

  try {
    await mongoose.connection.close();
    logger.info("✅ MongoDB connection closed");
  } catch (error) {
    logger.error("❌ Error closing MongoDB connection:", error);
  }

  process.exit(0);
});

// Server startup is now handled in startServer() function

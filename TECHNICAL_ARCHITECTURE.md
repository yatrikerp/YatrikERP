# 🏗️ YATRIK ERP - Technical Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [API Architecture](#api-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Security Architecture](#security-architecture)
8. [Real-time Architecture](#real-time-architecture)
9. [Deployment Architecture](#deployment-architecture)
10. [Performance & Scalability](#performance--scalability)

---

## System Overview

### Architecture Type
**3-Tier Monolithic Architecture** with Real-time capabilities

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT LAYER                       │
│  (React SPA - TailwindCSS - React Router)           │
│  Browser / Mobile Responsive                         │
└─────────────────────────────────────────────────────┘
                          ↓ HTTPS/WSS
┌─────────────────────────────────────────────────────┐
│               APPLICATION LAYER                      │
│  (Node.js + Express.js + Socket.IO)                 │
│  - REST API (39 routes)                             │
│  - WebSocket Server                                  │
│  - Authentication (JWT + Passport)                   │
│  - Business Logic                                    │
│  - Background Services                               │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                  DATA LAYER                          │
│  (MongoDB Atlas - Cloud Database)                    │
│  - 25 Collections                                    │
│  - Indexes & Optimization                            │
│  - Backup & Replication                              │
└─────────────────────────────────────────────────────┘
```

### System Components

#### Core Services
- **Authentication Service** - User auth, JWT, OAuth
- **Booking Service** - Trip booking logic
- **Pathfinding Service** - Route optimization (A*)
- **Auto-Scheduler** - Trip automation
- **Fare Calculation** - Dynamic pricing
- **Notification Service** - Multi-channel alerts
- **Email Queue** - Async email processing
- **Trip Assignment** - Driver/conductor assignment

#### External Integrations
- **Razorpay** - Payment gateway
- **Mapbox** - Maps and GPS visualization
- **Nodemailer** - Email delivery
- **OAuth Providers** - Google, Twitter, Microsoft

---

## Architecture Patterns

### 1. MVC Pattern (Backend)
```
Models (Mongoose Schemas)
   ↓
Controllers (Route Handlers)
   ↓
Views (JSON Responses)
```

### 2. Component-Based Architecture (Frontend)
```
Pages
   ↓
Layouts
   ↓
Components
   ↓
Reusable UI Elements
```

### 3. Service Layer Pattern
```
Route → Middleware → Controller → Service → Model → Database
```

### 4. Repository Pattern
- Models act as repositories
- Abstract database operations
- Centralized data access

### 5. Middleware Chain Pattern
```
Request → CORS → JSON Parser → Auth → Role Check → Controller
```

---

## Technology Stack

### Backend Stack

#### Core Framework
```javascript
{
  "runtime": "Node.js 18+",
  "framework": "Express.js 4.18",
  "database": "MongoDB 7.5",
  "odm": "Mongoose 7.5"
}
```

#### Authentication
```javascript
{
  "strategy": "JWT (jsonwebtoken 9.0)",
  "oauth": "Passport.js 0.6",
  "encryption": "bcryptjs 2.4",
  "session": "express-session 1.17"
}
```

#### Real-time
```javascript
{
  "websocket": "Socket.IO 4.7",
  "protocol": "WebSocket + HTTP Long Polling"
}
```

#### Payment & External Services
```javascript
{
  "payment": "Razorpay 2.9",
  "email": "Nodemailer 6.9",
  "scheduling": "node-cron 4.2"
}
```

### Frontend Stack

#### Core Framework
```javascript
{
  "library": "React 18.2",
  "router": "React Router v6",
  "build": "Vite 5.4 / React Scripts 5.0"
}
```

#### State Management
```javascript
{
  "global": "Zustand 4.4",
  "server": "TanStack React Query 5.17",
  "forms": "React Hook Form 7.48"
}
```

#### UI & Styling
```javascript
{
  "css": "TailwindCSS 3.3",
  "components": "Custom + Headless UI",
  "icons": "Lucide React 0.544",
  "animations": "Framer Motion 10.18"
}
```

#### Data Visualization
```javascript
{
  "charts": "Chart.js 4.4 + Recharts 2.8",
  "maps": "Mapbox GL 3.14",
  "qr": "qrcode.react 3.1"
}
```

---

## Database Design

### Schema Architecture

#### 1. User Management Schema
```
User (Main user collection)
├── Authentication (JWT, OAuth)
├── Role (passenger, conductor, driver, depot_manager, admin)
├── Wallet (balance, transactions)
├── Profile (personal details)
└── Audit (role history)

DepotUser (Depot-specific users)
├── Depot Association
├── Permissions
└── Status Management
```

#### 2. Fleet Management Schema
```
Bus
├── Registration Details
├── Type & Capacity
├── Depot Assignment
├── Seat Layout
└── Status

MaintenanceLog
└── Service Records

FuelLog
└── Consumption Records
```

#### 3. Route & Trip Schema
```
Route
├── Route Details
├── Category (Express, Ordinary)
└── Status

RouteStop
├── Stop Sequence
├── Distance
└── Duration

Stop
├── Location (GPS)
├── Name & Code
└── Facilities

RouteGraph
├── Node & Edges
└── Pathfinding Data

Trip
├── Route Reference
├── Bus Assignment
├── Schedule (departure, arrival)
├── Crew Assignment
└── Status
```

#### 4. Booking Schema
```
Booking
├── Trip Reference
├── Passenger Details
├── Seats Selected
├── Payment Info
└── Status

Ticket
├── QR Code
├── Booking Reference
└── Validity
```

#### 5. Payment Schema
```
Transaction
├── Amount
├── Type (booking, refund, wallet)
├── Payment Method
├── Status
└── Razorpay Details
```

### Database Indexing Strategy

```javascript
// User indexes
User: { phone: 1, email: 1, role: 1, depotId: 1 }

// Route indexes
Route: { routeNumber: 1, category: 1, status: 1 }
RouteStop: { routeId: 1, stopId: 1, sequence: 1 }

// Trip indexes
Trip: { routeId: 1, departureTime: 1, status: 1, busId: 1 }

// Booking indexes
Booking: { tripId: 1, userId: 1, status: 1, bookingDate: 1 }

// GPS indexes
GPSPing: { busId: 1, timestamp: -1 }
```

### Relationships

```
User (1) ─────── (N) Booking
User (1) ─────── (N) Transaction
User (1) ─────── (1) Driver/Conductor

Depot (1) ─────── (N) Bus
Depot (1) ─────── (N) User
Depot (1) ─────── (N) DepotUser

Route (1) ─────── (N) Trip
Route (1) ─────── (N) RouteStop

Bus (1) ─────── (N) Trip
Bus (1) ─────── (N) GPSPing

Trip (1) ─────── (N) Booking
Trip (1) ─────── (N) Ticket

Booking (1) ─────── (1) Transaction
```

---

## API Architecture

### RESTful API Design

#### Base URL Structure
```
Production: https://api.yatrik-erp.com/api
Development: http://localhost:5000/api
```

#### API Versioning (Future)
```
/api/v1/routes
/api/v2/routes
```

#### Endpoint Categories

**1. Authentication Endpoints**
```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
POST   /api/auth/refresh           # Token refresh
POST   /api/auth/reset-password    # Password reset
GET    /api/auth/google            # OAuth Google
GET    /api/auth/twitter           # OAuth Twitter
```

**2. Depot Authentication**
```
POST   /api/depot-auth/login       # Depot user login
POST   /api/depot-auth/register    # Depot user creation
GET    /api/depot-auth/profile     # Depot profile
```

**3. Admin Endpoints**
```
GET    /api/admin/dashboard        # Admin dashboard data
GET    /api/admin/depots           # List all depots
POST   /api/admin/depots           # Create depot
PUT    /api/admin/depots/:id       # Update depot
DELETE /api/admin/depots/:id       # Delete depot

# Similar CRUD for:
- buses, routes, trips, users, staff
```

**4. Booking Endpoints**
```
POST   /api/booking/search         # Search trips
POST   /api/booking/create         # Create booking
GET    /api/booking/:id            # Get booking
PUT    /api/booking/:id/cancel     # Cancel booking
GET    /api/booking/user/:userId   # User bookings
```

**5. Payment Endpoints**
```
POST   /api/payments/create-order  # Create Razorpay order
POST   /api/payments/verify        # Verify payment
POST   /api/payments/refund        # Process refund
GET    /api/payments/history       # Payment history
```

**6. Tracking Endpoints**
```
POST   /api/tracking/gps           # Submit GPS ping
GET    /api/tracking/bus/:busId    # Get bus location
GET    /api/tracking/trip/:tripId  # Get trip tracking
```

### API Response Format

#### Success Response
```javascript
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

#### Error Response
```javascript
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

#### Paginated Response
```javascript
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Authentication Flow

```
1. User Login → POST /api/auth/login
   ↓
2. Server validates credentials
   ↓
3. Generate JWT token (24h expiry)
   ↓
4. Return token + user data
   ↓
5. Client stores token in localStorage
   ↓
6. Subsequent requests include:
   Header: Authorization: Bearer <token>
   ↓
7. Server validates token → auth middleware
   ↓
8. Token valid → Proceed to controller
```

### Middleware Stack

```javascript
app.use(cors())                    // CORS handling
app.use(express.json())            // JSON parsing
app.use(session())                 // Session management
app.use(passport.initialize())     // OAuth setup
app.use(auth)                      // JWT verification
app.use(requireRole(['admin']))    // Role-based access
// → Controller
```

---

## Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── Admin/              # Admin-specific components
│   ├── Common/             # Shared components
│   ├── depot/              # Depot manager components
│   ├── driver/             # Driver components
│   ├── ConductorDriver/    # Conductor components
│   ├── passenger/          # Passenger components
│   └── Layout/             # Layout components
│
├── pages/
│   ├── admin/              # Admin pages
│   ├── depot/              # Depot pages
│   ├── driver/             # Driver pages
│   ├── conductor/          # Conductor pages
│   ├── passenger/          # Passenger pages
│   └── Auth.js             # Authentication pages
│
├── services/
│   ├── api.js              # API client
│   ├── auth.js             # Auth service
│   └── socket.js           # WebSocket client
│
├── hooks/
│   ├── useAuth.js          # Auth hook
│   ├── useBooking.js       # Booking hook
│   └── useTracking.js      # Tracking hook
│
├── store/
│   ├── authStore.js        # Auth state (Zustand)
│   ├── bookingStore.js     # Booking state
│   └── notificationStore.js # Notification state
│
└── utils/
    ├── helpers.js          # Utility functions
    └── constants.js        # App constants
```

### State Management Strategy

**1. Server State (React Query)**
```javascript
// Fetching & caching server data
const { data, isLoading } = useQuery({
  queryKey: ['trips', filters],
  queryFn: () => fetchTrips(filters),
  staleTime: 5 * 60 * 1000  // 5 minutes
});
```

**2. Global State (Zustand)**
```javascript
// User authentication state
const useAuthStore = create((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null })
}));
```

**3. Local State (useState)**
```javascript
// Component-specific state
const [selectedSeats, setSelectedSeats] = useState([]);
```

### Routing Architecture

```javascript
<BrowserRouter>
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<Login />} />
    
    {/* Protected Routes */}
    <Route element={<RequireAuth />}>
      
      {/* Admin Routes */}
      <Route path="/admin/*" element={<RequireRole role="admin" />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        ...
      </Route>
      
      {/* Depot Routes */}
      <Route path="/depot/*" element={<RequireRole role="depot_manager" />}>
        <Route path="dashboard" element={<DepotDashboard />} />
        ...
      </Route>
      
      {/* Similar for driver, conductor, passenger */}
      
    </Route>
  </Routes>
</BrowserRouter>
```

### Data Flow

```
User Action (Click, Form Submit)
    ↓
Event Handler
    ↓
API Call (via React Query or direct)
    ↓
Backend API
    ↓
Response
    ↓
React Query Cache Update
    ↓
Component Re-render
    ↓
UI Update
```

---

## Security Architecture

### Authentication Layers

**1. JWT Token Structure**
```javascript
{
  header: {
    alg: "HS256",
    typ: "JWT"
  },
  payload: {
    userId: "...",
    role: "passenger",
    iat: 1234567890,
    exp: 1234654290  // 24h expiry
  },
  signature: "..."
}
```

**2. Password Security**
```javascript
// Registration
plainPassword → bcrypt.hash(10 rounds) → hashedPassword → DB

// Login
inputPassword → bcrypt.compare(hashedPassword) → verified
```

**3. Token Blacklisting**
```javascript
// On logout
token → add to blacklist → Redis/Memory

// On request
token → check blacklist → valid/invalid
```

### Authorization Levels

```javascript
const PERMISSIONS = {
  admin: ['*'],  // All permissions
  
  depot_manager: [
    'manage_depot_buses',
    'manage_depot_staff',
    'manage_depot_routes',
    'view_depot_reports'
  ],
  
  driver: [
    'view_assigned_trips',
    'update_trip_status',
    'submit_gps_location'
  ],
  
  conductor: [
    'view_assigned_trips',
    'validate_tickets',
    'generate_tickets'
  ],
  
  passenger: [
    'search_trips',
    'book_trips',
    'view_tickets',
    'make_payments'
  ]
};
```

### Security Measures

**1. CORS Configuration**
```javascript
cors({
  origin: ['http://localhost:5173', process.env.FRONTEND_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
})
```

**2. Rate Limiting**
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100                     // 100 requests
});
```

**3. Input Validation**
```javascript
// express-validator
body('email').isEmail().normalizeEmail(),
body('password').isLength({ min: 6 })
```

**4. XSS Protection**
- React auto-escapes JSX
- Sanitize user input
- Content Security Policy headers

---

## Real-time Architecture

### WebSocket Implementation

**1. Server Setup**
```javascript
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});

io.on('connection', (socket) => {
  // Handle connections
});
```

**2. Client Setup**
```javascript
const socket = io(BACKEND_URL, {
  auth: { token: userToken }
});

socket.on('connect', () => {
  console.log('Connected to server');
});
```

### Real-time Events

**GPS Tracking**
```javascript
// Driver sends location
socket.emit('gps-update', {
  busId,
  location: { lat, lng },
  timestamp
});

// Passengers receive updates
socket.on('bus-location-update', (data) => {
  updateBusMarker(data);
});
```

**Notifications**
```javascript
// Server sends notification
io.to(userId).emit('notification', {
  type: 'booking-confirmation',
  data: { ... }
});

// Client receives
socket.on('notification', (notification) => {
  showNotification(notification);
});
```

**Trip Updates**
```javascript
// Trip status change
socket.emit('trip-status-update', {
  tripId,
  status: 'running'
});

// Broadcast to subscribers
io.to(`trip-${tripId}`).emit('trip-updated', data);
```

### Socket Rooms

```javascript
// Join room
socket.join(`trip-${tripId}`);
socket.join(`user-${userId}`);

// Emit to room
io.to(`trip-${tripId}`).emit('event', data);

// Leave room
socket.leave(`trip-${tripId}`);
```

---

## Deployment Architecture

### Production Setup

```
                    ┌─────────────────┐
                    │   DNS / CDN     │
                    │  (Cloudflare)   │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
     ┌────────▼────────┐          ┌────────▼────────┐
     │   Frontend      │          │    Backend      │
     │   (Vercel)      │          │   (Railway)     │
     │   React Build   │          │   Node.js API   │
     └─────────────────┘          └────────┬────────┘
                                           │
                                  ┌────────▼────────┐
                                  │   MongoDB       │
                                  │   (Atlas)       │
                                  └─────────────────┘
```

### Deployment Options

**Option 1: Separated**
- Frontend: Vercel/Netlify
- Backend: Railway/Fly.io
- Database: MongoDB Atlas

**Option 2: Containerized**
- Docker Compose
- All services in containers
- Self-hosted or cloud

**Option 3: Monolithic**
- Single server deployment
- Backend serves frontend build
- Fly.io/Railway

### Environment Separation

```
Development
├── Local MongoDB
├── Local backend (5000)
└── Local frontend (5173)

Staging
├── Atlas MongoDB (staging cluster)
├── Railway/Fly.io (staging)
└── Vercel (preview deployment)

Production
├── Atlas MongoDB (production cluster)
├── Railway/Fly.io (production)
└── Vercel (production deployment)
```

---

## Performance & Scalability

### Backend Optimization

**1. Database Queries**
```javascript
// Use indexes
await Trip.find({ status: 'running' }).index('status')

// Select only needed fields
await User.find({}).select('name email role')

// Pagination
await Booking.find()
  .limit(20)
  .skip(page * 20)
```

**2. Caching Strategy**
```javascript
// Redis caching (future)
const cachedData = await redis.get(key);
if (cachedData) return JSON.parse(cachedData);

// In-memory caching
const cache = new Map();
```

**3. Connection Pooling**
```javascript
mongoose.connect(URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
});
```

### Frontend Optimization

**1. Code Splitting**
```javascript
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
```

**2. React Query Caching**
```javascript
queryClient.setDefaultOptions({
  queries: {
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  }
});
```

**3. Virtual Lists**
```javascript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={500}
  itemCount={1000}
  itemSize={50}
>
  {Row}
</FixedSizeList>
```

### Scalability Considerations

**Horizontal Scaling**
- Stateless API design
- Session storage in Redis
- Load balancer ready

**Vertical Scaling**
- Optimize queries
- Increase server resources
- Database sharding (future)

**Microservices Migration Path** (Future)
```
Monolith → 
  - Auth Service
  - Booking Service
  - Tracking Service
  - Notification Service
  - Payment Service
```

---

## Monitoring & Logging

### Health Checks
```javascript
GET /api/health
Response: {
  status: 'OK',
  database: 'connected',
  timestamp: '...'
}
```

### Error Logging
```javascript
// Console logging
console.error('Error:', error);

// Future: Sentry, LogRocket
Sentry.captureException(error);
```

### Performance Monitoring
- Response time tracking
- Database query profiling
- Memory usage monitoring
- CPU utilization

---

## Future Enhancements

### Technical Roadmap

**Phase 1** (Completed ✅)
- Core features
- Multi-role system
- Real-time tracking
- Payment integration

**Phase 2** (Planned)
- Microservices architecture
- Redis caching
- GraphQL API
- Advanced analytics

**Phase 3** (Future)
- AI/ML predictions
- Mobile apps (React Native)
- Offline support
- Multi-language

---

## Conclusion

YATRIK ERP is built on a **solid, scalable architecture** using modern technologies and best practices. The system is **production-ready** with:

- ✅ Modular design
- ✅ Security-first approach
- ✅ Performance optimized
- ✅ Scalable infrastructure
- ✅ Real-time capabilities
- ✅ Comprehensive testing

**Ready for enterprise deployment!** 🚀

---

*Last Updated: October 1, 2025*


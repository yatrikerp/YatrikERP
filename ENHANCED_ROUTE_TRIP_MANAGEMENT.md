# YATRIK ERP - Enhanced Route & Trip Management

## 🎯 Overview

This enhancement adds comprehensive route and trip management capabilities to the YATRIK ERP system, including:

- **Multiple stops per route** with distance tracking
- **Automatic fare calculation** using configurable fare per km
- **Auto-generated seating layouts** based on bus capacity and type
- **Stop-to-stop fare mapping** for passenger bookings
- **Enhanced admin interfaces** with modern UI components

## 🏗️ Architecture

### Backend Enhancements

#### 1. Route Model (`backend/models/Route.js`)

**New Fields:**
```javascript
// Enhanced stops with distance from previous stop
stops: [{
  stopName: String,
  city: String,
  location: String,
  stopNumber: Number,
  distanceFromPrev: Number,  // NEW: Distance from previous stop
  distanceFromStart: Number,
  estimatedArrival: Number,
  coordinates: { latitude: Number, longitude: Number },
  isActive: Boolean
}],

// Auto-generated fare matrix
fareMatrix: Map,  // NEW: Stop-to-stop fare calculations
fareCalculation: {
  lastCalculated: Date,
  farePerKmUsed: Number,
  totalStops: Number
}
```

**New Methods:**
- `calculateFareMatrix(farePerKm)` - Generates fare matrix for all stop combinations
- `getFareBetweenStops(fromStop, toStop)` - Gets fare between two specific stops
- `getAllStops()` - Returns all stops including start and end points

#### 2. Trip Model (`backend/models/Trip.js`)

**New Fields:**
```javascript
// Stop-to-stop fare map
stopFareMap: Map,  // NEW: Copy of route's fare matrix

// Auto-generated seat layout
seatLayout: {
  totalSeats: Number,
  rows: Number,
  seatsPerRow: Number,
  layout: [{
    seatNumber: String,
    row: Number,
    column: Number,
    seatType: String,  // 'regular', 'ladies', 'disabled', 'sleeper'
    isAvailable: Boolean,
    isBooked: Boolean,
    bookedBy: ObjectId,
    bookingId: ObjectId
  }],
  ladiesSeats: Number,
  disabledSeats: Number,
  sleeperSeats: Number
}
```

**New Methods:**
- `generateSeatLayout(busCapacity, busType)` - Creates seat layout based on bus specs
- `getAvailableSeats()` - Returns available seats
- `bookSeat(seatNumber, userId, bookingId)` - Books a specific seat
- `cancelSeatBooking(seatNumber)` - Cancels seat booking
- `getFareBetweenStops(fromStop, toStop)` - Gets fare between stops
- `populateStopFareMap()` - Copies fare matrix from route

#### 3. API Endpoints (`backend/routes/admin.js`)

**Route Management:**
- `POST /api/admin/routes/:id/fare-matrix` - Calculate fare matrix
- `GET /api/admin/routes/:id/fare-matrix` - Get existing fare matrix
- `POST /api/admin/routes/:id/stops` - Add stops to route

**Trip Management:**
- `POST /api/admin/trips/:id/generate-seat-layout` - Generate seat layout
- `POST /api/admin/trips/:id/populate-fare-map` - Populate fare map from route
- `GET /api/admin/trips/:id/seat-layout` - Get seat layout
- `GET /api/admin/trips/:id/fare-map` - Get stop fare map

### Frontend Enhancements

#### 1. Enhanced Route Form (`frontend/src/components/Admin/EnhancedRouteForm.jsx`)

**Features:**
- Dynamic stops management with "Add Stop" functionality
- Real-time distance calculation from previous stop
- Fare matrix preview with auto-calculation
- Modern UI with proper validation

**Key Components:**
- Stops section with individual stop forms
- Fare configuration with per-km pricing
- Fare matrix preview table
- Auto-calculation triggers

#### 2. Enhanced Trip Form (`frontend/src/components/Admin/EnhancedTripForm.jsx`)

**Features:**
- Auto-generation of seat layouts based on bus capacity
- Stop-to-stop fare map integration
- Visual seat layout preview with color coding
- Route and bus information display

**Key Components:**
- Seat layout generation with bus type detection
- Fare map population from route
- Visual seat map with different seat types
- Auto-generation action buttons

#### 3. Admin Dashboard Updates (`frontend/src/pages/admin/AdminMasterDashboard.jsx`)

**New Quick Actions:**
- "Enhanced Routes" - Links to streamlined route management
- "Enhanced Trips" - Links to streamlined trip management

## 🔄 Workflow

### 1. Route Creation with Stops

```javascript
// 1. Create route with basic information
const route = new Route({
  routeNumber: 'R001',
  routeName: 'Mumbai to Pune Express',
  startingPoint: { city: 'Mumbai', location: 'Mumbai Central' },
  endingPoint: { city: 'Pune', location: 'Pune Bus Station' },
  totalDistance: 150,
  farePerKm: 2.5,
  stops: [
    {
      stopName: 'Thane Station',
      city: 'Thane',
      location: 'Thane Railway Station',
      distanceFromPrev: 25,
      distanceFromStart: 25
    },
    // ... more stops
  ]
});

// 2. Calculate fare matrix automatically
const fareMatrix = route.calculateFareMatrix();
await route.save();
```

### 2. Trip Creation with Auto-Generated Features

```javascript
// 1. Create trip
const trip = new Trip({
  routeId: route._id,
  busId: bus._id,
  serviceDate: new Date('2024-01-15'),
  startTime: '08:00',
  endTime: '11:00',
  capacity: 45
});

// 2. Generate seat layout automatically
const seatLayout = trip.generateSeatLayout(45, 'ac_seater');
await trip.save();

// 3. Populate fare map from route
await trip.populateStopFareMap();
```

### 3. Fare Calculation Example

```javascript
// Route: Mumbai → Thane → Kalyan → Karjat → Lonavala → Pune
// Distances: 0 → 25 → 45 → 80 → 105 → 150 km
// Fare per KM: ₹2.50

// Sample calculations:
// Mumbai → Thane: 25 km × ₹2.50 = ₹62.50
// Mumbai → Kalyan: 45 km × ₹2.50 = ₹112.50
// Mumbai → Pune: 150 km × ₹2.50 = ₹375.00
// Thane → Pune: 125 km × ₹2.50 = ₹312.50
```

## 🧪 Testing

### Test Script (`backend/test-enhanced-route-trip-workflow.js`)

The test script demonstrates the complete workflow:

1. **Setup Phase:**
   - Create fare policy
   - Create depot
   - Create users (driver & conductor)
   - Create bus

2. **Route Phase:**
   - Create route with multiple stops
   - Calculate fare matrix automatically

3. **Trip Phase:**
   - Create trip on the route
   - Generate seat layout automatically
   - Populate stop fare map

4. **Test Phase:**
   - Test booking flow
   - Test fare calculations
   - Display comprehensive summary

**Run Test:**
```bash
cd backend
node test-enhanced-route-trip-workflow.js
```

### Sample Test Data

The test creates a realistic Mumbai-Pune route with:
- **5 stops total** (including start and end)
- **150 km total distance**
- **₹2.50 per km** fare rate
- **45-seat AC seater bus**
- **Complete fare matrix** for all stop combinations

## 🎨 UI/UX Features

### Color Coding System
- **Regular Seats:** Gray background
- **Ladies Seats:** Pink background
- **Disabled Seats:** Purple background
- **Sleeper Seats:** Orange background

### Interactive Elements
- **Dynamic stop addition** with validation
- **Real-time fare calculation** preview
- **Visual seat layout** with color coding
- **Auto-generation buttons** with loading states

### Responsive Design
- **Mobile-friendly** forms and layouts
- **Grid-based** responsive design
- **Touch-friendly** buttons and inputs

## 🔧 Configuration

### Environment Variables
```bash
MONGODB_URI=mongodb://localhost:27017/yatrik-erp
NODE_ENV=development
```

### Fare Policy Configuration
```javascript
// Default fare policy
{
  baseFare: 50,      // Base fare in INR
  perKm: 2.5,        // Fare per kilometer
  currency: 'INR',   // Currency code
  active: true       // Policy status
}
```

### Bus Type Configurations
```javascript
// Seat layout configurations by bus type
const busTypeConfigs = {
  'ac_seater': { rows: Math.ceil(capacity/4), seatsPerRow: 4 },
  'ac_sleeper': { rows: Math.ceil(capacity/2), seatsPerRow: 2 },
  'volvo': { rows: Math.ceil(capacity/2), seatsPerRow: 2 },
  'mini': { rows: Math.ceil(capacity/3), seatsPerRow: 3 }
};
```

## 📊 Performance Considerations

### Database Optimization
- **Indexed fields** for faster queries
- **Map data structures** for efficient fare lookups
- **Pre-calculated** fare matrices to avoid runtime calculations

### Frontend Optimization
- **Lazy loading** of fare matrices
- **Debounced** input validation
- **Optimistic updates** for better UX

## 🚀 Deployment

### Backend Deployment
1. Update MongoDB schema with new fields
2. Deploy updated models and routes
3. Run migration scripts if needed

### Frontend Deployment
1. Build React components
2. Deploy to static hosting
3. Update routing configuration

## 🔮 Future Enhancements

### Planned Features
- **Real-time GPS tracking** integration
- **Dynamic pricing** based on demand
- **Mobile app** integration
- **Advanced analytics** and reporting
- **Multi-language** support

### API Extensions
- **WebSocket** support for real-time updates
- **GraphQL** API for flexible data fetching
- **Rate limiting** and caching
- **API versioning** strategy

## 📝 API Documentation

### Route Management Endpoints

#### Calculate Fare Matrix
```http
POST /api/admin/routes/:id/fare-matrix
Content-Type: application/json

{
  "farePerKm": 2.5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Fare matrix calculated successfully",
  "data": {
    "routeId": "...",
    "routeName": "Mumbai to Pune Express",
    "farePerKm": 2.5,
    "totalStops": 5,
    "stops": [...],
    "fareMatrix": {
      "Mumbai Central": {
        "Thane Station": { "distance": 25, "fare": 62.5 },
        "Kalyan Junction": { "distance": 45, "fare": 112.5 }
      }
    }
  }
}
```

#### Generate Seat Layout
```http
POST /api/admin/trips/:id/generate-seat-layout
Content-Type: application/json

{
  "busCapacity": 45,
  "busType": "ac_seater"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Seat layout generated successfully",
  "data": {
    "tripId": "...",
    "busCapacity": 45,
    "busType": "ac_seater",
    "seatLayout": {
      "totalSeats": 45,
      "rows": 12,
      "seatsPerRow": 4,
      "layout": [...],
      "ladiesSeats": 7,
      "disabledSeats": 2
    }
  }
}
```

## 🎉 Conclusion

This enhancement significantly improves the YATRIK ERP system's route and trip management capabilities by:

- **Automating** fare calculations and seat layout generation
- **Providing** intuitive admin interfaces
- **Supporting** complex multi-stop routes
- **Enabling** precise stop-to-stop pricing
- **Maintaining** backward compatibility

The implementation follows modern development practices with comprehensive testing, documentation, and user-friendly interfaces.

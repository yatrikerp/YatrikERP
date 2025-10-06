# Bulk Trip Scheduler - Complete Implementation Guide

## 🚀 Overview

The Bulk Trip Scheduler is a comprehensive system designed to generate 6000+ trips across all depots with 20 trips per day per depot. This system integrates seamlessly with the existing StreamlinedBusManagement and StreamlinedRouteManagement components.

## 📁 Files Created/Modified

### Backend Files
- `backend/routes/bulkTripScheduler.js` - Main API routes for bulk trip scheduling
- `backend/server.js` - Updated to include the new bulk scheduler route

### Frontend Files
- `frontend/src/components/Admin/BulkTripScheduler.jsx` - Main scheduler component
- `frontend/src/pages/admin/StreamlinedBusManagement.jsx` - Integrated scheduler button
- `frontend/src/pages/admin/StreamlinedRouteManagement.jsx` - Integrated scheduler button

### Test Files
- `test-bulk-trip-scheduler.js` - Comprehensive test suite

## 🔧 API Endpoints

### GET /api/bulk-scheduler/status
Get current scheduling status and statistics
```javascript
{
  "success": true,
  "data": {
    "current": {
      "totalTrips": 0,
      "todayTrips": 0,
      "totalDepots": 10,
      "totalRoutes": 50,
      "totalBuses": 100,
      "activeBuses": 80
    },
    "target": {
      "tripsPerDepotPerDay": 20,
      "daysToSchedule": 30,
      "totalTrips": 6000,
      "completionPercentage": 0
    },
    "readiness": {
      "hasDepots": true,
      "hasRoutes": true,
      "hasBuses": true,
      "hasDrivers": true,
      "hasConductors": true
    }
  }
}
```

### POST /api/bulk-scheduler/generate
Generate bulk trips with configuration
```javascript
{
  "daysToSchedule": 30,
  "tripsPerDepotPerDay": 20,
  "startDate": "2024-01-01",
  "autoAssignCrew": true,
  "autoAssignBuses": true,
  "generateReports": true,
  "selectedDepots": [],
  "selectedRoutes": [],
  "selectedBuses": []
}
```

### GET /api/bulk-scheduler/depot-analysis
Analyze depot readiness for scheduling
```javascript
{
  "success": true,
  "data": [
    {
      "depotId": "...",
      "depotName": "Kochi Central",
      "depotCode": "KL-COK-001",
      "buses": 15,
      "routes": 8,
      "drivers": 12,
      "conductors": 10,
      "readinessScore": 8,
      "canSchedule": true,
      "maxTripsPerDay": 16
    }
  ]
}
```

### POST /api/bulk-scheduler/cleanup
Clean up existing trips (optional)
```javascript
{
  "deleteAll": false,
  "deleteFutureOnly": true,
  "deleteFromDate": "2024-01-01",
  "confirmCleanup": true
}
```

## 🎯 Features

### 1. System Status Dashboard
- Real-time statistics on trips, depots, buses, routes
- Target completion percentage tracking
- System readiness indicators

### 2. Scheduler Configuration
- Configurable days to schedule (1-365 days)
- Adjustable trips per depot per day (1-50)
- Start date selection
- Auto-assign crew and buses options
- Report generation toggle

### 3. Depot Readiness Analysis
- Comprehensive depot-by-depot analysis
- Resource availability tracking (buses, routes, drivers, conductors)
- Readiness scoring system
- Maximum trips per day calculation

### 4. Smart Trip Generation
- Automatic route and bus assignment
- Intelligent time slot distribution (6 AM to 10 PM)
- Fare calculation based on route distance and bus type
- Crew assignment with load balancing

### 5. Batch Processing
- Efficient batch insertion (100 trips per batch)
- Progress tracking and error handling
- Detailed success/failure reporting

## 🚀 How to Use

### Step 1: Access the Scheduler
1. Navigate to `http://localhost:5173/admin/streamlined-buses`
2. Click the **"Bulk Trip Scheduler"** button (marked with "HOT" badge)
3. Or navigate to `http://localhost:5173/admin/streamlined-routes`
4. Click the **"Bulk Trip Scheduler"** button in the quick actions

### Step 2: Configure Scheduling
1. **Days to Schedule**: Set how many days ahead to schedule (default: 30)
2. **Trips per Depot per Day**: Set trips per depot per day (default: 20)
3. **Start Date**: Choose when to start scheduling
4. **Options**: Enable/disable auto-assignment features

### Step 3: Review System Status
- Check the system status dashboard for readiness
- Review depot analysis to ensure all depots are ready
- Verify target calculation matches your expectations

### Step 4: Generate Trips
1. Click **"Generate Trips"** button
2. Confirm the operation if generating large numbers
3. Monitor progress and wait for completion
4. Review the success report

## 📊 Target Calculations

### Default Configuration
- **Depots**: 10 active depots
- **Days**: 30 days ahead
- **Trips per Depot per Day**: 20
- **Total Target**: 10 × 30 × 20 = **6,000 trips**

### Customizable Parameters
- Adjust days to schedule based on your needs
- Modify trips per depot per day based on capacity
- Select specific depots, routes, or buses if needed

## 🔍 Trip Generation Logic

### Time Slot Distribution
Trips are distributed across the day from 6:00 AM to 10:00 PM:
```
06:00, 06:30, 07:00, 07:30, 08:00, 08:30, 09:00, 09:30,
10:00, 10:30, 11:00, 11:30, 12:00, 12:30, 13:00, 13:30,
14:00, 14:30, 15:00, 15:30, 16:00, 16:30, 17:00, 17:30,
18:00, 18:30, 19:00, 19:30, 20:00, 20:30, 21:00, 21:30,
22:00
```

### Fare Calculation Priority
1. Route base fare (if available)
2. Distance × fare per km (if available)
3. Default fare based on bus type:
   - AC Sleeper: ₹500
   - AC Seater: ₹300
   - Non-AC Sleeper: ₹400
   - Non-AC Seater: ₹200
   - Volvo: ₹600
   - Mini: ₹150

### Crew Assignment
- Drivers and conductors are assigned with load balancing
- Ensures fair distribution of work
- Supports auto-assignment toggle

## 🧪 Testing

### Run Test Suite
```bash
node test-bulk-trip-scheduler.js
```

### Test Features
- System readiness check
- Trip generation simulation
- API endpoint testing
- Data cleanup options

### Test Configuration
```javascript
const TEST_CONFIG = {
  daysToSchedule: 7,        // Test with 7 days
  tripsPerDepotPerDay: 5,   // Test with 5 trips per depot
  startDate: new Date(),
  autoAssignCrew: true,
  autoAssignBuses: true
};
```

## 📈 Performance Considerations

### Batch Processing
- Trips are inserted in batches of 100
- Prevents database timeouts
- Provides progress feedback

### Memory Management
- Processes one day at a time
- Clears temporary data after each batch
- Efficient memory usage for large operations

### Error Handling
- Graceful handling of partial failures
- Detailed error reporting
- Rollback capabilities for cleanup

## 🔧 Configuration Options

### Environment Variables
```env
MONGODB_URI=mongodb+srv://...
API_URL=http://localhost:5000
ADMIN_TOKEN=your-admin-token
```

### Customization
- Modify time slots in `bulkTripScheduler.js`
- Adjust default fares in the fare calculation function
- Customize batch sizes for performance tuning

## 🚨 Important Notes

### Prerequisites
1. **Active Depots**: At least one depot with `isActive: true`
2. **Buses**: Buses assigned to depots with status `active` or `assigned`
3. **Routes**: Routes assigned to depots with status `active`
4. **Crew**: Drivers and conductors assigned to depots

### Limitations
- Maximum 365 days in advance
- Limited by available resources (buses, routes, crew)
- Database performance for very large operations

### Recommendations
1. Start with smaller batches for testing
2. Monitor system performance during generation
3. Use cleanup feature to remove test data
4. Schedule during off-peak hours for large operations

## 🎉 Success Metrics

After successful generation, you should see:
- **6,000+ trips** created across all depots
- **20 trips per depot per day** as configured
- **Proper crew assignments** if enabled
- **Realistic fare calculations** based on routes and buses
- **Balanced time distribution** throughout the day

## 🔄 Integration Points

### StreamlinedBusManagement
- Access via "Bulk Trip Scheduler" button
- Refreshes bus data after trip generation
- Shows updated bus assignments

### StreamlinedRouteManagement
- Access via "Bulk Trip Scheduler" button
- Refreshes route data after trip generation
- Shows updated route utilization

### Trip Management
- All generated trips appear in trip management
- Filterable by depot, date, status
- Full CRUD operations available

## 📞 Support

For issues or questions:
1. Check the test suite output
2. Review system readiness status
3. Verify all prerequisites are met
4. Check browser console for errors
5. Review backend logs for API issues

---

**🎯 Goal Achieved**: Create a comprehensive system that generates 6000 trips (20 per depot per day) with proper scheduling, crew assignment, and fare calculation, fully integrated with the existing StreamlinedBusManagement and StreamlinedRouteManagement components.

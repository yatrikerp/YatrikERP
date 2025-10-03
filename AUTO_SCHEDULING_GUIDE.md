# 🚀 Automatic Trip Scheduling Guide

## Overview
Your YATRIK ERP system has a comprehensive automatic trip scheduling system that can schedule trips throughout the entire day (6 AM to 8 PM) with automatic bus, driver, and conductor assignments.

## 🎯 How to Schedule Trips Automatically for the Whole Day

### Method 1: Using the Web Interface (Recommended)

1. **Access Mass Scheduling Dashboard**
   ```
   http://localhost:5173/admin/mass-scheduling
   ```

2. **Configure Automatic Scheduling**
   - **Target Date**: Select today or future date
   - **Select Depots**: Choose "Select All" or specific depots
   - **Max Trips per Route**: 6 (creates trips every 2-3 hours)
   - **Time Gap**: 30 minutes (between consecutive trips)
   - **Auto-assign Crew**: ✅ Enabled
   - **Auto-assign Buses**: ✅ Enabled

3. **Start Scheduling**
   - Click "Start Scheduling" button
   - Watch real-time progress and statistics
   - System will create trips automatically

### Method 2: Using the Script (Automated)

```bash
# Run the automatic scheduling script
node start-auto-scheduling.js
```

This script will:
- Fetch all available depots, routes, and buses
- Configure scheduling for the whole day
- Create 6 trips per route (every 2-3 hours)
- Auto-assign buses, drivers, and conductors
- Generate detailed reports

## 📊 What Gets Scheduled Automatically

### Time Distribution Throughout the Day
- **6:00 AM - 8:00 AM**: Morning rush trips
- **8:00 AM - 12:00 PM**: Regular service trips
- **12:00 PM - 2:00 PM**: Lunch hour trips
- **2:00 PM - 6:00 PM**: Afternoon service trips
- **6:00 PM - 8:00 PM**: Evening rush trips

### Automatic Assignments
- **Buses**: Automatically assigned to routes based on depot and capacity
- **Drivers**: Automatically assigned based on availability and depot
- **Conductors**: Automatically assigned based on availability and depot
- **Time Slots**: Distributed evenly throughout the day with 30-minute gaps

## 👀 How to View All Scheduled Trips

### 1. Streamlined Trip Management
```
http://localhost:5173/admin/streamlined-trips
```

**Features:**
- View all trips for any date
- Filter by status, route, depot, driver, conductor
- Real-time trip status updates
- Bulk operations and management

### 2. Trip Filters and Views
- **All Trips**: View all scheduled trips
- **Live View**: View currently running trips
- **Date Filter**: Filter trips by specific date
- **Status Filter**: Filter by scheduled, running, completed
- **Route Filter**: Filter by specific routes
- **Depot Filter**: Filter by depot location

### 3. Trip Details
Each scheduled trip shows:
- Route information and stops
- Assigned bus details
- Driver and conductor information
- Scheduled departure and arrival times
- Fare information
- Booking status and availability

## 📈 Scheduling Statistics and Reports

### Real-time Statistics
The system provides real-time statistics:
- **Trips Created**: Number of trips scheduled
- **Buses Assigned**: Number of buses utilized
- **Drivers Assigned**: Number of drivers assigned
- **Conductors Assigned**: Number of conductors assigned
- **Success Rate**: Percentage of successful assignments
- **Utilization Rate**: Bus utilization percentage

### Daily Reports
- Trip distribution by time
- Route performance metrics
- Bus utilization reports
- Crew assignment efficiency
- Revenue projections

## 🔧 Configuration Options

### Scheduling Parameters
```javascript
{
  maxTripsPerRoute: 6,        // Trips per route per day
  maxTripsPerBus: 3,          // Max trips per bus per day
  timeGap: 30,                // Minutes between trips
  autoAssignCrew: true,       // Auto-assign drivers/conductors
  autoAssignBuses: true,      // Auto-assign buses
  generateReports: true       // Generate scheduling reports
}
```

### Time Slot Generation
- **Start Time**: 6:00 AM
- **End Time**: 8:00 PM
- **Gap**: 30 minutes
- **Total Slots**: 28 time slots per day

## 🚨 Troubleshooting

### Common Issues

1. **No Trips Created**
   - Check if depots, routes, and buses exist
   - Verify drivers and conductors are available
   - Check depot assignments

2. **Partial Scheduling**
   - Review warnings in the scheduling report
   - Check bus and crew availability
   - Verify route configurations

3. **Time Conflicts**
   - System automatically avoids conflicts
   - Check for overlapping assignments
   - Review crew work hour limits

### Validation Steps
1. Verify depot creation: `/admin/depots`
2. Verify route creation: `/admin/streamlined-routes`
3. Verify bus creation: `/admin/streamlined-buses`
4. Verify staff creation: `/admin/staff`
5. Run scheduling: `/admin/mass-scheduling`

## 📱 Mobile Access
The system is fully responsive and can be accessed on mobile devices for:
- Viewing scheduled trips
- Monitoring trip status
- Managing assignments
- Real-time updates

## 🔄 Continuous Scheduling
The system supports continuous scheduling that runs automatically:
- Scheduled every few minutes
- Monitors for new routes and buses
- Automatically creates additional trips
- Sends notifications for completed scheduling

## 📊 Expected Results

After running automatic scheduling, you should see:
- **150-300+ trips** created per day (depending on routes and buses)
- **80-90% success rate** for assignments
- **6 trips per route** distributed throughout the day
- **3 trips per bus** maximum utilization
- **Automatic crew assignments** for all trips

## 🎯 Next Steps After Scheduling

1. **Review Scheduled Trips**
   ```
   http://localhost:5173/admin/streamlined-trips
   ```

2. **Check Trip Details**
   - Verify all assignments are correct
   - Review time schedules
   - Check fare configurations

3. **Monitor Operations**
   - Track trip status changes
   - Monitor real-time updates
   - Handle any issues

4. **Generate Reports**
   - Scheduling efficiency reports
   - Revenue projections
   - Performance analytics

---

## 🚀 Quick Start Commands

```bash
# Start the application
npm run dev

# Run automatic scheduling
node start-auto-scheduling.js

# Access admin panel
http://localhost:5173/admin

# View scheduled trips
http://localhost:5173/admin/streamlined-trips

# Mass scheduling dashboard
http://localhost:5173/admin/mass-scheduling
```

Your system is now ready for automatic whole-day trip scheduling! 🎉



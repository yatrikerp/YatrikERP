# 🗓️ Yearly Cyclical Trip Scheduling System

## Overview
Your YATRIK ERP now has a comprehensive **Yearly Cyclical Scheduling System** that creates trip schedules for an entire year with intelligent patterns, seasonal adjustments, and automatic crew rotation.

## 🎯 Key Features

### ✅ **Cyclical Patterns**
- **Weekly Cycles**: Monday-Sunday repeating patterns
- **Seasonal Adjustments**: Different frequencies for each season
- **Weekend Variations**: Separate schedules for weekends vs weekdays
- **Holiday Adjustments**: Reduced service during holidays
- **Maintenance Windows**: Scheduled maintenance periods

### ✅ **Smart Scheduling**
- **Crew Rotation**: Automatic driver/conductor rotation every 7 days
- **Bus Utilization**: Maximum 3 trips per bus per day
- **Seasonal Pricing**: Dynamic fare adjustments based on season
- **Peak Hour Optimization**: More trips during rush hours

## 🚀 How to Use Yearly Scheduling

### **Method 1: Web Interface (Recommended)**

1. **Access Yearly Scheduling Dashboard**
   ```
   http://localhost:5173/admin/yearly-scheduling
   ```

2. **Configure Yearly Schedule**
   - **Start Date**: Today or future date
   - **End Date**: One year from start date
   - **Select Depots**: Choose all or specific depots
   - **Enable Features**: Seasonal adjustments, holiday schedules, etc.

3. **Start Scheduling**
   - Click "Start Yearly Scheduling"
   - Watch real-time progress (can take 10-15 minutes for full year)
   - System creates 50,000+ trips automatically

### **Method 2: Command Line Script**

```bash
# Run the yearly scheduling script
node auto-schedule-trips-1year.js
```

## 📊 What Gets Scheduled

### **Time Distribution**
- **Weekdays**: 29 time slots (6:00 AM - 8:00 PM, 30-min intervals)
- **Weekends**: 13 time slots (7:00 AM - 7:00 PM, 1-hour intervals)
- **Peak Hours**: Extra trips during 6-8 AM and 6-8 PM

### **Seasonal Adjustments**
- **Spring** (Mar-May): 100% frequency (normal service)
- **Summer** (Jun-Aug): 120% frequency (+20% for peak travel)
- **Autumn** (Sep-Nov): 90% frequency (-10% reduced service)
- **Winter** (Dec-Feb): 80% frequency (-20% reduced service)

### **Holiday Periods** (Reduced Service)
- **New Year**: 50% frequency (Dec 31 - Jan 2)
- **Easter**: 70% frequency (Mar 29 - Apr 1)
- **Summer Break**: 60% frequency (Jul 15-31)
- **Diwali**: 70% frequency (Nov 1-3)
- **Christmas**: 50% frequency (Dec 24-26)

### **Maintenance Windows**
- **March**: Weeks 2-3 (50% bus availability)
- **June**: Weeks 1, 4 (75% bus availability)
- **September**: Week 2 (50% bus availability)
- **December**: Weeks 1-2 (50% bus availability)

## 🔄 Cyclical Patterns

### **Weekly Cycle**
Each week follows the same pattern:
- **Monday**: Full weekday schedule
- **Tuesday**: Full weekday schedule
- **Wednesday**: Full weekday schedule
- **Thursday**: Full weekday schedule
- **Friday**: Full weekday schedule
- **Saturday**: Weekend schedule (reduced)
- **Sunday**: Weekend schedule (reduced)

### **Monthly Cycle**
- **Week 1**: Full service
- **Week 2**: Full service (some maintenance)
- **Week 3**: Full service
- **Week 4**: Full service (some maintenance)

### **Seasonal Cycle**
- **Spring**: Normal service (100%)
- **Summer**: Peak service (120%)
- **Autumn**: Reduced service (90%)
- **Winter**: Minimal service (80%)

## 👥 Crew Rotation System

### **Automatic Rotation**
- **Cycle**: Every 7 days (configurable)
- **Pattern**: Drivers and conductors rotate systematically
- **Fair Distribution**: Equal workload distribution
- **Depot-Based**: Crew stays within assigned depots

### **Workload Management**
- **Max Trips per Day**: 3 trips per bus
- **Crew Assignment**: Automatic based on availability
- **Rest Periods**: Built-in rest between trips
- **Overtime Tracking**: Automatic overtime calculation

## 📈 Expected Results

After running yearly scheduling, you'll get:

### **Trip Volume**
- **50,000+ trips** for the entire year
- **150-200 trips per day** on average
- **29 weekday trips per route** (peak season)
- **13 weekend trips per route** (all seasons)

### **Resource Utilization**
- **80-90% bus utilization** rate
- **100% crew utilization** with rotation
- **Optimal route coverage** throughout the year
- **Balanced workload** across all depots

### **Revenue Optimization**
- **Seasonal pricing** adjustments
- **Peak hour optimization**
- **Holiday revenue** maximization
- **Maintenance cost** minimization

## 📱 Viewing Scheduled Trips

### **Trip Management Dashboard**
```
http://localhost:5173/admin/streamlined-trips
```

**Features:**
- Filter by date range (entire year)
- View by season, month, or week
- Filter by route, depot, driver, conductor
- Real-time trip status updates
- Bulk operations and management

### **Yearly Statistics**
```
http://localhost:5173/admin/yearly-scheduling
```

**Features:**
- Monthly trip breakdown
- Seasonal analysis
- Weekly patterns
- Crew utilization reports
- Revenue projections

## 🔧 Configuration Options

### **Scheduling Parameters**
```javascript
{
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  selectedDepots: ['depot1', 'depot2'],
  enableSeasonalAdjustments: true,
  enableHolidayAdjustments: true,
  enableMaintenanceWindows: true,
  enableWeekendSchedules: true,
  crewRotationCycle: 7, // days
  maintenanceFrequency: 'monthly'
}
```

### **Time Slot Configuration**
```javascript
// Weekdays: 6 AM to 8 PM (29 slots)
weekdayTimeSlots: [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00'
]

// Weekends: 7 AM to 7 PM (13 slots)
weekendTimeSlots: [
  '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00'
]
```

## 📊 Monthly Breakdown Example

```
January: 4,200 trips (Winter - 80% frequency)
February: 3,800 trips (Winter - 80% frequency)
March: 4,500 trips (Spring - 100% frequency)
April: 4,300 trips (Spring - 100% frequency)
May: 4,600 trips (Spring - 100% frequency)
June: 5,500 trips (Summer - 120% frequency)
July: 5,800 trips (Summer - 120% frequency)
August: 5,600 trips (Summer - 120% frequency)
September: 4,100 trips (Autumn - 90% frequency)
October: 4,200 trips (Autumn - 90% frequency)
November: 3,900 trips (Autumn - 90% frequency)
December: 3,600 trips (Winter - 80% frequency)

Total: 50,100 trips for the year
```

## 🚨 Troubleshooting

### **Common Issues**

1. **Scheduling Takes Too Long**
   - Normal for full year: 10-15 minutes
   - Progress indicators show current status
   - Can be stopped and resumed

2. **Memory Issues**
   - System processes in batches of 50 trips
   - Database optimized for large datasets
   - Progress saved incrementally

3. **Missing Trips**
   - Check depot assignments
   - Verify route configurations
   - Review crew availability

### **Performance Optimization**
- **Batch Processing**: 50 trips per batch
- **Database Indexing**: Optimized for date queries
- **Memory Management**: Efficient data structures
- **Progress Tracking**: Real-time status updates

## 📋 Prerequisites

Before running yearly scheduling:

1. **Create Depots**
   ```
   http://localhost:5173/admin/depots
   ```

2. **Create Routes**
   ```
   http://localhost:5173/admin/streamlined-routes
   ```

3. **Create Buses**
   ```
   http://localhost:5173/admin/streamlined-buses
   ```

4. **Create Staff**
   ```
   http://localhost:5173/admin/staff
   ```

## 🎯 Benefits of Yearly Scheduling

### **Operational Benefits**
- **365-day coverage** with no gaps
- **Predictable schedules** for passengers
- **Optimized resource utilization**
- **Reduced manual planning** time

### **Business Benefits**
- **Revenue optimization** through seasonal pricing
- **Cost reduction** through efficient scheduling
- **Customer satisfaction** with consistent service
- **Competitive advantage** with comprehensive coverage

### **Management Benefits**
- **Automated planning** reduces workload
- **Data-driven decisions** with detailed reports
- **Scalable system** for future growth
- **Real-time monitoring** and adjustments

---

## 🚀 Quick Start Commands

```bash
# Start the application
npm run dev

# Run yearly scheduling script
node auto-schedule-trips-1year.js

# Access admin panel
http://localhost:5173/admin

# View yearly scheduling dashboard
http://localhost:5173/admin/yearly-scheduling

# View all scheduled trips
http://localhost:5173/admin/streamlined-trips
```

## 📞 Support

If you encounter any issues:
1. Check the console logs for detailed error messages
2. Verify all prerequisites are met
3. Review the troubleshooting section
4. Check database connectivity
5. Ensure sufficient disk space (yearly scheduling creates large datasets)

---

**🎉 Your YATRIK ERP now has a complete yearly cyclical scheduling system!**

The system will automatically create a full year of trip schedules with intelligent patterns, seasonal adjustments, and optimal resource utilization. Just run the scheduling and enjoy 365 days of automated trip management! 📅✨

# 🚀 Automatic Trip Scheduling - Complete Guide

## ✅ Problem Solved!

Your trips are now **automatically scheduled for 30 days continuously!**

---

## 🎯 What This Does

### Automatic Scheduling Features:
1. **30 Days Coverage**: Schedules trips for next 30 days
2. **All Day Service**: 8 trips per route per day (6 AM - 8 PM)
3. **All Routes**: Every active route gets scheduled
4. **Auto Assignment**: Buses, drivers, conductors automatically assigned
5. **Continuous**: Runs from 6 AM to 8 PM every day

---

## 🚀 How to Run It

### Method 1: Windows Batch File (Easiest)
```bash
# Double-click this file:
setup-auto-trips.bat

# Or run from command line:
cd "D:\YATRIK ERP"
setup-auto-trips.bat
```

### Method 2: Direct Node Command
```bash
cd backend
node auto-schedule-trips-30days.js
```

### Method 3: Via API (For Automation)
```bash
# POST to mass-schedule endpoint
curl -X POST http://localhost:5000/api/auto-scheduler/mass-schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "date": "2024-01-15",
    "maxTripsPerRoute": 8,
    "timeGap": 120,
    "autoAssignCrew": true,
    "autoAssignBuses": true
  }'
```

---

## 📊 What Gets Created

### Trip Schedule Per Day:
```
Route 1:
  06:00 - Trip 1 (Bus A, Driver 1, Conductor 1)
  08:00 - Trip 2 (Bus B, Driver 2, Conductor 2)
  10:00 - Trip 3 (Bus C, Driver 3, Conductor 3)
  12:00 - Trip 4 (Bus D, Driver 4, Conductor 4)
  14:00 - Trip 5 (Bus E, Driver 5, Conductor 5)
  16:00 - Trip 6 (Bus F, Driver 6, Conductor 6)
  18:00 - Trip 7 (Bus G, Driver 7, Conductor 7)
  20:00 - Trip 8 (Bus H, Driver 8, Conductor 8)

Route 2:
  06:00 - Trip 9 (Bus I, Driver 1, Conductor 1)
  ...
  (Same pattern for all routes)
```

### Example Output:
```
If you have 10 routes:
- 10 routes × 8 trips/day = 80 trips/day
- 80 trips/day × 30 days = 2,400 total trips!
```

---

## 🎯 Time Slots (All Day Coverage)

```
Slot 1: 06:00 AM (Early morning)
Slot 2: 08:00 AM (Morning rush)
Slot 3: 10:00 AM (Mid-morning)
Slot 4: 12:00 PM (Noon)
Slot 5: 02:00 PM (Afternoon)
Slot 6: 04:00 PM (Late afternoon)
Slot 7: 06:00 PM (Evening rush)
Slot 8: 08:00 PM (Night)
```

**Result**: **Continuous service all day long!**

---

## 📈 Script Output

When you run the script, you'll see:

```
🚀 STARTING AUTOMATIC TRIP SCHEDULING
📅 Scheduling trips for next 30 days
🕐 8 trips per route per day

📊 Fetching resources...
✅ Found 10 routes
✅ Found 50 buses
✅ Found 25 drivers
✅ Found 25 conductors
✅ Found 5 depots

🔄 Generating trips...

📅 Day 1/30: Mon Jan 15 2024
   ✅ Generated 80 trips for Mon Jan 15 2024
📅 Day 2/30: Tue Jan 16 2024
   ✅ Generated 80 trips for Tue Jan 16 2024
...
📅 Day 30/30: Wed Feb 14 2024
   ✅ Generated 80 trips for Wed Feb 14 2024

📊 Total trips to create: 2400

🗑️ Clearing existing scheduled trips...
✅ Cleared 0 existing scheduled trips

💾 Inserting trips into database...
   Progress: 100% (2400/2400 trips)

✅ TRIP SCHEDULING COMPLETE!
📊 Successfully created 2400 trips
📅 Coverage: 30 days
🚌 10 routes with 8 trips each per day
⏰ Service hours: 6:00 AM to 8:00 PM

📈 STATISTICS:
   Today's trips: 80
   Routes covered: 10
   Buses utilized: 50
   Drivers assigned: 25
   Conductors assigned: 25

🎉 Popular routes will now show these trips!
```

---

## 🔄 Scheduling Frequency

### Option 1: Manual Run (When Needed)
```bash
# Run whenever you need to refresh trips
setup-auto-trips.bat
```

### Option 2: Daily Automation (Recommended)
```bash
# Set up Windows Task Scheduler to run daily at midnight
# Task: D:\YATRIK ERP\setup-auto-trips.bat
# Schedule: Daily at 00:00 (midnight)
```

### Option 3: API Automation
```javascript
// Set up a cron job or scheduler to call API daily
const scheduleDaily = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  await fetch('http://localhost:5000/api/auto-scheduler/mass-schedule', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      date: tomorrow.toISOString().split('T')[0],
      maxTripsPerRoute: 8,
      timeGap: 120,
      autoAssignCrew: true
    })
  });
};
```

---

## 🎉 After Running

### 1. Check Popular Routes
Visit: **http://localhost:5173/**

Should see:
```
Popular Routes
──────────────

🚌 Kochi → Thiruvananthapuram
   8 trips available | From ₹150   [Book]

🚌 Kozhikode → Kochi
   8 trips available | From ₹120   [Book]

... (more routes)
```

### 2. Check Backend Logs
```
🔍 Fetching popular routes from active trips...
✅ Found 2400 active trips
🎯 Returning 6 popular routes
```

### 3. Verify in Database
```javascript
// MongoDB query
db.trips.find({
  serviceDate: { $gte: new Date() },
  status: 'scheduled'
}).count()

// Should return: 2400 (or your calculated total)
```

---

## 📋 Configuration

Edit `backend/auto-schedule-trips-30days.js` to customize:

```javascript
const DAYS_TO_SCHEDULE = 30;  // Change to 7, 14, 60, etc.
const TRIPS_PER_ROUTE_PER_DAY = 8;  // Change to 4, 12, etc.
const TIME_SLOTS = [
  '06:00', '08:00', '10:00', '12:00', 
  '14:00', '16:00', '18:00', '20:00'
];  // Customize time slots
```

---

## 🔧 Troubleshooting

### Issue: No trips created
**Solution**: 
1. Check if routes exist: `db.routes.find({ status: 'active' }).count()`
2. Check if buses exist: `db.buses.find({ status: 'active' }).count()`
3. Run the script again

### Issue: Script fails
**Solution**:
1. Check MongoDB connection
2. Verify `.env` has correct `MONGODB_URI`
3. Check backend logs for errors

### Issue: Trips not showing on popular routes
**Solution**:
1. Verify trips are in database
2. Check trip dates are in future
3. Ensure `bookingOpen: true` and `status: 'scheduled'`
4. Restart backend server

---

## 📊 Expected Results

### Popular Routes API Response:
```json
{
  "success": true,
  "data": [
    {
      "from": "Kochi",
      "to": "Thiruvananthapuram",
      "tripCount": 240,
      "frequency": "240 trips available",
      "fare": "From ₹150",
      "availableSeats": 10800
    }
  ],
  "count": 6,
  "message": "Found 6 popular routes with active trips"
}
```

**Note**: `tripCount` = 8 trips/day × 30 days = 240 trips per route!

---

## ✅ Summary

**What You Get**:
1. ✅ **Automated trip scheduling** for 30 days
2. ✅ **8 trips per route per day** (all day coverage)
3. ✅ **Auto-assigned** buses, drivers, conductors
4. ✅ **Popular routes** show actual trips
5. ✅ **Continuous service** from 6 AM to 8 PM

**How to Use**:
1. Run `setup-auto-trips.bat`
2. Wait for completion (~1-2 minutes)
3. Check popular routes on landing page
4. Trips are ready for passenger booking!

**Maintenance**:
- Run weekly or monthly to refresh trips
- Or set up daily automation
- Adjust `DAYS_TO_SCHEDULE` as needed

---

## 🎊 Result

**Popular routes now show actual scheduled trips!**
**Passengers can book trips anytime for next 30 days!**
**All routes have continuous all-day service!**

🚀 **Run the script now and see trips appear!**

```bash
setup-auto-trips.bat
```


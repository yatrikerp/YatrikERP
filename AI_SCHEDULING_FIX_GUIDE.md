# AI Autonomous Scheduling - Error Fix Guide

## Issues Identified

1. **500 Error on `/api/admin/ai/autonomous/schedule`** - "Failed to generate schedule"
2. **404 Error on `/api/routes/popular`** - Route not found
3. **401 Error on `/api/passenger/tickets`** - Unauthorized access

## Root Causes

### Issue 1: Autonomous Scheduling 500 Error
- Insufficient data in database (no routes, buses, drivers, or conductors)
- Missing error details in response

### Issue 2: Popular Routes 404 Error  
- Backend server not running on port 5000
- Or frontend proxy not working correctly

### Issue 3: Passenger Tickets 401 Error
- User not authenticated properly
- Token missing or expired

## Solutions

### Step 1: Check Database Data

Run this command to check if you have sufficient data:

```bash
cd backend
node check-ai-scheduling-data.js
```

This will show you:
- How many routes, buses, drivers, conductors, and depots you have
- Whether you meet minimum requirements
- Sample data from each collection

### Step 2: Create Sample Data (If Needed)

If you don't have enough data, run one of these scripts:

```bash
# Option 1: Complete setup (recommended)
node backend/setup-all-depots.js

# Option 2: Quick sample data
node backend/create-sample-data.js

# Option 3: Check and create if missing
node backend/check-and-create-sample-data.js
```

### Step 3: Verify Backend Server is Running

Make sure your backend is running on port 5000:

```bash
cd backend
node server.js
```

You should see:
```
🚀 Server running on port 5000
✅ MongoDB Connected
```

### Step 4: Verify Frontend Proxy

The frontend should be running on port 3000 and proxying API calls to port 5000.

Check `frontend/package.json` has:
```json
"proxy": "http://localhost:5000"
```

### Step 5: Test the AI Scheduling Endpoint

Once backend is running with data, test the endpoint:

```bash
# Get your admin token first
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yatrik.com","password":"your_password"}'

# Then test autonomous scheduling
curl -X POST http://localhost:5000/api/admin/ai/autonomous/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"scheduleType":"daily","days":7}'
```

### Step 6: Test Popular Routes Endpoint

```bash
curl http://localhost:5000/api/routes/popular?limit=6
```

This should return popular routes or fallback data.

## Quick Fix Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend running on port 3000
- [ ] MongoDB connected and running
- [ ] At least 1 active route in database
- [ ] At least 1 active bus in database
- [ ] At least 1 active driver in database
- [ ] At least 1 active conductor in database
- [ ] At least 1 active depot in database
- [ ] Admin user logged in with valid token

## Testing the AI Scheduling Feature

### Method 1: Through Admin Panel (Recommended)

1. Start backend: `cd backend && node server.js`
2. Start frontend: `cd frontend && npm start`
3. Login as admin at `http://localhost:3000/admin/login`
4. Navigate to `http://localhost:3000/admin/autonomous-scheduling`
5. Click "Run Full AI Fleet Scheduling" button
6. View results

### Method 2: Through API (For Testing)

```bash
# Run the test script
cd backend
node test-ai-scheduling.js
```

This will test:
- Demand prediction
- Crew fatigue calculation
- Batch fatigue processing
- Eligible crew identification
- Genetic algorithm optimization

## Expected Results

When working correctly, you should see:

### Autonomous Scheduling Page
- Summary cards showing schedules, buses, drivers, conductors
- Optimization score (85-95% is good)
- Revenue projections
- Schedule table with trip details
- Conflict alerts (if any)
- Resource utilization charts

### Console Output
```
🧠 Starting Multi-Resource Constraint Optimization Engine...
📊 STEP 1: Data Aggregation...
✓ Aggregated: 10 routes, 25 buses, 30 drivers, 30 conductors, 5 depots
🧠 STEP 2: Demand Prediction (AI Model)...
📅 STEP 3: Trip Frequency Calculation...
🚌 STEP 4: Bus Allocation (Depot-Aware)...
👨‍✈️ STEP 5: Driver Assignment with Fatigue Check...
👔 STEP 6: Conductor Assignment with Fatigue Check...
✅ Multi-Resource Optimization Complete!
📊 Generated 150 schedules with 92% optimization
💰 Projected Revenue: ₹45,000
⚡ Execution Time: 2.34s
```

## Common Errors and Solutions

### Error: "No active routes found"
**Solution**: Create routes through admin panel or run `node backend/create-routes-only.js`

### Error: "Insufficient resources"
**Solution**: Create buses, drivers, conductors through admin panel or run setup scripts

### Error: "Failed to connect to MongoDB"
**Solution**: 
- Start MongoDB service
- Check MONGODB_URI in backend/.env
- Verify MongoDB is running on port 27017

### Error: "Cannot read property '_id' of null"
**Solution**: 
- Ensure all resources have proper depot assignments
- Run `node backend/check-current-data.js` to verify data integrity

### Error: "CORS policy blocked"
**Solution**:
- Ensure backend has CORS enabled
- Check frontend proxy configuration
- Restart both frontend and backend servers

## Improved Error Handling

The autonomous scheduling endpoint now returns detailed error information:

```json
{
  "success": false,
  "message": "Failed to generate schedule",
  "error": "Detailed error message",
  "data": {
    "schedulesGenerated": 0,
    "conflicts": [
      {
        "type": "system_error",
        "message": "Error details",
        "severity": "high"
      }
    ],
    "summary": { ... },
    "utilization": { ... },
    "metadata": { ... }
  }
}
```

## Next Steps

1. Run `node backend/check-ai-scheduling-data.js` to verify data
2. If data is insufficient, run setup scripts
3. Restart backend server
4. Test through admin panel
5. Check browser console for any remaining errors

## Support

If issues persist:
1. Check backend console logs for detailed error messages
2. Check browser console for frontend errors
3. Verify all environment variables in backend/.env
4. Ensure all npm packages are installed (`npm install` in both frontend and backend)

---

**Last Updated**: March 5, 2026
**Status**: ✅ Fixes Applied

# Test Autonomous Scheduling System

## Quick Test Guide

### Prerequisites
1. Backend server running on `http://localhost:5000`
2. Frontend running on `http://localhost:3000`
3. MongoDB connected with sample data
4. Admin user logged in

### Test Steps

## 1. Access the Page

Open your browser and navigate to:
```
http://localhost:3000/admin/autonomous-scheduling
```

You should see:
- Purple gradient header with "Multi-Resource Optimization Engine"
- "Run Full AI Fleet Scheduling" button
- Feature badges (Demand Prediction, Fatigue Monitoring, Conflict-Free, Revenue Optimization)

## 2. Run the Optimization

1. Click the "Run Full AI Fleet Scheduling" button
2. Watch for the loading state with "AI Processing in Progress..."
3. Wait 2-5 seconds for completion

## 3. Verify Results

After completion, you should see:

### Summary Cards (6 cards)
- **Schedules**: Number of trips created
- **Buses**: Number assigned with utilization %
- **Drivers**: Number assigned with utilization %
- **Conductors**: Number assigned with utilization %
- **Optimization**: Score percentage (target: 85-95%)
- **Conflicts**: Number of issues (target: <10)

### Revenue & Metrics (3 cards)
- **Projected Revenue**: Total expected revenue in ₹
- **Avg Crew Fatigue**: Score out of 100 (target: <50)
- **Route Coverage**: Routes covered / total routes

### Schedule Table
- Detailed trip-by-trip breakdown
- Shows: Trip ID, Route, Bus, Driver, Conductor, Depot, Time, Load, Revenue, Fatigue
- Color-coded fatigue levels (green/yellow/orange/red)

### Resource Utilization
- Progress bars for Buses, Drivers, Conductors, Routes
- Target: 70-90% utilization

### AI Metadata
- Algorithm: MRCO
- Model Version: 2.0.0-MRCO
- Execution Time: ~2-5 seconds
- AI Confidence: Should match optimization score

## 4. Check for Conflicts

If conflicts are present:
- Orange alert box will appear
- Lists conflicts by severity (high/medium/low)
- Each conflict shows: type, message, route, time

Common conflicts:
- **Bus Shortage**: Not enough buses available
- **Driver Shortage**: Not enough drivers available
- **Conductor Shortage**: Not enough conductors available
- **Depot Mismatch**: Resources from different depots

## 5. Export Schedule

1. Click the "Export" button
2. JSON file downloads with complete schedule data
3. Verify file contains: schedule array, conflicts, summary, utilization, metadata

## 6. Approve & Publish

1. Review the optimization score
2. Check conflict count
3. Click "Approve & Publish" button
4. Confirmation alert appears

## Expected Results

### Good Schedule (85-95% optimization)
- ✅ 100-500 trips generated
- ✅ 70-90% resource utilization
- ✅ <10 conflicts
- ✅ Average fatigue <50
- ✅ High route coverage (>80%)

### Issues to Watch For

#### Low Optimization Score (<70%)
**Possible Causes**:
- Insufficient resources in database
- High crew fatigue levels
- Many depot mismatches

**Solutions**:
- Run data creation scripts to add more resources
- Check crew rest periods
- Verify depot assignments

#### High Conflict Count (>20)
**Possible Causes**:
- Resource shortages
- Overlapping time slots
- Depot capacity issues

**Solutions**:
- Add more buses/drivers/conductors
- Review trip timing
- Balance depot assignments

#### No Results / Error
**Possible Causes**:
- Backend not running
- Database connection issue
- Authentication problem
- No sample data

**Solutions**:
- Check backend console for errors
- Verify MongoDB connection
- Ensure admin token is valid
- Run sample data creation scripts

## Backend Console Output

When you run the optimization, check the backend console for:

```
🧠 Starting Multi-Resource Constraint Optimization Engine...
📊 STEP 1: Data Aggregation...
✓ Aggregated: X routes, Y buses, Z drivers, W conductors, V depots
🧠 STEP 2: Demand Prediction (AI Model)...
📅 STEP 3: Trip Frequency Calculation...
🚌 STEP 4: Bus Allocation (Depot-Aware)...
⚠️  STEP 9: Conflict Detection...
📊 STEP 10: Optimization Scoring...
✅ Multi-Resource Optimization Complete!
📊 Generated X schedules with Y% optimization
💰 Projected Revenue: ₹Z
⚡ Execution Time: W.XXs
```

## API Testing (Alternative)

If the frontend doesn't work, test the API directly:

### Using curl (Windows PowerShell)
```powershell
# Get your admin token first (login via frontend)
$token = "YOUR_ADMIN_TOKEN"

# Test the autonomous scheduling endpoint
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

$body = @{
    scheduleType = "daily"
    days = 7
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/admin/ai/autonomous/schedule" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

### Expected API Response
```json
{
  "success": true,
  "message": "Multi-resource constraint optimization completed",
  "data": {
    "schedulesGenerated": 150,
    "conflictsRemaining": 5,
    "optimizationScore": 92,
    "busesAssigned": 45,
    "driversAssigned": 48,
    "conductorsAssigned": 48,
    "schedule": [...],
    "conflicts": [...],
    "summary": {...},
    "utilization": {...},
    "metadata": {...}
  }
}
```

## Troubleshooting

### Frontend Issues

#### Button doesn't work
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify API endpoint in network tab
4. Check authentication token

#### No data displayed
1. Check API response in network tab
2. Verify response structure matches expected format
3. Check browser console for errors

### Backend Issues

#### 401 Unauthorized
- Login again to get fresh token
- Check token expiration
- Verify admin role

#### 500 Internal Server Error
- Check backend console for error details
- Verify MongoDB connection
- Check if required models exist
- Ensure sample data is present

#### Timeout / No Response
- Check if backend server is running
- Verify port 5000 is not blocked
- Check MongoDB connection
- Review server logs

## Sample Data Requirements

For the system to work properly, you need:

### Minimum Data
- ✅ 5+ active routes
- ✅ 10+ active buses
- ✅ 10+ active drivers
- ✅ 10+ active conductors
- ✅ 2+ active depots
- ✅ Some historical bookings (for demand prediction)

### Create Sample Data
Run these scripts if you don't have data:

```bash
cd backend

# Create depots
node create-kerala-depots-complete.js

# Create buses
node create-kerala-buses-comprehensive.js

# Create routes
node create-routes-individual.js

# Create drivers and conductors
node create-drivers-conductors.js

# Create sample bookings
node create-more-bookings.js
```

## Success Criteria

✅ Page loads without errors
✅ Button triggers optimization
✅ Results display within 5 seconds
✅ Optimization score > 80%
✅ Conflicts < 10
✅ Schedule table shows trips
✅ Export works
✅ No console errors

## Next Steps After Testing

1. **Review Results**: Analyze optimization score and conflicts
2. **Adjust Parameters**: Tune GA parameters if needed
3. **Add More Data**: Create more routes/buses/crew for better results
4. **Monitor Performance**: Track execution time and scores
5. **Integrate**: Connect to production scheduling system

## Support

If you encounter issues:
1. Check this guide first
2. Review backend console logs
3. Check browser console for errors
4. Verify sample data exists
5. Test API endpoints directly

---

**Test Status**: Ready for Testing
**Last Updated**: March 3, 2026
**System Version**: 2.0.0-MRCO

# 🚀 **Complete Guide: How to Schedule Bulk Trips**

## ✅ **Prerequisites Check**

### **1. Verify Backend is Running**
- Backend should be running on `http://localhost:5000`
- Check: Open `http://localhost:5000/api/health` in browser
- Should show: `{"status":"OK","timestamp":"..."}`

### **2. Verify Frontend is Running**
- Frontend should be running on `http://localhost:5173`
- Check: Open `http://localhost:5173` in browser
- Should show the YATRIK ERP login page

### **3. Verify Database is Populated**
- ✅ **92 depots** created
- ✅ **1,840 drivers** created
- ✅ **1,840 conductors** created
- ✅ **Routes and buses** should exist

## 🎯 **Step-by-Step Process**

### **Step 1: Login to Admin Dashboard**
1. Go to `http://localhost:5173`
2. Login with admin credentials:
   - **Email**: `admin@yatrik.com`
   - **Password**: `admin123` (or your admin password)

### **Step 2: Navigate to Trip Management**
1. In the admin sidebar, click **"Trip Management"**
2. You should see the Trip Management page

### **Step 3: Open Bulk Trip Scheduler**
1. Look for **"Bulk Scheduler"** button in the Quick Actions section
2. Click the **"Bulk Scheduler"** button
3. The Bulk Trip Scheduler modal should open

### **Step 4: Configure Settings**
In the modal, set these values:
- **Days to Schedule**: `30` (or your preferred number)
- **Trips per Depot per Day**: `20` (recommended)
- **Start Date**: Select today's date or future date
- **Options**: Keep all checkboxes checked:
  - ✅ Auto-assign Crew
  - ✅ Auto-assign Buses  
  - ✅ Generate Reports

### **Step 5: Refresh Status**
1. Click **"Refresh Status"** button
2. Wait 2-3 seconds
3. You should see:
   - **Total Depots**: 92 (or actual number)
   - **Total Target Trips**: 55,200 (92 × 30 × 20)
   - **Generate Trips button** should be colorful and enabled

### **Step 6: Generate Trips**
1. Click the **colorful "🚀 Generate Trips"** button
2. Wait for completion (2-5 minutes)
3. You should see success message: `"Successfully generated X trips!"`

## 🔧 **Troubleshooting**

### **Problem 1: "Total Depots: 0"**
**Solution:**
1. Click "Refresh Status" button
2. Wait 2-3 seconds
3. If still 0, check backend logs for errors

### **Problem 2: "Generate Trips" button is disabled**
**Causes:**
- No depots found
- No drivers/conductors available
- Backend not responding

**Solution:**
1. Click "Refresh Status"
2. Check browser console for errors
3. Verify backend is running on port 5000

### **Problem 3: "Failed to generate trips"**
**Causes:**
- No available routes
- No available buses
- Database connection issues

**Solution:**
1. Check backend logs in terminal
2. Verify routes and buses exist
3. Restart backend server

### **Problem 4: Modal not opening**
**Solution:**
1. Refresh the page
2. Check browser console for JavaScript errors
3. Verify frontend is running on port 5173

## 📊 **Expected Results**

### **After Successful Generation:**
- ✅ **55,200+ trips** created
- ✅ **All depots** have scheduled trips
- ✅ **Drivers and conductors** assigned to trips
- ✅ **Buses assigned** to trips
- ✅ **Trips visible** on streamlined-trips page

### **Trip Distribution:**
- **92 depots** × **20 trips/day** × **30 days** = **55,200 trips**
- **Time spread**: 6 AM to 10 PM daily
- **Route variety**: Different routes per depot
- **Crew rotation**: Drivers and conductors rotated

## 🚨 **Common Issues & Solutions**

### **Issue 1: Backend Crashes**
```
Error: Route.get() requires a callback function
```
**Solution:** Backend middleware import issue - restart backend

### **Issue 2: Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Kill all Node.js processes and restart

### **Issue 3: No Crew Available**
```
"No available crew" in backend logs
```
**Solution:** Run the driver/conductor creation script

### **Issue 4: Authentication Errors**
```
Failed to load resource: 404 (Not Found)
```
**Solution:** Login to admin dashboard first

## 🎯 **Quick Test**

### **Test the API Directly:**
1. Open browser developer tools (F12)
2. Go to Console tab
3. Run this command:
```javascript
fetch('/api/bulk-scheduler/status', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
}).then(r => r.json()).then(console.log)
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "current": {
      "totalTrips": 0,
      "totalDepots": 92,
      "totalRoutes": X,
      "totalBuses": X
    }
  }
}
```

## 🚀 **Final Checklist**

Before generating trips, verify:
- ✅ **Backend running** on port 5000
- ✅ **Frontend running** on port 5173
- ✅ **Logged in** as admin
- ✅ **92 depots** exist
- ✅ **1,840 drivers** exist
- ✅ **1,840 conductors** exist
- ✅ **Routes and buses** exist
- ✅ **"Refresh Status"** shows correct numbers
- ✅ **"Generate Trips" button** is enabled and colorful

---

**If you follow these steps exactly, you should successfully generate 55,200+ trips!** 🎉

# 🧪 Test Popular Routes Feature

## Quick Test Steps

### ✅ Step 1: Test Landing Page
1. Open your browser and go to: **http://localhost:5173/**
2. Look for the "Popular Routes" section (below the search card)
3. You should see route cards displaying routes like:
   - `Kochi → Thiruvananthapuram`
   - `Kozhikode → Kochi`
   - etc.
4. Click the **"Book"** button on any route
5. Expected result: 
   - If logged in → Redirects to `/passenger/results?from=...&to=...&date=...`
   - If not logged in → Redirects to login page

### ✅ Step 2: Test Passenger Dashboard
1. Login as a passenger
2. Go to: **http://localhost:5173/passenger/dashboard**
3. Scroll to the "Popular Routes" section
4. Click on any route card
5. Expected result: Navigates to results page with search pre-filled

### ✅ Step 3: Test API Directly
Open a new terminal and run:
```bash
curl http://localhost:5000/api/routes/popular?limit=6
```

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "routeId": "...",
      "from": "Kochi",
      "to": "Thiruvananthapuram",
      "tripCount": 15,
      "frequency": "15 trips available",
      "fare": "From ₹150",
      ...
    }
  ],
  "count": 6
}
```

## 🔍 What to Check

### On Landing Page:
- ✅ Routes appear within 2-3 seconds
- ✅ Each route shows: City names, frequency, fare
- ✅ "Book" button is clickable
- ✅ Routes auto-refresh every 60 seconds

### On Passenger Dashboard:
- ✅ Popular routes section is visible
- ✅ Routes are displayed in cards
- ✅ Clicking navigates to results page
- ✅ Search params are pre-filled

### API Response:
- ✅ Returns array of routes
- ✅ Each route has: from, to, frequency, fare
- ✅ If no trips scheduled, returns fallback Kerala routes

## 🚨 Troubleshooting

### No routes showing on landing page?
1. Check browser console (F12) for errors
2. Check network tab - look for `/api/routes/popular` call
3. Verify backend is running on port 5000

### API returns empty array?
1. Check if trips are scheduled:
   ```bash
   # In MongoDB
   db.trips.find({ 
     serviceDate: { $gte: new Date() },
     bookingOpen: true 
   }).count()
   ```
2. If no trips, the API should return fallback Kerala routes

### Routes not clickable?
1. Check browser console for JavaScript errors
2. Verify `/passenger/results` route exists in App.js
3. Check if PopularRoutes component is properly imported

## ✅ Success Checklist

- [ ] Landing page shows popular routes
- [ ] Routes display correct city names
- [ ] "Book" button works and navigates correctly
- [ ] Passenger dashboard shows popular routes
- [ ] Clicking routes pre-fills search
- [ ] API returns valid route data
- [ ] Routes auto-refresh on landing page

## 🎉 Expected Outcome

When everything is working:
1. Popular routes appear on **http://localhost:5173/** (landing page)
2. Routes are clickable and lead to booking flow
3. Passengers can easily discover and book popular routes
4. System shows routes with upcoming trips (next 30 days)
5. Smart fallback ensures routes always display

---

**Frontend URL**: http://localhost:5173/  
**Backend URL**: http://localhost:5000/  
**API Endpoint**: http://localhost:5000/api/routes/popular?limit=6


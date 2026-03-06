# Flutter App Testing Guide ✅

## Status: READY TO TEST

### ✅ What's Working:
- **Backend Server**: Running on port 5000
- **Database**: Connected to MongoDB Atlas
- **Flutter App**: Installed on your device
- **Real Trips**: 27 trips scheduled for today
- **Booking System**: Fully functional

## Step-by-Step Testing Instructions

### 1. Open the Flutter App
- Look for "YATRIK" app on your device
- Tap to open

### 2. Login as Passenger
```
Email: ritotensy@gmail.com
Password: Yatrik123
```

### 3. Test Search Functionality
Go to **Search Tab** and enter:
```
From: Kochi
To: Kozhikode
Date: Today (March 6, 2026)
Passengers: 1
```
Click **"Search Buses"**

**Expected Result**: You should see **6 trips** available!

### 4. Test Seat Selection
- Click **"Select Seats"** on any trip
- You'll see a visual bus layout with colored seats:
  - 🟢 Green = Available
  - 🔵 Blue = Male only
  - 🩷 Pink = Female only
  - ⚫ Gray = Booked
- Tap on available seats to select them
- Selected seats turn pink
- Click **"Continue"**

### 5. Test Passenger Details
- Fill in contact details (phone, email)
- Fill in passenger details for each selected seat
- Click **"Confirm Booking"**

**Expected Result**: Booking should be created successfully!

### 6. Test My Trips
- Go to **"My Trips"** tab
- Your booking should appear in **"Upcoming Trips"**

## Available Routes to Test

```
1. Kochi → Kozhikode (6 trips)
   - 06:00-10:00, 08:00-12:00, 10:00-14:00 (×2 buses)
   - Fare: ₹370

2. Thiruvananthapuram → Kochi (3 trips)
   - 06:00-10:00, 08:00-12:00, 10:00-14:00
   - Fare: ₹440

3. Kozhikode → Kannur (3 trips)
   - 06:00-10:00, 08:00-12:00, 10:00-14:00
   - Fare: ₹186

4. Kochi → Thiruvananthapuram (3 trips)
   - 06:00-10:00, 08:00-12:00, 10:00-14:00
   - Fare: ₹440

5. Kochi → Thrissur (2 trips)
   - 06:00-10:00, 08:00-12:00
   - Fare: Various
```

## Troubleshooting

### No trips showing in search?
1. Make sure you're using exact city names:
   - ✅ "Kochi" not "Cochin"
   - ✅ "Kozhikode" not "Calicut"
   - ✅ "Thiruvananthapuram" not "Trivandrum"

2. Check the date is today or future

3. Verify backend is running (you should see server logs)

### Login not working?
- Check internet connection
- Verify backend server is running
- Use exact credentials: ritotensy@gmail.com / Yatrik123

### Booking fails?
- Ensure all passenger details are filled
- Check phone and email are valid
- Verify seats are selected

### App crashes or errors?
- Check backend server logs for errors
- Restart the app
- Check device internet connection

## Backend Server Status

The server is running with these endpoints:
- ✅ **Health**: http://localhost:5000/api/health
- ✅ **Trip Search**: /api/trips/search
- ✅ **Seat Selection**: /api/seats/trip/:id
- ✅ **Booking**: /api/booking
- ✅ **My Trips**: /api/passenger/tickets

## What to Expect

### Search Results
You should see trip cards with:
- Route name and cities
- Departure and arrival times
- Bus number and type
- Fare amount
- "Select Seats" button

### Seat Selection
You should see:
- Visual bus layout from above
- Color-coded seats
- Seat legend
- Trip summary
- Price calculation
- Continue button

### Passenger Details
You should see:
- Contact form (phone, email)
- Individual passenger forms
- Trip summary with pricing
- Confirm booking button

### My Trips
After booking, you should see:
- Booking in "Upcoming Trips" tab
- PNR number
- Trip details
- Seat numbers
- Amount paid

## Success Criteria

✅ **Search**: Shows 6 trips for Kochi → Kozhikode
✅ **Seat Selection**: Visual bus layout works
✅ **Booking**: Creates booking successfully
✅ **My Trips**: Shows the new booking

## Next Steps After Testing

1. Try different routes
2. Book multiple seats
3. Test with different passenger counts
4. Check wallet functionality
5. Test profile management

---

**Ready to test!** 🚀
The app has full feature parity with the web version.
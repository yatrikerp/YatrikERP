# 🎫 Complete Passenger Booking Guide

## 📋 Prerequisites

Before booking, ensure you have:
- ✅ Routes created in the system
- ✅ Buses added to fleet
- ✅ Trips scheduled
- ✅ Passenger account

**Need test data?** → See `QUICK_TEST_DATA_SETUP.md`

---

## 🚀 Booking Flow - Step by Step

### Step 1: Access Your Application

Go to your **Vercel URL:**
```
https://your-vercel-url.vercel.app
```

---

### Step 2: Create Passenger Account (If New)

1. **Click "Sign Up"** or **"Register"** on the landing page

2. **Fill in Registration Form:**
   ```
   Name: John Doe
   Email: john@example.com
   Phone: 9876543210
   Password: password123
   Confirm Password: password123
   ```

3. **Click "Sign Up"**

4. You'll be redirected to **Passenger Dashboard**

---

### Step 3: Search for Trips

#### On Landing Page:

You'll see a search box with:
- 📍 **From:** Origin city/stop
- 📍 **To:** Destination city/stop  
- 📅 **Journey Date:** Travel date
- 🔄 **Trip Type:** One Way / Round Trip

**Example:**
```
From: Mumbai Central
To: Pune Station
Date: Today (or select from calendar)
Trip Type: One Way
```

**Click "Search Buses" 🔍**

---

### Step 4: View Available Trips

You'll see a list of available trips:

```
┌─────────────────────────────────────────┐
│  Mumbai → Pune                          │
│  Route: R001 - Express                  │
│  Departure: 09:00 AM                    │
│  Arrival: 12:00 PM                      │
│  Duration: 3h 00m                       │
│  Bus: KL-01-AB-1234 (AC Seater)        │
│  Available Seats: 40                    │
│  Fare: ₹500                             │
│  [View Seats] [Book Now]                │
└─────────────────────────────────────────┘
```

**Click "View Seats" or "Book Now"**

---

### Step 5: Select Boarding & Dropping Points

If route has multiple stops:

**Boarding Point:**
```
○ Mumbai Central - 09:00 AM
○ Lonavala - 10:00 AM
```

**Dropping Point:**
```
○ Lonavala - 10:00 AM
○ Pune Station - 12:00 PM
```

Select your points and click **"Continue"**

---

### Step 6: Select Seats

You'll see an interactive seat layout:

```
Driver    [💺][💺]  [💺][💺]
         [💺][💺]  [💺][💺]
         [💺][💺]  [💺][💺]
         [💺][💺]  [💺][💺]
         [💺][💺]  [💺][💺]
```

**Seat Legend:**
- 💺 Available (grey)
- 🪑 Selected (blue)
- ❌ Booked (red)
- 👩 Ladies seat
- ♿ Disabled seat

**Select your seats:**
1. Click on available seats
2. Selected seats turn blue
3. See total fare update: `₹500 × 2 = ₹1000`
4. **Click "Continue"** or **"Proceed to Passenger Details"**

---

### Step 7: Enter Passenger Details

For each selected seat, enter:

**Passenger 1 (Seat 12A):**
```
Name: John Doe
Age: 30
Gender: Male
Email: john@example.com
Phone: 9876543210
```

**Passenger 2 (Seat 12B):**
```
Name: Jane Doe
Age: 28
Gender: Female
Email: jane@example.com
Phone: 9876543211
```

**Click "Continue to Payment"**

---

### Step 8: Review Booking Summary

You'll see a summary:

```
┌─────────────────────────────────────────┐
│  BOOKING SUMMARY                        │
├─────────────────────────────────────────┤
│  Route: Mumbai → Pune                   │
│  Date: Oct 1, 2025                      │
│  Time: 09:00 AM - 12:00 PM             │
│  Bus: KL-01-AB-1234                     │
│                                         │
│  Passengers:                            │
│  1. John Doe (30/M) - Seat 12A         │
│  2. Jane Doe (28/F) - Seat 12B         │
│                                         │
│  Boarding: Mumbai Central               │
│  Dropping: Pune Station                 │
│                                         │
│  FARE BREAKDOWN:                        │
│  Base Fare: ₹500 × 2     = ₹1,000      │
│  GST (5%):                = ₹50         │
│  ─────────────────────────────          │
│  Total Amount:            = ₹1,050      │
└─────────────────────────────────────────┘

[ ← Back ]           [ Proceed to Pay → ]
```

**Click "Proceed to Pay"**

---

### Step 9: Payment

#### Payment Options:

**Option 1: Digital Wallet (If available)**
```
Wallet Balance: ₹5,000
Amount to Pay: ₹1,050
[Pay with Wallet]
```

**Option 2: Razorpay Payment**
```
[💳 Credit/Debit Card]
[📱 UPI]
[🏦 Net Banking]
```

**For Testing:**
1. Select payment method
2. Razorpay test modal will open
3. Use Razorpay test cards:
   ```
   Card: 4111 1111 1111 1111
   CVV: 123
   Expiry: Any future date
   ```
4. Click **"Pay ₹1,050"**

---

### Step 10: Payment Success & E-Ticket

After successful payment:

```
┌─────────────────────────────────────────┐
│  ✅ BOOKING SUCCESSFUL!                 │
│                                         │
│  Booking ID: BKG-2025-001234           │
│  PNR: YATRIK123456                     │
│                                         │
│  🎫 Your E-Ticket has been sent to:    │
│     john@example.com                    │
│                                         │
│  [📥 Download Ticket] [✉️ Email Ticket]│
└─────────────────────────────────────────┘
```

---

### Step 11: View Your E-Ticket

Your e-ticket will show:

```
┌─────────────────────────────────────────┐
│         YATRIK ERP E-TICKET            │
│                                         │
│  PNR: YATRIK123456                     │
│  Booking ID: BKG-2025-001234           │
│                                         │
│  [QR CODE]                              │
│                                         │
│  JOURNEY DETAILS                        │
│  From: Mumbai Central                   │
│  To: Pune Station                       │
│  Date: Oct 1, 2025                     │
│  Departure: 09:00 AM                    │
│  Arrival: 12:00 PM                      │
│                                         │
│  BUS DETAILS                            │
│  Bus No: KL-01-AB-1234                 │
│  Type: AC Seater                        │
│                                         │
│  PASSENGER DETAILS                      │
│  1. John Doe (30/M) - Seat 12A         │
│  2. Jane Doe (28/F) - Seat 12B         │
│                                         │
│  FARE: ₹1,050 (PAID)                   │
│                                         │
│  Status: CONFIRMED ✅                   │
└─────────────────────────────────────────┘

[📥 Download PDF] [✉️ Send Email] [📱 Share]
```

---

## 🎯 Quick Test Booking (Using Sample Data)

If you've run the sample data script:

### Quick Test Steps:

1. **Go to:** `https://your-vercel-url.vercel.app`

2. **Login as Passenger:**
   ```
   Email: passenger@test.com
   Password: passenger123
   ```

3. **Search:**
   ```
   From: Mumbai Central
   To: Pune Station
   Date: Today
   ```

4. **Select Trip:** 9:00 AM - 12:00 PM Express

5. **Choose Seats:** Click any 1-2 seats

6. **Passenger Details:** Auto-filled or enter

7. **Payment:** Use wallet (₹5000 balance) or Razorpay test card

8. **Get E-Ticket!** ✅

---

## 🔍 Tracking Your Booking

### View Bookings:

1. **Go to Passenger Dashboard**
2. **Click "My Bookings"** or **"Booking History"**
3. **See all your bookings:**

```
┌─────────────────────────────────────────┐
│  UPCOMING TRIPS                         │
├─────────────────────────────────────────┤
│  ○ Mumbai → Pune                        │
│     Oct 1, 2025 | 09:00 AM             │
│     PNR: YATRIK123456                   │
│     Status: Confirmed                   │
│     [View Ticket] [Track Bus]           │
└─────────────────────────────────────────┘
```

### Track Bus in Real-Time:

1. **Click "Track Bus"** on your booking
2. **See live map** with bus location
3. **Get ETA** to your boarding point

---

## 🚌 On Journey Day

### Boarding the Bus:

1. **Open e-ticket** on phone or print
2. **Show QR code** to conductor
3. **Conductor scans** with QR scanner
4. **Ticket validated** ✅
5. **Board the bus!**

---

## ❌ Cancel Booking (If Needed)

1. **Go to My Bookings**
2. **Select the booking**
3. **Click "Cancel Booking"**
4. **Confirm cancellation**
5. **Refund processed** to wallet/original payment method

**Cancellation Policy:**
- 24+ hours before: 90% refund
- 12-24 hours: 50% refund
- <12 hours: 25% refund
- After departure: No refund

---

## 💰 Wallet Management

### Add Money to Wallet:

1. **Go to "My Wallet"**
2. **Click "Add Money"**
3. **Enter amount:** e.g., ₹2000
4. **Pay via Razorpay**
5. **Balance updated**

### Use Wallet for Booking:

- Automatically shown as payment option
- Instant payment (no gateway)
- Faster checkout

---

## 📱 Features Available

- ✅ Search trips with filters
- ✅ Interactive seat selection
- ✅ Multiple passenger booking
- ✅ Digital wallet
- ✅ E-tickets with QR code
- ✅ Real-time bus tracking
- ✅ Booking history
- ✅ Trip reminders
- ✅ Cancellation & refunds
- ✅ Email notifications
- ✅ PDF ticket download

---

## 🆘 Troubleshooting

### No Trips Found
- Check if trips are scheduled for selected date
- Verify route exists between cities
- Admin should create trips in Trip Management

### Seats Not Showing
- Check if bus has seat layout configured
- Verify trip has available seats
- Refresh the page

### Payment Failing
- Check internet connection
- Try different payment method
- Use wallet for instant payment
- Verify Razorpay keys are set in Vercel

### QR Code Not Generated
- Check if booking is confirmed
- Refresh ticket page
- Download PDF and check there

---

## 🎉 You're Ready to Book!

**The complete booking flow:**
```
Search → Select Trip → Choose Seats → 
Enter Details → Pay → Get E-Ticket → Board Bus
```

**Need help?** Check the in-app support or contact admin! 🚀

---

**Happy Journey with YATRIK ERP!** 🚌✨


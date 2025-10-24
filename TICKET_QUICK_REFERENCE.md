# 🎫 Passenger Ticket System - Quick Reference

## 📌 What's Fixed

| Feature | Before | After |
|---------|--------|-------|
| **Passenger Name** | "Guest Passenger" | Actual name (e.g., "Rito Tensy") |
| **Route (From/To)** | Default/Incorrect | Exact booking route |
| **Amount** | Wrong/Default | Correct booking amount |
| **Bus Info** | Missing | Bus number + type |
| **Conductor** | ❌ Not shown | ✅ Name, Email, Phone |
| **Driver** | ❌ Not shown | ✅ Name, Email, Phone |
| **Email QR** | Basic | Complete with crew details |

## 🔗 Key Endpoints

### Get Ticket by PNR
```
GET /api/booking/pnr/:pnr
```

**Response includes**:
- ✅ Customer details (name, email, phone)
- ✅ Journey details (from, to, times)
- ✅ Pricing (total, base, GST)
- ✅ Bus details (number, type)
- ✅ **Conductor** (name, email, phone)
- ✅ **Driver** (name, email, phone)

## 📂 Files Modified

### Backend (3 files)
1. `backend/routes/ticketPNR.js` - NEW ⭐
2. `backend/server.js` - Modified
3. `backend/config/email.js` - Already has crew template ✅

### Frontend (1 file)
1. `frontend/src/pages/passenger/Ticket.jsx` - Modified

## 🎯 Key Features

### 1. Conductor Information
```javascript
conductor: {
  name: "Rajesh Kumar",
  email: "rajesh-kochi@yatrik.com",
  phone: "+91-9876543211"
}
```

### 2. Driver Information
```javascript
driver: {
  name: "Vijay Menon",
  email: "vijay-kochi@yatrik.com",
  phone: "+91-9876543212"
}
```

### 3. Ticket Display
- Passenger name from `booking.customer.name`
- Route from `booking.journey.from/to`
- Amount from `booking.pricing.totalAmount`
- Bus from `booking.bus.busNumber/busType`
- Crew from `booking.conductor` and `booking.driver`

### 4. Email Template
- Embedded QR code
- Complete passenger details
- Conductor card with contact info
- Driver card with contact info
- Professional HTML design

## 🧪 Quick Test

```bash
# 1. Check if endpoint works
curl http://localhost:5000/api/booking/pnr/PNR81985953

# Expected: Response with conductor and driver details

# 2. Open ticket in browser
http://localhost:5173/passenger/ticket/PNR81985953

# Expected: 
# - Correct passenger name
# - Conductor card visible
# - Driver card visible
```

## ✅ Verification Checklist

- [ ] Passenger name shows correctly (not "Guest")
- [ ] From/To cities match booking
- [ ] Amount is accurate
- [ ] Bus details displayed
- [ ] Conductor card appears
- [ ] Driver card appears
- [ ] QR code generates
- [ ] Email received with crew details

## 🚀 How to Use

### For Passengers
1. Book a ticket
2. Complete payment
3. Check email for ticket with QR code
4. View ticket at `/passenger/ticket/:pnr`
5. See conductor and driver details
6. Contact crew if needed

### For Developers
1. Ensure trip has conductor and driver assigned
2. Booking endpoint returns complete data
3. Frontend displays crew information
4. Email service sends ticket with crew details

## 📞 Conductor/Driver Display

```jsx
{/* If conductor exists */}
<div className="crew-card">
  <div>🎫 CONDUCTOR</div>
  <div>{ticket.conductor.name}</div>
  <div>📞 {ticket.conductor.phone}</div>
  <div>📧 {ticket.conductor.email}</div>
</div>

{/* If driver exists */}
<div className="crew-card">
  <div>🚗 DRIVER</div>
  <div>{ticket.driver.name}</div>
  <div>📞 {ticket.driver.phone}</div>
  <div>📧 {ticket.driver.email}</div>
</div>
```

## 💡 Important Notes

1. **Conductor & Driver must be assigned to trip** - Otherwise shows "To be assigned"
2. **Email sent after payment** - Includes all details + QR code
3. **QR code embedded** - High-quality image in email
4. **Fallback handling** - System doesn't break if crew not assigned
5. **Backward compatible** - Works with existing bookings

## 🔍 Troubleshooting

### Issue: Conductor not showing
**Solution**: Ensure trip has `conductorId` populated

### Issue: Driver not showing
**Solution**: Ensure trip has `driverId` populated

### Issue: "Guest Passenger" still showing
**Solution**: Check `booking.customer.name` exists

### Issue: Email not received
**Solution**: 
- Check email service config
- Verify `booking.customer.email`
- Check email logs

## 📊 Data Sources

| Field | Source |
|-------|--------|
| Passenger Name | `booking.customer.name` |
| From/To | `booking.journey.from/to` |
| Amount | `booking.pricing.totalAmount` |
| Bus Number | `booking.busId.busNumber` |
| Bus Type | `booking.busId.busType` |
| Conductor | `trip.conductorId` (populated) |
| Driver | `trip.driverId` (populated) |

## 🎨 UI Components

### Crew Information Card
- Gradient background (indigo-blue)
- Two-column grid layout
- Driver card (left)
- Conductor card (right)
- Icons for contact info
- Professional styling

### Email Template
- YATRIK branding header
- Ticket details card
- QR code section
- **Crew information section** ⭐
- Instructions
- CTA buttons
- Footer with links

## 📝 Code Snippets

### Backend - Populate Crew
```javascript
const booking = await Booking.findOne({ bookingId: pnr })
  .populate({
    path: 'tripId',
    populate: [
      { path: 'driverId', select: 'name email phone' },
      { path: 'conductorId', select: 'name email phone' }
    ]
  });
```

### Frontend - Display Crew
```javascript
const ticket = {
  conductor: bookingData.conductor || null,
  driver: bookingData.driver || null,
  // ... other fields
};
```

## 🌟 Benefits

1. **Transparency** - All booking details visible
2. **Trust** - Accurate information builds confidence
3. **Contact** - Easy to reach crew if needed
4. **Professional** - Well-designed UI and email
5. **Complete** - Everything in one place

---

**Quick Ref Status**: ✅ Ready  
**Date**: October 20, 2025  
**Version**: 2.0

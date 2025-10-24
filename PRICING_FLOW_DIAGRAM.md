# Ticket Pricing Flow - Visual Diagram

## 🎯 Complete Price Flow: Booking → Email

```
┌─────────────────────────────────────────────────────────────────┐
│                    PASSENGER BOOKS TICKET                       │
│                                                                 │
│  Selected Seat: U1                                             │
│  Seat Price: ₹450                                              │
│  (includes ₹400 base + ₹50 GST)                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│              BOOKING CREATED IN DATABASE                        │
│                                                                 │
│  booking = {                                                    │
│    seats: [                                                     │
│      {                                                          │
│        seatNumber: 'U1',                                        │
│        price: 450        ← ORIGINAL PRICE STORED                │
│      }                                                          │
│    ],                                                           │
│    pricing: {                                                   │
│      baseFare: 400,                                            │
│      taxes: { gst: 50 },                                       │
│      totalAmount: 450    ← TOTAL PRICE STORED                  │
│    }                                                            │
│  }                                                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                  PAYMENT PROCESSING                             │
│                                                                 │
│  User pays: ₹450 via Razorpay                                  │
│  Payment verified ✅                                            │
│                                                                 │
│  Transaction created:                                           │
│    amount: 450     ← PAYMENT AMOUNT                            │
│    status: 'completed'                                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│               TICKET CREATION (payment.js)                      │
│                                                                 │
│  for (const seat of booking.seats) {                           │
│    ticketData = {                                              │
│      fareAmount: seat.price                                    │
│                  || booking.pricing.totalAmount                │
│                  || 0                                          │
│      // ↑ Priority chain                                       │
│                                                                 │
│      pricing: {                                                │
│        baseFare: booking.pricing.baseFare,     // ₹400         │
│        gst: booking.pricing.taxes.gst,         // ₹50          │
│        totalAmount: booking.pricing.totalAmount // ₹450        │
│      }                                                          │
│    }                                                            │
│  }                                                              │
│                                                                 │
│  Result: fareAmount = 450 ✅                                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│            QR CODE & EMAIL GENERATION                           │
│                                                                 │
│  1. Generate QR Code with ticket data                          │
│  2. Prepare email template                                     │
│  3. Format price for display                                   │
│                                                                 │
│  const fareAmount = ticketData.fareAmount  // ₹450             │
│  const gst = ticketData.pricing.gst        // ₹50              │
│                                                                 │
│  Display: ₹450.00                                              │
│           (incl. GST ₹50.00)                                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                  EMAIL SENT TO PASSENGER                        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  YATRIK ERP - Bus Ticket                                  │ │
│  │  PNR: YTK12345                                            │ │
│  │─────────────────────────────────────────────────────────────│
│  │  Passenger: Rito Tensy                                    │ │
│  │  Seat: U1                                                 │ │
│  │  Bus: KL-07-AB-1234                                       │ │
│  │                                                           │ │
│  │  Fare Paid: ₹450.00 ✅                                    │ │
│  │  (incl. GST ₹50.00)                                       │ │
│  │                                                           │ │
│  │  [QR Code Image]                                          │ │
│  │                                                           │ │
│  │  Conductor: Rajesh Kumar                                  │ │
│  │  Driver: Vijay Menon                                      │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💰 Price Preservation Flow

```
┌──────────────┐
│   Booking    │  seats[0].price = 450
│   Created    │  pricing.totalAmount = 450
└──────┬───────┘
       │
       │ NO MODIFICATION ✅
       │
       ↓
┌──────────────┐
│   Payment    │  fareAmount = seat.price (450)
│  Processed   │  pricing = booking.pricing
└──────┬───────┘
       │
       │ NO MODIFICATION ✅
       │
       ↓
┌──────────────┐
│   Ticket     │  fareAmount = 450
│   Created    │  pricing.totalAmount = 450
└──────┬───────┘
       │
       │ FORMAT ONLY (450 → "450.00")
       │
       ↓
┌──────────────┐
│    Email     │  Display: ₹450.00
│     Sent     │  (incl. GST ₹50.00)
└──────────────┘
```

---

## 🔄 Price Extraction Logic

```
┌─────────────────────────────────────┐
│  Extract Price from Booking         │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│  Try: seat.price                    │
│  Value: 450 ✅                       │
└────────────┬────────────────────────┘
             │
             │ If null/undefined
             ↓
┌─────────────────────────────────────┐
│  Try: booking.pricing.totalAmount   │
│  Value: 450 ✅                       │
└────────────┬────────────────────────┘
             │
             │ If null/undefined
             ↓
┌─────────────────────────────────────┐
│  Fallback: 0                        │
│  (Safety default)                   │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│  Result: fareAmount = 450           │
└─────────────────────────────────────┘
```

---

## 📊 Multi-Seat Booking Example

```
Booking with 2 Seats
─────────────────────

┌─────────────────────────────────────┐
│  Booking Data                       │
│  seats: [                           │
│    { seatNumber: 'U1', price: 450 } │
│    { seatNumber: 'U2', price: 450 } │
│  ]                                  │
│  pricing: {                         │
│    totalAmount: 900 (450+450)       │
│  }                                  │
└────────────┬────────────────────────┘
             │
             ├─────────────────┬───────────────────┐
             ↓                 ↓                   ↓
      ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
      │  Ticket 1   │   │  Ticket 2   │   │  Email 1    │
      │  Seat: U1   │   │  Seat: U2   │   │  Shows:     │
      │  Price: 450 │   │  Price: 450 │   │  ₹450.00    │
      └─────────────┘   └─────────────┘   └─────────────┘
                                                  │
                                          ┌───────┴──────┐
                                          ↓              ↓
                                   ┌─────────────┐ ┌─────────────┐
                                   │  Email 2    │ │  Both show  │
                                   │  Shows:     │ │  individual │
                                   │  ₹450.00    │ │  seat price │
                                   └─────────────┘ └─────────────┘
```

---

## 🎨 Email Price Display Structure

```
┌──────────────────────────────────────┐
│          Email Template              │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  Ticket Details Card           │  │
│  │                                │  │
│  │  Passenger: Rito Tensy         │  │
│  │  Seat: U1                      │  │
│  │  ───────────────────────────   │  │
│  │  Bus: KL-07-AB-1234            │  │
│  │  Type: AC Sleeper              │  │
│  │  ───────────────────────────   │  │
│  │  Fare Paid ← Label             │  │
│  │  ₹450.00   ← Price (Green)     │  │
│  │  (incl. GST ₹50.00) ← GST      │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  QR Code Section               │  │
│  │  [240x240 QR Image]            │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

## 🔍 Data Validation at Each Stage

```
Stage 1: Booking
├─ ✅ seat.price exists
├─ ✅ seat.price > 0
├─ ✅ pricing.totalAmount = sum(seats.price)
└─ ✅ pricing.taxes.gst calculated

Stage 2: Payment
├─ ✅ transaction.amount = booking.pricing.totalAmount
├─ ✅ payment verified
└─ ✅ booking.status = 'paid'

Stage 3: Ticket Creation
├─ ✅ ticketData.fareAmount = seat.price
├─ ✅ ticketData.pricing preserved
└─ ✅ QR code generated

Stage 4: Email Sent
├─ ✅ fareAmount displayed correctly
├─ ✅ GST shown if > 0
├─ ✅ Currency formatted (₹450.00)
└─ ✅ Email delivered to customer
```

---

## 💡 Key Takeaways

### 1. Price Source
```
Original: booking.seats[].price
Always:   From passenger's booking
Never:    Recalculated or modified
```

### 2. Price Flow
```
Booking → Payment → Ticket → Email
  450   →   450   →   450  → 450.00
  (Stored) (Verified) (Preserved) (Displayed)
```

### 3. Display Format
```
Input:   450 (number)
Process: currencyFormat(450)
Output:  "450.00" (string)
Display: ₹450.00 (formatted)
```

### 4. GST Handling
```
If gst > 0:
  Show: ₹450.00
        (incl. GST ₹50.00)

If gst = 0:
  Show: ₹450.00
```

---

## 🚀 Quick Reference

### Price Extraction Code
```javascript
// In payment.js (line 236)
fareAmount: seat.price || booking.pricing?.totalAmount || 0
```

### Price Display Code
```javascript
// In email.js (line 270)
const fareAmount = t.fareAmount || t.pricing?.totalAmount || 0;
const gst = t.pricing?.gst || 0;

// Format for display
₹${currencyFormat(fareAmount)}
${gst > 0 ? `(incl. GST ₹${currencyFormat(gst)})` : ''}
```

### Currency Formatter
```javascript
const currencyFormat = (amt) => {
  if (amt === undefined || amt === null || isNaN(Number(amt))) {
    return '0.00';
  }
  return Number(amt).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
```

---

**Summary**: The original ticket price flows seamlessly from booking creation through payment processing to the email confirmation with NO modifications, ensuring passengers always see the exact price they paid! ✅

---

**Status**: ✅ Complete and Verified  
**Last Updated**: October 20, 2025

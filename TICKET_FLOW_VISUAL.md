# 📧 Email Ticket System - Visual Flow Guide

## 🔄 Complete System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     PASSENGER BOOKING FLOW                       │
└─────────────────────────────────────────────────────────────────┘

🔍 Search Bus
    ↓
📅 Select Trip
    ↓
💺 Choose Seat(s)
    ↓
📝 Enter Details
    ↓
💳 Make Payment (Razorpay)
    ↓
✅ Payment Success
    ↓
┌─────────────────────────────┐
│  BACKEND PROCESSES          │
├─────────────────────────────┤
│ 1. Verify Payment           │
│ 2. Update Booking (paid)    │
│ 3. Fetch Trip Data          │
│ 4. Load Driver Info         │
│ 5. Load Conductor Info      │
│ 6. Create Tickets           │
│ 7. Generate QR Codes        │
│ 8. Send Email               │
└─────────────────────────────┘
    ↓
📧 EMAIL SENT TO PASSENGER
    ↓
┌─────────────────────────────────────────────────────────┐
│                  EMAIL CONTENT                          │
├─────────────────────────────────────────────────────────┤
│  🎫 TICKET CONFIRMED                                    │
│  ═══════════════════════════════════════════            │
│                                                         │
│  📋 BOOKING DETAILS                                     │
│  ├─ PNR: YTKXXXXX                                       │
│  ├─ Ticket: TKT1234567ABCDE                             │
│  ├─ Passenger: John Doe                                 │
│  └─ Contact: john@email.com | +91-9876543210           │
│                                                         │
│  🚌 TRIP INFORMATION                                    │
│  ├─ Route: Chennai → Bangalore                         │
│  ├─ Date: Friday, Oct 20, 2025                          │
│  ├─ Time: 10:00 AM                                      │
│  ├─ Bus: KL-01-1234 (AC Seater)                         │
│  ├─ Seat: A12                                           │
│  └─ Fare: ₹500.00                                       │
│                                                         │
│  📱 QR CODE FOR BOARDING                                │
│  ┌──────────────────┐                                   │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │                                   │
│  │  ▓▓ QR  CODE ▓▓  │  ← Scan this at boarding         │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │                                   │
│  └──────────────────┘                                   │
│                                                         │
│  👨‍✈️ CREW INFORMATION                                   │
│  ═══════════════════════════════════════════            │
│                                                         │
│  🚗 DRIVER                    🎫 CONDUCTOR              │
│  ├─ Ram Kumar                 ├─ Suresh Kumar          │
│  ├─ 📧 ram@yatrik.com         ├─ 📧 suresh@yatrik.com  │
│  └─ 📱 +91-9876543210         └─ 📱 +91-9876543211     │
│                                                         │
│  ⚠️ IMPORTANT INSTRUCTIONS                              │
│  • Report 15 minutes before departure                  │
│  • Carry valid photo ID proof                          │
│  • Show QR code to conductor for verification          │
│  • Conductor will scan and admit you                   │
│  • Keep phone charged to display QR code               │
│                                                         │
│  [View My Bookings]  [Get Support]                     │
└─────────────────────────────────────────────────────────┘

```

## 🎫 Conductor Validation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   CONDUCTOR BOARDING PROCESS                     │
└─────────────────────────────────────────────────────────────────┘

👨‍✈️ Conductor Login
    ↓
📋 View Today's Trip
    ↓
    ┌──────────────────────────────┐
    │  Trip: Chennai → Bangalore   │
    │  Bus: KL-01-1234             │
    │  Time: 10:00 AM              │
    │  Bookings: 15                │
    │  Validated: 0                │
    └──────────────────────────────┘
    ↓
🚌 Bus Arrives at Station
    ↓
👤 Passenger Shows QR Code
    ↓
📸 Conductor Scans QR Code
    ↓
    ┌──────────────────────────────┐
    │  POST /api/conductor/scan    │
    │  {                           │
    │    "qrPayload": "{...}"      │
    │  }                           │
    └──────────────────────────────┘
    ↓
🔐 BACKEND VALIDATION
    ├─ Parse QR Code
    ├─ Verify Signature ✓
    ├─ Check Expiration ✓
    ├─ Find in Database ✓
    ├─ Check Ticket State ✓
    └─ Verify Trip Match ✓
    ↓
✅ VALIDATION SUCCESS
    ↓
    ┌──────────────────────────────────┐
    │  ✓ TICKET VALIDATED              │
    ├──────────────────────────────────┤
    │  Passenger: John Doe             │
    │  PNR: YTKXXXXX                   │
    │  Seat: A12                       │
    │  From: Chennai                   │
    │  To: Bangalore                   │
    │  Fare: ₹500.00                   │
    │  Status: ✓ VALIDATED             │
    │  Time: 09:45 AM                  │
    └──────────────────────────────────┘
    ↓
✅ Allow Passenger to Board
    ↓
💺 Passenger Takes Seat A12
    ↓
📊 Updated Statistics:
    ├─ Bookings: 15
    ├─ Validated: 1 ↑
    └─ Pending: 14

```

## 🔐 QR Code Security

```
┌─────────────────────────────────────────────────────────────────┐
│                    QR CODE STRUCTURE                             │
└─────────────────────────────────────────────────────────────────┘

QR Code Payload:
┌────────────────────────────────────────┐
│ {                                      │
│   "ver": 1,                            │  ← Version
│   "typ": "YATRIK_TICKET",              │  ← Type
│   "pnr": "YTKXXXXX",                   │  ← Unique PNR
│   "bookingId": "67123abc...",          │  ← Booking ID
│   "tripId": "67123def...",             │  ← Trip ID
│   "seatNumber": "A12",                 │  ← Seat
│   "passengerName": "John Doe",         │  ← Name
│   "issuedAt": 1729425600000,           │  ← Issue time
│   "exp": 1729512000000,                │  ← Expiry (24h)
│   "sig": "a1b2c3d4e5f6..."            │  ← Signature
│ }                                      │
└────────────────────────────────────────┘

Security Layers:
┌────────────────────────────────────────┐
│ 1. Digital Signature (HMAC-SHA256)    │ ✓ Prevents Forgery
│ 2. Expiration Timestamp                │ ✓ Time-Limited
│ 3. Database Cross-Check                │ ✓ Validates Existence
│ 4. State Management                    │ ✓ Prevents Reuse
│ 5. Trip Verification                   │ ✓ Correct Bus
└────────────────────────────────────────┘

Validation Checks:
┌────────────────────────────────────────┐
│ ✓ Signature Valid?                     │
│ ✓ Not Expired?                         │
│ ✓ Ticket Exists in DB?                 │
│ ✓ Not Already Validated?               │
│ ✓ Not Cancelled?                       │
│ ✓ Matches This Trip?                   │
└────────────────────────────────────────┘
```

## 📊 Database Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE OPERATIONS                         │
└─────────────────────────────────────────────────────────────────┘

PAYMENT SUCCESS
    ↓
┌──────────────────────┐
│   Booking Model      │
├──────────────────────┤
│ status: 'paid'       │ ← Update
│ paymentStatus: 'ok'  │
│ emailSent: true      │
└──────────────────────┘
    ↓
┌──────────────────────┐
│   Ticket Model       │
├──────────────────────┤
│ CREATE NEW           │ ← For each seat
│ pnr: YTKXXXXX        │
│ qrPayload: {...}     │
│ qrImage: data:...    │
│ state: 'active'      │
│ passengerName: ...   │
│ seatNumber: ...      │
└──────────────────────┘
    ↓
┌──────────────────────┐
│   Trip Model         │
├──────────────────────┤
│ POPULATE             │ ← Load crew
│ driverId: {          │
│   name, email, phone │
│ }                    │
│ conductorId: {       │
│   name, email, phone │
│ }                    │
└──────────────────────┘

CONDUCTOR SCANS
    ↓
┌──────────────────────┐
│   Ticket Model       │
├──────────────────────┤
│ UPDATE               │
│ state: 'validated'   │ ← Mark validated
│ scannedAt: now       │
│ scannedBy: conductor │
│ validationHistory: [ │
│   {                  │
│     conductorId,     │
│     validatedAt,     │
│     location,        │
│     deviceInfo       │
│   }                  │
│ ]                    │
└──────────────────────┘
```

## 📱 Mobile/Frontend Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                   FRONTEND INTEGRATION                           │
└─────────────────────────────────────────────────────────────────┘

PASSENGER APP/WEBSITE:
┌────────────────────────────────────┐
│  After Payment Success             │
├────────────────────────────────────┤
│  ✓ Payment Confirmed               │
│  📧 Ticket sent to your email      │
│                                    │
│  [View Email]  [My Bookings]       │
│                                    │
│  You can also view your ticket:    │
│  ┌──────────────────┐              │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │              │
│  │  ▓▓ QR CODE  ▓▓  │              │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │              │
│  └──────────────────┘              │
│                                    │
│  Show this to conductor            │
└────────────────────────────────────┘

CONDUCTOR APP:
┌────────────────────────────────────┐
│  Today's Trip: CHN → BLR           │
│  Bus: KL-01-1234 | 10:00 AM        │
├────────────────────────────────────┤
│  📊 Statistics                     │
│  Total Bookings: 15                │
│  Validated: 8                      │
│  Pending: 7                        │
├────────────────────────────────────┤
│  [📸 Scan Ticket]                  │
│                                    │
│  Recent Validations:               │
│  ✓ A12 - John Doe (09:45)          │
│  ✓ B05 - Jane Smith (09:46)        │
│  ✓ C08 - Bob Wilson (09:47)        │
└────────────────────────────────────┘

SCAN SCREEN:
┌────────────────────────────────────┐
│  📸 Scan QR Code                   │
├────────────────────────────────────┤
│  ┌──────────────────────┐          │
│  │                      │          │
│  │    [Camera View]     │          │
│  │                      │          │
│  │   Position QR Code   │          │
│  │   within frame       │          │
│  │                      │          │
│  └──────────────────────┘          │
│                                    │
│  or enter PNR manually:            │
│  [________________] [Verify]       │
└────────────────────────────────────┘

VALIDATION RESULT:
┌────────────────────────────────────┐
│  ✅ TICKET VALIDATED               │
├────────────────────────────────────┤
│  Passenger: John Doe               │
│  PNR: YTKXXXXX                     │
│  Seat: A12                         │
│  From: Chennai                     │
│  To: Bangalore                     │
│  Fare: ₹500.00                     │
│                                    │
│  Validated at: 09:45 AM            │
│  [✓ Allow Boarding]                │
└────────────────────────────────────┘
```

## 🎯 Use Cases

```
┌─────────────────────────────────────────────────────────────────┐
│                       USE CASES                                  │
└─────────────────────────────────────────────────────────────────┘

CASE 1: Normal Booking & Boarding
───────────────────────────────────
Passenger books → Pays → Gets email → Shows QR → Validated → Boards
✅ Happy path

CASE 2: Lost/Deleted Email
──────────────────────────
Passenger can:
- View ticket in app/website
- Contact support with PNR
- Conductor can manually verify with PNR
✅ Recoverable

CASE 3: Duplicate Ticket Attempt
─────────────────────────────────
Someone tries to reuse validated QR
→ System detects already validated
→ Shows validation time & conductor
→ Blocks boarding
✅ Fraud prevented

CASE 4: Wrong Bus
─────────────────
Passenger shows ticket for different bus
→ System checks trip ID mismatch
→ Shows correct bus details
→ Directs to right bus
✅ Confusion resolved

CASE 5: Expired Ticket
──────────────────────
Passenger shows ticket after 24 hours
→ System checks expiration
→ Shows expired status
→ Suggests rebooking
✅ Security maintained

CASE 6: Cancelled Booking
─────────────────────────
Passenger shows cancelled ticket
→ System checks state
→ Shows cancelled status
→ Suggests rebooking
✅ Clear communication
```

## 📧 Email Preview

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                     🎫 YATRIK ERP                               │
│                 Transport Management System                     │
│                                                                 │
│        ╔═══════════════════════════════════════╗               │
│        ║      TICKET CONFIRMED! 🎉              ║               │
│        ║   Your bus ticket is ready             ║               │
│        ╚═══════════════════════════════════════╝               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ PNR: YTKXXXXX                  Ticket: TKT1234567ABCDE  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                 JOURNEY DETAILS                          │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │     Chennai                 →              Bangalore     │  │
│  │   Friday, Oct 20                        As per schedule  │  │
│  │     10:00 AM                                             │  │
│  │                                                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Passenger: John Doe              Seat: A12              │  │
│  │ Bus: KL-01-1234                  Fare: ₹500.00          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              🔍 SCAN QR CODE FOR BOARDING               │  │
│  │        Show this QR code to the conductor               │  │
│  │                                                          │  │
│  │                 ┌─────────────────┐                     │  │
│  │                 │  ▓▓▓▓▓▓▓▓▓▓▓▓▓  │                     │  │
│  │                 │  ▓▓▓▓▓▓▓▓▓▓▓▓▓  │                     │  │
│  │                 │  ▓▓▓▓▓▓▓▓▓▓▓▓▓  │                     │  │
│  │                 │  ▓▓ QR CODE ▓▓  │                     │  │
│  │                 │  ▓▓▓▓▓▓▓▓▓▓▓▓▓  │                     │  │
│  │                 │  ▓▓▓▓▓▓▓▓▓▓▓▓▓  │                     │  │
│  │                 │  ▓▓▓▓▓▓▓▓▓▓▓▓▓  │                     │  │
│  │                 └─────────────────┘                     │  │
│  │                                                          │  │
│  │         This QR code is unique and secure               │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              👨‍✈️ CREW INFORMATION                        │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │  🚗 DRIVER                  🎫 CONDUCTOR                │  │
│  │  ┌──────────────────┐      ┌──────────────────┐        │  │
│  │  │ Ram Kumar        │      │ Suresh Kumar     │        │  │
│  │  │ 📧 ram@yatrik    │      │ 📧 suresh@yatrik │        │  │
│  │  │ 📱 +91-98765...  │      │ 📱 +91-98765...  │        │  │
│  │  └──────────────────┘      └──────────────────┘        │  │
│  │                                                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │        ⚠️ IMPORTANT INSTRUCTIONS                         │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │  • Report 15 minutes before departure                   │  │
│  │  • Carry valid photo ID proof                           │  │
│  │  • Show QR code to conductor for verification           │  │
│  │  • Conductor will scan and admit you                    │  │
│  │  • Keep phone charged to display QR code                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│         [📱 View My Bookings]    [💬 Get Support]             │
│                                                                 │
│  ─────────────────────────────────────────────────────────── │
│  This is an automated email. Please do not reply.             │
│  © 2025 YATRIK ERP. All rights reserved.                      │
│                                                                 │
│  Website | Terms | Privacy                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

**Visual Guide Complete! 🎉**

This comprehensive flow shows exactly how the email ticket system works from booking to boarding, including all security measures and user interactions.

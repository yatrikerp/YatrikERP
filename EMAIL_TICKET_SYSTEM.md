# Email Ticket System with QR Code Implementation

## Overview
This document describes the implementation of the automated email ticket system with QR code functionality for the YATRIK ERP bus transport management system.

## Features Implemented

### 1. **Automated Email Ticket Delivery**
After successful payment, passengers automatically receive an email containing:
- **Ticket Details**: PNR, ticket number, passenger name, seat number, route, date, time, fare
- **QR Code**: Unique, secure QR code for ticket validation
- **Crew Information**: Driver and conductor details (name, email, phone)
- **Trip Information**: Bus number, route, departure/arrival details
- **Booking Instructions**: Important guidelines for boarding

### 2. **QR Code Generation & Security**
- **Unique QR Code**: Each ticket gets a cryptographically signed QR code
- **Tamper-Proof**: Uses digital signatures to prevent forgery
- **Expiration**: QR codes expire after 24 hours or trip completion
- **Payload Contains**:
  - Ticket PNR and number
  - Passenger name and seat number
  - Trip and booking IDs
  - Issue and expiration timestamps
  - Cryptographic signature

### 3. **Conductor Ticket Scanning**
Conductors can scan and validate tickets using:
- **Mobile QR Scanner**: Scans passenger QR codes
- **Real-time Validation**: Verifies ticket authenticity instantly
- **Seat Allocation**: Confirms booked seat assignment
- **Trip Verification**: Ensures ticket matches the bus/trip
- **Duplicate Detection**: Prevents reuse of already-validated tickets

### 4. **Email Template Features**
The email template includes:
- **Modern Design**: Professional, mobile-responsive layout
- **Visual QR Code**: Embedded QR code image for easy scanning
- **Color-Coded Sections**: Clear visual hierarchy
- **Crew Contact Info**: Driver and conductor details prominently displayed
- **Action Buttons**: Quick links to booking dashboard and support
- **Important Instructions**: Boarding guidelines and requirements

## Implementation Details

### Files Modified/Created

#### 1. **backend/package.json**
Added dependencies:
```json
"qrcode": "^1.5.4",
"pdfkit": "^0.15.0"
```

#### 2. **backend/config/email.js**
Added new email template: `ticketConfirmationWithQR`
- Async QR code generation
- Driver and conductor information display
- Enhanced ticket visualization
- Mobile-responsive design

#### 3. **backend/routes/payment.js**
Enhanced payment verification endpoint (`/api/payment/verify`):
- Creates tickets in database after payment
- Generates QR codes with signatures
- Populates driver/conductor information from trip
- Sends email with ticket and QR code
- Handles multiple seats per booking

Enhanced mock payment endpoint (`/api/payment/mock`):
- Same functionality for testing without real payment gateway

#### 4. **backend/routes/conductor.js** (NEW)
Created conductor-specific endpoints:

**POST /api/conductor/scan-ticket**
- Scans and validates QR codes
- Checks ticket authenticity
- Marks tickets as validated
- Returns trip and passenger details
- Requires: `conductor`, `admin`, or `depot_manager` role

**GET /api/conductor/my-trip**
- Gets conductor's assigned trip for the day
- Shows booking statistics
- Lists validated tickets
- Requires: `conductor` role

**GET /api/conductor/trip-tickets/:tripId**
- Lists all tickets for a specific trip
- Shows validation summary
- Requires: `conductor`, `admin`, or `depot_manager` role

#### 5. **backend/server.js**
Added route registration:
```javascript
app.use('/api/payment', require('./routes/payment'));
```

## API Endpoints

### Payment & Ticket Generation

#### Verify Payment (Real Payment)
```
POST /api/payment/verify
Authorization: Bearer <token>
Body: {
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx",
  "transactionId": "transaction_id"
}
Response: {
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "transactionId": "...",
    "bookingId": "...",
    "amount": 500
  }
}
```
**Side Effects:**
- Creates tickets in database
- Generates QR codes
- Sends email to passenger
- Updates booking status

#### Mock Payment (Testing)
```
POST /api/payment/mock
Authorization: Bearer <token>
Body: {
  "bookingId": "booking_id"
}
Response: {
  "success": true,
  "data": {
    "tickets": [...]
  }
}
```

### Conductor Ticket Scanning

#### Scan Ticket QR Code
```
POST /api/conductor/scan-ticket
Authorization: Bearer <token>
Role: conductor|admin|depot_manager
Body: {
  "qrPayload": "{...QR code JSON...}",
  "currentStop": "Stop Name (optional)",
  "deviceId": "Device ID (optional)",
  "appVersion": "1.0.0 (optional)"
}
Response: {
  "success": true,
  "message": "Ticket validated successfully",
  "data": {
    "ticket": {
      "pnr": "YTKXXXXX",
      "ticketNumber": "TKT...",
      "passengerName": "John Doe",
      "seatNumber": "A12",
      "boardingStop": "Chennai",
      "destinationStop": "Bangalore",
      "fareAmount": 500,
      "state": "validated",
      "validatedAt": "2025-10-20T..."
    },
    "trip": {
      "tripId": "...",
      "serviceDate": "2025-10-20",
      "startTime": "10:00",
      "bus": {...},
      "driver": {...},
      "conductor": {...}
    }
  }
}
```

#### Get My Trip (Conductor)
```
GET /api/conductor/my-trip
Authorization: Bearer <token>
Role: conductor
Response: {
  "success": true,
  "data": {
    "trip": {...},
    "bookings": 15,
    "validatedTickets": 8,
    "tickets": [...]
  }
}
```

#### Get Trip Tickets
```
GET /api/conductor/trip-tickets/:tripId
Authorization: Bearer <token>
Role: conductor|admin|depot_manager
Response: {
  "success": true,
  "data": {
    "tickets": [...],
    "summary": {
      "total": 15,
      "validated": 8,
      "active": 7,
      "cancelled": 0,
      "expired": 0
    }
  }
}
```

## Email Flow

### Payment Success → Ticket Email

1. **Payment Verified**: Razorpay/Mock payment is verified
2. **Booking Updated**: Status changed to 'paid'
3. **Trip Data Loaded**: Fetches trip with driver/conductor info
4. **Tickets Created**: One ticket per seat in database
5. **QR Codes Generated**: Unique QR code for each ticket
6. **Email Sent**: Beautiful email with QR code sent to passenger
7. **Notification Updated**: Booking marked as email sent

### Email Content

**Subject**: 🎫 Your YATRIK Bus Ticket - {PNR} | {From} to {To}

**Content Includes**:
- Large QR code (300x300px)
- Ticket details in card format
- Route visualization with arrow
- Driver information (name, email, phone)
- Conductor information (name, email, phone)
- Important boarding instructions
- Quick action buttons
- Contact information

## QR Code Structure

### Payload Format
```json
{
  "ver": 1,
  "typ": "YATRIK_TICKET",
  "pnr": "YTKXXXXX",
  "bookingId": "booking_id",
  "tripId": "trip_id",
  "seatNumber": "A12",
  "passengerName": "John Doe",
  "issuedAt": 1729425600000,
  "exp": 1729512000000,
  "sig": "cryptographic_signature"
}
```

### Security Features
- **Signature Verification**: Uses HMAC-SHA256
- **Expiration Check**: Validates timestamp
- **Database Verification**: Cross-checks with stored ticket
- **State Validation**: Checks if cancelled/expired
- **Replay Protection**: Marks as validated after first scan

## Database Schema

### Ticket Model
```javascript
{
  bookingId: ObjectId,
  pnr: String (unique),
  qrPayload: String,
  qrImage: String (base64 data URL),
  expiresAt: Date,
  state: 'issued|active|validated|expired|cancelled',
  passengerName: String,
  seatNumber: String,
  boardingStop: String,
  destinationStop: String,
  fareAmount: Number,
  scannedAt: Date,
  scannedBy: ObjectId (conductor),
  validationHistory: [{
    conductorId: ObjectId,
    validatedAt: Date,
    location: { stopName: String },
    deviceInfo: { deviceId, appVersion }
  }],
  tripDetails: {
    tripId: ObjectId,
    busNumber: String,
    departureTime: Date,
    arrivalTime: Date,
    routeName: String
  },
  ticketNumber: String (unique),
  source: 'web|mobile_app|counter|agent'
}
```

## Usage Guide

### For Passengers

1. **Book a Ticket**: Search and book bus ticket through website/app
2. **Make Payment**: Complete payment via Razorpay
3. **Receive Email**: Check email for ticket with QR code
4. **Save QR Code**: Screenshot or keep email accessible
5. **Show at Boarding**: Display QR code to conductor for scanning
6. **Board Bus**: After validation, take assigned seat

### For Conductors

1. **Login**: Use conductor credentials
2. **View Trip**: Check assigned trip and bookings
3. **Scan Tickets**: Use QR scanner to validate passenger tickets
4. **Verify Details**: Confirm passenger name, seat, destination
5. **Mark Validated**: System automatically marks ticket as validated
6. **Monitor**: Track validated vs. pending tickets

## Testing

### Test the Email System

1. **Install Packages**:
```bash
cd backend
npm install qrcode pdfkit
```

2. **Configure Email** (backend/.env):
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:5173
```

3. **Create Booking & Pay**:
```bash
# Use the frontend to book a ticket
# Or use API:
POST /api/bookings/create
POST /api/payment/mock
```

4. **Check Email**: Look for ticket email with QR code

### Test Conductor Scanning

1. **Get QR Payload**: Copy QR payload from ticket email
2. **Scan Ticket**:
```bash
POST /api/conductor/scan-ticket
{
  "qrPayload": "{...}"
}
```
3. **Verify Response**: Check validation success

## Environment Variables

Add to `backend/.env`:
```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173

# Razorpay (for payments)
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx

# MongoDB
MONGODB_URI=mongodb+srv://...
```

## Benefits

1. **Contactless Ticketing**: No paper tickets needed
2. **Instant Delivery**: Email arrives immediately after payment
3. **Fraud Prevention**: Cryptographically signed QR codes
4. **Easy Verification**: Quick conductor scanning
5. **Professional Experience**: Beautiful, branded emails
6. **Transparency**: Passengers know their crew in advance
7. **Digital Record**: Email serves as receipt and proof
8. **Eco-Friendly**: Reduces paper waste

## Future Enhancements

1. **SMS Delivery**: Send ticket via SMS as backup
2. **WhatsApp Integration**: Send ticket on WhatsApp
3. **Multi-Language**: Support regional languages
4. **Offline Validation**: Allow conductor app to work offline
5. **PDF Attachment**: Include PDF ticket in email
6. **Push Notifications**: Mobile app notifications
7. **Dynamic Crew Updates**: Real-time crew assignment changes
8. **Boarding Pass Style**: Apple Wallet / Google Pay integration

## Support

For issues or questions:
- **Email**: support@yatrikerp.com
- **API Docs**: See backend/routes/conductor.js and backend/routes/payment.js
- **Email Template**: See backend/config/email.js - ticketConfirmationWithQR

---

**Implementation Date**: October 20, 2025  
**Version**: 1.0.0  
**System**: YATRIK ERP Bus Transport Management

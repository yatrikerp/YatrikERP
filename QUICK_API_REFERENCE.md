# 🚀 YATRIK ERP - Quick API Reference

## 🔥 Most Used Endpoints

### Authentication
```bash
POST /api/auth/login          # Login
POST /api/auth/register       # Register
GET  /api/auth/profile        # Get profile
PUT  /api/auth/profile        # Update profile
```

### Search & Booking
```bash
GET  /api/search/autocomplete?q=kochi     # Location search
POST /api/booking/search                  # Search trips
POST /api/booking/                        # Create booking
GET  /api/booking/pnr/:pnr                # Get booking by PNR
GET  /api/booking/seats/:tripId           # Get available seats
```

### Driver Operations
```bash
GET  /api/driver/duties/current           # Get current duty
POST /api/driver/duties/:id/start         # Start duty
POST /api/driver/duties/:id/end           # End duty
POST /api/driver/emergency                # Report emergency
POST /api/driver/duties/:id/eta           # Update ETA
```

### Conductor Operations
```bash
GET  /api/conductor/duties/current        # Get current duty
POST /api/conductor/duties/:id/start      # Start duty
POST /api/conductor/validate-ticket       # Validate QR ticket
POST /api/conductor/vacant-seat           # Mark seat vacant
```

### Routes & Trips
```bash
GET  /api/routes/                         # Get all routes
GET  /api/trips/                          # Get all trips
GET  /api/tracking/buses                  # Get tracked buses
```

### Depot Management
```bash
GET  /api/depot/dashboard                 # Depot dashboard
GET  /api/depot/buses                     # Depot buses
POST /api/depot/buses                     # Add bus
```

---

## 🛠️ Quick Test Commands

### Test API Health
```bash
curl http://localhost:5000/api/health
```

### Create Sample Booking
```bash
curl -X POST http://localhost:5000/api/booking/create-sample
```

### Test Search Autocomplete
```bash
curl "http://localhost:5000/api/search/autocomplete?q=kochi"
```

### Get Routes
```bash
curl http://localhost:5000/api/routes/
```

---

## 📊 Response Examples

### Successful Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

---

## 🔑 Authentication Headers

```bash
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## 🚨 Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

*Quick reference for developers and testers*

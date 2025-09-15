# Driver & Conductor API Endpoints - Complete Reference

## 🔐 Authentication Endpoints

### Driver Login
```bash
POST /api/driver/login
```
**Request Body:**
```json
{
  "username": "driver_username",
  "password": "driver_password",
  "location": {
    "latitude": 9.9312,
    "longitude": 76.2673,
    "accuracy": 10
  }
}
```
**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "driver": {
      "id": "driver_id",
      "driverId": "DRV001",
      "name": "Driver Name",
      "employeeCode": "EMP001",
      "depotId": "depot_id",
      "currentDuty": null
    }
  }
}
```

### Conductor Login
```bash
POST /api/conductor/login
```
**Request Body:**
```json
{
  "username": "conductor_username",
  "password": "conductor_password",
  "location": {
    "latitude": 9.9312,
    "longitude": 76.2673,
    "accuracy": 10
  }
}
```
**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "conductor": {
      "id": "conductor_id",
      "conductorId": "CON001",
      "name": "Conductor Name",
      "employeeCode": "EMP002",
      "depotId": "depot_id",
      "currentDuty": null
    }
  }
}
```

---

## 📋 Duty Management Endpoints

### Get All Driver Duties
```bash
GET /api/driver/duties?status=assigned&date=2025-01-14
```
**Headers:** `Authorization: Bearer <token>`
**Query Parameters:**
- `status`: assigned, started, in-progress, completed, cancelled
- `date`: YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "duty_id",
      "driverId": "driver_id",
      "conductorId": "conductor_id",
      "busId": "bus_id",
      "tripId": "trip_id",
      "routeId": "route_id",
      "depotId": "depot_id",
      "status": "assigned",
      "scheduledStartTime": "2025-01-14T08:00:00.000Z",
      "scheduledEndTime": "2025-01-14T18:00:00.000Z",
      "actualStartTime": null,
      "actualEndTime": null,
      "driverId": {
        "_id": "driver_id",
        "name": "Driver Name",
        "driverId": "DRV001"
      },
      "conductorId": {
        "_id": "conductor_id",
        "name": "Conductor Name",
        "conductorId": "CON001"
      },
      "busId": {
        "_id": "bus_id",
        "busNumber": "KL-07-AB-1234",
        "registrationNumber": "KL07AB1234"
      },
      "tripId": {
        "_id": "trip_id",
        "tripCode": "TRP001"
      },
      "routeId": {
        "_id": "route_id",
        "name": "Kochi - Thiruvananthapuram",
        "routeCode": "RTE001"
      }
    }
  ]
}
```

### Get All Conductor Duties
```bash
GET /api/conductor/duties?status=assigned&date=2025-01-14
```
**Headers:** `Authorization: Bearer <token>`
**Query Parameters:** Same as driver duties

### Get Current Duty (Driver)
```bash
GET /api/driver/duties/current
```
**Headers:** `Authorization: Bearer <token>`
**Response:** Same format as above but single duty object or null

### Get Current Duty (Conductor)
```bash
GET /api/conductor/duties/current
```
**Headers:** `Authorization: Bearer <token>`

---

## 🚌 Trip Management Endpoints

### Start Duty
```bash
POST /api/driver/duties/:dutyId/start
POST /api/conductor/duties/:dutyId/start
```
**Request Body:**
```json
{
  "location": {
    "latitude": 9.9312,
    "longitude": 76.2673,
    "accuracy": 10
  }
}
```

### End Duty
```bash
POST /api/driver/duties/:dutyId/end
POST /api/conductor/duties/:dutyId/end
```
**Request Body:**
```json
{
  "location": {
    "latitude": 9.9312,
    "longitude": 76.2673,
    "accuracy": 10
  },
  "endReason": "completed"
}
```

---

## 🎫 Conductor Specific Endpoints

### Validate QR Ticket
```bash
POST /api/conductor/validate-ticket
```
**Request Body:**
```json
{
  "ticketId": "ticket_id",
  "tripId": "trip_id",
  "scannedAt": "2025-01-14T10:30:00.000Z",
  "conductorId": "conductor_id"
}
```

### Mark Seat as Vacant
```bash
POST /api/conductor/vacant-seat
```
**Request Body:**
```json
{
  "tripId": "trip_id",
  "seatNumber": "A1"
}
```

### Get Trip Passengers
```bash
GET /api/conductor/trips/:tripId/passengers
```

---

## 🚗 Driver Specific Endpoints

### Update ETA
```bash
POST /api/driver/duties/:dutyId/eta
```
**Request Body:**
```json
{
  "eta": "2025-01-14T12:00:00.000Z",
  "location": {
    "latitude": 9.9312,
    "longitude": 76.2673
  }
}
```

### Report Delay
```bash
POST /api/driver/duties/:dutyId/delay
```
**Request Body:**
```json
{
  "reason": "traffic",
  "duration": 30,
  "location": {
    "latitude": 9.9312,
    "longitude": 76.2673
  }
}
```

### Report Emergency
```bash
POST /api/driver/emergency
```
**Request Body:**
```json
{
  "type": "breakdown",
  "description": "Engine failure",
  "severity": "high",
  "location": {
    "latitude": 9.9312,
    "longitude": 76.2673
  }
}
```

---

## 📊 Profile & Information Endpoints

### Get Profile
```bash
GET /api/driver/profile
GET /api/conductor/profile
```
**Headers:** `Authorization: Bearer <token>`

### Update Profile
```bash
PUT /api/driver/profile
PUT /api/conductor/profile
```
**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "+91-9876543210",
  "email": "updated@email.com",
  "address": "Updated Address",
  "emergencyContact": {
    "name": "Emergency Contact",
    "phone": "+91-9876543211",
    "relation": "spouse"
  }
}
```

---

## 🔄 Logout Endpoints

### Driver Logout
```bash
POST /api/driver/logout
```
**Headers:** `Authorization: Bearer <token>`
**Request Body:**
```json
{
  "location": {
    "latitude": 9.9312,
    "longitude": 76.2673
  }
}
```

### Conductor Logout
```bash
POST /api/conductor/logout
```
**Headers:** `Authorization: Bearer <token>`

---

## 📱 Frontend Implementation Flow

### 1. Login Process
```javascript
// Login and get token
const loginResponse = await fetch('/api/driver/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'driver_username',
    password: 'password',
    location: currentLocation
  })
});

const { data } = await loginResponse.json();
localStorage.setItem('token', data.token);
localStorage.setItem('user', JSON.stringify(data.driver));
```

### 2. Fetch Assigned Duties
```javascript
// Get all assigned duties for today
const dutiesResponse = await fetch('/api/driver/duties?date=2025-01-14&status=assigned', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const duties = await dutiesResponse.json();
```

### 3. Get Current Active Duty
```javascript
// Get current duty (if any)
const currentDutyResponse = await fetch('/api/driver/duties/current', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const currentDuty = await currentDutyResponse.json();
```

### 4. Dashboard Flow
1. **Login** → Get token and user info
2. **Fetch Assigned Duties** → Show list of assigned trips
3. **Show Duty Selection** → Let user select a duty to start
4. **Start Duty** → Begin duty and show dashboard
5. **Dashboard Operations** → QR scanning, GPS tracking, etc.
6. **End Duty** → Complete duty and show summary

---

## 🚨 Error Handling

### Common Error Responses
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Status Codes
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `423` - Account Locked
- `500` - Internal Server Error

---

## 🔧 Testing Commands

### Test Driver Login
```bash
curl -X POST http://localhost:5000/api/driver/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "driver_username",
    "password": "password",
    "location": {
      "latitude": 9.9312,
      "longitude": 76.2673
    }
  }'
```

### Test Get Duties
```bash
curl -X GET "http://localhost:5000/api/driver/duties?date=2025-01-14" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Get Current Duty
```bash
curl -X GET http://localhost:5000/api/driver/duties/current \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

*Complete API reference for driver and conductor operations*

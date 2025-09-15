# YATRIK ERP - Complete API Routes Documentation

## Base URL: `http://localhost:5000/api`

---

## 🔐 Authentication & Security

### `/api/auth`
- `POST /register` - User registration (name, email, phone, password, role)
- `POST /login` - User login (email/phone, password)
- `POST /logout` - User logout (requires auth)
- `POST /refresh` - Refresh JWT token
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `GET /profile` - Get user profile (requires auth)
- `PUT /profile` - Update user profile (requires auth)
- `POST /change-password` - Change password (requires auth)
- `GET /verify-email/:token` - Verify email address
- `POST /resend-verification` - Resend email verification

### `/api/depot-auth`
- `POST /login` - Depot manager authentication
- `POST /logout` - Depot manager logout
- `GET /profile` - Get depot manager profile
- `PUT /profile` - Update depot manager profile

---

## 👥 User Management

### `/api/admin`
- `GET /dashboard` - Admin dashboard data
- `GET /users` - Get all users (admin only)
- `POST /users` - Create new user (admin only)
- `PUT /users/:id` - Update user (admin only)
- `DELETE /users/:id` - Delete user (admin only)
- `GET /depots` - Get all depots
- `POST /depots` - Create new depot
- `PUT /depots/:id` - Update depot
- `DELETE /depots/:id` - Delete depot
- `GET /reports` - Generate system reports
- `GET /analytics` - System analytics

---

## 🚌 Transportation Management

### `/api/routes`
- `GET /` - Get all routes (with filters: fromCity, toCity, depotId, status)
- `GET /cities` - Get all cities from routes
- `POST /` - Create new route (admin/depot manager)
- `PUT /:id` - Update route (admin/depot manager)
- `DELETE /:id` - Delete route (admin only)
- `GET /:id` - Get route details
- `GET /:id/stops` - Get route stops
- `POST /:id/stops` - Add stops to route

### `/api/trips`
- `GET /` - Get all trips (with filters)
- `POST /` - Create new trip (admin/depot manager)
- `PUT /:id` - Update trip
- `DELETE /:id` - Delete trip
- `GET /:id` - Get trip details
- `GET /search` - Search trips by route and date
- `POST /:id/schedule` - Schedule trip

### `/api/tracking`
- `GET /buses` - Get all tracked buses
- `GET /bus/:busId` - Get bus location
- `POST /bus/:busId/ping` - Update bus location (GPS ping)
- `GET /route/:routeId` - Get route tracking data
- `POST /emergency` - Report emergency

---

## 🎫 Booking & Reservations

### `/api/booking`
- `POST /` - Create new booking (requires auth)
- `POST /confirm` - Confirm booking after payment
- `GET /:id` - Get booking by ID
- `PUT /:id/confirm` - Confirm booking (legacy)
- `PUT /:id/cancel` - Cancel booking
- `GET /user/:userId` - Get user bookings
- `GET /depot/:depotId` - Get depot bookings
- `GET /stats` - Get booking statistics
- `GET /refund/:id` - Calculate refund
- `GET /test` - Test endpoint
- `POST /create-sample` - Create sample booking for testing
- `GET /pnr/:pnr` - Get booking by PNR
- `POST /check-in/:id` - Check in passenger
- `GET /search/:reference` - Search booking by reference
- `POST /search` - Search trips for booking
- `GET /seats/:tripId` - Get available seats for trip

### `/api/seats`
- `GET /:tripId` - Get seat availability
- `POST /reserve` - Reserve seats
- `PUT /release` - Release seat reservation

---

## 👨‍💼 Staff Management

### `/api/driver`
- `POST /login` - Driver login with attendance
- `POST /logout` - Driver logout with attendance
- `GET /profile` - Get driver profile
- `PUT /profile` - Update driver profile
- `GET /duties` - Get driver's duties
- `GET /duties/current` - Get current duty
- `POST /duties/:dutyId/start` - Start duty
- `POST /duties/:dutyId/end` - End duty
- `POST /duties/:dutyId/break` - Take break
- `POST /duties/:dutyId/break/end` - End break
- `POST /duties/:dutyId/delay` - Report delay
- `POST /duties/:dutyId/incident` - Report incident
- `GET /attendance` - Get attendance history
- `GET /activities` - Get activity log
- `GET /performance` - Get performance metrics
- `GET /depot` - Get drivers for depot (depot manager)
- `GET /all` - Get all drivers (admin/depot manager)
- `POST /` - Create new driver (admin/depot manager)
- `PUT /:id` - Update driver (admin only)
- `DELETE /:id` - Delete driver (admin only)
- `POST /emergency` - Report emergency
- `POST /duties/:dutyId/eta` - Update ETA
- `POST /duties/:dutyId/delay` - Report delay

### `/api/conductor`
- `POST /login` - Conductor login with attendance
- `POST /logout` - Conductor logout with attendance
- `GET /profile` - Get conductor profile
- `PUT /profile` - Update conductor profile
- `GET /duties` - Get conductor's duties
- `GET /duties/current` - Get current duty
- `POST /duties/:dutyId/start` - Start duty
- `POST /duties/:dutyId/end` - End duty
- `POST /duties/:dutyId/break` - Take break
- `POST /duties/:dutyId/break/end` - End break
- `POST /duties/:dutyId/delay` - Report delay
- `POST /duties/:dutyId/incident` - Report incident
- `GET /attendance` - Get attendance history
- `GET /activities` - Get activity log
- `GET /performance` - Get performance metrics
- `GET /depot` - Get conductors for depot (depot manager)
- `GET /all` - Get all conductors (admin/depot manager)
- `POST /` - Create new conductor (admin/depot manager)
- `PUT /:id` - Update conductor (admin only)
- `DELETE /:id` - Delete conductor (admin only)
- `GET /trips/:tripId/passengers` - Get passenger list for trip
- `POST /validate-ticket` - Validate QR ticket
- `POST /vacant-seat` - Mark seat as vacant

---

## 🏢 Depot Operations

### `/api/depot`
- `GET /dashboard` - Depot dashboard data
- `GET /buses` - Get depot buses
- `POST /buses` - Add new bus to depot
- `PUT /buses/:id` - Update bus
- `DELETE /buses/:id` - Remove bus
- `GET /routes` - Get depot routes
- `POST /routes` - Create route
- `GET /schedules` - Get depot schedules
- `POST /schedules` - Create schedule
- `GET /staff` - Get depot staff
- `POST /staff` - Add staff member
- `GET /reports` - Generate depot reports
- `GET /analytics` - Depot analytics
- `GET /profile` - Get depot profile
- `PUT /profile` - Update depot profile

---

## 💳 Financial Services

### `/api/payments`
- `POST /create-order` - Create payment order
- `POST /verify` - Verify payment
- `POST /refund` - Process refund
- `GET /transactions` - Get payment transactions
- `GET /:id` - Get payment details
- `POST /callback` - Payment gateway callback

---

## 🔍 Search & Discovery

### `/api/search`
- `GET /locations` - Location autosuggest (requires query parameter 'q')
- `GET /autocomplete` - Enhanced autocomplete for search (requires query parameter 'q')

---

## 📱 Passenger Services

### `/api/passenger`
- `GET /dashboard` - Passenger dashboard
- `GET /bookings` - Get passenger bookings
- `POST /bookings` - Create new booking
- `GET /profile` - Get passenger profile
- `PUT /profile` - Update passenger profile
- `GET /tickets` - Get passenger tickets
- `POST /feedback` - Submit feedback

---

## 🔔 Notifications & Support

### `/api/notifications`
- `GET /` - Get user notifications
- `POST /mark-read` - Mark notification as read
- `POST /mark-all-read` - Mark all notifications as read
- `DELETE /:id` - Delete notification

---

## 📊 System Status & Health

### `/api/status`
- `GET /test` - Test endpoint
- `GET /services` - Get all service definitions
- `GET /health` - System health check

---

## 🚌 Bus Schedule Management

### `/api/bus-schedule`
- `GET /` - Get bus schedules
- `POST /` - Create bus schedule
- `PUT /:id` - Update schedule
- `DELETE /:id` - Delete schedule
- `GET /:id` - Get schedule details

---

## 🔧 Additional Routes

### Health Check
- `GET /api/health` - System health check with database status

---

## 📝 Authentication Requirements

- **Public Routes**: Registration, login, search, some booking endpoints
- **Authenticated Routes**: Most user-specific operations require JWT token
- **Role-Based Access**:
  - `admin` - Full system access
  - `depot_manager` - Depot-specific operations
  - `driver` - Driver operations only
  - `conductor` - Conductor operations only
  - `passenger` - Booking and profile operations

## 🚀 Rate Limiting

- **Search endpoints**: 1 request per 800ms
- **Authentication**: Standard rate limiting applied
- **General API**: Standard Express rate limiting

## 📋 Response Format

All API responses follow this format:
```json
{
  "success": true/false,
  "message": "Response message",
  "data": {}, // Response data
  "error": "Error message if any"
}
```

## 🔒 Error Handling

- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

---

*Last Updated: $(date)*
*Total Routes: 100+ endpoints across 15+ modules*

# 📱 Flutter App - Web App Parity Plan

## 🎯 Goal
Make the Flutter mobile app UI and functionality identical to the web app.

## 📋 Current Status

### ✅ Already Implemented
- Splash screen with animations
- Landing page with search
- Login/Register screens
- Basic passenger home screen
- Conductor dashboard
- Trip search functionality
- Booking flow
- Authentication (Email/Password + Google Sign-In)

### 🔄 Needs Updates to Match Web App

## 🏗️ Implementation Plan

### Phase 1: Passenger Dashboard (Priority: HIGH)
**Web App Features:**
- Dashboard with stats (Total Bookings, Upcoming Trips, Completed Trips)
- Quick actions (Search Trips, My Bookings, Track Bus)
- Recent bookings list with status
- Upcoming trips section
- Profile summary card

**Flutter Updates Needed:**
1. Add dashboard stats cards
2. Add quick action buttons
3. Add recent bookings list
4. Add upcoming trips section
5. Add profile card with avatar

### Phase 2: Trip Search & Booking (Priority: HIGH)
**Web App Features:**
- Advanced search filters (Date, Time, Bus Type, Price Range)
- Trip results with details (Duration, Stops, Amenities)
- Seat selection with visual layout
- Boarding/Dropping point selection
- Payment integration
- Booking confirmation

**Flutter Updates Needed:**
1. Enhanced search UI with filters
2. Trip cards matching web design
3. Interactive seat selection
4. Boarding point picker
5. Payment gateway integration
6. Booking confirmation screen

### Phase 3: My Bookings (Priority: HIGH)
**Web App Features:**
- Tabs: Upcoming, Completed, Cancelled
- Booking cards with QR code
- Download ticket option
- Cancel booking option
- Booking details modal
- Track bus option

**Flutter Updates Needed:**
1. Tabbed booking list
2. Booking cards with QR codes
3. Ticket download (PDF)
4. Cancel booking flow
5. Booking details screen
6. Live tracking integration

### Phase 4: Profile & Settings (Priority: MEDIUM)
**Web App Features:**
- Profile information
- Edit profile
- Change password
- Notification preferences
- Payment methods
- Travel history
- Logout

**Flutter Updates Needed:**
1. Profile screen with avatar
2. Edit profile form
3. Change password
4. Settings screen
5. Payment methods management
6. Travel history

### Phase 5: Conductor Features (Priority: MEDIUM)
**Web App Features:**
- Trip assignment view
- Passenger list
- Ticket scanning (QR)
- Mark attendance
- Trip status updates
- Revenue collection

**Flutter Updates Needed:**
1. Enhanced conductor dashboard
2. Passenger list screen
3. QR scanner integration
4. Attendance marking
5. Trip status controls
6. Revenue tracking

### Phase 6: Additional Features (Priority: LOW)
**Web App Features:**
- Notifications
- Help & Support
- FAQs
- Terms & Conditions
- Privacy Policy
- Contact Us

**Flutter Updates Needed:**
1. Notifications screen
2. Help center
3. FAQ screen
4. Legal pages
5. Contact form

## 🎨 UI Components to Match

### Colors & Theme
- ✅ Brand Pink: #E91E63
- ✅ Brand Green: #2E7D32
- ✅ Brand Teal: #00ACC1
- ✅ Gradients: Pink → Green
- ✅ Text colors: Slate shades
- ✅ Shadows and elevations

### Typography
- ✅ Headers: Bold, 24-32px
- ✅ Body: Regular, 14-16px
- ✅ Captions: 12px
- ✅ Font: System default (matches web)

### Components
- Cards with shadows
- Gradient buttons
- Icon buttons
- Input fields with icons
- Chips and badges
- Bottom sheets
- Modals
- Snackbars
- Loading indicators

## 📱 Screen-by-Screen Breakdown

### 1. Passenger Home Screen
```
┌─────────────────────────┐
│ Header (Logo + Profile) │
├─────────────────────────┤
│ Welcome Card            │
│ - User name             │
│ - Quick stats           │
├─────────────────────────┤
│ Stats Cards (3 cols)    │
│ - Total Bookings        │
│ - Upcoming Trips        │
│ - Completed Trips       │
├─────────────────────────┤
│ Quick Actions (Grid)    │
│ - Search Trips          │
│ - My Bookings           │
│ - Track Bus             │
│ - Profile               │
├─────────────────────────┤
│ Upcoming Trips          │
│ - Trip cards list       │
├─────────────────────────┤
│ Recent Bookings         │
│ - Booking cards         │
└─────────────────────────┘
```

### 2. Trip Search Screen
```
┌─────────────────────────┐
│ Search Form             │
│ - From                  │
│ - To                    │
│ - Date                  │
│ - Filters button        │
├─────────────────────────┤
│ Filter Chips            │
│ - Bus Type              │
│ - Price Range           │
│ - Departure Time        │
├─────────────────────────┤
│ Trip Results            │
│ ┌─────────────────────┐ │
│ │ Trip Card           │ │
│ │ - Bus info          │ │
│ │ - Time & duration   │ │
│ │ - Price             │ │
│ │ - Seats available   │ │
│ │ - Amenities         │ │
│ │ [Book Now]          │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### 3. Booking Details Screen
```
┌─────────────────────────┐
│ Trip Summary            │
│ - Route                 │
│ - Date & Time           │
│ - Duration              │
├─────────────────────────┤
│ Seat Selection          │
│ - Visual seat layout    │
│ - Selected seats        │
├─────────────────────────┤
│ Boarding Point          │
│ - Dropdown picker       │
├─────────────────────────┤
│ Dropping Point          │
│ - Dropdown picker       │
├─────────────────────────┤
│ Passenger Details       │
│ - Name, Age, Gender     │
├─────────────────────────┤
│ Price Breakdown         │
│ - Base fare             │
│ - Taxes                 │
│ - Total                 │
├─────────────────────────┤
│ [Proceed to Payment]    │
└─────────────────────────┘
```

### 4. My Bookings Screen
```
┌─────────────────────────┐
│ Tabs                    │
│ [Upcoming] [Completed]  │
│ [Cancelled]             │
├─────────────────────────┤
│ Booking Cards           │
│ ┌─────────────────────┐ │
│ │ PNR: ABC123         │ │
│ │ Route info          │ │
│ │ Date & Time         │ │
│ │ Status badge        │ │
│ │ QR Code             │ │
│ │ [View] [Cancel]     │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### 5. Profile Screen
```
┌─────────────────────────┐
│ Profile Header          │
│ - Avatar                │
│ - Name                  │
│ - Email                 │
│ - Phone                 │
├─────────────────────────┤
│ Menu Items              │
│ - Edit Profile          │
│ - Change Password       │
│ - Payment Methods       │
│ - Travel History        │
│ - Notifications         │
│ - Help & Support        │
│ - Settings              │
│ - Logout                │
└─────────────────────────┘
```

## 🔧 Technical Implementation

### API Integration
All screens will use the production backend:
- Base URL: `https://yatrikerp.onrender.com`
- Endpoints match web app exactly
- Same request/response format
- Same authentication flow

### State Management
- Provider pattern (already implemented)
- AuthProvider for authentication
- BookingProvider for bookings
- TripProvider for trips
- Add more providers as needed

### Navigation
- Named routes
- Bottom navigation bar
- Drawer for additional options
- Modal bottom sheets for actions

### Data Persistence
- SharedPreferences for user data
- Secure storage for tokens
- Cache for offline support

## 📊 Progress Tracking

### Phase 1: Passenger Dashboard
- [ ] Update home screen layout
- [ ] Add stats cards
- [ ] Add quick actions
- [ ] Add recent bookings
- [ ] Add upcoming trips
- [ ] Add profile card

### Phase 2: Trip Search & Booking
- [ ] Enhanced search UI
- [ ] Trip results screen
- [ ] Seat selection screen
- [ ] Boarding point picker
- [ ] Payment integration
- [ ] Confirmation screen

### Phase 3: My Bookings
- [ ] Tabbed layout
- [ ] Booking cards
- [ ] QR code generation
- [ ] Ticket download
- [ ] Cancel booking
- [ ] Booking details

### Phase 4: Profile & Settings
- [ ] Profile screen
- [ ] Edit profile
- [ ] Change password
- [ ] Settings
- [ ] Payment methods
- [ ] Travel history

### Phase 5: Conductor Features
- [ ] Enhanced dashboard
- [ ] Passenger list
- [ ] QR scanner
- [ ] Attendance
- [ ] Trip controls
- [ ] Revenue tracking

### Phase 6: Additional Features
- [ ] Notifications
- [ ] Help center
- [ ] FAQ
- [ ] Legal pages
- [ ] Contact form

## 🎯 Success Criteria

1. ✅ UI matches web app design exactly
2. ✅ All web app features available in mobile
3. ✅ Same API endpoints and data format
4. ✅ Smooth animations and transitions
5. ✅ Responsive to different screen sizes
6. ✅ Offline support where applicable
7. ✅ Performance optimized
8. ✅ No bugs or crashes

## 📝 Notes

- Focus on passenger features first (most used)
- Conductor features can be phase 2
- Admin features stay web-only
- Maintain consistent branding
- Test on multiple devices
- Ensure accessibility

---

**Estimated Timeline:** 2-3 weeks for full parity
**Priority:** Start with Phase 1 (Passenger Dashboard)

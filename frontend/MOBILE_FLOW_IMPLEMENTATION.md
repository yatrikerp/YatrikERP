# Mobile Landing Flow Implementation

## Overview
This implementation adds a complete mobile landing flow to the YATRIK ERP system while preserving all existing UI styles and components. The mobile flow is conditionally activated for devices with screen width ≤768px.

## Architecture

### Core Components

1. **MobileLandingPage** (`src/mobile/LandingPage.jsx`)
   - Main mobile landing page with search functionality
   - Integrates with existing passenger search API (`/api/passenger/searchTrips`)
   - Saves recent searches to localStorage
   - Provides quick action tiles for common tasks

2. **RoleSwitcher** (`src/components/RoleSwitcher.jsx`)
   - Bottom drawer for role selection (Passenger/Conductor/Driver)
   - Persists selected role in localStorage
   - Redirects to appropriate mobile flow

3. **Mobile Flow Components**
   - `PassengerFlow.jsx` - Imports existing `MobilePassengerDashboard`
   - `ConductorFlow.jsx` - Imports existing `ConductorDashboard`
   - `DriverFlow.jsx` - Imports existing `DriverDashboard`

4. **Supporting Pages**
   - `BookingsPage.jsx` - My bookings management
   - `TrackPage.jsx` - Bus tracking functionality
   - `OffersPage.jsx` - Offers and deals
   - `WalletPage.jsx` - Wallet management

### Mobile Detection

- **useMediaQuery Hook** (`src/hooks/useMediaQuery.js`)
  - Detects screen width ≤768px
  - Responsive to window resize events

- **MobileWrapper** (`src/components/MobileWrapper.jsx`)
  - Conditionally renders mobile or desktop landing page
  - Uses existing desktop `LandingPage` for desktop users

## API Integration

### Search Functionality
```javascript
// Connects to existing passenger search API
const response = await apiFetch('/api/passenger/searchTrips', {
  method: 'POST',
  body: JSON.stringify({
    from: searchData.from,
    to: searchData.to,
    date: searchData.date,
    busType: searchData.busType || 'all'
  })
});
```

### Navigation Flow
After successful search → Redirects to existing passenger results page:
```javascript
navigate('/passenger/search-results', {
  state: {
    searchParams: searchData,
    tripResults: response.data
  }
});
```

## Routing Structure

```
/mobile                    → MobileLandingPage
/mobile/passenger          → PassengerFlow (uses MobilePassengerDashboard)
/mobile/conductor          → ConductorFlow (uses ConductorDashboard)
/mobile/driver             → DriverFlow (uses DriverDashboard)
/mobile/bookings           → BookingsPage
/mobile/track              → TrackPage
/mobile/offers             → OffersPage
/mobile/wallet             → WalletPage
```

## Data Persistence

### localStorage Usage
- `recentSearches` - Last 3 search queries
- `selectedRole` - User's selected role preference

## Mobile-Only Activation

The mobile flow is automatically activated when:
1. Screen width ≤768px
2. User visits `/mobile` route
3. Desktop users continue to see existing `LandingPage`

## Existing Component Reuse

### No Style Changes
- All existing components imported as-is
- No modifications to existing UI/styling
- Preserves all current functionality

### Component Mapping
```javascript
// Mobile flows directly import existing components
PassengerFlow → MobilePassengerDashboard
ConductorFlow → ConductorDashboard  
DriverFlow → DriverDashboard
```

## Features

### Search & Booking Flow
1. **Search Form**
   - From/To locations
   - Journey date
   - Bus type (optional)
   - Connects to existing API

2. **Recent Searches**
   - Displays last 3 searches
   - Click to reuse previous searches
   - Persistent across sessions

3. **Quick Actions**
   - My Bookings → `/mobile/bookings`
   - Track Bus → `/mobile/track`
   - Offers → `/mobile/offers`
   - Wallet → `/mobile/wallet`

### Role-Based Access
- **Passenger**: Search → Results → Book → Seat Select → QR Wallet
- **Conductor**: Duty Select → Scan QR → Passenger List → End Duty
- **Driver**: Assigned Route → Start GPS → Update Status

## Implementation Benefits

1. **Zero Breaking Changes**
   - All existing components unchanged
   - Desktop experience preserved
   - Existing APIs and flows intact

2. **Mobile Optimization**
   - Touch-friendly interface
   - Responsive design
   - Mobile-specific navigation

3. **Seamless Integration**
   - Uses existing authentication
   - Leverages current API endpoints
   - Maintains data consistency

## Testing

### Mobile Testing
- Visit `http://localhost:5173/mobile` on mobile device
- Test search functionality with existing API
- Verify role switching and navigation
- Check localStorage persistence

### Desktop Testing
- Visit `http://localhost:5173/mobile` on desktop
- Should show mobile interface (responsive)
- Desktop landing page still available at `/`

## Future Enhancements

1. **Push Notifications**
   - Integration with existing notification system
   - Trip updates and alerts

2. **Offline Support**
   - Cache recent searches
   - Offline booking queue

3. **Enhanced Tracking**
   - Real-time GPS integration
   - Live bus locations

## File Structure

```
src/
├── mobile/
│   ├── LandingPage.jsx
│   ├── PassengerFlow.jsx
│   ├── ConductorFlow.jsx
│   ├── DriverFlow.jsx
│   ├── BookingsPage.jsx
│   ├── TrackPage.jsx
│   ├── OffersPage.jsx
│   └── WalletPage.jsx
├── components/
│   ├── RoleSwitcher.jsx
│   └── MobileWrapper.jsx
└── hooks/
    └── useMediaQuery.js
```

This implementation provides a complete mobile landing flow while maintaining full compatibility with existing components and preserving all current functionality.


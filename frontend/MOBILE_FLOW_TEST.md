# Mobile Flow Testing Guide

## Test URLs

### Primary Mobile Landing
- `http://localhost:5173/mobile` - New mobile landing page with search and role switching

### Mobile Flow Routes
- `http://localhost:5173/mobile/passenger` - Passenger dashboard (requires login)
- `http://localhost:5173/mobile/conductor` - Conductor dashboard (requires login)
- `http://localhost:5173/mobile/driver` - Driver dashboard (requires login)
- `http://localhost:5173/mobile/bookings` - My bookings page
- `http://localhost:5173/mobile/track` - Bus tracking page
- `http://localhost:5173/mobile/offers` - Offers and deals page
- `http://localhost:5173/mobile/wallet` - Wallet management page

## Testing Checklist

### 1. Mobile Landing Page (`/mobile`)
- [ ] Hero section displays correctly
- [ ] Search form has all fields (From, To, Date, Bus Type)
- [ ] Search button connects to existing API
- [ ] Recent searches save to localStorage
- [ ] Quick action tiles navigate correctly
- [ ] Role switcher opens and functions
- [ ] Role selection persists in localStorage

### 2. Search Functionality
- [ ] Form validation works (required fields)
- [ ] API call to `/api/passenger/searchTrips` succeeds
- [ ] Redirects to existing passenger results page
- [ ] Search parameters passed correctly
- [ ] Recent searches display and work

### 3. Role-Based Flows
- [ ] Passenger flow loads existing `MobilePassengerDashboard`
- [ ] Conductor flow loads existing `ConductorDashboard`
- [ ] Driver flow loads existing `DriverDashboard`
- [ ] Authentication required for all role flows
- [ ] Redirects to login when not authenticated

### 4. Supporting Pages
- [ ] Bookings page shows mock data
- [ ] Track page accepts tracking codes
- [ ] Offers page displays offers
- [ ] Wallet page shows balance and transactions
- [ ] All pages have back navigation to `/mobile`

### 5. Mobile Responsiveness
- [ ] Interface works on mobile devices (≤768px)
- [ ] Touch-friendly buttons and inputs
- [ ] Proper spacing and sizing
- [ ] Navigation drawer works on mobile

### 6. Data Persistence
- [ ] Recent searches persist across sessions
- [ ] Selected role persists across sessions
- [ ] localStorage operations work correctly

### 7. Integration with Existing System
- [ ] Uses existing authentication system
- [ ] Connects to existing passenger search API
- [ ] Imports existing dashboard components
- [ ] No conflicts with desktop functionality

## Test Data

### Sample Search
```
From: Kochi
To: Bangalore
Date: [Today's date + 1 day]
Bus Type: AC
```

### Sample Tracking Code
```
KL-01-AB-1234
```

## Expected Behaviors

### Successful Search
1. Form submission calls API
2. Loading state shown
3. Redirect to `/passenger/search-results` with data
4. Search saved to recent searches

### Role Selection
1. Click user icon in header
2. Role switcher drawer opens
3. Select role (Passenger/Conductor/Driver)
4. Redirect to appropriate mobile flow
5. Role saved to localStorage

### Navigation
1. All pages have back button to `/mobile`
2. Quick action tiles navigate to correct pages
3. Mobile menu includes all role dashboards

## Browser Testing

### Mobile View
- Use Chrome DevTools mobile simulation
- Test on actual mobile devices
- Verify touch interactions work

### Desktop View
- Should show mobile interface at `/mobile`
- Desktop landing page still available at `/`
- No layout conflicts

## API Testing

### Search API
```bash
# Test the search endpoint
curl -X POST http://localhost:3000/api/passenger/searchTrips \
  -H "Content-Type: application/json" \
  -d '{
    "from": "Kochi",
    "to": "Bangalore", 
    "date": "2024-01-20",
    "busType": "AC"
  }'
```

## Troubleshooting

### Common Issues
1. **Build Errors**: Check all imports are correct
2. **API Errors**: Verify backend is running
3. **Navigation Issues**: Check route definitions in App.js
4. **Mobile Detection**: Test useMediaQuery hook
5. **localStorage**: Check browser developer tools

### Debug Steps
1. Open browser developer tools
2. Check console for errors
3. Verify network requests
4. Test localStorage operations
5. Check component rendering

## Performance

### Expected Performance
- Initial load: <2 seconds
- Search API call: <3 seconds
- Navigation between pages: <1 second
- Mobile responsiveness: Immediate

### Optimization Notes
- Components are lazy-loaded where appropriate
- API responses cached
- localStorage operations are efficient
- Mobile-specific optimizations applied


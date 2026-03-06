# AI Features Testing Checklist

## Pre-Testing Setup

- [ ] Backend server is running
- [ ] API endpoints are accessible
- [ ] Admin user credentials available
- [ ] Test data exists in database (routes, depots, crew)
- [ ] Flutter app dependencies installed (`flutter pub get`)
- [ ] API base URL configured in `api_config.dart`

## 1. Authentication & Navigation

### Login
- [ ] Login as admin user
- [ ] Verify token is stored
- [ ] Check user role is admin/depot_manager

### Navigation
- [ ] Navigate to Admin Dashboard
- [ ] Verify "AI-Powered Features" section visible
- [ ] Click "AI Scheduling Dashboard"
- [ ] Verify AI dashboard loads successfully

## 2. AI Scheduling Dashboard

### Initial Load
- [ ] Dashboard loads without errors
- [ ] Analytics overview displays
- [ ] All feature cards visible
- [ ] Icons and colors render correctly

### Analytics Display
- [ ] Demand predictions count shows
- [ ] Average confidence displays
- [ ] Fatigue records count shows
- [ ] High fatigue count displays

### Feature Cards
- [ ] Predictive Demand Model card clickable
- [ ] AI Scheduling Engine card clickable
- [ ] Crew Fatigue Management card clickable
- [ ] Dynamic Fare Optimization card clickable
- [ ] Smart Concession Verification card clickable

### Refresh
- [ ] Pull down to refresh works
- [ ] Loading indicator shows
- [ ] Data updates after refresh

## 3. Predictive Demand Model

### Form Validation
- [ ] Route ID field required
- [ ] Date picker works
- [ ] Time slot dropdown works
- [ ] Form validates before submission

### Prediction Request
- [ ] Enter valid route ID
- [ ] Select future date
- [ ] Choose time slot
- [ ] Click "Predict Demand"
- [ ] Loading indicator shows

### Results Display
- [ ] Predicted passengers count shows
- [ ] Confidence score displays
- [ ] Demand level shows with correct color
- [ ] All data formatted correctly

### Error Handling
- [ ] Invalid route ID shows error
- [ ] Network error shows message
- [ ] Error can be dismissed
- [ ] Retry works after error

## 4. Crew Fatigue Management

### Form Validation
- [ ] Depot ID field required
- [ ] Date picker works
- [ ] Form validates before submission

### Report Generation
- [ ] Enter valid depot ID
- [ ] Select report date
- [ ] Click "Generate Report"
- [ ] Loading indicator shows

### Statistics Display
- [ ] Total records count shows
- [ ] Average fatigue score displays
- [ ] High fatigue count shows
- [ ] Ineligible count displays
- [ ] All stats formatted correctly

### Crew Details
- [ ] Crew list displays
- [ ] Fatigue scores show with colors
- [ ] Names and employee codes visible
- [ ] Warning icons for high fatigue
- [ ] List scrolls if many crew members

### Color Coding
- [ ] Green for low fatigue (<50)
- [ ] Orange for medium fatigue (50-69)
- [ ] Red for high fatigue (≥70)

### Error Handling
- [ ] Invalid depot ID shows error
- [ ] No data shows appropriate message
- [ ] Network error handled gracefully

## 5. AI Scheduling Engine

### Form Validation
- [ ] Depot ID field required
- [ ] Start date picker works
- [ ] End date picker works
- [ ] End date must be after start date
- [ ] Form validates before submission

### Schedule Generation
- [ ] Enter valid depot ID
- [ ] Select date range (e.g., 7 days)
- [ ] Click "Generate Schedule"
- [ ] Loading indicator shows
- [ ] Process may take 2-5 seconds

### Results Display
- [ ] Success message shows
- [ ] Fitness score displays
- [ ] Generations count shows
- [ ] Execution time displays
- [ ] Optimization details visible
- [ ] Improvement percentage shows

### Performance
- [ ] Schedule generates within reasonable time
- [ ] App remains responsive during generation
- [ ] No UI freezing

### Error Handling
- [ ] Invalid depot ID shows error
- [ ] Insufficient data shows message
- [ ] Timeout handled gracefully

## 6. Dynamic Fare Optimization (Placeholder)

- [ ] Screen loads
- [ ] Placeholder message displays
- [ ] Icon and description visible
- [ ] Back navigation works

## 7. Smart Concession Verification (Placeholder)

- [ ] Screen loads
- [ ] Placeholder message displays
- [ ] Icon and description visible
- [ ] Back navigation works

## 8. General UI/UX

### Loading States
- [ ] Loading indicators show during API calls
- [ ] Buttons disabled while loading
- [ ] Loading text/spinner visible

### Error States
- [ ] Error messages display clearly
- [ ] Error icon shows
- [ ] Retry button available
- [ ] Error dismissible

### Success States
- [ ] Success messages show
- [ ] Data displays correctly
- [ ] UI updates immediately

### Navigation
- [ ] Back button works on all screens
- [ ] Navigation transitions smooth
- [ ] No navigation errors

### Responsiveness
- [ ] Works on different screen sizes
- [ ] Portrait orientation works
- [ ] Landscape orientation works (if supported)
- [ ] Text readable on all screens

## 9. Performance Testing

### API Response Times
- [ ] Demand prediction < 1 second
- [ ] Fatigue calculation < 1 second
- [ ] Genetic scheduling < 10 seconds
- [ ] Analytics < 1 second

### App Performance
- [ ] Screen transitions smooth
- [ ] No lag when scrolling
- [ ] Forms responsive
- [ ] No memory leaks

### Network Handling
- [ ] Works on WiFi
- [ ] Works on mobile data
- [ ] Handles slow connections
- [ ] Timeout after reasonable time

## 10. Edge Cases

### Empty Data
- [ ] No predictions available
- [ ] No crew in depot
- [ ] No routes for scheduling
- [ ] Empty analytics

### Invalid Input
- [ ] Non-existent route ID
- [ ] Non-existent depot ID
- [ ] Past dates (where not allowed)
- [ ] Invalid date ranges

### Network Issues
- [ ] No internet connection
- [ ] Server unreachable
- [ ] API timeout
- [ ] 500 server error

### Authentication
- [ ] Expired token handled
- [ ] Unauthorized access blocked
- [ ] Token refresh works

## 11. Data Accuracy

### Demand Prediction
- [ ] Predictions match backend
- [ ] Confidence scores reasonable
- [ ] Demand levels correct
- [ ] Time slots accurate

### Crew Fatigue
- [ ] Fatigue scores match backend
- [ ] Statistics calculated correctly
- [ ] Crew details accurate
- [ ] Eligibility status correct

### Genetic Scheduling
- [ ] Schedule results match backend
- [ ] Fitness scores accurate
- [ ] Performance metrics correct
- [ ] Optimization data valid

## 12. Security Testing

### Authentication
- [ ] Requires valid token
- [ ] Admin role required
- [ ] Token stored securely
- [ ] Logout clears token

### Authorization
- [ ] Non-admin users blocked
- [ ] Depot managers have access
- [ ] Passengers cannot access
- [ ] Conductors cannot access

### Data Protection
- [ ] No sensitive data in logs
- [ ] API calls use HTTPS
- [ ] Tokens not exposed

## 13. Accessibility

### Text
- [ ] All text readable
- [ ] Font sizes appropriate
- [ ] Contrast sufficient
- [ ] Labels clear

### Navigation
- [ ] Buttons large enough
- [ ] Touch targets adequate
- [ ] Navigation intuitive

### Feedback
- [ ] Visual feedback on actions
- [ ] Error messages clear
- [ ] Success confirmations visible

## 14. Documentation

- [ ] Quick start guide accurate
- [ ] Integration guide complete
- [ ] API endpoints documented
- [ ] Code comments helpful

## Test Results Summary

### Passed: _____ / _____
### Failed: _____ / _____
### Blocked: _____ / _____

## Issues Found

| Issue # | Screen | Description | Severity | Status |
|---------|--------|-------------|----------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

## Notes

```
Add any additional observations, suggestions, or comments here.
```

## Sign-off

- **Tester Name**: _______________
- **Date**: _______________
- **Overall Status**: ⬜ Pass ⬜ Fail ⬜ Pass with Issues
- **Ready for Production**: ⬜ Yes ⬜ No ⬜ With Fixes

---

**Testing Version**: 1.0.0
**Last Updated**: March 2, 2026

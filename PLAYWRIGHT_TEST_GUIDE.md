# YATRIK ERP - Playwright E2E Test Guide

## 📋 Overview

This document provides comprehensive information about the Playwright end-to-end tests for YATRIK ERP, covering login, logout, and booking functionality.

## 🎯 Test Coverage

### 1. Login Functionality Tests
- ✅ Display login page correctly
- ✅ Show validation errors for empty login
- ✅ Show error for invalid credentials
- ✅ Toggle password visibility
- ✅ Admin login and redirect to admin dashboard
- ✅ Depot login and redirect to depot dashboard

### 2. Signup Functionality Tests
- ✅ Switch to signup tab
- ✅ Validate signup form fields
- ✅ Create new passenger account

### 3. Logout Functionality Tests
- ✅ Logout successfully after login
- ✅ Clear session data on logout
- ✅ Redirect to login page after logout

### 4. Complete Booking Flow Tests
- ✅ Search for bus trips
- ✅ Complete booking from search to payment
- ✅ Handle booking without login (guest mode)
- ✅ Select seats
- ✅ Fill passenger details
- ✅ Navigate to payment page

### 5. Responsive Design Tests
- ✅ Mobile viewport (375x667) - Login
- ✅ Tablet viewport (768x1024) - Login
- ✅ Desktop viewport - Full functionality

### 6. Accessibility Tests
- ✅ Proper form labels
- ✅ Accessible button text
- ✅ Keyboard navigation support

### 7. API Integration Tests
- ✅ Backend health check
- ✅ Login API response
- ✅ Booking API accessibility

## 📦 Prerequisites

### 1. Install Dependencies

```bash
# Install all project dependencies
npm run install-all

# Install Playwright browsers
npm run playwright:install
```

### 2. Start the Application

**Terminal 1 - Backend Server:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend Server:**
```bash
cd frontend
npm start
```

Wait for both servers to be running:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### 3. Test Data Setup

Create test users in the database:

**Admin User:**
- Email: `admin@yatrik.com`
- Password: `Admin@123`

**Depot User:**
- Email: `tvm-depot@yatrik.com`
- Password: `Depot@123`

**Note:** Passenger accounts are created dynamically during tests.

## 🚀 Running Tests

### Run All Tests

```bash
npm run test:playwright
```

### Run Tests in UI Mode (Recommended for Development)

```bash
npm run test:playwright:ui
```

This opens an interactive UI where you can:
- Watch tests run in real-time
- Debug failed tests
- See step-by-step execution
- Inspect DOM elements

### Run Specific Test File

```bash
npx playwright test e2e/complete-flow.spec.js
```

### Run Specific Test Suite

```bash
# Run only login tests
npx playwright test -g "Login Functionality"

# Run only booking tests
npx playwright test -g "Complete Booking Flow"

# Run only logout tests
npx playwright test -g "Logout Functionality"
```

### Run Tests in Headed Mode (See Browser)

```bash
npx playwright test --headed
```

### Run Tests in Debug Mode

```bash
npx playwright test --debug
```

### Run Tests on Specific Browser

```bash
# Chrome
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# Safari
npx playwright test --project=webkit
```

## 📊 View Test Reports

### HTML Report

```bash
npm run test:playwright:report
```

This opens an interactive HTML report showing:
- Test results overview
- Passed/failed tests
- Test duration
- Screenshots of failures
- Video recordings
- Execution traces

### Report Files Location

```
playwright-report/
├── index.html          # Main HTML report
├── results.json        # JSON format results
├── results.xml         # JUnit XML format
└── screenshots/        # Failure screenshots
```

## 🧪 Test Scenarios

### 1. Login Flow

```javascript
User opens application
→ Sees login page with form
→ Enters valid credentials
→ Clicks "Sign in"
→ Redirects to appropriate dashboard
→ Dashboard elements visible
```

### 2. Signup Flow

```javascript
User opens application
→ Clicks "Create account" tab
→ Fills registration form
  - Full Name
  - Email (with availability check)
  - Phone Number
  - Password
  - Confirm Password
→ Clicks "Create account"
→ Account created
→ Redirects to dashboard
```

### 3. Logout Flow

```javascript
User is logged in
→ Clicks logout button
→ Session data cleared
→ Redirects to login page
→ Login form visible again
```

### 4. Complete Booking Flow

```javascript
User logs in / signs up
→ Navigates to search page
→ Enters search criteria:
  - From: Thiruvananthapuram
  - To: Kochi
  - Date: Tomorrow
→ Clicks "Search"
→ Views available buses
→ Selects a bus
→ Selects seats
→ Clicks "Continue"
→ Fills passenger details:
  - Name
  - Age
  - Gender
→ Fills contact details:
  - Phone
  - Email
→ Clicks "Continue to Payment"
→ Arrives at payment page
→ Selects payment method
→ Completes payment (Test mode)
→ Receives booking confirmation
```

## 🔧 Troubleshooting

### Tests Failing Due to Timeout

**Solution:**
```javascript
// Increase timeout in test
test('my test', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
  // ... test code
});
```

### Elements Not Found

**Check:**
1. Frontend is running on http://localhost:5173
2. Backend is running on http://localhost:5000
3. Page has finished loading
4. Element selectors are correct

**Debug:**
```bash
# Run with debug mode to inspect elements
npx playwright test --debug
```

### API Connection Refused

**Check:**
1. Backend server is running
2. Port 5000 is not blocked
3. No other service using port 5000

### Authentication Errors

**Check:**
1. Test credentials exist in database
2. Database connection is working
3. JWT token generation is working

### Screenshots Not Saved

**Verify:**
```javascript
// In playwright.config.js
use: {
  screenshot: 'only-on-failure',
}
```

## 📝 Writing New Tests

### Test Structure

```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    test.setTimeout(60000);
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await page.goto('http://localhost:5173');
    
    // Your test steps
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Best Practices

1. **Use Descriptive Test Names**
   ```javascript
   ❌ test('test 1', ...)
   ✅ test('should display login form on homepage', ...)
   ```

2. **Use Proper Selectors**
   ```javascript
   ❌ await page.click('.btn-123')
   ✅ await page.locator('button:has-text("Sign in")').click()
   ```

3. **Add Explicit Waits**
   ```javascript
   await page.waitForTimeout(2000); // Wait for animation
   await expect(element).toBeVisible({ timeout: 5000 });
   ```

4. **Handle Async Operations**
   ```javascript
   await page.waitForLoadState('networkidle');
   await page.waitForResponse(resp => resp.url().includes('/api/'));
   ```

5. **Add Error Logging**
   ```javascript
   try {
     // Test code
   } catch (error) {
     console.log('Test failed:', error.message);
     await page.screenshot({ path: 'error.png' });
     throw error;
   }
   ```

## 🎬 Recording New Tests

### Using Codegen

```bash
npx playwright codegen http://localhost:5173
```

This opens:
- Browser window
- Inspector panel with generated code

As you interact with the app, Playwright records your actions and generates test code.

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: Playwright Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright
      run: npx playwright install --with-deps
    
    - name: Start servers
      run: |
        npm run server &
        npm run client &
        sleep 10
    
    - name: Run tests
      run: npm run test:playwright
    
    - name: Upload report
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
```

## 🔐 Test Credentials

### Default Test Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@yatrik.com | Admin@123 |
| Depot | tvm-depot@yatrik.com | Depot@123 |
| Passenger | Dynamic (generated) | Test@123456 |

**Note:** Passenger accounts are created with unique emails during test execution to avoid conflicts.

## 📊 Test Metrics

### Expected Results

- **Total Tests:** 30+
- **Expected Pass Rate:** > 80%
- **Average Test Duration:** 5-10 seconds per test
- **Total Suite Duration:** 3-5 minutes

### Performance Benchmarks

| Test Type | Expected Duration |
|-----------|------------------|
| Login | 2-3 seconds |
| Signup | 3-5 seconds |
| Logout | 2-3 seconds |
| Booking Flow | 15-30 seconds |
| API Tests | 1-2 seconds |

## 🐛 Known Issues

### 1. Email Validation Timeout
- **Issue:** Email availability check may timeout
- **Workaround:** Increase wait time to 3-5 seconds

### 2. Seat Selection Race Condition
- **Issue:** Seats may be booked by another user
- **Workaround:** Select multiple seats or retry

### 3. Payment Gateway in Test Mode
- **Issue:** Razorpay may require test credentials
- **Workaround:** Use "Test Mode: Skip Payment" button

## 📚 Additional Resources

### Playwright Documentation
- [Official Docs](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)

### YATRIK ERP Documentation
- [API Documentation](./backend/README.md)
- [Frontend Guide](./frontend/README.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

## 🤝 Contributing

### Adding New Tests

1. Create test file in `e2e/` directory
2. Follow naming convention: `feature-name.spec.js`
3. Add test documentation
4. Update this guide

### Test Review Checklist

- [ ] Tests pass locally
- [ ] Tests are independent (no dependencies)
- [ ] Proper assertions used
- [ ] Error handling included
- [ ] Documentation updated
- [ ] Screenshots on failure
- [ ] Descriptive test names

## 📞 Support

For issues or questions:
1. Check this guide
2. Review test logs
3. Check Playwright documentation
4. Contact development team

---

**Last Updated:** 2025-10-23  
**Version:** 1.0.0  
**Maintainer:** YATRIK ERP Team

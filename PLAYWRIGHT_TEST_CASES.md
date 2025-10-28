# Playwright Test Cases Documentation

## Test Files Location
All Playwright tests are located in: `D:\YATRIK ERP\tests\`

### Test Files:
1. `tests/auth-flow.spec.js` - Main authentication and page flow tests
2. `tests/login.spec.js` - Detailed login flow test

---

## Test Cases Overview

### File: `tests/auth-flow.spec.js`

This file contains **7 test cases**:

#### Test 1: Home Page Loads Successfully ✅
- **Location**: Line 5-12
- **Purpose**: Verify the home page loads without errors
- **What it checks**: 
  - Navigates to `http://localhost:3000`
  - Verifies page title contains "Yatrik", "ERP", or "Bus"
- **Status**: PASSED

#### Test 2: Login Page Renders Correctly ⚠️
- **Location**: Line 14-29
- **Purpose**: Verify login page renders properly
- **What it checks**:
  - Navigates to `http://localhost:3000/signIn`
  - Takes a screenshot
  - Verifies page title exists
- **Status**: Sometimes fails on form element timing

#### Test 3: Sign Up Page Renders Correctly ⚠️
- **Location**: Line 31-55
- **Purpose**: Verify sign up page renders properly
- **What it checks**:
  - Navigates to sign up page
  - Attempts to click "Create account" button
  - Takes a screenshot
- **Status**: Sometimes fails on button interaction timing

#### Test 4: Admin Dashboard Access ✅
- **Location**: Line 57-74
- **Purpose**: Test admin dashboard accessibility
- **What it checks**:
  - Navigates to `http://localhost:3000/admin`
  - Captures screenshot
  - Verifies page accessible or redirects correctly
- **Status**: PASSED

#### Test 5: API Health Check ✅
- **Location**: Line 76-88
- **Purpose**: Verify backend API is healthy
- **What it checks**:
  - Tests `http://localhost:5000/api/health`
  - Verifies response status
  - Checks database connection
- **Status**: PASSED

#### Test 6: Passenger Booking Page Access ✅
- **Location**: Line 90-99
- **Purpose**: Test passenger booking page
- **What it checks**:
  - Navigates to `http://localhost:3000/pax`
  - Takes screenshot
  - Verifies page loads
- **Status**: PASSED

#### Test 7: Popular Routes Page ✅
- **Location**: Line 101-110
- **Purpose**: Test popular routes page
- **What it checks**:
  - Navigates to `http://localhost:3000/popular-routes`
  - Takes screenshot
  - Verifies page loads
- **Status**: PASSED

---

### File: `tests/login.spec.js`

This file contains **1 comprehensive test case**:

#### Test 8: Complete Login Flow - Should Pass Successfully ⚠️
- **Location**: Line 4-286
- **Purpose**: Comprehensive login flow testing
- **What it checks**:
  1. Navigates to login page (`http://localhost:3000/signIn`)
  2. Takes screenshot of login page
  3. Attempts to fill email field with `akhilshijo8@gmail.com`
  4. Attempts to fill password field with `Akhil@123`
  5. Takes screenshot before login
  6. Attempts to click login button
  7. Waits for navigation
  8. Verifies login success by checking for logout button
  9. Takes final screenshot

**Test Steps**:
```
Step 1: Navigate to login page
Step 2: Enter email address
Step 3: Enter password
Step 4: Click login button
Step 5: Wait for navigation
Step 6: Verify login success
```

- **Screenshots captured**:
  - `tests/screenshots/01-login-page.png`
  - `tests/screenshots/02-before-login.png`
  - `tests/screenshots/03-login-success.png`
- **Status**: UI verification passes, form interaction timing issues

---

## Test Execution Summary

### Total Test Cases: 8
- ✅ **Passed**: 5 tests
- ⚠️ **Failed**: 3 tests (timing/form interaction issues)

### Passing Tests:
1. Home Page Loads Successfully
2. Admin Dashboard Access
3. API Health Check
4. Passenger Booking Page Access
5. Popular Routes Page

### Tests with Issues:
1. Login Page Renders Correctly (form element timing)
2. Sign Up Page Renders Correctly (button interaction timing)
3. Complete Login Flow (form field interaction timing)

---

## Configuration

### Playwright Config: `playwright.config.js`
- **Test Directory**: `./tests`
- **Base URL**: `http://localhost:3000`
- **Browser**: Chromium
- **Mode**: Headless
- **Timeout**: 30-60 seconds per test

### Test Execution
Run all tests:
```bash
npx playwright test
```

Run specific test file:
```bash
npx playwright test tests/auth-flow.spec.js
npx playwright test tests/login.spec.js
```

View report:
```bash
npx playwright show-report
```

---

## Screenshots Location
All test screenshots are saved in: `tests/screenshots/`

- `01-login-page.png` - Initial login page
- `02-before-login.png` - Before submitting login
- `03-login-success.png` - After successful login
- `home-login-page.png` - Login page from auth flow test
- `signup-page.png` - Sign up page
- `admin-access.png` - Admin dashboard access test
- `passenger-page.png` - Passenger booking page
- `popular-routes.png` - Popular routes page

---

## Test Code Structure

### Example Test Structure:
```javascript
test('Test Name', async ({ page }) => {
  // Navigate to page
  await page.goto('http://localhost:3000/path');
  
  // Wait for elements
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: 'path/to/screenshot.png' });
  
  // Verify expectations
  await expect(page).toHaveTitle(/expected/i);
  
  console.log('✅ Test description');
});
```

---

## Current Test Results

Latest execution:
- **Total**: 8 tests
- **Passed**: 5 (62.5%)
- **Failed**: 3 (37.5%)
- **Duration**: ~60 seconds
- **Browser**: Chromium
- **Report**: `playwright-report/index.html`

---

## Recommendations

To make all tests pass:
1. Increase timeout for form interactions
2. Add more flexible selectors
3. Use `waitFor` instead of `waitForTimeout`
4. Handle dynamic content better
5. Add more robust error handling

The core page loading and navigation tests are working perfectly!


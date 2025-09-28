# Yatrik ERP Role Login Tests

This directory contains automated Selenium tests for testing login/logout flows across all user roles in the Yatrik ERP system.

## Test File

- `roleLoginTests.js` - Comprehensive test suite for all 5 user roles

## Prerequisites

1. **Install Dependencies**: The required packages are already in the root `package.json`:
   - `selenium-webdriver` - WebDriver for browser automation
   - `chromedriver` - Chrome browser driver

2. **Chrome Browser**: Ensure Google Chrome is installed on your system

3. **Application Running**: Make sure your Yatrik ERP frontend is running on `http://localhost:5173`

## Running the Tests

### Option 1: Direct Node.js execution
```bash
node tests/roleLoginTests.js
```

### Option 2: Using npm script (if added to package.json)
```bash
npm run test:roles
```

## Test Coverage

The test suite covers login/logout flows for all 5 user roles:

1. **ADMIN** - `admin@yatrik.com` / `admin123`
2. **DEPOT** - `depot-plk@yatrik.com` / `Akhil@123`
3. **CONDUCTOR** - `joel@gmail.com` / `Yatrik123`
4. **DRIVER** - `rejith@gmail.com` / `Akhil@123`
5. **PASSENGER** - `lijithmk2026@mca.ajce.in` / `Akhil@123`

## Test Features

- **Non-headless Chrome**: Tests run in visible Chrome browser (maximized window)
- **Robust Element Detection**: Multiple fallback selectors for dashboard and logout detection
- **Error Handling**: Automatic screenshot capture on test failures
- **Sequential Execution**: Tests run one after another with 3-second delays
- **Comprehensive Reporting**: Detailed test results with success rates and timing

## Screenshots

Failed tests automatically capture screenshots in the `tests/screenshots/` directory with descriptive filenames like:
- `admin-failure-2024-01-15T10-30-45-123Z.png`
- `depot-failure-2024-01-15T10-31-12-456Z.png`

## Test Flow

For each role, the test:

1. Navigates to `http://localhost:5173/login`
2. Waits for login form elements (`input[name="email"]`, `input[name="password"]`, `button[type="submit"]`)
3. Enters role-specific credentials
4. Submits the login form
5. Detects successful login by finding dashboard elements
6. Performs logout using multiple fallback selectors
7. Verifies return to login page
8. Reports success/failure with timing

## Dashboard Detection Strategy

The test uses multiple fallback methods to detect successful login:

1. `[data-testid="dashboard"]` (primary)
2. `.dashboard-container` (fallback)
3. Sidebar menu items containing "Dashboard" (fallback)
4. `<h1>` headings containing "Dashboard" (fallback)
5. URL change detection (last resort)

## Logout Detection Strategy

The test uses multiple fallback methods to find logout buttons:

1. `[data-testid="logout-btn"]` (primary)
2. `button[aria-label="Logout"]` (fallback)
3. `a[title="Logout"]` (fallback)
4. Text-based selectors for "Logout" or "Sign Out" (fallback)
5. Last button/link in sidebar (last resort)

## Output Example

```
🎯 Starting Yatrik ERP Role Login/Logout Tests
============================================================
🔧 Setting up Chrome WebDriver...
✅ WebDriver setup complete

🚀 Testing ADMIN login/logout flow...
📍 Navigating to login page...
⏳ Waiting for login form...
📝 Entering credentials...
🔐 Submitting login form...
⏳ Waiting for dashboard...
✅ Dashboard detected via data-testid
✔ ADMIN login successful
🚪 Attempting logout...
✅ Logout clicked via data-testid
⏳ Waiting for return to login page...
✔ ADMIN logout successful

[... continues for all roles ...]

============================================================
📊 TEST SUMMARY
============================================================
Total Tests: 5
✅ Passed: 5
❌ Failed: 0
Success Rate: 100.0%

📋 Detailed Results:
✅ ADMIN: 3.2s
✅ DEPOT: 2.8s
✅ CONDUCTOR: 3.1s
✅ DRIVER: 2.9s
✅ PASSENGER: 3.0s

🎯 Test Suite Complete!
```

## Troubleshooting

- **Chrome not found**: Ensure Google Chrome is installed
- **Connection refused**: Make sure the frontend is running on `http://localhost:5173`
- **Element not found**: Check if the login form structure matches expected selectors
- **Timeout errors**: Increase `TIMEOUT` constant in the test file if needed

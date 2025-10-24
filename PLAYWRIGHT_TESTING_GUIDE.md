# 🧪 YATRIK ERP - Playwright Testing Guide

Complete guide for running comprehensive E2E tests with dashboard reporting.

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Test Suite Overview](#test-suite-overview)
- [Running Tests](#running-tests)
- [Understanding Reports](#understanding-reports)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

---

## 🚀 Quick Start

### Fastest Way to Run Complete Tests

```bash
# Option 1: Use the automated batch script (Recommended for Windows)
run-complete-playwright-test.bat

# Option 2: Use npm scripts
npm run test:playwright

# Then generate dashboard
npm run test:playwright:dashboard
```

### Quick Commands

```bash
# View HTML report
npm run test:playwright:report

# Run tests with UI (interactive mode)
npm run test:playwright:ui

# Debug failing tests
npm run test:playwright:debug
```

---

## ✅ Prerequisites

### Before Running Tests

1. **Services Running**
   - ✅ Frontend: `http://localhost:5173`
   - ✅ Backend: `http://localhost:5000`

2. **Start Services** (if not running)
   ```bash
   # Terminal 1: Backend
   cd backend
   npm start

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

3. **Playwright Installation**
   ```bash
   # Install Playwright
   npm install @playwright/test --save-dev

   # Install browsers
   npx playwright install
   ```

---

## 🧪 Test Suite Overview

### Test Files

| File | Tests | Description |
|------|-------|-------------|
| `complete-flow.spec.js` | 24+ | Login, Logout, Signup, Booking Flow |
| `yatrik-erp-complete.spec.js` | 30+ | Complete system validation |
| `simple-login.spec.js` | 5+ | Quick login tests |
| `example.spec.js` | 2 | Basic sanity tests |

### Test Categories

- ✅ **Application Availability** - Service health checks
- ✅ **Authentication** - Login/Logout/Signup flows
- ✅ **Navigation** - Routing and page transitions
- ✅ **Responsive Design** - Mobile/Tablet/Desktop
- ✅ **Form Validation** - Input validation and error handling
- ✅ **API Integration** - Backend endpoint testing
- ✅ **Security** - XSS, CSRF, header checks
- ✅ **Accessibility** - ARIA, labels, keyboard navigation
- ✅ **Performance** - Load times, memory leaks
- ✅ **Booking Flow** - Complete E2E user journey
- ✅ **Real-time Features** - WebSocket connections

### Browser Coverage

- 🌐 **Chromium** - Chrome, Edge
- 🦊 **Firefox** - Mozilla Firefox
- 🧭 **WebKit** - Safari

---

## 🎯 Running Tests

### Method 1: Automated Complete Suite (Recommended)

```bash
# Runs all checks, tests, and generates reports
run-complete-playwright-test.bat
```

**Features:**
- ✅ Checks prerequisites (Node.js, npm)
- ✅ Verifies Playwright installation
- ✅ Checks if frontend/backend are running
- ✅ Cleans old reports
- ✅ Runs tests on all browsers
- ✅ Generates dashboard report
- ✅ Opens reports automatically

### Method 2: Direct Playwright Commands

```bash
# Run all tests
npx playwright test

# Run specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run specific file
npx playwright test e2e/complete-flow.spec.js

# Run specific test
npx playwright test --grep "Admin login should work"
```

### Method 3: NPM Scripts

```bash
# All tests (all browsers)
npm run test:playwright

# Specific browsers
npm run test:playwright:chromium
npm run test:playwright:firefox
npm run test:playwright:webkit

# With visible browser (headed mode)
npm run test:playwright:headed

# Interactive UI mode
npm run test:playwright:ui

# Debug mode
npm run test:playwright:debug
```

### Method 4: Old Batch Script

```bash
# Run tests with the original script
run-playwright-tests.bat
```

---

## 📊 Understanding Reports

### 1. Dashboard Report (Markdown)

**File:** `PLAYWRIGHT_TEST_DASHBOARD.md`

**Features:**
- 📊 Executive summary with pass/fail statistics
- 📈 Visual progress bars
- 🧪 Test suite breakdown
- ❌ Detailed failure analysis
- 🌐 Browser coverage
- 🔗 Quick links to other reports

**View:**
```bash
# Generate dashboard
npm run test:playwright:dashboard

# View in editor
start PLAYWRIGHT_TEST_DASHBOARD.md
```

### 2. HTML Report (Interactive)

**Location:** `playwright-report/index.html`

**Features:**
- 🎨 Beautiful interactive UI
- 🎬 Screenshots and videos of failures
- 🔍 Detailed test traces
- 📊 Charts and graphs
- 🔎 Search and filter tests

**View:**
```bash
npm run test:playwright:report
# Opens in browser automatically
```

### 3. JSON Report (Programmatic)

**File:** `playwright-report/results.json`

**Use for:**
- CI/CD integration
- Custom report generation
- Data analysis

### 4. JUnit XML (CI Integration)

**File:** `playwright-report/results.xml`

**Use for:**
- Jenkins integration
- GitLab CI
- Azure DevOps

---

## 📈 Test Results Interpretation

### Dashboard Metrics

```
Total Tests:     61
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Passed:       45   (73.77%)
❌ Failed:       10   (16.39%)
⏭️ Skipped:      6    (9.84%)
⚡ Flaky:        0
```

### Status Indicators

| Icon | Status | Meaning |
|------|--------|---------|
| ✅ | Passed | Test completed successfully |
| ❌ | Failed | Test encountered errors |
| ⏭️ | Skipped | Test was skipped |
| ⚡ | Flaky | Test passed after retry |

### Pass Rate Targets

- 🟢 **95-100%** - Excellent, production ready
- 🟡 **80-94%** - Good, minor issues to fix
- 🟠 **60-79%** - Moderate, needs attention
- 🔴 **Below 60%** - Critical, major issues

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Frontend Not Running

```bash
Error: Frontend is not running on http://localhost:5173

Solution:
cd frontend
npm run dev
```

#### 2. Backend Not Running

```bash
Error: Backend is not running on http://localhost:5000

Solution:
cd backend
npm start
```

#### 3. Playwright Not Installed

```bash
Error: @playwright/test not found

Solution:
npm install @playwright/test --save-dev
npx playwright install
```

#### 4. Browser Installation Failed

```bash
Error: Browser download failed

Solution:
npx playwright install --force
npx playwright install chromium
```

#### 5. Tests Timeout

```bash
Error: Test timeout exceeded

Solution:
# Increase timeout in playwright.config.js
timeout: 60000  # 60 seconds
```

#### 6. Port Already in Use

```bash
Error: EADDRINUSE

Solution:
# Kill process on port
npx kill-port 5173
npx kill-port 5000

# Or change ports in config
```

### Debug Mode

```bash
# Run single test with inspector
npx playwright test --debug --grep "test name"

# Run with trace viewer
npx playwright test --trace on
npx playwright show-trace trace.zip
```

### Verbose Logging

```bash
# Enable debug logs
set DEBUG=pw:api
npx playwright test

# Show browser console
npx playwright test --headed
```

---

## 🎓 Advanced Usage

### Parallel Execution

```javascript
// playwright.config.js
workers: process.env.CI ? 1 : 3  // Run 3 tests in parallel
```

### Test Filtering

```bash
# Run by tag
npx playwright test --grep @smoke

# Exclude tests
npx playwright test --grep-invert @slow

# Run by file pattern
npx playwright test "**/auth*.spec.js"
```

### Custom Reporters

```bash
# Multiple reporters
npx playwright test --reporter=list,html,json

# CI reporter
npx playwright test --reporter=github
```

### Environment Variables

```bash
# Set base URL
set BASE_URL=http://localhost:3000
npx playwright test

# Set timeout
set TIMEOUT=90000
npx playwright test
```

### Continuous Integration

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:playwright
      - uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📝 Best Practices

### 1. Run Tests Before Commits

```bash
# Add to pre-commit hook
npm run test:playwright
```

### 2. Keep Tests Fast

- Use `workers` for parallel execution
- Mock external APIs
- Optimize selectors

### 3. Use Page Objects

```javascript
class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
  }
  
  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.page.click('button[type="submit"]');
  }
}
```

### 4. Handle Flaky Tests

```javascript
test.describe.configure({ retries: 2 });

test('flaky test', async ({ page }) => {
  // Test implementation
});
```

### 5. Clean Test Data

```javascript
test.beforeEach(async ({ page }) => {
  // Reset database or clear localStorage
  await page.evaluate(() => localStorage.clear());
});
```

---

## 📊 Performance Benchmarks

### Expected Test Duration

| Test Suite | Browser | Tests | Duration |
|------------|---------|-------|----------|
| Complete Flow | Chromium | 24 | ~2-3 min |
| Complete Flow | Firefox | 24 | ~2-3 min |
| Complete Flow | WebKit | 24 | ~3-4 min |
| System Tests | All | 30 | ~3-5 min |
| **Total** | **All** | **61+** | **8-12 min** |

### Optimization Tips

- Run critical tests first
- Use `fullyParallel: true`
- Increase `workers` count
- Skip slow tests in development

---

## 🔗 Resources

### Documentation

- [Playwright Official Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [CI Integration](https://playwright.dev/docs/ci)

### Project Files

- Configuration: `playwright.config.js`
- Tests: `e2e/*.spec.js`
- Reports: `playwright-report/`
- Dashboard: `PLAYWRIGHT_TEST_DASHBOARD.md`

### Support

- Check test logs in `playwright-report/`
- Review screenshots in `playwright-report/data/`
- Watch failure videos in `playwright-report/data/`

---

## ✨ Summary

### Quick Reference Card

```
📦 Install:      npm install @playwright/test --save-dev
                 npx playwright install

🏃 Run All:      run-complete-playwright-test.bat
                 npm run test:playwright

🎨 UI Mode:      npm run test:playwright:ui

🐛 Debug:        npm run test:playwright:debug

📊 Dashboard:    npm run test:playwright:dashboard

🌐 HTML Report:  npm run test:playwright:report

🔍 Specific:     npx playwright test --grep "test name"

🔄 Retry:        npx playwright test --retries=2

📹 Trace:        npx playwright test --trace on
```

---

**Last Updated:** October 2025  
**Version:** 1.0  
**Project:** YATRIK ERP  
**Testing Framework:** Playwright v1.56+

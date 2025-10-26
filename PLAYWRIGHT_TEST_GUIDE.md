# YATRIK ERP Playwright Test Suite

## 🎯 Quick Start

### 1. Install Playwright
```bash
npm install @playwright/test
npx playwright install
```

### 2. Run Login Test
```bash
npx playwright test tests/login.spec.js --headed
```

### 3. View Test Report
```bash
npx playwright show-report
```

## 📁 Test Files Created

- `tests/login.spec.js` - Main login test suite
- `playwright.config.js` - Playwright configuration
- `tests/screenshots/` - Directory for test screenshots
- `tests/package.json` - Test dependencies

## 🚀 Test Commands

### Run All Tests (Headed Mode)
```bash
npx playwright test --headed
```

### Run Only Login Tests
```bash
npx playwright test tests/login.spec.js --headed
```

### Run with UI Mode (Interactive)
```bash
npx playwright test --ui
```

### Debug Mode
```bash
npx playwright test --debug
```

## 📊 Test Features

✅ **Visual Testing** - Browser visible in headed mode  
✅ **Screenshot Capture** - Before/after login screenshots  
✅ **HTML Report** - Detailed test results  
✅ **Console Logging** - Step-by-step progress  
✅ **Error Handling** - Comprehensive failure detection  
✅ **Multi-Browser** - Chrome, Firefox, Safari support  
✅ **Mobile Testing** - Mobile viewport testing  

## 📸 Screenshots Generated

- `tests/screenshots/login-page.png` - Initial login page
- `tests/screenshots/before-login.png` - Form filled, before submit
- `tests/screenshots/login-success.png` - After successful login
- `tests/screenshots/login-failure.png` - If login fails

## 📋 Test Report Location

- **HTML Report**: `playwright-report/index.html`
- **JSON Results**: `test-results.json`

## 🔧 Configuration

The test is configured to:
- Run in headed mode (browser visible)
- Slow down operations (1000ms delay) for visibility
- Take screenshots on success/failure
- Generate HTML and JSON reports
- Test multiple browsers and mobile devices

## 🎯 Test Credentials

- **Email**: akhilshijo8@gmail.com
- **Password**: Akhil@123
- **Success Indicator**: `#logout` button presence

## 🚨 Troubleshooting

If tests fail:
1. Ensure your frontend is running on `http://localhost:3008`
2. Check that the login page loads correctly
3. Verify the logout button ID is `#logout`
4. Check screenshots in `tests/screenshots/` for visual debugging
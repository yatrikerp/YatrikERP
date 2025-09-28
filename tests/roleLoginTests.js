const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:5173/login';
const TIMEOUT = 10000; // 10 seconds
const DELAY_BETWEEN_TESTS = 3000; // 3 seconds

// Role credentials
const ROLES = {
    ADMIN: { email: 'admin@yatrik.com', password: 'admin123' },
    DEPOT: { email: 'depot-plk@yatrik.com', password: 'Akhil@123' },
    CONDUCTOR: { email: 'joel@gmail.com', password: 'Yatrik123' },
    DRIVER: { email: 'rejith@gmail.com', password: 'Akhil@123' },
    PASSENGER: { email: 'lijithmk2026@mca.ajce.in', password: 'Akhil@123' }
};

// Test results tracking
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

/**
 * Setup Chrome WebDriver with non-headless, maximized window
 */
async function setupDriver() {
    const options = new chrome.Options();
    options.addArguments('--start-maximized');
    options.addArguments('--disable-web-security');
    options.addArguments('--disable-features=VizDisplayCompositor');
    
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
    
    return driver;
}

/**
 * Wait for element to be present and visible
 */
async function waitForElement(driver, selector, timeout = TIMEOUT) {
    try {
        const element = await driver.wait(
            until.elementLocated(By.css(selector)),
            timeout
        );
        await driver.wait(until.elementIsVisible(element), timeout);
        return element;
    } catch (error) {
        return null;
    }
}

/**
 * Wait for any of multiple selectors to be present and visible
 */
async function waitForAnyElement(driver, selectors, timeout = TIMEOUT) {
    for (const selector of selectors) {
        try {
            const element = await driver.wait(
                until.elementLocated(By.css(selector)),
                timeout
            );
            await driver.wait(until.elementIsVisible(element), timeout);
            return { element, selector };
        } catch (error) {
            continue;
        }
    }
    return null;
}

/**
 * Take screenshot and save it
 */
async function takeScreenshot(driver, filename) {
    try {
        const screenshot = await driver.takeScreenshot();
        const screenshotPath = path.join(__dirname, 'screenshots', filename);
        fs.writeFileSync(screenshotPath, screenshot, 'base64');
        console.log(`📸 Screenshot saved: ${screenshotPath}`);
    } catch (error) {
        console.error('❌ Failed to take screenshot:', error.message);
    }
}

/**
 * Detect dashboard after login using multiple fallback selectors
 */
async function detectDashboard(driver) {
    const dashboardSelectors = [
        '[data-testid="dashboard"]',
        '.dashboard-container',
        'a[href*="dashboard"]',
        'a[href*="Dashboard"]',
        'button:contains("Dashboard")',
        'a:contains("Dashboard")',
        'h1:contains("Dashboard")',
        'h2:contains("Dashboard")',
        'h3:contains("Dashboard")'
    ];

    // Try data-testid first
    let result = await waitForElement(driver, '[data-testid="dashboard"]', 2000);
    if (result) {
        console.log('✅ Dashboard detected via data-testid');
        return true;
    }

    // Try dashboard-container class
    result = await waitForElement(driver, '.dashboard-container', 2000);
    if (result) {
        console.log('✅ Dashboard detected via .dashboard-container');
        return true;
    }

    // Try sidebar menu items containing "Dashboard"
    try {
        const sidebarItems = await driver.findElements(By.css('nav a, .sidebar a, .menu a'));
        for (const item of sidebarItems) {
            const text = await item.getText();
            if (text.toLowerCase().includes('dashboard')) {
                console.log('✅ Dashboard detected via sidebar menu item');
                return true;
            }
        }
    } catch (error) {
        // Continue to next method
    }

    // Try h1 containing "Dashboard"
    try {
        const headings = await driver.findElements(By.css('h1, h2, h3'));
        for (const heading of headings) {
            const text = await heading.getText();
            if (text.toLowerCase().includes('dashboard')) {
                console.log('✅ Dashboard detected via heading');
                return true;
            }
        }
    } catch (error) {
        // Continue
    }

    // Check if we're on a different page (not login page)
    const currentUrl = await driver.getCurrentUrl();
    if (!currentUrl.includes('/login')) {
        console.log('✅ Dashboard detected via URL change');
        return true;
    }

    return false;
}

/**
 * Perform logout using multiple fallback selectors
 */
async function performLogout(driver) {
    const logoutSelectors = [
        '[data-testid="logout-btn"]',
        'button[aria-label="Logout"]',
        'a[title="Logout"]',
        'button:contains("Logout")',
        'a:contains("Logout")',
        'button:contains("Sign Out")',
        'a:contains("Sign Out")'
    ];

    // Try data-testid first
    let logoutElement = await waitForElement(driver, '[data-testid="logout-btn"]', 2000);
    if (logoutElement) {
        await logoutElement.click();
        console.log('✅ Logout clicked via data-testid');
        return true;
    }

    // Try aria-label
    logoutElement = await waitForElement(driver, 'button[aria-label="Logout"]', 2000);
    if (logoutElement) {
        await logoutElement.click();
        console.log('✅ Logout clicked via aria-label');
        return true;
    }

    // Try title attribute
    logoutElement = await waitForElement(driver, 'a[title="Logout"]', 2000);
    if (logoutElement) {
        await logoutElement.click();
        console.log('✅ Logout clicked via title');
        return true;
    }

    // Try text-based selectors
    try {
        const buttons = await driver.findElements(By.css('button, a'));
        for (const button of buttons) {
            const text = await button.getText();
            if (text.toLowerCase().includes('logout') || text.toLowerCase().includes('sign out')) {
                await button.click();
                console.log('✅ Logout clicked via text content');
                return true;
            }
        }
    } catch (error) {
        // Continue to next method
    }

    // Last fallback: try last button/a in sidebar
    try {
        const sidebarButtons = await driver.findElements(By.css('nav button:last-child, .sidebar button:last-child, .menu button:last-child, nav a:last-child, .sidebar a:last-child, .menu a:last-child'));
        if (sidebarButtons.length > 0) {
            await sidebarButtons[0].click();
            console.log('✅ Logout clicked via last sidebar element');
            return true;
        }
    } catch (error) {
        // Continue
    }

    return false;
}

/**
 * Test login and logout flow for a single role
 */
async function testRoleLoginLogout(driver, roleName, credentials) {
    const startTime = Date.now();
    let success = false;
    let errorMessage = '';

    try {
        console.log(`\n🚀 Testing ${roleName} login/logout flow...`);
        
        // Step 1: Navigate to login page
        console.log('📍 Navigating to login page...');
        await driver.get(BASE_URL);
        
        // Step 2: Wait for login form elements
        console.log('⏳ Waiting for login form...');
        const emailInput = await waitForElement(driver, 'input[name="email"]', TIMEOUT);
        const passwordInput = await waitForElement(driver, 'input[name="password"]', TIMEOUT);
        const submitButton = await waitForElement(driver, 'button[type="submit"]', TIMEOUT);
        
        if (!emailInput || !passwordInput || !submitButton) {
            throw new Error('Login form elements not found');
        }
        
        // Step 3: Enter credentials
        console.log('📝 Entering credentials...');
        await emailInput.clear();
        await emailInput.sendKeys(credentials.email);
        await passwordInput.clear();
        await passwordInput.sendKeys(credentials.password);
        
        // Step 4: Submit login form
        console.log('🔐 Submitting login form...');
        await submitButton.click();
        
        // Step 5: Wait for dashboard detection
        console.log('⏳ Waiting for dashboard...');
        const dashboardDetected = await detectDashboard(driver);
        
        if (!dashboardDetected) {
            throw new Error('Dashboard not detected after login');
        }
        
        console.log(`✔ ${roleName} login successful`);
        
        // Step 6: Perform logout
        console.log('🚪 Attempting logout...');
        const logoutSuccess = await performLogout(driver);
        
        if (!logoutSuccess) {
            throw new Error('Logout button not found');
        }
        
        // Step 7: Wait for return to login page
        console.log('⏳ Waiting for return to login page...');
        const emailInputReturned = await waitForElement(driver, 'input[name="email"]', TIMEOUT);
        
        if (!emailInputReturned) {
            throw new Error('Did not return to login page after logout');
        }
        
        console.log(`✔ ${roleName} logout successful`);
        success = true;
        
    } catch (error) {
        errorMessage = error.message;
        console.error(`❌ ${roleName} test failed: ${errorMessage}`);
        
        // Take screenshot on failure
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotName = `${roleName.toLowerCase()}-failure-${timestamp}.png`;
        await takeScreenshot(driver, screenshotName);
        
    } finally {
        const duration = Date.now() - startTime;
        testResults.details.push({
            role: roleName,
            success,
            duration,
            error: errorMessage
        });
        
        if (success) {
            testResults.passed++;
        } else {
            testResults.failed++;
        }
        testResults.total++;
    }
}

/**
 * Sleep function for delays
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main test runner
 */
async function runTests() {
    console.log('🎯 Starting Yatrik ERP Role Login/Logout Tests');
    console.log('=' .repeat(60));
    
    let driver;
    
    try {
        // Setup WebDriver
        console.log('🔧 Setting up Chrome WebDriver...');
        driver = await setupDriver();
        console.log('✅ WebDriver setup complete');
        
        // Run tests for each role sequentially
        for (const [roleName, credentials] of Object.entries(ROLES)) {
            await testRoleLoginLogout(driver, roleName, credentials);
            
            // Add delay between tests (except for last test)
            if (roleName !== 'PASSENGER') {
                console.log(`⏳ Waiting ${DELAY_BETWEEN_TESTS/1000}s before next test...`);
                await sleep(DELAY_BETWEEN_TESTS);
            }
        }
        
    } catch (error) {
        console.error('❌ Test suite error:', error.message);
    } finally {
        // Cleanup
        if (driver) {
            console.log('🧹 Cleaning up WebDriver...');
            await driver.quit();
        }
        
        // Print final summary
        printTestSummary();
    }
}

/**
 * Print final test summary
 */
function printTestSummary() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(60));
    
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Detailed Results:');
    testResults.details.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const duration = (result.duration / 1000).toFixed(1);
        console.log(`${status} ${result.role}: ${duration}s${result.error ? ` - ${result.error}` : ''}`);
    });
    
    console.log('\n🎯 Test Suite Complete!');
}

// Run the tests
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    runTests,
    testRoleLoginLogout,
    ROLES,
    BASE_URL
};

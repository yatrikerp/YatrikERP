const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// Test configuration
const BASE_URL = 'http://localhost:5173/login';
const TIMEOUT = 8000; // Reduced timeout for faster execution

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

// Pretty colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

function printHeader() {
    console.log('\n' + colorize('╔' + '═'.repeat(78) + '╗', 'cyan'));
    console.log(colorize('║' + ' '.repeat(78) + '║', 'cyan'));
    console.log(colorize('║' + '🚀 YATRIK ERP LOGIN/LOGOUT TEST SUITE'.padStart(45).padEnd(78) + '║', 'cyan'));
    console.log(colorize('║' + ' '.repeat(78) + '║', 'cyan'));
    console.log(colorize('╚' + '═'.repeat(78) + '╝', 'cyan'));
    console.log();
}

function printTestHeader(role) {
    console.log(colorize('┌' + '─'.repeat(76) + '┐', 'blue'));
    console.log(colorize('│', 'blue') + ` Testing ${role.padEnd(70)}` + colorize('│', 'blue'));
    console.log(colorize('└' + '─'.repeat(76) + '┘', 'blue'));
}

function printTestResult(role, success, duration, error = null) {
    const status = success ? colorize('✅ PASS', 'green') : colorize('❌ FAIL', 'red');
    const time = `${(duration / 1000).toFixed(1)}s`;
    
    console.log(colorize('│', 'blue') + ` ${role.padEnd(15)} ${status.padEnd(20)} ${time.padEnd(8)} ${error || ''}`.padEnd(76) + colorize('│', 'blue'));
}

function printSummary() {
    const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
    const passedColor = testResults.passed > 0 ? 'green' : 'red';
    const failedColor = testResults.failed > 0 ? 'red' : 'green';
    
    console.log('\n' + colorize('╔' + '═'.repeat(78) + '╗', 'magenta'));
    console.log(colorize('║' + '📊 TEST SUMMARY'.padStart(45).padEnd(78) + '║', 'magenta'));
    console.log(colorize('╠' + '═'.repeat(78) + '╣', 'magenta'));
    
    // Summary stats
    console.log(colorize('║', 'magenta') + ` Total Tests: ${colorize(testResults.total.toString(), 'bright')}`.padEnd(78) + colorize('║', 'magenta'));
    console.log(colorize('║', 'magenta') + ` ${colorize('✅ Passed:', passedColor)} ${colorize(testResults.passed.toString(), passedColor)}`.padEnd(78) + colorize('║', 'magenta'));
    console.log(colorize('║', 'magenta') + ` ${colorize('❌ Failed:', failedColor)} ${colorize(testResults.failed.toString(), failedColor)}`.padEnd(78) + colorize('║', 'magenta'));
    console.log(colorize('║', 'magenta') + ` Success Rate: ${colorize(successRate + '%', successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red')}`.padEnd(78) + colorize('║', 'magenta'));
    
    console.log(colorize('╠' + '═'.repeat(78) + '╣', 'magenta'));
    console.log(colorize('║' + '📋 DETAILED RESULTS'.padStart(45).padEnd(78) + '║', 'magenta'));
    console.log(colorize('╠' + '─'.repeat(78) + '╣', 'magenta'));
    
    // Detailed results
    testResults.details.forEach(result => {
        const status = result.success ? colorize('✅', 'green') : colorize('❌', 'red');
        const duration = `${(result.duration / 1000).toFixed(1)}s`;
        const errorText = result.error ? ` - ${result.error}` : '';
        
        console.log(colorize('║', 'magenta') + ` ${result.role.padEnd(15)} ${status} ${duration.padEnd(8)} ${errorText}`.padEnd(76) + colorize('║', 'magenta'));
    });
    
    console.log(colorize('╚' + '═'.repeat(78) + '╝', 'magenta'));
    
    // Final message
    if (testResults.failed === 0) {
        console.log('\n' + colorize('🎉 ALL TESTS PASSED! Login/Logout functionality is working perfectly!', 'green'));
    } else if (testResults.passed > testResults.failed) {
        console.log('\n' + colorize('⚠️  MOSTLY PASSING - Some issues detected, but core functionality works', 'yellow'));
    } else {
        console.log('\n' + colorize('🚨 MULTIPLE FAILURES - Login/Logout functionality needs attention', 'red'));
    }
    
    console.log('\n' + colorize('✨ Test completed at: ' + new Date().toLocaleString(), 'dim'));
}

async function testRoleLoginLogout(driver, role, credentials) {
    const startTime = Date.now();
    let success = false;
    let error = null;
    
    try {
        printTestHeader(role);
        
        // Navigate to login page
        await driver.get(BASE_URL);
        await driver.wait(until.elementLocated(By.css('input[type="email"]')), TIMEOUT);
        
        // Enter credentials
        await driver.findElement(By.css('input[type="email"]')).clear();
        await driver.findElement(By.css('input[type="email"]')).sendKeys(credentials.email);
        await driver.findElement(By.css('input[type="password"]')).clear();
        await driver.findElement(By.css('input[type="password"]')).sendKeys(credentials.password);
        
        // Submit login
        await driver.findElement(By.css('button[type="submit"]')).click();
        
        // Wait for dashboard (try multiple selectors)
        const dashboardSelectors = [
            '[data-testid="dashboard-sidebar"]',
            '.dashboard-header',
            '[data-testid="admin-dashboard"]',
            '.admin-dashboard',
            '.conductor-dashboard',
            '.passenger-dashboard',
            'header',
            '.navbar'
        ];
        
        let dashboardFound = false;
        for (const selector of dashboardSelectors) {
            try {
                await driver.wait(until.elementLocated(By.css(selector)), 2000);
                dashboardFound = true;
                break;
            } catch (e) {
                // Continue to next selector
            }
        }
        
        if (!dashboardFound) {
            throw new Error('Dashboard not found after login');
        }
        
        // Test logout - try multiple selectors
        const logoutSelectors = [
            '[data-testid="logout-btn"]',
            'button:contains("Logout")',
            'button:contains("logout")',
            '.logout-btn',
            'a[href*="logout"]',
            'button[class*="logout"]',
            'a[class*="logout"]'
        ];
        
        let logoutFound = false;
        for (const selector of logoutSelectors) {
            try {
                const logoutBtn = await driver.findElement(By.css(selector));
                await logoutBtn.click();
                logoutFound = true;
                break;
            } catch (e) {
                // Continue to next selector
            }
        }
        
        if (!logoutFound) {
            throw new Error('Logout button not found');
        }
        
        // Wait for return to login page
        await driver.wait(until.elementLocated(By.css('input[type="email"]')), TIMEOUT);
        
        success = true;
        
    } catch (err) {
        error = err.message;
    }
    
    const duration = Date.now() - startTime;
    
    // Update results
    testResults.total++;
    if (success) {
        testResults.passed++;
    } else {
        testResults.failed++;
    }
    
    testResults.details.push({
        role,
        success,
        duration,
        error
    });
    
    printTestResult(role, success, duration, error);
    
    return success;
}

async function runPrettyTests() {
    let driver;
    
    try {
        printHeader();
        
        // Setup Chrome WebDriver
        const options = new chrome.Options();
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--headless'); // Run headless for faster execution
        options.addArguments('--disable-gpu');
        options.addArguments('--window-size=1920,1080');
        
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
        
        console.log(colorize('🔧 WebDriver initialized successfully', 'green'));
        
        // Test each role
        for (const [role, credentials] of Object.entries(ROLES)) {
            await testRoleLoginLogout(driver, role, credentials);
            
            // Small delay between tests
            if (role !== 'PASSENGER') { // Don't wait after last test
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
    } catch (error) {
        console.error(colorize('❌ Test suite error:', 'red'), error.message);
    } finally {
        if (driver) {
            await driver.quit();
        }
        
        printSummary();
    }
}

// Run the tests
runPrettyTests().catch(console.error);

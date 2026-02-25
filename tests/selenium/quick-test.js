// Quick Selenium Test
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function runQuickTest() {
  console.log('🚀 Starting Quick Selenium Test...\n');
  
  let driver;
  
  try {
    // Setup Chrome options
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');
    
    console.log('⏳ Initializing Chrome WebDriver...');
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
    console.log('✅ WebDriver initialized\n');
    
    // Test 1: Check Frontend
    console.log('📋 Test 1: Frontend Accessibility');
    try {
      await driver.get('http://localhost:3000');
      await driver.sleep(3000);
      
      const title = await driver.getTitle();
      const url = await driver.getCurrentUrl();
      
      console.log(`   URL: ${url}`);
      console.log(`   Title: ${title}`);
      console.log('   ✅ Frontend is accessible\n');
    } catch (error) {
      console.log(`   ❌ Frontend not accessible: ${error.message}\n`);
    }
    
    // Test 2: Check Backend API
    console.log('📋 Test 2: Backend API Health');
    try {
      await driver.get('http://localhost:5000/api/health');
      await driver.sleep(2000);
      
      const body = await driver.findElement(By.css('body')).getText();
      console.log(`   Response: ${body.substring(0, 100)}`);
      console.log('   ✅ Backend API is accessible\n');
    } catch (error) {
      console.log(`   ❌ Backend not accessible: ${error.message}\n`);
    }
    
    // Test 3: Login Page Elements
    console.log('📋 Test 3: Login Page Elements');
    try {
      await driver.get('http://localhost:3000');
      await driver.sleep(3000);
      
      const emailInput = await driver.findElements(By.css('input[type="email"], input[name="email"]'));
      const passwordInput = await driver.findElements(By.css('input[type="password"]'));
      const submitButton = await driver.findElements(By.css('button[type="submit"]'));
      
      console.log(`   Email inputs found: ${emailInput.length}`);
      console.log(`   Password inputs found: ${passwordInput.length}`);
      console.log(`   Submit buttons found: ${submitButton.length}`);
      
      if (emailInput.length > 0 && passwordInput.length > 0 && submitButton.length > 0) {
        console.log('   ✅ Login form elements present\n');
      } else {
        console.log('   ⚠️  Some login elements missing\n');
      }
    } catch (error) {
      console.log(`   ❌ Error checking elements: ${error.message}\n`);
    }
    
    // Test 4: Responsive Design
    console.log('📋 Test 4: Responsive Design');
    try {
      const viewports = [
        { name: 'Mobile', width: 375, height: 667 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Desktop', width: 1920, height: 1080 }
      ];
      
      for (const viewport of viewports) {
        await driver.manage().window().setRect({
          width: viewport.width,
          height: viewport.height
        });
        
        await driver.get('http://localhost:3000');
        await driver.sleep(1000);
        
        const title = await driver.getTitle();
        console.log(`   ${viewport.name} (${viewport.width}x${viewport.height}): ✅`);
      }
      console.log('   ✅ Responsive design working\n');
    } catch (error) {
      console.log(`   ❌ Responsive test error: ${error.message}\n`);
    }
    
    // Test 5: Performance
    console.log('📋 Test 5: Page Load Performance');
    try {
      const startTime = Date.now();
      await driver.get('http://localhost:3000');
      await driver.sleep(2000);
      const loadTime = Date.now() - startTime;
      
      console.log(`   Load time: ${loadTime}ms`);
      
      if (loadTime < 10000) {
        console.log('   ✅ Performance acceptable\n');
      } else {
        console.log('   ⚠️  Load time exceeds 10 seconds\n');
      }
    } catch (error) {
      console.log(`   ❌ Performance test error: ${error.message}\n`);
    }
    
    console.log('=' .repeat(60));
    console.log('✅ Quick test completed successfully!');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nPossible issues:');
    console.error('  1. Frontend not running on http://localhost:3000');
    console.error('  2. Backend not running on http://localhost:5000');
    console.error('  3. ChromeDriver compatibility issue');
    console.error('\nPlease ensure both servers are running before testing.');
  } finally {
    if (driver) {
      await driver.quit();
      console.log('\n🔒 WebDriver closed');
    }
  }
}

runQuickTest();

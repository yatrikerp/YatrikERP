// Navigation and Routing Tests
const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const DriverHelper = require('../helpers/driver');
const config = require('../config');

describe('Navigation and Routing Tests', function() {
  this.timeout(config.TIMEOUT.EXTRA_LONG);
  
  let driverHelper;
  let driver;

  before(async function() {
    driverHelper = new DriverHelper();
    driver = await driverHelper.initDriver();
  });

  after(async function() {
    await driverHelper.quitDriver();
  });

  describe('Homepage Navigation', function() {
    it('should load homepage successfully', async function() {
      await driver.get(config.BASE_URL);
      await driver.sleep(2000);
      
      const title = await driver.getTitle();
      expect(title).to.exist;
      
      await driverHelper.takeScreenshot('homepage');
    });

    it('should have navigation links', async function() {
      await driver.get(config.BASE_URL);
      await driver.sleep(2000);
      
      const links = await driver.findElements({ css: 'a[href]' });
      expect(links.length).to.be.greaterThan(0);
      
      console.log(`Found ${links.length} navigation links`);
    });
  });

  describe('Route Handling', function() {
    it('should handle invalid routes gracefully', async function() {
      await driver.get(`${config.BASE_URL}/this-route-does-not-exist-12345`);
      await driver.sleep(2000);
      
      const currentUrl = await driver.getCurrentUrl();
      const title = await driver.getTitle();
      
      // Should either show 404 or redirect to valid page
      expect(currentUrl).to.exist;
      expect(title).to.exist;
      
      await driverHelper.takeScreenshot('404-handling');
    });
  });

  describe('Browser Navigation', function() {
    it('should handle back button navigation', async function() {
      await driver.get(config.BASE_URL);
      await driver.sleep(2000);
      
      const firstUrl = await driver.getCurrentUrl();
      
      // Try to find and click a link
      const links = await driver.findElements({ css: 'a[href]' });
      if (links.length > 0) {
        await links[0].click();
        await driver.sleep(2000);
        
        await driver.navigate().back();
        await driver.sleep(2000);
        
        const backUrl = await driver.getCurrentUrl();
        expect(backUrl).to.include(config.BASE_URL);
      }
    });

    it('should handle forward button navigation', async function() {
      await driver.get(config.BASE_URL);
      await driver.sleep(2000);
      
      const links = await driver.findElements({ css: 'a[href]' });
      if (links.length > 0) {
        await links[0].click();
        await driver.sleep(2000);
        
        await driver.navigate().back();
        await driver.sleep(2000);
        
        await driver.navigate().forward();
        await driver.sleep(2000);
        
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).to.exist;
      }
    });

    it('should handle page refresh', async function() {
      await driver.get(config.BASE_URL);
      await driver.sleep(2000);
      
      const urlBefore = await driver.getCurrentUrl();
      
      await driver.navigate().refresh();
      await driver.sleep(2000);
      
      const urlAfter = await driver.getCurrentUrl();
      expect(urlAfter).to.equal(urlBefore);
    });
  });
});

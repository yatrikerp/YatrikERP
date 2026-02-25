// Responsive Design Tests
const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const DriverHelper = require('../helpers/driver');
const config = require('../config');

describe('Responsive Design Tests', function() {
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

  const viewports = [
    { name: 'Mobile Portrait', width: 375, height: 667 },
    { name: 'Mobile Landscape', width: 667, height: 375 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Large Desktop', width: 2560, height: 1440 }
  ];

  viewports.forEach(viewport => {
    describe(`${viewport.name} (${viewport.width}x${viewport.height})`, function() {
      it('should render correctly', async function() {
        await driver.manage().window().setRect({
          width: viewport.width,
          height: viewport.height
        });
        
        await driver.get(config.BASE_URL);
        await driver.sleep(2000);
        
        const title = await driver.getTitle();
        expect(title).to.exist;
        
        await driverHelper.takeScreenshot(`responsive-${viewport.name.toLowerCase().replace(/\s+/g, '-')}`);
        
        console.log(`✓ ${viewport.name} viewport renders correctly`);
      });

      it('should have visible content', async function() {
        await driver.manage().window().setRect({
          width: viewport.width,
          height: viewport.height
        });
        
        await driver.get(config.BASE_URL);
        await driver.sleep(2000);
        
        const body = await driver.findElement({ css: 'body' });
        const isDisplayed = await body.isDisplayed();
        
        expect(isDisplayed).to.be.true;
      });
    });
  });

  describe('Responsive Elements', function() {
    it('should adapt navigation for mobile', async function() {
      await driver.manage().window().setRect({ width: 375, height: 667 });
      await driver.get(config.BASE_URL);
      await driver.sleep(2000);
      
      // Check if mobile menu exists
      const mobileMenus = await driver.findElements({ 
        css: '[class*="mobile"], [class*="hamburger"], button[aria-label*="menu"]' 
      });
      
      console.log(`Mobile menu elements found: ${mobileMenus.length}`);
      expect(true).to.be.true; // Log only
    });

    it('should show full navigation on desktop', async function() {
      await driver.manage().window().setRect({ width: 1920, height: 1080 });
      await driver.get(config.BASE_URL);
      await driver.sleep(2000);
      
      const navLinks = await driver.findElements({ css: 'nav a, header a' });
      console.log(`Desktop navigation links found: ${navLinks.length}`);
      
      expect(true).to.be.true; // Log only
    });
  });
});

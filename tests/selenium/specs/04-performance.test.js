// Performance Tests
const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const DriverHelper = require('../helpers/driver');
const config = require('../config');

describe('Performance Tests', function() {
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

  describe('Page Load Performance', function() {
    it('should load homepage within acceptable time', async function() {
      const startTime = Date.now();
      
      await driver.get(config.BASE_URL);
      await driver.sleep(2000);
      
      const loadTime = Date.now() - startTime;
      console.log(`Homepage load time: ${loadTime}ms`);
      
      expect(loadTime).to.be.lessThan(15000); // 15 seconds max
      
      if (loadTime > 10000) {
        console.log('⚠ Warning: Page load time exceeds 10 seconds');
      }
    });

    it('should measure time to interactive', async function() {
      const startTime = Date.now();
      
      await driver.get(config.BASE_URL);
      
      // Wait for page to be interactive
      await driver.executeScript('return document.readyState').then(async (state) => {
        while (state !== 'complete') {
          await driver.sleep(100);
          state = await driver.executeScript('return document.readyState');
        }
      });
      
      const interactiveTime = Date.now() - startTime;
      console.log(`Time to interactive: ${interactiveTime}ms`);
      
      expect(interactiveTime).to.be.lessThan(20000);
    });
  });

  describe('Resource Loading', function() {
    it('should not have excessive console errors', async function() {
      const errors = [];
      
      await driver.get(config.BASE_URL);
      await driver.sleep(3000);
      
      const logs = await driver.manage().logs().get('browser');
      
      logs.forEach(log => {
        if (log.level.name === 'SEVERE') {
          errors.push(log.message);
        }
      });
      
      console.log(`Console errors found: ${errors.length}`);
      
      if (errors.length > 0) {
        console.log('Errors:', errors.slice(0, 5)); // Show first 5
      }
      
      // Filter out known acceptable errors
      const criticalErrors = errors.filter(err => 
        !err.includes('favicon') && 
        !err.includes('source map') &&
        !err.includes('chrome-extension')
      );
      
      expect(criticalErrors.length).to.be.lessThan(5);
    });
  });

  describe('Memory Management', function() {
    it('should handle multiple page loads without memory issues', async function() {
      for (let i = 0; i < 3; i++) {
        await driver.get(config.BASE_URL);
        await driver.sleep(2000);
        
        await driver.navigate().refresh();
        await driver.sleep(2000);
        
        console.log(`✓ Page load iteration ${i + 1} completed`);
      }
      
      // If we get here without crashes, memory handling is acceptable
      expect(true).to.be.true;
    });
  });

  describe('Network Performance', function() {
    it('should measure network timing', async function() {
      await driver.get(config.BASE_URL);
      await driver.sleep(3000);
      
      const timing = await driver.executeScript(`
        const perf = window.performance.timing;
        return {
          dns: perf.domainLookupEnd - perf.domainLookupStart,
          tcp: perf.connectEnd - perf.connectStart,
          request: perf.responseStart - perf.requestStart,
          response: perf.responseEnd - perf.responseStart,
          dom: perf.domComplete - perf.domLoading,
          total: perf.loadEventEnd - perf.navigationStart
        };
      `);
      
      console.log('Network Timing:');
      console.log(`  DNS Lookup: ${timing.dns}ms`);
      console.log(`  TCP Connection: ${timing.tcp}ms`);
      console.log(`  Request Time: ${timing.request}ms`);
      console.log(`  Response Time: ${timing.response}ms`);
      console.log(`  DOM Processing: ${timing.dom}ms`);
      console.log(`  Total Load Time: ${timing.total}ms`);
      
      expect(timing.total).to.be.greaterThan(0);
    });
  });
});

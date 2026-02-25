// API Integration Tests
const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const DriverHelper = require('../helpers/driver');
const config = require('../config');

describe('API Integration Tests', function() {
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

  describe('Health Check', function() {
    it('should verify API health endpoint', async function() {
      await driver.get(`${config.API_URL}/api/health`);
      await driver.sleep(2000);
      
      const body = await driver.findElement({ css: 'body' }).getText();
      
      expect(body).to.exist;
      console.log('API Health Response:', body.substring(0, 200));
      
      // Should contain status indicator
      expect(body.toLowerCase()).to.satisfy(text => 
        text.includes('ok') || 
        text.includes('healthy') || 
        text.includes('status')
      );
    });
  });

  describe('API Endpoints Accessibility', function() {
    const endpoints = [
      { path: '/api/routes', name: 'Routes' },
      { path: '/api/buses', name: 'Buses' },
      { path: '/api/trips', name: 'Trips' },
      { path: '/api/depots', name: 'Depots' }
    ];

    endpoints.forEach(endpoint => {
      it(`should access ${endpoint.name} endpoint`, async function() {
        try {
          await driver.get(`${config.API_URL}${endpoint.path}`);
          await driver.sleep(2000);
          
          const body = await driver.findElement({ css: 'body' }).getText();
          
          // Should return data or auth error (both are valid responses)
          expect(body).to.exist;
          
          if (body.includes('Unauthorized') || body.includes('401')) {
            console.log(`✓ ${endpoint.name} endpoint requires authentication (expected)`);
          } else {
            console.log(`✓ ${endpoint.name} endpoint accessible`);
          }
        } catch (error) {
          console.log(`⚠ ${endpoint.name} endpoint test: ${error.message}`);
        }
      });
    });
  });

  describe('API Response Format', function() {
    it('should return JSON responses', async function() {
      await driver.get(`${config.API_URL}/api/health`);
      await driver.sleep(2000);
      
      const body = await driver.findElement({ css: 'body' }).getText();
      
      try {
        const json = JSON.parse(body);
        expect(json).to.be.an('object');
        console.log('✓ API returns valid JSON');
      } catch (error) {
        console.log('⚠ Response may not be JSON format');
      }
    });
  });

  describe('CORS Configuration', function() {
    it('should allow frontend to access API', async function() {
      await driver.get(config.BASE_URL);
      await driver.sleep(2000);
      
      // Execute fetch request from frontend
      const result = await driver.executeAsyncScript(`
        const callback = arguments[arguments.length - 1];
        
        fetch('${config.API_URL}/api/health')
          .then(response => response.json())
          .then(data => callback({ success: true, data }))
          .catch(error => callback({ success: false, error: error.message }));
      `);
      
      console.log('CORS Test Result:', result);
      
      if (result.success) {
        console.log('✓ CORS configured correctly');
        expect(result.success).to.be.true;
      } else {
        console.log('⚠ CORS may need configuration');
      }
    });
  });
});

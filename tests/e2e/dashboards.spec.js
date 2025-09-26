const { By, until } = require('selenium-webdriver');
const { buildChromeDriver } = require('./utils/driver');
const {
  FRONTEND_URL,
  BACKEND_URL,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  PASSENGER_EMAIL,
  PASSENGER_PASSWORD,
  DEPOT_USERNAME_OR_EMAIL,
  DEPOT_PASSWORD,
  DRIVER_USERNAME,
  DRIVER_PASSWORD,
  CONDUCTOR_USERNAME,
  CONDUCTOR_PASSWORD,
} = require('./utils/config');

async function uiLogin(driver, emailOrUsername, password) {
  await driver.get(`${FRONTEND_URL}/login`);
  await driver.wait(until.elementLocated(By.css('form.login-form-compact')), 20000);
  const emailInput = await driver.findElement(By.css('input#email'));
  await emailInput.clear();
  await emailInput.sendKeys(emailOrUsername);
  const passwordInput = await driver.findElement(By.css('input#password'));
  await passwordInput.clear();
  await passwordInput.sendKeys(password);
  const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
  await submitBtn.click();
}

describe('Dashboards: Role access sanity', function () {
  this.timeout(120000);
  let driver;

  before(async () => {
    driver = buildChromeDriver();
  });

  after(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it('admin dashboard loads', async function () {
    await uiLogin(driver, ADMIN_EMAIL, ADMIN_PASSWORD);
    await driver.wait(until.urlContains('/admin').or(until.urlContains('/dashboard')), 30000);
    // Validate Admin layout nav exists
    await driver.wait(until.elementLocated(By.css('nav')), 15000);
  });

  it('depot dashboard loads when depot creds provided', async function () {
    if (!DEPOT_USERNAME_OR_EMAIL || !DEPOT_PASSWORD) {
      this.skip();
      return;
    }
    await uiLogin(driver, DEPOT_USERNAME_OR_EMAIL, DEPOT_PASSWORD);
    await driver.wait(until.urlContains('/depot'), 30000);
    await driver.wait(until.elementLocated(By.css('button, a')), 15000);
  });

  it('passenger dashboard loads when passenger creds provided', async function () {
    if (!PASSENGER_EMAIL || !PASSENGER_PASSWORD) {
      this.skip();
      return;
    }
    await uiLogin(driver, PASSENGER_EMAIL, PASSENGER_PASSWORD);
    await driver.wait(until.or(until.urlContains('/passenger/dashboard'), until.urlContains('/pax')), 30000);
    await driver.wait(until.elementLocated(By.css('button, a')), 15000);
  });

  it('driver dashboard loads when driver creds provided', async function () {
    if (!DRIVER_USERNAME || !DRIVER_PASSWORD) {
      this.skip();
      return;
    }
    await uiLogin(driver, DRIVER_USERNAME, DRIVER_PASSWORD);
    await driver.wait(until.urlContains('/driver'), 30000);
    await driver.wait(until.elementLocated(By.css('button, a')), 15000);
  });

  it('conductor dashboard loads when conductor creds provided', async function () {
    if (!CONDUCTOR_USERNAME || !CONDUCTOR_PASSWORD) {
      this.skip();
      return;
    }
    await uiLogin(driver, CONDUCTOR_USERNAME, CONDUCTOR_PASSWORD);
    await driver.wait(until.urlContains('/conductor'), 30000);
    await driver.wait(until.elementLocated(By.css('button, a')), 15000);
  });
});







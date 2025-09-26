const { By, until, Key } = require('selenium-webdriver');
const { buildChromeDriver } = require('./utils/driver');
const { FRONTEND_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD } = require('./utils/config');

describe('Auth: Login flow', function () {
  this.timeout(90000);
  let driver;

  before(async () => {
    driver = buildChromeDriver();
  });

  after(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it('should navigate to login page', async () => {
    await driver.get(`${FRONTEND_URL}/login`);
    await driver.wait(until.elementLocated(By.css('form.login-form-compact, form.login-form')), 20000);
  });

  it('should login and redirect to dashboard', async () => {
    // Try the compact unified Auth page selectors
    const emailInput = await driver.findElement(By.css('input#email'));
    await emailInput.clear();
    await emailInput.sendKeys(TEST_USER_EMAIL);

    const passwordInput = await driver.findElement(By.css('input#password'));
    await passwordInput.clear();
    await passwordInput.sendKeys(TEST_USER_PASSWORD);

    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
    await submitBtn.click();

    // After login, app redirects based on role; wait for any protected shell to appear
    await driver.wait(
      until.or(
        until.urlContains('/dashboard'),
        until.urlContains('/pax'),
        until.urlContains('/admin'),
        until.urlContains('/driver'),
        until.urlContains('/conductor'),
        until.urlContains('/depot')
      ),
      30000
    );

    const currentUrl = await driver.getCurrentUrl();
    if (!/(\/dashboard|\/pax|\/admin|\/driver|\/conductor|\/depot)/.test(currentUrl)) {
      throw new Error(`Unexpected post-login URL: ${currentUrl}`);
    }
  });
});




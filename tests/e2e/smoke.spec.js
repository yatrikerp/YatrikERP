const { By, until } = require('selenium-webdriver');
const { buildChromeDriver } = require('./utils/driver');
const { FRONTEND_URL } = require('./utils/config');

describe('Smoke: Landing page loads', function () {
  this.timeout(60000);
  let driver;

  before(async () => {
    driver = buildChromeDriver();
  });

  after(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it('should open landing page and show Book Now button', async () => {
    await driver.get(FRONTEND_URL);
    await driver.wait(until.elementLocated(By.css('button.btn.btn--accent')), 20000);
    const bookNow = await driver.findElement(By.css('button.btn.btn--accent'));
    const text = await bookNow.getText();
    if (!/book now/i.test(text)) {
      throw new Error('Book Now button not visible');
    }
  });
});




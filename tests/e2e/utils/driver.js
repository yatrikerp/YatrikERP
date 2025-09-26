const { Builder, Capabilities } = require('selenium-webdriver');

function buildChromeDriver() {
  const isCi = process.env.CI === 'true' || process.env.CI === '1';
  const headless = (process.env.HEADLESS || '').toLowerCase() === 'true' || isCi;
  const windowSize = process.env.WINDOW_SIZE || '1366,900';

  const chrome = require('selenium-webdriver/chrome');
  const options = new chrome.Options();

  if (headless) {
    options.addArguments('--headless=new');
  }
  options.addArguments(
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--window-size=${windowSize}`,
    '--disable-infobars',
    '--disable-notifications'
  );

  const driver = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .withCapabilities(Capabilities.chrome())
    .build();

  return driver;
}

module.exports = { buildChromeDriver };



// Selenium WebDriver Helper
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const fs = require('fs');
const path = require('path');
const config = require('../config');

class DriverHelper {
  constructor() {
    this.driver = null;
  }

  async initDriver(browser = config.BROWSER) {
    let options;
    
    if (browser === 'chrome') {
      options = new chrome.Options();
      if (config.HEADLESS) {
        options.addArguments('--headless');
      }
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');
      options.addArguments('--disable-gpu');
      options.addArguments('--window-size=1920,1080');
      
      this.driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
    } else if (browser === 'firefox') {
      options = new firefox.Options();
      if (config.HEADLESS) {
        options.addArguments('--headless');
      }
      
      this.driver = await new Builder()
        .forBrowser('firefox')
        .setFirefoxOptions(options)
        .build();
    }
    
    await this.driver.manage().setTimeouts({
      implicit: config.TIMEOUT.MEDIUM,
      pageLoad: config.TIMEOUT.LONG,
      script: config.TIMEOUT.LONG
    });
    
    return this.driver;
  }

  async quitDriver() {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
  }

  async takeScreenshot(testName) {
    if (!config.SCREENSHOTS.ENABLED) return;
    
    const screenshotDir = config.SCREENSHOTS.PATH;
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${testName}_${timestamp}.png`;
    const filepath = path.join(screenshotDir, filename);
    
    const image = await this.driver.takeScreenshot();
    fs.writeFileSync(filepath, image, 'base64');
    
    console.log(`Screenshot saved: ${filepath}`);
    return filepath;
  }

  async waitForElement(locator, timeout = config.TIMEOUT.MEDIUM) {
    return await this.driver.wait(until.elementLocated(locator), timeout);
  }

  async waitForElementVisible(locator, timeout = config.TIMEOUT.MEDIUM) {
    const element = await this.waitForElement(locator, timeout);
    await this.driver.wait(until.elementIsVisible(element), timeout);
    return element;
  }

  async waitForElementClickable(locator, timeout = config.TIMEOUT.MEDIUM) {
    const element = await this.waitForElement(locator, timeout);
    await this.driver.wait(until.elementIsEnabled(element), timeout);
    return element;
  }

  async safeClick(locator, timeout = config.TIMEOUT.MEDIUM) {
    const element = await this.waitForElementClickable(locator, timeout);
    await this.driver.executeScript('arguments[0].scrollIntoView(true);', element);
    await this.driver.sleep(500);
    await element.click();
  }

  async safeSendKeys(locator, text, timeout = config.TIMEOUT.MEDIUM) {
    const element = await this.waitForElementVisible(locator, timeout);
    await element.clear();
    await element.sendKeys(text);
  }

  async getText(locator, timeout = config.TIMEOUT.MEDIUM) {
    const element = await this.waitForElementVisible(locator, timeout);
    return await element.getText();
  }

  async isElementPresent(locator) {
    try {
      await this.driver.findElement(locator);
      return true;
    } catch (error) {
      return false;
    }
  }

  async waitForUrl(urlPattern, timeout = config.TIMEOUT.MEDIUM) {
    await this.driver.wait(async () => {
      const currentUrl = await this.driver.getCurrentUrl();
      return currentUrl.includes(urlPattern);
    }, timeout);
  }

  async scrollToBottom() {
    await this.driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
    await this.driver.sleep(1000);
  }

  async scrollToTop() {
    await this.driver.executeScript('window.scrollTo(0, 0);');
    await this.driver.sleep(500);
  }
}

module.exports = DriverHelper;

// Login Page Object Model
const { By } = require('selenium-webdriver');
const config = require('../config');

class LoginPage {
  constructor(driver) {
    this.driver = driver;
    
    // Locators
    this.emailInput = By.css('input[type="email"], input[name="email"]');
    this.passwordInput = By.css('input[type="password"], input[name="password"]');
    this.loginButton = By.css('button[type="submit"]');
    this.errorMessage = By.css('.error, [class*="error"], .alert-danger');
    this.successMessage = By.css('.success, [class*="success"], .alert-success');
  }

  async navigate() {
    await this.driver.get(config.BASE_URL);
  }

  async login(email, password) {
    await this.driver.findElement(this.emailInput).sendKeys(email);
    await this.driver.findElement(this.passwordInput).sendKeys(password);
    await this.driver.findElement(this.loginButton).click();
  }

  async isErrorDisplayed() {
    try {
      const element = await this.driver.findElement(this.errorMessage);
      return await element.isDisplayed();
    } catch (error) {
      return false;
    }
  }

  async getErrorMessage() {
    try {
      const element = await this.driver.findElement(this.errorMessage);
      return await element.getText();
    } catch (error) {
      return '';
    }
  }

  async isLoginSuccessful() {
    await this.driver.sleep(2000);
    const currentUrl = await this.driver.getCurrentUrl();
    return !currentUrl.includes('login');
  }
}

module.exports = LoginPage;

package com.yatrik.erp.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page Object Model for Login Page
 */
public class LoginPage extends BasePage {
    
    // Locators - try multiple selectors
    private By emailInput = By.id("email");
    private By passwordInput = By.id("password");
    private By loginButton = By.cssSelector("button[type='submit']");
    private By errorMessage = By.cssSelector(".error-message, .alert-danger");
    private By registerLink = By.linkText("Register");
    private By forgotPasswordLink = By.linkText("Forgot Password");

    public LoginPage(WebDriver driver) {
        super(driver);
        // Wait longer for React to fully render the login form
        System.out.println("⏳ Waiting for login page to load...");
        try {
            Thread.sleep(3000); // Give React more time
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    public void enterEmail(String email) {
        System.out.println("📧 Entering email...");
        type(emailInput, email);
    }

    public void enterPassword(String password) {
        System.out.println("🔒 Entering password...");
        type(passwordInput, password);
    }

    public void clickLoginButton() {
        System.out.println("🖱️  Clicking login button...");
        click(loginButton);
    }

    public void login(String email, String password) {
        enterEmail(email);
        enterPassword(password);
        clickLoginButton();
    }

    public boolean isErrorMessageDisplayed() {
        return isDisplayed(errorMessage);
    }

    public String getErrorMessage() {
        return getText(errorMessage);
    }

    public boolean isLoginPageDisplayed() {
        return isDisplayed(emailInput) && isDisplayed(passwordInput);
    }
}

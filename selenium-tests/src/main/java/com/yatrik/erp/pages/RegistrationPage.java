package com.yatrik.erp.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page Object Model for Registration Page
 */
public class RegistrationPage extends BasePage {
    
    // Locators for registration form
    private By nameInput = By.id("su-name");
    private By emailInput = By.id("su-email");
    private By phoneInput = By.id("su-phone");
    private By passwordInput = By.id("su-password");
    private By confirmPasswordInput = By.id("su-confirm");
    private By createAccountButton = By.cssSelector("button[type='submit']");
    private By createAccountTab = By.xpath("//button[contains(text(), 'Create account')]");
    private By successMessage = By.cssSelector(".success-message, .alert-success");
    private By errorMessage = By.cssSelector(".error-message, .alert-danger");

    public RegistrationPage(WebDriver driver) {
        super(driver);
    }

    public void clickCreateAccountTab() {
        click(createAccountTab);
    }

    public void enterName(String name) {
        type(nameInput, name);
    }

    public void enterEmail(String email) {
        type(emailInput, email);
    }

    public void enterPhone(String phone) {
        type(phoneInput, phone);
    }

    public void enterPassword(String password) {
        type(passwordInput, password);
    }

    public void enterConfirmPassword(String confirmPassword) {
        type(confirmPasswordInput, confirmPassword);
    }

    public void clickCreateAccountButton() {
        click(createAccountButton);
    }

    public void register(String name, String email, String phone, String password) {
        clickCreateAccountTab();
        try {
            Thread.sleep(1000); // Wait for tab animation
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Enter email FIRST and wait for validation
        System.out.println("📧 Entering email for validation...");
        enterEmail(email);
        
        // Wait for email validation to complete (3 seconds)
        System.out.println("⏳ Waiting for email validation...");
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Now enter other fields
        enterName(name);
        enterPhone(phone);
        enterPassword(password);
        enterConfirmPassword(password);
        clickCreateAccountButton();
    }

    public boolean isSuccessMessageDisplayed() {
        try {
            return isDisplayed(successMessage);
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isErrorMessageDisplayed() {
        try {
            return isDisplayed(errorMessage);
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isRegistrationFormDisplayed() {
        return isDisplayed(nameInput) && isDisplayed(emailInput);
    }
}

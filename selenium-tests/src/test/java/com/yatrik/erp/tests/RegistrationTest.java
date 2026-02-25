package com.yatrik.erp.tests;

import com.yatrik.erp.config.TestConfig;
import com.yatrik.erp.pages.RegistrationPage;
import org.testng.Assert;
import org.testng.annotations.Test;
import java.util.Random;

/**
 * Fast automated tests for User Registration
 */
public class RegistrationTest extends BaseTest {

    private String generateRandomEmail() {
        Random random = new Random();
        return "testuser" + System.currentTimeMillis() + random.nextInt(1000) + "@test.com";
    }

    private String generateRandomPhone() {
        Random random = new Random();
        return "+919" + String.format("%09d", random.nextInt(1000000000));
    }

    @Test(priority = 1, description = "Verify user can register with valid details")
    public void testSuccessfulRegistration() {
        driver.get(TestConfig.getBaseUrl() + "login");
        RegistrationPage registrationPage = new RegistrationPage(driver);
        
        // Generate unique credentials
        String email = generateRandomEmail();
        String phone = generateRandomPhone();
        
        // Register new user
        registrationPage.register(
            "Test User",
            email,
            phone,
            "Test@123"
        );
        
        // Wait for registration to complete
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Verify registration success (either success message or redirect to dashboard)
        String currentUrl = driver.getCurrentUrl();
        boolean isRegistered = currentUrl.contains("/dashboard") || 
                              currentUrl.contains("/passenger") ||
                              registrationPage.isSuccessMessageDisplayed();
        
        Assert.assertTrue(isRegistered, "User should be registered successfully");
    }

    @Test(priority = 2, description = "Verify registration with existing email fails")
    public void testRegistrationWithExistingEmail() {
        driver.get(TestConfig.getBaseUrl() + "login");
        RegistrationPage registrationPage = new RegistrationPage(driver);
        
        // Try to register with existing email
        registrationPage.register(
            "Test User",
            "admin@yatrik.com", // Existing email
            generateRandomPhone(),
            "Test@123"
        );
        
        // Wait for error message
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Should show error or remain on registration page
        Assert.assertTrue(
            registrationPage.isRegistrationFormDisplayed() || registrationPage.isErrorMessageDisplayed(),
            "Should show error for existing email"
        );
    }

    @Test(priority = 3, description = "Verify registration form is accessible")
    public void testRegistrationFormDisplay() {
        driver.get(TestConfig.getBaseUrl() + "login");
        RegistrationPage registrationPage = new RegistrationPage(driver);
        
        // Click on Create Account tab
        registrationPage.clickCreateAccountTab();
        
        // Wait for form to appear
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Verify registration form is displayed
        Assert.assertTrue(
            registrationPage.isRegistrationFormDisplayed(),
            "Registration form should be displayed"
        );
    }

    @Test(priority = 4, description = "Verify registration with invalid phone format fails")
    public void testRegistrationWithInvalidPhone() {
        driver.get(TestConfig.getBaseUrl() + "login");
        RegistrationPage registrationPage = new RegistrationPage(driver);
        
        // Try to register with invalid phone
        registrationPage.clickCreateAccountTab();
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        registrationPage.enterName("Test User");
        registrationPage.enterEmail(generateRandomEmail());
        registrationPage.enterPhone("123"); // Invalid phone
        registrationPage.enterPassword("Test@123");
        registrationPage.enterConfirmPassword("Test@123");
        registrationPage.clickCreateAccountButton();
        
        // Wait for validation
        try {
            Thread.sleep(1500);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Should remain on registration page
        Assert.assertTrue(
            registrationPage.isRegistrationFormDisplayed(),
            "Should remain on registration page with invalid phone"
        );
    }
}

package com.yatrik.erp.tests;

import com.yatrik.erp.pages.DashboardPage;
import com.yatrik.erp.pages.LoginPage;
import org.testng.Assert;
import org.testng.annotations.Test;
/**
 * Test class for Login functionality
 */
public class LoginTest extends BaseTest {

    @Test(priority = 1, description = "Verify login page is displayed")
    public void testLoginPageDisplayed() {
        driver.get(driver.getCurrentUrl() + "login");
        LoginPage loginPage = new LoginPage(driver);
        Assert.assertTrue(loginPage.isLoginPageDisplayed(), "Login page should be displayed");
    }

    @Test(priority = 2, description = "Verify successful login with valid credentials")
    public void testSuccessfulLogin() {
        driver.get(driver.getCurrentUrl() + "login");
        LoginPage loginPage = new LoginPage(driver);
        
        // Login with valid credentials
        loginPage.login("akhilshijo8@gmail.com", "Akhil@123");
        
        // Wait for navigation
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Verify user is logged in
        DashboardPage dashboardPage = new DashboardPage(driver);
        Assert.assertTrue(dashboardPage.isUserLoggedIn(), "User should be logged in");
    }

    @Test(priority = 3, description = "Verify login fails with invalid credentials")
    public void testLoginWithInvalidCredentials() {
        driver.get(driver.getCurrentUrl() + "login");
        LoginPage loginPage = new LoginPage(driver);
        
        // Login with invalid credentials
        loginPage.login("invalid@email.com", "wrongpassword");
        
        // Wait for error message
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Verify error message or still on login page
        Assert.assertTrue(
            loginPage.isLoginPageDisplayed() || loginPage.isErrorMessageDisplayed(),
            "Should show error or remain on login page"
        );
    }

    @Test(priority = 4, description = "Verify login with empty credentials")
    public void testLoginWithEmptyCredentials() {
        driver.get(driver.getCurrentUrl() + "login");
        LoginPage loginPage = new LoginPage(driver);
        
        // Try to login with empty credentials
        loginPage.clickLoginButton();
        
        // Should remain on login page
        Assert.assertTrue(loginPage.isLoginPageDisplayed(), "Should remain on login page");
    }
}

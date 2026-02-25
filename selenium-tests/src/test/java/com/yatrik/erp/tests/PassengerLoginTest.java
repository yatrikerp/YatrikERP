package com.yatrik.erp.tests;

import com.yatrik.erp.config.TestConfig;
import com.yatrik.erp.pages.LoginPage;
import com.yatrik.erp.pages.PassengerDashboardPage;
import org.testng.Assert;
import org.testng.annotations.Test;

/**
 * Fast automated tests for Passenger login
 */
public class PassengerLoginTest extends BaseTest {

    @Test(priority = 1, description = "Complete flow: Home → Login → Dashboard → Logout")
    public void testPassengerCompleteFlow() {
        System.out.println("🏠 Starting from Home Page...");
        
        // Step 1: Start at Home Page
        driver.get(TestConfig.getBaseUrl());
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        System.out.println("🔐 Navigating to Login Page...");
        
        // Step 2: Navigate to Login Page
        driver.get(TestConfig.getBaseUrl() + "login");
        try {
            Thread.sleep(1500);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        LoginPage loginPage = new LoginPage(driver);
        
        System.out.println("⌨️  Entering Passenger Credentials...");
        
        // Step 3: Enter Credentials
        loginPage.login("ritotensy@gmail.com", "Yatrik123");
        
        // Step 4: Wait for Dashboard
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Step 5: Verify Dashboard
        PassengerDashboardPage dashboardPage = new PassengerDashboardPage(driver);
        Assert.assertTrue(
            dashboardPage.isPassengerDashboardDisplayed(),
            "Passenger should be on dashboard"
        );
        
        System.out.println("✅ Passenger Dashboard Loaded! Viewing dashboard...");
        
        // Step 6: View dashboard
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Step 7: Logout
        System.out.println("🚪 Logging out...");
        dashboardPage.logout();
        
        // Step 8: Confirm logout
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        System.out.println("✅ Passenger Complete Flow Test Finished!");
    }

    @Test(priority = 2, description = "Verify passenger login with invalid credentials fails")
    public void testPassengerInvalidLogin() {
        driver.get(TestConfig.getBaseUrl() + "login");
        LoginPage loginPage = new LoginPage(driver);
        
        loginPage.login("passenger@yatrik.com", "wrongpassword");
        
        try {
            Thread.sleep(1500);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Should remain on login page
        Assert.assertTrue(loginPage.isLoginPageDisplayed(), "Should remain on login page after failed login");
    }
}

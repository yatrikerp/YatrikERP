package com.yatrik.erp.tests;

import com.yatrik.erp.config.TestConfig;
import com.yatrik.erp.pages.LoginPage;
import com.yatrik.erp.pages.AdminDashboardPage;
import org.testng.Assert;
import org.testng.annotations.Test;

/**
 * Fast automated tests for Admin login
 */
public class AdminLoginTest extends BaseTest {

    @Test(priority = 1, description = "Complete flow: Home → Login → Dashboard → Logout")
    public void testAdminCompleteFlow() {
        System.out.println("🏠 Starting from Home Page...");
        
        // Step 1: Start at Home Page
        driver.get(TestConfig.getBaseUrl());
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        System.out.println("🔐 Navigating to Login Page...");
        
        // Step 2: Navigate to Login Page
        driver.get(TestConfig.getBaseUrl() + "login");
        
        // Wait for React to fully load the login form
        try {
            Thread.sleep(4000); // Increased wait for React
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        LoginPage loginPage = new LoginPage(driver);
        
        System.out.println("⌨️  Entering Admin Credentials...");
        
        // Step 3: Enter Credentials (instant typing)
        loginPage.login("admin@yatrik.com", "Yatrik123");
        
        // Step 4: Wait for Dashboard to load
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Step 5: Verify Dashboard is displayed
        AdminDashboardPage dashboardPage = new AdminDashboardPage(driver);
        Assert.assertTrue(
            dashboardPage.isAdminDashboardDisplayed(),
            "Admin should be on dashboard"
        );
        
        System.out.println("✅ Admin Dashboard Loaded!");
        
        // Step 6: View the dashboard briefly
        try {
            Thread.sleep(1500);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Step 7: Logout
        System.out.println("🚪 Logging out...");
        dashboardPage.logout();
        
        // Step 8: Confirm logout
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        System.out.println("✅ Admin Complete Flow Test Finished!");
    }

    @Test(priority = 2, description = "Verify admin login with wrong password fails")
    public void testAdminInvalidPassword() {
        driver.get(TestConfig.getBaseUrl() + "login");
        LoginPage loginPage = new LoginPage(driver);
        
        loginPage.login("admin@yatrik.com", "wrongpassword");
        
        try {
            Thread.sleep(1500);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Should remain on login page
        Assert.assertTrue(loginPage.isLoginPageDisplayed(), "Should remain on login page after failed login");
    }
}

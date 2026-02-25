package com.yatrik.erp.tests;

import com.yatrik.erp.config.TestConfig;
import com.yatrik.erp.pages.LoginPage;
import com.yatrik.erp.pages.AdminDashboardPage;
import org.testng.Assert;
import org.testng.annotations.Test;

/**
 * Fast automated tests for Super Admin login
 */
public class SuperAdminLoginTest extends BaseTest {

    @Test(priority = 1, description = "Complete flow: Home → Login → Dashboard → Logout")
    public void testSuperAdminCompleteFlow() {
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
        
        System.out.println("⌨️  Entering Super Admin Credentials...");
        
        // Step 3: Enter Credentials
        loginPage.login("stateadmin@yatrik.com", "Yatrik123");
        
        // Step 4: Wait for Dashboard
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Step 5: Verify Dashboard
        AdminDashboardPage dashboardPage = new AdminDashboardPage(driver);
        Assert.assertTrue(
            dashboardPage.isAdminDashboardDisplayed(),
            "Super Admin should be on dashboard"
        );
        
        System.out.println("✅ Super Admin Dashboard Loaded! Viewing dashboard...");
        
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
        
        System.out.println("✅ Super Admin Complete Flow Test Finished!");
    }
}

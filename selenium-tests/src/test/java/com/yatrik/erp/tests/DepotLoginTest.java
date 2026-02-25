package com.yatrik.erp.tests;

import com.yatrik.erp.config.TestConfig;
import com.yatrik.erp.pages.LoginPage;
import com.yatrik.erp.pages.DepotDashboardPage;
import org.testng.Assert;
import org.testng.annotations.Test;

/**
 * Fast automated tests for Depot login
 */
public class DepotLoginTest extends BaseTest {

    @Test(priority = 1, description = "Complete flow: Home → Login → Dashboard → Logout")
    public void testDepotCompleteFlow() {
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
        
        System.out.println("⌨️  Entering Depot Credentials...");
        
        // Step 3: Enter Credentials
        loginPage.login("kch-depot@yatrik.com", "KCH@2024");
        
        // Step 4: Wait for Dashboard
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Step 5: Verify Dashboard
        DepotDashboardPage dashboardPage = new DepotDashboardPage(driver);
        Assert.assertTrue(
            dashboardPage.isDepotDashboardDisplayed(),
            "Depot user should be on dashboard"
        );
        
        System.out.println("✅ Depot Dashboard Loaded! Viewing dashboard...");
        
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
        
        System.out.println("✅ Depot Complete Flow Test Finished!");
    }

    @Test(priority = 2, description = "Verify depot login with wrong password fails")
    public void testDepotInvalidPassword() {
        driver.get(TestConfig.getBaseUrl() + "login");
        LoginPage loginPage = new LoginPage(driver);
        
        loginPage.login("depot@yatrik.com", "wrongpassword");
        
        try {
            Thread.sleep(1500);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Should remain on login page
        Assert.assertTrue(loginPage.isLoginPageDisplayed(), "Should remain on login page after failed login");
    }

    @Test(priority = 3, description = "Verify depot-specific login page works")
    public void testDepotSpecificLoginPage() {
        driver.get(TestConfig.getBaseUrl() + "depot-login");
        
        // Wait for page load
        try {
            Thread.sleep(1500);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Verify depot login page is displayed
        String currentUrl = driver.getCurrentUrl();
        Assert.assertTrue(
            currentUrl.contains("/depot-login"),
            "Should be on depot-specific login page"
        );
    }
}

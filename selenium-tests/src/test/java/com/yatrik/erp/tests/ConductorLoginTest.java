package com.yatrik.erp.tests;

import com.yatrik.erp.config.TestConfig;
import com.yatrik.erp.pages.LoginPage;
import com.yatrik.erp.pages.ConductorDashboardPage;
import org.testng.Assert;
import org.testng.annotations.Test;

/**
 * Fast automated tests for Conductor login
 */
public class ConductorLoginTest extends BaseTest {

    @Test(priority = 1, description = "Verify conductor can login, see dashboard, and logout")
    public void testConductorLoginAndLogout() {
        driver.get(TestConfig.getBaseUrl() + "login");
        LoginPage loginPage = new LoginPage(driver);
        
        System.out.println("🔐 Testing Conductor Login...");
        
        // Login with CORRECT conductor credentials
        loginPage.login("conductor001.conductor@yatrik.com", "Yatrik123");
        
        // Wait for navigation
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Verify conductor dashboard is displayed
        ConductorDashboardPage dashboardPage = new ConductorDashboardPage(driver);
        Assert.assertTrue(
            dashboardPage.isConductorDashboardDisplayed(),
            "Conductor should be on dashboard"
        );
        
        System.out.println("✅ Conductor Dashboard Loaded!");
        
        // Wait to see the dashboard
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Logout
        System.out.println("🚪 Logging out...");
        dashboardPage.logout();
        
        // Wait to see logout
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        System.out.println("✅ Conductor Test Complete!");
    }

    @Test(priority = 2, description = "Verify conductor login with invalid credentials fails")
    public void testConductorInvalidLogin() {
        driver.get(TestConfig.getBaseUrl() + "login");
        LoginPage loginPage = new LoginPage(driver);
        
        loginPage.login("conductor1@yatrik.com", "wrongpassword");
        
        try {
            Thread.sleep(1500);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Should remain on login page
        Assert.assertTrue(loginPage.isLoginPageDisplayed(), "Should remain on login page after failed login");
    }
}

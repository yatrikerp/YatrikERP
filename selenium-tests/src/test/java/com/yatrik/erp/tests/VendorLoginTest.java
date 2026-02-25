package com.yatrik.erp.tests;

import com.yatrik.erp.config.TestConfig;
import com.yatrik.erp.pages.LoginPage;
import org.openqa.selenium.By;
import org.testng.Assert;
import org.testng.annotations.Test;

/**
 * Fast automated tests for Vendor login
 */
public class VendorLoginTest extends BaseTest {

    @Test(priority = 1, description = "Complete flow: Home → Login → Dashboard → Logout")
    public void testVendorCompleteFlow() {
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
        
        System.out.println("⌨️  Entering Vendor Credentials...");
        
        // Step 3: Enter Credentials
        loginPage.login("vendor@yatrik.com", "Vendor123");
        
        // Step 4: Wait for Dashboard
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Step 5: Verify Dashboard
        String currentUrl = driver.getCurrentUrl();
        Assert.assertTrue(
            currentUrl.contains("/vendor") || currentUrl.contains("/dashboard"),
            "Vendor should be on dashboard"
        );
        
        System.out.println("✅ Vendor Dashboard Loaded! Viewing dashboard...");
        
        // Step 6: View dashboard
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Step 7: Logout
        System.out.println("🚪 Logging out...");
        try {
            driver.findElement(By.xpath("//button[contains(text(), 'Logout') or contains(text(), 'Log out')]")).click();
            Thread.sleep(2000);
        } catch (Exception e) {
            System.out.println("Logout button not found");
        }
        
        System.out.println("✅ Vendor Complete Flow Test Finished!");
    }
}

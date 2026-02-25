package com.yatrik.erp.tests;

import com.yatrik.erp.config.TestConfig;
import org.testng.annotations.Test;

/**
 * Diagnostic test to check if React app is running and accessible
 */
public class DiagnosticTest extends BaseTest {

    @Test(priority = 1, description = "Check if React app is accessible")
    public void testReactAppAccessible() {
        System.out.println("🔍 Diagnostic Test: Checking React app...");
        
        // Navigate to home page
        driver.get(TestConfig.getBaseUrl());
        
        // Wait to see the page
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // Print page title and URL
        System.out.println("📄 Page Title: " + driver.getTitle());
        System.out.println("🌐 Current URL: " + driver.getCurrentUrl());
        System.out.println("📝 Page Source Length: " + driver.getPageSource().length() + " characters");
        
        // Print first 500 characters of page source
        String pageSource = driver.getPageSource();
        System.out.println("📋 Page Source Preview:");
        System.out.println(pageSource.substring(0, Math.min(500, pageSource.length())));
        
        System.out.println("\n🔍 Now checking login page...");
        
        // Navigate to login page
        driver.get(TestConfig.getBaseUrl() + "login");
        
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        System.out.println("📄 Login Page Title: " + driver.getTitle());
        System.out.println("🌐 Login Page URL: " + driver.getCurrentUrl());
        
        // Check if email input exists
        try {
            driver.findElement(org.openqa.selenium.By.id("email"));
            System.out.println("✅ Email input found by ID!");
        } catch (Exception e) {
            System.out.println("❌ Email input NOT found by ID");
        }
        
        try {
            driver.findElement(org.openqa.selenium.By.cssSelector("input[type='email']"));
            System.out.println("✅ Email input found by CSS selector!");
        } catch (Exception e) {
            System.out.println("❌ Email input NOT found by CSS selector");
        }
        
        // Wait to see the page
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        System.out.println("✅ Diagnostic test complete - check the output above!");
    }
}

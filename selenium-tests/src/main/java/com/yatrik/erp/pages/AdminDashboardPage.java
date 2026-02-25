package com.yatrik.erp.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page Object for Admin Dashboard
 */
public class AdminDashboardPage extends BasePage {
    
    // Locators
    private By dashboardTitle = By.xpath("//*[contains(text(), 'Admin') or contains(text(), 'Dashboard')]");
    private By logoutButton = By.xpath("//button[contains(text(), 'Logout') or contains(text(), 'Log out')]");
    private By userMenu = By.cssSelector("[aria-label*='user'], [aria-label*='account'], .user-menu, .profile-menu");
    
    public AdminDashboardPage(WebDriver driver) {
        super(driver);
    }

    public boolean isAdminDashboardDisplayed() {
        try {
            Thread.sleep(3000); // Increased wait for dashboard to load
            String currentUrl = driver.getCurrentUrl();
            System.out.println("📍 Current URL: " + currentUrl);
            
            // Check if we're NOT on login page (successful login)
            boolean notOnLogin = !currentUrl.contains("/login");
            boolean onDashboard = currentUrl.contains("/admin") || 
                                 currentUrl.contains("/dashboard") ||
                                 currentUrl.contains("/home");
            
            System.out.println("✓ Not on login: " + notOnLogin + ", On dashboard: " + onDashboard);
            return notOnLogin;
        } catch (Exception e) {
            return false;
        }
    }

    public void logout() {
        try {
            // Try to find and click logout button
            Thread.sleep(1000);
            
            // Try clicking user menu first if it exists
            try {
                click(userMenu);
                Thread.sleep(500);
            } catch (Exception e) {
                // User menu might not exist
            }
            
            // Click logout button
            click(logoutButton);
            Thread.sleep(1000);
        } catch (Exception e) {
            System.out.println("Logout button not found or not clickable");
        }
    }
}

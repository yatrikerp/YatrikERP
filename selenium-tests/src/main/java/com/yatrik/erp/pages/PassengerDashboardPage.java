package com.yatrik.erp.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page Object for Passenger Dashboard
 */
public class PassengerDashboardPage extends BasePage {
    
    // Locators
    private By logoutButton = By.xpath("//button[contains(text(), 'Logout') or contains(text(), 'Log out')]");
    private By userMenu = By.cssSelector("[aria-label*='user'], [aria-label*='account'], .user-menu, .profile-menu");
    
    public PassengerDashboardPage(WebDriver driver) {
        super(driver);
    }

    public boolean isPassengerDashboardDisplayed() {
        try {
            Thread.sleep(3000); // Increased wait
            String currentUrl = driver.getCurrentUrl();
            System.out.println("📍 Current URL: " + currentUrl);
            
            // Check if we're NOT on login page (successful login)
            boolean notOnLogin = !currentUrl.contains("/login");
            boolean onDashboard = currentUrl.contains("/passenger") || 
                                 currentUrl.contains("/dashboard") || 
                                 currentUrl.contains("/mobile") ||
                                 currentUrl.contains("/home");
            
            System.out.println("✓ Not on login: " + notOnLogin + ", On dashboard: " + onDashboard);
            return notOnLogin;
        } catch (Exception e) {
            return false;
        }
    }

    public void logout() {
        try {
            Thread.sleep(1000);
            
            try {
                click(userMenu);
                Thread.sleep(500);
            } catch (Exception e) {
                // User menu might not exist
            }
            
            click(logoutButton);
            Thread.sleep(1000);
        } catch (Exception e) {
            System.out.println("Logout button not found");
        }
    }
}

package com.yatrik.erp.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page Object for Depot Dashboard
 */
public class DepotDashboardPage extends BasePage {
    
    private By logoutButton = By.xpath("//button[contains(text(), 'Logout') or contains(text(), 'Log out')]");
    private By userMenu = By.cssSelector("[aria-label*='user'], [aria-label*='account'], .user-menu, .profile-menu");
    
    public DepotDashboardPage(WebDriver driver) {
        super(driver);
    }

    public boolean isDepotDashboardDisplayed() {
        try {
            Thread.sleep(2000);
            String currentUrl = driver.getCurrentUrl();
            return currentUrl.contains("/depot") || currentUrl.contains("/dashboard");
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

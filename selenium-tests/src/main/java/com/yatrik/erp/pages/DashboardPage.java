package com.yatrik.erp.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page Object Model for Dashboard Page
 */
public class DashboardPage extends BasePage {
    
    // Locators
    private By logoutButton = By.id("logout");
    private By dashboardTitle = By.cssSelector("h1, h2");
    private By userProfile = By.cssSelector(".user-profile, .profile");
    private By navigationMenu = By.cssSelector("nav, .navigation");

    public DashboardPage(WebDriver driver) {
        super(driver);
    }

    public boolean isDashboardDisplayed() {
        return isDisplayed(dashboardTitle);
    }

    public String getDashboardTitle() {
        return getText(dashboardTitle);
    }

    public boolean isLogoutButtonDisplayed() {
        return isDisplayed(logoutButton);
    }

    public void clickLogout() {
        click(logoutButton);
    }

    public boolean isUserLoggedIn() {
        return isDisplayed(logoutButton) || isDisplayed(userProfile);
    }
}

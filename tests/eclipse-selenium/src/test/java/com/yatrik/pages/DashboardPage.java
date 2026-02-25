package com.yatrik.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

public class DashboardPage {
    private WebDriver driver;
    private WebDriverWait wait;

    @FindBy(css = ".dashboard-header, h1")
    private WebElement dashboardHeader;

    @FindBy(css = ".user-profile, .profile-menu")
    private WebElement userProfile;

    @FindBy(linkText = "Logout")
    private WebElement logoutButton;

    @FindBy(css = ".nav-menu a, .sidebar a")
    private List<WebElement> navigationLinks;

    @FindBy(css = ".stats-card, .dashboard-card")
    private List<WebElement> dashboardCards;

    public DashboardPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        PageFactory.initElements(driver, this);
    }

    public boolean isDashboardDisplayed() {
        try {
            wait.until(ExpectedConditions.visibilityOf(dashboardHeader));
            return dashboardHeader.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public String getDashboardTitle() {
        wait.until(ExpectedConditions.visibilityOf(dashboardHeader));
        return dashboardHeader.getText();
    }

    public void clickLogout() {
        wait.until(ExpectedConditions.elementToBeClickable(userProfile));
        userProfile.click();
        wait.until(ExpectedConditions.elementToBeClickable(logoutButton));
        logoutButton.click();
    }

    public boolean isUserProfileDisplayed() {
        return userProfile.isDisplayed();
    }

    public int getNavigationLinksCount() {
        return navigationLinks.size();
    }

    public void clickNavigationLink(String linkText) {
        WebElement link = driver.findElement(By.linkText(linkText));
        wait.until(ExpectedConditions.elementToBeClickable(link));
        link.click();
    }

    public int getDashboardCardsCount() {
        return dashboardCards.size();
    }
}

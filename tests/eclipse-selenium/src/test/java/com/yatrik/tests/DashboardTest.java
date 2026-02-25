package com.yatrik.tests;

import com.yatrik.base.BaseTest;
import com.yatrik.pages.DashboardPage;
import com.yatrik.pages.LoginPage;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

public class DashboardTest extends BaseTest {

    @BeforeMethod
    public void loginBeforeTest() {
        navigateToUrl("/login");
        LoginPage loginPage = new LoginPage(driver);
        loginPage.login("admin@yatrik.com", "admin123");
    }

    @Test(priority = 1, description = "Verify dashboard loads successfully")
    public void testDashboardLoads() {
        DashboardPage dashboardPage = new DashboardPage(driver);
        Assert.assertTrue(dashboardPage.isDashboardDisplayed(), "Dashboard should be displayed");
    }

    @Test(priority = 2, description = "Verify dashboard title is correct")
    public void testDashboardTitle() {
        DashboardPage dashboardPage = new DashboardPage(driver);
        String title = dashboardPage.getDashboardTitle();
        Assert.assertFalse(title.isEmpty(), "Dashboard title should not be empty");
    }

    @Test(priority = 3, description = "Verify user profile is displayed")
    public void testUserProfileDisplayed() {
        DashboardPage dashboardPage = new DashboardPage(driver);
        Assert.assertTrue(dashboardPage.isUserProfileDisplayed(), "User profile should be displayed");
    }

    @Test(priority = 4, description = "Verify navigation links are present")
    public void testNavigationLinks() {
        DashboardPage dashboardPage = new DashboardPage(driver);
        int linksCount = dashboardPage.getNavigationLinksCount();
        Assert.assertTrue(linksCount > 0, "Navigation links should be present");
    }

    @Test(priority = 5, description = "Verify dashboard cards are displayed")
    public void testDashboardCards() {
        DashboardPage dashboardPage = new DashboardPage(driver);
        int cardsCount = dashboardPage.getDashboardCardsCount();
        Assert.assertTrue(cardsCount > 0, "Dashboard cards should be displayed");
    }

    @Test(priority = 6, description = "Verify logout functionality")
    public void testLogout() {
        DashboardPage dashboardPage = new DashboardPage(driver);
        dashboardPage.clickLogout();
        
        // Verify redirected to login page
        LoginPage loginPage = new LoginPage(driver);
        Assert.assertTrue(loginPage.isLoginPageDisplayed(), "Should be redirected to login page after logout");
    }
}

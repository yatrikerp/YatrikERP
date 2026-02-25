package com.yatrik.tests;

import com.yatrik.base.BaseTest;
import com.yatrik.pages.DashboardPage;
import com.yatrik.pages.LoginPage;
import com.yatrik.utils.TestDataProvider;
import org.testng.Assert;
import org.testng.annotations.Test;

public class LoginTest extends BaseTest {

    @Test(priority = 1, description = "Verify successful login with valid credentials")
    public void testSuccessfulLogin() {
        navigateToUrl("/login");
        
        LoginPage loginPage = new LoginPage(driver);
        Assert.assertTrue(loginPage.isLoginPageDisplayed(), "Login page should be displayed");
        
        // Login with admin credentials
        loginPage.login("admin@yatrik.com", "admin123");
        
        // Verify dashboard is displayed
        DashboardPage dashboardPage = new DashboardPage(driver);
        Assert.assertTrue(dashboardPage.isDashboardDisplayed(), "Dashboard should be displayed after login");
    }

    @Test(priority = 2, description = "Verify login fails with invalid credentials")
    public void testLoginWithInvalidCredentials() {
        navigateToUrl("/login");
        
        LoginPage loginPage = new LoginPage(driver);
        loginPage.login("invalid@email.com", "wrongpassword");
        
        // Verify error message is displayed
        Assert.assertTrue(loginPage.isErrorMessageDisplayed(), "Error message should be displayed");
    }

    @Test(priority = 3, description = "Verify login with empty email")
    public void testLoginWithEmptyEmail() {
        navigateToUrl("/login");
        
        LoginPage loginPage = new LoginPage(driver);
        loginPage.enterEmail("");
        loginPage.enterPassword("password123");
        loginPage.clickLoginButton();
        
        // Verify still on login page
        Assert.assertTrue(loginPage.isLoginPageDisplayed(), "Should remain on login page");
    }

    @Test(priority = 4, description = "Verify login with empty password")
    public void testLoginWithEmptyPassword() {
        navigateToUrl("/login");
        
        LoginPage loginPage = new LoginPage(driver);
        loginPage.enterEmail("admin@yatrik.com");
        loginPage.enterPassword("");
        loginPage.clickLoginButton();
        
        // Verify still on login page
        Assert.assertTrue(loginPage.isLoginPageDisplayed(), "Should remain on login page");
    }

    @Test(priority = 5, description = "Verify depot user login", dataProvider = "depotUserData", dataProviderClass = TestDataProvider.class)
    public void testDepotUserLogin(String email, String password) {
        navigateToUrl("/login");
        
        LoginPage loginPage = new LoginPage(driver);
        loginPage.login(email, password);
        
        DashboardPage dashboardPage = new DashboardPage(driver);
        Assert.assertTrue(dashboardPage.isDashboardDisplayed(), "Depot dashboard should be displayed");
    }

    @Test(priority = 6, description = "Verify state user login", dataProvider = "stateUserData", dataProviderClass = TestDataProvider.class)
    public void testStateUserLogin(String email, String password) {
        navigateToUrl("/login");
        
        LoginPage loginPage = new LoginPage(driver);
        loginPage.login(email, password);
        
        DashboardPage dashboardPage = new DashboardPage(driver);
        Assert.assertTrue(dashboardPage.isDashboardDisplayed(), "State dashboard should be displayed");
    }

    @Test(priority = 7, description = "Verify vendor user login", dataProvider = "vendorUserData", dataProviderClass = TestDataProvider.class)
    public void testVendorUserLogin(String email, String password) {
        navigateToUrl("/login");
        
        LoginPage loginPage = new LoginPage(driver);
        loginPage.login(email, password);
        
        DashboardPage dashboardPage = new DashboardPage(driver);
        Assert.assertTrue(dashboardPage.isDashboardDisplayed(), "Vendor dashboard should be displayed");
    }

    @Test(priority = 8, description = "Verify passenger user login", dataProvider = "passengerUserData", dataProviderClass = TestDataProvider.class)
    public void testPassengerUserLogin(String email, String password) {
        navigateToUrl("/login");
        
        LoginPage loginPage = new LoginPage(driver);
        loginPage.login(email, password);
        
        DashboardPage dashboardPage = new DashboardPage(driver);
        Assert.assertTrue(dashboardPage.isDashboardDisplayed(), "Passenger dashboard should be displayed");
    }
}

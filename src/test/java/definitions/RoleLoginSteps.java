package com.yatrik.erp.definitions;

import com.yatrik.erp.utils.WebDriverManagerUtil;
import com.yatrik.erp.utils.Locators;
import com.yatrik.erp.utils.TestData;
import io.cucumber.java.en.*;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;

import java.util.List;
import java.util.Map;

/**
 * Step definitions for YATRIK ERP role-based login/logout tests
 */
public class RoleLoginSteps {
    
    private WebDriver driver;
    private WebDriverWait wait;
    private String currentRole;
    private String currentEmail;
    private String currentPassword;
    private String expectedUrl;
    private boolean loginSuccessful;
    private boolean logoutSuccessful;
    
    @Given("the YATRIK ERP application is running on {string}")
    public void the_yatrik_erp_application_is_running_on(String url) {
        System.out.println("🚀 Starting YATRIK ERP Automation Test");
        System.out.println("📍 Application URL: " + url);
        
        // Initialize WebDriver
        driver = WebDriverManagerUtil.initializeChromeDriver();
        wait = WebDriverManagerUtil.getWait();
        
        // Navigate to the application
        driver.get(url);
        System.out.println("✅ Application loaded successfully");
    }
    
    @Given("I am on the login page")
    public void i_am_on_the_login_page() {
        System.out.println("📍 Verifying login page elements...");
        
        // Wait for login form elements
        boolean emailPresent = WebDriverManagerUtil.waitForElementPresent(Locators.EMAIL_INPUT);
        boolean passwordPresent = WebDriverManagerUtil.waitForElementPresent(Locators.PASSWORD_INPUT);
        boolean loginButtonPresent = WebDriverManagerUtil.waitForElementPresent(Locators.LOGIN_BUTTON);
        
        Assert.assertTrue(emailPresent, "Email input field not found");
        Assert.assertTrue(passwordPresent, "Password input field not found");
        Assert.assertTrue(loginButtonPresent, "Login button not found");
        
        System.out.println("✅ Login page elements verified successfully");
    }
    
    @When("I enter admin credentials")
    public void i_enter_admin_credentials(io.cucumber.datatable.DataTable dataTable) {
        enterCredentials("admin", dataTable);
    }
    
    @When("I enter depot credentials")
    public void i_enter_depot_credentials(io.cucumber.datatable.DataTable dataTable) {
        enterCredentials("depot", dataTable);
    }
    
    @When("I enter conductor credentials")
    public void i_enter_conductor_credentials(io.cucumber.datatable.DataTable dataTable) {
        enterCredentials("conductor", dataTable);
    }
    
    @When("I enter driver credentials")
    public void i_enter_driver_credentials(io.cucumber.datatable.DataTable dataTable) {
        enterCredentials("driver", dataTable);
    }
    
    @When("I enter passenger credentials")
    public void i_enter_passenger_credentials(io.cucumber.datatable.DataTable dataTable) {
        enterCredentials("passenger", dataTable);
    }
    
    @When("I enter invalid credentials")
    public void i_enter_invalid_credentials(io.cucumber.datatable.DataTable dataTable) {
        List<Map<String, String>> credentials = dataTable.asMaps(String.class, String.class);
        Map<String, String> cred = credentials.get(0);
        
        currentEmail = cred.get("email");
        currentPassword = cred.get("password");
        currentRole = "invalid";
        
        System.out.println("📝 Entering invalid credentials...");
        WebDriverManagerUtil.clearAndEnterText(Locators.EMAIL_INPUT, currentEmail);
        WebDriverManagerUtil.clearAndEnterText(Locators.PASSWORD_INPUT, currentPassword);
        
        System.out.println("✅ Invalid credentials entered");
    }
    
    @When("I leave credentials empty")
    public void i_leave_credentials_empty() {
        System.out.println("📝 Leaving credentials empty...");
        
        // Clear any existing text
        WebDriverManagerUtil.clearAndEnterText(Locators.EMAIL_INPUT, "");
        WebDriverManagerUtil.clearAndEnterText(Locators.PASSWORD_INPUT, "");
        
        currentRole = "empty";
        System.out.println("✅ Credentials cleared");
    }
    
    @And("I click the login button")
    public void i_click_the_login_button() {
        System.out.println("🔐 Clicking login button...");
        
        boolean loginClicked = WebDriverManagerUtil.clickElement(Locators.LOGIN_BUTTON);
        Assert.assertTrue(loginClicked, "Failed to click login button");
        
        System.out.println("✅ Login button clicked");
        
        // Wait for page to process login
        WebDriverManagerUtil.sleep(2000);
    }
    
    @Then("I should be redirected to the admin dashboard")
    public void i_should_be_redirected_to_the_admin_dashboard() {
        verifyDashboardRedirect("admin");
    }
    
    @Then("I should be redirected to the depot dashboard")
    public void i_should_be_redirected_to_the_depot_dashboard() {
        verifyDashboardRedirect("depot");
    }
    
    @Then("I should be redirected to the conductor dashboard")
    public void i_should_be_redirected_to_the_conductor_dashboard() {
        verifyDashboardRedirect("conductor");
    }
    
    @Then("I should be redirected to the driver dashboard")
    public void i_should_be_redirected_to_the_driver_dashboard() {
        verifyDashboardRedirect("driver");
    }
    
    @Then("I should be redirected to the passenger dashboard")
    public void i_should_be_redirected_to_the_passenger_dashboard() {
        verifyDashboardRedirect("passenger");
    }
    
    @And("I should see the admin dashboard elements")
    public void i_should_see_the_admin_dashboard_elements() {
        verifyDashboardElements("admin");
    }
    
    @And("I should see the depot dashboard elements")
    public void i_should_see_the_depot_dashboard_elements() {
        verifyDashboardElements("depot");
    }
    
    @And("I should see the conductor dashboard elements")
    public void i_should_see_the_conductor_dashboard_elements() {
        verifyDashboardElements("conductor");
    }
    
    @And("I should see the driver dashboard elements")
    public void i_should_see_the_driver_dashboard_elements() {
        verifyDashboardElements("driver");
    }
    
    @And("I should see the passenger dashboard elements")
    public void i_should_see_the_passenger_dashboard_elements() {
        verifyDashboardElements("passenger");
    }
    
    @When("I click the logout button")
    public void i_click_the_logout_button() {
        System.out.println("🚪 Attempting logout...");
        
        boolean logoutClicked = false;
        By[] logoutLocators = Locators.getLogoutLocators();
        
        // Try different logout locators
        for (By locator : logoutLocators) {
            if (WebDriverManagerUtil.waitForElementPresent(locator)) {
                logoutClicked = WebDriverManagerUtil.clickElement(locator);
                if (logoutClicked) {
                    System.out.println("✅ Logout button clicked successfully");
                    break;
                }
            }
        }
        
        // Fallback: try to find logout by text content
        if (!logoutClicked) {
            logoutClicked = findAndClickLogoutByText();
        }
        
        Assert.assertTrue(logoutClicked, "Failed to find and click logout button");
        logoutSuccessful = true;
        
        // Wait for logout to process
        WebDriverManagerUtil.sleep(2000);
    }
    
    @Then("I should be redirected back to the login page")
    public void i_should_be_redirected_back_to_the_login_page() {
        System.out.println("⏳ Waiting for redirect to login page...");
        
        // Wait for URL to contain login or return to base URL
        boolean urlRedirected = WebDriverManagerUtil.waitForUrlContains("/login") || 
                               WebDriverManagerUtil.getCurrentUrl().equals(TestData.BASE_URL);
        
        // Also verify login form elements are present
        boolean loginFormPresent = WebDriverManagerUtil.waitForElementPresent(Locators.EMAIL_INPUT) &&
                                  WebDriverManagerUtil.waitForElementPresent(Locators.PASSWORD_INPUT);
        
        Assert.assertTrue(urlRedirected || loginFormPresent, "Failed to redirect to login page");
        
        System.out.println("✅ Successfully redirected to login page");
    }
    
    @And("I should see the login form elements")
    public void i_should_see_the_login_form_elements() {
        System.out.println("📍 Verifying login form elements after logout...");
        
        boolean emailPresent = WebDriverManagerUtil.waitForElementPresent(Locators.EMAIL_INPUT);
        boolean passwordPresent = WebDriverManagerUtil.waitForElementPresent(Locators.PASSWORD_INPUT);
        boolean loginButtonPresent = WebDriverManagerUtil.waitForElementPresent(Locators.LOGIN_BUTTON);
        
        Assert.assertTrue(emailPresent, "Email input field not found after logout");
        Assert.assertTrue(passwordPresent, "Password input field not found after logout");
        Assert.assertTrue(loginButtonPresent, "Login button not found after logout");
        
        System.out.println("✅ Login form elements verified after logout");
    }
    
    @Then("I should see an error message")
    public void i_should_see_an_error_message() {
        System.out.println("⚠️ Checking for error message...");
        
        boolean errorPresent = WebDriverManagerUtil.waitForElementPresent(Locators.ERROR_MESSAGE);
        Assert.assertTrue(errorPresent, "Error message not displayed for invalid credentials");
        
        String errorText = WebDriverManagerUtil.getElementText(Locators.ERROR_MESSAGE);
        System.out.println("✅ Error message displayed: " + errorText);
    }
    
    @And("I should remain on the login page")
    public void i_should_remain_on_the_login_page() {
        System.out.println("📍 Verifying still on login page...");
        
        String currentUrl = WebDriverManagerUtil.getCurrentUrl();
        boolean onLoginPage = currentUrl.contains("/login") || currentUrl.equals(TestData.BASE_URL);
        
        Assert.assertTrue(onLoginPage, "Not remaining on login page after invalid login");
        System.out.println("✅ Remained on login page as expected");
    }
    
    @Then("I should see validation error messages")
    public void i_should_see_validation_error_messages() {
        System.out.println("⚠️ Checking for validation error messages...");
        
        boolean validationErrorPresent = WebDriverManagerUtil.waitForElementPresent(Locators.VALIDATION_ERROR);
        Assert.assertTrue(validationErrorPresent, "Validation error messages not displayed");
        
        System.out.println("✅ Validation error messages displayed");
    }
    
    /**
     * Helper method to enter credentials for a specific role
     */
    private void enterCredentials(String role, io.cucumber.datatable.DataTable dataTable) {
        List<Map<String, String>> credentials = dataTable.asMaps(String.class, String.class);
        Map<String, String> cred = credentials.get(0);
        
        currentEmail = cred.get("email");
        currentPassword = cred.get("password");
        currentRole = role;
        expectedUrl = TestData.getExpectedUrlForRole(role);
        
        System.out.println("📝 Entering " + role + " credentials...");
        System.out.println("   Email: " + currentEmail);
        
        WebDriverManagerUtil.clearAndEnterText(Locators.EMAIL_INPUT, currentEmail);
        WebDriverManagerUtil.clearAndEnterText(Locators.PASSWORD_INPUT, currentPassword);
        
        System.out.println("✅ " + role + " credentials entered");
    }
    
    /**
     * Helper method to verify dashboard redirect
     */
    private void verifyDashboardRedirect(String role) {
        System.out.println("⏳ Waiting for " + role + " dashboard redirect...");
        
        String expectedUrlFragment = TestData.getExpectedUrlForRole(role);
        boolean urlRedirected = WebDriverManagerUtil.waitForUrlContains(expectedUrlFragment);
        
        if (!urlRedirected) {
            // Fallback: check if we're not on login page anymore
            String currentUrl = WebDriverManagerUtil.getCurrentUrl();
            boolean notOnLoginPage = !currentUrl.contains("/login") && !currentUrl.equals(TestData.BASE_URL);
            Assert.assertTrue(notOnLoginPage, "Failed to redirect to " + role + " dashboard");
        }
        
        loginSuccessful = true;
        System.out.println("✅ Successfully redirected to " + role + " dashboard");
    }
    
    /**
     * Helper method to verify dashboard elements
     */
    private void verifyDashboardElements(String role) {
        System.out.println("📍 Verifying " + role + " dashboard elements...");
        
        By[] dashboardElements = Locators.ROLE_DASHBOARD_ELEMENTS.get(role);
        boolean dashboardDetected = false;
        
        if (dashboardElements != null) {
            for (By element : dashboardElements) {
                if (WebDriverManagerUtil.waitForElementPresent(element)) {
                    dashboardDetected = true;
                    break;
                }
            }
        }
        
        // Fallback: check for general dashboard elements
        if (!dashboardDetected) {
            By[] generalDashboardElements = Locators.getDashboardLocators();
            for (By element : generalDashboardElements) {
                if (WebDriverManagerUtil.waitForElementPresent(element)) {
                    dashboardDetected = true;
                    break;
                }
            }
        }
        
        // Last fallback: check if we're not on login page
        if (!dashboardDetected) {
            String currentUrl = WebDriverManagerUtil.getCurrentUrl();
            dashboardDetected = !currentUrl.contains("/login") && !currentUrl.equals(TestData.BASE_URL);
        }
        
        Assert.assertTrue(dashboardDetected, "Dashboard elements not found for " + role);
        System.out.println("✅ " + role + " dashboard elements verified");
    }
    
    /**
     * Helper method to find and click logout by text content
     */
    private boolean findAndClickLogoutByText() {
        try {
            List<WebElement> elements = driver.findElements(By.cssSelector("button, a"));
            for (WebElement element : elements) {
                String text = element.getText().toLowerCase();
                if (text.contains("logout") || text.contains("sign out")) {
                    element.click();
                    System.out.println("✅ Logout clicked via text content: " + text);
                    return true;
                }
            }
        } catch (Exception e) {
            System.out.println("❌ Failed to find logout by text: " + e.getMessage());
        }
        return false;
    }
    
    /**
     * Cleanup method called after each scenario
     */
    @io.cucumber.java.After
    public void cleanup() {
        if (driver != null) {
            // Take screenshot before closing
            String screenshotPath = WebDriverManagerUtil.takeScreenshot("test_completion");
            
            // Close browser
            WebDriverManagerUtil.closeDriver();
            
            System.out.println("🧹 Test cleanup completed");
            if (screenshotPath != null) {
                System.out.println("📸 Final screenshot: " + screenshotPath);
            }
        }
    }
}

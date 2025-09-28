package com.yatrik.erp.utils;

import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Locator utility class containing all page element locators
 */
public class Locators {
    
    // Login Page Locators
    public static final By EMAIL_INPUT = By.name("email");
    public static final By PASSWORD_INPUT = By.name("password");
    public static final By LOGIN_BUTTON = By.cssSelector("button[type='submit']");
    public static final By LOGIN_FORM = By.cssSelector("form");
    public static final By ERROR_MESSAGE = By.cssSelector(".error, .alert-danger, [role='alert']");
    public static final By VALIDATION_ERROR = By.cssSelector(".invalid-feedback, .text-danger");
    
    // Dashboard Detection Locators
    public static final By DASHBOARD_CONTAINER = By.cssSelector("[data-testid='dashboard'], .dashboard-container");
    public static final By ADMIN_DASHBOARD = By.cssSelector("[data-testid='admin-dashboard'], .admin-dashboard");
    public static final By DEPOT_DASHBOARD = By.cssSelector("[data-testid='depot-dashboard'], .depot-dashboard");
    public static final By CONDUCTOR_DASHBOARD = By.cssSelector("[data-testid='conductor-dashboard'], .conductor-dashboard");
    public static final By DRIVER_DASHBOARD = By.cssSelector("[data-testid='driver-dashboard'], .driver-dashboard");
    public static final By PASSENGER_DASHBOARD = By.cssSelector("[data-testid='passenger-dashboard'], .passenger-dashboard");
    
    // Logout Locators
    public static final By LOGOUT_BUTTON = By.cssSelector("[data-testid='logout-btn'], button[aria-label='Logout'], a[title='Logout']");
    public static final By LOGOUT_LINK = By.linkText("Logout");
    public static final By SIGN_OUT_BUTTON = By.linkText("Sign Out");
    
    // Navigation Locators
    public static final By SIDEBAR_MENU = By.cssSelector("nav, .sidebar, .menu");
    public static final By NAVIGATION_LINKS = By.cssSelector("nav a, .sidebar a, .menu a");
    
    // Common Elements
    public static final By PAGE_TITLE = By.tagName("h1");
    public static final By PAGE_HEADING = By.cssSelector("h1, h2, h3");
    public static final By LOADING_SPINNER = By.cssSelector(".spinner, .loading, [data-testid='loading']");
    
    // Role-specific dashboard elements
    public static final Map<String, By[]> ROLE_DASHBOARD_ELEMENTS = new HashMap<String, By[]>() {{
        put("admin", new By[]{
            ADMIN_DASHBOARD,
            By.cssSelector("[data-testid='admin-menu'], .admin-menu"),
            By.cssSelector("a[href*='/admin']")
        });
        put("depot", new By[]{
            DEPOT_DASHBOARD,
            By.cssSelector("[data-testid='depot-menu'], .depot-menu"),
            By.cssSelector("a[href*='/depot']")
        });
        put("conductor", new By[]{
            CONDUCTOR_DASHBOARD,
            By.cssSelector("[data-testid='conductor-menu'], .conductor-menu"),
            By.cssSelector("a[href*='/conductor']")
        });
        put("driver", new By[]{
            DRIVER_DASHBOARD,
            By.cssSelector("[data-testid='driver-menu'], .driver-menu"),
            By.cssSelector("a[href*='/driver']")
        });
        put("passenger", new By[]{
            PASSENGER_DASHBOARD,
            By.cssSelector("[data-testid='passenger-menu'], .passenger-menu"),
            By.cssSelector("a[href*='/passenger']")
        });
    }};
    
    // Expected URLs for each role
    public static final Map<String, String> ROLE_EXPECTED_URLS = new HashMap<String, String>() {{
        put("admin", "/admin");
        put("depot", "/depot");
        put("conductor", "/conductor");
        put("driver", "/driver");
        put("passenger", "/passenger");
    }};
    
    /**
     * Get logout locators in order of preference
     */
    public static By[] getLogoutLocators() {
        return new By[]{
            LOGOUT_BUTTON,
            LOGOUT_LINK,
            SIGN_OUT_BUTTON,
            By.cssSelector("button:contains('Logout')"),
            By.cssSelector("a:contains('Logout')"),
            By.cssSelector("button:contains('Sign Out')"),
            By.cssSelector("a:contains('Sign Out')")
        };
    }
    
    /**
     * Get dashboard detection locators
     */
    public static By[] getDashboardLocators() {
        return new By[]{
            DASHBOARD_CONTAINER,
            ADMIN_DASHBOARD,
            DEPOT_DASHBOARD,
            CONDUCTOR_DASHBOARD,
            DRIVER_DASHBOARD,
            PASSENGER_DASHBOARD
        };
    }
    
    /**
     * Get login form locators
     */
    public static By[] getLoginFormLocators() {
        return new By[]{
            EMAIL_INPUT,
            PASSWORD_INPUT,
            LOGIN_BUTTON,
            LOGIN_FORM
        };
    }
}

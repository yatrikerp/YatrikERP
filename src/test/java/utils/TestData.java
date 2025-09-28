package com.yatrik.erp.utils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Test data utility class containing user credentials and test configuration
 */
public class TestData {
    
    // User credentials for different roles
    public static final Map<String, Map<String, String>> USER_CREDENTIALS = new HashMap<String, Map<String, String>>() {{
        put("admin", new HashMap<String, String>() {{
            put("email", "admin@yatrik.com");
            put("password", "admin123");
            put("role", "Admin");
            put("expectedUrl", "/admin");
        }});
        
        put("depot", new HashMap<String, String>() {{
            put("email", "depot-plk@yatrik.com");
            put("password", "Akhil@123");
            put("role", "Depot");
            put("expectedUrl", "/depot");
        }});
        
        put("conductor", new HashMap<String, String>() {{
            put("email", "joel@gmail.com");
            put("password", "Yatrik123");
            put("role", "Conductor");
            put("expectedUrl", "/conductor");
        }});
        
        put("driver", new HashMap<String, String>() {{
            put("email", "rejith@gmail.com");
            put("password", "Akhil@123");
            put("role", "Driver");
            put("expectedUrl", "/driver");
        }});
        
        put("passenger", new HashMap<String, String>() {{
            put("email", "lijithmk2026@mca.ajce.in");
            put("password", "Akhil@123");
            put("role", "Passenger");
            put("expectedUrl", "/passenger");
        }});
    }};
    
    // Invalid credentials for negative testing
    public static final Map<String, String> INVALID_CREDENTIALS = new HashMap<String, String>() {{
        put("email", "invalid@test.com");
        put("password", "wrongpass");
    }};
    
    // Test configuration
    public static final String BASE_URL = "http://localhost:5173/login";
    public static final int IMPLICIT_WAIT = 10;
    public static final int EXPLICIT_WAIT = 15;
    public static final int PAGE_LOAD_TIMEOUT = 30;
    
    // Test priorities
    public static final String HIGH_PRIORITY = "High";
    public static final String MEDIUM_PRIORITY = "Medium";
    public static final String LOW_PRIORITY = "Low";
    
    // Test status
    public static final String PASSED = "PASSED";
    public static final String FAILED = "FAILED";
    public static final String SKIPPED = "SKIPPED";
    
    /**
     * Get credentials for a specific role
     */
    public static Map<String, String> getCredentialsForRole(String role) {
        return USER_CREDENTIALS.get(role.toLowerCase());
    }
    
    /**
     * Get email for a specific role
     */
    public static String getEmailForRole(String role) {
        Map<String, String> credentials = getCredentialsForRole(role);
        return credentials != null ? credentials.get("email") : "";
    }
    
    /**
     * Get password for a specific role
     */
    public static String getPasswordForRole(String role) {
        Map<String, String> credentials = getCredentialsForRole(role);
        return credentials != null ? credentials.get("password") : "";
    }
    
    /**
     * Get expected URL for a specific role
     */
    public static String getExpectedUrlForRole(String role) {
        Map<String, String> credentials = getCredentialsForRole(role);
        return credentials != null ? credentials.get("expectedUrl") : "";
    }
    
    /**
     * Get current timestamp for test reports
     */
    public static String getCurrentTimestamp() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }
    
    /**
     * Get current date for test reports
     */
    public static String getCurrentDate() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
    }
    
    /**
     * Get test case ID based on role
     */
    public static String getTestCaseId(String role) {
        return "TC_" + role.toUpperCase() + "_LOGIN_LOGOUT_001";
    }
    
    /**
     * Get test title based on role
     */
    public static String getTestTitle(String role) {
        return role.substring(0, 1).toUpperCase() + role.substring(1) + " User Login and Logout Flow";
    }
    
    /**
     * Get test priority based on role
     */
    public static String getTestPriority(String role) {
        switch (role.toLowerCase()) {
            case "admin":
            case "depot":
                return HIGH_PRIORITY;
            case "conductor":
            case "driver":
                return MEDIUM_PRIORITY;
            case "passenger":
                return LOW_PRIORITY;
            default:
                return MEDIUM_PRIORITY;
        }
    }
}

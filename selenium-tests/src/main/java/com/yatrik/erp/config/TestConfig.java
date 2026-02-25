package com.yatrik.erp.config;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;

/**
 * Configuration class for test settings
 */
public class TestConfig {
    private static Properties properties;
    private static final String CONFIG_FILE = "src/test/resources/config.properties";

    static {
        properties = new Properties();
        try {
            FileInputStream fis = new FileInputStream(CONFIG_FILE);
            properties.load(fis);
            fis.close();
        } catch (IOException e) {
            System.err.println("Failed to load config file: " + e.getMessage());
            // Set default values
            properties.setProperty("base.url", "http://localhost:3000");
            properties.setProperty("browser", "chrome");
            properties.setProperty("headless", "false");
            properties.setProperty("implicit.wait", "10");
            properties.setProperty("explicit.wait", "20");
            properties.setProperty("page.load.timeout", "30");
        }
    }

    public static String getBaseUrl() {
        return properties.getProperty("base.url");
    }

    public static String getBrowser() {
        String browser = System.getProperty("browser");
        return browser != null ? browser : properties.getProperty("browser");
    }

    public static boolean isHeadless() {
        String headless = System.getProperty("headless");
        return headless != null ? Boolean.parseBoolean(headless) : 
               Boolean.parseBoolean(properties.getProperty("headless"));
    }

    public static int getImplicitWait() {
        return Integer.parseInt(properties.getProperty("implicit.wait"));
    }

    public static int getExplicitWait() {
        return Integer.parseInt(properties.getProperty("explicit.wait"));
    }

    public static int getPageLoadTimeout() {
        return Integer.parseInt(properties.getProperty("page.load.timeout"));
    }

    public static String getProperty(String key) {
        return properties.getProperty(key);
    }
}

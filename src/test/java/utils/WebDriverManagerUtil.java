package com.yatrik.erp.utils;

import java.io.File;
import java.io.IOException;
import java.time.Duration;

import org.apache.commons.io.FileUtils;
import org.openqa.selenium.By;
import org.openqa.selenium.ElementNotInteractableException;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import io.github.bonigarcia.wdm.WebDriverManager;

/**
 * WebDriver utility class for managing browser instances and common operations
 */
public class WebDriverManagerUtil {
    
    private static WebDriver driver;
    private static WebDriverWait wait;
    private static final String BASE_URL = "http://localhost:5173/login";
    private static final int IMPLICIT_WAIT = 10;
    private static final int EXPLICIT_WAIT = 15;
    
    /**
     * Initialize Chrome WebDriver with optimized settings
     */
    public static WebDriver initializeChromeDriver() {
        WebDriverManager.chromedriver().setup();
        
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--start-maximized");
        options.addArguments("--disable-web-security");
        options.addArguments("--disable-features=VizDisplayCompositor");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--disable-extensions");
        options.addArguments("--disable-gpu");
        options.addArguments("--remote-allow-origins=*");
        
        driver = new ChromeDriver(options);
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(IMPLICIT_WAIT));
        driver.manage().window().maximize();
        
        wait = new WebDriverWait(driver, Duration.ofSeconds(EXPLICIT_WAIT));
        
        System.out.println("✅ Chrome WebDriver initialized successfully");
        return driver;
    }
    
    /**
     * Initialize Firefox WebDriver
     */
    public static WebDriver initializeFirefoxDriver() {
        WebDriverManager.firefoxdriver().setup();
        
        FirefoxOptions options = new FirefoxOptions();
        options.addArguments("--start-maximized");
        
        driver = new FirefoxDriver(options);
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(IMPLICIT_WAIT));
        driver.manage().window().maximize();
        
        wait = new WebDriverWait(driver, Duration.ofSeconds(EXPLICIT_WAIT));
        
        System.out.println("✅ Firefox WebDriver initialized successfully");
        return driver;
    }
    
    /**
     * Initialize Edge WebDriver
     */
    public static WebDriver initializeEdgeDriver() {
        WebDriverManager.edgedriver().setup();
        
        EdgeOptions options = new EdgeOptions();
        options.addArguments("--start-maximized");
        options.addArguments("--disable-web-security");
        options.addArguments("--remote-allow-origins=*");
        
        driver = new EdgeDriver(options);
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(IMPLICIT_WAIT));
        driver.manage().window().maximize();
        
        wait = new WebDriverWait(driver, Duration.ofSeconds(EXPLICIT_WAIT));
        
        System.out.println("✅ Edge WebDriver initialized successfully");
        return driver;
    }
    
    /**
     * Get current WebDriver instance
     */
    public static WebDriver getDriver() {
        return driver;
    }
    
    /**
     * Get WebDriverWait instance
     */
    public static WebDriverWait getWait() {
        return wait;
    }
    
    /**
     * Navigate to the base URL
     */
    public static void navigateToBaseUrl() {
        driver.get(BASE_URL);
        System.out.println("📍 Navigated to: " + BASE_URL);
    }
    
    /**
     * Wait for element to be present and visible
     */
    public static boolean waitForElementPresent(By locator) {
        try {
            wait.until(ExpectedConditions.presenceOfElementLocated(locator));
            wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
            return true;
        } catch (TimeoutException e) {
            System.out.println("❌ Element not found: " + locator);
            return false;
        }
    }
    
    /**
     * Wait for element to be clickable
     */
    public static boolean waitForElementClickable(By locator) {
        try {
            wait.until(ExpectedConditions.elementToBeClickable(locator));
            return true;
        } catch (TimeoutException e) {
            System.out.println("❌ Element not clickable: " + locator);
            return false;
        }
    }
    
    /**
     * Wait for URL to contain specific text
     */
    public static boolean waitForUrlContains(String urlFragment) {
        try {
            wait.until(ExpectedConditions.urlContains(urlFragment));
            return true;
        } catch (TimeoutException e) {
            System.out.println("❌ URL does not contain: " + urlFragment);
            return false;
        }
    }
    
    /**
     * Take screenshot and save to file
     */
    public static String takeScreenshot(String testName) {
        try {
            TakesScreenshot screenshot = (TakesScreenshot) driver;
            File sourceFile = screenshot.getScreenshotAs(OutputType.FILE);
            
            String timestamp = java.time.LocalDateTime.now()
                .toString().replace(":", "-").replace(".", "-");
            String fileName = testName + "_" + timestamp + ".png";
            String filePath = "target/screenshots/" + fileName;
            
            File destFile = new File(filePath);
            FileUtils.copyFile(sourceFile, destFile);
            
            System.out.println("📸 Screenshot saved: " + filePath);
            return filePath;
        } catch (IOException e) {
            System.out.println("❌ Failed to take screenshot: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Scroll to element using JavaScript
     */
    public static void scrollToElement(By locator) {
        try {
            JavascriptExecutor js = (JavascriptExecutor) driver;
            js.executeScript("arguments[0].scrollIntoView(true);", driver.findElement(locator));
            Thread.sleep(500); // Small delay for scroll animation
        } catch (Exception e) {
            System.out.println("❌ Failed to scroll to element: " + e.getMessage());
        }
    }
    
    /**
     * Click element using JavaScript (fallback method)
     */
    public static void clickElementWithJS(By locator) {
        try {
            JavascriptExecutor js = (JavascriptExecutor) driver;
            js.executeScript("arguments[0].click();", driver.findElement(locator));
            System.out.println("✅ Element clicked using JavaScript: " + locator);
        } catch (Exception e) {
            System.out.println("❌ Failed to click element with JS: " + e.getMessage());
        }
    }
    
    /**
     * Get current page title
     */
    public static String getPageTitle() {
        return driver.getTitle();
    }
    
    /**
     * Get current URL
     */
    public static String getCurrentUrl() {
        return driver.getCurrentUrl();
    }
    
    /**
     * Check if element is displayed
     */
    public static boolean isElementDisplayed(By locator) {
        try {
            return driver.findElement(locator).isDisplayed();
        } catch (NoSuchElementException e) {
            return false;
        }
    }
    
    /**
     * Get element text
     */
    public static String getElementText(By locator) {
        try {
            return driver.findElement(locator).getText();
        } catch (NoSuchElementException e) {
            return "";
        }
    }
    
    /**
     * Clear and enter text in input field
     */
    public static void clearAndEnterText(By locator, String text) {
        try {
            driver.findElement(locator).clear();
            driver.findElement(locator).sendKeys(text);
            System.out.println("✅ Text entered: " + text);
        } catch (ElementNotInteractableException e) {
            System.out.println("❌ Element not interactable, trying JavaScript click");
            clickElementWithJS(locator);
            driver.findElement(locator).clear();
            driver.findElement(locator).sendKeys(text);
        }
    }
    
    /**
     * Click element with retry mechanism
     */
    public static boolean clickElement(By locator) {
        try {
            if (waitForElementClickable(locator)) {
                driver.findElement(locator).click();
                System.out.println("✅ Element clicked: " + locator);
                return true;
            }
            return false;
        } catch (ElementNotInteractableException e) {
            System.out.println("❌ Element not clickable, trying JavaScript click");
            clickElementWithJS(locator);
            return true;
        }
    }
    
    /**
     * Close browser and cleanup
     */
    public static void closeDriver() {
        if (driver != null) {
            driver.quit();
            driver = null;
            wait = null;
            System.out.println("🧹 WebDriver closed and cleaned up");
        }
    }
    
    /**
     * Sleep for specified milliseconds
     */
    public static void sleep(int milliseconds) {
        try {
            Thread.sleep(milliseconds);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}

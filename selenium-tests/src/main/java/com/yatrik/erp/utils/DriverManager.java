package com.yatrik.erp.utils;

import com.yatrik.erp.config.TestConfig;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;

import java.time.Duration;

/**
 * WebDriver management class
 */
public class DriverManager {
    private static ThreadLocal<WebDriver> driver = new ThreadLocal<>();

    public static WebDriver getDriver() {
        if (driver.get() == null) {
            driver.set(createDriver());
        }
        return driver.get();
    }

    private static WebDriver createDriver() {
        WebDriver webDriver;
        String browser = TestConfig.getBrowser().toLowerCase();
        boolean headless = TestConfig.isHeadless();

        switch (browser) {
            case "firefox":
                WebDriverManager.firefoxdriver().setup();
                FirefoxOptions firefoxOptions = new FirefoxOptions();
                if (headless) {
                    firefoxOptions.addArguments("--headless");
                }
                webDriver = new FirefoxDriver(firefoxOptions);
                break;

            case "edge":
                WebDriverManager.edgedriver().setup();
                EdgeOptions edgeOptions = new EdgeOptions();
                if (headless) {
                    edgeOptions.addArguments("--headless");
                }
                webDriver = new EdgeDriver(edgeOptions);
                break;

            case "chrome":
            default:
                WebDriverManager.chromedriver().setup();
                ChromeOptions chromeOptions = new ChromeOptions();
                if (headless) {
                    chromeOptions.addArguments("--headless");
                }
                chromeOptions.addArguments("--disable-gpu");
                chromeOptions.addArguments("--no-sandbox");
                chromeOptions.addArguments("--disable-dev-shm-usage");
                chromeOptions.addArguments("--window-size=1920,1080");
                webDriver = new ChromeDriver(chromeOptions);
                break;
        }

        // Set timeouts
        webDriver.manage().timeouts()
                .implicitlyWait(Duration.ofSeconds(TestConfig.getImplicitWait()));
        webDriver.manage().timeouts()
                .pageLoadTimeout(Duration.ofSeconds(TestConfig.getPageLoadTimeout()));
        webDriver.manage().window().maximize();

        return webDriver;
    }

    public static void quitDriver() {
        if (driver.get() != null) {
            driver.get().quit();
            driver.remove();
        }
    }
}

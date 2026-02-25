package com.yatrik.erp.tests;

import com.yatrik.erp.config.TestConfig;
import com.yatrik.erp.utils.DriverManager;
import com.yatrik.erp.utils.ScreenshotUtil;
import org.openqa.selenium.WebDriver;
import org.testng.ITestResult;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;

/**
 * Base test class with setup and teardown
 */
public class BaseTest {
    protected WebDriver driver;

    @BeforeMethod
    public void setUp() {
        driver = DriverManager.getDriver();
        driver.get(TestConfig.getBaseUrl());
    }

    @AfterMethod
    public void tearDown(ITestResult result) {
        // Take screenshot on failure
        if (result.getStatus() == ITestResult.FAILURE) {
            ScreenshotUtil.takeScreenshot(driver, result.getName());
        }
        DriverManager.quitDriver();
    }
}

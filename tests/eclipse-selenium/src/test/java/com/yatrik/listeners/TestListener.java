package com.yatrik.listeners;

import com.yatrik.utils.ScreenshotUtil;
import org.openqa.selenium.WebDriver;
import org.testng.ITestContext;
import org.testng.ITestListener;
import org.testng.ITestResult;

public class TestListener implements ITestListener {

    @Override
    public void onTestStart(ITestResult result) {
        System.out.println("Test Started: " + result.getName());
    }

    @Override
    public void onTestSuccess(ITestResult result) {
        System.out.println("Test Passed: " + result.getName());
    }

    @Override
    public void onTestFailure(ITestResult result) {
        System.out.println("Test Failed: " + result.getName());
        
        // Capture screenshot on failure
        Object testClass = result.getInstance();
        try {
            WebDriver driver = (WebDriver) testClass.getClass().getField("driver").get(testClass);
            ScreenshotUtil.captureScreenshot(driver, result.getName());
        } catch (Exception e) {
            System.out.println("Unable to capture screenshot: " + e.getMessage());
        }
    }

    @Override
    public void onTestSkipped(ITestResult result) {
        System.out.println("Test Skipped: " + result.getName());
    }

    @Override
    public void onStart(ITestContext context) {
        System.out.println("Test Suite Started: " + context.getName());
    }

    @Override
    public void onFinish(ITestContext context) {
        System.out.println("Test Suite Finished: " + context.getName());
        System.out.println("Passed Tests: " + context.getPassedTests().size());
        System.out.println("Failed Tests: " + context.getFailedTests().size());
        System.out.println("Skipped Tests: " + context.getSkippedTests().size());
    }
}

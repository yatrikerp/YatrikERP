package com.yatrik.erp.utils;

import org.apache.commons.io.FileUtils;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * Utility class for taking screenshots
 */
public class ScreenshotUtil {
    private static final String SCREENSHOT_DIR = "test-reports/screenshots/";

    public static String takeScreenshot(WebDriver driver, String testName) {
        // Create directory if it doesn't exist
        File directory = new File(SCREENSHOT_DIR);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        // Generate filename with timestamp
        String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
        String fileName = testName + "_" + timestamp + ".png";
        String filePath = SCREENSHOT_DIR + fileName;

        try {
            TakesScreenshot screenshot = (TakesScreenshot) driver;
            File srcFile = screenshot.getScreenshotAs(OutputType.FILE);
            File destFile = new File(filePath);
            FileUtils.copyFile(srcFile, destFile);
            System.out.println("Screenshot saved: " + filePath);
            return filePath;
        } catch (IOException e) {
            System.err.println("Failed to save screenshot: " + e.getMessage());
            return null;
        }
    }
}

package com.yatrik.utils;

import org.apache.commons.io.FileUtils;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;

public class ScreenshotUtil {

    public static String captureScreenshot(WebDriver driver, String screenshotName) {
        String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
        String fileName = screenshotName + "_" + timestamp + ".png";
        String destination = System.getProperty("user.dir") + "/test-output/screenshots/" + fileName;

        try {
            TakesScreenshot ts = (TakesScreenshot) driver;
            File source = ts.getScreenshotAs(OutputType.FILE);
            File finalDestination = new File(destination);
            
            // Create directory if it doesn't exist
            finalDestination.getParentFile().mkdirs();
            
            FileUtils.copyFile(source, finalDestination);
            System.out.println("Screenshot saved: " + destination);
            return destination;
        } catch (IOException e) {
            System.out.println("Failed to capture screenshot: " + e.getMessage());
            return null;
        }
    }
}

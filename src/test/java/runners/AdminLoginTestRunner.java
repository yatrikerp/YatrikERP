package com.yatrik.erp.runners;

import io.cucumber.testng.AbstractTestNGCucumberTests;
import io.cucumber.testng.CucumberOptions;
import org.testng.annotations.DataProvider;

/**
 * TestNG Cucumber Test Runner for Admin Login Tests
 */
@CucumberOptions(
    features = "src/test/resources/features/roleLogin.feature",
    glue = {"com.yatrik.erp.definitions"},
    plugin = {
        "pretty",
        "html:target/cucumber-reports/admin-tests",
        "json:target/cucumber-reports/admin-tests.json",
        "junit:target/cucumber-reports/admin-tests.xml"
    },
    tags = "@AdminLogin",
    monochrome = true
)
public class AdminLoginTestRunner extends AbstractTestNGCucumberTests {
    
    @Override
    @DataProvider(parallel = false)
    public Object[][] scenarios() {
        return super.scenarios();
    }
}

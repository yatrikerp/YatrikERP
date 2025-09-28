package com.yatrik.erp.runners;

import io.cucumber.testng.AbstractTestNGCucumberTests;
import io.cucumber.testng.CucumberOptions;
import org.testng.annotations.DataProvider;

/**
 * TestNG Cucumber Test Runner for Driver Login Tests
 */
@CucumberOptions(
    features = "src/test/resources/features/roleLogin.feature",
    glue = {"com.yatrik.erp.definitions"},
    plugin = {
        "pretty",
        "html:target/cucumber-reports/driver-tests",
        "json:target/cucumber-reports/driver-tests.json",
        "junit:target/cucumber-reports/driver-tests.xml"
    },
    tags = "@DriverLogin",
    monochrome = true
)
public class DriverLoginTestRunner extends AbstractTestNGCucumberTests {
    
    @Override
    @DataProvider(parallel = false)
    public Object[][] scenarios() {
        return super.scenarios();
    }
}

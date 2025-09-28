package com.yatrik.erp.runners;

import io.cucumber.testng.AbstractTestNGCucumberTests;
import io.cucumber.testng.CucumberOptions;
import org.testng.annotations.DataProvider;

/**
 * TestNG Cucumber Test Runner for Passenger Login Tests
 */
@CucumberOptions(
    features = "src/test/resources/features/roleLogin.feature",
    glue = {"com.yatrik.erp.definitions"},
    plugin = {
        "pretty",
        "html:target/cucumber-reports/passenger-tests",
        "json:target/cucumber-reports/passenger-tests.json",
        "junit:target/cucumber-reports/passenger-tests.xml"
    },
    tags = "@PassengerLogin",
    monochrome = true
)
public class PassengerLoginTestRunner extends AbstractTestNGCucumberTests {
    
    @Override
    @DataProvider(parallel = false)
    public Object[][] scenarios() {
        return super.scenarios();
    }
}

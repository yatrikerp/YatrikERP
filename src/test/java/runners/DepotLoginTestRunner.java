package com.yatrik.erp.runners;

import io.cucumber.testng.AbstractTestNGCucumberTests;
import io.cucumber.testng.CucumberOptions;
import org.testng.annotations.DataProvider;

/**
 * TestNG Cucumber Test Runner for Depot Login Tests
 */
@CucumberOptions(
    features = "src/test/resources/features/roleLogin.feature",
    glue = {"com.yatrik.erp.definitions"},
    plugin = {
        "pretty",
        "html:target/cucumber-reports/depot-tests",
        "json:target/cucumber-reports/depot-tests.json",
        "junit:target/cucumber-reports/depot-tests.xml"
    },
    tags = "@DepotLogin",
    monochrome = true
)
public class DepotLoginTestRunner extends AbstractTestNGCucumberTests {
    
    @Override
    @DataProvider(parallel = false)
    public Object[][] scenarios() {
        return super.scenarios();
    }
}

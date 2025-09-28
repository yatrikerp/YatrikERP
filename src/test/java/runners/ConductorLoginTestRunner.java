package com.yatrik.erp.runners;

import io.cucumber.testng.AbstractTestNGCucumberTests;
import io.cucumber.testng.CucumberOptions;
import org.testng.annotations.DataProvider;

/**
 * TestNG Cucumber Test Runner for Conductor Login Tests
 */
@CucumberOptions(
    features = "src/test/resources/features/roleLogin.feature",
    glue = {"com.yatrik.erp.definitions"},
    plugin = {
        "pretty",
        "html:target/cucumber-reports/conductor-tests",
        "json:target/cucumber-reports/conductor-tests.json",
        "junit:target/cucumber-reports/conductor-tests.xml"
    },
    tags = "@ConductorLogin",
    monochrome = true
)
public class ConductorLoginTestRunner extends AbstractTestNGCucumberTests {
    
    @Override
    @DataProvider(parallel = false)
    public Object[][] scenarios() {
        return super.scenarios();
    }
}

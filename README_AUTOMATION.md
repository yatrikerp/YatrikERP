# YATRIK ERP Automation Test Suite



## Overview
This test suite contains comprehensive Selenium automation tests for the YATRIK ERP system using Java + Cucumber (BDD) framework. The tests cover role-based login and logout functionality for all user types.

## Project Structure
```
src/
├── test/
│   ├── java/
│   │   ├── definitions/          # Cucumber step definitions
│   │   │   └── RoleLoginSteps.java
│   │   ├── runners/             # TestNG Cucumber runners
│   │   │   ├── RoleLoginTestRunner.java
│   │   │   ├── AdminLoginTestRunner.java
│   │   │   ├── DepotLoginTestRunner.java
│   │   │   ├── ConductorLoginTestRunner.java
│   │   │   ├── DriverLoginTestRunner.java
│   │   │   └── PassengerLoginTestRunner.java
│   │   └── utils/               # Utility classes
│   │       ├── WebDriverManagerUtil.java
│   │       ├── Locators.java
│   │       └── TestData.java
│   └── resources/
│       ├── features/            # Cucumber feature files
│       │   └── roleLogin.feature
│       └── config/             # Configuration files
│           ├── allure.properties
│           └── test.properties
├── pom.xml                     # Maven configuration
└── TEST_CASE_REPORTS.md       # Detailed test case reports
```

## Test Cases Covered

### 1. Admin User Login/Logout (High Priority)
- **Credentials**: admin@yatrik.com / admin123
- **Expected URL**: /admin
- **Test Runner**: AdminLoginTestRunner.java

### 2. Depot User Login/Logout (High Priority)
- **Credentials**: depot-plk@yatrik.com / Akhil@123
- **Expected URL**: /depot
- **Test Runner**: DepotLoginTestRunner.java

### 3. Conductor User Login/Logout (Medium Priority)
- **Credentials**: joel@gmail.com / Yatrik123
- **Expected URL**: /conductor
- **Test Runner**: ConductorLoginTestRunner.java

### 4. Driver User Login/Logout (Medium Priority)
- **Credentials**: rejith@gmail.com / Akhil@123
- **Expected URL**: /driver
- **Test Runner**: DriverLoginTestRunner.java

### 5. Passenger User Login/Logout (Low Priority)
- **Credentials**: lijithmk2026@mca.ajce.in / Akhil@123
- **Expected URL**: /passenger
- **Test Runner**: PassengerLoginTestRunner.java

### 6. Invalid Credentials Test (Negative)
- **Credentials**: invalid@test.com / wrongpass
- **Expected**: Error message displayed

### 7. Empty Credentials Test (Negative)
- **Credentials**: Empty fields
- **Expected**: Validation error messages

## Prerequisites

### Software Requirements
- Java 11 or higher
- Maven 3.6 or higher
- Chrome browser
- ChromeDriver (automatically managed by WebDriverManager)

### Environment Setup
1. Ensure YATRIK ERP application is running on http://localhost:5173/login
2. All user credentials are valid and accessible
3. Chrome browser is installed

## Running Tests

### Run All Tests
```bash
mvn clean test
```

### Run Specific Role Tests
```bash
# Admin tests only
mvn test -Dtest=AdminLoginTestRunner

# Depot tests only
mvn test -Dtest=DepotLoginTestRunner

# Conductor tests only
mvn test -Dtest=ConductorLoginTestRunner

# Driver tests only
mvn test -Dtest=DriverLoginTestRunner

# Passenger tests only
mvn test -Dtest=PassengerLoginTestRunner
```

### Run with Specific Tags
```bash
# High priority tests only
mvn test -Dcucumber.filter.tags="@HighPriority"

# Negative tests only
mvn test -Dcucumber.filter.tags="@NegativeTest"
```

## Test Reports

### Cucumber HTML Reports
- **Location**: `target/cucumber-reports/html/index.html`
- **Features**: Detailed step-by-step execution, screenshots, timing

### Allure Reports
```bash
# Generate Allure report
mvn allure:report

# Serve Allure report
mvn allure:serve
```
- **Location**: `target/allure-report/index.html`
- **Features**: Rich reporting with trends, categories, timeline

### Screenshots
- **Location**: `target/screenshots/`
- **Format**: PNG files with timestamps
- **Naming**: `{testName}_{timestamp}.png`

## Configuration

### Browser Configuration
- **Default**: Chrome (maximized, non-headless)
- **Alternative**: Firefox, Edge (configurable in WebDriverManagerUtil.java)

### Timeout Settings
- **Implicit Wait**: 10 seconds
- **Explicit Wait**: 15 seconds
- **Page Load Timeout**: 30 seconds

### Test Data
- All credentials and URLs are centralized in `TestData.java`
- Easy to modify for different environments

## Troubleshooting

### Common Issues

1. **WebDriver Issues**
   - Ensure Chrome browser is installed
   - WebDriverManager will automatically download ChromeDriver
   - Check Chrome version compatibility

2. **Element Not Found**
   - Verify application is running on correct URL
   - Check if login form elements have correct selectors
   - Increase wait times if needed

3. **Login Failures**
   - Verify user credentials are correct
   - Check if user accounts are active
   - Ensure application backend is running

4. **Dashboard Detection Issues**
   - Verify dashboard URLs are correct
   - Check if dashboard elements have proper selectors
   - Review application routing logic

### Debug Mode
Enable debug logging by adding to `logback.xml`:
```xml
<logger name="com.yatrik.erp" level="DEBUG"/>
```

## Best Practices

### Test Design
- Each test is independent and can run in isolation
- Proper cleanup after each test execution
- Screenshots captured on failures
- Clear console output with emojis for better readability

### Maintenance
- Centralized locators in `Locators.java`
- Test data management in `TestData.java`
- Utility methods in `WebDriverManagerUtil.java`
- Easy to extend for new roles or test cases

### Reporting
- Multiple report formats (HTML, JSON, XML)
- Screenshots for failed tests
- Detailed test case documentation
- Allure integration for rich reporting

## Extending Tests

### Adding New Roles
1. Add credentials to `TestData.java`
2. Add locators to `Locators.java`
3. Create new test runner class
4. Add scenario to `roleLogin.feature`

### Adding New Test Cases
1. Add new scenarios to feature file
2. Implement step definitions in `RoleLoginSteps.java`
3. Add locators if needed
4. Update test reports documentation

## Support
For issues or questions regarding the test suite, please refer to:
- Test case reports: `TEST_CASE_REPORTS.md`
- Configuration files in `src/test/resources/config/`
- Utility classes for implementation details

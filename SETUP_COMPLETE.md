# YATRIK ERP Selenium Automation Test Suite - Complete Setup

## 🎯 Project Overview
This comprehensive Selenium automation test suite for YATRIK ERP uses **Java + Cucumber (BDD)** framework to test role-based login and logout functionality across all user types.

## 📁 Project Structure Created

```
YATRIK ERP/
├── pom.xml                                    # Maven configuration with all dependencies
├── run-tests.bat                             # Windows batch script for easy test execution
├── run-tests.sh                              # Unix/Linux shell script for test execution
├── README_AUTOMATION.md                      # Comprehensive automation documentation
├── TEST_CASE_REPORTS.md                      # Detailed test case reports for all roles
├── src/
│   └── test/
│       ├── java/
│       │   ├── definitions/
│       │   │   └── RoleLoginSteps.java       # Main Cucumber step definitions
│       │   ├── runners/
│       │   │   ├── RoleLoginTestRunner.java  # Main test runner for all tests
│       │   │   ├── AdminLoginTestRunner.java # Admin-specific test runner
│       │   │   ├── DepotLoginTestRunner.java # Depot-specific test runner
│       │   │   ├── ConductorLoginTestRunner.java # Conductor-specific test runner
│       │   │   ├── DriverLoginTestRunner.java # Driver-specific test runner
│       │   │   └── PassengerLoginTestRunner.java # Passenger-specific test runner
│       │   └── utils/
│       │       ├── WebDriverManagerUtil.java # WebDriver management utilities
│       │       ├── Locators.java             # Centralized element locators
│       │       └── TestData.java             # Test data and credentials
│       └── resources/
│           ├── features/
│           │   └── roleLogin.feature         # Cucumber BDD feature file
│           └── config/
│               ├── allure.properties         # Allure reporting configuration
│               └── test.properties           # Test configuration
└── target/                                   # Generated reports and screenshots
    ├── screenshots/
    ├── cucumber-reports/
    ├── allure-results/
    └── allure-report/
```

## 🧪 Test Cases Implemented

### ✅ Role-Based Login/Logout Tests (5 Tests)

1. **Admin User Login/Logout** (High Priority)
   - Credentials: `admin@yatrik.com` / `admin123`
   - Expected URL: `/admin`
   - Test ID: `TC_ADMIN_LOGIN_LOGOUT_001`

2. **Depot User Login/Logout** (High Priority)
   - Credentials: `depot-plk@yatrik.com` / `Akhil@123`
   - Expected URL: `/depot`
   - Test ID: `TC_DEPOT_LOGIN_LOGOUT_001`

3. **Conductor User Login/Logout** (Medium Priority)
   - Credentials: `joel@gmail.com` / `Yatrik123`
   - Expected URL: `/conductor`
   - Test ID: `TC_CONDUCTOR_LOGIN_LOGOUT_001`

4. **Driver User Login/Logout** (Medium Priority)
   - Credentials: `rejith@gmail.com` / `Akhil@123`
   - Expected URL: `/driver`
   - Test ID: `TC_DRIVER_LOGIN_LOGOUT_001`

5. **Passenger User Login/Logout** (Low Priority)
   - Credentials: `lijithmk2026@mca.ajce.in` / `Akhil@123`
   - Expected URL: `/passenger`
   - Test ID: `TC_PASSENGER_LOGIN_LOGOUT_001`

### ✅ Negative Test Cases (2 Tests)

6. **Invalid Credentials Test**
   - Credentials: `invalid@test.com` / `wrongpass`
   - Expected: Error message displayed
   - Test ID: `TC_INVALID_LOGIN_001`

7. **Empty Credentials Test**
   - Credentials: Empty fields
   - Expected: Validation error messages
   - Test ID: `TC_EMPTY_LOGIN_001`

## 🚀 How to Run Tests

### Prerequisites
- Java 11 or higher
- Maven 3.6 or higher
- Chrome browser
- YATRIK ERP application running on `http://localhost:5173/login`

### Quick Start (Windows)
```cmd
# Double-click run-tests.bat or run from command line:
run-tests.bat
```

### Quick Start (Unix/Linux/macOS)
```bash
# Make executable and run:
chmod +x run-tests.sh
./run-tests.sh
```

### Manual Execution
```bash
# Run all tests
mvn clean test

# Run specific role tests
mvn test -Dtest=AdminLoginTestRunner
mvn test -Dtest=DepotLoginTestRunner
mvn test -Dtest=ConductorLoginTestRunner
mvn test -Dtest=DriverLoginTestRunner
mvn test -Dtest=PassengerLoginTestRunner

# Run by priority
mvn test -Dcucumber.filter.tags="@HighPriority"
mvn test -Dcucumber.filter.tags="@MediumPriority"
mvn test -Dcucumber.filter.tags="@LowPriority"

# Run negative tests
mvn test -Dcucumber.filter.tags="@NegativeTest"
```

## 📊 Test Reports Generated

### 1. Cucumber HTML Reports
- **Location**: `target/cucumber-reports/html/index.html`
- **Features**: 
  - Step-by-step execution details
  - Screenshots for failed steps
  - Test timing and statistics
  - Feature and scenario summaries

### 2. Allure Reports
```bash
# Generate Allure report
mvn allure:report

# Serve Allure report (opens in browser)
mvn allure:serve
```
- **Location**: `target/allure-report/index.html`
- **Features**:
  - Rich interactive reports
  - Test trends and history
  - Categories and tags
  - Timeline view
  - Screenshots and attachments

### 3. Screenshots
- **Location**: `target/screenshots/`
- **Format**: PNG files with timestamps
- **Naming**: `{testName}_{timestamp}.png`
- **Captured**: On test failures and completion

### 4. Structured Test Case Reports
- **Location**: `TEST_CASE_REPORTS.md`
- **Format**: Markdown with detailed tables
- **Content**: Complete test case documentation with step-by-step details

## 🔧 Key Features Implemented

### ✅ Cucumber BDD Implementation
- **Feature File**: `roleLogin.feature` with 7 scenarios
- **Step Definitions**: Complete implementation in `RoleLoginSteps.java`
- **Annotations**: `@Given`, `@When`, `@Then`, `@And` properly used
- **Tags**: `@RoleLogin`, `@AdminLogin`, `@DepotLogin`, etc.

### ✅ Selenium WebDriver Integration
- **Browser**: Chrome WebDriver with optimized settings
- **Wait Strategies**: Implicit, explicit, and fluent waits
- **Element Detection**: Multiple fallback selectors for robustness
- **Screenshot Capture**: Automatic on failures and completion

### ✅ Test Data Management
- **Centralized Credentials**: All user credentials in `TestData.java`
- **Environment Configuration**: Base URL and timeouts configurable
- **Role-based Data**: Easy to extend for new roles

### ✅ Robust Element Locators
- **Multiple Selectors**: Fallback strategies for element detection
- **Role-specific Locators**: Dashboard elements for each role
- **Dynamic Detection**: Handles different UI implementations

### ✅ Comprehensive Reporting
- **Multiple Formats**: HTML, JSON, XML, Allure
- **Screenshot Integration**: Visual evidence for failures
- **Detailed Documentation**: Complete test case reports

### ✅ Error Handling & Recovery
- **Graceful Failures**: Proper error messages and cleanup
- **Retry Mechanisms**: Multiple attempts for element interactions
- **JavaScript Fallbacks**: For difficult-to-click elements

## 📋 Test Case Report Format

Each test case includes:
- **Project Name**: YATRIK ERP System
- **Module Name**: User Authentication & Role Management
- **Test Case ID**: Unique identifier (e.g., `TC_ADMIN_LOGIN_LOGOUT_001`)
- **Test Title**: Descriptive test name
- **Test Designed By**: Automation Team
- **Test Executed By**: QA Engineer
- **Test Priority**: High/Medium/Low
- **Test Designed Date**: Creation date
- **Test Executed Date**: Execution date
- **Description**: Test purpose and scope
- **Pre-Condition**: Prerequisites
- **Post-Condition**: Expected state after test
- **Step Table**: Detailed step-by-step execution with Expected vs Actual results

## 🎨 Console Output Features

The tests provide clear console output with:
- ✅ Success indicators
- ❌ Failure indicators
- 📍 Navigation steps
- 🔐 Authentication steps
- 🚪 Logout steps
- 📸 Screenshot notifications
- 🧹 Cleanup notifications

## 🔄 Test Flow Implementation

Each test follows this exact flow:
1. **Open browser** and navigate to login page
2. **Enter role credentials** (email and password)
3. **Click login button**
4. **Verify redirection** to correct dashboard (`/admin`, `/depot`, `/conductor`, `/driver`, `/passenger`)
5. **Verify dashboard elements** are present
6. **Click logout** (link with text "Logout")
7. **Verify return** to login page
8. **Verify login form elements** are present
9. **Close browser**

## 🛠️ Maintenance & Extensibility

### Adding New Roles
1. Add credentials to `TestData.java`
2. Add locators to `Locators.java`
3. Create new test runner class
4. Add scenario to `roleLogin.feature`
5. Update test reports documentation

### Modifying Test Data
- All credentials centralized in `TestData.java`
- Easy to update for different environments
- URL configuration in one place

### Browser Configuration
- Chrome by default (optimized settings)
- Easy to switch to Firefox or Edge
- Headless mode configurable

## 📈 Success Metrics

The test suite provides:
- **7 comprehensive test cases** covering all user roles
- **100% BDD coverage** with Cucumber scenarios
- **Multiple reporting formats** for different stakeholders
- **Robust error handling** with fallback strategies
- **Easy maintenance** with centralized configuration
- **Professional documentation** with detailed test reports

## 🎯 Next Steps

1. **Run the tests** using `run-tests.bat` (Windows) or `run-tests.sh` (Unix/Linux)
2. **Review the reports** in `target/cucumber-reports/html/index.html`
3. **Generate Allure reports** for rich interactive reporting
4. **Customize test data** in `TestData.java` if needed
5. **Extend tests** by adding new scenarios or roles

## 📞 Support

For any issues or questions:
- Check `README_AUTOMATION.md` for detailed documentation
- Review `TEST_CASE_REPORTS.md` for test case details
- Examine utility classes for implementation details
- Check configuration files for customization options

---

**🎉 Your YATRIK ERP Selenium automation test suite is now complete and ready to use!**

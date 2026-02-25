#!/bin/bash

# YATRIK ERP Automation Test Suite Runner
# For Unix/Linux/macOS systems

echo "========================================"
echo "YATRIK ERP Automation Test Suite"
echo "========================================"
echo

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "❌ ERROR: Maven is not installed or not in PATH"
    echo "Please install Maven and try again"
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ ERROR: Java is not installed or not in PATH"
    echo "Please install Java 11+ and try again"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo

# Function to display menu
show_menu() {
    echo "Select test execution option:"
    echo "1. Run All Tests"
    echo "2. Run Admin Tests Only"
    echo "3. Run Depot Tests Only"
    echo "4. Run Conductor Tests Only"
    echo "5. Run Driver Tests Only"
    echo "6. Run Passenger Tests Only"
    echo "7. Run Negative Tests Only"
    echo "8. Generate Allure Report"
    echo "9. Clean and Rebuild"
    echo "0. Exit"
    echo
}

# Function to run all tests
run_all_tests() {
    echo
    echo "🚀 Running All Tests..."
    mvn clean test
}

# Function to run specific role tests
run_role_tests() {
    local role=$1
    echo
    echo "🚀 Running ${role^} Tests..."
    mvn test -Dtest="${role^}LoginTestRunner"
}

# Function to run negative tests
run_negative_tests() {
    echo
    echo "🚀 Running Negative Tests..."
    mvn test -Dcucumber.filter.tags="@NegativeTest"
}

# Function to generate Allure report
generate_allure_report() {
    echo
    echo "📊 Generating Allure Report..."
    mvn allure:report
    echo
    echo "🌐 Opening Allure Report..."
    if command -v open &> /dev/null; then
        open target/allure-report/index.html
    elif command -v xdg-open &> /dev/null; then
        xdg-open target/allure-report/index.html
    else
        echo "Please open target/allure-report/index.html in your browser"
    fi
}

# Function to clean and rebuild
clean_rebuild() {
    echo
    echo "🧹 Cleaning and Rebuilding..."
    mvn clean compile test-compile
}

# Function to show completion message
show_completion() {
    echo
    echo "========================================"
    echo "Test execution completed!"
    echo "========================================"
    echo
    echo "📊 Reports available at:"
    echo "   - Cucumber HTML: target/cucumber-reports/html/index.html"
    echo "   - Allure Report: target/allure-report/index.html"
    echo "   - Screenshots: target/screenshots/"
    echo
}

# Main menu loop
while true; do
    show_menu
    read -p "Enter your choice (0-9): " choice
    
    case $choice in
        1)
            run_all_tests
            show_completion
            ;;
        2)
            run_role_tests "admin"
            show_completion
            ;;
        3)
            run_role_tests "depot"
            show_completion
            ;;
        4)
            run_role_tests "conductor"
            show_completion
            ;;
        5)
            run_role_tests "driver"
            show_completion
            ;;
        6)
            run_role_tests "passenger"
            show_completion
            ;;
        7)
            run_negative_tests
            show_completion
            ;;
        8)
            generate_allure_report
            ;;
        9)
            clean_rebuild
            ;;
        0)
            echo
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "Invalid choice. Please try again."
            ;;
    esac
    
    echo
    read -p "Press Enter to continue..."
    echo
done

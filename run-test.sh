#!/bin/bash

# YATRIK ERP - Playwright Test Runner
# Quick test script for login functionality

echo "🎭 YATRIK ERP Login Test"
echo "========================"
echo ""
echo "📋 Prerequisites:"
echo "1. Make sure your frontend is running on http://localhost:3008"
echo "2. Install Playwright: npm install @playwright/test"
echo "3. Install browsers: npx playwright install"
echo ""
echo "🚀 Running login test..."
echo ""

# Run the test with verbose output
npx playwright test tests/login.spec.js --headed --project=chromium --reporter=list

echo ""
echo "📊 View detailed report:"
echo "   npx playwright show-report"
echo ""
echo "📸 Screenshots saved in: tests/screenshots/"




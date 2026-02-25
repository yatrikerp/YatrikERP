#!/usr/bin/env node

// Selenium Test Runner
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Selenium Test Suite...\n');

// Ensure test results directory exists
const resultsDir = path.join(__dirname, '../../test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

const screenshotsDir = path.join(resultsDir, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const reportsDir = path.join(resultsDir, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Run Mocha tests
const reporterOptions = `reportDir=${reportsDir.replace(/\\/g, '/')},reportFilename=selenium-test-report,html=true,json=true`;

const mocha = spawn('npx', [
  'mocha',
  '"tests/selenium/specs/**/*.test.js"',
  '--timeout', '60000',
  '--reporter', 'spec'
], {
  stdio: 'inherit',
  shell: true
});

mocha.on('close', (code) => {
  console.log('\n' + '='.repeat(60));
  
  if (code === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log(`⚠️  Tests completed with exit code: ${code}`);
  }
  
  console.log('='.repeat(60));
  console.log(`\n📊 Test report: ${path.join(reportsDir, 'selenium-test-report.html')}`);
  console.log(`📸 Screenshots: ${screenshotsDir}\n`);
  
  process.exit(code);
});

mocha.on('error', (error) => {
  console.error('❌ Failed to start test runner:', error);
  process.exit(1);
});

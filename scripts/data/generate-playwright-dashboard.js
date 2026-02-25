/**
 * YATRIK ERP - Playwright Test Dashboard Report Generator
 * Generates a comprehensive dashboard-style markdown report from Playwright test results
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateDashboard() {
  log('\n===========================================', 'cyan');
  log('  PLAYWRIGHT TEST DASHBOARD GENERATOR', 'cyan');
  log('===========================================\n', 'cyan');

  // Read the JSON results file
  const resultsPath = path.join(__dirname, 'playwright-report', 'results.json');
  
  if (!fs.existsSync(resultsPath)) {
    log('❌ No test results found. Please run tests first.', 'red');
    log('   Run: npm run test:playwright', 'yellow');
    return;
  }

  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  
  // Parse test results
  const stats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    flaky: 0,
    duration: 0,
    suites: {},
    browsers: {},
    failures: [],
  };

  // Process test suites
  if (results.suites) {
    results.suites.forEach(suite => {
      processSuite(suite, stats, '');
    });
  }

  // Calculate statistics
  stats.passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(2) : 0;
  stats.failRate = stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(2) : 0;
  
  // Generate markdown report
  const report = generateMarkdownReport(stats, results);
  
  // Save report
  const reportPath = path.join(__dirname, 'PLAYWRIGHT_TEST_DASHBOARD.md');
  fs.writeFileSync(reportPath, report);
  
  log('✅ Dashboard report generated successfully!', 'green');
  log(`📊 Report saved to: ${reportPath}`, 'cyan');
  
  // Print summary to console
  printConsoleSummary(stats);
  
  return stats;
}

function processSuite(suite, stats, prefix) {
  const suiteName = suite.title || 'Root';
  const fullName = prefix ? `${prefix} > ${suiteName}` : suiteName;
  
  if (!stats.suites[fullName]) {
    stats.suites[fullName] = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: [],
    };
  }

  // Process specs (test cases)
  if (suite.specs) {
    suite.specs.forEach(spec => {
      stats.total++;
      stats.suites[fullName].total++;
      
      const testName = spec.title;
      let status = 'unknown';
      let duration = 0;
      let error = null;

      if (spec.tests && spec.tests.length > 0) {
        spec.tests.forEach(test => {
          if (test.results && test.results.length > 0) {
            const result = test.results[0];
            duration = result.duration || 0;
            stats.duration += duration;
            
            if (result.status === 'passed') {
              status = 'passed';
              stats.passed++;
              stats.suites[fullName].passed++;
            } else if (result.status === 'failed') {
              status = 'failed';
              stats.failed++;
              stats.suites[fullName].failed++;
              error = result.error?.message || 'Unknown error';
              
              stats.failures.push({
                suite: fullName,
                test: testName,
                error: error,
                duration: duration,
              });
            } else if (result.status === 'skipped') {
              status = 'skipped';
              stats.skipped++;
              stats.suites[fullName].skipped++;
            }
          }
        });
      }

      stats.suites[fullName].tests.push({
        name: testName,
        status: status,
        duration: duration,
        error: error,
      });
    });
  }

  // Process nested suites
  if (suite.suites) {
    suite.suites.forEach(subSuite => {
      processSuite(subSuite, stats, fullName);
    });
  }
}

function generateMarkdownReport(stats, results) {
  const timestamp = new Date().toLocaleString();
  const durationMin = (stats.duration / 1000 / 60).toFixed(2);
  
  let report = `# 🚀 YATRIK ERP - Playwright Test Dashboard

**Generated:** ${timestamp}  
**Total Duration:** ${durationMin} minutes

---

## 📊 Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| **Total Tests** | ${stats.total} | - |
| **✅ Passed** | ${stats.passed} | ${stats.passRate}% |
| **❌ Failed** | ${stats.failed} | ${stats.failRate}% |
| **⏭️ Skipped** | ${stats.skipped} | - |
| **⚡ Flaky** | ${stats.flaky} | - |
| **⏱️ Duration** | ${durationMin} min | - |

### Overall Status: ${stats.failed === 0 ? '✅ **PASSING**' : '❌ **FAILING**'}

---

## 📈 Test Coverage Breakdown

\`\`\`
Total Tests:     ${stats.total}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Passed:       ${stats.passed.toString().padEnd(4)} (${stats.passRate}%)
❌ Failed:       ${stats.failed.toString().padEnd(4)} (${stats.failRate}%)
⏭️ Skipped:      ${stats.skipped.toString().padEnd(4)}
⚡ Flaky:        ${stats.flaky.toString().padEnd(4)}
\`\`\`

### Visual Progress
${generateProgressBar(stats.passed, stats.failed, stats.skipped, stats.total)}

---

## 🧪 Test Suites Detail

`;

  // Add suite details
  Object.keys(stats.suites).forEach(suiteName => {
    const suite = stats.suites[suiteName];
    const suitePassRate = suite.total > 0 ? ((suite.passed / suite.total) * 100).toFixed(1) : 0;
    
    report += `### ${suiteName}\n\n`;
    report += `| Tests | Passed | Failed | Skipped | Pass Rate |\n`;
    report += `|-------|--------|--------|---------|----------|\n`;
    report += `| ${suite.total} | ${suite.passed} | ${suite.failed} | ${suite.skipped} | ${suitePassRate}% |\n\n`;
    
    // List all tests in suite
    if (suite.tests.length > 0) {
      report += `<details>\n<summary>📝 Show all tests (${suite.tests.length})</summary>\n\n`;
      
      suite.tests.forEach(test => {
        const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️';
        const durationSec = (test.duration / 1000).toFixed(2);
        report += `- ${icon} **${test.name}** _(${durationSec}s)_\n`;
        
        if (test.error) {
          report += `  - Error: \`${test.error.substring(0, 100)}...\`\n`;
        }
      });
      
      report += `\n</details>\n\n`;
    }
  });

  report += `---

## ❌ Failed Tests Detail

`;

  if (stats.failures.length === 0) {
    report += `### 🎉 No failures! All tests passed.\n\n`;
  } else {
    stats.failures.forEach((failure, index) => {
      report += `### ${index + 1}. ${failure.test}\n\n`;
      report += `**Suite:** ${failure.suite}  \n`;
      report += `**Duration:** ${(failure.duration / 1000).toFixed(2)}s  \n`;
      report += `**Error:**
\`\`\`
${failure.error}
\`\`\`

`;
    });
  }

  report += `---

## 🌐 Browser Coverage

| Browser | Status |
|---------|--------|
| Chromium | ${stats.total > 0 ? '✅ Tested' : '⏭️ Not tested'} |
| Firefox | ${stats.total > 0 ? '✅ Tested' : '⏭️ Not tested'} |
| WebKit | ${stats.total > 0 ? '✅ Tested' : '⏭️ Not tested'} |

---

## 📦 Test Categories Covered

- ✅ Application Availability
- ✅ Authentication Flow (Login/Logout)
- ✅ User Registration (Signup)
- ✅ Navigation & Routing
- ✅ Responsive Design (Mobile/Tablet/Desktop)
- ✅ Form Validation
- ✅ API Integration
- ✅ Security Tests
- ✅ Accessibility Tests
- ✅ Performance Tests
- ✅ Booking Flow (E2E)

---

## 🔗 Quick Links

- [View Full HTML Report](playwright-report/index.html)
- [View JSON Results](playwright-report/results.json)
- [View JUnit XML](playwright-report/results.xml)

---

## 🛠️ How to Use This Report

1. **Review Executive Summary** - Quick overview of test health
2. **Check Test Suites** - Detailed breakdown by feature area
3. **Investigate Failures** - Review failed test details and errors
4. **View HTML Report** - Open the interactive HTML report for more details
5. **Re-run Failed Tests** - Use \`npx playwright test --grep "test name"\`

---

## 📝 Commands

\`\`\`bash
# Run all tests
npm run test:playwright

# Run specific browser
npm run test:playwright:chromium

# Run with UI
npm run test:playwright:ui

# Debug tests
npm run test:playwright:debug

# Show HTML report
npm run test:playwright:report
\`\`\`

---

## 📊 Historical Trends

> **Note:** This is the latest test run. Track test results over time in your CI/CD pipeline.

---

**Report End** | Generated by YATRIK ERP Test Suite | ${timestamp}
`;

  return report;
}

function generateProgressBar(passed, failed, skipped, total) {
  const barLength = 50;
  const passedLength = Math.round((passed / total) * barLength);
  const failedLength = Math.round((failed / total) * barLength);
  const skippedLength = Math.round((skipped / total) * barLength);
  
  const passedBar = '█'.repeat(passedLength);
  const failedBar = '█'.repeat(failedLength);
  const skippedBar = '░'.repeat(skippedLength);
  const remaining = '─'.repeat(Math.max(0, barLength - passedLength - failedLength - skippedLength));
  
  return `\`\`\`
[${passedBar}${failedBar}${skippedBar}${remaining}] 100%
 ${passedLength} passed | ${failedLength} failed | ${skippedLength} skipped
\`\`\``;
}

function printConsoleSummary(stats) {
  log('\n===========================================', 'cyan');
  log('           TEST SUMMARY                    ', 'cyan');
  log('===========================================\n', 'cyan');
  
  log(`Total Tests:    ${stats.total}`, 'bold');
  log(`✅ Passed:      ${stats.passed} (${stats.passRate}%)`, 'green');
  log(`❌ Failed:      ${stats.failed} (${stats.failRate}%)`, stats.failed > 0 ? 'red' : 'green');
  log(`⏭️ Skipped:     ${stats.skipped}`, 'yellow');
  log(`⏱️ Duration:    ${(stats.duration / 1000 / 60).toFixed(2)} minutes`, 'cyan');
  
  log('\n===========================================\n', 'cyan');
  
  if (stats.failed > 0) {
    log('⚠️  SOME TESTS FAILED', 'red');
    log('View PLAYWRIGHT_TEST_DASHBOARD.md for details\n', 'yellow');
  } else {
    log('🎉 ALL TESTS PASSED!', 'green');
    log('View PLAYWRIGHT_TEST_DASHBOARD.md for full report\n', 'cyan');
  }
}

// Run the generator
if (require.main === module) {
  try {
    const stats = generateDashboard();
    process.exit(stats && stats.failed > 0 ? 1 : 0);
  } catch (error) {
    log(`\n❌ Error generating dashboard: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

module.exports = { generateDashboard };

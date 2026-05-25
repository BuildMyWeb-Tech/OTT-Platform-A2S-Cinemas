// generate-report.js
// Run after: jest --json --outputFile=reports/test-results.json
const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "reports", "test-results.json");
const outputPath = path.join(__dirname, "reports", "ott-test-report.html");
const jsonSummaryPath = path.join(__dirname, "reports", "ott-summary.json");

if (!fs.existsSync(inputPath)) {
  console.error("❌ reports/test-results.json not found. Run: npm run test:report");
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(inputPath, "utf8"));

// Build summary
const summary = {
  timestamp: new Date().toISOString(),
  project: "OTT Platform - A2S Cinemas",
  duration: `${(results.testResults.reduce((s, t) => s + t.testExecError ? 0 : (t.perfStats?.end - t.perfStats?.start || 0), 0) / 1000).toFixed(2)}s`,
  totalSuites: results.numTotalTestSuites,
  passedSuites: results.numPassedTestSuites,
  failedSuites: results.numFailedTestSuites,
  totalTests: results.numTotalTests,
  passedTests: results.numPassedTests,
  failedTests: results.numFailedTests,
  skippedTests: results.numPendingTests,
  passRate: `${Math.round((results.numPassedTests / results.numTotalTests) * 100)}%`,
suites: results.testResults
  .filter((suite) => suite.testFilePath)
  .map((suite) => ({
    name: path.basename(suite.testFilePath),
    status: suite.status,
    duration: `${(
      ((suite.perfStats?.end || 0) - (suite.perfStats?.start || 0)) /
      1000
    ).toFixed(2)}s`,
    passed: suite.testResults.filter((t) => t.status === "passed").length,
    failed: suite.testResults.filter((t) => t.status === "failed").length,
    skipped: suite.testResults.filter((t) => t.status === "pending").length,
    tests: suite.testResults.map((t) => ({
      name: t.fullName,
      status: t.status,
      duration: `${t.duration || 0}ms`,
      error: t.failureMessages?.[0] || null,
    })),
  })),
};

// Save JSON summary
fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync(jsonSummaryPath, JSON.stringify(summary, null, 2));

// Build HTML
const statusIcon = (s) => (s === "passed" ? "✅" : s === "failed" ? "❌" : "⏭️");
const statusColor = (s) => (s === "passed" ? "#1d9e75" : s === "failed" ? "#e24b4a" : "#ba7517");

const testRows = summary.suites
  .map(
    (suite) => `
  <div class="suite">
    <div class="suite-header ${suite.status}">
      <span>${statusIcon(suite.status)} ${suite.name}</span>
      <span class="suite-meta">${suite.passed} passed · ${suite.failed} failed · ${suite.duration}</span>
    </div>
    <table class="test-table">
      ${suite.tests
        .map(
          (t) => `
      <tr class="test-row ${t.status}">
        <td class="test-icon">${statusIcon(t.status)}</td>
        <td class="test-name">${t.name}</td>
        <td class="test-duration">${t.duration}</td>
        ${t.error ? `<td class="test-error" colspan="1"><pre>${t.error.substring(0, 300)}</pre></td>` : "<td></td>"}
      </tr>`
        )
        .join("")}
    </table>
  </div>`
  )
  .join("");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>OTT Platform - API Test Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f0f; color: #e2e2e2; padding: 24px; }
  h1 { font-size: 22px; font-weight: 600; margin-bottom: 4px; }
  .subtitle { color: #888; font-size: 13px; margin-bottom: 24px; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 28px; }
  .stat { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px; padding: 16px; }
  .stat-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px; }
  .stat-value { font-size: 26px; font-weight: 600; }
  .stat-value.green { color: #1d9e75; }
  .stat-value.red { color: #e24b4a; }
  .stat-value.amber { color: #ef9f27; }
  .stat-value.blue { color: #378add; }
  .progress-bar { background: #2a2a2a; border-radius: 6px; height: 8px; margin-bottom: 28px; overflow: hidden; }
  .progress-fill { height: 100%; background: #1d9e75; border-radius: 6px; transition: width .3s; }
  .suite { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px; margin-bottom: 12px; overflow: hidden; }
  .suite-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; font-size: 14px; font-weight: 500; background: #222; }
  .suite-header.passed { border-left: 3px solid #1d9e75; }
  .suite-header.failed { border-left: 3px solid #e24b4a; }
  .suite-meta { font-size: 12px; color: #888; font-weight: 400; }
  .test-table { width: 100%; border-collapse: collapse; }
  .test-row { border-top: 1px solid #222; }
  .test-row:hover { background: #222; }
  .test-icon { width: 32px; text-align: center; padding: 8px 0; font-size: 13px; }
  .test-name { padding: 8px 8px; font-size: 12px; color: #ccc; }
  .test-duration { width: 70px; text-align: right; padding: 8px 16px; font-size: 11px; color: #666; }
  .test-error pre { font-size: 10px; color: #e24b4a; white-space: pre-wrap; word-break: break-all; padding: 4px 16px 8px; background: #1a0808; border-radius: 4px; margin: 4px 16px; }
  .download-btn { display: inline-block; background: #378add; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 500; margin-bottom: 24px; margin-right: 10px; cursor: pointer; border: none; }
  .download-btn.green { background: #1d9e75; }
  .section-title { font-size: 13px; font-weight: 500; color: #888; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 12px; }
  .badge { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 20px; font-weight: 500; }
  .badge.pass { background: #0f3d28; color: #1d9e75; }
  .badge.fail { background: #3d0f0f; color: #e24b4a; }
</style>
</head>
<body>
<h1>🎬 OTT Platform — API Test Report</h1>
<p class="subtitle">A2S Cinemas · Generated: ${new Date(summary.timestamp).toLocaleString()} · Duration: ${summary.duration}</p>

<div style="margin-bottom:20px">
  <button class="download-btn" onclick="downloadJSON()">⬇ Download JSON Report</button>
  <button class="download-btn green" onclick="window.print()">🖨 Print / Save as PDF</button>
</div>

<div class="stats-grid">
  <div class="stat"><div class="stat-label">Total Tests</div><div class="stat-value blue">${summary.totalTests}</div></div>
  <div class="stat"><div class="stat-label">Passed</div><div class="stat-value green">${summary.passedTests}</div></div>
  <div class="stat"><div class="stat-label">Failed</div><div class="stat-value red">${summary.failedTests}</div></div>
  <div class="stat"><div class="stat-label">Skipped</div><div class="stat-value amber">${summary.skippedTests}</div></div>
  <div class="stat"><div class="stat-label">Pass Rate</div><div class="stat-value ${parseInt(summary.passRate) >= 80 ? "green" : "red"}">${summary.passRate}</div></div>
  <div class="stat"><div class="stat-label">Test Suites</div><div class="stat-value blue">${summary.totalSuites}</div></div>
</div>

<div class="progress-bar">
  <div class="progress-fill" style="width:${summary.passRate}"></div>
</div>

<div class="section-title">Test Suites</div>
${testRows}

<script>
const summary = ${JSON.stringify(summary, null, 2)};
function downloadJSON() {
  const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ott-test-report-${Date.now()}.json';
  a.click();
}
</script>
</body>
</html>`;

fs.writeFileSync(outputPath, html);
console.log("\n✅ Reports generated:");
console.log(`   📄 HTML: ${outputPath}`);
console.log(`   📋 JSON: ${jsonSummaryPath}`);
console.log(`\n📊 Summary: ${summary.passedTests}/${summary.totalTests} tests passed (${summary.passRate})\n`);

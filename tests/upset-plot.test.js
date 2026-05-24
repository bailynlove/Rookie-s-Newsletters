const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  getLatestReports,
  renderLatestReportLinks,
  renderUpSetPlotMarkup,
} = require('../assets/js/dashboard-visualizations.js');

test('getLatestReports returns the five newest reports by date and time-like period', () => {
  const reports = [
    { path: 'academic/2026-05-23/evening.html', date: '2026-05-23', period: 'evening', keywords: ['夜间趋势'] },
    { path: 'academic/2026-05-24/08-00-a.html', date: '2026-05-24', period: '08-00-a', keywords: ['晨间主题'] },
    { path: 'academic/2026-05-22/noon.html', date: '2026-05-22', period: 'noon', keywords: ['午间主题'] },
    { path: 'academic/2026-05-24/12-00-b.html', date: '2026-05-24', period: '12-00-b', keywords: ['午间主题'] },
    { path: 'academic/2026-05-24/17-00-c.html', date: '2026-05-24', period: '17-00-c', keywords: ['晚间主题'] },
    { path: 'academic/2026-05-23/morning.html', date: '2026-05-23', period: 'morning', keywords: ['晨间旧主题'] },
  ];

  const latest = getLatestReports(reports, 5);

  assert.deepEqual(latest.map((report) => report.path), [
    'academic/2026-05-24/17-00-c.html',
    'academic/2026-05-24/12-00-b.html',
    'academic/2026-05-24/08-00-a.html',
    'academic/2026-05-23/evening.html',
    'academic/2026-05-23/morning.html',
  ]);
});

test('renderLatestReportLinks shows date, time, and topic for each recent report', () => {
  const html = renderLatestReportLinks([
    {
      path: 'academic/2026-05-24/08-00-karpathy-skills.html',
      date: '2026-05-24',
      period: '08-00-karpathy-skills',
      section: 'academic',
      keywords: ['Claude Code Skills 生态', 'Code Knowledge Graph'],
    },
  ]);

  assert.match(html, /2026-05-24/);
  assert.match(html, /08:00/);
  assert.match(html, /Claude Code Skills 生态/);
  assert.match(html, /academic\/2026-05-24\/08-00-karpathy-skills.html/);
});

test('homepage provides a visualization fallback when helper script is unavailable', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

  assert.match(html, /window\.dashboardVisualizations\s*=\s*window\.dashboardVisualizations\s*\|\|/);
  assert.match(html, /renderUpSetPlotMarkup/);
  assert.match(html, /upset-container/);
});

test('renderUpSetPlotMarkup wraps the chart and explains how to read each combination column', () => {
  const html = renderUpSetPlotMarkup([
    { combination: ['agent-framework', 'codegraph'], count: 3 },
    { combination: ['agent-framework', 'mcp-tools'], count: 2 },
  ]);

  assert.match(html, /class="upset-container"/);
  assert.match(html, /每一列代表一个订阅组合/);
  assert.match(html, /上方柱形表示该组合出现次数/);
});

test('mobile stylesheet keeps the upset plot contained inside its own scroller', () => {
  const css = fs.readFileSync(path.join(__dirname, '../assets/css/main.css'), 'utf8');

  assert.match(css, /@media \(max-width: 768px\)\s*\{[\s\S]*\.upset-chart\s*\{[\s\S]*min-width:\s*480px;/);
  assert.match(css, /@media \(max-width: 768px\)\s*\{[\s\S]*\.upset-matrix-label\s*\{[\s\S]*width:\s*64px;/);
  assert.match(css, /@media \(max-width: 768px\)\s*\{[\s\S]*\.upset-legend\s*\{[\s\S]*gap:\s*8px;/);
});

test('Friday weekly highlight declares foreground colors for light and dark readability', () => {
  const weeklyReport = fs.readFileSync(
    path.join(__dirname, '../macro-finance/2026-05-24/18-30-weekly-review.html'),
    'utf8'
  );
  const fridayInstructions = fs.readFileSync(
    path.join(__dirname, '../configs/friday/html-output-instructions.md'),
    'utf8'
  );

  assert.match(weeklyReport, /\.weekly-highlight\s*\{[\s\S]*color:\s*#f0eadc;/);
  assert.match(weeklyReport, /\.weekly-highlight\s+h2\s*\{[\s\S]*color:\s*#ffffff;/);
  assert.match(fridayInstructions, /深色\/强调背景模块必须同时设置文字颜色/);
});

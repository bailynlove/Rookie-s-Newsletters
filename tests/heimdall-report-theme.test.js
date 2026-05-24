const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const reportPaths = [
  '../academic/2026-05-24/evening.html',
  '../academic/2026-05-24/evening.HTML',
];

for (const reportPath of reportPaths) {
  test(`${reportPath} defaults to a light Heimdall report theme`, () => {
    const html = fs.readFileSync(path.join(__dirname, reportPath), 'utf8');

    assert.match(html, /localStorage\.getItem\('theme'\)\s*\|\|\s*'light'/);
    assert.match(html, /:root\s*\{[\s\S]*--bg-primary:\s*#f7f9f7;/);
    assert.match(html, /:root\s*\{[\s\S]*--text-primary:\s*#18201c;/);
    assert.match(html, /\[data-theme="dark"\]\s*\{[\s\S]*--bg-primary:\s*#0a0f0d;/);
    assert.match(html, /\[data-theme="dark"\]\s*\{[\s\S]*--text-primary:\s*#e7f0ea;/);
  });
}

test('Heimdall HTML instructions require light and dark report theme variables', () => {
  const instructions = fs.readFileSync(
    path.join(__dirname, '../configs/heimdall/html-output-instructions.md'),
    'utf8'
  );

  assert.match(instructions, /localStorage\.getItem\('theme'\)\s*\|\|\s*'light'/);
  assert.match(instructions, /:root\s*\{[\s\S]*--report-bg:\s*#f7f9f7;/);
  assert.match(instructions, /\[data-theme="dark"\]\s*\{[\s\S]*--report-bg:\s*#0a0f0d;/);
});

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const pages = [
  'index.html', 'de/index.html', 'fr/index.html', 'it/index.html',
  'ja/index.html', 'zh-CN/index.html', 'ru/index.html', 'tr/index.html', 'hi/index.html'
];

for (const file of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const headEnd = html.indexOf('</head>');
  assert.notEqual(headEnd, -1, file + ': missing closing head');
  const styles = [...html.matchAll(/<style\\b[^>]*>/gi)];
  const bodyStyles = styles.filter(match => match.index > headEnd);
  assert.equal(bodyStyles.length, 0, file + ': inline CSS must be loaded before body content');
  assert.match(html, /<style id="homepage-late-overrides">/, file + ': consolidated late CSS bundle missing');
  assert.doesNotMatch(html, /brand-search-aliases/i, file + ': artificial brand-alias paragraph remains');
  assert.doesNotMatch(html, /Cash\\s*Zombie|CashZombie/i, file + ': artificial search phrase remains');
  console.log('PASS', file, 'styleBlocks=' + styles.length, 'bodyStyleBlocks=0');
}

const english = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const keywords = english.match(/<meta\\s+name=["']keywords["']\\s+content=["']([^"']*)["']/i)?.[1] || '';
assert.match(keywords, /ZombieCash/);
assert.match(keywords, /Zombie Cash/);
assert.match(keywords, /ZombCash/);
assert.doesNotMatch(keywords, /Cash\\s*Zombie|CashZombie/i);
console.log('PASS natural brand metadata retained; artificial variants removed');

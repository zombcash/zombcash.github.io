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
  const styles = [...html.matchAll(/<style\b[^>]*>/gi)];
  const bodyStyles = styles.filter(match => match.index > headEnd);
  assert.ok(styles.length <= 18, file + ': too many separate style blocks remain (' + styles.length + ')');
  assert.equal(bodyStyles.length, 0, file + ': inline CSS must be loaded before body content');
  assert.match(html, /<style id="homepage-late-overrides">/, file + ': consolidated late CSS bundle missing');
  assert.doesNotMatch(html, /brand-search-aliases/i, file + ': artificial brand-alias paragraph remains');
  const heroCss = html.match(/<style id="zombcash-hero-v8-inline">([\s\S]*?)<\/style>/i)?.[1] || '';
  assert.ok(heroCss.length > 0, file + ': hero CSS block missing');
  assert.doesNotMatch(heroCss, /@(?:media|supports|container|layer)[^{]*\\{\\s*\\}/i, file + ': empty responsive CSS wrapper remains');
  const obsoleteHeroClasses = [
    'hero-mascot', 'mascot-orbit', 'mascot-hand', 'mascot-caption', 'mascot-signal',
    'hero-mascot-v9', 'hero-character-glow', 'hero-character-grid', 'hero-character-label',
    'hero-zombie', 'hero-coin-badge', 'hero-character-caption', 'hero-zombie-art',
    'hero-emblem', 'hero-emblem-ring', 'hero-emblem-core', 'hero-emblem-code',
    'hero-emblem-scan', 'hero-hand-logo', 'hero-biohazard', 'hero-zombie-sigil',
    'sigil-orbit', 'sigil-orbit-a', 'sigil-orbit-b', 'sigil-crosshair', 'sigil-claw',
    'sigil-label', 'panel-topline', 'panel-foot', 'panel-status', 'live-dot', 'panel-live',
    'panel-core', 'panel-orbit', 'orbit-one', 'orbit-two', 'panel-core-mark',
    'mark-slash', 'mark-dot', 'panel-coordinate', 'panel-bars', 'panel-glitch', 'panel-reticle'
  ];
  for (const className of obsoleteHeroClasses) {
    assert.doesNotMatch(heroCss, new RegExp('\\.' + className + '(?![\\w-])'), file + ': obsolete hero selector returned: ' + className);
  }
  assert.doesNotMatch(html, /\bCash\s+Zombie\b|\bCashZombie\b/i, file + ': artificial search phrase remains');
  console.log('PASS', file, 'styleBlocks=' + styles.length, 'bodyStyleBlocks=0');
}

const english = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const keywords = english.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']*)["']/i)?.[1] || '';
assert.match(keywords, /ZombieCash/);
assert.match(keywords, /Zombie Cash/);
assert.match(keywords, /ZombCash/);
assert.doesNotMatch(keywords, /\bCash\s+Zombie\b|\bCashZombie\b/i);
console.log('PASS natural brand metadata retained; artificial variants removed');

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const ribbonScript = fs.readFileSync(path.join(root, 'homepage-ribbons.js'), 'utf8');
const homepageVisualCss = fs.readFileSync(path.join(root, 'homepage-visual.css'), 'utf8');
const aiStatusScript = fs.readFileSync(path.join(root, 'ai-model-status.js'), 'utf8');
assert.ok(homepageVisualCss.includes('.zc-ai-engine-card{'),
  'community AI status card styles must live in the cached homepage stylesheet');
assert.equal(aiStatusScript.includes('createElement("style")'), false,
  'AI status script must not inject a duplicate runtime stylesheet');
assert.ok(aiStatusScript.includes('signal: AbortSignal.timeout(10000)'),
  'AI status endpoint request must have a 10-second timeout');
assert.ok(aiStatusScript.includes('if (refreshing) return;'),
  'AI status polling must not overlap requests');

assert.doesNotMatch(ribbonScript, /if\s*\(existing\)\s*existing\.remove\(\)/, 'live ribbons must reuse the reserved wrapper instead of removing/reinserting it');
assert.match(ribbonScript, /wrap\.removeAttribute\('aria-busy'\)/, 'live ribbon wrapper must clear its busy state after rendering');
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
  assert.equal(styles.length, 3, file + ': homepage CSS should be consolidated into three cascade-preserving blocks');
  assert.equal(bodyStyles.length, 0, file + ': inline CSS must be loaded before body content');
  if (file === 'index.html') {
    assert.match(html, /src="\\/ai-model-status\\.js\\?v=20261124-timeout-1"/,
      'English homepage must use the cache-busted AI status script');
  }
  const ribbonIndex = html.indexOf('class="zc-outbreak-ribbons zc-ribbons-pending"');
  assert.ok(ribbonIndex > headEnd && ribbonIndex < html.indexOf('<main id="home">'), file + ': reserved live-ribbon skeleton must sit between the shared header and homepage main');
  assert.equal((html.match(/class="zc-outbreak-ribbons/g) || []).length, 1, file + ': exactly one reserved ribbon wrapper must exist');
  assert.equal((html.match(/class="zc-ribbon zc-ribbon--/g) || []).length, 3, file + ': all three ribbon rows must reserve their final layout before JavaScript');

  assert.match(html, /<style id="homepage-pre-polish">/, file + ': consolidated pre-polish CSS bundle missing');
  assert.match(html, /<style id="homepage-components-inline">/, file + ': consolidated component CSS bundle missing');
  assert.match(html, /<style id="homepage-late-overrides">/, file + ': consolidated late CSS bundle missing');
  assert.ok(html.indexOf('homepage-pre-polish') < html.indexOf('site-polish.css'), file + ': pre-polish CSS order changed');
  assert.ok(html.indexOf('site-polish.css') < html.indexOf('homepage-components-inline'), file + ': component CSS must follow site-polish.css');
  assert.ok(html.indexOf('homepage-components-inline') < html.indexOf('homepage-visual.css'), file + ': component CSS order changed');
  assert.ok(html.indexOf('homepage-visual.css') < html.indexOf('homepage-late-overrides'), file + ': final CSS must follow homepage-visual.css');
  assert.doesNotMatch(html, /brand-search-aliases/i, file + ': artificial brand-alias paragraph remains');
  const heroCss = html.match(/<style id="homepage-pre-polish">([\s\S]*?)<\/style>/i)?.[1] || '';
  assert.ok(heroCss.length > 0, file + ': consolidated hero CSS block missing');
  assert.doesNotMatch(heroCss, /\/\*\s*V(?:8|9|14|17|18|19|20|21)\b/i, file + ': superseded hero version history remains');
  assert.doesNotMatch(heroCss.slice(0, 6000), /\.outbreak-panel|panelOrbit|signalPulse/, file + ': stale hero panel selectors or animations remain');
  assert.match(heroCss, /\.hero:after\{[^}]*writing-mode:horizontal-tb!important/, file + ': hero pseudo-element was not reset to a horizontal rule');
  assert.doesNotMatch(heroCss, /@(?:media|supports|container|layer)[^{]*\{\s*\}/i, file + ': empty responsive CSS wrapper remains');
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
  assert.equal((html.match(/\.world-community-pair \.world-event\{margin:10px 12px\}/g) || []).length, 1, file + ': duplicate world-event CSS rule remains');
  assert.equal((html.match(/\.world-community-pair \.world-panel-foot\{margin-top:auto\}/g) || []).length, 1, file + ': duplicate world-panel-foot CSS rule remains');
  assert.equal((html.match(/section\.section\.community-console \.crew-grid \{ align-items: stretch !important; \}/g) || []).length, 0, file + ': duplicate one-line crew-grid alignment remains');
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

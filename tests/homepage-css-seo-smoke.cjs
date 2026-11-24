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
  assert.equal(styles.length, 3, file + ': homepage CSS should be consolidated into three cascade-preserving blocks');
  assert.equal(bodyStyles.length, 0, file + ': inline CSS must be loaded before body content');
  const ribbonPlaceholder = html.indexOf('class="zc-outbreak-ribbons"');
  assert.ok(ribbonPlaceholder > html.indexOf('</header>') && ribbonPlaceholder < html.indexOf('<main id="home">'), file + ': reserved market ribbon placeholder must sit between header and main');
  assert.match(html.slice(ribbonPlaceholder, ribbonPlaceholder + 220), /data-zc-reserved="true"/, file + ': reserved ribbon placeholder marker missing');
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
const ribbonsScript = fs.readFileSync(path.join(root, 'homepage-ribbons.js'), 'utf8');
assert.doesNotMatch(ribbonsScript, /if\s*\(existing\)\s*existing\.remove\s*\(/, 'live ribbon loader must reuse the reserved container');
assert.match(ribbonsScript, /var wrap=existing\|\|document\.createElement\('div'\)/, 'live ribbon loader must reuse the pre-rendered container');
const visualCss = fs.readFileSync(path.join(root, 'homepage-visual.css'), 'utf8');
assert.match(visualCss, /\.zc-outbreak-ribbons\{[^}]*min-height:127px/, 'desktop ribbon height must be reserved before data loads');
assert.match(visualCss, /\.zc-outbreak-ribbons\{[^}]*min-height:123px/, 'mobile ribbon height must be reserved before data loads');
assert.match(visualCss, /min-height:\s*calc\(3 \* clamp\(84px, \.9vw, 144px\)/, 'large-viewport ribbon height must be reserved before data loads');
assert.match(visualCss, /body:has\(#home\)>header\.topbar\{min-height:110px!important/, 'desktop shared-header height must be reserved before navigation hydration');
assert.match(visualCss, /@media\(min-width:761px\) and \(max-width:1199px\)\{body:has\(#home\)>header\.topbar\{min-height:112px!important/, 'tablet shared-header height must be reserved before navigation hydration');
assert.match(visualCss, /@media\(max-width:760px\)\{body:has\(#home\)>header\.topbar\{min-height:95px!important/, 'mobile shared-header height must be reserved before navigation hydration');
assert.match(visualCss, /@media \(max-width: 480px\)[\s\S]*?font-size: clamp\(32px, 10vw, 48px\) !important;[\s\S]*?line-height: 1\.04 !important;/, 'mobile hero heading size and line-height must remain responsive');
assert.doesNotMatch(visualCss, /\/\* === IMPROVED TYPOGRAPHY SCALE === \*\//, 'late duplicate base typography must not override mobile hero rules');
console.log('PASS mobile hero typography cascade keeps responsive overrides active');
console.log('PASS live market ribbons reserve layout space before dynamic content is rendered');

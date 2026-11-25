const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const ribbonScript = fs.readFileSync(path.join(root, 'homepage-ribbons.js'), 'utf8');
const homepageVisualCss = fs.readFileSync(path.join(root, 'homepage-visual.css'), 'utf8');
const aiStatusScript = fs.readFileSync(path.join(root, 'ai-model-status.js'), 'utf8');
const tvPlayerScript = fs.readFileSync(path.join(root, 'assets/js/zctv-player.js'), 'utf8');
assert.doesNotMatch(homepageVisualCss, /@(?:media|supports|container|layer)\\b[^{}]*\\{\\s*\\}/i,
  'homepage visual stylesheet must not retain empty responsive or conditional wrappers');
const sharedScript = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
assert.doesNotMatch(sharedScript, /dot\.setAttribute\('aria-label'/,
  'decorative system-status dots must not receive prohibited aria-label attributes');
assert.match(sharedScript, /view\.setAttribute\('aria-labelledby', viewLabel\.id \+ ' ' \+ tokenSymbol\.id\)/,
  'dynamic radar links must derive their accessible names from localized visible labels and token symbols');

assert.ok(homepageVisualCss.includes('.zc-ai-engine-card{'),
  'community AI status card styles must live in the cached homepage stylesheet');
assert.equal(ribbonScript.includes('api.binance.com'), false,
  'homepage market tickers must not call Binance directly from the browser because its public endpoint fails CORS from this origin');
assert.ok(ribbonScript.includes('api.coingecko.com/api/v3/simple/price'),
  'CoinGecko remains the verified CORS-compatible browser ticker source');
assert.ok(tvPlayerScript.includes('episodesRequestStarted = true'),
  'TV archive requests must be gated to one user-initiated load per page view');
assert.ok(tvPlayerScript.includes("if (item[0] === 'archive') loadEpisodes();"),
  'Switching to archive mode must load episodes on demand');
assert.ok(!tvPlayerScript.includes('archiveObserver'),
  'TV archive must not spend API requests for visitors who never choose a channel or archive mode');

assert.equal(aiStatusScript.includes('createElement("style")'), false,
  'AI status script must not inject a duplicate runtime stylesheet');
assert.ok(aiStatusScript.includes('signal: AbortSignal.timeout(10000)'),
  'AI status endpoint request must have a 10-second timeout');
assert.ok(aiStatusScript.includes('if (refreshing) return;'),
  'AI status polling must not overlap requests');

const retiredHomepageSelectors = ["zc-hero-ad-stage","zc-adsterra-grid","zc-adsterra-slot","zc-hero-sponsor","zc-hero-sponsor-promo","zc-hero-ad-unit","zc-adsterra-native-slot","zc-adsterra-mobile-slot","zc-hero-sponsor-label","zc-hero-sponsor-kicker","field-manual-spotlight-inner","world-section","zc-promo-video-inner","hero-title"];
for (const selector of retiredHomepageSelectors) {
  assert.equal(homepageVisualCss.includes('.' + selector), false,
    'homepage stylesheet must not retain selectors for absent legacy markup: ' + selector);
}

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
  const inlineCss = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(match => match[1]).join('\n');
  const homepageCss = file === 'index.html'
    ? ['homepage-pre-polish.css', 'homepage-components.css', 'homepage-late-overrides.css']
        .map(asset => fs.readFileSync(path.join(root, asset), 'utf8')).join('\n')
    : inlineCss;
  assert.ok(homepageCss.includes('.zc-hero-art-panel'), file + ': current hero artwork panel styles must remain');
  assert.ok(homepageCss.includes('.zc-sponsor-art-slot'), file + ': current hero artwork slot styles must remain');
  for (const stale of [
    '.zc-adsterra-section', '.zc-adsterra-inner', '#container-4420dadadbd2f0727c322cd6c632be3e',
    '.zc-radar-art', '.zc-radar-scene', '.zc-art-scanlines', '.zc-art-corner',
    '.zc-art-caption', '.zc-art-live-dot', '.zc-hero-ad-stage',
    '.zc-adsterra-native-slot', '.zc-adsterra-mobile-slot', '.zc-hero-sponsor-panel'
  ]) {
    assert.equal(inlineCss.includes(stale), false, file + ': obsolete homepage selector returned: ' + stale);
  }
  const styles = [...html.matchAll(/<style\b[^>]*>/gi)];
  const bodyStyles = styles.filter(match => match.index > headEnd);
  assert.equal(styles.length, file === 'index.html' ? 0 : 3,
    file + ': homepage CSS must remain in three ordered blocks or their cascade-preserving external assets');
  assert.equal(bodyStyles.length, 0, file + ': inline CSS must be loaded before body content');
  for (const selector of retiredHomepageSelectors) {
    assert.equal(html.includes('.' + selector), false,
      file + ': inline CSS must not retain selectors for absent legacy markup: ' + selector);
  }
  if (file === 'index.html') {
    assert.ok(html.includes('src="/ai-model-status.js?v=20261124-timeout-1"'),
      'English homepage must use the cache-busted AI status script');
  }
  const ribbonIndex = html.indexOf('class="zc-outbreak-ribbons zc-ribbons-pending"');
  assert.ok(ribbonIndex > headEnd && ribbonIndex < html.indexOf('<main id="home">'), file + ': reserved live-ribbon skeleton must sit between the shared header and homepage main');
  assert.equal((html.match(/class="zc-outbreak-ribbons/g) || []).length, 1, file + ': exactly one reserved ribbon wrapper must exist');
  assert.equal((html.match(/class="zc-ribbon zc-ribbon--/g) || []).length, 3, file + ': all three ribbon rows must reserve their final layout before JavaScript');

  if (file === 'index.html') {
    for (const asset of ['homepage-pre-polish.css', 'homepage-components.css', 'homepage-late-overrides.css']) {
      assert.match(html, new RegExp('<link rel="stylesheet" href="/' + asset + '\\?v=20261125-1">'),
        file + ': cascade-preserving external CSS asset missing: ' + asset);
    }
  } else {
    assert.match(html, /<style id="homepage-pre-polish">/, file + ': consolidated pre-polish CSS bundle missing');
    assert.match(html, /<style id="homepage-components-inline">/, file + ': consolidated component CSS bundle missing');
    assert.match(html, /<style id="homepage-late-overrides">/, file + ': consolidated late CSS bundle missing');
  }
  assert.match(html, /script\.js\?v=20261125-homepage-runtime-1/,
    file + ': homepage runtime cache key must be refreshed so localized pages receive current ARIA fixes');
  assert.match(html, /zctv-player\.js\?v=20261125-tv-lazy-1/,
    file + ': TV player cache key must be refreshed so lazy archive loading is used');
  if (file === 'index.html') {
    assert.ok(html.indexOf('style.css') < html.indexOf('homepage-pre-polish.css'), file + ': pre-polish CSS order changed');
    assert.ok(html.indexOf('homepage-pre-polish.css') < html.indexOf('site-polish.css'), file + ': pre-polish CSS must precede site-polish.css');
    assert.ok(html.indexOf('site-polish.css') < html.indexOf('homepage-components.css'), file + ': component CSS must follow site-polish.css');
    assert.ok(html.indexOf('homepage-components.css') < html.indexOf('homepage-visual.css'), file + ': component CSS order changed');
    assert.ok(html.indexOf('homepage-visual.css') < html.indexOf('homepage-late-overrides.css'), file + ': final CSS must follow homepage-visual.css');
  } else {
    assert.ok(html.indexOf('homepage-pre-polish') < html.indexOf('site-polish.css'), file + ': pre-polish CSS order changed');
    assert.ok(html.indexOf('site-polish.css') < html.indexOf('homepage-components-inline'), file + ': component CSS must follow site-polish.css');
    assert.ok(html.indexOf('homepage-components-inline') < html.indexOf('homepage-visual.css'), file + ': component CSS order changed');
    assert.ok(html.indexOf('homepage-visual.css') < html.indexOf('homepage-late-overrides'), file + ': final CSS must follow homepage-visual.css');
  }
  assert.doesNotMatch(html, /brand-search-aliases/i, file + ': artificial brand-alias paragraph remains');
  const heroCss = file === 'index.html'
    ? fs.readFileSync(path.join(root, 'homepage-pre-polish.css'), 'utf8')
    : html.match(/<style id="homepage-pre-polish">([\s\S]*?)<\/style>/i)?.[1] || '';
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
  assert.equal((homepageCss.match(/\.world-community-pair \.world-event\{margin:10px 12px\}/g) || []).length, 1, file + ': duplicate world-event CSS rule remains');
  assert.equal((homepageCss.match(/\.world-community-pair \.world-panel-foot\{margin-top:auto\}/g) || []).length, 1, file + ': duplicate world-panel-foot CSS rule remains');
  assert.equal((homepageCss.match(/section\.section\.community-console \.crew-grid \{ align-items: stretch !important; \}/g) || []).length, 0, file + ': duplicate one-line crew-grid alignment remains');
  for (const id of ['zc-promo-prev', 'zc-promo-next', 'zombie-radar-ai-refresh']) {
    const control = html.match(new RegExp('<button\\b[^>]*\\bid="' + id + '"[^>]*>'))?.[0] || '';
    assert.ok(control, file + ': missing visible control ' + id);
    assert.doesNotMatch(control, /\baria-label=/i, file + ': accessible name must follow the localized visible label for ' + id);
  }
  for (const id of ['service-market-dot', 'service-api-dot', 'service-community-dot']) {
    const dot = html.match(new RegExp('<i\\b(?=[^>]*\\bid="' + id + '")[^>]*>'))?.[0] || '';
    assert.match(dot, /\baria-hidden="true"/i, file + ': decorative service indicator must be hidden from assistive technology: ' + id);
  }
  const footerBrand = html.match(/<a class="brand footer-brand" href="#home"[^>]*>/)?.[0] || '';
  assert.ok(footerBrand, file + ': footer brand link must exist');
  assert.doesNotMatch(footerBrand, /\baria-label=/i, file + ': footer brand accessible name must retain its full visible text');
  assert.match(html, /<span class="brand-mark" aria-hidden="true">☣<\/span>/, file + ': decorative footer symbol must be hidden from assistive technology');
  if (file === 'index.html') {
    const aiEngineCard = html.match(/<a class="zc-ai-engine-card" href="#community"[^>]*>/)?.[0] || '';
    assert.ok(aiEngineCard, 'English homepage AI engine card must exist');
    assert.doesNotMatch(aiEngineCard, /\baria-label=/i, 'AI engine card accessible name must include its visible status text');
  }
  const searchAliasPattern = /\bCash\s+Zombie\b|\bCashZombie\b/i;
  const visibleBody = html.replace(/<head[\s\S]*?<\/head>/i, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ');
  const metaDescription = html.match(/<meta name="description" content="([^"]*)"/i)?.[1] || '';
  assert.doesNotMatch(visibleBody, searchAliasPattern, file + ': search variants must not appear as visible keyword-stuffed body text');
  assert.doesNotMatch(metaDescription, searchAliasPattern, file + ': search variants must not be forced into the search description');
  const structuredData = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)]
    .flatMap(match => {
      const parsed = JSON.parse(match[1]);
      return parsed['@graph'] || [parsed];
    });
  const organization = structuredData.find(item => item['@type'] === 'Organization');
  assert.ok(organization, file + ': Organization structured data missing');
  for (const alias of ['Cash Zombie', 'CashZombie']) {
    assert.ok(!organization.alternateName?.includes(alias), file + ': artificial brand variant must not be included in Organization structured data: ' + alias);
  }
  if (file === 'index.html') {
    const website = structuredData.find(item => item['@type'] === 'WebSite');
    assert.ok(website, 'English homepage WebSite structured data missing');
    for (const alias of ['Cash Zombie', 'CashZombie']) {
      assert.ok(!website.alternateName?.includes(alias), 'WebSite structured data must not include artificial brand variant ' + alias);
    }
  }
  console.log('PASS', file, 'styleBlocks=' + styles.length, 'bodyStyleBlocks=0');
}

const english = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const keywords = english.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']*)["']/i)?.[1] || '';
assert.match(keywords, /ZombieCash/);
assert.match(keywords, /Zombie Cash/);
assert.match(keywords, /ZombCash/);
assert.doesNotMatch(keywords, /\bCash\s+Zombie\b|\bCashZombie\b/i);
console.log('PASS natural brand metadata retained; artificial variants removed');

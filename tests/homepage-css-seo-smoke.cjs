const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const ribbonScript = fs.readFileSync(path.join(root, 'homepage-ribbons.js'), 'utf8');
const homepageVisualCss = fs.readFileSync(path.join(root, 'homepage-visual.css'), 'utf8');
const mobileArtworkOverride = homepageVisualCss.match(/\/\* Mobile performance: keep the radar cards cinematic without loading large desktop artwork\. \*\/([\s\S]*)/);
assert.ok(mobileArtworkOverride, 'mobile artwork override must be present to avoid downloading large decorative images');
for (const selector of [
  'article.radar-card:before',
  'article.lab-card:before',
  'article.network-card:before'
]) {
  assert.ok(mobileArtworkOverride[1].includes(selector), 'mobile override must cover ' + selector);
}
assert.doesNotMatch(mobileArtworkOverride[1], /meme-radar\.jpg|zombie-lab\.jpg|survivor-network\.jpg/,
  'mobile override must not request the large card artwork files');
assert.match(mobileArtworkOverride[1], /background-image:\s*linear-gradient[\s\S]*?\!important/,
  'mobile cards must retain a cinematic gradient when artwork is skipped');

const aiStatusScript = fs.readFileSync(path.join(root, 'ai-model-status.js'), 'utf8');
const tvPlayerScript = fs.readFileSync(path.join(root, 'assets/js/zctv-player.js'), 'utf8');
assert.doesNotMatch(homepageVisualCss, /@(?:media|supports|container|layer)\\b[^{}]*\\{\\s*\\}/i,
  'homepage visual stylesheet must not retain empty responsive or conditional wrappers');
const translatedLateCss = fs.readFileSync(path.join(root, 'homepage-translated-late-overrides.css'), 'utf8');
const englishLateCss = fs.readFileSync(path.join(root, 'homepage-late-overrides.css'), 'utf8');
assert.equal((englishLateCss.match(/body:has\(#home\) #home > section\.hero \.zc-sponsor-art-slot\{\s*box-sizing:border-box/g) || []).length, 1,
  'English homepage artwork slot must have one authoritative base geometry rule');
assert.equal((englishLateCss.match(/body:has\(#home\) #home > section\.hero \.zc-sponsor-art-slot img\{/g) || []).length, 1,
  'English homepage artwork image must have one authoritative base rule');
assert.doesNotMatch(englishLateCss, /@(?:media|supports|container|layer)[^{]*\{\s*\}/i,
  'English homepage late overrides must not retain empty conditional wrappers');
assert.equal((translatedLateCss.match(/^body:has\(#home\) #home > section\.hero > \.hero-layout\{/gm) || []).length, 1,
  'translated hero layout must have one authoritative base rule');
assert.equal((translatedLateCss.match(/body:has\(#home\) #home > section\.hero \.zc-sponsor-art-slot\{/g) || []).length, 3,
  'translated sponsor slot must have one base rule plus its two responsive overrides');
assert.equal((translatedLateCss.match(/body:has\(#home\) #home > section\.hero \.zc-sponsor-art-slot img\{/g) || []).length, 1,
  'translated sponsor image must have one authoritative base rule');
assert.doesNotMatch(translatedLateCss, /Keep the home hero content-led|Final homepage layout: balanced hero|Last-in-document override|zc-hero-layout-final-20261105-v4/,
  'superseded hero override history must not remain in the shared translated stylesheet');
assert.doesNotMatch(translatedLateCss, /@media\(min-width:901px\)\s*\{\s*\}/,
  'empty historical hero media query must not remain');
const sharedScript = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
assert.doesNotMatch(sharedScript, /dot\.setAttribute\('aria-label'/,
  'decorative system-status dots must not receive prohibited aria-label attributes');
assert.match(sharedScript, /view\.setAttribute\('aria-labelledby', viewLabel\.id \+ ' ' \+ tokenSymbol\.id\)/,
  'dynamic radar links must derive their accessible names from localized visible labels and token symbols');
const newsBlock = sharedScript.slice(sharedScript.indexOf('async function loadWorldNews()'), sharedScript.indexOf('const alarmLocale'));
assert.ok(newsBlock.includes("if (article.enriched === true) return article.kind === 'news'"),
  'Outbreak News must retain Telegram-enriched news items with Zombie Commentary while filtering community memes');
assert.match(newsBlock, /const newsTopics = \\/\\b\\(crypto\\|cryptocurrency\\|bitcoin/, 'Outbreak News must filter unrelated general-news items');
assert.match(newsBlock, /article\.commentary/,
  'Outbreak News must render Zombie Commentary on enriched news items');
assert.match(newsBlock, /45 \* 60 \* 1000/,
  'News status must show the last-known state when its cached API snapshot is older than 45 minutes');

assert.ok(homepageVisualCss.includes('.zc-ai-engine-card{'),
  'community AI status card styles must live in the cached homepage stylesheet');
assert.equal(ribbonScript.includes('api.binance.com'), false,
  'homepage market tickers must not call Binance directly from the browser because its public endpoint fails CORS from this origin');
assert.ok(ribbonScript.includes('api.coingecko.com/api/v3/simple/price'),
  'CoinGecko remains the verified CORS-compatible browser ticker source');
assert.ok(tvPlayerScript.includes('episodesRequestStarted = true'),
  'TV archive requests must be gated to one load per page view');
assert.ok(tvPlayerScript.includes('loadEpisodes();'),
  'TV must request the latest server episode on initialization instead of waiting for a channel click');
assert.ok(tvPlayerScript.includes("const RAVEN_INTRO = { episode_id: '2db68d18-9737-4308-b81b-e792da06d202'") && tvPlayerScript.includes('episodes = [RAVEN_INTRO]'),
  'TV must use the verified latest Raven episode as the fallback rather than the October promo');
assert.ok(tvPlayerScript.includes('youtubeEmbedUrl(') && tvPlayerScript.includes('youtube-nocookie.com/embed/'),
  'TV Live must support YouTube iframe embeds as well as direct video sources');

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
assert.match(ribbonScript, /var themes=\['alert','market','community'\]/, 'ribbon visual themes must match the displayed order: crypto, FX, market pulse');
assert.match(ribbonScript, /zc-ribbon--alert \.zc-ribbon-label/, 'live market data source label must be attached to the crypto ticker, not another ribbon');
assert.match(ribbonScript, /function localizeStatus\(/, 'loading and unavailable fallback states must be localized');
for (const locale of ['en','de','fr','it','ja','zh-CN','ru','tr','hi']) assert.ok(ribbonScript.includes(locale+':{loading:') || ribbonScript.includes('\''+locale+'\':{loading:'), 'localized ticker fallback copy missing for '+locale);
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
    : [
        'homepage-translated-hero.css',
        'homepage-translated-components.css',
        ...(file === 'de/index.html' ? ['homepage-de-field-manual.css'] : []),
        'homepage-translated-late-overrides.css'
      ].map(asset => fs.readFileSync(path.join(root, asset), 'utf8')).join('\n');
  assert.ok(homepageCss.includes('.zc-hero-art-panel'), file + ': current hero artwork panel styles must remain');
  assert.ok(homepageCss.includes('.zc-sponsor-art-slot'), file + ': current hero artwork slot styles must remain');
  for (const stale of [
    '.zc-adsterra-section', '.zc-adsterra-inner', '#container-4420dadadbd2f0727c322cd6c632be3e',
    '.zc-radar-art', '.zc-radar-scene', '.zc-art-scanlines', '.zc-art-corner',
    '.zc-art-caption', '.zc-art-live-dot', '.zc-hero-ad-stage',
    '.zc-adsterra-native-slot', '.zc-adsterra-mobile-slot', '.zc-hero-sponsor-panel'
  ]) {
    assert.equal(homepageCss.includes(stale), false, file + ': obsolete homepage selector returned: ' + stale);
  }
  const styles = [...html.matchAll(/<style\b[^>]*>/gi)];
  const bodyStyles = styles.filter(match => match.index > headEnd);
  assert.equal(styles.length, 0,
    file + ': homepage CSS must be externally loaded; inline style blocks were consolidated');
  assert.equal(bodyStyles.length, 0, file + ': inline CSS must be loaded before body content');
  for (const selector of retiredHomepageSelectors) {
    assert.equal(html.includes('.' + selector), false,
      file + ': inline CSS must not retain selectors for absent legacy markup: ' + selector);
  }
  const ribbonIndex = html.indexOf('class="zc-outbreak-ribbons zc-ribbons-pending"');
  assert.ok(ribbonIndex > headEnd && ribbonIndex < html.indexOf('<main id="home">'), file + ': reserved live-ribbon skeleton must sit between shared header and homepage main');
  assert.equal((html.match(/class="zc-outbreak-ribbons/g) || []).length, 1, file + ': exactly one ribbon wrapper must exist');
  assert.equal((html.match(/class="zc-ribbon zc-ribbon--/g) || []).length, 3, file + ': all three ribbon rows must reserve their final layout before JavaScript');
  assert.match(html, /homepage-ribbons\.js\?v=20261127-ribbon-labels-1/, file + ': localized ribbon repair cache key missing');
  assert.match(html, /zctv-player\.js\?v=20261127-tv-raven-live-2/, file + ': latest TV player cache key missing');
  assert.match(html, /script\.js\?v=20261127-news-commentary-2/, file + ': news commentary cache key missing');
  if (file === 'index.html') {
    assert.ok(html.includes('src="/ai-model-status.js?v=20261124-timeout-1"'), 'English homepage must use the cache-busted AI status script');
    for (const asset of ['homepage-pre-polish.css', 'homepage-components.css', 'homepage-late-overrides.css']) {
      assert.match(html, new RegExp('<link rel="stylesheet" href="/' + asset + '\\?v=[^\"]+">'),
        file + ': cascade-preserving external CSS asset missing or cache version absent: ' + asset);
    }
  } else {
    assert.match(html, /homepage-translated-hero\.css\?v=[^\"]+/, file + ': extracted translated hero CSS missing or cache version absent');
    assert.match(html, /homepage-translated-components\.css\?v=[^\"]+/, file + ': extracted translated component CSS missing or cache version absent');
    if (file === 'de/index.html') assert.match(html, /homepage-de-field-manual\.css\?v=[^\"]+/, file + ': German-only spotlight CSS missing or cache version absent');
    assert.match(html, /homepage-translated-late-overrides\.css\?v=[^\"]+/, file + ': shared translated late-overrides stylesheet missing or cache version absent');
    assert.doesNotMatch(html, /<style id="homepage-late-overrides">/, file + ': duplicated translated late-overrides inline block must be removed');
  }
  const homepageRuntime = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
  const marketUiBlock = homepageRuntime.match(/const marketUi = \{[\s\S]*?\n  \};/);
  assert.ok(marketUiBlock, 'market UI localization block must exist');
  assert.doesNotMatch(marketUiBlock[0], /\bmz\(\)/, 'market UI initialization must not call mz before its declaration');
  assert.match(html, /script\.js\?v=[^\"]+/,
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
    assert.ok(html.indexOf('homepage-translated-hero.css') < html.indexOf('site-polish.css'), file + ': translated hero CSS order changed');
    assert.ok(html.indexOf('site-polish.css') < html.indexOf('homepage-translated-components.css'), file + ': extracted component CSS must follow site-polish.css');
    assert.ok(html.indexOf('homepage-translated-components.css') < html.indexOf('homepage-visual.css'), file + ': extracted component CSS order changed');
    if (file === 'de/index.html') assert.ok(html.indexOf('homepage-de-field-manual.css') < html.indexOf('homepage-visual.css'), file + ': German-only CSS order changed');
    assert.ok(html.indexOf('homepage-visual.css') < html.indexOf('homepage-translated-late-overrides.css'), file + ': shared final CSS must follow homepage-visual.css');
  }
  assert.doesNotMatch(html, /brand-search-aliases/i, file + ': artificial brand-alias paragraph remains');
  const heroCss = file === 'index.html'
    ? fs.readFileSync(path.join(root, 'homepage-pre-polish.css'), 'utf8')
    : fs.readFileSync(path.join(root, 'homepage-translated-hero.css'), 'utf8');
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
      assert.ok(!website.alternateName?.includes(alias), 'Search spellings must not be misrepresented as formal alternate brand names: ' + alias);
    }
    assert.match(website.keywords || '', /Cash Zombie/, 'WebSite keywords must retain the spaced search spelling');
    assert.match(website.keywords || '', /CashZombie/, 'WebSite keywords must retain the concatenated search spelling');
  }
  console.log('PASS', file, 'styleBlocks=' + styles.length, 'bodyStyleBlocks=0');
}

const english = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const keywords = english.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']*)["']/i)?.[1] || '';
assert.match(keywords, /ZombieCash/);
assert.match(keywords, /Zombie Cash/);
assert.match(keywords, /ZombCash/);
assert.doesNotMatch(keywords, /\bCash\s+Zombie\b|\bCashZombie\b/i);
const referencePages = ['about.html', 'de/about.html', 'fr/about.html', 'it/about.html', 'ja/about.html', 'zh-CN/about.html', 'ru/about.html', 'tr/about.html', 'hi/about.html'];
for (const file of referencePages) {
  const reference = fs.readFileSync(path.join(root, file), 'utf8');
  assert.match(reference, /<section class="about-section" aria-labelledby="brand-search-reference">[\s\S]*?<\/section>\s*<section class="about-section">\s*<h2>/,
    file + ': naming reference must be a standalone section, not nested inside editorial content');
  assert.match(reference, /Cash Zombie/, file + ': spaced search spelling must appear in the naming reference');
  assert.match(reference, /CashZombie/, file + ': concatenated search spelling must appear in the naming reference');
}
console.log('PASS: search spellings are confined to WebSite keywords and the localized About reference; homepage copy and meta descriptions stay natural');

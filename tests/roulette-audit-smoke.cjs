const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

// This smoke suite uses QA-only API mocks; it never reaches production wallet or payment flows.
const BASE_URL = process.env.SITE_URL || 'http://127.0.0.1:4173/';
const PAGE_URL = new URL('roulette.html', BASE_URL).toString();
const OUT_DIR = path.join(process.cwd(), 'roulette-audit-results');
const localePaths = {
  "en": "roulette.html",
  "de": "de/roulette.html",
  "fr": "fr/roulette.html",
  "it": "it/roulette.html",
  "ja": "ja/roulette.html",
  "zh-CN": "zh-CN/roulette.html",
  "ru": "ru/roulette.html",
  "tr": "tr/roulette.html",
  "hi": "hi/roulette.html"
};
const localeUrls = Object.fromEntries(Object.entries(localePaths).map(([locale, route]) => [locale, 'https://zombcash.github.io/' + route]));
const seoTitles = {
  "en": "Spin the Outbreak — ZombieCash",
  "de": "Drehe das Ausbruchrad — ZombieCash",
  "fr": "Faites tourner l’épidémie — ZombieCash",
  "it": "Gira la ruota dell’epidemia — ZombieCash",
  "ja": "アウトブレイクを回せ — ZombieCash",
  "zh-CN": "ZombieCash幸存者转盘 | 每日免费演示抽奖",
  "ru": "Крути колесо вспышки — ZombieCash",
  "tr": "Salgın Çarkını Çevir — ZombieCash",
  "hi": "प्रकोप का पहिया घुमाएँ — ZombieCash"
};
const locales = {
  en: '🧠 AGAIN',
  ru: '🧠 ЕЩЁ',
  de: '🧠 NOCHMAL',
  fr: '🧠 ENCORE',
  it: '🧠 ANCORA',
  ja: '🧠 もう一度',
  'zh-CN': '🧠 再转',
  tr: '🧠 TEKRAR',
  hi: '🧠 फिर',
};
const viewports = [
  { width: 1440, height: 1000 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 360, height: 800 },
  { width: 320, height: 740 },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'Authorization,Content-Type',
    'content-type': 'application/json; charset=utf-8',
  };
}

async function json(route, data, status = 200) {
  await route.fulfill({ status, headers: corsHeaders(), body: JSON.stringify(data) });
}

async function installApiMocks(page, options = {}) {
  const calls = [];
  let state = options.state ? JSON.parse(JSON.stringify(options.state)) : {
    freeSpinAvailable: true,
    freeSpinUsed: false,
    bonusSpins: 0,
    spinsToday: 0,
    dailySpinCap: 3,
    history: [],
  };
  await page.route('https://zombcash-bot.fadehost.app/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    calls.push({ method: request.method(), path: url.pathname, body: request.postData() });
    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: corsHeaders(), body: '' });
    }
    if (url.pathname === '/api/roulette/stats') {
      if (options.statsStatus) return json(route, { error: 'Stats unavailable' }, options.statsStatus);
      return json(route, options.statsResponse || { totalPrizeEquivalentUsd: 0, totalSpins: state.spinsToday, winners: [] });
    }
    if (url.pathname === '/api/profile') {
      if (options.profileDelayMs) await new Promise(resolve => setTimeout(resolve, options.profileDelayMs));
      if (options.profileStatus) return json(route, { error: 'Profile unavailable' }, options.profileStatus);
      return options.auth
        ? json(route, { profile: { publicDisplayName: 'QA Survivor', firstName: 'QA' } })
        : json(route, { error: 'Unauthorized' }, 401);
    }
    if (url.pathname === '/api/roulette/demo' && request.method() === 'GET') {
      if (options.stateDelayMs) await new Promise(resolve => setTimeout(resolve, options.stateDelayMs));
      return options.auth ? json(route, state) : json(route, { error: 'Unauthorized' }, 401);
    }
    if (url.pathname === '/api/roulette/wallet/challenge' && request.method() === 'POST') {
      if (options.challengeStatus) return json(route, { error: 'QA challenge failure' }, options.challengeStatus);
      return options.auth ? json(route, { challengeId: 'qa-challenge-001', message: 'ZombieCash QA wallet ownership check' }) : json(route, { error: 'Unauthorized' }, 401);
    }
    if (url.pathname === '/api/roulette/wallet/disconnect' && request.method() === 'POST') return json(route, { disconnected: true });
    if (url.pathname === '/api/roulette/wallet/verify' && request.method() === 'POST') {
      if (options.verifyStatus) return json(route, { error: 'QA signature verification failure' }, options.verifyStatus);
      return options.auth ? json(route, { verified: true }) : json(route, { error: 'Unauthorized' }, 401);
    }
    if (url.pathname === '/api/roulette/demo' && request.method() === 'POST') {
      if (!options.auth) return json(route, { error: 'Unauthorized' }, 401);
      if (options.spinDelayMs) await new Promise(resolve => setTimeout(resolve, options.spinDelayMs));
      const body = request.postDataJSON();
      if (!body.walletAddress) return json(route, { error: 'Wallet required' }, 400);
      if (body.mode === 'bonus' && options.bonusSpinResponse) {
        state = options.bonusSpinResponse.state || state;
        return json(route, options.bonusSpinResponse);
      }
      if (body.mode !== 'free') return json(route, { error: 'Unexpected QA spin mode' }, 400);
      if (options.spinError) {
        state = options.spinError.state || state;
        return json(route, { error: options.spinError.error, state }, options.spinError.status || 409);
      }
      state = {
        freeSpinAvailable: false,
        freeSpinUsed: true,
        bonusSpins: 0,
        spinsToday: 1,
        dailySpinCap: 3,
        history: [{ id: 'try_tomorrow', kind: 'no_win' }],
      };
      return json(route, {
        id: 'try_tomorrow',
        kind: 'no_win',
        state,
      });
    }
    return json(route, { error: 'Unmocked QA endpoint' }, 404);
  });
  return calls;
}

async function checkStaticPage(page, locale) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const calls = await installApiMocks(page);
  await page.addInitScript(language => {
    localStorage.setItem('zombcash-language', language);
  }, locale);
  const response = await page.goto(new URL(localePaths[locale], BASE_URL).toString(), { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('#roulette-wheel .wheel-label', { timeout: 30000 });
  const staticHtml = await response.text();
  if (!staticHtml.includes('<html lang="'+locale+'">')) throw new Error(locale + ': server HTML lang is not localized');
  if (!staticHtml.includes('<link rel="canonical" href="'+localeUrls[locale]+'">')) throw new Error(locale + ': server HTML canonical is not localized');
  if (!staticHtml.includes('<title>'+seoTitles[locale]+'</title>')) throw new Error(locale + ': server HTML title is not localized');
  await page.waitForFunction(({ locale, expected }) => document.documentElement.lang === locale && [...document.querySelectorAll('.wheel-label[data-i18n="wheelAgain"]')].every(node => node.textContent.trim() === expected), { locale, expected: locales[locale] }, { timeout: 15000 });
  await page.waitForTimeout(250);
  const result = await page.evaluate(() => {
    const wheel = document.querySelector('#roulette-wheel');
    const shell = document.querySelector('.wheel-shell');
    const labels = [...document.querySelectorAll('#roulette-wheel .wheel-label')];
    const text = selector => document.querySelector(selector)?.textContent?.trim() || '';
    const canonical = [...document.querySelectorAll('link[rel="canonical"]')].map(node => node.href);
    const alternates = [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(node => ({ lang: node.hreflang, href: node.href }));
    return {
      lang: document.documentElement.lang,
      wheelAgain: labels.find(node => node.dataset.i18n === 'wheelAgain')?.textContent?.trim() || '',
      wheelRole: wheel.getAttribute('role'),
      wheelAriaLabel: wheel.getAttribute('aria-label'),
      resultLive: document.querySelector('#spin-result')?.getAttribute('aria-live') || '',
      intro: text('.hero .intro'),
      demoText: text('[data-i18n="demoText"]'),
      walletStatus: text('#wallet-status'),
      wheelLabelCount: labels.length,
      wheelRect: (() => { const r = wheel.getBoundingClientRect(); return { x: r.x, right: r.right, width: r.width, height: r.height }; })(),
      shellRect: (() => { const r = shell.getBoundingClientRect(); return { x: r.x, right: r.right, width: r.width, height: r.height }; })(),
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      blankI18n: [...document.querySelectorAll('[data-i18n]')].filter(node => !node.textContent.trim()).length,
      canonical,
      ogUrl: document.querySelector('meta[property="og:url"]')?.content || '',
      locationPathname: location.pathname,
      locationSearch: location.search,
      alternates,
      spinButtonVisible: !!document.querySelector('#spin-free') && document.querySelector('#spin-free').getBoundingClientRect().height > 0,
      walletButtonVisible: !!document.querySelector('#wallet-connect') && document.querySelector('#wallet-connect').getBoundingClientRect().height > 0,
    };
  });
  if (result.lang !== locale) throw new Error(locale + ': document lang is ' + result.lang);
  if (result.wheelAgain !== locales[locale]) throw new Error(locale + ': wheel AGAIN label mismatch: ' + result.wheelAgain);
  if (result.wheelLabelCount !== 11) throw new Error(locale + ': expected 11 wheel labels, got ' + result.wheelLabelCount);
  if (result.wheelRole !== 'img' || result.wheelAriaLabel !== 'Prize wheel') throw new Error(locale + ': prize wheel has no accessible image role/name');
  if (result.resultLive !== 'polite') throw new Error(locale + ': spin result is missing its polite live region');
  if (result.documentWidth > result.viewportWidth + 1) throw new Error(locale + ': horizontal overflow at ' + result.viewportWidth + 'px');
  if (result.shellRect.x < -1 || result.shellRect.right > result.viewportWidth + 1) throw new Error(locale + ': wheel shell is clipped by viewport');
  if (result.blankI18n) throw new Error(locale + ': ' + result.blankI18n + ' empty translated elements');
  if (result.canonical.length !== 1 || result.canonical[0] !== localeUrls[locale]) throw new Error(locale + ': canonical URL does not match the selected language URL: ' + JSON.stringify(result.canonical));
  if (result.ogUrl !== localeUrls[locale]) throw new Error(locale + ': Open Graph URL does not match the canonical locale URL');
  if (result.alternates.length !== 10) throw new Error(locale + ': expected 9 language alternates plus x-default, got ' + result.alternates.length);
  for (const [alternateLanguage, alternateUrl] of Object.entries(localeUrls)) {
    if (!result.alternates.some(item => item.lang === alternateLanguage && item.href === alternateUrl)) throw new Error(locale + ': missing or incorrect hreflang alternate for ' + alternateLanguage);
  }
  if (!result.alternates.some(item => item.lang === 'x-default' && item.href === localeUrls.en)) throw new Error(locale + ': x-default alternate is missing');
  if (result.locationPathname !== '/' + localePaths[locale]) throw new Error(locale + ': browser URL did not use the localized path: ' + result.locationPathname);
  if (new URLSearchParams(result.locationSearch).has('lang')) throw new Error(locale + ': legacy lang query parameter was not removed');
  if (!result.spinButtonVisible || !result.walletButtonVisible) throw new Error(locale + ': primary controls are not visible');
  if (!/signature|signatur|firma|подпис|署名|签名|imza|हस्ताक्षर/i.test(result.walletStatus)) throw new Error(locale + ': wallet signature requirement is not explained');
  if (locale === 'en' && /buy extra chances|purchases launch/i.test(result.intro)) throw new Error('English intro still promises unavailable demo purchases');
  if (locale === 'ru' && /покупай дополнительные шансы|покупка дополнительных попыток/i.test(result.intro)) throw new Error('Russian intro still promises unavailable demo purchases');
  if (!/no .*transfer|no .*payout|disabled|не перевод|не выплач|禁用|支払いなし|no se transfieren|keine .*zahlung/i.test(result.demoText)) {
    // Keep this check deliberately broad: the exact wording differs by locale.
    if (locale === 'en' || locale === 'ru') throw new Error(locale + ': demo disclaimer does not clearly disable payouts/transfers');
  }
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => {
    const el = document.activeElement;
    const style = el ? getComputedStyle(el) : null;
    return { tag: el?.tagName || '', outlineStyle: style?.outlineStyle || 'none', outlineWidth: style?.outlineWidth || '0px' };
  });
  if (!focused.tag || focused.outlineStyle === 'none' || focused.outlineWidth === '0px') throw new Error(locale + ': keyboard focus is not visibly indicated');
  if (errors.length) throw new Error(locale + ': browser errors: ' + errors.join(' | '));
  const alternateLocale = locale === 'ru' ? 'en' : 'ru';
  await page.evaluate(language => {
    localStorage.setItem('zombcash-language', language);
    document.documentElement.lang = language;
    document.dispatchEvent(new CustomEvent('zombcash:languagechange', { detail: { language } }));
  }, alternateLocale);
  await page.waitForFunction(({ language, expected }) => document.documentElement.lang === language && [...document.querySelectorAll('.wheel-label[data-i18n="wheelAgain"]')].every(node => node.textContent.trim() === expected), { language: alternateLocale, expected: locales[alternateLocale] }, { timeout: 10000 });
  await page.waitForFunction(({ expected, path }) => document.querySelector('link[rel="canonical"]')?.href === expected && location.pathname === path, { expected: localeUrls[alternateLocale], path: '/' + localePaths[alternateLocale] }, { timeout: 10000 });
  await page.evaluate(language => {
    localStorage.setItem('zombcash-language', language);
    document.documentElement.lang = language;
    window.dispatchEvent(new StorageEvent('storage', { key: 'zombcash-language', newValue: language }));
    window.dispatchEvent(new Event('focus'));
  }, locale);
  await page.waitForFunction(({ language, expected }) => document.documentElement.lang === language && [...document.querySelectorAll('.wheel-label[data-i18n="wheelAgain"]')].every(node => node.textContent.trim() === expected), { language: locale, expected: locales[locale] }, { timeout: 10000 });
  await page.waitForFunction(({ expected, path }) => document.querySelector('link[rel="canonical"]')?.href === expected && location.pathname === path, { expected: localeUrls[locale], path: '/' + localePaths[locale] }, { timeout: 10000 });
  if (!calls.some(call => call.path === '/api/roulette/stats')) throw new Error(locale + ': public stats endpoint was not requested');
  await page.screenshot({ path: path.join(OUT_DIR, 'locale-' + locale.replace(/[^a-z0-9-]/gi, '-') + '.png'), fullPage: true });
  fs.writeFileSync(path.join(OUT_DIR, 'locale-' + locale.replace(/[^a-z0-9-]/gi, '-') + '.json'), JSON.stringify({ locale, result, errors, calls }, null, 2));
}

async function checkResponsive(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await installApiMocks(page);
  await page.addInitScript(() => localStorage.setItem('zombcash-language', 'en'));
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('#roulette-wheel .wheel-label', { timeout: 30000 });
    if (viewport.width === 390) {
      const motion = await page.evaluate(() => ({
        wheelTransition: getComputedStyle(document.querySelector('.wheel')).transitionDuration,
        hazardAnimation: getComputedStyle(document.querySelector('.wheel-shell'), '::before').animationName,
        scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      }));
      if (motion.wheelTransition !== '0s' || motion.hazardAnimation !== 'none' || motion.scrollBehavior !== 'auto') throw new Error('Reduced-motion preferences were not respected');
    }
    const metrics = await page.evaluate(() => ({
      width: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      wheel: (() => { const r = document.querySelector('.wheel-shell').getBoundingClientRect(); return { x: Math.round(r.x), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) }; })(),
      spinButton: (() => { const r = document.querySelector('#spin-free').getBoundingClientRect(); return { x: Math.round(r.x), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) }; })(),
    }));
    if (metrics.documentWidth > viewport.width + 1) throw new Error('Responsive overflow at ' + viewport.width + 'px: document is ' + metrics.documentWidth + 'px');
    if (metrics.wheel.x < -1 || metrics.wheel.right > viewport.width + 1) throw new Error('Wheel clipped at ' + viewport.width + 'px');
    if (metrics.spinButton.x < -1 || metrics.spinButton.right > viewport.width + 1 || metrics.spinButton.height < 40) throw new Error('Spin CTA clipped or too small at ' + viewport.width + 'px');
    fs.writeFileSync(path.join(OUT_DIR, 'viewport-' + viewport.width + '.json'), JSON.stringify(metrics, null, 2));
    await page.screenshot({ path: path.join(OUT_DIR, 'viewport-' + viewport.width + '.png'), fullPage: true });
  }
  if (errors.length) throw new Error('Responsive browser errors: ' + errors.join(' | '));
  await page.close();
}

async function checkWalletAndSpin(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const calls = await installApiMocks(page, { auth: true });
  await page.addInitScript(() => {
    localStorage.setItem('zombcash-language', 'en');
    localStorage.setItem('zombcash-survivor-token', 'qa-only-fake-token');
    const publicKey = { toBase58: () => 'QAWallet111111111111111111111111111111111' };
    window.phantom = {
      solana: {
        isConnected: false,
        connect: async () => ({ publicKey }),
        signMessage: async () => ({ signature: new Uint8Array([1, 2, 3, 4]) }),
        disconnect: async () => {},
        on: () => {},
      },
    };
  });
  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.querySelector('#auth-message')?.textContent.includes('QA Survivor'), null, { timeout: 20000 });
  await page.locator('#wallet-connect').click();
  await page.waitForFunction(() => document.querySelector('#wallet-status')?.textContent.includes('QAWal'), null, { timeout: 15000 });
  if (!(await page.locator('#wallet-disconnect').isVisible())) throw new Error('Verified wallet disconnect control was not shown');
  await page.locator('#spin-free').click();
  await page.waitForFunction(() => document.querySelector('#spin-result strong')?.textContent.includes('NO WIN'), null, { timeout: 12000 });
  const spinCall = calls.find(call => call.path === '/api/roulette/demo' && call.method === 'POST');
  if (!spinCall) throw new Error('Spin was not submitted to the server');
  const body = JSON.parse(spinCall.body);
  if (body.mode !== 'free' || body.walletAddress !== 'QAWallet111111111111111111111111111111111') throw new Error('Spin request did not use the verified QA wallet and free mode');
  if (!calls.some(call => call.path === '/api/roulette/wallet/challenge')) throw new Error('Wallet ownership challenge was not requested');
  if (!calls.some(call => call.path === '/api/roulette/wallet/verify')) throw new Error('Wallet ownership signature was not verified');
  if (calls.some(call => /transaction|transfer|payment/i.test(call.path))) throw new Error('QA flow unexpectedly requested a transaction or payment endpoint');
  await page.waitForFunction(() => document.querySelector('#spin-free')?.disabled === true, null, { timeout: 10000 });
  await page.waitForFunction(() => document.querySelector('#stats-total-spins')?.textContent.trim() === '1', null, { timeout: 10000 });
  if (errors.length) throw new Error('Wallet/spin browser errors: ' + errors.join(' | '));
  fs.writeFileSync(path.join(OUT_DIR, 'wallet-spin.json'), JSON.stringify({ calls, errors }, null, 2));
  await page.screenshot({ path: path.join(OUT_DIR, 'wallet-spin.png'), fullPage: true });
  await page.close();
}


async function addQaAuthWallet(page, locale = 'en', walletMode = 'ok') {
  await page.addInitScript(({ locale, walletMode }) => {
    localStorage.setItem('zombcash-language', locale);
    localStorage.setItem('zombcash-survivor-token', 'qa-only-fake-token');
    const publicKey = { toBase58: () => 'QAWallet111111111111111111111111111111111' };
    const events = {};
    const provider = {
      isConnected: false,
      connect: async () => {
        if (walletMode === 'cancel') throw new Error('User rejected the request');
        return { publicKey };
      },
      disconnect: async () => {},
      on: (name, callback) => { events[name] = callback; },
    };
    if (walletMode !== 'unsupported') {
      provider.signMessage = async () => {
        if (walletMode === 'sign-cancel') throw new Error('User rejected the signature request');
        return { signature: new Uint8Array([1, 2, 3, 4]) };
      };
    }
    window.__qaWalletEvents = events;
    window.phantom = { solana: provider };
  }, { locale, walletMode });
}

async function checkAuthStates(browser) {
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const calls = await installApiMocks(page);
    await page.addInitScript(() => localStorage.setItem('zombcash-language', 'en'));
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('#auth-message')?.textContent.trim().length > 0);
    await page.locator('#spin-free').click();
    await page.waitForFunction(() => document.querySelector('#spin-result strong')?.textContent.trim().length > 0);
    if (calls.some(call => call.path === '/api/roulette/demo' && call.method === 'POST')) throw new Error('Guest was allowed to submit a roulette spin');
    if (!(await page.locator('#auth-message').innerText()).toLowerCase().includes('telegram')) throw new Error('Guest login instructions do not explain Telegram registration');
    await page.close();
  }
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await installApiMocks(page, { auth: true, profileStatus: 401 });
    await page.addInitScript(() => {
      localStorage.setItem('zombcash-language', 'en');
      localStorage.setItem('zombcash-survivor-token', 'qa-expired-token');
    });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => { const message = document.querySelector('#auth-message')?.textContent || ''; return message.trim().length > 0 && !/connecting|checking/i.test(message); }, null, { timeout: 15000 });
    const message = await page.locator('#auth-message').innerText();
    if (/connecting|checking/i.test(message) || !/telegram/i.test(message)) throw new Error('Expired token did not resolve to a useful re-login message');
    await page.close();
  }
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await installApiMocks(page, { auth: true, profileStatus: 503, statsStatus: 503 });
    await page.addInitScript(() => {
      localStorage.setItem('zombcash-language', 'en');
      localStorage.setItem('zombcash-survivor-token', 'qa-only-fake-token');
    });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => { const auth = document.querySelector('#auth-message')?.textContent || ''; const stats = document.querySelector('#public-winner-stats')?.textContent || ''; return auth.trim().length > 0 && !/connecting|checking/i.test(auth) && /unavailable|could not|error|failed/i.test(stats); }, null, { timeout: 15000 });
    const auth = await page.locator('#auth-message').innerText();
    const stats = await page.locator('#public-winner-stats').innerText();
    if (/connecting|checking/i.test(auth) || !/telegram/i.test(auth)) throw new Error('API outage left the auth panel in a loading state');
    if (!/unavailable|could not|error|failed/i.test(stats)) throw new Error('Stats API outage did not show a useful error state');
    await page.close();
  }
}

async function checkWalletFailureStates(browser) {
  const scenarios = [
    { name: 'provider missing', walletMode: 'missing', options: {}, expected: /wallet|phantom|solflare/i, raw: '' },
    { name: 'connect cancelled', walletMode: 'cancel', options: {}, expected: /wallet|connect|complete/i, raw: /user rejected/i },
    { name: 'message signing unsupported', walletMode: 'unsupported', options: {}, expected: /signature|подпис|署名|签名|imza|हस्ताक्षर/i, raw: /does not support message signing/i },
    { name: 'challenge rejected', walletMode: 'ok', options: { challengeStatus: 503 }, expected: /signature|подпис|署名|签名|imza|हस्ताक्षर/i, raw: /QA challenge failure/i },
    { name: 'signature verification rejected', walletMode: 'ok', options: { verifyStatus: 401 }, expected: /signature|подпис|署名|签名|imza|हस्ताक्षर/i, raw: /QA signature verification failure/i },
  ];
  for (const scenario of scenarios) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const calls = await installApiMocks(page, { auth: true, ...scenario.options });
    await page.addInitScript(({ walletMode }) => {
      localStorage.setItem('zombcash-language', 'en');
      localStorage.setItem('zombcash-survivor-token', 'qa-only-fake-token');
      if (walletMode === 'missing') return;
      const publicKey = { toBase58: () => 'QAWallet111111111111111111111111111111111' };
      const provider = {
        isConnected: false,
        connect: async () => {
          if (walletMode === 'cancel') throw new Error('User rejected the request');
          return { publicKey };
        },
        disconnect: async () => {},
        on: () => {},
      };
      if (walletMode !== 'unsupported') provider.signMessage = async () => ({ signature: new Uint8Array([1, 2, 3, 4]) });
      window.phantom = { solana: provider };
    }, { walletMode: scenario.walletMode });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('#auth-message')?.textContent.includes('QA Survivor'));
    const initialStatus = await page.locator('#wallet-status').innerText();
    await page.locator('#wallet-connect').click();
    await page.waitForFunction(initial => {
      const status = document.querySelector('#wallet-status')?.textContent || '';
      return status.trim().length > 0 && status !== initial && !/one-time message|signing|verifying/i.test(status);
    }, initialStatus, { timeout: 15000 });
    const status = await page.locator('#wallet-status').innerText();
    if (!scenario.expected.test(status)) throw new Error(scenario.name + ': localized status missing: ' + status);
    if (scenario.raw && scenario.raw.test(status)) throw new Error(scenario.name + ': raw provider/API error leaked to UI: ' + status);
    if (scenario.name === 'provider missing' && calls.some(call => call.path.includes('/wallet/challenge'))) throw new Error('Missing wallet unexpectedly requested a challenge');
    if (scenario.name === 'challenge rejected' && calls.some(call => call.path.includes('/wallet/verify'))) throw new Error('Wallet verify was called after challenge failure');
    await page.close();
  }
}


async function checkRapidClick(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const calls = await installApiMocks(page, { auth: true, profileDelayMs: 1800, stateDelayMs: 250, spinDelayMs: 500 });
  await addQaAuthWallet(page, 'en');
  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });
  await page.locator('#wallet-connect').click();
  await page.waitForFunction(() => document.querySelector('#wallet-status')?.textContent.includes('QAWal'), null, { timeout: 15000 });
  await page.evaluate(() => {
    const button = document.querySelector('#spin-free');
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await page.waitForFunction(() => document.querySelector('#spin-result strong')?.textContent.includes('NO WIN'), null, { timeout: 15000 });
  const spinPosts = calls.filter(call => call.path === '/api/roulette/demo' && call.method === 'POST');
  if (spinPosts.length !== 1) throw new Error('Rapid double-click submitted ' + spinPosts.length + ' spin requests instead of one');
  if (calls.some(call => /transaction|transfer|payment/i.test(call.path))) throw new Error('Rapid-click QA unexpectedly requested a transaction or payment endpoint');
  await page.close();
}

async function checkSpinErrorLocalization(browser) {
  const dailyLimitCopy = {
    en: 'Daily spin limit reached. Come back after the UTC reset.',
    ru: 'Дневной лимит исчерпан. Возвращайся после сброса суток UTC.',
    de: 'Tageslimit erreicht. Komm nach dem UTC-Reset zurück.',
    fr: 'Limite quotidienne atteinte. Revenez après la remise à zéro UTC.',
    it: 'Limite giornaliero raggiunto. Torna dopo il reset UTC.',
    ja: '本日の上限です。UTC日付変更後に戻ってください。',
    'zh-CN': '已达到每日上限。请在UTC日期重置后再来。',
    tr: 'Günlük sınır doldu. UTC sıfırlamasından sonra gel.',
    hi: 'दैनिक सीमा पूरी हुई। UTC रीसेट के बाद लौटें।',
  };
  for (const locale of Object.keys(dailyLimitCopy)) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const calls = await installApiMocks(page, {
      auth: true,
      spinError: {
        status: 409,
        error: 'Daily demo spin limit reached.',
        state: { freeSpinAvailable: false, freeSpinUsed: true, bonusSpins: 0, spinsToday: 3, dailySpinCap: 3, history: [] },
      },
    });
    await addQaAuthWallet(page, locale);
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('#auth-message')?.textContent.includes('QA Survivor'));
    await page.locator('#wallet-connect').click();
    await page.waitForFunction(() => document.querySelector('#wallet-status')?.textContent.includes('QAWal'));
    await page.locator('#spin-free').click();
    await page.waitForFunction(expected => document.querySelector('#spin-result strong')?.textContent.trim() === expected, dailyLimitCopy[locale], { timeout: 12000 });
    const title = await page.locator('#spin-result strong').innerText();
    if (title === 'Daily demo spin limit reached.') throw new Error(locale + ': raw English API error leaked into the spin result');
    if (!calls.some(call => call.path === '/api/roulette/demo' && call.method === 'POST')) throw new Error(locale + ': no server spin request was sent');
    if (calls.some(call => /transaction|transfer|payment/i.test(call.path))) throw new Error(locale + ': a payment/transaction endpoint was requested');
    await page.close();
  }
}



async function checkStateAndStats(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const state = {
    freeSpinAvailable: false,
    freeSpinUsed: true,
    bonusSpins: 1,
    spinsToday: 2,
    dailySpinCap: 3,
    history: [{ id: 'cash1', kind: 'prize' }, { id: 'try_tomorrow', kind: 'no_win' }],
    lastResult: { id: 'try_tomorrow', kind: 'no_win' },
  };
  await installApiMocks(page, {
    auth: true,
    state,
    statsResponse: {
      totalPrizeEquivalentUsd: 1234.5,
      totalSpins: 42,
      winners: [{ survivor: 'SURVIVOR #QA42', wins: 3, amountUsd: 1234.5 }],
    },
  });
  await page.addInitScript(() => {
    localStorage.setItem('zombcash-language', 'en');
    localStorage.setItem('zombcash-survivor-token', 'qa-only-fake-token');
  });
  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#auth-message')?.textContent.includes('QA Survivor') && document.querySelector('#stats-total-spins')?.textContent.trim() === '42');
  const controls = await page.evaluate(() => ({
    freeDisabled: document.querySelector('#spin-free').disabled,
    bonusDisabled: document.querySelector('#spin-bonus').disabled,
    daily: document.querySelector('#daily-status').textContent.trim(),
    bonus: document.querySelector('#bonus-count').textContent.trim(),
    history: [...document.querySelectorAll('#spin-history .history-item')].map(row => row.innerText),
    totalWon: document.querySelector('#stats-total-won').textContent.trim(),
    totalSpins: document.querySelector('#stats-total-spins').textContent.trim(),
    winners: document.querySelector('#public-winner-stats').innerText,
  }));
  if (!controls.freeDisabled || controls.bonusDisabled || controls.bonus !== '1' || !controls.daily) throw new Error('Free-used/bonus-available state rendered incorrectly: ' + JSON.stringify(controls));
  if (controls.history.length !== 2 || !controls.history[0].includes('NO WIN') || !controls.history[1].includes('$1 IN ZOMBCASH')) throw new Error('Spin history order/content is incorrect: ' + JSON.stringify(controls.history));
  if (controls.totalSpins !== '42' || !controls.totalWon.includes('1,234.5') || !controls.winners.includes('SURVIVOR #QA42')) throw new Error('Public winner stats did not render server data: ' + JSON.stringify(controls));
  if (/QAWallet|qa-only-fake-token/i.test(controls.winners)) throw new Error('Private wallet/token data leaked into public winner stats');
  await page.close();

  const capped = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await installApiMocks(capped, { auth: true, state: { freeSpinAvailable: false, freeSpinUsed: true, bonusSpins: 1, spinsToday: 3, dailySpinCap: 3, history: [] } });
  await capped.addInitScript(() => {
    localStorage.setItem('zombcash-language', 'en');
    localStorage.setItem('zombcash-survivor-token', 'qa-only-fake-token');
  });
  await capped.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });
  await capped.waitForFunction(() => document.querySelector('#auth-message')?.textContent.includes('QA Survivor'));
  const capDisabled = await capped.locator('#spin-bonus').isDisabled();
  if (!capDisabled) throw new Error('Bonus spin remained enabled after the daily cap was reached');
  await capped.close();
}

async function checkBonusSpin(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const calls = await installApiMocks(page, {
    auth: true,
    state: { freeSpinAvailable: false, freeSpinUsed: true, bonusSpins: 1, spinsToday: 1, dailySpinCap: 3, history: [] },
    bonusSpinResponse: {
      id: 'again1',
      kind: 'bonus_spin',
      bonusSpinGranted: true,
      state: { freeSpinAvailable: false, freeSpinUsed: true, bonusSpins: 0, spinsToday: 2, dailySpinCap: 3, history: [{ id: 'again1', kind: 'bonus_spin' }] },
    },
  });
  await addQaAuthWallet(page, 'en');
  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#auth-message')?.textContent.includes('QA Survivor'));
  await page.locator('#wallet-connect').click();
  await page.waitForFunction(() => document.querySelector('#wallet-status')?.textContent.includes('QAWal'));
  if (await page.locator('#spin-bonus').isDisabled()) throw new Error('Earned bonus spin was not enabled');
  await page.locator('#spin-bonus').click();
  await page.waitForFunction(() => document.querySelector('#spin-result strong')?.textContent.includes('SPIN AGAIN'), null, { timeout: 15000 });
  const spin = calls.find(call => call.path === '/api/roulette/demo' && call.method === 'POST');
  if (!spin || JSON.parse(spin.body).mode !== 'bonus') throw new Error('Bonus spin did not submit bonus mode to the server');
  await page.waitForFunction(() => document.querySelector('#bonus-count')?.textContent.trim() === '0');
  if (calls.some(call => /transaction|transfer|payment/i.test(call.path))) throw new Error('Bonus spin unexpectedly requested a payment/transaction endpoint');
  await page.close();
}

async function checkWalletLifecycle(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const calls = await installApiMocks(page, { auth: true });
  await addQaAuthWallet(page, 'en');
  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.__qaWalletEvents?.accountChanged === 'function');
  await page.waitForFunction(() => document.querySelector('#auth-message')?.textContent.includes('QA Survivor'));
  await page.locator('#wallet-connect').click();
  await page.waitForFunction(() => document.querySelector('#wallet-status')?.textContent.includes('QAWal'));
  await page.evaluate(() => window.__qaWalletEvents.accountChanged({ toBase58: () => 'AnotherWallet11111111111111111111111111111' }));
  await page.waitForFunction(() => document.querySelector('#wallet-connect')?.getBoundingClientRect().height > 0 && document.querySelector('#wallet-disconnect')?.getBoundingClientRect().height === 0);
  const changedStatus = await page.locator('#wallet-status').innerText();
  if (/account changed|please reconnect/i.test(changedStatus)) throw new Error('Raw English account-change message leaked to wallet status');
  await page.locator('#wallet-connect').click();
  await page.waitForFunction(() => document.querySelector('#wallet-status')?.textContent.includes('QAWal'));
  await page.locator('#wallet-disconnect').click();
  await page.waitForFunction(() => document.querySelector('#wallet-connect')?.getBoundingClientRect().height > 0 && document.querySelector('#wallet-disconnect')?.getBoundingClientRect().height === 0);
  if (!calls.some(call => call.path === '/api/roulette/wallet/disconnect' && call.method === 'POST')) throw new Error('Wallet disconnect was not sent to the server');
  if (calls.some(call => /transaction|transfer|payment/i.test(call.path))) throw new Error('Wallet lifecycle unexpectedly requested a transaction/payment endpoint');
  await page.close();
}

async function checkAccessibility(browser) {
  const resultsByLocale = {};
  for (const locale of Object.keys(locales)) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await installApiMocks(page);
    await page.addInitScript(language => localStorage.setItem('zombcash-language', language), locale);
    await page.goto(new URL(localePaths[locale], BASE_URL).toString(), { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#roulette-wheel .wheel-label');
    await page.addScriptTag({ path: require.resolve('axe-core') });
    const results = await page.evaluate(async () => axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    }));
    const summary = {
      locale,
      violations: results.violations.map(item => ({
        id: item.id,
        impact: item.impact,
        description: item.description,
        nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary })),
      })),
      passes: results.passes.length,
      incomplete: results.incomplete.length,
    };
    resultsByLocale[locale] = summary;
    fs.writeFileSync(path.join(OUT_DIR, 'axe-' + locale + '.json'), JSON.stringify(summary, null, 2));
    if (summary.violations.length) {
      throw new Error('WCAG accessibility violations in ' + locale + ': ' + JSON.stringify(summary.violations.slice(0, 8)));
    }
    await page.close();
  }
  fs.writeFileSync(path.join(OUT_DIR, 'axe-summary.json'), JSON.stringify(resultsByLocale, null, 2));
}


async function checkSitemapLocales() {
  const sitemap = fs.readFileSync(path.join(process.cwd(), 'sitemap.xml'), 'utf8');
  if (sitemap.includes('roulette.html?lang=')) throw new Error('Sitemap still contains query-string roulette language URLs');
  for (const [locale, url] of Object.entries(localeUrls)) {
    const block = sitemap.split('<url>').find(item => item.includes('<loc>' + url + '</loc>'));
    if (!block || !block.includes('</url>')) throw new Error('Sitemap is missing roulette URL for ' + locale);
    for (const [alternateLanguage, alternateUrl] of Object.entries(localeUrls)) {
      if (!block.includes('hreflang="' + alternateLanguage + '" href="' + alternateUrl + '"')) throw new Error('Sitemap alternate set is incomplete for ' + locale + ': ' + alternateLanguage);
    }
    if (!block.includes('hreflang="x-default" href="' + localeUrls.en + '"')) throw new Error('Sitemap x-default is missing for ' + locale);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const locale of Object.keys(locales)) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await checkStaticPage(page, locale);
      await page.close();
    }
    await checkResponsive(browser);
    await checkWalletAndSpin(browser);
    await checkAuthStates(browser);
    await checkWalletFailureStates(browser);
    await checkSpinErrorLocalization(browser);
    await checkRapidClick(browser);
    await checkStateAndStats(browser);
    await checkBonusSpin(browser);
    await checkWalletLifecycle(browser);
    await checkAccessibility(browser);
    await checkSitemapLocales();
    console.log('Roulette audit passed: 9 locales, 7 viewports, auth/wallet failure states, localized API errors, rapid-click protection, bonus-spin/state/history/stats and wallet-lifecycle checks, WCAG 2.1 AA axe checks across all locales, reduced motion, and mocked server-authoritative spin.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});

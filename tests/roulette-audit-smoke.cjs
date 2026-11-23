const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

// This smoke suite uses QA-only API mocks; it never reaches production wallet or payment flows.
const BASE_URL = process.env.SITE_URL || 'http://127.0.0.1:4173/';
const PAGE_URL = new URL('roulette.html', BASE_URL).toString();
const OUT_DIR = path.join(process.cwd(), 'roulette-audit-results');
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
  let state = {
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
      return json(route, { totalPrizeEquivalentUsd: 0, totalSpins: state.spinsToday, winners: [] });
    }
    if (url.pathname === '/api/profile') {
      return options.auth
        ? json(route, { profile: { publicDisplayName: 'QA Survivor', firstName: 'QA' } })
        : json(route, { error: 'Unauthorized' }, 401);
    }
    if (url.pathname === '/api/roulette/demo' && request.method() === 'GET') {
      return options.auth ? json(route, state) : json(route, { error: 'Unauthorized' }, 401);
    }
    if (url.pathname === '/api/roulette/wallet/challenge' && request.method() === 'POST') {
      return options.auth ? json(route, { challengeId: 'qa-challenge-001', message: 'ZombieCash QA wallet ownership check' }) : json(route, { error: 'Unauthorized' }, 401);
    }
    if (url.pathname === '/api/roulette/wallet/verify' && request.method() === 'POST') {
      return options.auth ? json(route, { verified: true }) : json(route, { error: 'Unauthorized' }, 401);
    }
    if (url.pathname === '/api/roulette/demo' && request.method() === 'POST') {
      if (!options.auth) return json(route, { error: 'Unauthorized' }, 401);
      const body = request.postDataJSON();
      if (!body.walletAddress) return json(route, { error: 'Wallet required' }, 400);
      if (body.mode !== 'free') return json(route, { error: 'Unexpected QA spin mode' }, 400);
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
  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('#roulette-wheel .wheel-label', { timeout: 30000 });
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
      alternates,
      spinButtonVisible: !!document.querySelector('#spin-free') && document.querySelector('#spin-free').getBoundingClientRect().height > 0,
      walletButtonVisible: !!document.querySelector('#wallet-connect') && document.querySelector('#wallet-connect').getBoundingClientRect().height > 0,
    };
  });
  if (result.lang !== locale) throw new Error(locale + ': document lang is ' + result.lang);
  if (result.wheelAgain !== locales[locale]) throw new Error(locale + ': wheel AGAIN label mismatch: ' + result.wheelAgain);
  if (result.wheelLabelCount !== 11) throw new Error(locale + ': expected 11 wheel labels, got ' + result.wheelLabelCount);
  if (result.documentWidth > result.viewportWidth + 1) throw new Error(locale + ': horizontal overflow at ' + result.viewportWidth + 'px');
  if (result.shellRect.x < -1 || result.shellRect.right > result.viewportWidth + 1) throw new Error(locale + ': wheel shell is clipped by viewport');
  if (result.blankI18n) throw new Error(locale + ': ' + result.blankI18n + ' empty translated elements');
  if (result.canonical.length !== 1 || result.canonical[0] !== 'https://zombcash.github.io/roulette.html') throw new Error(locale + ': canonical URL is missing or duplicated');
  if (result.alternates.length) throw new Error(locale + ': hreflang points to language variants that do not have separate URLs');
  if (!result.spinButtonVisible || !result.walletButtonVisible) throw new Error(locale + ': primary controls are not visible');
  if (!/signature|signatur|firma|подпис|署名|签名|imza|हस्ताक्षर/i.test(result.walletStatus)) throw new Error(locale + ': wallet signature requirement is not explained');
  if (locale === 'en' && /buy extra chances|purchases launch/i.test(result.intro)) throw new Error('English intro still promises unavailable demo purchases');
  if (locale === 'ru' && /покупай дополнительные шансы|покупка дополнительных попыток/i.test(result.intro)) throw new Error('Russian intro still promises unavailable demo purchases');
  if (!/no .*transfer|no .*payout|disabled|не перевод|не выплач|禁用|支払いなし|no se transfieren|keine .*zahlung/i.test(result.demoText)) {
    // Keep this check deliberately broad: the exact wording differs by locale.
    if (locale === 'en' || locale === 'ru') throw new Error(locale + ': demo disclaimer does not clearly disable payouts/transfers');
  }
  if (errors.length) throw new Error(locale + ': browser errors: ' + errors.join(' | '));
  const alternateLocale = locale === 'ru' ? 'en' : 'ru';
  await page.evaluate(language => {
    localStorage.setItem('zombcash-language', language);
    document.dispatchEvent(new CustomEvent('zombcash:languagechange', { detail: { language } }));
  }, alternateLocale);
  await page.waitForFunction(({ language, expected }) => document.documentElement.lang === language && [...document.querySelectorAll('.wheel-label[data-i18n="wheelAgain"]')].every(node => node.textContent.trim() === expected), { language: alternateLocale, expected: locales[alternateLocale] }, { timeout: 10000 });
  await page.evaluate(language => {
    localStorage.setItem('zombcash-language', language);
    window.dispatchEvent(new StorageEvent('storage', { key: 'zombcash-language', newValue: language }));
    window.dispatchEvent(new Event('focus'));
  }, locale);
  await page.waitForFunction(({ language, expected }) => document.documentElement.lang === language && [...document.querySelectorAll('.wheel-label[data-i18n="wheelAgain"]')].every(node => node.textContent.trim() === expected), { language: locale, expected: locales[locale] }, { timeout: 10000 });
  if (!calls.some(call => call.path === '/api/roulette/stats')) throw new Error(locale + ': public stats endpoint was not requested');
  await page.screenshot({ path: path.join(OUT_DIR, 'locale-' + locale.replace(/[^a-z0-9-]/gi, '-') + '.png'), fullPage: true });
  fs.writeFileSync(path.join(OUT_DIR, 'locale-' + locale.replace(/[^a-z0-9-]/gi, '-') + '.json'), JSON.stringify({ locale, result, errors, calls }, null, 2));
}

async function checkResponsive(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await installApiMocks(page);
  await page.addInitScript(() => localStorage.setItem('zombcash-language', 'en'));
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('#roulette-wheel .wheel-label', { timeout: 30000 });
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
  await page.waitForFunction(() => document.querySelector('#wallet-status')?.textContent.includes('QAWallet'), null, { timeout: 15000 });
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
    console.log('Roulette audit passed: 9 locales, 7 viewports, demo copy/SEO, wallet challenge, mocked server-authoritative spin, and screenshots.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});

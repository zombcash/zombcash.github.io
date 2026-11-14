const { chromium } = require('playwright');
const BASE = process.env.SITE_URL || 'https://zombcash.github.io/';
const locales = ['de', 'fr', 'it', 'ja', 'zh-CN', 'ru', 'tr', 'hi'];
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const openSwitcher = async () => {
    await page.locator('.zombcash-shared-header .language-trigger').waitFor({ state: 'visible', timeout: 15000 });
    if (await page.locator('.language-switcher').count() !== 1) throw new Error('Expected one language switcher');
    if (await page.locator('.zsh-language-slot > .language-switcher').count() !== 1) throw new Error('Switcher not mounted in shared header');
    await page.locator('.language-trigger').click();
    await page.locator('.language-menu:not([hidden])').waitFor({ state: 'visible', timeout: 3000 });
  };
  const choose = async code => {
    await openSwitcher();
    await page.locator('.language-option[data-lang="' + code + '"]').click();
    const expected = code === 'en' ? '/survivor-field-manual.html' : '/' + code + '/survivor-field-manual.html';
    await page.waitForURL(url => url.pathname === expected, { timeout: 20000, waitUntil: 'domcontentloaded' });
    await page.waitForFunction(value => document.documentElement.lang === value && localStorage.getItem('zombcash-language') === value, code, { timeout: 15000 });
    if (await page.locator('.language-switcher').count() !== 1) throw new Error('Duplicate switcher after navigation to ' + code);
    if (await page.locator('.language-menu:not([hidden])').count()) throw new Error('Language menu stayed open after navigation to ' + code);
  };
  try {
    await page.goto(new URL('survivor-field-manual.html', BASE).href, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => document.documentElement.lang === 'en', null, { timeout: 15000 });
    for (const locale of locales) await choose(locale);
    await choose('en');

    await page.goto(new URL('zombie-lab-archives.html', BASE).href, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('.language-trigger', { timeout: 15000 });
    await openSwitcher();
    await page.locator('.language-option[data-lang="ja"]').click();
    await page.waitForFunction(() => document.documentElement.lang === 'ja' && localStorage.getItem('zombcash-language') === 'ja', null, { timeout: 15000 });
    await page.waitForURL(url => url.pathname === '/zombie-lab-archives.html' && url.searchParams.get('lang') === 'ja', { timeout: 5000 }).catch(() => {});
    await page.locator('.zsh-nav a[href="/ja/survivor-field-manual.html"]').click();
    await page.waitForURL(url => url.pathname === '/ja/survivor-field-manual.html', { timeout: 20000, waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.lang === 'ja', null, { timeout: 15000 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.lang === 'ja' && localStorage.getItem('zombcash-language') === 'ja' && location.pathname === '/ja/survivor-field-manual.html', null, { timeout: 15000 });
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.lang === 'ja' && localStorage.getItem('zombcash-language') === 'ja' && location.pathname === '/zombie-lab-archives.html' && new URLSearchParams(location.search).get('lang') === 'ja', null, { timeout: 15000 });
    await page.goForward({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.lang === 'ja' && localStorage.getItem('zombcash-language') === 'ja' && location.pathname === '/ja/survivor-field-manual.html', null, { timeout: 15000 });

    if (errors.length) throw new Error('JavaScript errors: ' + errors.join(' | '));
    console.log('PASS: 18 language transitions, persistent locale, one shared switcher, fallback routing and localized internal navigation.');
  } catch (error) {
    console.error('FAIL: language transition smoke test:', error);
    process.exitCode = 1;
  } finally { await browser.close(); }
})();

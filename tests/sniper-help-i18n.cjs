const { chromium } = require('playwright');

const BASE = process.env.SITE_URL || 'http://127.0.0.1:4173/';
const locales = [
  { code: 'en', marker: 'PAPER DEMO IS AVAILABLE NOW.' },
  { code: 'ru', marker: 'СЕЙЧАС ДОСТУПЕН ТОЛЬКО ДЕМО-РЕЖИМ.' },
  { code: 'de', marker: 'DER PAPER-DEMO-MODUS IST VERFÜGBAR.' },
  { code: 'fr', marker: 'LE MODE DÉMO EST DISPONIBLE.' },
  { code: 'it', marker: 'LA DEMO È DISPONIBILE.' },
  { code: 'ja', marker: '現在利用できるのはデモモードのみです。' },
  { code: 'zh-CN', marker: '目前仅开放模拟模式' },
  { code: 'tr', marker: 'ŞU ANDA YALNIZCA DEMO MODU AÇIKTIR.' },
  { code: 'hi', marker: 'अभी केवल डेमो मोड उपलब्ध है।' },
];
const viewports = [
  { name: 'small-mobile', width: 320, height: 740 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 1000 },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const passed = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => failures.push({ test: 'pageerror', error: error.message }));
    for (const locale of locales) {
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const url = new URL((locale.code === 'en' ? '' : locale.code + '/') + 'buy-zombcash.html', BASE);
        const response = await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (!response || response.status() >= 400) {
          failures.push({ locale: locale.code, viewport: viewport.name, error: 'HTTP ' + (response?.status() ?? 'no response') });
          continue;
        }
        try {
          await page.waitForSelector('#zs-help-panel', { timeout: 15000 });
          await page.locator('[data-zs-nav="4"]').click();
          const panel = page.locator('#zs-help-panel');
          await panel.waitFor({ state: 'visible', timeout: 5000 });
          const text = await panel.innerText();
          if (!text.includes(locale.marker)) throw new Error('Localized demo notice missing: ' + locale.marker);
          if ((await panel.locator('.zs-help-card').count()) !== 5) throw new Error('Expected five Help & Safety sections');
          if (text.includes('No live wallets, private keys or transactions are used.')) throw new Error('Obsolete Help text is still visible');
          const dimensions = await panel.evaluate(el => ({
            panelWidth: el.clientWidth,
            panelScrollWidth: el.scrollWidth,
            documentWidth: document.documentElement.scrollWidth,
            viewportWidth: innerWidth,
          }));
          if (dimensions.panelScrollWidth > dimensions.panelWidth + 1) throw new Error('Help panel has horizontal overflow: ' + JSON.stringify(dimensions));
          if (dimensions.documentWidth > dimensions.viewportWidth + 1) throw new Error('Page has horizontal overflow: ' + JSON.stringify(dimensions));
          await page.locator('[data-zs-nav="0"]').click();
          if (!(await panel.evaluate(el => el.classList.contains('zs-tab-hidden')))) throw new Error('Help remains visible after switching to Sniper tab');
          passed.push(locale.code + '/' + viewport.name);
        } catch (error) {
          failures.push({ locale: locale.code, viewport: viewport.name, error: error.message });
          await page.screenshot({ path: 'sniper-help-' + locale.code + '-' + viewport.name + '.png', fullPage: true }).catch(() => {});
        }
      }
    }

    // Confirm the language dropdown can switch a live Sniper page to another localized route.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(new URL('buy-zombcash.html', BASE).href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('header.zombcash-shared-header .language-trigger', { timeout: 15000 });
    await page.locator('header.zombcash-shared-header .language-trigger').click();
    await page.locator('.language-option[data-lang="ru"]').click();
    await page.waitForURL(url => url.pathname === '/ru/buy-zombcash.html', { timeout: 15000 });
    await page.waitForSelector('#zs-help-panel', { timeout: 15000 });
    await page.locator('[data-zs-nav="4"]').click();
    await page.waitForFunction(marker => document.querySelector('#zs-help-panel')?.innerText.includes(marker), 'СЕЙЧАС ДОСТУПЕН ТОЛЬКО ДЕМО-РЕЖИМ.', { timeout: 5000 });
    passed.push('live-language-switch en->ru');

    console.log(JSON.stringify({ passed: passed.length, failures, passedCases: passed }, null, 2));
    if (failures.length) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();

const { chromium } = require('playwright');

const BASE = process.env.SITE_URL || 'https://zombcash.github.io/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const waitForLanguage = async expected => {
    // A URL change can be observed before the destination document reaches
    // DOMContentLoaded. Wait for the new document before reading localized DOM.
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {});
    await page.waitForFunction(
      value => document.documentElement.lang === value,
      expected,
      { timeout: 15000 },
    );
  };

  const chooseLanguage = async code => {
    await page.locator('.language-trigger').click();
    await page.locator(`.language-option[data-lang="${code}"]`).click();
  };

  try {
    await page.goto(new URL('zombie-lab-archives.html', BASE).href, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.language-trigger', { timeout: 15000 });

    await chooseLanguage('ru');
    await page.waitForFunction(() =>
      document.documentElement.lang === 'ru' &&
      new URL(location.href).searchParams.get('lang') === 'ru',
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForLanguage('ru');

    await page.goto(new URL('index.html', BASE).href, { waitUntil: 'domcontentloaded' });
    await waitForLanguage('ru');

    await page.goto(new URL('de/whitepaper.html', BASE).href, { waitUntil: 'domcontentloaded' });
    await waitForLanguage('de');
    await chooseLanguage('en');
    await page.waitForURL(url => url.pathname === '/whitepaper.html' && !url.searchParams.has('lang'));
    await waitForLanguage('en');

    await page.goto(new URL('zombie-lab-archives.html?lang=de', BASE).href, { waitUntil: 'domcontentloaded' });
    await waitForLanguage('de');
    await chooseLanguage('ja');
    await page.waitForFunction(() =>
      document.documentElement.lang === 'ja' &&
      new URL(location.href).searchParams.get('lang') === 'ja',
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForLanguage('ja');

    const locales = ['de', 'fr', 'it', 'ja', 'zh-CN', 'ru', 'tr', 'hi'];

    for (const locale of locales) {
      await page.goto(new URL('zombcash-market-data.html?lang=en', BASE).href, { waitUntil: 'domcontentloaded' });
      await waitForLanguage('en');
      await chooseLanguage(locale);
      await page.waitForURL(url => url.pathname === `/${locale}/zombcash-market-data.html`, { timeout: 25000, waitUntil: 'domcontentloaded' });
      await waitForLanguage(locale);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      if (canonical !== `https://zombcash.github.io/${locale}/zombcash-market-data.html`) {
        throw new Error(`Market Data canonical mismatch for ${locale}: ${canonical}`);
      }
      const headingLocator = page.locator('h1').first();
      try {
        await headingLocator.waitFor({ state: 'visible', timeout: 10000 });
      } catch (error) {
        const diagnostic = await page.evaluate(() => ({
          url: location.href,
          readyState: document.readyState,
          lang: document.documentElement.lang,
          title: document.title,
          h1Count: document.querySelectorAll('h1').length,
          h1: [...document.querySelectorAll('h1')].map(node => ({
            text: node.innerText,
            display: getComputedStyle(node).display,
            visibility: getComputedStyle(node).visibility,
            opacity: getComputedStyle(node).opacity,
            rect: (() => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })(),
          })),
          bodyText: document.body.innerText.slice(0, 500),
        }));
        throw new Error('Localized Market Data H1 did not become visible for ' + locale +
          '; diagnostic=' + JSON.stringify(diagnostic) + '; original=' + error.message);
      }
      const heading = await headingLocator.innerText();
      if (!heading.trim() || heading.includes('Market Data')) {
        throw new Error(`Market Data heading was not localized for ${locale}: ${heading}`);
      }

      await page.goto(new URL(`${locale}/buy-zombcash.html`, BASE).href, { waitUntil: 'domcontentloaded' });
      await waitForLanguage(locale);
      const marketLink = page.locator(`a[href="/${locale}/zombcash-market-data.html"]`);
      if (await marketLink.count() !== 1) {
        throw new Error(`Localized buying guide Market Data link missing for ${locale}`);
      }
      await marketLink.click();
      await page.waitForURL(url => url.pathname === `/${locale}/zombcash-market-data.html`, { timeout: 25000, waitUntil: 'domcontentloaded' });
      await waitForLanguage(locale);
    }
    for (const locale of locales) {
      await page.goto(new URL('whitepaper.html?lang=en', BASE).href, { waitUntil: 'domcontentloaded' });
      await waitForLanguage('en');
      await chooseLanguage(locale);
      await page.waitForURL(url => url.pathname === `/${locale}/whitepaper.html`, { timeout: 25000, waitUntil: 'domcontentloaded' });
      await waitForLanguage(locale);

      const whitepaperLink = page.locator('#zsh-navigation > a[href$="/whitepaper.html"]');
      const whitepaperHref = await whitepaperLink.getAttribute('href');
      if (new URL(whitepaperHref, page.url()).pathname !== `/${locale}/whitepaper.html`) {
        throw new Error(`Whitepaper navigation did not stay in ${locale}: ${whitepaperHref}`);
      }

      const galleryLink = page.locator('#zsh-navigation > a[href$="/gallery.html"]');
      const galleryHref = await galleryLink.getAttribute('href');
      if (new URL(galleryHref, page.url()).pathname !== `/${locale}/gallery.html`) {
        throw new Error(`Gallery navigation did not stay in ${locale}: ${galleryHref}`);
      }
      await galleryLink.click();
      await page.waitForURL(url => url.pathname === `/${locale}/gallery.html`, { timeout: 25000, waitUntil: 'domcontentloaded' });
      await waitForLanguage(locale);

      await page.goto(new URL(`${locale}/`, BASE).href, { waitUntil: 'domcontentloaded' });
      await waitForLanguage(locale);
      if (await page.locator(`#site-footer a[href="/${locale}/gallery.html"]`).count() !== 1) {
        throw new Error(`Localized footer Gallery link missing for ${locale}`);
      }
      if (await page.locator(`#site-footer a[href="/${locale}/whitepaper.html"]`).count() !== 1) {
        throw new Error(`Localized footer Whitepaper link missing for ${locale}`);
      }
    }

    console.log('PASS: fallback language persistence, Market Data static locales, buying-guide links, and Whitepaper/Gallery routing in all 8 locales.');
  } catch (error) {
    console.error('FAIL: language persistence smoke test:', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();

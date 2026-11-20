const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE_URL = process.env.SITE_URL || 'https://zombcash.github.io/';
const isLocalPreview = ['localhost', '127.0.0.1'].includes(new URL(BASE_URL).hostname);
const viewports = [
  { width: 390, height: 844, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1600, height: 900, name: 'desktop' },
];
const outDir = path.join(process.cwd(), 'roulette-audit-results');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const results = [];

  try {
    for (const vp of viewports) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
        isMobile: vp.width < 768,
        hasTouch: vp.width < 768,
      });
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error') pageErrors.push('console: ' + message.text());
      });

      await page.goto(BASE_URL + 'roulette.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForLoadState('load', { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(2000);

      // Check for horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );

      // Check images loaded
      const images = await page.evaluate(() =>
        Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src.split('/').pop(),
          loaded: img.complete && img.naturalWidth > 0,
          width: img.naturalWidth,
          height: img.naturalHeight,
        })).filter(i => i.src.includes('buy-') || i.src.includes('roulette') || i.src.includes('survivor'))
      );

      // Check key elements
      const elements = await page.evaluate(() => ({
        hasJupiterTerminal: !!document.querySelector('h2')?.textContent?.includes('JUPITER SWAP'),
        hasWalletConnect: !!document.querySelector('#wallet-connect'),
        hasMintAddress: !!document.querySelector('code'),
        hasFAQ: !!document.querySelector('[class*="faq"], [id*="faq"], [class*="FAQ"]') || document.body.innerText.includes('FREQUENTLY ASKED'),
        hasLanguageSwitcher: !!document.querySelector('button[aria-label*="language"], button[data-i18n*="language"], .language-switcher, [class*="lang"]'),
        hasTitle: document.title.length > 0,
        hasCanonical: !!document.querySelector('link[rel="canonical"]'),
        hasHreflang: !!document.querySelector('link[rel="alternate"][hreflang]'),
        hasDescription: !!document.querySelector('meta[name="description"]'),
      }));

      // Take screenshot
      await page.screenshot({ path: path.join(outDir, `roulette-${vp.name}-${vp.width}x${vp.height}.png`), fullPage: true });

      const result = {
        viewport: `${vp.width}x${vp.height}`,
        name: vp.name,
        hasHorizontalScroll,
        images,
        elements,
        pageErrors,
        pass: !hasHorizontalScroll && pageErrors.length === 0,
      };
      results.push(result);

      if (hasHorizontalScroll) failures.push(`${vp.name}: horizontal scroll detected`);
      if (pageErrors.length > 0) failures.push(`${vp.name}: ${pageErrors.length} console errors`);
      if (!elements.hasJupiterTerminal) failures.push(`${vp.name}: Jupiter terminal not found`);
      if (!elements.hasMintAddress) failures.push(`${vp.name}: mint address not found`);
      if (!elements.hasFAQ) failures.push(`${vp.name}: FAQ not found`);
      if (!elements.hasTitle) failures.push(`${vp.name}: title missing`);
      if (!elements.hasCanonical) failures.push(`${vp.name}: canonical missing`);

      await page.close();
    }

    console.log(JSON.stringify({ results, failures }, null, 2));

    if (failures.length > 0) {
      console.error('FAILURES:', failures);
      process.exitCode = 1;
    } else {
      console.log('All checks passed.');
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();

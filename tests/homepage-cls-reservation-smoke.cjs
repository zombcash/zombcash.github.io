const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const SITE_URL = process.env.SITE_URL || 'http://127.0.0.1:4173/';
const widths = [390, 1024, 1440, 1600];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.addInitScript(() => {
        window.__zcLayoutShifts = [];
        try {
          new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              if (entry.hadRecentInput) continue;
              const sources = (entry.sources || []).map(source => {
                const node = source.node;
                if (!node) return null;
                const id = node.id ? '#' + node.id : '';
                const classes = typeof node.className === 'string' && node.className
                  ? '.' + node.className.trim().split(/\\s+/).join('.')
                  : '';
                return {
                  selector: node.tagName.toLowerCase() + id + classes,
                  previousY: source.previousRect && Math.round(source.previousRect.y),
                  currentY: source.currentRect && Math.round(source.currentRect.y),
                };
              }).filter(Boolean);
              window.__zcLayoutShifts.push({ value: entry.value, startTime: entry.startTime, sources });
            }
          }).observe({ type: 'layout-shift', buffered: true });
        } catch (_) {}
      });

      for (const pattern of [
        'https://*.bauval.org/**',
        'https://zombcash-bot.fadehost.app/**',
        'https://api.binance.com/**',
        'https://api.coingecko.com/**',
        'https://open.er-api.com/**',
        'https://api.dexscreener.com/**',
      ]) {
        await page.route(pattern, route => route.abort());
      }

      await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForLoadState('load', { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(3500);

      const result = await page.evaluate(() => {
        const header = document.querySelector('body > header.zombcash-shared-header');
        const ribbons = document.querySelector('body > .zc-outbreak-ribbons');
        const main = document.querySelector('body > main#home');
        const entries = window.__zcLayoutShifts || [];
        const mainShift = entries.reduce((sum, entry) => {
          return sum + (entry.sources.some(source => source.selector.includes('main#home')) ? entry.value : 0);
        }, 0);
        return {
          width: innerWidth,
          headerHeight: header ? Math.round(header.getBoundingClientRect().height) : null,
          ribbonsHeight: ribbons ? Math.round(ribbons.getBoundingClientRect().height) : null,
          mainTop: main ? Math.round(main.getBoundingClientRect().top) : null,
          placeholdersHydrated: !!header && !header.hasAttribute('data-zsh-placeholder') &&
            !!ribbons && !ribbons.hasAttribute('data-zc-ribbons-placeholder'),
          mainShift,
          totalShift: entries.reduce((sum, entry) => sum + entry.value, 0),
          entries,
        };
      });

      assert.ok(result.headerHeight > 0, width + 'px: shared header missing');
      assert.ok(result.ribbonsHeight > 0, width + 'px: outbreak ribbons missing');
      assert.equal(result.placeholdersHydrated, true, width + 'px: reserved shell did not hydrate');
      assert.ok(result.mainTop >= result.headerHeight + result.ribbonsHeight - 2,
        width + 'px: main overlaps the reserved header/ribbon shell');
      assert.ok(result.mainShift < 0.025,
        width + 'px: main content still causes a large startup layout shift: ' + JSON.stringify(result.entries));
      results.push({
        width,
        headerHeight: result.headerHeight,
        ribbonsHeight: result.ribbonsHeight,
        mainTop: result.mainTop,
        mainShift: Number(result.mainShift.toFixed(4)),
        totalShift: Number(result.totalShift.toFixed(4)),
      });
      await page.close();
    }
    console.log(JSON.stringify({ result: 'PASS', viewports: results }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

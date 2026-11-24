const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const base = process.env.SITE_URL || 'http://127.0.0.1:4173/';
const routes = ['', 'de/', 'fr/', 'it/', 'ja/', 'zh-CN/', 'ru/', 'tr/', 'hi/'];
const widths = [390, 1440];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const route of routes) {
      for (const width of widths) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        await page.addInitScript(() => {
          window.__zcMainLayoutShifts = [];
          try {
            new PerformanceObserver(list => {
              for (const entry of list.getEntries()) {
                if (entry.hadRecentInput) continue;
                const sources = (entry.sources || []).filter(source => {
                  const node = source.node;
                  return node && (node.matches?.('main#home') || node.closest?.('main#home'));
                });
                if (sources.length) {
                  window.__zcMainLayoutShifts.push({
                    value: entry.value,
                    sources: sources.map(source => ({
                      selector: source.node?.id ? '#' + source.node.id : source.node?.tagName?.toLowerCase(),
                      previousRect: source.previousRect,
                      currentRect: source.currentRect
                    }))
                  });
                }
              }
            }).observe({ type: 'layout-shift', buffered: true });
          } catch (error) {
            window.__zcMainLayoutShiftObserverError = error.message;
          }
        });
        const url = route ? new URL(route, base).href : base;
        await page.goto(url, { waitUntil: 'load', timeout: 60000 });
        await page.waitForSelector('.zc-ribbon--market .zc-ribbon-copy', { timeout: 15000 });
        await page.waitForTimeout(1200);
        const result = await page.evaluate(() => {
          const ribbon = document.querySelector('.zc-outbreak-ribbons');
          const main = document.querySelector('main#home');
          return {
            ribbonCount: document.querySelectorAll('.zc-outbreak-ribbons').length,
            bands: ribbon?.querySelectorAll('.zc-ribbon').length || 0,
            ribbonHeight: ribbon ? Math.round(ribbon.getBoundingClientRect().height) : 0,
            ribbonMinHeight: ribbon ? getComputedStyle(ribbon).minHeight : null,
            headerHeight: document.querySelector('body > header.topbar') ? Math.round(document.querySelector('body > header.topbar').getBoundingClientRect().height) : null,
            mainTop: main ? Math.round(main.getBoundingClientRect().top) : null,
            heroTitleFontSize: document.querySelector('main#home .hero h1') ? Number.parseFloat(getComputedStyle(document.querySelector('main#home .hero h1')).fontSize) : null,
            mainShifts: window.__zcMainLayoutShifts || [],
            observerError: window.__zcMainLayoutShiftObserverError || null
          };
        });
        assert.equal(result.ribbonCount, 1, route + ' must keep exactly one ribbon container');
        assert.equal(result.bands, 3, route + ' must render all three ribbon bands');
        assert.ok(result.ribbonHeight >= (width <= 760 ? 123 : 127), route + ' ribbon height must be reserved before market values load: ' + JSON.stringify(result));
        if (width === 390) assert.equal(Math.round(result.heroTitleFontSize), 39, route + ' mobile hero title must use the active responsive font-size rule: ' + JSON.stringify(result));
        assert.deepEqual(result.mainShifts, [], route + ' main content must not shift when live ribbons render: ' + JSON.stringify(result));
        assert.equal(result.observerError, null, route + ' layout-shift observer must initialize');
        results.push({ route: route || '/', width, status: 'PASS', ribbonHeight: result.ribbonHeight, mainTop: result.mainTop });
        await page.close();
      }
    }
    console.log(JSON.stringify({ checked: results.length, results }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

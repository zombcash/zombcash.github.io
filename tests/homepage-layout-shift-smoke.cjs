const { chromium } = require('playwright');

const SITE_URL = process.env.SITE_URL || 'https://zombcash.github.io/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 }, deviceScaleFactor: 1 });
  await page.addInitScript(() => {
    window.__zcLayoutShiftEntries = [];
    try {
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.hadRecentInput) continue;
          const sources = (entry.sources || []).map(source => {
            const node = source.node;
            if (!node) return null;
            const tag = node.tagName ? node.tagName.toLowerCase() : '';
            const classes = typeof node.className === 'string' ? node.className.trim().replace(/\\s+/g, '.') : '';
            const selector = node.id ? '#' + node.id : tag + (classes ? '.' + classes : '');
            return {
              selector,
              previousRect: source.previousRect || null,
              currentRect: source.currentRect || null
            };
          }).filter(Boolean);
          window.__zcLayoutShiftEntries.push({
            value: entry.value,
            startTime: entry.startTime,
            sources
          });
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      window.__zcLayoutShiftObserverError = String(error);
    }
  });

  try {
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(8000);
    const report = await page.evaluate(() => {
      const rect = element => {
        if (!element) return null;
        const box = element.getBoundingClientRect();
        return {
          top: Math.round(box.top),
          bottom: Math.round(box.bottom),
          width: Math.round(box.width),
          height: Math.round(box.height)
        };
      };
      const entries = window.__zcLayoutShiftEntries || [];
      const cls = entries.reduce((sum, entry) => sum + entry.value, 0);
      const ribbon = document.querySelector('.zc-outbreak-ribbons');
      const hero = document.querySelector('main#home > .hero');
      const layout = hero?.querySelector('.hero-layout');
      return {
        url: location.href,
        viewport: { width: innerWidth, height: innerHeight },
        cls: Number(cls.toFixed(4)),
        layoutShiftCount: entries.length,
        entries: entries.map(entry => ({
          value: Number(entry.value.toFixed(4)),
          startTime: Math.round(entry.startTime),
          sources: entry.sources
        })),
        ribbon: {
          exists: !!ribbon,
          connected: !!ribbon?.isConnected,
          rect: rect(ribbon),
          childRows: ribbon?.querySelectorAll('.zc-ribbon').length || 0
        },
        header: rect(document.querySelector('header.zombcash-shared-header')),
        hero: rect(hero),
        heroLayout: rect(layout),
        observerError: window.__zcLayoutShiftObserverError || null
      };
    });
    console.log('LIVE_HOMEPAGE_LAYOUT_SHIFT_REPORT=' + JSON.stringify(report));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

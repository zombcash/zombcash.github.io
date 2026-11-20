const { chromium } = require('playwright');

const BASE = process.env.SITE_URL || 'http://127.0.0.1:4173/';
const viewports = [
  { name: 'desktop', width: 1440, height: 1000, compact: true },
  { name: 'laptop', width: 1280, height: 800, compact: true },
  { name: 'tablet', width: 768, height: 1024, compact: true },
  { name: 'mobile', width: 390, height: 844, compact: false },
  { name: 'small-mobile', width: 320, height: 740, compact: false },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const passed = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => failures.push({ test: 'pageerror', error: error.message }));
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const response = await page.goto(new URL('buy-zombcash.html', BASE).href, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (!response || response.status() >= 400) {
        failures.push({ viewport: viewport.name, error: 'HTTP ' + (response?.status() ?? 'no response') });
        continue;
      }
      try {
        await page.waitForSelector('.sniper-demo .zs-nav button[data-zs-nav="0"]', { state: 'visible', timeout: 15000 });
        await page.locator('.zs-nav button[data-zs-nav="0"]').evaluate(el => el.click());
        await page.waitForFunction(() => document.querySelector('.sniper-demo')?.classList.contains('zs-sniper-mode'), { timeout: 5000 });
        const metrics = await page.evaluate(() => {
          const root = document.querySelector('.sniper-demo');
          const layout = root?.querySelector(':scope > .zs-layout');
          const panels = ['.zs-left', '.zs-center', '.zs-right'].map(selector => {
            const el = layout?.querySelector(selector);
            const css = el ? getComputedStyle(el) : null;
            return el ? { selector, height: Math.round(el.getBoundingClientRect().height), scrollHeight: el.scrollHeight, overflowY: css.overflowY, display: css.display } : null;
          });
          return {
            viewportWidth: innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            rootClass: root?.className,
            layoutHeight: layout ? Math.round(layout.getBoundingClientRect().height) : 0,
            panels,
          };
        });
        if (!metrics.layoutHeight) throw new Error('Sniper dashboard layout not found: ' + JSON.stringify(metrics));
        if (metrics.documentWidth > metrics.viewportWidth + 1) throw new Error('Horizontal page overflow: ' + JSON.stringify(metrics));
        if (viewport.compact && (metrics.layoutHeight < 500 || metrics.layoutHeight > 710)) throw new Error('Desktop Sniper height is not compact (expected 500–710px): ' + JSON.stringify(metrics));
        if (viewport.compact && metrics.panels.some(p => !p || p.height < 100 || !['auto','scroll'].includes(p.overflowY))) throw new Error('Desktop panels are not independently scrollable: ' + JSON.stringify(metrics));
        await page.locator('.zs-nav button[data-zs-nav="1"]').evaluate(el => el.click());
        await page.waitForFunction(() => document.querySelector('.sniper-demo')?.dataset.activeTab === 'stats', { timeout: 5000 });
        await page.locator('.zs-nav button[data-zs-nav="2"]').evaluate(el => el.click());
        await page.waitForFunction(() => document.querySelector('.sniper-demo')?.dataset.activeTab === 'history', { timeout: 5000 });
        await page.locator('.zs-nav button[data-zs-nav="0"]').evaluate(el => el.click());
        await page.waitForFunction(() => document.querySelector('.sniper-demo')?.dataset.activeTab === 'sniper', { timeout: 5000 });
        passed.push(viewport.name);
      } catch (error) {
        failures.push({ viewport: viewport.name, error: error.message });
        await page.screenshot({ path: 'sniper-compact-' + viewport.name + '.png', fullPage: true }).catch(() => {});
      }
    }
    console.log(JSON.stringify({ passed: passed.length, failures, passedCases: passed }, null, 2));
    if (failures.length) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();

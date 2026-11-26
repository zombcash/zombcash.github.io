const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const SITE_URL = process.env.SITE_URL || 'http://127.0.0.1:4173/';
const pages = ['', 'de/', 'fr/', 'hi/', 'it/', 'ja/', 'ru/', 'tr/', 'zh-CN/'];
const viewports = [{ name: 'mobile', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 900 }];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const route of pages) {
      for (const viewport of viewports) {
        const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
        await page.route('**/*', request => {
          const url = new URL(request.request().url());
          if (!['http://127.0.0.1:4173', 'http://localhost:4173'].includes(url.origin)) return request.abort();
          return request.continue();
        });
        await page.goto(new URL('buy-zombcash.html', new URL(route, SITE_URL)).href, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const checks = await page.evaluate(() => {
          const main = document.querySelector('.buy-wrap');
          const sniper = document.querySelector('.sniper-demo');
          const links = [...document.querySelectorAll('link[rel="stylesheet"]')].map(x => x.href);
          const cssLinks = links.filter(x => /buy-zombcash-(?:main|sniper)\.css\?v=20261126-1/.test(x));
          const loaded = cssLinks.map(href => {
            const sheet = [...document.styleSheets].find(s => s.href === href);
            return { href, loaded: !!sheet, rules: sheet?.cssRules?.length || 0 };
          });
          return {
            h1: document.querySelector('h1')?.innerText.trim(),
            mainVisible: !!main && getComputedStyle(main).display !== 'none',
            sniperVisible: !!sniper && getComputedStyle(sniper).display !== 'none',
            cssLinks: cssLinks.length,
            loaded,
            viewportWidth: innerWidth,
            documentWidth: document.documentElement.scrollWidth,
          };
        });
        assert.ok(checks.h1, route + viewport.name + ': page heading missing');
        assert.equal(checks.mainVisible, true, route + viewport.name + ': buy page wrapper not visible');
        assert.equal(checks.sniperVisible, true, route + viewport.name + ': demo/sniper section not visible');
        assert.equal(checks.cssLinks, 2, route + viewport.name + ': expected exactly two extracted CSS links');
        assert.ok(checks.loaded.every(x => x.loaded && x.rules > 0), route + viewport.name + ': extracted stylesheet did not load');
        assert.ok(checks.documentWidth <= checks.viewportWidth + 1, route + viewport.name + ': horizontal overflow detected (' + checks.documentWidth + ' > ' + checks.viewportWidth + ')');
        results.push({ route: route || '/', viewport: viewport.name, status: 'PASS', width: checks.documentWidth });
        await page.close();
      }
    }
    console.log(JSON.stringify({ result: 'PASS', pages: pages.length, viewports: viewports.length, results }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

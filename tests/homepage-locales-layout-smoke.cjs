const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const ORIGIN = process.env.SITE_URL || 'https://zombcash.github.io/';
const locales = ['en', 'de', 'fr', 'it', 'ja', 'zh-CN', 'ru', 'tr', 'hi'];
const viewports = [360, 768, 1024, 1440];
const output = path.join(process.cwd(), 'homepage-locale-results');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const results = [];
  try {
    for (const locale of locales) {
      const url = locale === 'en' ? ORIGIN : new URL(locale + '/index.html', ORIGIN).href;
      for (const width of viewports) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('load', { timeout: 20000 }).catch(() => {});
        await page.waitForSelector('main#home .hero-layout .zc-hero-sponsor-panel', { timeout: 20000 });
        await page.waitForTimeout(250);
        const result = await page.evaluate(() => {
          const rect = el => {
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) };
          };
          const hero = document.querySelector('main#home > .hero');
          const layout = hero?.querySelector('.hero-layout');
          const content = layout?.querySelector('.hero-content');
          const sponsor = layout?.querySelector('.zc-hero-sponsor-panel');
          const art = sponsor?.querySelector('.zc-sponsor-art-slot');
          const image = art?.querySelector('img');
          const stylesheet = Array.from(document.styleSheets).some(s => {
            try { return s.href && new URL(s.href).pathname.endsWith('/homepage-visual.css'); }
            catch { return false; }
          });
          return {
            width: innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            stylesheet,
            hero: rect(hero), layout: rect(layout), content: rect(content), sponsor: rect(sponsor), art: rect(art),
            imagePresent: !!image,
            imageLoaded: !!image && image.complete && image.naturalWidth > 0,
          };
        });
        const issues = [];
        if (!result.stylesheet) issues.push('homepage-visual.css was not loaded');
        if (result.documentWidth > width + 1) issues.push('horizontal overflow: ' + result.documentWidth + 'px');
        if (!result.imagePresent || !result.imageLoaded) issues.push('sponsor artwork image is missing or failed to load');
        if (width >= 1360 && result.content.right > result.sponsor.left + 2) issues.push('desktop hero columns overlap');
        if (width < 1360 && result.content.bottom > result.sponsor.top + 2) issues.push('stacked hero sections overlap');
        if (errors.length) issues.push('JavaScript errors: ' + errors.join(' | '));
        const item = { locale, width, url, result, issues };
        results.push(item);
        if (issues.length) failures.push(item);
        if (issues.length) {
          await page.screenshot({ path: path.join(output, locale + '-' + width + '.png'), fullPage: false });
        }
        await page.close();
      }
    }
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ results, failures }, null, 2));
    console.log(JSON.stringify({ checked: results.length, failures }, null, 2));
  } finally {
    await browser.close();
  }
  if (failures.length) process.exitCode = 1;
})();

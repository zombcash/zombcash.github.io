const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = 'https://zombcash.github.io/';
const locales = ['en','de','fr','it','ja','zh-CN','ru','tr','hi'];
const paths = {
  en: 'memecoin-promotion-platforms-comparison.html',
  de: 'de/memecoin-promotion-platforms-comparison.html',
  fr: 'fr/memecoin-promotion-platforms-comparison.html',
  it: 'it/memecoin-promotion-platforms-comparison.html',
  ja: 'ja/memecoin-promotion-platforms-comparison.html',
  'zh-CN': 'zh-CN/memecoin-promotion-platforms-comparison.html',
  ru: 'ru/memecoin-promotion-platforms-comparison.html',
  tr: 'tr/memecoin-promotion-platforms-comparison.html',
  hi: 'hi/memecoin-promotion-platforms-comparison.html',
};
const widths = [1440, 768, 390, 320];
const out = path.join(process.cwd(), 'memecoin-article-results');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const reports = [];
  try {
    for (const locale of locales) {
      for (const width of widths) {
        const page = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 960 }, deviceScaleFactor: 1, isMobile: width < 600, hasTouch: width < 600 });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(new URL(paths[locale], BASE).href, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForSelector('header.zombcash-shared-header', { timeout: 25000 });
        await page.waitForTimeout(600);
        const result = await page.evaluate(async () => {
          const images = [...document.querySelectorAll('main img')];
          await Promise.all(images.map(img => new Promise(resolve => {
            img.loading = 'eager';
            if (img.complete) return resolve();
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
            setTimeout(resolve, 10000);
          })));
          const cover = document.querySelector('main img[src*="memecoin-platforms-battlefield"]');
          const menu = document.querySelector('header.zombcash-shared-header .language-trigger');
          return {
            lang: document.documentElement.lang,
            width: innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            title: document.title,
            description: !!document.querySelector('meta[name="description"]')?.content,
            canonical: document.querySelector('link[rel="canonical"]')?.href || '',
            hreflang: document.querySelectorAll('link[rel="alternate"][hreflang]').length,
            headings: document.querySelectorAll('main h2').length,
            coverLoaded: !!cover && cover.complete && cover.naturalWidth > 0,
            coverNaturalWidth: cover?.naturalWidth || 0,
            imageCount: images.length,
            brokenImages: images.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.currentSrc || img.src),
            sources: [...document.querySelectorAll('main a[href]')].filter(a => /coinsniper|coinmooner|coinvote|semrush|tranco/i.test(a.href)).length,
            languageTrigger: !!menu,
            nav: !!document.querySelector('header.zombcash-shared-header'),
            mainWrap: !!document.querySelector('main')?.parentElement.classList.contains('wrap'),
            bodyBackground: getComputedStyle(document.body).backgroundColor + ' ' + getComputedStyle(document.body).backgroundImage,
            tableCount: document.querySelectorAll('main table').length,
            tableWrappers: document.querySelectorAll('main .table-wrap').length,
          };
        });
        const issues = [];
        if (result.lang !== locale) issues.push('html lang mismatch: ' + result.lang);
        if (result.documentWidth > width + 1) issues.push('horizontal overflow: ' + result.documentWidth);
        if (!result.title || !result.description || !result.canonical) issues.push('missing SEO metadata');
        if (result.hreflang < 10) issues.push('incomplete hreflang cluster: ' + result.hreflang);
        if (result.headings < 10) issues.push('article sections missing: ' + result.headings);
        if (!result.coverLoaded) issues.push('cover image failed to load');
        if (result.brokenImages.length) issues.push('broken article images: ' + result.brokenImages.join(', '));
        if (result.sources < 8) issues.push('source links missing: ' + result.sources);
        if (!result.languageTrigger || !result.nav) issues.push('shared navigation or language selector missing');
        if (!result.mainWrap) issues.push('article content wrapper missing');
        if (result.bodyBackground.includes('255, 255, 255')) issues.push('article rendered with white/default background instead of the dark site theme');
        if (result.tableCount > result.tableWrappers) issues.push('one or more tables lack a responsive horizontal-scroll wrapper');
        if (errors.length) issues.push('JS errors: ' + errors.join(' | '));
        await page.screenshot({ path: path.join(out, locale.replace(/[^a-z0-9]/gi,'-') + '-' + width + '.png'), fullPage: true });
        reports.push({ locale, width, result, issues });
        if (issues.length) failures.push({ locale, width, issues });
        await page.close();
      }
    }

    // Exercise actual article-to-article language switching on mobile.
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await page.goto(new URL(paths.en, BASE).href, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('header.zombcash-shared-header .language-trigger', { timeout: 25000 });
    for (const code of locales.filter(x => x !== 'en')) {
      await page.locator('header.zombcash-shared-header .language-trigger').click();
      await page.locator('.language-option[data-lang="' + code + '"]').click();
      // Article images can delay the full load event after navigation has committed.
      // Waiting for DOM readiness avoids a false timeout while still verifying the destination.
      await page.waitForURL(url => url.pathname === '/' + paths[code], { timeout: 25000, waitUntil: 'domcontentloaded' });
      await page.waitForFunction(expected => document.documentElement.lang === expected, code, { timeout: 15000 });
    }
    reports.push({ languageSwitch: 'passed all 8 destinations' });
    await page.close();
    console.log(JSON.stringify({ pages: locales.length, viewports: widths.length, checks: reports.length, failures }, null, 2));
    if (failures.length) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();

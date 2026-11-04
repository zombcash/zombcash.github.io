const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.env.SITE_URL || 'https://zombcash.github.io/';
const locales = [
  { code: 'en', path: 'survivor-field-manual.html' },
  { code: 'ru', path: 'ru/survivor-field-manual.html' },
  { code: 'de', path: 'de/survivor-field-manual.html' },
  { code: 'fr', path: 'fr/survivor-field-manual.html' },
  { code: 'it', path: 'it/survivor-field-manual.html' },
  { code: 'ja', path: 'ja/survivor-field-manual.html' },
  { code: 'zh-CN', path: 'zh-CN/survivor-field-manual.html' },
  { code: 'tr', path: 'tr/survivor-field-manual.html' },
  { code: 'hi', path: 'hi/survivor-field-manual.html' },
];
const viewports = [1440, 768, 390, 320];
const outDir = path.join(process.cwd(), 'survivor-field-manual-results');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const summary = [];
  try {
    for (const locale of locales) {
      for (const width of viewports) {
        const page = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 960 }, deviceScaleFactor: 1, isMobile: width < 600, hasTouch: width < 600 });
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(new URL(locale.path, BASE).href, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForSelector('header.zombcash-shared-header', { timeout: 25000 });
        await page.waitForSelector('#manual-articles .article-card', { timeout: 15000 });
        await page.waitForTimeout(500);
        await page.locator('#manual-articles img').evaluateAll(imgs => Promise.all(imgs.map(img => new Promise(resolve => { img.loading = 'eager'; if (img.complete && img.naturalWidth > 0) return resolve(); img.addEventListener('load', resolve, { once: true }); img.addEventListener('error', resolve, { once: true }); setTimeout(resolve, 12000); }))));
        const initial = await page.evaluate(() => {
          const imgs = [...document.querySelectorAll('main img, #manual-articles img')];
          return {
            lang: document.documentElement.lang,
            viewport: innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            cards: document.querySelectorAll('#manual-articles .article-card').length,
            visibleCards: [...document.querySelectorAll('#manual-articles .article-card')].filter(x => getComputedStyle(x).display !== 'none').length,
            images: imgs.length,
            brokenImages: imgs.filter(x => !x.complete || x.naturalWidth === 0).map(x => x.currentSrc || x.src),
            hero: !!document.querySelector('.manual-hero'),
            steps: document.querySelectorAll('.manual-step').length,
            flow: !!document.querySelector('.manual-flow svg'),
            tools: document.querySelectorAll('.manual-tool').length,
            filter: !!document.querySelector('#manual-search'),
            navLanguage: !!document.querySelector('header.zombcash-shared-header .language-trigger'),
          };
        });
        const issues = [];
        if (initial.lang !== locale.code) issues.push('html lang mismatch: ' + initial.lang);
        if (initial.documentWidth > width + 1) issues.push('horizontal overflow: ' + initial.documentWidth + 'px');
        if (initial.cards < 1 || initial.visibleCards !== initial.cards) issues.push('not all article cards visible initially');
        if (initial.brokenImages.length) issues.push('broken images: ' + initial.brokenImages.join(', '));
        if (!initial.hero || initial.steps !== 5 || !initial.flow || initial.tools !== 4) issues.push('editorial content block missing/incomplete');
        if (!initial.filter || !initial.navLanguage) issues.push('search/filter or language selector missing');

        // Search must reduce the result set; reset must restore it.
        const search = page.locator('#manual-search');
        const firstTitle = (await page.locator('#manual-articles .article-card h2').first().innerText()).trim().split(/\s+/).slice(0, 2).join(' ');
        await search.fill(firstTitle);
        const filtered = await page.locator('#manual-articles .article-card:visible').count();
        if (filtered < 1 || filtered >= initial.cards) issues.push('search did not produce a narrower result set (' + filtered + ')');
        await page.locator('#manual-clear').click();
        const restored = await page.locator('#manual-articles .article-card:visible').count();
        if (restored !== initial.cards) issues.push('clear filters did not restore all cards (' + restored + ')');
        await page.locator('#manual-sort').selectOption('date-asc');
        await page.locator('#manual-sort').selectOption('date-desc');

        // Topic categories must match the cards and return a non-empty subset.
        const category = page.locator('#manual-category');
        const categoryValues = await category.locator('option').evaluateAll(options => options.map(option => option.value).filter(Boolean));
        if (!categoryValues.length) issues.push('topic filter has no categories');
        else {
          await category.selectOption(categoryValues[0]);
          const categoryVisible = await page.locator('#manual-articles .article-card:visible').count();
          if (categoryVisible < 1 || categoryVisible >= initial.cards) issues.push('topic filter did not narrow the guide list (' + categoryVisible + ')');
          await page.locator('#manual-clear').click();
        }

        // Exercise actual locale navigation once, across every dedicated language URL.
        if (locale.code === 'en' && width === 390) {
          for (const targetLocale of locales.filter(item => item.code !== 'en')) {
            await page.locator('header.zombcash-shared-header .language-trigger').click();
            await page.locator('.language-option[data-lang="' + targetLocale.code + '"]').click();
            const expectedPath = '/' + targetLocale.path;
            await page.waitForURL(url => url.pathname === expectedPath, { timeout: 25000 });
            await page.waitForFunction(code => document.documentElement.lang === code, targetLocale.code, { timeout: 15000 });
            const switched = await page.evaluate(() => ({
              lang: document.documentElement.lang,
              cards: document.querySelectorAll('#manual-articles .article-card').length,
              nav: !!document.querySelector('header.zombcash-shared-header .language-trigger'),
            }));
            if (switched.lang !== targetLocale.code || switched.cards < 1 || !switched.nav) {
              issues.push('language switch failed for ' + targetLocale.code + ': ' + JSON.stringify(switched));
            }
          }
          await page.locator('header.zombcash-shared-header .language-trigger').click();
          await page.locator('.language-option[data-lang="en"]').click();
          await page.waitForURL(url => url.pathname === '/survivor-field-manual.html', { timeout: 25000 });
          await page.waitForFunction(() => document.documentElement.lang === 'en', { timeout: 15000 });

          // Every distinct English article-card destination must return HTTP 2xx/3xx.
          const destinations = await page.locator('#manual-articles .article-card h2 a, #manual-articles .article-card .article-link')
            .evaluateAll(links => Array.from(new Set(links.map(link => link.href))));
          const linkStatuses = [];
          for (const destination of destinations) {
            const response = await page.request.get(destination, { timeout: 20000 });
            linkStatuses.push({ url: destination, status: response.status() });
          }
          const broken = linkStatuses.filter(item => item.status < 200 || item.status >= 400);
          if (broken.length) issues.push('broken internal guide links: ' + JSON.stringify(broken));
          fs.writeFileSync(path.join(outDir, 'english-internal-links.json'), JSON.stringify(linkStatuses, null, 2));
        }

        // Language dropdown must open and expose all dedicated manual destinations.
        await page.locator('header.zombcash-shared-header .language-trigger').click();
        const languageOptions = await page.locator('header.zombcash-shared-header .language-menu .language-option').evaluateAll(bs => bs.map(b => b.dataset.lang || ''));
        if (!languageOptions.length) issues.push('language dropdown has no options');
        const required = locales.map(x => x.code);
        for (const code of required) if (!languageOptions.includes(code)) issues.push('language switcher missing locale: ' + code);

        if (errors.length) issues.push('browser JS errors: ' + errors.join(' | '));
        await page.screenshot({ path: path.join(outDir, locale.code.replace(/[^a-z0-9]/gi, '-') + '-' + width + '.png'), fullPage: true });
        const report = { locale: locale.code, width, initial, filtered, restored, languageOptions, issues, errors };
        fs.writeFileSync(path.join(outDir, locale.code.replace(/[^a-z0-9]/gi, '-') + '-' + width + '.json'), JSON.stringify(report, null, 2));
        summary.push(report);
        if (issues.length) failures.push({ locale: locale.code, width, issues });
        await page.close();
      }
    }
    console.log(JSON.stringify({ pages: locales.length, viewports: viewports.length, checks: summary.length, failures }, null, 2));
    if (failures.length) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();

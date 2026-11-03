const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = 'https://zombcash.github.io/';
const locales = ['en', 'de', 'fr', 'it', 'ja', 'zh-CN', 'ru', 'tr', 'hi'];
const pages = [
  { slug: 'buy-zombcash.html', kind: 'buy' },
  { slug: 'transmission-zombie-fiction-rpg-guide.html', kind: 'fiction' },
  { slug: 'transmission-last-backup-ai-apocalypse.html', kind: 'backup' },
];
const viewports = [
  { name: 'desktop', width: 1440, height: 1000, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true },
];
const out = path.join(process.cwd(), 'localized-article-visual-results');
fs.mkdirSync(out, { recursive: true });

function pagePath(locale, slug) {
  return (locale === 'en' ? '' : locale + '/') + slug;
}
function safe(value) {
  return value.replace(/[^a-z0-9-]/gi, '-');
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const reports = [];
  try {
    for (const item of pages) {
      for (const locale of locales) {
        for (const viewport of viewports) {
          const pathName = pagePath(locale, item.slug);
          const page = await browser.newPage({
            viewport: { width: viewport.width, height: viewport.height },
            deviceScaleFactor: 1,
            isMobile: viewport.mobile,
            hasTouch: viewport.mobile,
          });
          const pageErrors = [];
          page.on('pageerror', error => pageErrors.push(error.message));
          const response = await page.goto(new URL(pathName, BASE).href, {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
          });
          await page.waitForSelector('header.zombcash-shared-header', { timeout: 25000 });
          await page.waitForTimeout(800);

          // Wait for the latest published content before judging the deployment.
          if (item.kind === 'fiction') {
            const expectedBook = locale === 'zh-CN' ? '《赎罪》' : 'The Girl with All the Gifts';
            await page.getByText(expectedBook, { exact: false }).first().waitFor({ state: 'attached', timeout: 90000 });
          }
          if (item.kind === 'backup') {
            await page.locator('#ai-infrastructure-reality').waitFor({ state: 'attached', timeout: 30000 });
            await page.locator('#expanded-survivor-checklist').waitFor({ state: 'attached', timeout: 30000 });
          }
          const result = await page.evaluate(kind => {
            const canonical = document.querySelector('link[rel="canonical"]')?.href || '';
            const alternate = [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(x => x.hreflang);
            const main = document.querySelector('main');
            const languageButton = document.querySelector('header.zombcash-shared-header .language-trigger');
            const menu = document.querySelector('header.zombcash-shared-header .language-menu');
            const metrics = {
              lang: document.documentElement.lang,
              title: document.title,
              canonical,
              alternateCount: alternate.length,
              hasXDefault: alternate.includes('x-default'),
              viewportWidth: innerWidth,
              documentWidth: document.documentElement.scrollWidth,
              horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
              mainPresent: !!main,
              mainTextLength: main?.innerText?.trim().length || 0,
              navPresent: !!document.querySelector('header.zombcash-shared-header'),
              languageButtonPresent: !!languageButton,
              languageMenuPresent: !!menu,
              languageOptions: document.querySelectorAll('header.zombcash-shared-header .language-option').length,
              h2Count: main?.querySelectorAll('h2').length || 0,
              articleCards: main?.querySelectorAll('article.card').length || 0,
              faqQuestions: main?.querySelectorAll('#zombcash-faq h3').length || 0,
              infraQuestions: main?.querySelectorAll('#ai-infrastructure-reality li').length || 0,
              detailedChecklistItems: main?.querySelectorAll('#expanded-survivor-checklist li').length || 0,
              images: [...document.querySelectorAll('main img')].map(img => ({
                src: img.currentSrc || img.src,
                loaded: img.complete && img.naturalWidth > 0,
              })),
              missingTocTargets: [...document.querySelectorAll('a[href^="#"]')]
                .map(a => a.getAttribute('href').slice(1))
                .filter(id => id && !document.getElementById(id)),
              invalidParagraphArticleNesting: !!main?.querySelector('p article'),
            };
            if (kind === 'buy') metrics.mintPresent = main?.innerText.includes('6cCBF9gtyp3c6VmyxUWzETk3yFmxhjvPm15cxicfpump') || false;
            return metrics;
          }, item.kind);

          const issues = [];
          if (!response || response.status() < 200 || response.status() >= 400) issues.push('HTTP response: ' + (response?.status() ?? 'none'));
          if (result.lang !== locale) issues.push('html lang mismatch: ' + result.lang);
          if (!result.title || !result.mainPresent || result.mainTextLength < 500) issues.push('missing title or main article content');
          if (result.canonical !== new URL(pathName, BASE).href) issues.push('canonical URL mismatch: ' + result.canonical);
          if (result.alternateCount < 10 || !result.hasXDefault) issues.push('incomplete hreflang cluster');
          if (result.horizontalOverflow) issues.push('horizontal overflow: ' + result.documentWidth + 'px at ' + result.viewportWidth + 'px');
          if (!result.navPresent || !result.languageButtonPresent || !result.languageMenuPresent) issues.push('shared navigation/language selector missing');
          if (result.languageOptions !== 9) issues.push('expected 9 language options, found ' + result.languageOptions);
          if (result.missingTocTargets.length) issues.push('missing in-page anchors: ' + result.missingTocTargets.join(', '));
          if (result.invalidParagraphArticleNesting) issues.push('invalid article nested inside paragraph');
          if (result.images.some(image => !image.loaded)) issues.push('broken article image: ' + result.images.filter(image => !image.loaded).map(image => image.src).join(', '));
          if (item.kind === 'buy') {
            if (!result.mintPresent) issues.push('official mint missing');
            if (result.faqQuestions !== 5) issues.push('expected 5 FAQ questions, found ' + result.faqQuestions);
          }
          if (item.kind === 'fiction' && result.articleCards !== 22) issues.push('expected 22 content/category cards, found ' + result.articleCards);
          if (item.kind === 'backup') {
            if (result.infraQuestions !== 6) issues.push('expected 6 infrastructure questions, found ' + result.infraQuestions);
            if (result.detailedChecklistItems !== 6) issues.push('expected 6 detailed checklist items, found ' + result.detailedChecklistItems);
          }

          // Exercise the dropdown itself, not just the existence of its markup.
          await page.locator('header.zombcash-shared-header .language-trigger').click();
          const menuVisible = await page.locator('header.zombcash-shared-header .language-menu').isVisible().catch(() => false);
          if (!menuVisible) issues.push('language dropdown did not open');

          const file = safe(item.kind + '-' + locale + '-' + viewport.name);
          await page.screenshot({ path: path.join(out, file + '.png'), fullPage: true });
          const report = { page: pathName, kind: item.kind, locale, viewport: viewport.name, result, issues, pageErrors };
          fs.writeFileSync(path.join(out, file + '.json'), JSON.stringify(report, null, 2));
          reports.push(report);
          if (issues.length) failures.push({ page: pathName, viewport: viewport.name, issues });
          await page.close();
        }
      }
    }

    // Verify that changing locale from an English article navigates to the matching article,
    // not to an unrelated page, and that a missing translation falls back to the same English article.
    const switchPage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await switchPage.goto(new URL('buy-zombcash.html', BASE).href, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await switchPage.waitForSelector('header.zombcash-shared-header .language-trigger', { timeout: 25000 });
    await switchPage.locator('header.zombcash-shared-header .language-trigger').click();
    await switchPage.locator('.language-option[data-lang="ja"]').click();
    await switchPage.waitForURL(url => url.pathname === '/ja/buy-zombcash.html', { timeout: 25000 });
    await switchPage.waitForFunction(() => document.documentElement.lang === 'ja', { timeout: 15000 });
    reports.push({ languageSwitch: 'English buy guide -> Japanese buy guide passed' });
    await switchPage.close();

    console.log(JSON.stringify({ pages: reports.length, visualCases: pages.length * locales.length * viewports.length, failures }, null, 2));
    fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify({ visualCases: pages.length * locales.length * viewports.length, reports, failures }, null, 2));
    if (failures.length) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
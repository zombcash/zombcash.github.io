const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.env.SITE_URL || 'https://zombcash.github.io/';
const locales = ['en', 'de', 'fr', 'it', 'ja', 'zh-CN', 'ru', 'tr', 'hi'];
const pages = [
  { slug: 'buy-zombcash.html', kind: 'buy' },
  { slug: 'zombcash-market-data.html', kind: 'market-data' },
  { slug: 'whitepaper.html', kind: 'whitepaper' },
  { slug: 'transmission-liquidity-is-not-market-cap.html', kind: 'liquidity' },
  { slug: 'transmission-zombie-fiction-rpg-guide.html', kind: 'fiction' },
  { slug: 'transmission-last-backup-ai-apocalypse.html', kind: 'backup' },
  { slug: 'avoid-fake-token-websites-wallet-scams.html', kind: 'guide', availableLocales: ['en', 'de', 'fr', 'ja', 'ru'] },
  { slug: 'check-liquidity-holder-distribution-solana.html', kind: 'guide', availableLocales: ['en', 'de', 'fr', 'ja', 'ru'] },
  { slug: 'how-to-research-solana-meme-coins.html', kind: 'guide', availableLocales: ['en', 'de', 'fr', 'ja', 'ru'] },
  { slug: 'solana-token-safety-checklist.html', kind: 'guide', availableLocales: ['en', 'ja', 'ru'] },
];
const viewports = [
  { name: 'small-mobile', width: 320, height: 740, mobile: true },
  { name: 'mobile', width: 390, height: 844, mobile: true },
  { name: 'tablet', width: 768, height: 1024, mobile: false },
  { name: 'small-desktop', width: 1024, height: 768, mobile: false },
  { name: 'desktop', width: 1440, height: 1000, mobile: false },
];
const output = path.join(process.cwd(), 'localized-article-visual-results');
fs.mkdirSync(output, { recursive: true });

function pagePath(locale, slug) {
  return (locale === 'en' ? '' : locale + '/') + slug;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const reports = [];
  const contexts = {
    mobile: await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }),
    desktop: await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, isMobile: false }),
  };
  const pagesByContext = {
    mobile: await contexts.mobile.newPage(),
    desktop: await contexts.desktop.newPage(),
  };
  const pageErrorsByMode = { mobile: [], desktop: [] };
  pagesByContext.mobile.on('pageerror', error => pageErrorsByMode.mobile.push(error.message));
  pagesByContext.desktop.on('pageerror', error => pageErrorsByMode.desktop.push(error.message));
  try {
    for (const item of pages) {
      for (const locale of item.availableLocales || locales) {
        for (const viewport of viewports) {
          const mode = viewport.mobile ? 'mobile' : 'desktop';
          const page = pagesByContext[mode];
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          const pageErrors = pageErrorsByMode[mode];
          pageErrors.length = 0;
          const targetUrl = new URL(pagePath(locale, item.slug), BASE);
          // Isolate each locale case from the previous page's persisted language preference.
          targetUrl.searchParams.set('lang', locale);
          const response = await page.goto(targetUrl.href, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          });
          const issues = [];
          try {
            await page.waitForSelector('header.zombcash-shared-header .language-trigger', { timeout: 10000 });
          } catch (error) {
            issues.push('shared navigation did not initialize: ' + error.message);
          }
          if (!response || response.status() < 200 || response.status() >= 400) issues.push('HTTP response: ' + (response?.status() ?? 'none'));

          let result = null;
          if (!issues.length) {
            result = await page.evaluate(kind => {
              const main = document.querySelector('main');
              const alternates = [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(x => x.hreflang);
              const images = [...document.querySelectorAll('main img')].map(img => ({
                src: img.currentSrc || img.src,
                loaded: img.complete && img.naturalWidth > 0,
                sameOrigin: img.currentSrc ? new URL(img.currentSrc).origin === location.origin : false,
              }));
              const data = {
                lang: document.documentElement.lang,
                title: document.title,
                description: document.querySelector('meta[name="description"]')?.content || '',
                twitterTitle: document.querySelector('meta[name="twitter:title"]')?.content || '',
                twitterDescription: document.querySelector('meta[name="twitter:description"]')?.content || '',
                twitterImage: document.querySelector('meta[name="twitter:image"]')?.content || '',
                hasJapaneseText: /[\u3040-\u30ff\u3400-\u9fff]/.test(main?.innerText || ''),
                canonical: document.querySelector('link[rel="canonical"]')?.href || '',
                alternates,
                width: innerWidth,
                documentWidth: document.documentElement.scrollWidth,
                mainTextLength: main?.innerText?.trim().length || 0,
                languageOptions: document.querySelectorAll('header.zombcash-shared-header .language-option').length,
                images,
                missingTocTargets: [...document.querySelectorAll('a[href^="#"]')]
                  .map(a => a.getAttribute('href').slice(1))
                  .filter(id => id && !document.getElementById(id)),
                invalidParagraphArticleNesting: !!main?.querySelector('p article'),
                articleCards: main?.querySelectorAll('article.card').length || 0,
                faqQuestions: main?.querySelectorAll('#zombcash-faq h3').length || 0,
                infraQuestions: main?.querySelectorAll('#ai-infrastructure-reality li').length || 0,
                detailedChecklistItems: (() => {
                  const checklist = main?.querySelector('#expanded-survivor-checklist');
                  return checklist?.querySelectorAll('li').length || checklist?.querySelectorAll('article.card').length || 0;
                })(),
                mintPresent: main?.innerText.includes('6cCBF9gtyp3c6VmyxUWzETk3yFmxhjvPm15cxicfpump') || false,
              };
              return data;
            }, item.kind);

            const expected = new URL(pagePath(locale, item.slug), 'https://zombcash.github.io/').href;
            if (result.lang !== locale) issues.push('html lang mismatch: ' + result.lang);
            if (!result.title || result.mainTextLength < 500) issues.push('missing title or main article content');
            if (result.canonical !== expected) issues.push('canonical mismatch: ' + result.canonical);
            const expectedLocales = (item.availableLocales || locales).map(code => code === 'zh-CN' ? 'zh-Hans' : code);
            const missingAlternates = expectedLocales.filter(code => !result.alternates.includes(code));
            if (missingAlternates.length || !result.alternates.includes('x-default')) {
              issues.push('incomplete hreflang cluster; missing: ' + missingAlternates.join(', '));
            }
            if (result.documentWidth > viewport.width + 1) issues.push('horizontal overflow: ' + result.documentWidth + 'px at ' + viewport.width + 'px');
            if (result.languageOptions !== 9) issues.push('expected 9 language options, found ' + result.languageOptions);
            if (result.missingTocTargets.length) issues.push('missing in-page anchors: ' + result.missingTocTargets.join(', '));
            if (result.invalidParagraphArticleNesting) issues.push('invalid article nested inside paragraph');
            const brokenLocalImages = result.images.filter(img => img.sameOrigin && !img.loaded);
            if (brokenLocalImages.length) issues.push('broken local images: ' + brokenLocalImages.map(img => img.src).join(', '));
            if (item.kind === 'buy') {
              if (!result.mintPresent) issues.push('official mint missing');
              if (result.faqQuestions !== 5) issues.push('expected 5 FAQ questions, found ' + result.faqQuestions);
            }
            if (item.kind === 'fiction' && result.articleCards !== 22) issues.push('expected 22 content/category cards, found ' + result.articleCards);
            if (item.kind === 'backup') {
              if (result.infraQuestions !== 6) issues.push('expected 6 infrastructure questions, found ' + result.infraQuestions);
              if (result.detailedChecklistItems !== 6) issues.push('expected 6 detailed checklist items, found ' + result.detailedChecklistItems);
            }
            if (item.kind === 'guide') {
              if (!result.description) issues.push('missing SEO meta description');
              if (!result.twitterTitle || !result.twitterDescription || !result.twitterImage) issues.push('incomplete Twitter Card metadata');
              if (locale === 'ja' && !result.hasJapaneseText) issues.push('Japanese guide body text is missing Japanese characters');
            }
            await page.locator('header.zombcash-shared-header .language-trigger').click();
            const menuVisible = await page.locator('header.zombcash-shared-header .language-menu').isVisible().catch(() => false);
            if (!menuVisible) issues.push('language dropdown did not open');
          }
          const report = { page: pagePath(locale, item.slug), kind: item.kind, viewport: viewport.name, result, issues, pageErrors: [...pageErrors] };
          reports.push(report);
          if (issues.length || pageErrors.length) {
            if (pageErrors.length) issues.push('page errors: ' + pageErrors.join(' | '));
            failures.push(report);
            await page.screenshot({ path: path.join(output, 'failure-' + item.kind + '-' + locale + '-' + viewport.name + '.png'), fullPage: true }).catch(() => {});
          }
        }
      }
    }

    // Test actual language changes on two article types with a real dropdown click.
    const switchPage = pagesByContext.mobile;
    const routeSwitchTests = [
      { from: 'buy-zombcash.html', lang: 'ja', to: '/ja/buy-zombcash.html' },
      { from: 'transmission-liquidity-is-not-market-cap.html', lang: 'ru', to: '/ru/transmission-liquidity-is-not-market-cap.html' },
      { from: 'avoid-fake-token-websites-wallet-scams.html', lang: 'ja', to: '/ja/avoid-fake-token-websites-wallet-scams.html' },
      { from: 'check-liquidity-holder-distribution-solana.html', lang: 'ja', to: '/ja/check-liquidity-holder-distribution-solana.html' },
      { from: 'how-to-research-solana-meme-coins.html', lang: 'ja', to: '/ja/how-to-research-solana-meme-coins.html' },
      { from: 'solana-token-safety-checklist.html', lang: 'ja', to: '/ja/solana-token-safety-checklist.html' },
      { from: '/ja/avoid-fake-token-websites-wallet-scams.html', lang: 'en', to: '/avoid-fake-token-websites-wallet-scams.html' },
      { from: '/ja/check-liquidity-holder-distribution-solana.html', lang: 'en', to: '/check-liquidity-holder-distribution-solana.html' },
      { from: '/ja/how-to-research-solana-meme-coins.html', lang: 'en', to: '/how-to-research-solana-meme-coins.html' },
      { from: '/ja/solana-token-safety-checklist.html', lang: 'en', to: '/solana-token-safety-checklist.html' },
    ];
    for (const test of routeSwitchTests) {
      await switchPage.goto(new URL(test.from, BASE).href, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await switchPage.waitForSelector('header.zombcash-shared-header .language-trigger', { timeout: 10000 });
      await switchPage.locator('header.zombcash-shared-header .language-trigger').click();
      await switchPage.locator('.language-option[data-lang="' + test.lang + '"]').click();
      await switchPage.waitForURL(url => url.pathname === test.to, { timeout: 10000 });
      await switchPage.waitForFunction(expected => document.documentElement.lang === expected, test.lang, { timeout: 10000 });
      reports.push({ languageSwitch: test.from + ' -> ' + test.to + ' passed' });
    }

    // Verify localized header and crawlable footer routes for Gallery, Whitepaper and Market Data.
    for (const locale of locales.filter(code => code !== 'en')) {
      const page = pagesByContext.desktop;
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(new URL(locale + '/index.html', BASE).href, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('header.zombcash-shared-header', { timeout: 10000 });
      for (const destination of ['gallery.html', 'whitepaper.html', 'zombcash-market-data.html']) {
        const expectedPath = '/' + locale + '/' + destination;
        const headerLink = await page.locator('header.zombcash-shared-header a[href]').evaluateAll((anchors, file) => {
          const match = anchors.find(anchor => new URL(anchor.href).pathname.endsWith('/' + file));
          return match ? new URL(match.href).pathname : null;
        }, destination);
        const footerLink = await page.locator('#site-footer a[href]').evaluateAll((anchors, file) => {
          const match = anchors.find(anchor => new URL(anchor.href).pathname.endsWith('/' + file));
          return match ? new URL(match.href).pathname : null;
        }, destination);
        if (headerLink !== expectedPath || footerLink !== expectedPath) {
          failures.push({ page: locale + '/index.html', viewport: 'desktop', issues: [
            destination + ' header/footer mismatch: ' + headerLink + ' / ' + footerLink + ', expected ' + expectedPath,
          ] });
        }
      }
      reports.push({ localizedNavigation: locale + ' Gallery, Whitepaper and Market Data header/footer routes checked' });
    }

    const summary = {
      visualCases: pages.reduce((total, item) => total + (item.availableLocales || locales).length * viewports.length, 0),
      routeSwitches: routeSwitchTests.length,
      localizedHomepagesChecked: 8,
      failures,
      reportCount: reports.length,
    };
    fs.writeFileSync(path.join(output, 'summary.json'), JSON.stringify({ ...summary, reports }, null, 2));
    console.log(JSON.stringify(summary, null, 2));
    if (failures.length) process.exitCode = 1;
  } finally {
    await Promise.all(Object.values(contexts).map(context => context.close()));
    await browser.close();
  }
})();

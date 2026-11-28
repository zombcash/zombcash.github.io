const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.env.SITE_URL || 'https://zombcash.github.io/';
const locales = ['en', 'de', 'fr', 'it', 'ja', 'zh-CN', 'ru', 'tr', 'hi'];
const pages = [
  { slug: 'buy-zombcash.html', kind: 'buy' },
  { slug: 'zombcash-buying-guide.html', kind: 'guide' },
  { slug: 'solana-memecoin-research-guide.html', kind: 'guide' },
  { slug: 'transmission-solana-memecoin-warning-signs.html', kind: 'guide' },
  { slug: 'transmission-wallet-security-red-flags.html', kind: 'guide' },
  { slug: 'how-to-research-solana-meme-coins.html', kind: 'guide' },
  { slug: 'solana-token-safety-checklist.html', kind: 'guide' },
  { slug: 'check-liquidity-holder-distribution-solana.html', kind: 'guide' },
  { slug: 'avoid-fake-token-websites-wallet-scams.html', kind: 'guide' },
  { slug: 'transmission-liquidity-is-not-market-cap.html', kind: 'liquidity' },
  { slug: 'zombcash-market-data.html', kind: 'market-data' },
  { slug: 'whitepaper.html', kind: 'whitepaper' },
  { slug: 'transmission-zombie-fiction-rpg-guide.html', kind: 'fiction' },
  { slug: 'transmission-last-backup-ai-apocalypse.html', kind: 'backup' },
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
        const selectedViewports = item.kind === 'guide' ? viewports.filter(v => ['small-mobile', 'mobile', 'desktop'].includes(v.name)) : viewports;
        for (const viewport of selectedViewports) {
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

    // Verify all nine localized Field Manual landing pages: poster uniqueness,
    // translated card actions, card order, structured data and responsive layout.
    const expectedGuideSlugs = [
      'solana-memecoin-research-guide.html',
      'transmission-solana-memecoin-warning-signs.html',
      'transmission-wallet-security-red-flags.html',
      'buy-zombcash.html',
      'zombcash-buying-guide.html',
      'how-to-research-solana-meme-coins.html',
      'solana-token-safety-checklist.html',
      'check-liquidity-holder-distribution-solana.html',
      'avoid-fake-token-websites-wallet-scams.html',
      'transmission-liquidity-is-not-market-cap.html',
    ];
    const manualViewports = [
      { name: 'mobile', width: 390, height: 844, mobile: true },
      { name: 'desktop', width: 1440, height: 1000, mobile: false },
    ];
    for (const locale of locales) {
      for (const viewport of manualViewports) {
        const mode = viewport.mobile ? 'mobile' : 'desktop';
        const page = pagesByContext[mode];
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(new URL(pagePath(locale, 'survivor-field-manual.html'), BASE).href, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await page.waitForSelector('header.zombcash-shared-header .language-trigger', { timeout: 10000 });
        const result = await page.evaluate(async expected => {
          const cards = [...document.querySelectorAll('article.article-card')];
          const firstTen = cards.slice(0, 10);
          const images = firstTen.map(card => card.querySelector('img'));
          images.forEach(img => { if (img) img.loading = 'eager'; });
          await Promise.all(images.map(img => img ? img.decode().catch(() => null) : Promise.resolve()));
          const schema = [...document.querySelectorAll('script[type="application/ld+json"]')]
            .map(node => { try { return JSON.parse(node.textContent); } catch { return null; } })
            .find(item => item?.['@type'] === 'CollectionPage');
          const itemList = schema?.mainEntity?.itemListElement || [];
          const paths = firstTen.map(card => {
            const link = card.querySelector('h2 a, h3 a, a.article-link');
            return link ? new URL(link.href).pathname.split('/').pop() : '';
          });
          const allImages = images.filter(Boolean);
          return {
            cardCount: cards.length,
            firstTenPaths: paths,
            uniquePosters: new Set(allImages.map(img => new URL(img.src).pathname)).size,
            missingAlt: allImages.filter(img => !img.alt.trim()).length,
            brokenImages: allImages.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src),
            schemaCount: schema?.mainEntity?.numberOfItems ?? null,
            schemaItems: itemList.length,
            schemaOrder: itemList.slice(0, 10).map(item => item.url.split('/').pop()),
            width: innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            englishMarkers: firstTen.filter(card => /original in english|read guide in english|article in english|en anglais|auf englisch|in inglese|на английском|İngilizce|अंग्रेज़ी|英文|英語/i.test(card.innerText)).length,
          };
        }, expectedGuideSlugs);
        const issues = [];
        if (result.cardCount < 13) issues.push('expected at least 13 Field Manual cards, found ' + result.cardCount);
        if (result.firstTenPaths.join('|') !== expectedGuideSlugs.join('|')) issues.push('first ten card order or links do not match the canonical order');
        if (result.uniquePosters !== 10) issues.push('expected 10 distinct posters, found ' + result.uniquePosters);
        if (result.missingAlt) issues.push('missing ALT on ' + result.missingAlt + ' card posters');
        if (result.brokenImages.length) issues.push('broken poster images: ' + result.brokenImages.join(', '));
        if (result.schemaCount !== result.cardCount || result.schemaItems !== result.cardCount) issues.push('CollectionPage schema count does not match the ' + result.cardCount + ' visible Field Manual cards');
        if (result.schemaOrder.join('|') !== expectedGuideSlugs.join('|')) issues.push('structured-data order does not match visible card order');
        if (result.documentWidth > viewport.width + 1) issues.push('Field Manual horizontal overflow: ' + result.documentWidth + 'px');
        if (locale !== 'en' && result.englishMarkers) issues.push('English-only labels remain on ' + result.englishMarkers + ' of the first ten cards');
        const report = { page: pagePath(locale, 'survivor-field-manual.html'), viewport: viewport.name, result, issues };
        reports.push(report);
        if (issues.length) {
          failures.push(report);
          await page.screenshot({ path: path.join(output, 'failure-field-manual-' + locale + '-' + viewport.name + '.png'), fullPage: true }).catch(() => {});
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

    // Verify the homepage Project Overview block in all nine languages and
    // both desktop/mobile layouts, including its localized routes and shared CSS.
    const homepageOverviewViewports = [
      { name: 'desktop', width: 1440, height: 1000 },
      { name: 'mobile', width: 390, height: 844 },
    ];
    const homepageOverviewCases = [];
    for (const locale of locales) {
      for (const viewport of homepageOverviewViewports) {
        const page = pagesByContext[viewport.name];
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(new URL(pagePath(locale, 'index.html'), BASE).href, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await page.waitForSelector('.zc-seo-intro', { timeout: 10000 });
        const result = await page.locator('.zc-seo-intro').evaluate(section => {
          const style = getComputedStyle(section);
          const links = [...section.querySelectorAll('.zc-seo-intro-links a')].map(a => ({
            href: new URL(a.href).pathname,
            text: a.innerText.trim(),
          }));
          return {
            count: document.querySelectorAll('.zc-seo-intro').length,
            heading: section.querySelector('h2')?.innerText.trim() || '',
            paragraphs: section.querySelectorAll('p').length,
            mintPresent: section.innerText.includes('6cCBF9gtyp3c6VmyxUWzETk3yFmxhjvPm15cxicfpump'),
            disclaimerPresent: !!section.querySelector('small')?.innerText.trim(),
            borderLeftWidth: style.borderLeftWidth,
            borderLeftColor: style.borderLeftColor,
            backgroundImage: style.backgroundImage,
            width: section.getBoundingClientRect().width,
            documentWidth: document.documentElement.scrollWidth,
            viewportWidth: innerWidth,
            links,
          };
        });
        const prefix = locale === 'en' ? '/' : '/' + locale + '/';
        const expectedLinks = [
          prefix + 'whitepaper.html',
          prefix + 'buy-zombcash.html',
          prefix + 'survivor-field-manual.html',
        ];
        const issues = [];
        if (result.count !== 1) issues.push('expected exactly one Project Overview block, found ' + result.count);
        if (!result.heading) issues.push('missing localized heading');
        if (result.paragraphs !== 2) issues.push('expected two overview paragraphs, found ' + result.paragraphs);
        if (!result.mintPresent) issues.push('official mint address missing');
        if (!result.disclaimerPresent) issues.push('risk disclaimer missing');
        if (result.borderLeftWidth !== '3px') issues.push('overview CSS not applied: left accent width is ' + result.borderLeftWidth);
        if (!result.backgroundImage || result.backgroundImage === 'none') issues.push('overview background styling missing');
        if (result.links.map(link => link.href).join('|') !== expectedLinks.join('|')) issues.push('localized CTA destinations mismatch');
        if (result.documentWidth > viewport.width + 1) issues.push('homepage horizontal overflow: ' + result.documentWidth + 'px');
        const report = { page: pagePath(locale, 'index.html'), viewport: viewport.name, result, issues };
        homepageOverviewCases.push(report);
        reports.push({ homepageOverview: report });
        if (issues.length) {
          failures.push(report);
          await page.screenshot({ path: path.join(output, 'failure-homepage-overview-' + locale + '-' + viewport.name + '.png'), fullPage: true }).catch(() => {});
        } else {
          await page.locator('.zc-seo-intro').screenshot({ path: path.join(output, 'homepage-overview-' + locale + '-' + viewport.name + '.png') }).catch(() => {});
        }
      }
    }

    const summary = {
      visualCases: pages.reduce((total, item) => total + (item.availableLocales || locales).length * (item.kind === 'guide' ? 3 : viewports.length), 0),
      fieldManualCases: locales.length * manualViewports.length,
      routeSwitches: routeSwitchTests.length,
      localizedHomepagesChecked: 8,
      homepageOverviewCases: homepageOverviewCases.length,
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

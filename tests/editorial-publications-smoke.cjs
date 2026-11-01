const { chromium } = require('playwright');

const BASE_URL = process.env.SITE_URL || 'https://zombcash.github.io/';
const slug = 'transmission-liquidity-is-not-market-cap.html';
const locales = [
  { code: 'en', path: slug },
  { code: 'de', path: 'de/' + slug },
  { code: 'fr', path: 'fr/' + slug },
  { code: 'it', path: 'it/' + slug },
  { code: 'ja', path: 'ja/' + slug },
  { code: 'zh-CN', path: 'zh-CN/' + slug },
  { code: 'ru', path: 'ru/' + slug },
  { code: 'tr', path: 'tr/' + slug },
  { code: 'hi', path: 'hi/' + slug },
];
const widths = [1440, 768, 390, 320];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const summary = [];
  try {
    for (const locale of locales) {
      for (const width of widths) {
        const page = await browser.newPage({
          viewport: { width, height: width < 600 ? 844 : 960 },
          deviceScaleFactor: 1,
          isMobile: width < 600,
          hasTouch: width < 600,
        });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));

        try {
          await page.goto(new URL(locale.path, BASE_URL).href, {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
          });
          await page.waitForSelector('main h1', { timeout: 20000 });
          await page.waitForSelector('header.zombcash-shared-header', { timeout: 20000 }).catch(() => {});
          await page.waitForTimeout(350);

          const result = await page.evaluate(async () => {
            const images = [...document.querySelectorAll('main img')];
            await Promise.all(images.map(img => new Promise(resolve => {
              if (img.complete) return resolve();
              img.addEventListener('load', resolve, { once: true });
              img.addEventListener('error', resolve, { once: true });
              setTimeout(resolve, 8000);
            })));
            const canonical = document.querySelector('link[rel="canonical"]')?.href || '';
            const jsonText = document.querySelector('script[type="application/ld+json"]')?.textContent || '';
            let structuredData = null;
            try { structuredData = JSON.parse(jsonText); } catch {}
            return {
              lang: document.documentElement.lang,
              viewport: innerWidth,
              documentWidth: document.documentElement.scrollWidth,
              title: document.title,
              h1: document.querySelector('main h1')?.innerText?.trim() || '',
              canonical,
              description: !!document.querySelector('meta[name="description"]')?.content,
              ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
              twitterTitle: document.querySelector('meta[name="twitter:title"]')?.content || '',
              hreflangCount: document.querySelectorAll('link[rel="alternate"][hreflang]').length,
              structuredData,
              brokenImages: images.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.currentSrc || img.src),
              infographic: !!document.querySelector('img[src*="liquidity-vs-market-cap.svg"]'),
              languageSelector: !!document.querySelector('header.zombcash-shared-header .language-trigger'),
            };
          });

          const issues = [];
          if (result.lang !== locale.code) issues.push('html lang mismatch: ' + result.lang);
          if (!result.title || !result.h1) issues.push('title or H1 is missing');
          if (result.documentWidth > width + 1) issues.push('horizontal overflow: ' + result.documentWidth + 'px');
          if (!result.canonical.endsWith('/' + locale.path)) issues.push('canonical does not point to this locale');
          if (!result.description || !result.ogTitle || !result.twitterTitle) issues.push('SEO description or social title missing');
          if (result.hreflangCount !== 10) issues.push('expected 10 hreflang links, found ' + result.hreflangCount);
          if (!result.structuredData || result.structuredData['@type'] !== 'Article' || result.structuredData.inLanguage !== locale.code) issues.push('Article JSON-LD missing, invalid or in wrong language');
          if (result.brokenImages.length) issues.push('broken images: ' + result.brokenImages.join(', '));
          if (!result.infographic) issues.push('liquidity infographic is missing');
          if (!result.languageSelector) issues.push('shared language selector is missing');
          if (errors.length) issues.push('page errors: ' + errors.join(' | '));

          summary.push({ locale: locale.code, width, issues });
          if (issues.length) failures.push(locale.code + ' @ ' + width + 'px: ' + issues.join('; '));
        } catch (error) {
          failures.push(locale.code + ' @ ' + width + 'px: ' + error.message);
        } finally {
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify({ tested: summary.length, failures, summary }, null, 2));
  if (failures.length) process.exitCode = 1;
})();

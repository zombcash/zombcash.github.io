const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.env.SITE_URL || 'https://zombcash.github.io/';
const locales = [
  { code: 'en', path: 'whitepaper.html', htmlLang: 'en' },
  { code: 'de', path: 'de/whitepaper.html', htmlLang: 'de' },
  { code: 'fr', path: 'fr/whitepaper.html', htmlLang: 'fr' },
  { code: 'it', path: 'it/whitepaper.html', htmlLang: 'it' },
  { code: 'ja', path: 'ja/whitepaper.html', htmlLang: 'ja' },
  { code: 'zh-CN', path: 'zh-CN/whitepaper.html', htmlLang: 'zh-CN' },
  { code: 'ru', path: 'ru/whitepaper.html', htmlLang: 'ru' },
  { code: 'tr', path: 'tr/whitepaper.html', htmlLang: 'tr' },
  { code: 'hi', path: 'hi/whitepaper.html', htmlLang: 'hi' },
];
const viewports = [
  { name: 'desktop', width: 1365, height: 900, isMobile: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true },
];
const outDir = path.join(process.cwd(), 'whitepaper-localization-results');
fs.mkdirSync(outDir, { recursive: true });
const failures = [];
const results = [];
const urlFor = relative => new URL(relative, BASE).href;

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const locale of locales) {
      for (const viewport of viewports) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: 1,
          isMobile: viewport.isMobile,
          hasTouch: viewport.isMobile,
        });
        const page = await context.newPage();
        const pageErrors = [];
        page.on('pageerror', error => pageErrors.push(error.message));
        const url = urlFor(locale.path);
        const issues = [];
        try {
          const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
          if (!response || response.status() !== 200) issues.push('page did not return HTTP 200');
          await page.waitForSelector('header.zombcash-shared-header', { timeout: 20000 });
          await page.waitForSelector('.language-switcher .language-trigger', { state: 'visible', timeout: 20000 });
          await page.waitForSelector('.zc-whitepaper-intro', { state: 'visible', timeout: 20000 });

          const state = await page.evaluate(() => {
            const intro = document.querySelector('.zc-whitepaper-intro');
            const header = document.querySelector('header.zombcash-shared-header');
            const language = document.querySelector('.language-switcher');
            const canonical = document.querySelectorAll('link[rel~="canonical"]');
            const alternates = [...document.querySelectorAll('link[rel~="alternate"][hreflang][href]')];
            const rect = element => {
              const r = element.getBoundingClientRect();
              return { x: Math.round(r.x), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) };
            };
            return {
              lang: document.documentElement.lang,
              title: document.title,
              h1: document.querySelector('main h1')?.textContent?.trim() || '',
              introText: intro?.innerText?.trim() || '',
              intro: intro ? rect(intro) : null,
              header: header ? rect(header) : null,
              language: language ? rect(language) : null,
              languageInsideHeader: !!header && header.contains(language),
              languageOptions: [...document.querySelectorAll('.language-option')].map(option => option.dataset.lang),
              documentWidth: document.documentElement.scrollWidth,
              viewportWidth: window.innerWidth,
              canonicalCount: canonical.length,
              canonical: canonical[0]?.href || null,
              alternateCount: alternates.length,
              hasEnglishAlternate: alternates.some(item => item.hreflang === 'en'),
              hasXDefault: alternates.some(item => item.hreflang === 'x-default'),
              hasWhitepaperIntroHeading: !!intro?.querySelector('h2'),
              links: [...(intro?.querySelectorAll('a') || [])].map(a => a.getAttribute('href')),
            };
          });

          if (state.lang !== locale.htmlLang) issues.push(`html lang is ${state.lang}, expected ${locale.htmlLang}`);
          if (!state.h1) issues.push('main heading is missing');
          if (!state.hasWhitepaperIntroHeading || state.introText.length < 120) issues.push('localized introduction is missing or unexpectedly short');
          if (state.documentWidth > viewport.width + 1) issues.push(`horizontal overflow: ${state.documentWidth}px > ${viewport.width}px`);
          if (!state.languageInsideHeader) issues.push('language switcher is not mounted inside the shared header');
          if (state.languageOptions.length !== 9) issues.push(`expected 9 language choices, found ${state.languageOptions.length}`);
          const expectedCanonical = 'https://zombcash.github.io/' + locale.path;
          if (state.canonicalCount !== 1 || state.canonical !== expectedCanonical) issues.push('canonical URL is missing, duplicated, or incorrect');
          if (state.alternateCount !== 10 || !state.hasEnglishAlternate || !state.hasXDefault) issues.push('expected 10 hreflang alternates including en and x-default');
          if (state.links.length < 2 || state.links.some(href => !href || !href.endsWith('.html'))) issues.push('intro navigation links are missing or malformed');

          await page.locator('.language-trigger').click();
          if (!await page.locator('.language-menu:not([hidden])').isVisible().catch(() => false)) issues.push('language dropdown did not open');
          for (const option of ['en', 'de', 'fr', 'it', 'ja', 'zh-CN', 'ru', 'tr', 'hi']) {
            if (await page.locator('.language-option[data-lang="' + option + '"]').count() !== 1) {
              issues.push('language option missing or duplicated: ' + option);
            }
          }
          await page.screenshot({
            path: path.join(outDir, `${locale.code}-${viewport.name}.png`),
            fullPage: false,
          });
          if (pageErrors.length) issues.push('browser JavaScript errors: ' + pageErrors.join(' | '));
          const result = { locale: locale.code, viewport: viewport.name, url, state, issues, pageErrors };
          results.push(result);
          fs.writeFileSync(path.join(outDir, `${locale.code}-${viewport.name}.json`), JSON.stringify(result, null, 2));
          if (issues.length) failures.push(result);
          console.log((issues.length ? 'FAIL' : 'PASS') + ': ' + locale.code + ' / ' + viewport.name);
        } catch (error) {
          const result = { locale: locale.code, viewport: viewport.name, url, issues: [error.message], pageErrors };
          results.push(result);
          failures.push(result);
          console.error('FAIL: ' + locale.code + ' / ' + viewport.name + ': ' + error.message);
        } finally {
          await context.close();
        }
      }
    }

    const transitionContext = await browser.newContext({ viewport: { width: 1365, height: 900 } });
    const page = await transitionContext.newPage();
    const transitionErrors = [];
    page.on('pageerror', error => transitionErrors.push(error.message));
    let transitionCount = 0;
    try {
      await page.goto(urlFor('whitepaper.html'), { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForSelector('.language-trigger', { timeout: 20000 });
      const choose = async code => {
        await page.locator('.language-trigger').click();
        await page.locator('.language-menu:not([hidden])').waitFor({ state: 'visible', timeout: 5000 });
        await page.locator('.language-option[data-lang="' + code + '"]').click();
        const expectedPath = code === 'en' ? '/whitepaper.html' : '/' + code + '/whitepaper.html';
        await page.waitForURL(url => url.pathname === expectedPath, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForFunction(expected => document.documentElement.lang === expected, code, { timeout: 15000 });
        await page.waitForSelector('.language-trigger', { state: 'visible', timeout: 15000 });
        transitionCount++;
        console.log('PASS: Whitepaper language transition ' + transitionCount + ' -> ' + code);
      };
      for (const locale of locales.slice(1)) {
        await choose(locale.code);
        await choose('en');
      }
      if (transitionErrors.length) failures.push({ locale: 'transitions', viewport: 'desktop', issues: ['browser JavaScript errors: ' + transitionErrors.join(' | ')] });
    } catch (error) {
      failures.push({ locale: 'transitions', viewport: 'desktop', issues: [error.message], transitionCount });
    } finally {
      await transitionContext.close();
    }

    const summary = {
      visualChecks: results.length,
      visualPassed: results.filter(result => !result.issues.length).length,
      transitionsExpected: 16,
      transitionsCompleted: transitionCount,
      failures: failures.length,
      details: failures,
    };
    fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary, null, 2));
    if (results.length !== 18 || transitionCount !== 16 || failures.length) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();

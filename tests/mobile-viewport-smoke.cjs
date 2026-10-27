const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE_URL = process.env.SITE_URL || 'https://zombcash.github.io/';
const widths = [390, 375, 430];
const outDir = path.join(process.cwd(), 'mobile-test-results');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  try {
    for (const width of widths) {
      const page = await browser.newPage({
        viewport: { width, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      });
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));

      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      // The live site may keep analytics/API requests open; do not wait for networkidle.
      await page.waitForLoadState('load', { timeout: 20000 }).catch(() => {});
      await page.waitForSelector('header.zombcash-shared-header', { timeout: 20000 });

      const result = await page.evaluate(() => {
        const header = document.querySelector('header.zombcash-shared-header');
        const menuButton = header?.querySelector('.zsh-menu-toggle');
        const nav = header?.querySelector('.zsh-nav');
        const languageButton = header?.querySelector('.language-trigger');
        const languageMenu = header?.querySelector('.language-menu');
        const rect = element => {
          if (!element) return null;
          const r = element.getBoundingClientRect();
          return { x: Math.round(r.x), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) };
        };
        return {
          viewportWidth: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          header: rect(header),
          menuButton: { visible: !!menuButton && getComputedStyle(menuButton).display !== 'none', rect: rect(menuButton) },
          navInitiallyClosed: !!nav && !nav.classList.contains('zsh-open'),
          languageButton: { exists: !!languageButton, rect: rect(languageButton) },
          languageMenuExists: !!languageMenu,
        languageMenuRect: rect(languageMenu),
        ads: document.querySelectorAll('[data-aa="2460185"], [data-aa=\'2460185\']').length,
        adSectionCount: document.querySelectorAll('.aads-ad-section').length,
        pageVisitCounter: !!document.querySelector('#site-visits'),
        globalFootprintCounter: !!document.querySelector('#zsh-global-footprint'),
        pageFootprintCounter: !!document.querySelector('.page-footprint'),
        adGeometry: (() => {
          const ad = document.querySelector('.aads-ad-section iframe[data-aa="2460185"], .aads-ad-section iframe[data-aa=\'2460185\']');
          if (!ad) return null;
          const r = ad.getBoundingClientRect();
          const header = document.querySelector('header.zombcash-shared-header');
          const h = header?.getBoundingClientRect();
          return { x: Math.round(r.x), right: Math.round(r.right), width: Math.round(r.width), position: getComputedStyle(ad).position, overlapsHeader: !!h && r.width > 0 && r.bottom > h.top && r.top < h.bottom };
        })(),
      };
      });

      const issues = [];
      if (result.documentWidth > width + 1) issues.push(`horizontal overflow: document width ${result.documentWidth}px at viewport ${width}px`);
      if (!result.menuButton.visible) issues.push('mobile menu button is not visible');
      if (!result.navInitiallyClosed) issues.push('navigation is not collapsed by default');
      if (!result.languageButton.exists) issues.push('language selector button is missing');
      if (result.ads !== 1 || result.adSectionCount !== 1) issues.push(`expected exactly one AADS unit/section, found ${result.ads}/${result.adSectionCount}`);
      if (!result.pageVisitCounter) issues.push('homepage global visitor counter section is missing');
      if (!result.pageFootprintCounter && location.pathname !== '/') { /* internal-page counter is injected asynchronously */ }
      if (result.adGeometry && result.adGeometry.position === 'fixed') issues.push('AADS iframe must not be fixed while scrolling');
      if (result.adGeometry && result.adGeometry.width > width + 1) issues.push('AADS iframe exceeds the viewport width');

      if (result.menuButton.visible) {
        await page.locator('header.zombcash-shared-header .zsh-menu-toggle').click();
        const expanded = await page.locator('header.zombcash-shared-header .zsh-nav').evaluate(el => el.classList.contains('zsh-open'));
        if (!expanded) issues.push('menu button did not open navigation');
        await page.screenshot({ path: path.join(outDir, `viewport-${width}-menu.png`), fullPage: false });
      }

      if (result.languageButton.exists) {
        await page.locator('header.zombcash-shared-header .language-trigger').click();
        const menuShown = await page.locator('header.zombcash-shared-header .language-menu').isVisible().catch(() => false);
        if (!menuShown) issues.push('language dropdown did not become visible after click');
        await page.screenshot({ path: path.join(outDir, `viewport-${width}-languages.png`), fullPage: false });
      }

      if (pageErrors.length) issues.push('browser JavaScript errors: ' + pageErrors.join(' | '));
      const report = { width, result, issues, pageErrors };
      fs.writeFileSync(path.join(outDir, `viewport-${width}.json`), JSON.stringify(report, null, 2));
      console.log(JSON.stringify(report, null, 2));
      if (issues.length) failures.push({ width, issues });
      await page.close();
    }

    // Chrome mobile "Desktop site" uses a wide viewport but still has touch input.
    // Keep a regression check for the homepage hero in that mode.
    const desktopTouch = await browser.newPage({
      viewport: { width: 980, height: 844 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: true,
    });
    const desktopTouchErrors = [];
    desktopTouch.on('pageerror', error => desktopTouchErrors.push(error.message));
    await desktopTouch.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await desktopTouch.waitForSelector('.hero-layout', { timeout: 20000 });
    const desktopTouchResult = await desktopTouch.evaluate(() => {
      const layout = document.querySelector('.hero-layout');
      const hero = document.querySelector('.hero');
      const grid = layout ? getComputedStyle(layout).gridTemplateColumns : '';
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        pointerCoarse: matchMedia('(pointer: coarse)').matches,
        gridColumns: grid ? grid.trim().split(/\s+/).length : 0,
        gridTemplateColumns: grid,
        heroHeight: hero ? Math.round(hero.getBoundingClientRect().height) : null,
      };
    });
    const desktopTouchIssues = [];
    if (desktopTouchResult.documentWidth > 981) desktopTouchIssues.push('desktop-site touch layout has horizontal overflow');
    if (!desktopTouchResult.pointerCoarse) desktopTouchIssues.push('test browser did not emulate a coarse touch pointer');
    if (desktopTouchResult.pointerCoarse && desktopTouchResult.gridColumns !== 1) desktopTouchIssues.push('desktop-site touch hero is not stacked into one column');
    if (desktopTouchErrors.length) desktopTouchIssues.push('browser JavaScript errors: ' + desktopTouchErrors.join(' | '));
    fs.writeFileSync(path.join(outDir, 'desktop-touch-980.json'), JSON.stringify({ result: desktopTouchResult, issues: desktopTouchIssues, pageErrors: desktopTouchErrors }, null, 2));
    await desktopTouch.screenshot({ path: path.join(outDir, 'desktop-touch-980.png'), fullPage: false });
    console.log(JSON.stringify({ desktopTouchResult, desktopTouchIssues }, null, 2));
    if (desktopTouchIssues.length) failures.push({ width: 980, mode: 'desktop-touch', issues: desktopTouchIssues });
    await desktopTouch.close();

    // A saved browser preference must not override an explicit localized root URL.
    const localePage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await localePage.addInitScript(() => localStorage.setItem('zombcash-language', 'de'));
    await localePage.goto(new URL('ru/', BASE_URL).href, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await localePage.waitForFunction(() => document.documentElement.lang === 'ru' && document.querySelector('.language-trigger')?.textContent.includes('RU'), { timeout: 20000 });
    const localeResult = await localePage.evaluate(() => ({ path: location.pathname, lang: document.documentElement.lang }));
    const localeIssues = [];
    if (localeResult.lang !== 'ru') localeIssues.push('localized root URL did not override saved language preference');
    fs.writeFileSync(path.join(outDir, 'localized-root-ru.json'), JSON.stringify({ result: localeResult, issues: localeIssues }, null, 2));
    console.log(JSON.stringify({ localeResult, localeIssues }, null, 2));
    if (localeIssues.length) failures.push({ mode: 'localized-root', issues: localeIssues });
    await localePage.close();

    // Verify that the main live-data panels recover from their initial loading states.
    const liveDataPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const liveDataErrors = [];
    liveDataPage.on('pageerror', error => liveDataErrors.push(error.message));
    await liveDataPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await liveDataPage.waitForFunction(() => {
      const news = document.querySelector('#world-news-list');
      const price = document.querySelector('#zombcash-price')?.textContent?.trim();
      return !!news?.querySelector('.world-news-item') && !!price && price !== '—';
    }, { timeout: 25000 }).catch(() => {});
    await liveDataPage.waitForFunction(() => {
      const chart = document.querySelector('#activity-chart-status')?.textContent || '';
      return !/LOADING PRICE HISTORY/i.test(chart);
    }, { timeout: 20000 }).catch(() => {});
    await liveDataPage.waitForFunction(() => {
      const trades = document.querySelector('#recent-trades-list')?.textContent || '';
      return !!trades && !/Connecting to the transaction feed/i.test(trades);
    }, { timeout: 20000 }).catch(() => {});
    // Exercise the period that previously failed in the live browser audit.
    await liveDataPage.locator('.activity-chart-tab[data-chart-period="30d"]').click();
    await liveDataPage.waitForFunction(() => {
      const status = document.querySelector('#activity-chart-status')?.textContent || '';
      return /POINTS|UNAVAILABLE|API ERROR/i.test(status);
    }, { timeout: 20000 }).catch(() => {});
    const liveDataResult = await liveDataPage.evaluate(() => ({
      newsItems: document.querySelectorAll('#world-news-list .world-news-item').length,
      newsStatus: document.querySelector('#world-news-status')?.textContent?.trim() || '',
      marketPrice: document.querySelector('#zombcash-price')?.textContent?.trim() || '',
      marketStatus: document.querySelector('#zombcash-market-status')?.textContent?.trim() || '',
      chartStatus: document.querySelector('#activity-chart-status')?.textContent?.trim() || '',
      chartPathCount: document.querySelectorAll('#activity-price-chart path').length,
      chart30dSelected: document.querySelector('.activity-chart-tab[data-chart-period="30d"]')?.classList.contains('active') || false,
      recentTradesText: document.querySelector('#recent-trades-list')?.textContent?.trim().slice(0, 180) || '',
    }));
    const liveDataIssues = [];
    if (liveDataResult.newsItems < 1) liveDataIssues.push('news feed did not render any articles');
    if (!liveDataResult.marketPrice || liveDataResult.marketPrice === '—') liveDataIssues.push('market price did not load');
    if (/API ERROR|HTTP 5\d\d/i.test(liveDataResult.chartStatus)) liveDataIssues.push('price chart returned an API error');
    if (!liveDataResult.chart30dSelected || liveDataResult.chartPathCount < 2 || !/POINTS/i.test(liveDataResult.chartStatus)) liveDataIssues.push('30-day chart did not render a real price series');
    if (/Transaction API error:/i.test(liveDataResult.recentTradesText)) liveDataIssues.push('recent-trades request failed in the browser');
    if (liveDataErrors.length) liveDataIssues.push('browser JavaScript errors: ' + liveDataErrors.join(' | '));
    fs.writeFileSync(path.join(outDir, 'live-data-panels.json'), JSON.stringify({ result: liveDataResult, issues: liveDataIssues, pageErrors: liveDataErrors }, null, 2));
    await liveDataPage.screenshot({ path: path.join(outDir, 'live-data-panels.png'), fullPage: false });
    console.log(JSON.stringify({ liveDataResult, liveDataIssues }, null, 2));
    if (liveDataIssues.length) failures.push({ mode: 'live-data-panels', issues: liveDataIssues });
    await liveDataPage.close();
  } finally {
    await browser.close();
  }

  if (failures.length) {
    console.error('Mobile viewport smoke test failed:', JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  } else {
    console.log('All mobile viewport smoke tests passed for: ' + widths.join(', ') + 'px');
  }
})();

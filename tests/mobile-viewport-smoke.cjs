const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE_URL = process.env.SITE_URL || 'https://zombcash.github.io/';
const widths = [320, 360, 375, 390, 430, 768, 1024, 1440];
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
      const adNetworkEvents = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('request', request => {
        if (request.url().includes('bauval.org')) adNetworkEvents.push({ type: 'request', url: request.url() });
      });
      page.on('requestfailed', request => {
        if (request.url().includes('bauval.org')) adNetworkEvents.push({ type: 'requestfailed', url: request.url(), error: request.failure()?.errorText || 'unknown' });
      });
      page.on('response', response => {
        if (response.url().includes('bauval.org')) {
          const headers = response.headers();
          adNetworkEvents.push({
            type: 'response',
            url: response.url(),
            status: response.status(),
            resourceType: response.request().resourceType(),
            headers: {
              crossOriginResourcePolicy: headers['cross-origin-resource-policy'] || null,
              crossOriginEmbedderPolicy: headers['cross-origin-embedder-policy'] || null,
              accessControlAllowOrigin: headers['access-control-allow-origin'] || null,
              contentType: headers['content-type'] || null,
              xContentTypeOptions: headers['x-content-type-options'] || null,
            },
          });
        }
        if (response.request().resourceType() === 'document' && response.url() === BASE_URL) {
          const headers = response.headers();
          adNetworkEvents.push({
            type: 'main-document-headers',
            crossOriginEmbedderPolicy: headers['cross-origin-embedder-policy'] || null,
            crossOriginResourcePolicy: headers['cross-origin-resource-policy'] || null,
            contentSecurityPolicy: headers['content-security-policy'] || null,
          });
        }
      });
      page.on('console', message => {
        if (message.type() === 'error') adNetworkEvents.push({
          type: 'console-error',
          text: message.text().slice(0, 300),
          location: message.location(),
        });
      });

      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      // The live site may keep analytics/API requests open; do not wait for networkidle.
      await page.waitForLoadState('load', { timeout: 20000 }).catch(() => {});
      await page.waitForSelector('header.zombcash-shared-header', { timeout: 20000 });
      // Give shared ad/counter insertion scripts a chance to run before measuring.
      await page.waitForTimeout(1200);
      await page.waitForSelector('.zc-hero-ad-unit iframe', { timeout: 10000 }).catch(() => {});

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
          navVisible: !!nav && getComputedStyle(nav).display !== 'none' && nav.getBoundingClientRect().height > 0,
          menuExpected: window.innerWidth <= 1199,
          languageButton: { exists: !!languageButton, rect: rect(languageButton) },
          languageMenuExists: !!languageMenu,
          languageMenuRect: rect(languageMenu),
          ads: document.querySelectorAll('.zc-hero-sponsor-panel .zc-hero-ad-unit iframe').length,
          adSectionCount: document.querySelectorAll('.zc-hero-sponsor-panel').length,
          sponsorPromoVisible: (() => { const el = document.querySelector('.zc-hero-sponsor-promo'); return !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0; })(),
          adScriptTags: Array.from(document.scripts).filter(script => script.src.includes('bauval.org')).map(script => script.src),
          atOptions: window.atOptions || null,
          iframeSources: Array.from(document.querySelectorAll('iframe')).map(frame => ({ src: frame.src, width: frame.width, height: frame.height })).slice(0, 12),
          adPlacementInHero: (() => {
            const hero = document.querySelector('main#home .hero, main .hero, body > .hero');
            const panel = document.querySelector('.zc-hero-sponsor-panel');
            return !!hero && !!panel && hero.contains(panel) && !!panel.closest('.hero-layout');
          })(),
          adSlotGeometry: (() => {
            const stage = document.querySelector('.zc-hero-ad-stage');
            if (!stage) return null;
            const r = stage.getBoundingClientRect();
            return { x: Math.round(r.x), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height), position: getComputedStyle(stage).position };
          })(),
          adGeometry: (() => {
            const ad = document.querySelector('.zc-hero-ad-unit iframe');
            if (!ad) return null;
            const r = ad.getBoundingClientRect();
            return { x: Math.round(r.x), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height), position: getComputedStyle(ad).position };
          })(),
          pageVisitCounter: !!document.querySelector('#site-visits'),
          globalFootprintCounter: !!document.querySelector('#zsh-global-footprint'),
          pageFootprintCounter: !!document.querySelector('.page-footprint'),
        };
      });

      const issues = [];
      if (result.documentWidth > width + 1) issues.push(`horizontal overflow: document width ${result.documentWidth}px at viewport ${width}px`);
      if (result.menuExpected && !result.menuButton.visible) issues.push('mobile menu button is not visible');
      if (result.menuExpected && !result.navInitiallyClosed) issues.push('mobile navigation is not collapsed by default');
      if (!result.menuExpected && !result.navVisible) issues.push('desktop navigation is not visible');
      if (!result.languageButton.exists) issues.push('language selector button is missing');
      if (result.adSectionCount !== 1) issues.push(`expected exactly one hero sponsor panel, found ${result.adSectionCount}`);
      if (!result.sponsorPromoVisible) issues.push('Sponsor Zone fallback is not visible');
      if (!result.adPlacementInHero) issues.push('sponsor panel is not inside the original hero layout');
      const expectedAdWidth = width <= 900 ? 320 : 728;
      const expectedAdHeight = width <= 900 ? 50 : 90;
      if (!result.atOptions || Number(result.atOptions.width) !== expectedAdWidth || Number(result.atOptions.height) !== expectedAdHeight) issues.push(`expected Adsterra ${expectedAdWidth}×${expectedAdHeight} config at viewport ${width}px`);
      if (!result.adScriptTags.length) issues.push('Adsterra provider script is missing');
      if (!result.adSlotGeometry || Math.abs(result.adSlotGeometry.width / result.adSlotGeometry.height - expectedAdWidth / expectedAdHeight) > 0.25) issues.push('reserved Adsterra slot does not preserve the selected banner aspect ratio');
      if (result.adSlotGeometry && result.adSlotGeometry.width > width + 1) issues.push('reserved Adsterra slot exceeds the viewport width');
      if (result.ads > 1) issues.push(`expected at most one Adsterra iframe, found ${result.ads}`);
      if (result.adGeometry && result.adSlotGeometry && (result.adGeometry.x < result.adSlotGeometry.x - 1 || result.adGeometry.right > result.adSlotGeometry.right + 1)) issues.push('Adsterra iframe escapes its reserved slot');
      if (!result.pageVisitCounter) issues.push('homepage global visitor counter section is missing');
      if (result.adGeometry && result.adGeometry.position === 'fixed') issues.push('Adsterra iframe must not be fixed while scrolling');
      if (result.adGeometry && result.adGeometry.width > width + 1) issues.push('Adsterra iframe exceeds the viewport width');
      if (result.adGeometry && result.adGeometry.x < -1) issues.push('Adsterra iframe starts outside the left viewport edge');
      if (result.adGeometry && result.adGeometry.right > width + 1) issues.push('Adsterra iframe extends beyond the right viewport edge');

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
      const report = { width, result, issues, pageErrors, adNetworkEvents };
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
      const childLefts = layout ? Array.from(layout.children)
        .filter(child => {
          const style = getComputedStyle(child);
          const rect = child.getBoundingClientRect();
          return style.display !== 'none' && rect.width > 0 && rect.height > 0;
        })
        .map(child => Math.round(child.getBoundingClientRect().left)) : [];
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        pointerCoarse: matchMedia('(pointer: coarse)').matches,
        gridColumns: new Set(childLefts).size,
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

    
    // Sponsor Zone fallback must remain visible when the ad provider is blocked.
    // The reserved banner footprint is a layout contract, not a dependency on an ad creative.
    for (const width of [320, 390, 1440]) {
      const blockedPage = await browser.newPage({
        viewport: { width, height: 844 },
        deviceScaleFactor: 1,
        isMobile: width <= 900,
        hasTouch: width <= 900,
      });
      const blockedProviderRequests = [];
      blockedPage.on('requestfailed', request => {
        if (request.url().includes('bauval.org')) blockedProviderRequests.push(request.url());
      });
      await blockedPage.route('https://bauval.org/**', route => route.abort());
      await blockedPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await blockedPage.waitForSelector('.zc-hero-sponsor-panel .zc-hero-ad-stage', { timeout: 20000 });
      await blockedPage.waitForTimeout(500);
      const blockedResult = await blockedPage.evaluate(() => {
        const stage = document.querySelector('.zc-hero-ad-stage');
        const promo = document.querySelector('.zc-hero-sponsor-promo');
        const panel = document.querySelector('.zc-hero-sponsor-panel');
        const hero = document.querySelector('.hero');
        const rect = el => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: Math.round(r.x), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) };
        };
        return {
          viewportWidth: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          stage: rect(stage),
          containerWidth: stage?.parentElement ? Math.round(stage.parentElement.getBoundingClientRect().width) : 0,
          promo: rect(promo),
          panel: rect(panel),
          promoVisible: !!promo && getComputedStyle(promo).display !== 'none' && promo.getBoundingClientRect().height > 0,
          panelInsideHero: !!hero && !!panel && hero.contains(panel),
          iframeCount: stage?.querySelectorAll('iframe').length || 0,
        };
      });
      const blockedIssues = [];
      const nativeWidth = width <= 900 ? 320 : 728;
      const nativeHeight = width <= 900 ? 50 : 90;
      const expectedHeight = nativeHeight * Math.min(1, blockedResult.containerWidth / nativeWidth);
      if (!blockedResult.stage || blockedResult.stage.height < expectedHeight * 0.9) {
        blockedIssues.push(`reserved banner area collapsed at ${width}px viewport`);
      }
      if (blockedResult.stage && blockedResult.stage.width > width + 1) blockedIssues.push('reserved banner area exceeds viewport width');
      if (blockedResult.documentWidth > width + 1) blockedIssues.push('blocked-ad page has horizontal overflow');
      if (!blockedResult.promoVisible) blockedIssues.push('Sponsor Zone disappeared when ad provider was blocked');
      if (blockedResult.stage && blockedResult.promo && blockedResult.promo.top < blockedResult.stage.bottom) {
        blockedIssues.push('Sponsor Zone overlaps the reserved banner area');
      }
      if (!blockedResult.panelInsideHero) blockedIssues.push('Sponsor Zone left the original Hero layout');
      if (blockedResult.iframeCount !== 0) blockedIssues.push('blocked-ad test unexpectedly loaded an ad iframe');
      fs.writeFileSync(path.join(outDir, `blocked-ad-${width}.json`), JSON.stringify({
        result: blockedResult,
        issues: blockedIssues,
        providerRequestsFailed: blockedProviderRequests.length,
      }, null, 2));
      console.log(JSON.stringify({
        mode: 'blocked-ad-fallback',
        width,
        result: blockedResult,
        issues: blockedIssues,
        providerRequestsFailed: blockedProviderRequests.length,
      }, null, 2));
      if (blockedIssues.length) failures.push({ mode: 'blocked-ad-fallback', width, issues: blockedIssues });

      // Exercise both directions across the breakpoint; the scaled slot must
      // use the sponsor container's new width rather than its previous width.
      if (width === 320 || width === 1440) {
        const resizedWidth = width === 320 ? 1440 : 390;
        await blockedPage.setViewportSize({ width: resizedWidth, height: 844 });
        await blockedPage.waitForTimeout(350);
        const resized = await blockedPage.evaluate(() => {
          const stage = document.querySelector('.zc-hero-ad-stage');
          const r = stage?.getBoundingClientRect();
          return {
            viewportWidth: window.innerWidth,
            containerWidth: stage?.parentElement ? Math.round(stage.parentElement.getBoundingClientRect().width) : 0,
            stageWidth: r ? Math.round(r.width) : 0,
            stageHeight: r ? Math.round(r.height) : 0,
            documentWidth: document.documentElement.scrollWidth,
          };
        });
        const nativeWidth = resizedWidth <= 900 ? 320 : 728;
        const nativeHeight = resizedWidth <= 900 ? 50 : 90;
        const expectedHeight = nativeHeight * Math.min(1, resized.containerWidth / nativeWidth);
        const resizeIssues = [];
        if (resized.stageHeight < expectedHeight * 0.9) {
          resizeIssues.push(`reserved slot retained an undersized previous scale after resize: ${resized.stageWidth}×${resized.stageHeight}`);
        }
        if (resized.documentWidth > resizedWidth + 1) resizeIssues.push('resized page has horizontal overflow');
        console.log(JSON.stringify({ mode: 'ad-breakpoint-resize', from: width, to: resizedWidth, result: resized, issues: resizeIssues }));
        if (resizeIssues.length) failures.push({ mode: 'ad-breakpoint-resize', from: width, to: resizedWidth, issues: resizeIssues });
      }
      await blockedPage.close();
    }

    // Every localized homepage must translate the complete Sponsor Zone fallback.
    const sponsorZoneLabels = {
      de: ['DEIN PROJEKT.', 'UNSER INTERNET DER UNTOTEN.', 'TEAM KONTAKTIEREN ↗'],
      fr: ['VOTRE PROJET.', 'NOTRE INTERNET DES MORTS.', 'CONTACTER L’ÉQUIPE ↗'],
      it: ['IL TUO PROGETTO.', 'IL NOSTRO INTERNET DEI NON-MORTI.', 'CONTATTA IL TEAM ↗'],
      ja: ['あなたのプロジェクト。', '私たちのアンデッド・インターネット。', 'チームに連絡 ↗'],
      'zh-CN': ['您的项目。', '我们的亡者互联网。', '联系团队 ↗'],
      ru: ['ТВОЙ ПРОЕКТ.', 'НАШ ИНТЕРНЕТ НЕЖИТИ.', 'СВЯЗАТЬСЯ С КОМАНДОЙ ↗'],
      tr: ['PROJENİZ.', 'BİZİM YAŞAYAN ÖLÜLER İNTERNETİMİZ.', 'EKİPLE İLETİŞİME GEÇ ↗'],
      hi: ['आपका प्रोजेक्ट।', 'हमारा अनडेड इंटरनेट।', 'टीम से संपर्क करें ↗'],
    };
    for (const [locale, expected] of Object.entries(sponsorZoneLabels)) {
      const localizedHome = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      const localizedErrors = [];
      localizedHome.on('pageerror', error => localizedErrors.push(error.message));
      await localizedHome.goto(new URL(`${locale}/`, BASE_URL).href, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await localizedHome.waitForFunction(
        () => document.querySelector('.zc-hero-sponsor-promo h2')?.innerText.trim().length > 0 &&
              document.querySelector('.zc-hero-sponsor-promo a')?.textContent.trim().length > 0,
        null,
        { timeout: 20000 }
      );
      const actual = await localizedHome.evaluate(() => ({
        lang: document.documentElement.lang,
        heading: Array.from(document.querySelector('.zc-hero-sponsor-promo h2')?.childNodes || []).filter(node => node.nodeType === 3).map(node => node.textContent.trim()).filter(Boolean),
        cta: document.querySelector('.zc-hero-sponsor-promo a')?.textContent.trim() || '',
      }));
      const issues = [];
      if (actual.lang !== locale) issues.push(`html lang is ${actual.lang}, expected ${locale}`);
      if (actual.heading[0] !== expected[0] || actual.heading[1] !== expected[1]) {
        issues.push(`Sponsor Zone heading mismatch: ${JSON.stringify(actual.heading)}`);
      }
      if (actual.cta !== expected[2]) issues.push(`Sponsor Zone CTA is "${actual.cta}", expected "${expected[2]}"`);
      if (localizedErrors.length) issues.push('browser JavaScript errors: ' + localizedErrors.join(' | '));
      console.log(JSON.stringify({ mode: 'localized-sponsor-zone', locale, actual, expected, issues }));
      if (issues.length) failures.push({ mode: 'localized-sponsor-zone', locale, issues });
      await localizedHome.close();
    }

// Regression: every localized Whitepaper page must translate the shared navigation.
    // This catches missing shared-nav dictionary keys and stale language.js cache URLs.
    const whitepaperLabels = {
      de: 'WHITEPAPER',
      fr: 'LIVRE BLANC',
      it: 'WHITEPAPER',
      ja: 'ホワイトペーパー',
      'zh-CN': '白皮书',
      ru: 'ДОКУМЕНТ ПРОЕКТА',
      tr: 'PROJE TANITIM BELGESİ',
      hi: 'व्हाइटपेपर',
    };
    for (const [locale, expectedLabel] of Object.entries(whitepaperLabels)) {
      const localizedPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const localizedErrors = [];
      localizedPage.on('pageerror', error => localizedErrors.push(error.message));
      const localizedUrl = new URL(`${locale}/whitepaper.html`, BASE_URL).href;
      await localizedPage.goto(localizedUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      // Wait for the actual locale-specific label, not merely a non-empty
      // English placeholder. Shared navigation and the language dictionary can
      // initialize in either order on a cold page load.
      await localizedPage.waitForFunction(
        expected => document.querySelector('.zsh-nav a[href*="whitepaper.html"]')?.textContent.trim() === expected &&
                    document.querySelector('.language-trigger')?.textContent.trim(),
        expectedLabel,
        { timeout: 20000 }
      ).catch(() => {});
      const navLabel = await localizedPage.locator('.zsh-nav a[href*="whitepaper.html"]').textContent();
      const actualLabel = (navLabel || '').trim();
      const htmlLang = await localizedPage.locator('html').getAttribute('lang');
      const issues = [];
      if (htmlLang !== locale) issues.push(`html lang is ${htmlLang}, expected ${locale}`);
      if (actualLabel !== expectedLabel) issues.push(`WHITEPAPER menu label is "${actualLabel}", expected "${expectedLabel}"`);
      if (localizedErrors.length) issues.push('browser JavaScript errors: ' + localizedErrors.join(' | '));
      console.log(JSON.stringify({ mode: 'localized-navigation', locale, actualLabel, expectedLabel, issues }));
      if (issues.length) failures.push({ mode: 'localized-navigation', locale, issues });
      await localizedPage.close();
    }

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
    }, { timeout: 30000 }).catch(() => {});
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
    const marketDataUnavailable = /MARKET DATA UNAVAILABLE|SIGNAL UNAVAILABLE/i.test(liveDataResult.marketStatus);
    const chartUnavailable = /PRICE HISTORY UNAVAILABLE/i.test(liveDataResult.chartStatus);
    if (liveDataResult.newsItems < 1) liveDataIssues.push('news feed did not render any articles');
    if ((!liveDataResult.marketPrice || liveDataResult.marketPrice === '—') && !marketDataUnavailable) {
      liveDataIssues.push('market price is missing without an explicit unavailable status');
    }
    if (/API ERROR|HTTP 5\d\d/i.test(liveDataResult.chartStatus)) liveDataIssues.push('price chart returned an API error');
    const chartHasSeries = liveDataResult.chartPathCount >= 2 && /POINTS/i.test(liveDataResult.chartStatus);
    if (!liveDataResult.chart30dSelected || (!chartHasSeries && !(marketDataUnavailable && chartUnavailable))) {
      liveDataIssues.push('30-day chart has neither a real price series nor an explicit provider-unavailable state');
    }
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

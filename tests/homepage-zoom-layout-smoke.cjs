const { chromium } = require('playwright');

const URL = process.env.SITE_URL || 'https://zombcash.github.io/';
const widths = [1800, 3200, 6400, 9600, 12800, 16000];
const outDir = 'homepage-zoom-results';
require('node:fs').mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  try {
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForSelector('main#home .hero-layout .zc-hero-sponsor-panel', { timeout: 30000 });
      await page.waitForSelector('#zctv-channel-hub > .zctv-inner', { timeout: 30000 });
      await page.waitForFunction(() => {
        const count = document.getElementById('zc-promo-count');
        return count && count.textContent.trim() !== 'LOADING VIDEO LIBRARY…';
      }, null, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(300);
      const layout = await page.evaluate(() => {
        const rect = selector => {
          const el = document.querySelector(selector);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) };
        };
        const overflowElements = [...document.body.querySelectorAll('*')].map(el => {
          const r = el.getBoundingClientRect();
          const path = [];
          let node = el;
          while (node && node !== document.body && path.length < 5) {
            let part = node.tagName.toLowerCase();
            if (node.id) part += '#' + node.id;
            else if (node.classList && node.classList.length) part += '.' + [...node.classList].slice(0, 3).join('.');
            path.unshift(part); node = node.parentElement;
          }
          return { selector: path.join(' > '), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), scrollWidth: el.scrollWidth, overflowX: getComputedStyle(el).overflowX };
        }).filter(item => item.right > innerWidth + 2 || item.width > innerWidth + 2).sort((a,b) => b.right - a.right).slice(0, 20);
        return {
          overflowElements,
          viewport: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          hero: rect('#home > .hero'),
          heroLayout: rect('#home > .hero .hero-layout'),
          heroContent: rect('#home > .hero .hero-content'),
          sponsor: rect('#home > .hero .zc-hero-sponsor-panel'),
          tvPlayerWrap: rect('#zctv-channel-hub .zctv-player-mount .zc-promo-player-wrap'),
          promoVideo: rect('#zctv-channel-hub .zctv-player-mount #zc-promo-player'),
          tv: rect('#zctv-channel-hub > .zctv-inner'),
          player: rect('#zctv-channel-hub .zctv-player-column'),
          promoCount: document.getElementById('zc-promo-count')?.textContent.trim() || '',
          promoSource: document.getElementById('zc-promo-player')?.currentSrc || document.getElementById('zc-promo-player')?.src || '',
          stylesheet: (() => {
            const link = [...document.querySelectorAll('link[rel="stylesheet"]')]
              .find(item => new URL(item.href).pathname.endsWith('/homepage-visual.css'));
            return !!link && new URL(link.href).searchParams.get('v') === 'homepage-rail-20261114-1'
              && [...document.styleSheets].some(sheet => sheet.href === link.href);
          })(),
          worldGrid: rect('#living-world .world-grid'),
          toolGrid: rect('#radar .tool-grid'),
          crewGrid: rect('#community-console .crew-grid'),
          arcadeFeature: rect('#snake-game .arcade-feature'),
          footerMain: rect('body > footer#site-footer .site-footer-main'),
          headerNavFontSize: (() => { const el = document.querySelector('header.zombcash-shared-header .zsh-nav > a'); return el ? parseFloat(getComputedStyle(el).fontSize) : 0; })(),
          headerBrandFontSize: (() => { const el = document.querySelector('header.zombcash-shared-header .zsh-brand-copy'); return el ? parseFloat(getComputedStyle(el).fontSize) : 0; })(),
          tickerFontSize: (() => { const el = document.querySelector('#home > section.ticker'); return el ? parseFloat(getComputedStyle(el).fontSize) : 0; })(),
          ribbonFontSize: (() => { const el = document.querySelector('.zc-outbreak-ribbons .zc-ribbon-copy'); return el ? parseFloat(getComputedStyle(el).fontSize) : 0; })(),
          ribbonLabelFontSize: (() => { const el = document.querySelector('.zc-outbreak-ribbons .zc-ribbon-label'); return el ? parseFloat(getComputedStyle(el).fontSize) : 0; })(),
          ribbonHeight: (() => { const el = document.querySelector('.zc-outbreak-ribbons .zc-ribbon'); return el ? Math.round(el.getBoundingClientRect().height) : 0; })()
        };
      });
      const issues = [];
      if (!layout.stylesheet) issues.push('latest responsive stylesheet cache version is not loaded');
      if (width >= 7600 && layout.headerNavFontSize < 32) issues.push('shared header navigation remains too small at 20% browser zoom');
      if (width >= 7600 && layout.headerBrandFontSize < 32) issues.push('shared header brand remains too small at 20% browser zoom');
      if (width >= 7600 && layout.tickerFontSize < 32) issues.push('homepage market ticker text remains too small at 20% browser zoom');
      if (width >= 7600 && layout.ribbonFontSize < 28) issues.push('outbreak ribbon text remains too small at 20% browser zoom');
      if (width >= 7600 && layout.ribbonLabelFontSize < 30) issues.push('outbreak ribbon labels remain too small at 20% browser zoom');
      if (width >= 7600 && layout.ribbonHeight < 84) issues.push('outbreak ribbon bars remain too short at 20% browser zoom');
      if (!layout.heroLayout || layout.heroLayout.width < width * 0.85) issues.push('hero wrapper did not expand with the wide CSS viewport');
      if (!layout.heroContent || layout.heroContent.width < 760) issues.push('hero copy column remains capped at desktop width');
      if (!layout.sponsor || layout.sponsor.width < 640) issues.push('sponsor column remains capped at desktop width');
      if (!layout.tvPlayerWrap || layout.tvPlayerWrap.width < 420) issues.push('visible ZombieCash TV promo player shell did not expand');
      if (!layout.promoVideo || layout.promoVideo.width < 400 || Math.abs(layout.promoVideo.width / layout.promoVideo.height - 16 / 9) > 0.08) issues.push('visible ZombieCash TV promo video is not a valid 16:9 frame');
      if (!layout.tv || layout.tv.width < width * 0.8) issues.push('ZombieCash TV container did not expand');
      for (const [name, box] of Object.entries({
        'Living World': layout.worldGrid,
        'Radar cards': layout.toolGrid,
        'Community Console': layout.crewGrid,
        'Arcade feature': layout.arcadeFeature,
        'Footer': layout.footerMain
      })) {
        if (!box || box.width < width * 0.8) issues.push(name + ' did not expand with the 20% zoom viewport');
      }
      if (!layout.player || layout.player.width < 420) issues.push('ZombieCash TV player column is too narrow');
      if (!layout.promoCount || layout.promoCount === 'LOADING VIDEO LIBRARY…') issues.push('promo video library controls did not initialize');
      if (!layout.promoSource.startsWith('https://')) issues.push('featured promo video source was not assigned');
      if (layout.documentWidth > width + 2) issues.push('horizontal overflow: ' + layout.documentWidth + 'px; offenders: ' + JSON.stringify(layout.overflowElements));
      if (errors.length) issues.push('JavaScript errors: ' + errors.join(' | '));
      await page.screenshot({ path: `${outDir}/homepage-zoom-${width}.png`, fullPage: false });
      console.log(JSON.stringify({ width, layout, issues }));
      if (issues.length) failures.push({ width, issues, layout });
      await page.close();
    }
  } finally {
    await browser.close();
  }
  if (failures.length) {
    console.error(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  }
})();

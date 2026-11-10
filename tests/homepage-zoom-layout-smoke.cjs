const { chromium } = require('playwright');

const URL = process.env.SITE_URL || 'https://zombcash.github.io/';
const widths = [1800, 3200, 6400];

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
      await page.waitForTimeout(300);
      const layout = await page.evaluate(() => {
        const rect = selector => {
          const el = document.querySelector(selector);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) };
        };
        return {
          viewport: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          hero: rect('#home > .hero'),
          heroLayout: rect('#home > .hero .hero-layout'),
          heroContent: rect('#home > .hero .hero-content'),
          sponsor: rect('#home > .hero .zc-hero-sponsor-panel'),
          promo: rect('#promo-video .zc-promo-video-shell'),
          tv: rect('#zctv-channel-hub > .zctv-inner'),
          player: rect('#zctv-channel-hub .zctv-player-column'),
          stylesheet: [...document.styleSheets].some(s => s.href && new URL(s.href).search.includes('zoom-mobile-fix-20261110-2'))
        };
      });
      const issues = [];
      if (!layout.stylesheet) issues.push('latest responsive stylesheet cache version is not loaded');
      if (!layout.heroLayout || layout.heroLayout.width < width * 0.85) issues.push('hero wrapper did not expand with the wide CSS viewport');
      if (!layout.heroContent || layout.heroContent.width < 760) issues.push('hero copy column remains capped at desktop width');
      if (!layout.sponsor || layout.sponsor.width < 640) issues.push('sponsor column remains capped at desktop width');
      if (!layout.promo || layout.promo.width < width * 0.8) issues.push('promo video shell did not expand');
      if (!layout.tv || layout.tv.width < width * 0.8) issues.push('ZombieCash TV container did not expand');
      if (!layout.player || layout.player.width < 420) issues.push('ZombieCash TV player column is too narrow');
      if (layout.documentWidth > width + 2) issues.push('horizontal overflow: ' + layout.documentWidth + 'px');
      if (errors.length) issues.push('JavaScript errors: ' + errors.join(' | '));
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

const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const ORIGIN = process.env.SITE_URL || 'https://zombcash.github.io/';
const locales = ['en', 'de', 'fr', 'it', 'ja', 'zh-CN', 'ru', 'tr', 'hi'];
const viewports = [360, 768, 1024, 1440, 9600, 16000];
const output = path.join(process.cwd(), 'homepage-locale-results');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const results = [];
  try {
    for (const locale of locales) {
      const url = locale === 'en' ? ORIGIN : new URL(locale + '/index.html', ORIGIN).href;
      for (const width of viewports) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('load', { timeout: 20000 }).catch(() => {});
        await page.waitForSelector('main#home .hero-layout', { timeout: 20000 });
        await page.waitForTimeout(250);
        await page.evaluate(async () => {
          const images = [...document.querySelectorAll('main#home > section.hero .zc-sponsor-art-slot img, main#home .zctv-host-art img, main#home .zm-promo-character')];
          images.forEach(image => { image.loading = 'eager'; });
          await Promise.all(images.map(image => image.decode().catch(() => {})));
        });
        const result = await page.evaluate(() => {
          const rect = el => {
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) };
          };
          const hero = document.querySelector('main#home > .hero');
          const layout = hero?.querySelector('.hero-layout');
          const content = layout?.querySelector('.hero-content');
          const sponsor = layout?.querySelector('.zc-hero-art-panel');
          const statusRail = layout?.querySelector('.zc-home-status-rail');
          const heroStats = layout?.querySelector('.hero-stats');
          const tvSection = document.querySelector('#zctv-channel-hub');
          const tvInner = tvSection?.querySelector('.zctv-inner');
          const tvLayout = tvInner?.querySelector('.zctv-layout');
          const tvPlayer = tvLayout?.querySelector('.zctv-player-column');
          const tvVideo = tvPlayer?.querySelector('#zc-promo-player');
          const tvHostArt = tvLayout?.querySelector('.zctv-host-art');
          const tvHostImage = tvHostArt?.querySelector('img');
          const labCharacter = document.querySelector('main#home .zm-promo-character');
          const tvArchive = tvPlayer?.querySelector('.zctv-archive');
          const tvChannels = tvInner?.querySelector('.zctv-channels');
          const art = sponsor;
          const image = art?.querySelector('img');
          const visualStylesheetLink = [...document.querySelectorAll('link[rel="stylesheet"]')]
            .find(link => new URL(link.href).pathname.endsWith('/homepage-visual.css'));
          const stylesheet = !!visualStylesheetLink
            && [...document.styleSheets].some(sheet => sheet.href === visualStylesheetLink.href);
          return {
            width: innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            stylesheet,
            hero: rect(hero), layout: rect(layout), content: rect(content), sponsor: rect(sponsor), statusRail: rect(statusRail), heroStats: rect(heroStats), hasSponsor: !!sponsor, art: rect(art), heroGridColumns: layout ? getComputedStyle(layout).gridTemplateColumns : null, heroGridAreas: layout ? getComputedStyle(layout).gridTemplateAreas : null,
            tvSection: rect(tvSection), tvInner: rect(tvInner), tvLayout: rect(tvLayout), tvPlayer: rect(tvPlayer), tvVideo: rect(tvVideo), tvHostArt: rect(tvHostArt), tvArchive: rect(tvArchive), tvChannels: rect(tvChannels),
            tvHostImageLoaded: !!tvHostImage && tvHostImage.complete && tvHostImage.naturalWidth > 0,
            labCharacterImageLoaded: !!labCharacter && labCharacter.complete && labCharacter.naturalWidth > 0,

            imagePresent: !!image,
            imageSrcPresent: !!image && !!image.getAttribute('src') && (image.getAttribute('src').includes('meridian-of-ash-cover') || image.getAttribute('src').includes('zombcash-survivor-realistic-520.avif')),
            imageLoaded: !!image && image.complete && image.naturalWidth > 0,
          };
        });
        const issues = [];
        if (!result.stylesheet) issues.push('homepage-visual.css was not loaded');
        if (!result.tvSection || !result.tvInner || !result.tvLayout || !result.tvPlayer || !result.tvChannels) issues.push('ZombieCash TV layout is missing a required container');
        else {
          const sectionCenter = (result.tvSection.left + result.tvSection.right) / 2;
          const innerCenter = (result.tvInner.left + result.tvInner.right) / 2;
          if (Math.abs(sectionCenter - innerCenter) > 2) issues.push('ZombieCash TV inner container is not horizontally centered');
          if (result.tvInner.width < Math.min(width * 0.85, 1500 * 0.85)) issues.push('ZombieCash TV inner container is unexpectedly narrow');
          if (result.tvPlayer.left < result.tvInner.left - 2 || result.tvPlayer.right > result.tvInner.right + 2) issues.push('ZombieCash TV player column escapes the centered container');
          if (!result.tvArchive || Math.abs(result.tvArchive.width - result.tvPlayer.width) > 2) issues.push('ZombieCash TV archive width does not match the video player');
          if (Math.abs(result.tvChannels.width - result.tvInner.width) > 2) issues.push('ZombieCash TV channel cards do not align with the main container edges');
          if (width <= 1050 && Math.abs((result.tvPlayer.left + result.tvPlayer.right) / 2 - innerCenter) > 2) issues.push('Responsive ZombieCash TV player is not centered below 1050px');
          if (width > 1050 && result.tvHostArt && (result.tvPlayer.left < result.tvHostArt.right - 2 && result.tvPlayer.right > result.tvHostArt.left + 2 && result.tvPlayer.top < result.tvHostArt.bottom - 2 && result.tvPlayer.bottom > result.tvHostArt.top + 2)) issues.push('Desktop ZombieCash TV player overlaps host artwork');
          if (!result.tvVideo || !result.tvArchive || result.tvArchive.top < result.tvVideo.bottom - 2) issues.push('Episode archive must sit below the video player');
        }
        if (result.documentWidth > width + 1) issues.push('horizontal overflow: ' + result.documentWidth + 'px');
        if (width >= 7600 && (!result.layout || result.layout.width < width * 0.85)) issues.push('localized hero layout did not expand for 20% browser zoom');
        if (width >= 7600 && (!result.tvInner || result.tvInner.width < width * 0.8)) issues.push('localized ZombieCash TV rail did not expand for 20% browser zoom');
        if (!result.hasSponsor || !result.sponsor || result.sponsor.width <= 0 || result.sponsor.height <= 0) issues.push('localized hero artwork panel is missing or has no visible size');
        if (!result.imagePresent || !result.imageSrcPresent) issues.push('localized hero art image or its source is missing');
        if (!result.content || result.content.width <= 0) issues.push('localized homepage hero content is missing or has no visible size');
        const hasSeparateStatusRail = !!result.statusRail && result.statusRail.width > 0;
        if (!hasSeparateStatusRail && (!result.heroStats || result.heroStats.width <= 0)) issues.push('localized homepage hero stats or current homepage status rail are missing or have no visible size');
        const overlaps = (a, b) => !!a && !!b && a.left < b.right - 2 && a.right > b.left + 2 && a.top < b.bottom - 2 && a.bottom > b.top + 2;
        if (overlaps(result.content, result.sponsor)) issues.push('hero copy and artwork panel overlap');
        if (hasSeparateStatusRail && overlaps(result.content, result.statusRail)) issues.push('hero copy and status rail overlap');
        if (hasSeparateStatusRail && overlaps(result.sponsor, result.statusRail)) issues.push('hero artwork panel and status rail overlap');
        if (width < 1360 && result.content.bottom > result.sponsor.top + 2) issues.push('mobile/tablet hero artwork must stack below the copy');
        if (hasSeparateStatusRail && result.statusRail.top < Math.max(result.content.bottom, result.sponsor.bottom) - 2) issues.push('status rail must sit below both hero columns');
        if (!result.tvHostImageLoaded) issues.push('ZombieCash TV host artwork is missing or failed to load');
        if (errors.length) issues.push('JavaScript errors: ' + errors.join(' | '));
        const item = { locale, width, url, result, issues };
        results.push(item);
        if (issues.length) failures.push(item);
        if (issues.length) {
          await page.screenshot({ path: path.join(output, locale + '-' + width + '.png'), fullPage: false });
        }
        await page.close();
      }
    }
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ results, failures }, null, 2));
    console.log(JSON.stringify({ checked: results.length, failures }, null, 2));
  } finally {
    await browser.close();
  }
  if (failures.length) process.exitCode = 1;
})();

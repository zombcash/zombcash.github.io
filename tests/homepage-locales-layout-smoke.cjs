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
        await page.waitForSelector('main#home .hero-layout .zc-hero-sponsor-panel', { timeout: 20000 });
        await page.waitForTimeout(250);
        const result = await page.evaluate(() => {
          const rect = el => {
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) };
          };
          const hero = document.querySelector('main#home > .hero');
          const layout = hero?.querySelector('.hero-layout');
          const content = layout?.querySelector('.hero-content');
          const sponsor = layout?.querySelector('.zc-hero-sponsor-panel');
          const tvSection = document.querySelector('#zctv-channel-hub');
          const tvInner = tvSection?.querySelector('.zctv-inner');
          const tvLayout = tvInner?.querySelector('.zctv-layout');
          const tvPlayer = tvLayout?.querySelector('.zctv-player-column');
          const tvVideo = tvPlayer?.querySelector('#zc-promo-player');
          const tvHostArt = tvLayout?.querySelector('.zctv-host-art');
          const tvArchive = tvPlayer?.querySelector('.zctv-archive');
          const tvChannels = tvInner?.querySelector('.zctv-channels');
          const art = sponsor?.querySelector('.zc-sponsor-art-slot');
          const image = art?.querySelector('img');
          const stylesheet = Array.from(document.styleSheets).some(s => {
            try {
              return s.href && new URL(s.href).pathname.endsWith('/homepage-visual.css')
                && new URL(s.href).searchParams.get('v') === 'homepage-zoom-fit-20261112-7';
            } catch { return false; }
          });
          return {
            width: innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            stylesheet,
            hero: rect(hero), layout: rect(layout), content: rect(content), sponsor: rect(sponsor), art: rect(art),
            tvSection: rect(tvSection), tvInner: rect(tvInner), tvLayout: rect(tvLayout), tvPlayer: rect(tvPlayer), tvVideo: rect(tvVideo), tvHostArt: rect(tvHostArt), tvArchive: rect(tvArchive), tvChannels: rect(tvChannels),
            adStage: rect(sponsor?.querySelector('.zc-hero-ad-stage')),
            nativeSlot: rect(sponsor?.querySelector('.zc-adsterra-native-slot')),
            mobileSlot: rect(sponsor?.querySelector('.zc-adsterra-mobile-slot')),
            nativeSlotVisible: (() => { const el = sponsor?.querySelector('.zc-adsterra-native-slot'); if (!el) return false; const r = el.getBoundingClientRect(); return getComputedStyle(el).display !== 'none' && r.width > 0 && r.height > 0; })(),
            mobileSlotVisible: (() => { const el = sponsor?.querySelector('.zc-adsterra-mobile-slot'); if (!el) return false; const r = el.getBoundingClientRect(); return getComputedStyle(el).display !== 'none' && r.width > 0 && r.height > 0; })(),
            imagePresent: !!image,
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
        if (!result.imagePresent || !result.imageLoaded) issues.push('sponsor artwork image is missing or failed to load');
        if (!result.adStage) {
          issues.push('sponsor ad reservation is missing');
        } else if (width < 768) {
          const expectedHeight = 50 * Math.min(1, result.adStage.width / 320);
          if (result.adStage.height < expectedHeight * 0.9) issues.push('mobile ad reservation does not preserve the 320×50 ratio');
          if (!result.mobileSlotVisible) issues.push('mobile sponsor slot is not visible below 768px');
          if (result.nativeSlotVisible) issues.push('desktop native sponsor slot must be hidden below 768px');
        } else {
          if (result.adStage.height < 270) issues.push('desktop sponsor stage must reserve 300px from 768px upward');
          if (!result.nativeSlotVisible || !result.nativeSlot || result.nativeSlot.height < 270) issues.push('native sponsor slot must be visible and reserve 300px from 768px upward');
          if (result.mobileSlotVisible) issues.push('mobile sponsor slot must be hidden from 768px upward');
        }
        if (width >= 1360 && result.content.right > result.sponsor.left + 2) issues.push('desktop hero columns overlap');
        if (width < 1360 && result.content.bottom > result.sponsor.top + 2) issues.push('stacked hero sections overlap');
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

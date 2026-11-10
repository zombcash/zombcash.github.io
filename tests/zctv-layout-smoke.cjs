const { chromium } = require('playwright');
const fs = require('node:fs');
fs.mkdirSync('zctv-layout-results', { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const failures = [];
  const check = (condition, message) => { if (!condition) failures.push(message); };
  await page.route('https://zombcash-bot.fadehost.app/api/tv/episodes*', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ episodes: [] }) })
  );

  await page.goto(process.env.SITE_URL || 'http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('#zctv-channel-hub').scrollIntoViewIfNeeded();
  await page.waitForSelector('#zctv-channel-hub .zctv-player-mount .zc-promo-player-wrap', { state: 'visible', timeout: 15000 });

  const measure = async () => page.evaluate(() => {
    const box = selector => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x:r.x, y:r.y, width:r.width, height:r.height, right:r.right, bottom:r.bottom };
    };
    const layout = document.querySelector('#zctv-channel-hub .zctv-layout');
    const cards = document.querySelector('#zctv-channel-hub .zctv-channels');
    return {
      tracks: getComputedStyle(layout).gridTemplateColumns.split(' ').filter(Boolean).length,
      intro: box('#zctv-channel-hub .zctv-intro'),
      host: box('#zctv-channel-hub .zctv-host-art'),
      player: box('#zctv-channel-hub .zctv-player-column'),
      video: box('#zctv-channel-hub #zc-promo-player'),
      videoSource: document.querySelector('#zctv-channel-hub #zc-promo-player')?.currentSrc || document.querySelector('#zctv-channel-hub #zc-promo-player')?.src || '',
      archive: box('#zctv-channel-hub .zctv-archive'),
      channels: getComputedStyle(cards).gridTemplateColumns.split(' ').filter(Boolean).length,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth
    };
  });

  let m = await measure();
  check(m.tracks === 3, 'Desktop must render three TV columns');
  check(m.intro && m.intro.width >= 250, 'Desktop intro column is too narrow');
  check(m.host && m.host.width >= 280 && m.host.height >= 300, 'Desktop host artwork dimensions are incorrect');
  check(m.player && m.player.width >= 360, 'Desktop video/player column is too narrow');
  check(m.intro.right < m.host.x && m.host.right < m.player.x, 'Desktop columns overlap or are out of order');
  check(m.video && m.video.width > 0 && Math.abs(m.video.width / m.video.height - 16/9) < .08, 'Desktop video frame is not 16:9');
  check(m.videoSource.includes('zombiecash_final_real_screens.mp4'), 'Empty archive must fall back to the published promo video');
  check(m.archive && Math.abs(m.archive.width - m.player.width) < 4, 'Episode archive must match the player width');
  check(m.channels === 3, 'Desktop channel cards must use three columns');
  check(m.documentWidth <= m.viewportWidth, 'Desktop page has horizontal overflow');
  await page.screenshot({ path: 'zctv-layout-results/desktop.png' });
  console.log('DESKTOP', JSON.stringify(m));

  await page.setViewportSize({ width: 1024, height: 900 });
  await page.waitForTimeout(150);
  m = await measure();
  check(m.tracks === 2, 'Tablet must use two support columns below a full-width player');
  check(m.player && m.player.width <= 1040 && Math.abs((m.player.x + m.player.width/2) - 512) < 5, 'Tablet player must be centered and capped at 1040px');
  check(m.intro && m.host && m.intro.y < m.host.bottom && m.host.y < m.intro.bottom, 'Tablet intro and host artwork must share a row');
  await page.screenshot({ path: 'zctv-layout-results/tablet.png' });
  check(m.video && Math.abs(m.video.width / m.video.height - 16/9) < .08, 'Tablet video frame is not 16:9');
  check(m.documentWidth <= m.viewportWidth, 'Tablet page has horizontal overflow');
  console.log('TABLET', JSON.stringify(m));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  m = await measure();
  check(m.tracks === 1, 'Mobile TV content must stack in one column');
  check(m.player && m.intro.y < m.host.y && m.host.y < m.player.y, 'Mobile order must be intro, host artwork, player and archive');
  check(m.channels === 1, 'Mobile channel cards must stack in one column');
  check(m.documentWidth <= m.viewportWidth, 'Mobile page has horizontal overflow');
  await page.screenshot({ path: 'zctv-layout-results/mobile.png' });
  console.log('MOBILE', JSON.stringify(m));

  await browser.close();
  if (failures.length) {
    console.error('ZOMBCASH TV LAYOUT FAILURES:\\n- ' + failures.join('\\n- '));
    process.exit(1);
  }
  console.log('PASS: ZombieCash TV desktop, tablet, mobile, 16:9 video and archive alignment');
})();

const { chromium } = require('playwright');
const fs = require('node:fs');
fs.mkdirSync('zctv-layout-results', { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const failures = [];
  let episodeRequests = 0;
  const ravenEpisode = { episode_id: '2db68d18-9737-4308-b81b-e792da06d202', title: 'Raven — ZombieCash TV Introduction', created_at: 1794431724, duration_seconds: 4, channel: 'news' };
  const check = (condition, message) => { if (!condition) failures.push(message); };
  await page.route('https://zombcash-bot.fadehost.app/api/tv/episodes*', route => {
    episodeRequests += 1;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ episodes: [ravenEpisode] }) });
  });

  const archiveResponse = page.waitForResponse(response =>
    response.url().includes('/api/tv/episodes?page=1&per_page=24') && response.request().method() === 'GET'
  );
  await page.goto(process.env.SITE_URL || 'http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await archiveResponse;
  await page.waitForFunction(() => {
    const video = document.querySelector('#zctv-channel-hub #zc-promo-player');
    return video && video.src.includes('/episodes/2db68d18-9737-4308-b81b-e792da06d202/video');
  }, null, { timeout: 15000 });
  check(episodeRequests === 1, 'TV archive must load once on startup without requiring a channel click');
  await page.locator('#zctv-channel-hub').scrollIntoViewIfNeeded();
  await page.locator('#zctv-channel-hub [data-channel]').first().click();
  await page.waitForTimeout(150);
  check(episodeRequests === 1, 'Selecting a channel must reuse the already-loaded episode archive');
  await page.evaluate(() => { document.querySelector('#zctv-channel-hub').dataset.liveStream = 'https://youtu.be/AbCdEfGhI12'; });
  await page.locator('#zctv-channel-hub [data-zctv-mode="live"]').click();
  await page.waitForFunction(() => { const frame=document.querySelector('#zctv-channel-hub iframe.zctv-live-iframe'); return frame && frame.src.includes('/embed/AbCdEfGhI12'); }, null, { timeout: 10000 });
  check(episodeRequests === 1, 'Switching to YouTube Live must not trigger a duplicate archive request');
  await page.locator('#zctv-channel-hub [data-zctv-mode="archive"]').click();
  await page.waitForFunction(() => { const video=document.querySelector('#zctv-channel-hub #zc-promo-player'); return video && video.src.includes('/episodes/2db68d18-9737-4308-b81b-e792da06d202/video'); }, null, { timeout: 10000 });
  await page.waitForSelector('#zctv-channel-hub .zctv-player-mount .zc-promo-player-wrap', { state: 'visible', timeout: 15000 });
  await page.waitForFunction(() => {
    const count = document.querySelector('#zctv-channel-hub #zc-promo-count');
    return count && count.textContent.trim() !== 'LOADING VIDEO LIBRARY…';
  }, null, { timeout: 15000 }).catch(() => {});

  // The player now loads its source only when the video itself approaches
  // the viewport, not merely when the top of the TV section becomes visible.
  await page.locator('#zctv-channel-hub #zc-promo-player').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const video = document.querySelector('#zctv-channel-hub #zc-promo-player');
    return !!video && (video.currentSrc || video.src || '').includes('/episodes/2db68d18-9737-4308-b81b-e792da06d202/video');
  }, null, { timeout: 15000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(150);

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
      promoControls: box('#zctv-channel-hub .zc-promo-video-controls'),
      promoCount: document.querySelector('#zctv-channel-hub #zc-promo-count')?.textContent.trim() || '',
      promoStatus: document.querySelector('#zctv-channel-hub #zc-promo-status')?.textContent.trim() || '',
      archive: box('#zctv-channel-hub .zctv-archive'),
      channels: getComputedStyle(cards).gridTemplateColumns.split(' ').filter(Boolean).length,
      promoSectionDisplay: getComputedStyle(document.querySelector('#promo-video')).display,
      overflowElements: [...document.body.querySelectorAll('*')].map(el => {
        const r = el.getBoundingClientRect();
        return { tag: el.tagName.toLowerCase(), id: el.id || '', className: typeof el.className === 'string' ? el.className.split(' ').slice(0,3).join('.') : '', left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), overflowX: getComputedStyle(el).overflowX };
      }).filter(item => item.right > innerWidth || item.left < 0).sort((a,b) => b.right - a.right).slice(0,12),
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth
    };
  });

  let m = await measure();
  check(m.tracks === 3, 'Desktop must render three TV columns');
  check(m.intro && m.intro.width >= 250, 'Desktop intro column is too narrow');
  check(m.host && m.host.width >= 280 && m.host.height >= 300, 'Desktop host artwork dimensions are incorrect');
  check(m.player && m.player.width >= 360, 'Desktop video/player column is too narrow');
  check(m.player.right < m.intro.x && m.intro.right < m.host.x, 'Desktop columns must be ordered player, intro, host from left to right');
  check(m.video && m.video.width > 0 && Math.abs(m.video.width / m.video.height - 16/9) < .08, 'Desktop video frame is not 16:9');
  check(m.videoSource.includes('/episodes/2db68d18-9737-4308-b81b-e792da06d202/video'), 'Latest Raven episode must be the default player source instead of the October promo');
  check(m.promoControls && m.promoControls.width > 0 && m.promoControls.height > 0, 'Promo library controls must be visible inside the TV player column');
  check(m.promoCount && m.promoCount !== 'LOADING VIDEO LIBRARY…', 'Promo library counter must initialize');
  check(m.promoStatus.includes('Raven') && !m.promoStatus.toLowerCase().includes('unavailable'), 'Latest Raven episode status must initialize without legacy promo fallback');
  check(m.archive && Math.abs(m.archive.width - m.player.width) < 4, 'Episode archive must match the player width');
  check(m.channels === 3, 'Desktop channel cards must use three columns');
  check(m.promoSectionDisplay === 'none', 'The source promo section must stay hidden after its player is moved into ZombieCash TV');
  check(m.documentWidth <= m.viewportWidth, 'Desktop page has horizontal overflow');
  await page.screenshot({ path: 'zctv-layout-results/desktop.png' });
  console.log('DESKTOP', JSON.stringify(m));

  await page.setViewportSize({ width: 1024, height: 900 });
  await page.locator('#zctv-channel-hub').scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  m = await measure();
  check(m.tracks === 2, 'Tablet must use two support columns below a full-width player');
  check(m.player && m.player.width <= 760 && Math.abs((m.player.x + m.player.width/2) - 512) < 5, 'Tablet player must be centered and capped at 760px');
  check(m.intro && m.host && m.intro.y < m.host.bottom && m.host.y < m.intro.bottom, 'Tablet intro and host artwork must share a row');
  await page.screenshot({ path: 'zctv-layout-results/tablet.png' });
  check(m.video && Math.abs(m.video.width / m.video.height - 16/9) < .08, 'Tablet video frame is not 16:9');
  check(m.documentWidth <= m.viewportWidth, 'Tablet page has horizontal overflow');
  console.log('TABLET', JSON.stringify(m));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#zctv-channel-hub').scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  m = await measure();
  check(m.tracks === 1, 'Mobile TV content must stack in one column');
  check(m.player && m.intro && m.host && m.intro.y < m.host.y && m.host.y < m.player.y, 'Mobile order must be intro, host artwork, player and archive');
  check(m.intro && m.host && m.player && Math.abs(m.intro.width-m.host.width)<4 && Math.abs(m.host.width-m.player.width)<4, 'Mobile intro, host and video blocks must share the same content width');
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

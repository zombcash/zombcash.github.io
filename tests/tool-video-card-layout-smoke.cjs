const { chromium } = require('playwright');
const fs = require('node:fs');
fs.mkdirSync('tool-video-card-results', { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const check = (ok, message) => { if (!ok) failures.push(message); };
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () {
      this.dataset.testPlaying = '1';
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () {
      this.dataset.testPlaying = '0';
    };
  });
  await page.route('**/*.mp4*', route => route.fulfill({ status: 200, contentType: 'video/mp4', body: Buffer.alloc(0) }));
  await page.goto(process.env.SITE_URL || 'http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('#radar .tool-grid [data-video-card="meme-radar"]', { timeout: 20000 });
  await page.waitForTimeout(300);

  const measure = async () => page.evaluate(() => {
    const rect = el => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height };
    };
    const cards = [...document.querySelectorAll('#radar .tool-grid > .tool-card')];
    return {
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      gridColumns: getComputedStyle(document.querySelector('#radar .tool-grid')).gridTemplateColumns.split(' ').filter(Boolean).length,
      cards: cards.map(card => ({
        name: card.querySelector('[data-video-card]')?.dataset.videoCard,
        box: rect(card),
        video: rect(card.querySelector('.tool-video-shell')),
        title: rect(card.querySelector('h3')),
        copy: rect(card.querySelector('p')),
        features: rect(card.querySelector('ul')),
        action: rect(card.querySelector('.card-link')),
        overlayVisible: [...card.querySelectorAll('.tool-video-code,.tool-video-state,.tool-video-play-icon,.tool-video-trigger-label')].some(el => getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden' && Number(getComputedStyle(el).opacity) > 0)
      }))
    };
  });

  for (const width of [1440, 1024, 768, 640, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator('#radar .tool-grid').scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
    const m = await measure();
    const expectedColumns = width > 1050 ? 3 : width > 760 ? 2 : 1;
    check(m.cards.length === 3, width + 'px: expected exactly three tool cards');
    check(m.gridColumns === expectedColumns, width + 'px: expected ' + expectedColumns + ' columns, got ' + m.gridColumns);
    check(m.documentWidth <= width + 1, width + 'px: horizontal overflow (' + m.documentWidth + 'px)');
    for (const card of m.cards) {
      check(card.video && Math.abs(card.video.width / card.video.height - 16/9) < .025, width + 'px: ' + card.name + ' video is not 16:9');
      check(card.video && Math.abs(card.video.width - card.box.width + 32) < 4, width + 'px: ' + card.name + ' video does not fill the shared card content width');
      check(card.action && Math.abs(card.action.width - (card.box.width - 32)) < 4, width + 'px: ' + card.name + ' CTA width is inconsistent');
      check(!card.overlayVisible, width + 'px: ' + card.name + ' has a visible play icon or overlay label');
    }
    if (width > 760) {
      const widths = m.cards.map(c => c.box.width);
      const heights = m.cards.map(c => c.box.height);
      check(Math.max(...widths) - Math.min(...widths) < 3, width + 'px: tool cards do not have equal widths');
      check(Math.max(...heights) - Math.min(...heights) < 3, width + 'px: tool cards do not have equal heights');
      const actionBottoms = m.cards.map(c => c.action.bottom);
      check(Math.max(...actionBottoms) - Math.min(...actionBottoms) < 3, width + 'px: CTA buttons are not aligned on one baseline');
    }
    await page.screenshot({ path: 'tool-video-card-results/' + width + '.png' });
    console.log('LAYOUT', JSON.stringify(m));
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  const radar = page.locator('[data-video-card="meme-radar"]');
  const radarVideo = radar.locator('video');
  const radarBox = await radar.boundingBox();
  await page.mouse.move(radarBox.x + radarBox.width / 2, radarBox.y + 100);
  await page.waitForFunction(() => document.querySelector('[data-video-card="meme-radar"]').classList.contains('is-playing'));
  const hoverState = await radarVideo.evaluate(video => ({ src: video.getAttribute('src'), expected: video.dataset.src, muted: video.muted }));
  check(hoverState.src === hoverState.expected, 'Mouse hover must lazy-load the selected video source');
  check(hoverState.muted, 'Tool videos must always play muted');
  await page.mouse.move(5, 5);
  await page.waitForFunction(() => !document.querySelector('[data-video-card="meme-radar"]').classList.contains('is-playing'));
  console.log('HOVER', JSON.stringify(hoverState));

  const touchPage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await touchPage.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () { this.dataset.testPlaying = '1'; return Promise.resolve(); };
    HTMLMediaElement.prototype.pause = function () { this.dataset.testPlaying = '0'; };
  });
  await touchPage.route('**/*.mp4*', route => route.fulfill({ status: 200, contentType: 'video/mp4', body: Buffer.alloc(0) }));
  await touchPage.goto(process.env.SITE_URL || 'http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const touchCard = touchPage.locator('[data-video-card="zombie-lab"]');
  const touchButton = touchCard.locator('.tool-video-trigger');
  await touchButton.tap();
  await touchPage.waitForFunction(() => document.querySelector('[data-video-card="zombie-lab"]').classList.contains('is-playing'));
  const touchSource = await touchCard.locator('video').getAttribute('src');
  check(!!touchSource, 'First touch must lazy-load and start the video');
  await touchButton.tap();
  await touchPage.waitForFunction(() => !document.querySelector('[data-video-card="zombie-lab"]').classList.contains('is-playing'));
  console.log('TOUCH', JSON.stringify({ sourceLoaded:!!touchSource, secondTapPaused:true }));

  await browser.close();
  if (failures.length) {
    console.error('TOOL VIDEO CARD FAILURES:\\n- ' + failures.join('\\n- '));
    process.exit(1);
  }
  console.log('PASS: three balanced tool cards, aligned CTA baselines, 16:9 video, hover/touch playback and muted lazy loading.');
})();

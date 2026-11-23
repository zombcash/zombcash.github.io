const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const base = process.env.SITE_URL || 'http://127.0.0.1:4173/';
const resultsDir = path.join(process.cwd(), 'arcade-snake-iframe-results');
fs.mkdirSync(resultsDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  const pageErrors = [];

  page.on('pageerror', error => pageErrors.push(error.message));
  await page.route('**/*', route => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.origin === new URL(base).origin) return route.continue();
    return route.abort();
  });

  try {
    const response = await page.goto(new URL('arcade.html?game=snake', base).toString(), {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    assert(response && response.ok(), 'Arcade page did not return a successful response');

    const iframeLocator = page.locator('#snake-frame');
    await iframeLocator.waitFor({ state: 'visible', timeout: 15000 });
    const frame = await iframeLocator.elementHandle().then(handle => handle.contentFrame());
    assert(frame, 'Snake iframe content frame was not created');

    await frame.waitForFunction(() => {
      const modal = document.getElementById('snake-modal');
      const canvas = document.getElementById('zombie-canvas');
      return document.readyState === 'complete' &&
        Boolean(modal && modal.open) &&
        Boolean(canvas && canvas.getContext('2d'));
    }, { timeout: 20000 });

    const initial = await frame.evaluate(() => {
      const canvas = document.getElementById('zombie-canvas');
      const rect = canvas.getBoundingClientRect();
      return {
        title: document.title,
        readyState: document.readyState,
        modalOpen: document.getElementById('snake-modal').open,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        canvasVisibleWidth: Math.round(rect.width),
        canvasVisibleHeight: Math.round(rect.height),
        gameState: document.getElementById('game-state').textContent.trim()
      };
    });
    assert(initial.modalOpen, 'Snake modal did not open in embedded mode');
    assert(initial.canvasWidth > 0 && initial.canvasHeight > 0, 'Snake canvas has no drawing dimensions');
    assert(initial.canvasVisibleWidth > 0 && initial.canvasVisibleHeight > 0, 'Snake canvas is not visibly laid out');

    await frame.evaluate(() => {
      window.__arcadeBridgeMessages = [];
      window.addEventListener('message', event => {
        if (event.data && typeof event.data.type === 'string' &&
            event.data.type.startsWith('zombcash-arcade-snake-')) {
          window.__arcadeBridgeMessages.push({
            type: event.data.type,
            key: event.data.key || null,
            down: typeof event.data.down === 'boolean' ? event.data.down : null
          });
        }
      });
    });

    await page.locator('#start').click();
    await frame.waitForFunction(() =>
      document.getElementById('game-state')?.textContent.trim() === 'SURVIVE' &&
      document.getElementById('game-action')?.disabled === true,
    { timeout: 10000 });

    await page.keyboard.press('ArrowDown');
    await frame.waitForFunction(() => {
      const messages = window.__arcadeBridgeMessages || [];
      return messages.some(message => message.type === 'zombcash-arcade-snake-key' &&
        message.key === 'ArrowDown' && message.down === true) &&
        messages.some(message => message.type === 'zombcash-arcade-snake-key' &&
        message.key === 'ArrowDown' && message.down === false);
    }, { timeout: 5000 });

    const finalState = await frame.evaluate(() => ({
      gameState: document.getElementById('game-state').textContent.trim(),
      activeClass: document.getElementById('game-screen').classList.contains('snake-playing'),
      bridgeMessages: window.__arcadeBridgeMessages || []
    }));
    assert.equal(finalState.gameState, 'SURVIVE', 'Snake game did not remain active after keyboard input');
    assert(finalState.activeClass, 'Snake game screen did not enter its active state');
    assert(finalState.bridgeMessages.some(message => message.type === 'zombcash-arcade-snake-start'),
      'Parent start button did not reach the Snake iframe');

    await page.screenshot({ path: path.join(resultsDir, 'arcade-snake-iframe.png'), fullPage: true });
    assert.deepEqual(pageErrors, [], 'Browser runtime errors were reported');

    console.log(JSON.stringify({
      result: 'PASS',
      iframe: initial,
      afterStartAndKeyboard: {
        gameState: finalState.gameState,
        activeClass: finalState.activeClass,
        startMessageReceived: true,
        arrowDownDownAndUpReceived: true
      },
      pageErrors
    }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const SITE_URL = process.env.SITE_URL || 'http://127.0.0.1:4173/';
const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jvN8AAAAASUVORK5CYII=';
const png = Buffer.from(PNG_BASE64, 'base64');
const generatedImage = 'data:image/png;base64,' + PNG_BASE64;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ acceptDownloads: true });
  const calls = [];
  let timeoutOverride = false;

  await page.route('https://zombcash-bot.fadehost.app/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, content-type'
    };
    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers });
      return;
    }
    calls.push({ path: url.pathname, method, body: request.postData() || '' });
    if (url.pathname === '/api/zombie-maker') {
      await route.fulfill({ status: 200, headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: generatedImage, saveReceipt: 'qa-save-receipt' }) });
      return;
    }
    if (url.pathname === '/api/zombie-caption') {
      await route.fulfill({ status: 200, headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: 'QA caption from ZombieCash AI.' }) });
      return;
    }
    if (url.pathname === '/api/zombie-share') {
      await route.fulfill({ status: 200, headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_url: 'https://t.me/ZOMBCASH/1' }) });
      return;
    }
    await route.fulfill({ status: 200, headers: { ...headers, 'Content-Type': 'application/json' }, body: '{}' });
  });

  try {
    await page.goto(new URL('zombie-maker.html', SITE_URL).href, {
      waitUntil: 'domcontentloaded', timeout: 30000
    });

    const input = page.locator('#photoInput');
    const create = page.locator('#createBtn');
    const status = page.locator('#status');

    assert.equal(await input.evaluate(element => element.labels.length), 1,
      'Photo input must have an associated label');
    assert.equal(await page.locator('.styles').getAttribute('role'), 'group');
    assert.equal(await page.locator('.styles').getAttribute('aria-labelledby'), 'mutation-label');

    await input.setInputFiles({ name: 'invalid.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') });
    assert.match(await status.textContent(), /JPG, PNG or WebP/);
    assert.equal(await create.isDisabled(), true, 'Unsupported images must not enable generation');

    await input.setInputFiles({ name: 'oversized.png', mimeType: 'image/png', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
    assert.match(await status.textContent(), /over 5 MB/);
    assert.equal(await create.isDisabled(), true, 'Oversized images must not enable generation');

    await input.setInputFiles({ name: 'qa-survivor.png', mimeType: 'image/png', buffer: png });
    assert.equal(await create.isEnabled(), true, 'Valid image should enable generation');

    await page.locator('[data-style="toxic"]').click();
    assert.equal(await page.locator('[data-style="toxic"]').getAttribute('class').then(value => value.includes('active')), true);

    await create.click();
    await page.waitForFunction(() => document.querySelector('#status')?.textContent.includes('Transformation complete.'), null, { timeout: 10000 });
    assert.equal(await page.locator('#resultBox img').count(), 1, 'Generated image should render');
    assert.equal(await page.locator('#downloadBtn').isEnabled(), true);
    assert.equal(await page.locator('#shareBtn').isEnabled(), true);
    assert(calls.some(call => call.path === '/api/zombie-maker' && call.body.includes('toxic')),
      'Selected mutation style must be included in the image-generation request');

    await page.locator('#captionAiBtn').click();
    await page.waitForFunction(() => document.querySelector('#captionInput')?.value === 'QA caption from ZombieCash AI.', null, { timeout: 10000 });
    assert(calls.some(call => call.path === '/api/zombie-caption'), 'AI caption request should be sent');

    await page.locator('#shareBtn').click();
    await page.waitForFunction(() => document.querySelector('#status')?.textContent.includes('SUCCESSFULLY SENT'), null, { timeout: 10000 });
    assert(calls.some(call => call.path === '/api/zombie-share'), 'Telegram share request should be sent');

    await page.evaluate(() => {
      window.__nativeAbortSignalTimeout = AbortSignal.timeout;
      Object.defineProperty(AbortSignal, 'timeout', {
        configurable: true,
        value: () => AbortSignal.abort(new DOMException('Simulated timeout', 'TimeoutError'))
      });
    });
    await page.locator('#captionAiBtn').click();
    await page.waitForFunction(() => document.querySelector('#status')?.textContent.includes('AI caption request timed out'), null, { timeout: 5000 });
    assert.equal(await page.locator('#captionAiBtn').isEnabled(), true,
      'Caption button must recover after a timeout');

    await page.evaluate(() => {
      Object.defineProperty(AbortSignal, 'timeout', {
        configurable: true,
        value: window.__nativeAbortSignalTimeout
      });
    });

    const buttonAudit = await page.locator('button:not([hidden])').evaluateAll(buttons =>
      buttons.filter(button => !button.textContent.trim() && !button.getAttribute('aria-label')).length
    );
    assert.equal(buttonAudit, 0, 'Every visible button must have an accessible name');

    console.log(JSON.stringify({
      result: 'PASS',
      imageValidation: 'PASS',
      mutationSelection: 'PASS',
      mockedImageGeneration: 'PASS',
      captionGeneration: 'PASS',
      telegramShare: 'PASS',
      timeoutRecovery: 'PASS',
      accessibleControls: 'PASS',
      liveProviderCalls: 0
    }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error('FAIL: Zombie Maker UI smoke test:', error);
  process.exitCode = 1;
});

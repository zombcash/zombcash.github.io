const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const SITE_URL = process.env.SITE_URL || 'http://127.0.0.1:4173/';
const API = 'https://zombcash-bot.fadehost.app';
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'Content-Type, Authorization',
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const pageErrors = [];
  let loginStarts = 0;
  let savedSettings = null;
  let profile = {
    telegramId: '123456789',
    username: 'qa_survivor',
    firstName: 'QA Survivor',
    publicDisplayName: 'QA Survivor',
    displayNameCustomized: true,
    points: 42,
    createdAt: '2026-01-01T00:00:00Z',
    referralCode: 'QA123',
    leaderboardVisible: true,
    presenceVisible: true,
  };

  page.on('pageerror', error => pageErrors.push(error.message));
  await page.route(API + '/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (method === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS, body: '' });
    }

    let status = 200;
    let body = {};
    if (url.pathname === '/health') {
      body = { ok: true, service: 'ZombieCash Radar API', cached: true };
    } else if (url.pathname === '/api/auth/telegram/start' && method === 'POST') {
      loginStarts += 1;
      body = {
        ok: true,
        nonce: 'qa-nonce-' + loginStarts,
        botUrl: 'https://t.me/MemeCoinAIAgent_bot?start=auth_qa-' + loginStarts,
        expiresIn: 120,
      };
    } else if (url.pathname === '/api/auth/telegram/status') {
      if (loginStarts === 1) {
        status = 410;
        body = { error: 'Login request expired. Please try again.' };
      } else {
        body = {
          ok: true,
          status: 'complete',
          token: 'qa-survivor-token',
          profile,
        };
      }
    } else if (url.pathname === '/api/profile' && method === 'GET') {
      body = { profile };
    } else if (url.pathname === '/api/profile/activity') {
      body = { activity: [] };
    } else if (url.pathname === '/api/referrals/me') {
      body = { referralCode: 'QA123', referralUrl: 'https://zombcash.github.io/survivor-hub.html?ref=QA123', verifiedReferrals: 0, pendingReferrals: 0, pointsPerReferral: 25, pointsEnabled: false };
    } else if (url.pathname === '/api/profile/settings' && method === 'POST') {
      savedSettings = request.postDataJSON();
      profile = { ...profile, ...savedSettings };
      body = { ok: true, profile };
    } else if (url.pathname === '/api/presence/heartbeat') {
      body = { ok: true, online: true };
    } else if (url.pathname === '/api/survival/visit') {
      body = { ok: true };
    } else if (url.pathname === '/api/radar') {
      body = { pairs: [], count: 0, source: 'test' };
    } else if (url.pathname === '/api/zombcash') {
      body = { priceUsd: '0.00001', stale: false };
    } else if (url.pathname === '/api/news') {
      body = { articles: [], count: 0 };
    } else if (url.pathname === '/api/activity') {
      body = { activity: [] };
    } else if (url.pathname === '/api/visits') {
      body = { total: 0, today: 0, online: 0 };
    } else if (url.pathname === '/api/vote') {
      body = { options: [], counts: {} };
    } else if (url.pathname === '/api/survival-scores') {
      body = { scores: [] };
    } else {
      body = { ok: true };
    }
    return route.fulfill({ status, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  });

  try {
    await page.goto(new URL('survivor-hub.html', SITE_URL).href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const trigger = page.locator('header.zombcash-shared-header .zsh-actions .zsh-login-button');
    await trigger.waitFor({ state: 'visible', timeout: 15000 });
    assert.equal(await trigger.getAttribute('aria-haspopup'), 'dialog');
    assert.equal(await trigger.getAttribute('aria-controls'), 'survivor-profile-modal');
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');

    await trigger.focus();
    await trigger.click();
    const overlay = page.locator('#survivor-profile-modal');
    const dialog = overlay.locator('[role="dialog"]');
    await dialog.waitFor({ state: 'visible' });
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
    assert.equal(await dialog.getAttribute('aria-modal'), 'true');
    assert.equal(await dialog.getAttribute('aria-describedby'), 'survivor-intro');

    const connect = dialog.locator('.survivor-widget button').first();
    const close = dialog.locator('#survivor-close');
    await connect.waitFor({ state: 'visible' });
    assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('.survivor-widget button')), true,
      'opening the dialog should focus the first action');

    await close.focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('.survivor-widget button')), true,
      'Tab from the last control should wrap to the first');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('#survivor-close')), true,
      'Shift+Tab from the first control should wrap to the last');

    await page.locator('.zsh-menu-toggle').focus();
    assert.equal(await page.evaluate(() => document.querySelector('#survivor-profile-modal').contains(document.activeElement)), true,
      'programmatic focus must remain inside the open dialog');

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.querySelector('#survivor-profile-modal')?.hidden === true);
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('header.zombcash-shared-header .zsh-actions .zsh-login-button')), true,
      'closing the dialog must restore focus to the login trigger');

    await trigger.click();
    const retryButton = page.locator('#survivor-profile-modal .survivor-widget button').first();
    await retryButton.click();
    await page.waitForFunction(() => {
      const status = document.querySelector('#survivor-status')?.textContent || '';
      return status.includes('failed') || status.includes('ошиб') || status.includes('失敗') || status.includes('失败');
    }, { timeout: 10000 });
    assert.equal(loginStarts, 1, 'first login attempt should reach Telegram auth start');

    await page.locator('#survivor-close').click();
    await trigger.click();
    await page.locator('#survivor-profile-modal .survivor-widget button').first().click();
    await page.locator('#survivor-display-name').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForFunction(() => localStorage.getItem('zombcash-survivor-token') === 'qa-survivor-token');
    assert.equal(loginStarts, 2, 'expired login must release busy state so a new attempt can start');

    const name = page.locator('#survivor-display-name');
    await name.fill('QA Survivor 2');
    await page.locator('#survivor-save-settings').click();
    await page.waitForFunction(() => document.querySelector('#survivor-status')?.textContent.includes('PROFILE SAVED'));
    assert.equal(savedSettings.publicDisplayName, 'QA Survivor 2');
    assert.equal(JSON.parse(await page.evaluate(() => localStorage.getItem('zombcash-survivor-profile'))).publicDisplayName, 'QA Survivor 2');

    await page.locator('#survivor-logout').click();
    await page.waitForFunction(() => localStorage.getItem('zombcash-survivor-token') === null);
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
    assert.equal((await trigger.textContent()).trim(), 'LOGIN WITH TELEGRAM');
    assert.deepEqual(pageErrors, []);
    console.log(JSON.stringify({ result: 'PASS', loginStarts, focusTrap: 'PASS', loginRetryAfterExpiry: 'PASS', profileSave: 'PASS', logout: 'PASS' }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

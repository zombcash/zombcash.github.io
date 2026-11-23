const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const base = process.env.SITE_URL || 'http://127.0.0.1:4173/';
const resultsDir = path.join(process.cwd(), 'arcade-snake-session-results');
const token = 'qa-only-survivor-token';
const calls = { start: [], complete: [], progress: [], leaderboard: [] };

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  await context.addInitScript(value => {
    localStorage.setItem('zombcash-survivor-token', value);
  }, token);
  const page = await context.newPage();
  const pageErrors = [];

  page.on('pageerror', error => pageErrors.push(error.message));
  await page.route('**/*', async route => {
    const request = route.request();
    const requestUrl = new URL(request.url());
    if (requestUrl.origin === new URL(base).origin) {
      return route.continue();
    }

    if (requestUrl.hostname === 'zombcash-bot.fadehost.app') {
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*',
        'access-control-allow-methods': 'GET,POST,OPTIONS', 'content-type': 'application/json' };
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });

      if (requestUrl.pathname === '/api/survival/game-start' && request.method() === 'POST') {
        calls.start.push({ authorization: request.headers()['authorization'] || '', body: request.postDataJSON() });
        return route.fulfill({ status: 200, headers, body: JSON.stringify({ receipt: 'qa-snake-session-receipt' }) });
      }
      if (requestUrl.pathname === '/api/survival/game-complete' && request.method() === 'POST') {
        calls.complete.push({ authorization: request.headers()['authorization'] || '', body: request.postDataJSON() });
        return route.fulfill({
          status: 200, headers,
          body: JSON.stringify({ arcadeScore: { bestScore: 0, gamesPlayed: 1, totalScore: 0, totalTimeSeconds: 3 } })
        });
      }
      if (requestUrl.pathname === '/api/survival/arcade-stats' && request.method() === 'GET') {
        calls.progress.push({ authorization: request.headers()['authorization'] || '' });
        return route.fulfill({
          status: 200, headers,
          body: JSON.stringify({ stats: [{ game: 'snake', bestScore: 0, gamesPlayed: 1, totalScore: 0, totalTimeSeconds: 3 }] })
        });
      }
      if (requestUrl.pathname === '/api/arcade-scores' && request.method() === 'GET') {
        calls.leaderboard.push({ game: requestUrl.searchParams.get('game') });
        return route.fulfill({ status: 200, headers, body: JSON.stringify({ scores: [] }) });
      }
      if (requestUrl.pathname === '/api/track') {
        return route.fulfill({ status: 200, headers, body: JSON.stringify({ ok: true }) });
      }
      return route.fulfill({ status: 200, headers, body: JSON.stringify({}) });
    }

    return route.abort();
  });

  try {
    const response = await page.goto(new URL('arcade.html', base).toString(), {
      waitUntil: 'domcontentloaded', timeout: 30000
    });
    assert(response && response.ok(), 'Arcade page did not return a successful response');

    await page.locator('[data-game="snake"]').click();
    const iframe = page.locator('#snake-frame');
    await iframe.waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForFunction(() => document.getElementById('snake-frame')?.dataset.ready === '1', null, { timeout: 20000 });
    const frame = await iframe.elementHandle().then(handle => handle.contentFrame());
    assert(frame, 'Snake iframe did not expose a content frame');

    await page.locator('#start').click();
    await frame.waitForFunction(() =>
      document.getElementById('game-state')?.textContent.trim() === 'SURVIVE',
    null, { timeout: 10000 });

    // Snake starts facing right. Let the real game loop run into the right boundary;
    // this exercises the normal game-over path without injecting internal game state.
    await frame.waitForFunction(() =>
      document.getElementById('game-state')?.textContent.trim() === 'GAME OVER',
    null, { timeout: 12000 });

    const scoreText = await frame.locator('#game-score').textContent();
    const finalScore = Number.parseInt(scoreText.replace(/\D/g, ''), 10) || 0;
    assert(Number.isFinite(finalScore) && finalScore >= 0, 'Snake game did not expose a valid final score');

    await page.waitForFunction(() =>
      document.getElementById('arcade-score-status')?.textContent.includes('Saved to your Survivor profile'),
    null, { timeout: 10000 });
    await page.waitForFunction(() =>
      document.getElementById('player-progress-status')?.textContent.includes('PERSONAL PROFILE'),
    null, { timeout: 10000 });

    assert.equal(calls.start.length, 1, 'Expected exactly one authenticated game-start request');
    assert.equal(calls.start[0].authorization, 'Bearer ' + token, 'Game-start request did not use the Survivor token');
    assert.equal(calls.start[0].body.game, 'snake', 'Game-start request did not identify Snake');

    assert.equal(calls.complete.length, 1, 'Expected exactly one game-complete request');
    assert.equal(calls.complete[0].authorization, 'Bearer ' + token, 'Game-complete request did not use the Survivor token');
    assert.equal(calls.complete[0].body.receipt, 'qa-snake-session-receipt', 'Game-complete request did not include the verified receipt');
    assert.equal(calls.complete[0].body.points, finalScore, 'Game-complete request did not submit the final score');

    assert(calls.progress.some(call => call.authorization === 'Bearer ' + token),
      'Personal progress was not refreshed with the Survivor token');
    assert(calls.leaderboard.some(call => call.game === 'snake'),
      'Snake leaderboard was not refreshed after the run');
    assert.deepEqual(pageErrors, [], 'Browser runtime errors were reported');

    fs.mkdirSync(resultsDir, { recursive: true });
    await page.screenshot({ path: path.join(resultsDir, 'arcade-snake-session-save.png'), fullPage: true });
    await iframe.screenshot({ path: path.join(resultsDir, 'snake-game-over.png') });

    console.log(JSON.stringify({
      result: 'PASS',
      testMode: 'mocked Survivor API; no production account or score modified',
      gameplay: { iframeLoaded: true, gameStarted: true, normalGameOver: true, finalScore },
      persistenceHandshake: {
        authenticatedStart: calls.start.length === 1,
        verifiedReceiptForwarded: true,
        authenticatedCompletion: calls.complete.length === 1,
        completionScore: calls.complete[0].body.points,
        profileSaveStatusRendered: true,
        profileProgressRefreshed: true,
        leaderboardRefreshed: true
      },
      pageErrors
    }, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

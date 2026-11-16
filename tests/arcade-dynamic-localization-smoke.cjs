'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE_URL = process.env.SITE_URL || 'http://127.0.0.1:4173/';
const LOCALES = ['de', 'fr', 'it', 'ja', 'zh-CN', 'ru', 'tr', 'hi'];
const REQUIRED_DYNAMIC_KEYS = [
  'REGISTERED SURVIVOR',
  'REGISTRATION REQUIRED',
  'No records yet. Play, score, and claim the top spot.',
  'Records temporarily unavailable; try again shortly.',
  '● ONLINE',
  'PTS',
  'SYNC UNAVAILABLE',
  'Could not load progress.',
  'Log in to save permanent progress.',
  'Could not save score.',
  'Network error while saving score.',
  'Could not save to profile. Please log in again and replay.',
  'Guest mode: result not saved. Log in with Telegram to save scores and earn Survivor activity points.',
  'Game session could not be verified. Please replay while signed in.',
  'Saving result to your Survivor profile…',
  'Saved to your profile · best',
  'SYNCING ',
  ' · PERSONAL PROFILE',
  'BEST RESULT',
  'PERSONAL RECORD',
  'GAMES PLAYED',
  'COMPLETED RUNS',
  'TIME PLAYED',
  'TOTAL IN THIS GAME',
  'TOTAL SCORE',
  'ALL RUNS COMBINED',
];

async function waitForText(page, selector, expected) {
  await page.waitForFunction(
    ({ selector, expected }) => document.querySelector(selector)?.textContent === expected,
    { selector, expected },
    { timeout: 5000 },
  );
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const locale of LOCALES) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));

      await page.route('https://zombcash-bot.fadehost.app/**', route => {
        const url = new URL(route.request().url());
        if (url.pathname.endsWith('/api/arcade-scores')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              scores: [{ name: 'Test Survivor', source: 'registered', online: true, points: 120 }],
            }),
          });
        }
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      });

      await page.goto(new URL('arcade.html?lang=' + encodeURIComponent(locale), BASE_URL).href, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await page.waitForFunction(code =>
        window.__zombcashArcadeLanguage === code && !!window.__zombcashArcadeMap,
      locale, { timeout: 10000 });

      const map = await page.evaluate(() => window.__zombcashArcadeMap);
      for (const key of REQUIRED_DYNAMIC_KEYS) {
        assert.equal(typeof map[key], 'string', locale + ' is missing dynamic translation: ' + key);
        assert.ok(map[key].length, locale + ' has an empty dynamic translation: ' + key);
        if (!['PTS', '● ONLINE'].includes(key)) {
          assert.notEqual(map[key], key, locale + ' leaves dynamic text untranslated: ' + key);
        }
      }

      await page.waitForFunction(expected => {
        const list = document.querySelector('#leaderboard-list');
        return list && list.textContent.includes(expected);
      }, map['REGISTERED SURVIVOR'], { timeout: 10000 });
      const leaderboardText = await page.locator('#leaderboard-list').textContent();
      assert.ok(leaderboardText.includes(map['● ONLINE']), locale + ' did not translate the online record status');
      assert.ok(leaderboardText.includes(map.PTS), locale + ' did not translate the record points suffix; actual: ' + leaderboardText + '; expected suffix: ' + map.PTS);
      if (map.PTS !== 'PTS') assert.ok(!leaderboardText.includes('120 PTS'), locale + ' still displays the English points suffix; actual: ' + leaderboardText);

      const emptyRecords = map['No records yet. Play, score, and claim the top spot.'];
      await page.locator('#leaderboard-list').evaluate(el => { el.textContent = 'No records yet. Play, score, and claim the top spot.'; });
      await waitForText(page, '#leaderboard-list', emptyRecords);

      const saving = map['Saving result to your Survivor profile…'];
      await page.locator('#arcade-score-status').evaluate(el => { el.textContent = 'Saving result to your Survivor profile…'; });
      await waitForText(page, '#arcade-score-status', saving);

      const saved = map['Saved to your profile · best'] + ' 120 ' + map.PTS.toLowerCase();
      await page.locator('#arcade-score-status').evaluate(el => { el.textContent = 'Saved to your profile · best 120 pts'; });
      await waitForText(page, '#arcade-score-status', saved);

      const progressStatus = map['SYNCING '] + map['ZOMBIE BREAKER'] + '…';
      await page.locator('#player-progress-status').evaluate(el => { el.textContent = 'SYNCING ZOMBIE BREAKER…'; });
      await waitForText(page, '#player-progress-status', progressStatus);

      await page.locator('#player-progress-grid').evaluate(grid => {
        const card = document.createElement('div');
        card.className = 'player-progress-item';
        const heading = document.createElement('strong');
        const detail = document.createElement('small');
        heading.textContent = 'BEST RESULT';
        detail.textContent = 'PERSONAL RECORD';
        card.append(heading, document.createElement('b'), detail);
        grid.replaceChildren(card);
      });
      await page.waitForFunction(({ heading, detail }) => {
        const card = document.querySelector('#player-progress-grid .player-progress-item');
        return card && card.querySelector('strong')?.textContent === heading &&
          card.querySelector('small')?.textContent === detail;
      }, { heading: map['BEST RESULT'], detail: map['PERSONAL RECORD'] }, { timeout: 5000 });

      assert.deepEqual(pageErrors, [], locale + ' produced browser JavaScript errors');
      console.log('PASS: Arcade dynamic records, save statuses and personal progress (' + locale + ')');
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

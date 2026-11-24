const { chromium } = require('playwright');

const SITE_ORIGIN = 'https://zombcash.github.io';
const API_ORIGIN = 'https://zombcash-bot.fadehost.app';

async function requestFromSite(page, path, method = 'GET', body = null) {
  return page.evaluate(async ({ apiOrigin, path, method, body }) => {
    try {
      const init = {
        method,
        cache: 'no-store',
        credentials: 'omit',
        signal: AbortSignal.timeout(15000),
      };
      if (body !== null) {
        init.headers = { 'Content-Type': 'application/json' };
        init.body = JSON.stringify(body);
      }
      const response = await fetch(apiOrigin + path, init);
      const text = await response.text();
      let data = null;
      try { data = JSON.parse(text); } catch (_) {}
      return {
        resolved: true,
        status: response.status,
        type: response.type,
        ok: response.ok,
        data,
        preview: text.slice(0, 180),
      };
    } catch (error) {
      return { resolved: false, error: error.name + ': ' + error.message };
    }
  }, { apiOrigin: API_ORIGIN, path, method, body });
}

function record(name, response, expectedStatus, failures, details = {}) {
  if (!response.resolved) {
    failures.push(name + ': browser fetch failed: ' + response.error);
    return { name, result: 'FAIL', error: response.error };
  }
  if (response.type !== 'cors') {
    failures.push(name + ': expected CORS response, received ' + response.type);
    return { name, result: 'FAIL', status: response.status, type: response.type };
  }
  if (response.status !== expectedStatus) {
    failures.push(name + ': expected HTTP ' + expectedStatus + ', received ' + response.status + ' (' + response.preview + ')');
    return { name, result: 'FAIL', status: response.status, type: response.type };
  }
  return { name, result: 'PASS', status: response.status, type: response.type, ...details };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  const failures = [];
  const degraded = [];
  const results = [];

  try {
    const navigation = await page.goto(SITE_ORIGIN + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    if (!navigation || !navigation.ok()) throw new Error('Live ZombieCash site origin did not return a successful response');

    let uiSettled = false;
    try {
      await page.waitForFunction(() => {
        const settled = id => {
          const value = document.getElementById(id)?.textContent?.trim() || '';
          return value && !/CONNECTING|SCANNING|SYNCING|LOADING|WAITING FOR FIRST/i.test(value);
        };
        return settled('world-news-status') && settled('radar-status') && settled('zombcash-market-status');
      }, null, { timeout: 25000 });
      uiSettled = true;
    } catch (_) {}
    const uiSnapshot = await page.evaluate(() => ({
      newsStatus: document.getElementById('world-news-status')?.textContent?.trim() || '',
      newsItems: document.querySelectorAll('#world-news-list .world-news-item').length,
      newsEmpty: document.querySelector('#world-news-list .world-empty')?.textContent?.trim() || '',
      radarStatus: document.getElementById('radar-status')?.textContent?.trim() || '',
      radarRows: document.querySelectorAll('#radar-rows tr:not(.radar-message)').length,
      radarMessage: document.querySelector('#radar-rows .radar-message')?.textContent?.trim() || '',
      marketStatus: document.getElementById('zombcash-market-status')?.textContent?.trim() || '',
      marketPrice: document.getElementById('zombcash-price')?.textContent?.trim() || '',
    }));

    const health = await requestFromSite(page, '/health');
    results.push(record('health', health, 200, failures));
    if (health.data?.ok !== true) failures.push('health: response did not contain ok=true');

    const radar = await requestFromSite(page, '/api/radar');
    if (radar.resolved && radar.type === 'cors' && radar.status === 200 && Array.isArray(radar.data?.pairs) && radar.data.pairs.length > 0) {
      results.push({ name: 'radar', result: 'PASS', status: 200, pairs: radar.data.pairs.length, stale: Boolean(radar.data.stale) });
    } else if (radar.resolved && radar.type === 'cors' && [502, 503, 504].includes(radar.status)) {
      degraded.push('radar: upstream market source temporarily unavailable (HTTP ' + radar.status + ')');
      results.push({ name: 'radar', result: 'DEGRADED', status: radar.status, preview: radar.preview });
    } else {
      record('radar', radar, 200, failures);
    }

    const market = await requestFromSite(page, '/api/zombcash');
    if (market.resolved && market.type === 'cors' && market.status === 200 && market.data && Object.prototype.hasOwnProperty.call(market.data, 'priceUsd')) {
      const price = Number(market.data.priceUsd);
      if (Number.isFinite(price) && price > 0) {
        results.push({ name: 'zombcash-market', result: 'PASS', status: 200, hasPrice: true, stale: Boolean(market.data.stale) });
      } else {
        degraded.push('zombcash-market: endpoint responded but has no positive price');
        results.push({ name: 'zombcash-market', result: 'DEGRADED', status: 200, hasPrice: false });
      }
    } else if (market.resolved && market.type === 'cors' && [502, 503, 504].includes(market.status)) {
      degraded.push('zombcash-market: upstream price source temporarily unavailable (HTTP ' + market.status + ')');
      results.push({ name: 'zombcash-market', result: 'DEGRADED', status: market.status, preview: market.preview });
    } else {
      record('zombcash-market', market, 200, failures);
    }

    const news = await requestFromSite(page, '/api/news');
    if (news.resolved && news.type === 'cors' && news.status === 200 && Array.isArray(news.data?.articles) && news.data.articles.length > 0) {
      results.push({ name: 'news', result: 'PASS', status: 200, articles: news.data.articles.length, stale: Boolean(news.data.stale) });
    } else if (news.resolved && news.type === 'cors' && [502, 503, 504].includes(news.status)) {
      degraded.push('news: RSS providers temporarily unavailable (HTTP ' + news.status + ')');
      results.push({ name: 'news', result: 'DEGRADED', status: news.status, preview: news.preview });
    } else {
      record('news', news, 200, failures);
    }

    const leaderboard = await requestFromSite(page, '/api/arcade-scores?game=snake');
    if (leaderboard.resolved && leaderboard.type === 'cors' && leaderboard.status === 200 && Array.isArray(leaderboard.data?.scores)) {
      results.push({ name: 'snake-leaderboard', result: 'PASS', status: 200, scores: leaderboard.data.scores.length });
    } else if (leaderboard.resolved && leaderboard.type === 'cors' && [502, 503, 504].includes(leaderboard.status)) {
      degraded.push('snake-leaderboard: profile data source temporarily unavailable (HTTP ' + leaderboard.status + ')');
      results.push({ name: 'snake-leaderboard', result: 'DEGRADED', status: leaderboard.status });
    } else {
      record('snake-leaderboard', leaderboard, 200, failures);
    }

    for (const [name, path] of [
      ['profile-auth-guard', '/api/profile'],
      ['activity-auth-guard', '/api/profile/activity'],
      ['referrals-auth-guard', '/api/referrals/me'],
      ['arcade-progress-auth-guard', '/api/survival/arcade-stats'],
    ]) {
      const response = await requestFromSite(page, path);
      results.push(record(name, response, 401, failures));
    }

    const gameStartGuard = await requestFromSite(page, '/api/survival/game-start', 'POST', { game: 'snake' });
    results.push(record('game-start-auth-guard', gameStartGuard, 401, failures));

    const settingsGuard = await requestFromSite(page, '/api/profile/settings', 'POST', {
      publicDisplayName: 'QA Smoke',
      leaderboardVisible: true,
      presenceVisible: true,
    });
    results.push(record('profile-settings-auth-guard', settingsGuard, 401, failures));

    const authStart = await requestFromSite(page, '/api/auth/telegram/start', 'POST', {});
    if (authStart.resolved && authStart.type === 'cors' && authStart.status === 200 &&
        authStart.data?.ok === true && authStart.data?.nonce &&
        /^https:\/\/t\.me\/MemeCoinAIAgent_bot\?start=auth_/.test(authStart.data?.botUrl || '')) {
      results.push({ name: 'telegram-login-start', result: 'PASS', status: 200, botLink: 'valid', expiresIn: authStart.data.expiresIn });
      const status = await requestFromSite(page, '/api/auth/telegram/status?nonce=' + encodeURIComponent(authStart.data.nonce));
      if (status.resolved && status.type === 'cors' && status.status === 200 && status.data?.status === 'pending') {
        results.push({ name: 'telegram-login-pending-poll', result: 'PASS', status: 200, state: 'pending' });
      } else {
        record('telegram-login-pending-poll', status, 200, failures);
        if (status.data?.status !== 'pending') failures.push('telegram-login-pending-poll: expected pending state');
      }
    } else if (authStart.resolved && authStart.type === 'cors' && authStart.status === 429) {
      degraded.push('telegram-login-start: rate limited; no challenge was created');
      results.push({ name: 'telegram-login-start', result: 'DEGRADED', status: 429 });
    } else if (authStart.resolved && authStart.type === 'cors' && authStart.status === 503) {
      degraded.push('telegram-login-start: registration is not fully configured (HTTP 503)');
      results.push({ name: 'telegram-login-start', result: 'DEGRADED', status: 503 });
    } else {
      record('telegram-login-start', authStart, 200, failures);
    }

    const externalNewsCount = Array.isArray(news.data?.articles)
      ? news.data.articles.filter(article => article && article.enriched !== true).length
      : 0;
    const marketPriceAvailable = market.resolved && market.status === 200 &&
      Number.isFinite(Number(market.data?.priceUsd)) && Number(market.data.priceUsd) > 0;
    const radarPairCount = Array.isArray(radar.data?.pairs) ? radar.data.pairs.length : 0;
    if (!uiSettled) failures.push('homepage panels: news, radar and market statuses did not leave their loading states within 25 seconds');
    if (/FEED ERROR|API ERROR/i.test(uiSnapshot.newsStatus) && externalNewsCount > 0) {
      failures.push('homepage news panel: API returned external articles but the panel reports an error');
    }
    if (externalNewsCount > 0 && uiSnapshot.newsItems === 0) {
      failures.push('homepage news panel: external RSS articles were returned but no article cards rendered');
    } else if (externalNewsCount === 0) {
      degraded.push('homepage news panel: no external RSS articles available after excluding enriched/generated items');
    }
    if (marketPriceAvailable && (!uiSnapshot.marketPrice || uiSnapshot.marketPrice === '—')) {
      failures.push('homepage market panel: API returned a positive price but the price card did not render it');
    }
    if (radarPairCount > 0 && uiSnapshot.radarRows === 0) {
      failures.push('homepage radar panel: API returned token pairs but no radar rows rendered');
    } else if (radarPairCount === 0) {
      degraded.push('homepage radar panel: API returned no token pairs');
    }
    if (/API ERROR/i.test(uiSnapshot.radarStatus) && radarPairCount > 0) {
      failures.push('homepage radar panel: API returned pairs but the panel reports an error');
    }
    results.push({
      name: 'homepage-dynamic-panels',
      result: failures.length ? 'FAIL' : degraded.length ? 'DEGRADED' : 'PASS',
      settled: uiSettled,
      newsStatus: uiSnapshot.newsStatus,
      newsItems: uiSnapshot.newsItems,
      radarStatus: uiSnapshot.radarStatus,
      radarRows: uiSnapshot.radarRows,
      marketStatus: uiSnapshot.marketStatus,
      marketPrice: uiSnapshot.marketPrice,
    });

    const report = {
      result: failures.length ? 'FAIL' : degraded.length ? 'DEGRADED' : 'PASS',
      origin: SITE_ORIGIN,
      apiOrigin: API_ORIGIN,
      checkedAt: new Date().toISOString(),
      results,
      homepage: uiSnapshot,
      degraded,
      failures,
      note: 'Live public endpoints and unauthenticated security guards were checked from the real site origin. Telegram completion and authenticated profile writes were not attempted.',
    };
    console.log(JSON.stringify(report, null, 2));
    if (process.env.GITHUB_STEP_SUMMARY) {
      const fs = require('node:fs');
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
        '## Live FadeHost API smoke\n\n' +
        '- Result: **' + report.result + '**\n' +
        '- Endpoints checked: ' + results.length + '\n' +
        '- Degraded upstreams: ' + degraded.length + '\n' +
        '- Failures: ' + failures.length + '\n\n' +
        results.map(item => '- ' + item.name + ': **' + item.result + '**' + (item.status ? ' (HTTP ' + item.status + ')' : '')).join('\n') +
        (degraded.length ? '\n\n### Degraded\n' + degraded.map(x => '- ' + x).join('\n') : '') +
        (failures.length ? '\n\n### Failures\n' + failures.map(x => '- ' + x).join('\n') : '') + '\n'
      );
    }
    if (failures.length) process.exitCode = 1;
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

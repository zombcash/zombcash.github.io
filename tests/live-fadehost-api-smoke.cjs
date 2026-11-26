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
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__zombcashLayoutShifts = [];
    try {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.hadRecentInput) continue;
          window.__zombcashLayoutShifts.push({
            value: entry.value,
            startTime: Math.round(entry.startTime),
            sources: (entry.sources || []).map(source => ({
              tag: source.node?.tagName || '',
              id: source.node?.id || '',
              className: typeof source.node?.className === 'string' ? source.node.className.slice(0, 120) : '',
              previousRect: source.previousRect ? { x: source.previousRect.x, y: source.previousRect.y, width: source.previousRect.width, height: source.previousRect.height } : null,
              currentRect: source.currentRect ? { x: source.currentRect.x, y: source.currentRect.y, width: source.currentRect.width, height: source.currentRect.height } : null,
            })),
          });
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
      window.__zombcashLayoutShiftObserver = observer;
    } catch (error) {
      window.__zombcashLayoutShiftObserverError = error.message;
    }
  });
  const failures = [];
  const degraded = [];
  const results = [];
  const tvEpisodeResponses = [];
  page.on('response', response => {
    try {
      const url = new URL(response.url());
      if (url.hostname === new URL(API_ORIGIN).hostname && url.pathname === '/api/tv/episodes') {
        tvEpisodeResponses.push(response);
      }
    } catch (_) {}
  });

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

    // The TV archive is intentionally lazy-loaded only after the visitor
    // selects ARCHIVE. Trigger that real interaction before classifying the
    // episode endpoint; absence of an initial request on page load is expected.
    const archiveModeButton = page.locator('#zctv-channel-hub [data-zctv-mode="archive"]');
    await archiveModeButton.waitFor({ state: 'visible', timeout: 15000 });
    const archiveResponsePromise = page.waitForResponse(response => {
      const url = new URL(response.url());
      return url.hostname === new URL(API_ORIGIN).hostname && url.pathname === '/api/tv/episodes';
    }, { timeout: 15000 }).catch(() => null);
    await archiveModeButton.click();
    await archiveResponsePromise;
    if (await archiveModeButton.getAttribute('aria-pressed') !== 'true') {
      failures.push('tv-episode-archive: selecting ARCHIVE did not update aria-pressed');
    }

    // Exercise the homepage Meme Radar refresh control and its time-period tabs.
    const aiRadarRefreshButton = page.locator('#zombie-radar-ai-refresh');
    await aiRadarRefreshButton.waitFor({ state: 'visible', timeout: 15000 });
    const radarRefreshResponsePromise = page.waitForResponse(response => {
      const url = new URL(response.url());
      return url.hostname === new URL(API_ORIGIN).hostname && url.pathname === '/api/radar';
    }, { timeout: 15000 });
    await aiRadarRefreshButton.click();
    const radarRefreshResponse = await radarRefreshResponsePromise;
    let radarRefreshPayload = null;
    try { radarRefreshPayload = await radarRefreshResponse.json(); } catch (_) {}
    if (!radarRefreshResponse.ok() || !Array.isArray(radarRefreshPayload?.pairs) || !radarRefreshPayload.pairs.length) {
      failures.push('homepage Meme Radar refresh: expected a successful non-empty /api/radar response');
    }
    await page.waitForFunction(() => {
      const state = document.getElementById('zombie-radar-ai-state')?.textContent?.trim() || '';
      return /RADAR ONLINE|STALE FEED|NO PICKS/.test(state);
    }, null, { timeout: 15000 });
    const aiRadarSnapshot = await page.evaluate(() => ({
      state: document.getElementById('zombie-radar-ai-state')?.textContent?.trim() || '',
      picks: document.querySelectorAll('#zombie-radar-ai-list .zrai-pick').length
    }));
    if (!aiRadarSnapshot.picks) failures.push('homepage Meme Radar refresh: no ranked token cards rendered');
    const oneHourPeriod = page.locator('[data-radar-period="h1"]');
    await oneHourPeriod.click();
    if (await oneHourPeriod.getAttribute('aria-pressed') !== 'true') {
      failures.push('homepage Meme Radar: selecting 1 HOUR did not update aria-pressed');
    }
    results.push({
      name: 'homepage-meme-radar-refresh',
      result: 'PASS',
      status: radarRefreshResponse.status,
      pairs: radarRefreshPayload.pairs.length,
      renderedPicks: aiRadarSnapshot.picks,
      oneHourControl: await oneHourPeriod.getAttribute('aria-pressed')
    });

    const tvResponse = tvEpisodeResponses[0];
    if (tvResponse) {
      const tvStatus = tvResponse.status();
      const tvHeaders = await tvResponse.allHeaders();
      let tvPayload = null;
      try { tvPayload = await tvResponse.json(); } catch (_) {}
      if (tvStatus === 200 && Array.isArray(tvPayload?.episodes) &&
          tvHeaders['access-control-allow-origin'] === SITE_ORIGIN) {
        results.push({ name: 'tv-episode-archive', result: 'PASS', status: 200, episodes: tvPayload.episodes.length });
      } else if (tvStatus === 429) {
        degraded.push('tv-episode-archive: rate limited (HTTP 429); the player will show its offline fallback');
        results.push({ name: 'tv-episode-archive', result: 'DEGRADED', status: 429 });
      } else if ([502, 503, 504].includes(tvStatus)) {
        degraded.push('tv-episode-archive: temporary upstream failure (HTTP ' + tvStatus + ')');
        results.push({ name: 'tv-episode-archive', result: 'DEGRADED', status: tvStatus });
      } else {
        failures.push('tv-episode-archive: expected HTTP 200 JSON with CORS, received HTTP ' + tvStatus);
        results.push({ name: 'tv-episode-archive', result: 'FAIL', status: tvStatus });
      }
    } else {
      degraded.push('tv-episode-archive: no episode-list response was observed after selecting ARCHIVE');
      results.push({ name: 'tv-episode-archive', result: 'UNVERIFIED' });
    }

    const health = await requestFromSite(page, '/health');
    results.push(record('health', health, 200, failures));
    if (health.data?.ok !== true) failures.push('health: response did not contain ok=true');

    const assistantStatus = await requestFromSite(page, '/api/assistant/status');
    if (assistantStatus.resolved && assistantStatus.type === 'cors' && assistantStatus.status === 200 && assistantStatus.data) {
      const updatedAt = Number(assistantStatus.data.updated_at);
      const hasSuccess = Number.isFinite(updatedAt) && updatedAt > 0;
      const ageSeconds = hasSuccess ? Math.max(0, Math.floor(Date.now() / 1000 - updatedAt)) : null;
      const state = !hasSuccess ? 'UNVERIFIED' : ageSeconds > 300 ? 'STALE' : 'PASS';
      results.push({
        name: 'assistant-status',
        result: state,
        status: 200,
        model: assistantStatus.data.model || assistantStatus.data.configured_primary || assistantStatus.data.configured_fallback || 'Not reported',
        lastSuccessAgeSeconds: ageSeconds
      });
      if (state !== 'PASS') degraded.push('assistant provider status: ' + state.toLowerCase() + (ageSeconds === null ? ' — no successful response recorded' : ' — last success was ' + ageSeconds + ' seconds ago'));
    } else {
      record('assistant-status', assistantStatus, 200, failures);
    }

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
    // Keep the homepage panel verdict independent from unrelated API checks
    // such as assistant-provider freshness or authenticated-route guards.
    const panelFailures = [];
    const panelDegraded = [];
    const failPanel = message => { panelFailures.push(message); failures.push(message); };
    const degradePanel = message => { panelDegraded.push(message); degraded.push(message); };
    if (!uiSettled) failPanel('homepage panels: news, radar and market statuses did not leave their loading states within 25 seconds');
    if (/FEED ERROR|API ERROR/i.test(uiSnapshot.newsStatus) && externalNewsCount > 0) {
      failPanel('homepage news panel: API returned external articles but the panel reports an error');
    }
    if (externalNewsCount > 0 && uiSnapshot.newsItems === 0) {
      failPanel('homepage news panel: external RSS articles were returned but no article cards rendered');
    } else if (externalNewsCount === 0) {
      degradePanel('homepage news panel: no external RSS articles available after excluding enriched/generated items');
    }
    if (marketPriceAvailable && (!uiSnapshot.marketPrice || uiSnapshot.marketPrice === '—')) {
      failPanel('homepage market panel: API returned a positive price but the price card did not render it');
    }
    if (radarPairCount > 0 && uiSnapshot.radarRows === 0) {
      failPanel('homepage radar panel: API returned token pairs but no radar rows rendered');
    } else if (radarPairCount === 0) {
      degradePanel('homepage radar panel: API returned no token pairs');
    }
    if (/API ERROR/i.test(uiSnapshot.radarStatus) && radarPairCount > 0) {
      failPanel('homepage radar panel: API returned pairs but the panel reports an error');
    }
    results.push({
      name: 'homepage-dynamic-panels',
      result: panelFailures.length ? 'FAIL' : panelDegraded.length ? 'DEGRADED' : 'PASS',
      panelFailures,
      panelDegraded,
      settled: uiSettled,
      newsStatus: uiSnapshot.newsStatus,
      newsItems: uiSnapshot.newsItems,
      radarStatus: uiSnapshot.radarStatus,
      radarRows: uiSnapshot.radarRows,
      marketStatus: uiSnapshot.marketStatus,
      marketPrice: uiSnapshot.marketPrice,
    });

    const layoutShiftDiagnostics = await page.evaluate(() => {
      const entries = window.__zombcashLayoutShifts || [];
      return {
        totalValue: Number(entries.reduce((sum, entry) => sum + entry.value, 0).toFixed(4)),
        entries: entries.slice().sort((a, b) => b.value - a.value).slice(0, 12),
        observerError: window.__zombcashLayoutShiftObserverError || null,
      };
    });
    const report = {
      result: failures.length ? 'FAIL' : degraded.length ? 'DEGRADED' : 'PASS',
      origin: SITE_ORIGIN,
      apiOrigin: API_ORIGIN,
      checkedAt: new Date().toISOString(),
      results,
      homepage: uiSnapshot,
      mobileLayoutShiftDiagnostics: layoutShiftDiagnostics,
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

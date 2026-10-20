/* Independent recovery for live ZombieCash market + Living World panels.
   Runs only when the legacy script did not initialize these panels. */
(() => {
  'use strict';
  const API = 'https://zombcash-bot.fadehost.app';
  const byId = id => document.getElementById(id);
  const newsList = byId('world-news-list');
  const newsStatus = byId('world-news-status');
  const newsUpdated = byId('world-news-updated');
  const alertList = byId('world-alert-list');
  const alertStatus = byId('world-alarm-status');
  const marketRoot = byId('zombcash-market');

  // The legacy script sets this synchronously before its first request.
  // If it already started, don't duplicate its timers or requests.
  const needsWorldRecovery = !!(
    (newsStatus && /CONNECTING/i.test(newsStatus.textContent || '')) ||
    (alertStatus && /SCANNING/i.test(alertStatus.textContent || ''))
  );
  const needsMarketRecovery = !!(marketRoot && byId('zombcash-market-status') &&
    /CONNECTING|LOADING|SCANNING/i.test(byId('zombcash-market-status').textContent || ''));

  const request = async (path, timeout = 10000) => {
    const response = await fetch(API + path, {
      cache: 'no-store',
      signal: AbortSignal.timeout(timeout)
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return response.json();
  };
  const node = (tag, cls, value) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (value != null) el.textContent = value;
    return el;
  };
  const priceText = value => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return '—';
    if (n >= 1) return '$' + n.toLocaleString('en-US', {maximumFractionDigits: 5});
    if (n >= .01) return '$' + n.toFixed(5);
    if (n >= .0001) return '$' + n.toFixed(7);
    return '$' + n.toPrecision(4);
  };
  const money = value => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return '—';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + n.toFixed(2);
  };

  async function loadNews() {
    if (!newsList || !newsStatus) return;
    newsStatus.textContent = 'SYNCING RSS';
    try {
      const data = await request('/api/news');
      const articles = Array.isArray(data.articles) ? data.articles : [];
      if (!articles.length) throw new Error('API returned no articles');
      newsList.replaceChildren();
      articles.slice(0, 7).forEach(article => {
        const item = node('article', 'world-news-item');
        const meta = node('div', 'world-news-meta');
        meta.append(node('span', 'world-news-source', article.source || 'OUTBREAK WIRE'));
        const published = article.published ? new Date(article.published) : null;
        meta.append(node('span', 'world-news-age', published && !Number.isNaN(published.getTime())
          ? published.toLocaleString('en-US', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})
          : 'LATEST'));
        const link = node('a', 'world-news-title', article.title || 'Untitled transmission');
        link.href = article.link || '#';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        item.append(meta, link);
        if (article.summary) item.append(node('p', 'world-news-summary', article.summary));
        newsList.append(item);
      });
      newsStatus.textContent = data.stale ? 'LAST KNOWN FEED' : 'RSS FEED ONLINE';
      if (newsUpdated) newsUpdated.textContent = 'UPDATED ' + new Date().toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'});
    } catch (error) {
      console.warn('Living World recovery: news feed failed', error);
      newsStatus.textContent = 'FEED ERROR · ' + String(error.message || 'REQUEST FAILED').slice(0, 45);
      if (newsUpdated) newsUpdated.textContent = 'AUTOMATIC RETRY ENABLED';
      if (!newsList.querySelector('.world-news-item')) {
        newsList.replaceChildren(node('p', 'world-empty', 'News API could not be reached from this browser. Check connection/CORS and retry.'));
      }
    }
  }

  async function loadAlarms() {
    if (!alertList || !alertStatus) return;
    try {
      const data = await request('/api/zombcash');
      const change = Number(data.priceChange && data.priceChange.h24);
      const changeText = Number.isFinite(change) ? ((change > 0 ? '+' : '') + change.toFixed(2) + '% in 24h') : '24h change unavailable';
      const volume = data.volume && data.volume.h24 != null ? money(data.volume.h24) : 'volume unavailable';
      alertList.replaceChildren();
      const item = node('div', 'world-alert');
      item.append(node('span', 'alert-icon', '◉'));
      const body = node('div', '');
      body.append(node('strong', '', 'ZOMBCASH MARKET'));
      body.append(node('p', '', 'Price ' + priceText(data.priceUsd) + ' · ' + changeText + ' · 24h volume ' + volume));
      item.append(body, node('span', 'alert-level', data.stale ? 'CACHED' : 'LIVE'));
      alertList.append(item);
      alertStatus.textContent = data.stale ? 'LAST KNOWN DATA' : 'MARKET ONLINE';
    } catch (error) {
      console.warn('Living World recovery: market alarms failed', error);
      alertStatus.textContent = 'MARKET API ERROR';
      if (!alertList.children.length) {
        alertList.replaceChildren(node('p', 'world-empty', 'Market endpoint could not be reached from this browser.'));
      }
    }
  }

  async function loadMarketCard() {
    if (!marketRoot) return;
    const status = byId('zombcash-market-status');
    try {
      const data = await request('/api/zombcash', 12000);
      if (byId('zombcash-price')) byId('zombcash-price').textContent = priceText(data.priceUsd);
      const change = Number(data.priceChange && data.priceChange.h24);
      if (byId('zombcash-change')) {
        byId('zombcash-change').textContent = Number.isFinite(change) ? ((change > 0 ? '+' : '') + change.toFixed(2) + '%') : '—';
        byId('zombcash-change').className = change > 0 ? 'change-up' : change < 0 ? 'change-down' : '';
      }
      if (byId('zombcash-volume')) byId('zombcash-volume').textContent = money(data.volume && data.volume.h24);
      if (byId('zombcash-liquidity')) byId('zombcash-liquidity').textContent = money(data.liquidity && data.liquidity.usd);
      if (byId('zombcash-cap')) byId('zombcash-cap').textContent = money(data.marketCap || data.fdv);
      if (status) status.textContent = data.stale ? 'LAST KNOWN DATA' : 'TOKEN FEED ONLINE';
      const updated = byId('zombcash-market-updated');
      if (updated) updated.textContent = 'SOURCE UPDATED ' + new Date().toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'});
    } catch (error) {
      console.warn('ZombieCash market recovery failed', error);
      if (status) status.textContent = 'API ERROR';
      const updated = byId('zombcash-market-updated');
      if (updated) updated.textContent = String(error.message || 'REQUEST FAILED').slice(0, 70);
    }
  }

  if (needsWorldRecovery) {
    loadNews();
    loadAlarms();
    window.setInterval(loadNews, 300000);
    window.setInterval(loadAlarms, 60000);
  }
  if (needsMarketRecovery) {
    loadMarketCard();
    window.setInterval(loadMarketCard, 45000);
  }
})();
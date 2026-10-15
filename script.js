const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.topbar nav');
menu?.addEventListener('click', () => nav.classList.toggle('open'));
nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

// Demo-only outbreak indicator. Clearly labelled as simulated, not live market data.
const chaos = 68;
document.getElementById('chaos-value').textContent = `${chaos}%`;
document.getElementById('meter-fill').style.width = `${chaos}%`;
const phases = [
  ['THE DEAD ARE WALKING', 'The city is quiet. Your next move doesn’t have to be.'],
  ['SIGNAL IN THE STATIC', 'A new transmission is somewhere out there. Stay curious.'],
  ['OUTBREAK LEVEL: UNDEAD', 'The apocalypse is a mood. Keep your head on straight.']
];
let phase = 0;
setInterval(() => {
  phase = (phase + 1) % phases.length;
  document.getElementById('outbreak-status').textContent = phases[phase][0];
  document.getElementById('outbreak-message').textContent = phases[phase][1];
}, 6500);

const ca = '6cCBF9gtyp3c6VmyxUWzETk3yFmxhjvPm15cxicfpump';
document.getElementById('copy-ca').addEventListener('click', async () => {
  const feedback = document.getElementById('copy-feedback');
  try {
    await navigator.clipboard.writeText(ca);
    feedback.textContent = 'CONTRACT COPIED TO CLIPBOARD.';
  } catch {
    const input = document.createElement('textarea');
    input.value = ca; document.body.appendChild(input); input.select();
    const ok = document.execCommand('copy'); input.remove();
    feedback.textContent = ok ? 'CONTRACT COPIED TO CLIPBOARD.' : 'SELECT AND COPY THE CONTRACT ADDRESS ABOVE.';
  }
});

const start = document.getElementById('start-game');
const action = document.getElementById('game-action');
const gameMessage = document.getElementById('game-message');
const gameState = document.getElementById('game-state');
const scoreEl = document.getElementById('game-score');
const screen = document.getElementById('game-screen');
let gameTimer = null, gameStart = 0, score = 0, active = false, ready = false;
function resetGame() {
  clearTimeout(gameTimer); active = false; ready = false; score = 0;
  window.lastSurvivalMs = null;
  const submitScoreButton = document.getElementById('submit-survival-score');
  if (submitScoreButton) submitScoreButton.disabled = true;
  scoreEl.textContent = '000'; gameState.textContent = 'STANDBY';
  gameMessage.textContent = 'PRESS START TO INITIALIZE'; action.textContent = 'INITIALIZE';
  action.disabled = false; action.style.opacity = '1'; screen.style.background = '';
}
function beginGame() {
  resetGame(); active = true; gameState.textContent = 'WAIT FOR GREEN';
  gameMessage.textContent = 'WAIT FOR THE SIGNAL...'; action.textContent = 'WAIT...';
  action.disabled = true; action.style.opacity = '.45';
  const delay = 1100 + Math.random() * 3000;
  gameTimer = setTimeout(() => {
    if (!active) return;
    ready = true; gameStart = performance.now(); gameState.textContent = 'SIGNAL LIVE';
    gameMessage.textContent = 'CLICK NOW, SURVIVOR!'; action.textContent = 'STRIKE!';
    action.disabled = false; action.style.opacity = '1';
    screen.style.background = 'radial-gradient(ellipse at center,#285c28,#08120d 68%)';
  }, delay);
}
action.addEventListener('click', () => {
  if (!active) { beginGame(); return; }
  if (!ready) {
    clearTimeout(gameTimer); active = false; gameState.textContent = 'TOO EARLY';
    gameMessage.textContent = 'YOU PANICKED. TRY AGAIN.'; action.textContent = 'RETRY';
    action.disabled = false; action.style.opacity = '1'; return;
  }
  const ms = Math.round(performance.now() - gameStart);
  score = Math.max(0, 1000 - ms); scoreEl.textContent = String(score).padStart(3, '0');
  gameState.textContent = `${ms} MS`; gameMessage.textContent = ms < 280 ? 'LEGENDARY REFLEXES.' : ms < 420 ? 'NICE SURVIVAL, ZOMBIE.' : 'THE HORDE WAS CLOSE.';
  action.textContent = 'PLAY AGAIN'; active = false; ready = false; screen.style.background = '';
  window.lastSurvivalMs = ms;
  const submitScoreButton = document.getElementById('submit-survival-score');
  const submitScoreStatus = document.getElementById('score-submit-status');
  if (submitScoreButton) submitScoreButton.disabled = false;
  if (submitScoreStatus) submitScoreStatus.textContent = 'Reaction time: ' + ms + ' ms. Save your record to the community board.';
});
start.addEventListener('click', () => { beginGame(); document.getElementById('game-screen').scrollIntoView({behavior:'smooth',block:'center'}); });

// Live Solana Radar: public DexScreener API, no API key required.
const radarRows = document.getElementById('radar-rows');
const radarStatus = document.getElementById('radar-status');
const radarUpdated = document.getElementById('radar-updated');
const radarSearch = document.getElementById('radar-search');
const radarRefresh = document.getElementById('radar-refresh');
const radarFilters = [...document.querySelectorAll('.radar-filter')];
let radarTokens = [];
let radarMode = 'hot';
let radarBusy = false;
let lastRadarSuccess = 0;

const money = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toFixed(2);
};
const price = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 1) return '$' + n.toLocaleString('en-US', {maximumFractionDigits: 3});
  if (n >= 0.01) return '$' + n.toFixed(4);
  if (n >= 0.0001) return '$' + n.toFixed(6);
  return '$' + n.toPrecision(3);
};
const pct = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '<span>—</span>';
  const cls = n > 0 ? 'change-up' : n < 0 ? 'change-down' : '';
  return '<span class="' + cls + '">' + (n > 0 ? '+' : '') + n.toFixed(2) + '%</span>';
};
function renderRadar() {
  const query = (radarSearch?.value || '').trim().toLowerCase();
  let list = radarTokens.filter(t => {
    const name = (t.baseToken?.name || '').toLowerCase();
    const symbol = (t.baseToken?.symbol || '').toLowerCase();
    const address = (t.baseToken?.address || '').toLowerCase();
    return !query || name.includes(query) || symbol.includes(query) || address.includes(query);
  });
  if (radarMode === 'volume') list.sort((a,b) => Number(b.volume?.h24 || 0) - Number(a.volume?.h24 || 0));
  else if (radarMode === 'gainers') list.sort((a,b) => Number(b.priceChange?.h1 || 0) - Number(a.priceChange?.h1 || 0));
  else list.sort((a,b) => (Number(b.boosts?.active || 0) * 1e12 + Number(b.volume?.h24 || 0) + Number(b.liquidity?.usd || 0)) - (Number(a.boosts?.active || 0) * 1e12 + Number(a.volume?.h24 || 0) + Number(a.liquidity?.usd || 0)));
  if (!list.length) {
    radarRows.innerHTML = '<tr><td colspan="6" class="radar-message">' + (radarTokens.length ? 'No tokens match that search.' : 'No live token data available right now. Try refreshing in a moment.') + '</td></tr>';
    return;
  }
  radarRows.innerHTML = list.slice(0,12).map(t => {
    const icon = t.info?.imageUrl || '';
    const name = t.baseToken?.name || 'Unknown token';
    const symbol = t.baseToken?.symbol || '—';
    const tokenAddress = t.baseToken?.address || '';
    const safeIcon = /^https:\/\//i.test(icon) ? icon : '';
    const fallback = '☣';
    const img = safeIcon ? '<img class="token-icon" loading="lazy" src="' + safeIcon.replace(/"/g, '&quot;') + '" alt="" onerror="this.style.display=\'none\'">' : '<span class="token-icon token-fallback">' + fallback + '</span>';
    return '<tr><td><div class="token-cell">' + img + '<div><span class="token-name" title="' + name.replace(/"/g,'&quot;') + '">' + name.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</span><span class="token-symbol">' + symbol.replace(/</g,'&lt;').replace(/>/g,'&gt;') + (t.boosts?.isBoosted ? ' · ⚡ BOOSTED' : '') + '</span></div></div></td><td class="token-price">' + price(t.priceUsd) + '</td><td>' + pct(t.priceChange?.h1) + '</td><td>' + money(t.volume?.h24) + '</td><td>' + money(t.liquidity?.usd) + '</td><td><a class="pair-link" href="' + (t.url || 'https://dexscreener.com/solana') + '" target="_blank" rel="noopener noreferrer">VIEW ↗</a></td></tr>';
  }).join('');
}
async function loadRadar(force = false) {
  if (radarBusy) return;
  if (!force && lastRadarSuccess && Date.now() - lastRadarSuccess < 55000) return;
  radarBusy = true;
  if (radarStatus) radarStatus.textContent = 'SCANNING SOLANA';
  if (radarRefresh) { radarRefresh.disabled = true; radarRefresh.textContent = '↻ SCANNING'; }
  try {
    const response = await fetch('https://zombcash-bot.fadehost.app/api/radar', {cache:'no-store'});
    if (!response.ok) throw new Error('Radar API returned HTTP ' + response.status);
    const payload = await response.json();
    if (!Array.isArray(payload.pairs)) throw new Error(payload.error || 'Radar API returned an invalid response');
    radarTokens = payload.pairs;
    if (!radarTokens.length) throw new Error('No detailed Solana pairs returned');
    lastRadarSuccess = Date.now();
    renderRadar();
    const sourceUpdatedAt = Number(payload.updatedAt || 0) * 1000;
    const sourceTime = sourceUpdatedAt ? new Date(sourceUpdatedAt).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'}) : 'UNKNOWN';
    if (payload.stale) {
      if (radarStatus) radarStatus.textContent = 'STALE DATA — RETRYING';
      if (radarUpdated) radarUpdated.textContent = 'LAST SOURCE UPDATE ' + sourceTime;
    } else {
      if (radarStatus) radarStatus.textContent = 'RADAR ONLINE';
      if (radarUpdated) radarUpdated.textContent = 'SOURCE UPDATED ' + sourceTime;
    }
  } catch (error) {
    console.warn('ZombieCash Radar update failed:', error);
    if (!radarTokens.length && radarRows) radarRows.innerHTML = '<tr><td colspan="6" class="radar-message">RADAR SIGNAL UNAVAILABLE. Check your connection or refresh shortly. <br><small>Data is supplied by DexScreener; temporary API limits or browser restrictions can interrupt the feed.</small></td></tr>';
    if (radarStatus) radarStatus.textContent = radarTokens.length ? 'SHOWING LAST SIGNAL' : 'SIGNAL INTERRUPTED';
    if (radarUpdated && !lastRadarSuccess) radarUpdated.textContent = 'RETRY AVAILABLE';
  } finally {
    radarBusy = false;
    if (radarRefresh) { radarRefresh.disabled = false; radarRefresh.textContent = '↻ REFRESH'; }
  }
}
radarFilters.forEach(button => button.addEventListener('click', () => {
  radarMode = button.dataset.filter || 'hot';
  radarFilters.forEach(item => item.classList.toggle('active', item === button));
  renderRadar();
}));
radarSearch?.addEventListener('input', renderRadar);
radarRefresh?.addEventListener('click', () => loadRadar(true));
if (radarRows) {
  loadRadar(true);
  setInterval(() => loadRadar(true), 45000);
}


// ZombieCash project token market card, served by the shared FadeHost API.
const zomMarket = document.getElementById('zombcash-market');
if (zomMarket) {
  const zomPrice = document.getElementById('zombcash-price');
  const zomChange = document.getElementById('zombcash-change');
  const zomVolume = document.getElementById('zombcash-volume');
  const zomLiquidity = document.getElementById('zombcash-liquidity');
  const zomCap = document.getElementById('zombcash-cap');
  const zomStatus = document.getElementById('zombcash-market-status');
  const zomUpdated = document.getElementById('zombcash-market-updated');
  const zomRefresh = document.getElementById('zombcash-market-refresh');
  let zomBusy = false;
  const zomMoney = value => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return '—';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + n.toFixed(2);
  };
  const zomPriceText = value => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return '—';
    if (n >= 1) return '$' + n.toLocaleString('en-US', {maximumFractionDigits: 5});
    if (n >= .01) return '$' + n.toFixed(5);
    if (n >= .0001) return '$' + n.toFixed(7);
    return '$' + n.toPrecision(4);
  };
  async function loadZomMarket() {
    if (zomBusy) return;
    zomBusy = true;
    if (zomStatus) zomStatus.textContent = 'SCANNING TOKEN…';
    if (zomRefresh) zomRefresh.disabled = true;
    try {
      const response = await fetch('https://zombcash-bot.fadehost.app/api/zombcash', {cache:'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      zomPrice.textContent = zomPriceText(data.priceUsd);
      const change = Number(data.priceChange?.h24);
      zomChange.textContent = Number.isFinite(change) ? (change > 0 ? '+' : '') + change.toFixed(2) + '%' : '—';
      zomChange.className = Number.isFinite(change) && change > 0 ? 'change-up' : Number.isFinite(change) && change < 0 ? 'change-down' : '';
      zomVolume.textContent = zomMoney(data.volume?.h24);
      zomLiquidity.textContent = zomMoney(data.liquidity?.usd);
      zomCap.textContent = zomMoney(data.marketCap || data.fdv);
      const sourceTime = Number(data.updatedAt || 0) * 1000;
      if (zomStatus) zomStatus.textContent = data.stale ? 'LAST KNOWN DATA' : 'TOKEN FEED ONLINE';
      if (zomUpdated) zomUpdated.textContent = (data.stale ? 'LAST SOURCE UPDATE ' : 'SOURCE UPDATED ') + (sourceTime ? new Date(sourceTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) : 'UNKNOWN');
    } catch (error) {
      console.warn('ZombieCash token market update failed:', error);
      if (zomStatus) zomStatus.textContent = 'SIGNAL UNAVAILABLE';
      if (zomUpdated) zomUpdated.textContent = 'TRY REFRESHING SHORTLY';
    } finally {
      zomBusy = false;
      if (zomRefresh) zomRefresh.disabled = false;
    }
  }
  zomRefresh?.addEventListener('click', loadZomMarket);
  loadZomMarket();
  setInterval(loadZomMarket, 45000);
}


// Living World: shared RSS news, live token alarms, daily missions and community events.
(() => {
  const apiBase = 'https://zombcash-bot.fadehost.app';
  const newsList = document.getElementById('world-news-list');
  const newsStatus = document.getElementById('world-news-status');
  const newsUpdated = document.getElementById('world-news-updated');
  const alertList = document.getElementById('world-alert-list');
  const alertStatus = document.getElementById('world-alarm-status');
  const missionList = document.getElementById('world-missions');
  const missionCount = document.getElementById('world-mission-count');
  const missionDate = document.getElementById('world-mission-date');
  if (!newsList || !alertList || !missionList) return;

  const safeDate = value => {
    const parsed = Date.parse(value || '');
    if (!Number.isFinite(parsed)) return 'LATEST';
    const age = Math.max(0, Date.now() - parsed);
    if (age < 3600000) return Math.max(1, Math.round(age / 60000)) + ' MIN AGO';
    if (age < 86400000) return Math.round(age / 3600000) + ' H AGO';
    return new Date(parsed).toLocaleDateString('en-US', {month:'short',day:'numeric'});
  };
  const makeNode = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  async function loadWorldNews() {
    if (newsStatus) newsStatus.textContent = 'SYNCING RSS';
    try {
      const response = await fetch(apiBase + '/api/news', {cache:'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      const articles = Array.isArray(data.articles) ? data.articles : [];
      if (!articles.length) throw new Error('No articles in RSS response');
      newsList.replaceChildren();
      articles.slice(0, 7).forEach(article => {
        const link = document.createElement('a');
        link.className = 'world-news-item';
        link.href = /^https?:\/\//i.test(article.link || '') ? article.link : '#living-world';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        const meta = makeNode('span', 'world-news-meta');
        meta.append(makeNode('span', '', article.source || 'RSS TRANSMISSION'));
        meta.append(makeNode('time', '', safeDate(article.published)));
        link.append(meta, makeNode('strong', 'world-news-title', article.title || 'Untitled transmission'));
        if (article.summary) link.append(makeNode('p', 'world-news-summary', article.summary));
        newsList.append(link);
      });
      if (newsStatus) newsStatus.textContent = data.stale ? 'LAST KNOWN FEED' : 'RSS FEED ONLINE';
      if (newsUpdated) newsUpdated.textContent = 'UPDATED ' + new Date(Number(data.updatedAt || Date.now()/1000)*1000).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
    } catch (error) {
      console.warn('Living World RSS unavailable:', error);
      if (newsStatus) newsStatus.textContent = 'SIGNAL INTERRUPTED';
      if (!newsList.querySelector('.world-news-item')) {
        newsList.replaceChildren(makeNode('p', 'world-empty', 'The RSS frequencies are quiet right now. The feed will retry automatically.'));
      }
      if (newsUpdated) newsUpdated.textContent = 'RETRYING AUTOMATICALLY';
    }
  }

  function renderAlarms(market, error) {
    const alerts = [];
    if (error || !market) {
      alerts.push({level:'warn', icon:'⚠', title:'MARKET CONNECTION', message:'Could not confirm the latest $ZOMBCASH snapshot. The API will retry.', badge:'RETRYING'});
    } else {
      const change = Number(market.priceChange?.h24);
      const volume = Number(market.volume?.h24);
      if (market.stale) alerts.push({level:'warn', icon:'⚠', title:'STALE MARKET SNAPSHOT', message:'The source could not refresh; showing the last known data.', badge:'STALE'});
      if (Number.isFinite(change) && change >= 10) alerts.push({level:'warn', icon:'↗', title:'PRICE SURGE WATCH', message:'$ZOMBCASH is up ' + change.toFixed(2) + '% over 24h. Check liquidity and volatility before acting.', badge:'VOLATILE'});
      else if (Number.isFinite(change) && change <= -10) alerts.push({level:'danger', icon:'↘', title:'DOWNSIDE ALERT', message:'$ZOMBCASH is down ' + Math.abs(change).toFixed(2) + '% over 24h. Review market conditions carefully.', badge:'HIGH VOLATILITY'});
      if (Number.isFinite(volume) && volume >= 10000) alerts.push({level:'', icon:'◉', title:'VOLUME ACTIVITY', message:'24h trading volume has reached ' + '$' + volume.toLocaleString('en-US',{maximumFractionDigits:0}) + '.', badge:'OBSERVE'});
      if (!alerts.length) alerts.push({level:'', icon:'◉', title:'NO CRITICAL PRICE ALERTS', message:'No ±10% 24h move detected in the latest snapshot. Stay curious, not careless.', badge:'MONITORING'});
      alerts.push({level:'', icon:'⌁', title:'SOLANA RADAR', message:'Use the live radar to inspect other boosted tokens and compare liquidity.', badge:'LIVE'});
    }
    alertList.replaceChildren();
    alerts.forEach(alert => {
      const row = makeNode('div', 'world-alert' + (alert.level ? ' alert-' + alert.level : ''));
      row.append(makeNode('span', 'alert-icon', alert.icon));
      const body = makeNode('div', '');
      body.append(makeNode('strong', '', alert.title), makeNode('p', '', alert.message));
      row.append(body, makeNode('span', 'alert-level', alert.badge));
      alertList.append(row);
    });
    if (alertStatus) alertStatus.textContent = error ? 'CONNECTION ISSUE' : (market?.stale ? 'STALE DATA' : 'MONITORING');
  }

  async function loadMarketAlarms() {
    try {
      const response = await fetch(apiBase + '/api/zombcash', {cache:'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      renderAlarms(await response.json(), false);
    } catch (error) {
      console.warn('Living World market alarms unavailable:', error);
      renderAlarms(null, true);
    }
  }

  const missionSets = [
    [
      ['Scan the outbreak', 'Open the live Solana radar and inspect a token.'],
      ['Check the signal', 'Review $ZOMBCASH 24h movement and volume.'],
      ['Report to the crew', 'Visit the Telegram community and share one useful thought.']
    ],
    [
      ['Read a transmission', 'Open one story in the live news feed.'],
      ['Compare the survivors', 'Compare volume and liquidity for two radar tokens.'],
      ['Join the resistance', 'Check the latest project discussion in Telegram.']
    ],
    [
      ['Inspect the market', 'Refresh the $ZOMBCASH market snapshot.'],
      ['Explore a new signal', 'Search the radar for a token you have not seen before.'],
      ['Spread the signal', 'Share the website with another survivor.']
    ]
  ];
  const dayKey = new Date().toISOString().slice(0,10);
  const missions = missionSets[Math.floor(Date.now()/86400000) % missionSets.length];
  const storageKey = 'zombcash-world-missions-' + dayKey;
  let done = [];
  try { done = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch (_) { done = []; }
  if (!Array.isArray(done)) done = [];

  function renderMissions() {
    missionList.replaceChildren();
    missions.forEach((mission, index) => {
      const label = makeNode('label', 'world-mission' + (done.includes(index) ? ' done' : ''));
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = done.includes(index);
      checkbox.addEventListener('change', () => {
        done = checkbox.checked ? [...new Set([...done, index])] : done.filter(item => item !== index);
        try { localStorage.setItem(storageKey, JSON.stringify(done)); } catch (_) {}
        renderMissions();
      });
      const copy = makeNode('span', '');
      copy.append(makeNode('strong', '', mission[0]), makeNode('p', '', mission[1]));
      label.append(checkbox, copy);
      missionList.append(label);
    });
    if (missionCount) missionCount.textContent = Math.min(done.length, missions.length) + ' / ' + missions.length + ' DONE';
    if (missionDate) missionDate.textContent = 'DAILY RESET · ' + dayKey;
  }
  document.getElementById('world-reset-missions')?.addEventListener('click', () => {
    done = [];
    try { localStorage.removeItem(storageKey); } catch (_) {}
    renderMissions();
  });

  renderMissions();
  loadWorldNews();
  loadMarketAlarms();
  setInterval(loadWorldNews, 300000);
  setInterval(loadMarketAlarms, 60000);
})();


// Community features: DexScreener trade counts, shared daily voting and survival leaderboard.
(() => {
  const apiBase = 'https://zombcash-bot.fadehost.app';
  const getEl = (id) => document.getElementById(id);
  const activityStatus = getEl('activity-status');
  const activityBuys = getEl('activity-buys');
  const activitySells = getEl('activity-sells');
  const activityRatio = getEl('activity-ratio');
  const activityBar = getEl('activity-buy-bar');
  const activityNote = getEl('activity-note');
  const voteOptionsEl = getEl('daily-vote-options');
  const voteStatus = getEl('vote-status');
  const voteTotal = getEl('vote-total');
  const voteDate = getEl('vote-date');
  const leaderboardEl = getEl('survival-leaderboard');
  const leaderboardStatus = getEl('leaderboard-status');
  const submitScoreButton = getEl('submit-survival-score');
  const submitScoreStatus = getEl('score-submit-status');
  let activityData = null;
  let activityPeriod = 'h1';
  let voteData = null;
  let chosenVote = null;
  let voteBusy = false;

  let voterId = '';
  try {
    voterId = localStorage.getItem('zombcash-community-id') || '';
    if (!/^[a-f0-9-]{16,80}$/.test(voterId)) {
      voterId = (crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(16) + '-' + Math.random().toString(16).slice(2) + '-' + Math.random().toString(16).slice(2))).toLowerCase();
      localStorage.setItem('zombcash-community-id', voterId);
    }
  } catch (_) {
    voterId = (Date.now().toString(16) + '-' + Math.random().toString(16).slice(2) + '-' + Math.random().toString(16).slice(2)).toLowerCase();
  }

  const prettyCount = (n) => Number(n || 0).toLocaleString('en-US');
  function renderActivity() {
    if (!activityData) return;
    const buys = Number(activityData.buys?.[activityPeriod] || 0);
    const sells = Number(activityData.sells?.[activityPeriod] || 0);
    const total = buys + sells;
    if (activityBuys) activityBuys.textContent = prettyCount(buys);
    if (activitySells) activitySells.textContent = prettyCount(sells);
    if (activityRatio) activityRatio.textContent = sells ? (buys / sells).toFixed(2) + '×' : (buys ? '∞' : '—');
    if (activityBar) activityBar.style.width = (total ? Math.round(buys / total * 100) : 0) + '%';
    if (activityNote) activityNote.textContent = total
      ? 'DexScreener reports ' + prettyCount(total) + ' transactions in this period. Counts are transactions, not unique buyers or wallets.'
      : 'No transactions reported for this period in the latest DexScreener snapshot.';
  }
  async function loadActivity() {
    try {
      const response = await fetch(apiBase + '/api/activity', {cache:'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      activityData = await response.json();
      renderActivity();
      if (activityStatus) activityStatus.textContent = 'DEXSCREENER LIVE';
    } catch (error) {
      if (activityStatus) activityStatus.textContent = 'SIGNAL OFFLINE';
      if (activityNote) activityNote.textContent = 'Live trade counts are temporarily unavailable. They will retry automatically.';
    }
  }
  document.querySelectorAll('.activity-tab').forEach(button => button.addEventListener('click', () => {
    activityPeriod = button.dataset.period || 'h1';
    document.querySelectorAll('.activity-tab').forEach(tab => tab.classList.toggle('active', tab === button));
    renderActivity();
  }));

  const pollLabels = {
    meme: 'More ZombieCash memes',
    raid: 'Community raid mission',
    game: 'New survival game challenge'
  };
  function renderVote(data, alreadyVoted = false) {
    voteData = data;
    if (!voteOptionsEl || !data) return;
    const total = Number(data.total || 0);
    const previousVote = chosenVote || data.yourVote || null;
    voteOptionsEl.replaceChildren();
    Object.entries(pollLabels).forEach(([key, label]) => {
      const count = Number(data.votes?.[key] || 0);
      const percent = total ? Math.round(count / total * 100) : 0;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'daily-vote-option' + (previousVote === key ? ' selected' : '');
      button.disabled = alreadyVoted || voteBusy;
      const bar = document.createElement('span');
      bar.className = 'vote-result-bar';
      bar.style.width = percent + '%';
      const radio = document.createElement('span');
      radio.className = 'vote-radio';
      const title = document.createElement('span');
      title.className = 'vote-option-label';
      title.textContent = label;
      const result = document.createElement('span');
      result.className = 'vote-percent';
      result.textContent = total ? percent + '% · ' + count : 'VOTE';
      button.append(bar, radio, title, result);
      button.addEventListener('click', () => castVote(key));
      voteOptionsEl.append(button);
    });
    if (voteTotal) voteTotal.textContent = prettyCount(total) + (total === 1 ? ' VOTE' : ' VOTES');
    if (voteDate) voteDate.textContent = 'UTC · ' + (data.date || new Date().toISOString().slice(0,10));
    if (voteStatus) voteStatus.textContent = alreadyVoted ? 'VOTE RECORDED' : 'OPEN POLL';
  }
  async function loadVote() {
    try {
      const response = await fetch(apiBase + '/api/vote', {cache:'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      let alreadyVoted = false;
      try { alreadyVoted = localStorage.getItem('zombcash-voted-' + data.date) === 'yes'; } catch (_) {}
      renderVote(data, alreadyVoted);
    } catch (error) {
      if (voteStatus) voteStatus.textContent = 'POLL OFFLINE';
      if (voteOptionsEl) voteOptionsEl.innerHTML = '<p class="crew-note">The community poll is temporarily unavailable. Please try again shortly.</p>';
    }
  }
  async function castVote(option) {
    if (voteBusy) return;
    voteBusy = true;
    chosenVote = option;
    if (voteStatus) voteStatus.textContent = 'SENDING VOTE…';
    try {
      const response = await fetch(apiBase + '/api/vote', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({option, voter:voterId})
      });
      const data = await response.json();
      if (!response.ok && response.status !== 409) throw new Error(data.error || 'Vote failed');
      if (data.date) {
        try { localStorage.setItem('zombcash-voted-' + data.date, 'yes'); } catch (_) {}
      }
      renderVote(data, true);
      if (voteStatus && response.status === 409) voteStatus.textContent = 'ALREADY VOTED';
    } catch (error) {
      if (voteStatus) voteStatus.textContent = 'VOTE FAILED';
      if (voteOptionsEl) {
        const notice = document.createElement('p');
        notice.className = 'crew-note';
        notice.textContent = 'Could not save your vote: ' + error.message;
        voteOptionsEl.append(notice);
      }
    } finally { voteBusy = false; }
  }

  function renderLeaderboard(data) {
    if (!leaderboardEl) return;
    leaderboardEl.replaceChildren();
    const scores = Array.isArray(data.scores) ? data.scores : [];
    if (!scores.length) {
      const empty = document.createElement('p');
      empty.className = 'crew-note';
      empty.textContent = 'No records yet. Play the survival test and claim the first spot.';
      leaderboardEl.append(empty);
    } else {
      scores.slice(0,10).forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'survivor-row';
        const rank = document.createElement('span');
        rank.className = 'survivor-rank';
        rank.textContent = '#' + (index + 1);
        const name = document.createElement('span');
        name.className = 'survivor-name';
        name.textContent = item.name || 'Survivor';
        const date = document.createElement('small');
        date.className = 'survivor-date';
        date.textContent = item.date ? 'RECORD · ' + item.date : 'COMMUNITY RECORD';
        name.append(date);
        const time = document.createElement('strong');
        time.className = 'survivor-time';
        time.textContent = Number(item.ms).toLocaleString('en-US') + ' MS';
        row.append(rank, name, time);
        leaderboardEl.append(row);
      });
    }
    if (leaderboardStatus) leaderboardStatus.textContent = 'TOP 10';
  }
  async function loadLeaderboard() {
    try {
      const response = await fetch(apiBase + '/api/scores', {cache:'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      renderLeaderboard(await response.json());
    } catch (_) {
      if (leaderboardStatus) leaderboardStatus.textContent = 'OFFLINE';
      if (leaderboardEl) leaderboardEl.innerHTML = '<p class="crew-note">Leaderboard is temporarily unavailable.</p>';
    }
  }
  submitScoreButton?.addEventListener('click', async () => {
    const ms = Number(window.lastSurvivalMs);
    if (!Number.isFinite(ms) || ms < 100 || ms > 5000) {
      if (submitScoreStatus) submitScoreStatus.textContent = 'Finish a valid round first.';
      return;
    }
    submitScoreButton.disabled = true;
    if (submitScoreStatus) submitScoreStatus.textContent = 'Submitting your record…';
    try {
      const response = await fetch(apiBase + '/api/scores', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name:getEl('survivor-name')?.value || 'Survivor', ms, voter:voterId})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save record');
      if (submitScoreStatus) submitScoreStatus.textContent = 'Record saved! Leaderboard updated.';
      renderLeaderboard(data);
    } catch (error) {
      if (submitScoreStatus) submitScoreStatus.textContent = error.message;
      submitScoreButton.disabled = false;
    }
  });

  loadActivity();
  loadVote();
  loadLeaderboard();
  setInterval(loadActivity, 60000);
  setInterval(loadVote, 60000);
  setInterval(loadLeaderboard, 60000);
})();


/* Anonymous unique website visitor counter */
(() => {
  const apiBase = 'https://zombcash-bot.fadehost.app';
  const totalEl = document.getElementById('visits-total');
  const todayEl = document.getElementById('visits-today');
  const updatedEl = document.getElementById('visits-updated');
  if (!totalEl || !todayEl || !updatedEl) return;
  const storageKey = 'zombcash_site_visitor_v1';
  let visitorId = '';
  try {
    visitorId = localStorage.getItem(storageKey) || '';
    if (!/^[a-f0-9-]{16,80}$/.test(visitorId)) {
      visitorId = (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      })).toLowerCase();
      localStorage.setItem(storageKey, visitorId);
    }
  } catch (_) {
    visitorId = 'session-' + Math.random().toString(16).slice(2) + '-' + Date.now().toString(16);
  }
  const render = data => {
    if (Number.isFinite(Number(data.total))) totalEl.textContent = Number(data.total).toLocaleString();
    if (Number.isFinite(Number(data.today))) todayEl.textContent = Number(data.today).toLocaleString();
    updatedEl.textContent = 'UTC DAY · UPDATED ' + new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  };
  const updateVisits = async () => {
    try {
      const response = await fetch(apiBase + '/api/visits', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({visitor:visitorId})
      });
      if (!response.ok) throw new Error('Visit counter unavailable');
      render(await response.json());
    } catch (_) {
      updatedEl.textContent = 'VISITOR STATS TEMPORARILY OFFLINE';
      try {
        const response = await fetch(apiBase + '/api/visits');
        if (response.ok) render(await response.json());
      } catch (_) {}
    }
  };
  updateVisits();
  setInterval(async () => {
    try { const r = await fetch(apiBase + '/api/visits'); if (r.ok) render(await r.json()); } catch (_) {}
  }, 60000);
})();


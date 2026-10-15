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
    const response = await fetch('https://api.dexscreener.com/token-boosts/top/v1', {cache:'no-store'});
    if (!response.ok) throw new Error('Boost feed returned HTTP ' + response.status);
    const boosted = await response.json();
    const addresses = [...new Set((Array.isArray(boosted) ? boosted : [])
      .filter(t => String(t.chainId).toLowerCase() === 'solana' && t.tokenAddress)
      .map(t => t.tokenAddress))].slice(0,25);
    if (!addresses.length) throw new Error('No Solana tokens in the boost feed');
    const detailsResponse = await fetch('https://api.dexscreener.com/tokens/v1/solana/' + addresses.map(encodeURIComponent).join(','), {cache:'no-store'});
    if (!detailsResponse.ok) throw new Error('Token details returned HTTP ' + detailsResponse.status);
    const pairs = await detailsResponse.json();
    const best = new Map();
    (Array.isArray(pairs) ? pairs : []).filter(p => p.chainId === 'solana' && p.baseToken?.address).forEach(p => {
      const key = p.baseToken.address;
      const current = best.get(key);
      const rank = Number(p.liquidity?.usd || 0) + Number(p.volume?.h24 || 0) * 0.1;
      const currentRank = current ? Number(current.liquidity?.usd || 0) + Number(current.volume?.h24 || 0) * 0.1 : -1;
      if (!current || rank > currentRank) best.set(key, p);
    });
    const boostedAddresses = new Set((Array.isArray(boosted) ? boosted : []).map(t => t.tokenAddress));
    radarTokens = [...best.values()].map(p => ({...p, boosts:{...(p.boosts || {}), active:Number(p.boosts?.active || 0), isBoosted:boostedAddresses.has(p.baseToken.address)}}));
    if (!radarTokens.length) throw new Error('No detailed Solana pairs returned');
    lastRadarSuccess = Date.now();
    renderRadar();
    if (radarStatus) radarStatus.textContent = 'RADAR ONLINE';
    if (radarUpdated) radarUpdated.textContent = 'UPDATED ' + new Date().toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'});
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
  setInterval(() => loadRadar(true), 60000);
}

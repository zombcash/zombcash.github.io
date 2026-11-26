/* Bounded first-party API helper. Preserve explicit per-request timeouts. */
const zcApiFetch = (url, options = {}, timeoutMs = 15000) => fetch(url, {
  ...options,
  signal: options.signal || AbortSignal.timeout(timeoutMs)
});

/* Render the public aggregate traffic dashboard from the first-party API. */
(() => {
  if (new URLSearchParams(window.location.search).get('arcadeSnake') === '1') return;
  const root = document.getElementById('campaign-dashboard');
  if (!root) return;
  const endpoint = 'https://zombcash-bot.fadehost.app/api/track';
  const byId = id => document.getElementById(id);
  const fmt = n => Number(n || 0).toLocaleString();
  const safe = s => String(s).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const renderList = (node, entries, empty) => {
    if (!node) return;
    const rows = Object.entries(entries || {}).sort((a,b) => Number(b[1])-Number(a[1])).slice(0,8);
    if (!rows.length) { node.innerHTML = '<span>' + empty + '</span>'; return; }
    const max = Math.max(1, ...rows.map(x => Number(x[1]) || 0));
    node.innerHTML = rows.map(([label,value]) => {
      const n = Number(value) || 0;
      const pct = Math.max(2, Math.round(n / max * 100));
      return '<div class="campaign-row"><span>' + safe(label) + '</span><div class="campaign-bar"><i style="width:' + pct + '%"></i></div><b class="campaign-count">' + fmt(n) + '</b></div>';
    }).join('');
  };
  const load = async () => {
    try {
      const response = await zcApiFetch(endpoint, {cache:'no-store'});
      if (!response.ok) throw new Error('Analytics endpoint returned ' + response.status);
      const data = await response.json();
      const events = data.events || {};
      const sum = names => names.reduce((n,key) => n + (Number(events[key]) || 0), 0);
      byId('campaign-pageviews').textContent = fmt(events.page_view || 0);
      byId('campaign-outbound').textContent = fmt(events.outbound_click || 0);
      byId('campaign-community').textContent = fmt(sum(['telegram_open','radar_open']));
      byId('campaign-conversions').textContent = fmt(sum(['ca_copy','game_start','game_share','maker_share','cta_click','token_info_open']));
      renderList(byId('campaign-sources'), data.sources, 'No campaign traffic recorded yet.');
      renderList(byId('campaign-days'), data.daily, 'No daily events recorded yet.');
      byId('campaign-updated').textContent = 'UPDATED ' + new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) + ' · ' + (data.retentionDays || 60) + ' DAY RETENTION';
    } catch (_) {
      byId('campaign-updated').textContent = 'ANALYTICS TEMPORARILY UNAVAILABLE · CHECK API DEPLOYMENT';
      byId('campaign-sources').innerHTML = '<span>Analytics API is not responding yet.</span>';
      byId('campaign-days').innerHTML = '<span>Try again after the API deployment completes.</span>';
    }
  };
  load();
  setInterval(load, 60000);
})();

/* ZombieCash first-party campaign tracking. Aggregate-only; no IP or wallet addresses stored. */
(() => {
  if (new URLSearchParams(window.location.search).get('arcadeSnake') === '1') return;
  if (window.__zombcashCampaignTrackingLoaded) return;
  window.__zombcashCampaignTrackingLoaded = true;
  const endpoint = 'https://zombcash-bot.fadehost.app/api/track';
  const params = new URLSearchParams(window.location.search);
  const clean = (value, fallback) => String(value || fallback).toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 60) || fallback;
  const source = clean(params.get('utm_source') || params.get('source') || document.referrer && new URL(document.referrer).hostname.split('.')[0] || 'direct', 'direct');
  const medium = clean(params.get('utm_medium') || 'unknown', 'unknown');
  const campaign = clean(params.get('utm_campaign') || 'none', 'none');
  const page = (window.location.pathname || '/').replace(/[^a-zA-Z0-9_./-]/g, '').slice(0, 120) || '/';
  const send = (event, target = 'none') => {
    try {
      const body = JSON.stringify({event, source, medium, campaign, page, target: clean(target, 'none')});
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([body], {type:'application/json'}));
      } else {
        fetch(endpoint, {method:'POST', headers:{'Content-Type':'application/json'}, body, keepalive:true}).catch(() => {});
      }
    } catch (_) {}
  };
  window.ZombieCashTrack = send;
  send('page_view');
  document.addEventListener('click', event => {
    const el = event.target && event.target.closest ? event.target.closest('a,button') : null;
    if (!el) return;
    const id = String(el.id || '').toLowerCase();
    const label = String(el.getAttribute('aria-label') || el.textContent || '').trim().toLowerCase();
    const href = el.href || '';
    if (id === 'copy-ca' || id === 'footer-copy-ca' || /copy contract|copy ca/.test(label)) send('ca_copy', 'token');
    if (id === 'start-game' || id === 'game-action' || /start game|play now|play again/.test(label)) send('game_start', 'zombie_lab');
    if (/zombie-maker\.html/.test(href) || /make your zombie/.test(label)) send('cta_click', 'zombie_maker');
    if (/t\.me\/zombiecashmemeradarbot/i.test(href)) send('radar_open', 'meme_radar');
    if (/t\.me\/zombcash\/?(?:\?|$)/i.test(href)) send('telegram_open', 'telegram_channel');
    if (/pump\.fun\/coin|dexscreener\.com\/solana/i.test(href)) send('token_info_open', 'token_market');
    if (href && /^https?:/i.test(href) && new URL(href, window.location.href).origin !== window.location.origin) {
      send('outbound_click', new URL(href).hostname.split('.')[0]);
    }
  }, {capture:true});
})();

const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#site-navigation');
if (menu && nav) {
  const menuLabels = {
    en: ['Open navigation', 'Close navigation', 'Primary navigation'],
    de: ['Navigation öffnen', 'Navigation schließen', 'Hauptnavigation'],
    fr: ['Ouvrir la navigation', 'Fermer la navigation', 'Navigation principale'],
    it: ['Apri la navigazione', 'Chiudi la navigazione', 'Navigazione principale'],
    ja: ['ナビゲーションを開く', 'ナビゲーションを閉じる', 'メインナビゲーション'],
    'zh-cn': ['打开导航', '关闭导航', '主导航'],
    ru: ['Открыть навигацию', 'Закрыть навигацию', 'Основная навигация'],
    tr: ['Gezinmeyi aç', 'Gezinmeyi kapat', 'Ana gezinme'],
    hi: ['नेविगेशन खोलें', 'नेविगेशन बंद करें', 'मुख्य नेविगेशन']
  };
  const labels = menuLabels[(document.documentElement.lang || 'en').toLowerCase()] || menuLabels.en;
  nav.setAttribute('aria-label', labels[2]);
  const setMenuOpen = open => {
    nav.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', labels[open ? 1 : 0]);
  };
  menu.addEventListener('click', () => setMenuOpen(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenuOpen(false)));
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !nav.classList.contains('open')) return;
    event.preventDefault();
    setMenuOpen(false);
    menu.focus();
  });
}

// Outbreak dashboard is populated only by the live API status module below.
const chaosValue = document.getElementById('chaos-value');
const meterFill = document.getElementById('meter-fill');
if (chaosValue) chaosValue.textContent = '—';
if (meterFill) meterFill.style.width = '0%';

const ca = '6cCBF9gtyp3c6VmyxUWzETk3yFmxhjvPm15cxicfpump';
async function copyContractAddress(button, feedback) {
  let copied = false;
  try {
    await navigator.clipboard.writeText(ca);
    copied = true;
  } catch (_) {
    const input = document.createElement('textarea');
    input.value = ca;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    try { copied = document.execCommand('copy'); } catch (_) {}
    input.remove();
  }
  if (feedback) {
    feedback.textContent = copied ? 'CONTRACT COPIED TO CLIPBOARD.' : 'COPY FAILED — SELECT THE CONTRACT ADDRESS AND COPY IT MANUALLY.';
  }
  if (button) {
    const original = button.dataset.originalLabel || button.textContent;
    button.dataset.originalLabel = original;
    button.textContent = copied ? 'COPIED ✓' : 'COPY FAILED';
    if (copied) setTimeout(() => { button.textContent = original; }, 1800);
  }
  return copied;
}
document.getElementById('copy-ca')?.addEventListener('click', async () => {
  await copyContractAddress(document.getElementById('copy-ca'), document.getElementById('copy-feedback'));
});
document.getElementById('footer-copy-ca')?.addEventListener('click', async () => {
  const button = document.getElementById('footer-copy-ca');
  const feedback = document.getElementById('footer-copy-feedback');
  await copyContractAddress(button, feedback);
});

// Zombie Snake: classic keyboard-controlled snake with a ZombieCash twist.
const start = document.getElementById('start-game');
const action = document.getElementById('game-action');
const gameMessage = document.getElementById('game-message');
const gameState = document.getElementById('game-state');
const scoreEl = document.getElementById('game-score');
const screen = document.getElementById('game-screen');
const gameCanvas = document.getElementById('zombie-canvas');
const gameCtx = gameCanvas?.getContext('2d');
const CELL = 20;
const BASE_STEP_MS = 125;
const BOOST_MULTIPLIER = 0.62;
const MAX_BRAINS = 4;
let gameFrame = 0, lastStep = 0, gameActive = false, gameFinished = false;
let gamePoints = 0, snake = [], brains = [], direction = {x: 1, y: 0}, nextDirection = {x: 1, y: 0};
let gameWidth = 0, gameHeight = 0, cols = 0, rows = 0, stepMs = BASE_STEP_MS;
const heldMoveKeys = new Set();
let snakeSurvivalReceiptPromise = null;
let snakeSurvivalReceiptUsed = false;
function snakeSurvivorToken(){try{return localStorage.getItem('zombcash-survivor-token')||''}catch(_){return ''}}
async function beginSnakeSurvivalSession(){
  snakeSurvivalReceiptUsed=false;
  const token=snakeSurvivorToken();
  if(!token){snakeSurvivalReceiptPromise=null;return}
  snakeSurvivalReceiptPromise=zcApiFetch('https://zombcash-bot.fadehost.app/api/survival/game-start',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({game:'snake'}),cache:'no-store'})
    .then(async response=>{const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Session unavailable');return data.receipt||null})
    .catch(()=>null);
}
async function completeSnakeSurvivalSession(points){
  if(snakeSurvivalReceiptUsed)return;
  snakeSurvivalReceiptUsed=true;
  const score=Math.max(0,Math.min(100000,Number(points)||0));
  const token=snakeSurvivorToken(), pending=snakeSurvivalReceiptPromise;
  if(!token||!pending){if(window.parent!==window)window.parent.postMessage({type:'zombcash-arcade-snake-result',points:score,accountSaved:false},location.origin);return}
  const receipt=await pending;
  if(!receipt){if(window.parent!==window)window.parent.postMessage({type:'zombcash-arcade-snake-result',points:score,accountSaved:false,error:'Could not verify this game session.'},location.origin);return}
  try{
    const response=await zcApiFetch('https://zombcash-bot.fadehost.app/api/survival/game-complete',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({receipt,points:score}),cache:'no-store'});
    const data=await response.json().catch(()=>({}));
    if(window.parent!==window)window.parent.postMessage({type:'zombcash-arcade-snake-result',points:score,accountSaved:response.ok,arcadeScore:data.arcadeScore||null,error:response.ok?'':(data.error||'Could not save to profile.')},location.origin);
  }catch(_){if(window.parent!==window)window.parent.postMessage({type:'zombcash-arcade-snake-result',points:score,accountSaved:false,error:'Network error while saving score.'},location.origin)}
}
let lastBonusBrainAt = 0;

function resizeGameCanvas() {
  if (!gameCanvas || !screen || !gameCtx) return;
  const rect = screen.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  gameWidth = rect.width; gameHeight = rect.height;
  gameCanvas.width = Math.round(gameWidth * dpr);
  gameCanvas.height = Math.round(gameHeight * dpr);
  gameCanvas.style.width = gameWidth + 'px';
  gameCanvas.style.height = gameHeight + 'px';
  gameCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const oldCols = cols, oldRows = rows;
  cols = Math.max(8, Math.floor(gameWidth / CELL));
  rows = Math.max(8, Math.floor(gameHeight / CELL));
  if (!gameActive && snake.length && (oldCols !== cols || oldRows !== rows)) {
    snake = snake.map(p => ({x: Math.min(cols - 1, p.x), y: Math.min(rows - 1, p.y)}));
    brains = brains.map(p => ({x: Math.min(cols - 1, p.x), y: Math.min(rows - 1, p.y)}));
  }
  drawGame();
}
function isOccupied(point, includeSnake = true) {
  return (includeSnake && snake.some(p => p.x === point.x && p.y === point.y)) ||
    brains.some(p => p.x === point.x && p.y === point.y);
}
function randomFreeCell() {
  const freeCount = cols * rows - snake.length - brains.length;
  if (freeCount <= 0) return null;
  for (let attempts = 0; attempts < 600; attempts++) {
    const point = {x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows)};
    if (!isOccupied(point)) return point;
  }
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const point = {x, y};
      if (!isOccupied(point)) return point;
    }
  }
  return null;
}
function placeBrain() {
  if (brains.length >= MAX_BRAINS) return false;
  const point = randomFreeCell();
  if (!point) return false;
  brains.push(point);
  return true;
}
function resetBrains() {
  brains = [];
  placeBrain();
  placeBrain();
  if (brains.length > 1 && Math.random() < 0.6) brains.pop();
  lastBonusBrainAt = performance.now();
}
function drawGame() {
  if (!gameCtx) return;
  gameCtx.clearRect(0, 0, gameWidth, gameHeight);
  gameCtx.fillStyle = '#08120d';
  gameCtx.fillRect(0, 0, gameWidth, gameHeight);
  gameCtx.strokeStyle = 'rgba(119,255,139,.09)';
  gameCtx.lineWidth = 1;
  for (let x = 0; x <= gameWidth; x += CELL) { gameCtx.beginPath(); gameCtx.moveTo(x,0); gameCtx.lineTo(x,gameHeight); gameCtx.stroke(); }
  for (let y = 0; y <= gameHeight; y += CELL) { gameCtx.beginPath(); gameCtx.moveTo(0,y); gameCtx.lineTo(gameWidth,y); gameCtx.stroke(); }
  if (snake.length) {
    snake.forEach((p, i) => {
      const inset = 2;
      gameCtx.save();
      gameCtx.shadowColor = '#9bff45';
      gameCtx.shadowBlur = i === 0 ? 13 : 5;
      gameCtx.fillStyle = i === 0 ? '#d4ff8a' : '#5ce54f';
      gameCtx.fillRect(p.x * CELL + inset, p.y * CELL + inset, CELL - inset * 2, CELL - inset * 2);
      if (i === 0) {
        gameCtx.shadowBlur = 0;
        gameCtx.fillStyle = '#101810';
        gameCtx.font = 'bold 13px sans-serif';
        gameCtx.textAlign = 'center'; gameCtx.textBaseline = 'middle';
        gameCtx.fillText('☠', p.x * CELL + CELL/2, p.y * CELL + CELL/2 + 1);
      }
      gameCtx.restore();
    });
    brains.forEach(brain => {
      gameCtx.save();
      gameCtx.font = '17px sans-serif';
      gameCtx.textAlign = 'center'; gameCtx.textBaseline = 'middle';
      gameCtx.shadowColor = '#9bff45'; gameCtx.shadowBlur = 12;
      gameCtx.fillText('🧠', brain.x * CELL + CELL/2, brain.y * CELL + CELL/2);
      gameCtx.restore();
    });
  }
  if (gameActive) {
    gameCtx.fillStyle = '#9bff45';
    gameCtx.font = '700 10px Orbitron,sans-serif';
    gameCtx.textAlign = 'left';
    gameCtx.fillText('ARROWS / WASD TO MOVE · HOLD TO BOOST', 12, 17);
    gameCtx.textAlign = 'right';
    gameCtx.fillText('BRAINS: ' + brains.length, gameWidth - 12, 17);
  }
}
function stopGame(won, reason) {
  gameActive = false;
  completeSnakeSurvivalSession(gamePoints);
  gameFinished = true;
  heldMoveKeys.clear();
  screen?.classList.remove('snake-playing');
  cancelAnimationFrame(gameFrame);
  action.disabled = false;
  action.style.opacity = '1';
  action.textContent = 'PLAY AGAIN';
  const submit = document.getElementById('submit-survival-score');
  if (submit) submit.disabled = gamePoints < 10;
  gameState.textContent = won ? 'SURVIVED' : 'GAME OVER';
  gameMessage.textContent = won ? 'OUTBREAK SURVIVED! NICE SNAKE WORK.' : (reason || 'THE HORDE COLLAPSED. TRY AGAIN!');
  gameMessage.style.display = '';
  gameMessage.style.color = won ? '#9bff45' : '#ff7777';
  screen.style.background = '';
  window.lastSurvivalPoints = gamePoints;
  const status = document.getElementById('score-submit-status');
  if (status) status.textContent = 'Final score: ' + gamePoints + ' points. Save your record to the community board.';
  drawGame();
}
function resetGame() {
  // The shared script is loaded on pages without the Snake game; do not touch absent game UI.
  if (!scoreEl || !gameState || !gameMessage || !action || !screen) return;
  cancelAnimationFrame(gameFrame);
  gameFrame = 0;
  gameActive = false;
  gameFinished = false;
  heldMoveKeys.clear();
  screen?.classList.remove('snake-playing');
  gamePoints = 0;
  const midX = Math.floor(cols / 2), midY = Math.floor(rows / 2);
  snake = [{x: midX, y: midY}, {x: midX - 1, y: midY}, {x: midX - 2, y: midY}];
  direction = {x: 1, y: 0}; nextDirection = {x: 1, y: 0};
  lastStep = 0; stepMs = BASE_STEP_MS;
  window.lastSurvivalPoints = null;
  const submit = document.getElementById('submit-survival-score');
  if (submit) submit.disabled = true;
  scoreEl.textContent = '000';
  gameState.textContent = 'READY';
  gameMessage.style.display = '';
  gameMessage.style.color = '';
  gameMessage.textContent = 'PRESS SPACE OR ENTER TO START · ARROWS / WASD TO MOVE';
  action.textContent = 'START SNAKE';
  action.disabled = false;
  action.style.opacity = '1';
  screen.style.background = '';
  resetBrains();
  drawGame();
}
function beginGame() {
  if (gameActive) return;
  // Use an explicit finished flag instead of UI text, which can be changed by
  // animation/state updates. Always build a fresh round after a collision.
  if (gameFinished || gameState?.textContent === 'GAME OVER' || gameState?.textContent === 'SURVIVED') {
    resetGame();
  }
  resizeGameCanvas();
  if (!snake.length) resetGame();
  beginSnakeSurvivalSession();
  gameActive = true;
  screen?.classList.add('snake-playing');
  lastStep = performance.now();
  action.disabled = true;
  action.style.opacity = '.35';
  action.textContent = 'SNAKE ACTIVE';
  gameMessage.style.display = 'none';
  gameState.textContent = 'SURVIVE';
  screen.style.background = '#08120d';
  gameFrame = requestAnimationFrame(tickGame);
}
function tickGame(now) {
  if (!gameActive) return;
  gameState.textContent = 'SURVIVE';
  const boostHeld = heldMoveKeys.size > 0;
  const effectiveStepMs = Math.max(48, stepMs * (boostHeld ? BOOST_MULTIPLIER : 1));
  if (now - lastStep >= effectiveStepMs) {
    lastStep = now;
    direction = nextDirection;
    const head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};
    const brainIndex = brains.findIndex(brain => head.x === brain.x && head.y === brain.y);
    const eating = brainIndex >= 0;
    const body = eating ? snake : snake.slice(0, -1);
    if (head.x < 0 || head.y < 0 || head.x >= cols || head.y >= rows || body.some(p => p.x === head.x && p.y === head.y)) {
      stopGame(false, 'CRASHED! PRESS PLAY AGAIN TO RESTART.');
      return;
    }
    snake.unshift(head);
    if (eating) {
      brains.splice(brainIndex, 1);
      gamePoints += 10;
      scoreEl.textContent = String(gamePoints).padStart(3, '0');
      gameMessage.textContent = 'BRAIN CONSUMED! +10';
      gameMessage.style.color = '#9bff45';
      gameMessage.style.display = 'none';
      if (!brains.length) placeBrain();
      if (brains.length < MAX_BRAINS && Math.random() < 0.35) placeBrain();
      // Every 100 points increases the base snake speed by 10%, stacking by milestone.
      // Keep a 48 ms floor so the game remains playable at high scores.
      const speedLevel = Math.floor(gamePoints / 100);
      stepMs = Math.max(48, BASE_STEP_MS / Math.pow(1.10, speedLevel));
    } else {
      snake.pop();
    }
    // Bonus brains occasionally join the hunt, so the board can hold several at once.
    if (brains.length < MAX_BRAINS && now - lastBonusBrainAt > 6500 && Math.random() < 0.018) {
      if (placeBrain()) lastBonusBrainAt = now;
    }
    drawGame();
  }
  if (gameActive) gameFrame = requestAnimationFrame(tickGame);
}
function setSnakeDirection(x, y) {
  if (!gameActive) return;
  if (x === -direction.x && y === -direction.y) return;
  nextDirection = {x, y};
}
const snakeDirectionKeys = {
  arrowup: [0,-1], w: [0,-1],
  arrowdown: [0,1], s: [0,1],
  arrowleft: [-1,0], a: [-1,0],
  arrowright: [1,0], d: [1,0]
};
window.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  const modalOpen = Boolean(snakeModal?.open);
  if (modalOpen && !gameActive && (key === ' ' || key === 'enter')) {
    event.preventDefault();
    beginGame();
    return;
  }
  if (snakeDirectionKeys[key] && modalOpen) {
    event.preventDefault();
    heldMoveKeys.add(key);
    if (gameActive) setSnakeDirection(snakeDirectionKeys[key][0], snakeDirectionKeys[key][1]);
  }
});
window.addEventListener('keyup', event => {
  heldMoveKeys.delete(event.key.toLowerCase());
});
window.addEventListener('blur', () => heldMoveKeys.clear());
action?.addEventListener('click', () => { if (!gameActive) beginGame(); });
window.addEventListener('message', event => {
  if (event.origin !== window.location.origin || !event.data?.type?.startsWith('zombcash-arcade-snake-')) return;
  const message = event.data;
  if (message.type === 'zombcash-arcade-snake-start') {
    resetGame();
    requestAnimationFrame(() => { resizeGameCanvas(); beginGame(); });
    return;
  }
  if (message.type === 'zombcash-arcade-snake-fullscreen') {
    document.documentElement.classList.toggle('arcade-snake-fullscreen', !!message.active);
    requestAnimationFrame(() => { resizeGameCanvas(); drawGame(); });
    return;
  }
  if (message.type === 'zombcash-arcade-snake-clear-keys') { heldMoveKeys.clear(); return; }
  if (message.type === 'zombcash-arcade-snake-key') {
    const key = String(message.key || '').toLowerCase();
    const directions = {arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};
    if (message.down) {
      if (directions[key]) setSnakeDirection(directions[key][0], directions[key][1]);
      if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' '].includes(key)) heldMoveKeys.add(key);
    } else heldMoveKeys.delete(key);
  }
});
const snakeModal = document.getElementById('snake-modal');
const snakeClose = document.getElementById('snake-close');
start?.addEventListener('click', () => {
  if (snakeModal && !snakeModal.open) snakeModal.showModal();
  requestAnimationFrame(() => {
    resizeGameCanvas();
    resetGame();
  });
});
snakeClose?.addEventListener('click', () => {
  if (gameActive) stopGame(false, 'RUN PAUSED. OPEN THE ARCADE TO PLAY AGAIN.');
  snakeModal?.close();
});
snakeModal?.addEventListener('click', event => {
  if (event.target === snakeModal) {
    if (gameActive) stopGame(false, 'RUN PAUSED. OPEN THE ARCADE TO PLAY AGAIN.');
    snakeModal.close();
  }
});
snakeModal?.addEventListener('close', () => {
  heldMoveKeys.clear();
  if (gameActive) stopGame(false, 'RUN PAUSED. OPEN THE ARCADE TO PLAY AGAIN.');
});
window.addEventListener('resize', resizeGameCanvas);
resizeGameCanvas();
resetGame();

// Open the existing Snake modal when launched from the dedicated Arcade page.
if (new URLSearchParams(window.location.search).get('arcadeSnake') === '1' && snakeModal) {
  requestAnimationFrame(() => {
    if (!snakeModal.open) snakeModal.showModal();
    resizeGameCanvas();
    resetGame();
  });
}

// Fullscreen mode for Zombie Snake.
const fullscreenButton = document.getElementById('game-fullscreen');
const gameBox = document.querySelector('.game-box');
async function toggleSnakeFullscreen() {
  if (!gameBox) return;
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (gameBox.requestFullscreen) {
      await gameBox.requestFullscreen();
    } else {
      gameBox.classList.toggle('snake-expanded');
    }
  } catch (error) {
    gameBox.classList.toggle('snake-expanded');
  }
}
fullscreenButton?.addEventListener('click', toggleSnakeFullscreen);
document.addEventListener('fullscreenchange', () => {
  if (fullscreenButton) fullscreenButton.textContent = document.fullscreenElement ? '⤢ EXIT FULLSCREEN' : '⛶ FULLSCREEN';
  resizeGameCanvas();
  drawGame();
});

// Live Solana Radar: public DexScreener API, no API key required.
const radarLocale = (document.documentElement.lang || 'en').toLowerCase();
const radarJapaneseUI = radarLocale === 'ja';
const radarUi = {
 en:{scan:'SCANNING SOLANA',scanning:'↻ SCANNING',stale:'STALE DATA — RETRYING',online:'RADAR ONLINE',last:'SHOWING LAST SIGNAL',interrupted:'SIGNAL INTERRUPTED',updated:'UPDATED ',lastUpdated:'LAST UPDATED ',unknown:'UNKNOWN',retry:'RETRY AVAILABLE',refresh:'↻ REFRESH',unavailable:'RADAR SIGNAL UNAVAILABLE. Check your connection or refresh shortly.',detail:'Data is supplied by DexScreener; temporary API limits or browser restrictions can interrupt the feed.'},
 ru:{scan:'СКАНИРОВАНИЕ SOLANA',scanning:'↻ СКАНИРОВАНИЕ',stale:'УСТАРЕВШИЕ ДАННЫЕ — ПОВТОР',online:'РАДАР АКТИВЕН',last:'ПОКАЗАН ПОСЛЕДНИЙ СИГНАЛ',interrupted:'СИГНАЛ ПРЕРВАН',updated:'ОБНОВЛЕНИЕ ИСТОЧНИКА ',lastUpdated:'ПОСЛЕДНЕЕ ОБНОВЛЕНИЕ ',unknown:'НЕИЗВЕСТНО',retry:'ПОВТОР ДОСТУПЕН',refresh:'↻ ОБНОВИТЬ',unavailable:'СИГНАЛ РАДАРА НЕДОСТУПЕН. Проверьте соединение или обновите страницу позже.',detail:'Данные предоставляются DexScreener; временные ограничения API или браузера могут прерывать поток.'},
 de:{scan:'SOLANA WIRD GESCANNT',scanning:'↻ SCAN LÄUFT',stale:'VERALTETE DATEN — ERNEUTER VERSUCH',online:'RADAR ONLINE',last:'LETZTES SIGNAL WIRD ANGEZEIGT',interrupted:'SIGNAL UNTERBROCHEN',updated:'QUELLE AKTUALISIERT ',lastUpdated:'LETZTE QUELLENAKTUALISIERUNG ',unknown:'UNBEKANNT',retry:'ERNEUTER VERSUCH MÖGLICH',refresh:'↻ AKTUALISIEREN',unavailable:'RADARSIGNAL NICHT VERFÜGBAR. Prüfe die Verbindung oder aktualisiere später.',detail:'Daten von DexScreener; vorübergehende API- oder Browserbeschränkungen können den Feed unterbrechen.'},
 fr:{scan:'SCAN DE SOLANA',scanning:'↻ SCAN EN COURS',stale:'DONNÉES OBSOLÈTES — NOUVEL ESSAI',online:'RADAR EN LIGNE',last:'DERNIER SIGNAL AFFICHÉ',interrupted:'SIGNAL INTERROMPU',updated:'SOURCE MISE À JOUR ',lastUpdated:'DERNIÈRE MISE À JOUR SOURCE ',unknown:'INCONNU',retry:'NOUVEL ESSAI POSSIBLE',refresh:'↻ ACTUALISER',unavailable:'SIGNAL RADAR INDISPONIBLE. Vérifiez la connexion ou réessayez plus tard.',detail:'Données fournies par DexScreener ; des limites API ou navigateur temporaires peuvent interrompre le flux.'},
 it:{scan:'SCANSIONE SOLANA',scanning:'↻ SCANSIONE IN CORSO',stale:'DATI OBSOLETI — NUOVO TENTATIVO',online:'RADAR ONLINE',last:'ULTIMO SEGNALE VISUALIZZATO',interrupted:'SEGNALE INTERROTTO',updated:'FONTE AGGIORNATA ',lastUpdated:'ULTIMO AGGIORNAMENTO FONTE ',unknown:'SCONOSCIUTO',retry:'NUOVO TENTATIVO DISPONIBILE',refresh:'↻ AGGIORNA',unavailable:'SEGNALE RADAR NON DISPONIBILE. Controlla la connessione o riprova più tardi.',detail:'Dati forniti da DexScreener; limiti temporanei API o browser possono interrompere il flusso.'},
 ja:{scan:'Solanaをスキャン中',scanning:'↻ スキャン中',stale:'古いデータ — 再試行中',online:'レーダー稼働中',last:'前回のシグナルを表示中',interrupted:'シグナルが中断されました',updated:'ソース更新 ',lastUpdated:'最終ソース更新 ',unknown:'不明',retry:'再試行できます',refresh:'↻ 更新',unavailable:'レーダー信号を利用できません。接続を確認するか、しばらくして更新してください。',detail:'データはDexScreener提供。一時的なAPI制限やブラウザー制限で停止することがあります。'},
 'zh-cn':{scan:'正在扫描 Solana',scanning:'↻ 扫描中',stale:'数据过期 — 正在重试',online:'雷达在线',last:'显示上次信号',interrupted:'信号中断',updated:'数据源更新 ',lastUpdated:'数据源上次更新 ',unknown:'未知',retry:'可重试',refresh:'↻ 刷新',unavailable:'雷达信号不可用。请检查连接或稍后刷新。',detail:'数据由 DexScreener 提供；临时 API 或浏览器限制可能中断数据流。'},
 tr:{scan:'SOLANA TARANIYOR',scanning:'↻ TARANIYOR',stale:'ESKİ VERİ — YENİDEN DENENİYOR',online:'RADAR AKTİF',last:'SON SİNYAL GÖSTERİLİYOR',interrupted:'SİNYAL KESİLDİ',updated:'KAYNAK GÜNCELLENDİ ',lastUpdated:'SON KAYNAK GÜNCELLEMESİ ',unknown:'BİLİNMİYOR',retry:'YENİDEN DENENEBİLİR',refresh:'↻ YENİLE',unavailable:'RADAR SİNYALİ KULLANILAMIYOR. Bağlantıyı kontrol edin veya sonra yenileyin.',detail:'Veriler DexScreener tarafından sağlanır; geçici API veya tarayıcı kısıtlamaları akışı kesebilir.'},
 hi:{scan:'SOLANA स्कैन हो रहा है',scanning:'↻ स्कैन हो रहा है',stale:'पुराना डेटा — पुनः प्रयास',online:'रडार ऑनलाइन',last:'पिछला सिग्नल दिखाया जा रहा है',interrupted:'सिग्नल बाधित',updated:'स्रोत अपडेट ',lastUpdated:'स्रोत का अंतिम अपडेट ',unknown:'अज्ञात',retry:'पुनः प्रयास उपलब्ध',refresh:'↻ रीफ़्रेश',unavailable:'रडार सिग्नल उपलब्ध नहीं। कनेक्शन जाँचें या कुछ देर बाद रीफ़्रेश करें।',detail:'डेटा DexScreener से है; अस्थायी API या ब्राउज़र सीमाएँ फ़ीड रोक सकती हैं।'}
};
const radarText = radarUi[radarLocale] || radarUi.en;
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
    const img = safeIcon ? '<span class="token-icon token-fallback" style="display:none">' + fallback + '</span><img class="token-icon" loading="lazy" src="' + safeIcon.replace(/"/g, '&quot;') + '" alt="" onerror="this.style.display=\'none\';if(this.previousElementSibling)this.previousElementSibling.style.display=\'inline-flex\'">' : '<span class="token-icon token-fallback">' + fallback + '</span>';
    return '<tr><td><div class="token-cell">' + img + '<div><span class="token-name" title="' + name.replace(/"/g,'&quot;') + '">' + name.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</span><span class="token-symbol">' + symbol.replace(/</g,'&lt;').replace(/>/g,'&gt;') + (t.boosts?.isBoosted ? ' · ⚡ ' + (radarJapaneseUI ? 'ブースト済み' : 'BOOSTED') : '') + '</span></div></div></td><td class="token-price">' + price(t.priceUsd) + '</td><td>' + pct(t.priceChange?.h1) + '</td><td>' + money(t.volume?.h24) + '</td><td>' + money(t.liquidity?.usd) + '</td><td><a class="pair-link" href="' + (t.url || 'https://dexscreener.com/solana') + '" target="_blank" rel="noopener noreferrer">' + (radarJapaneseUI ? '表示 ↗' : 'VIEW ↗') + '</a></td></tr>';
  }).join('');
}
async function loadRadar(force = false) {
  if (radarBusy) return;
  if (!force && lastRadarSuccess && Date.now() - lastRadarSuccess < 55000) return;
  radarBusy = true;
  if (radarStatus) radarStatus.textContent = radarText.scan;
  if (radarRefresh) { radarRefresh.disabled = true; radarRefresh.textContent = radarText.scanning; }
  try {
    const response = await zcApiFetch('https://zombcash-bot.fadehost.app/api/radar', {cache:'no-store'});
    if (!response.ok) throw new Error('Radar API returned HTTP ' + response.status);
    const payload = await response.json();
    if (!Array.isArray(payload.pairs)) throw new Error(payload.error || 'Radar API returned an invalid response');
    radarTokens = payload.pairs;
    if (!radarTokens.length) throw new Error('No detailed Solana pairs returned');
    lastRadarSuccess = Date.now();
    renderRadar();
    const sourceUpdatedAt = Number(payload.updatedAt || 0) * 1000;
    const sourceTime = sourceUpdatedAt ? new Date(sourceUpdatedAt).toLocaleTimeString(radarJapaneseUI ? 'ja-JP' : 'en-US', {hour:'2-digit',minute:'2-digit'}) : (radarText.unknown);
    if (payload.stale) {
      if (radarStatus) radarStatus.textContent = radarText.stale;
      if (radarUpdated) radarUpdated.textContent = (radarText.lastUpdated) + sourceTime;
    } else {
      if (radarStatus) radarStatus.textContent = radarText.online;
      if (radarUpdated) radarUpdated.textContent = (radarText.updated) + sourceTime;
    }
  } catch (error) {
    console.warn('ZombieCash Radar update failed:', error);
    if (!radarTokens.length && radarRows) radarRows.innerHTML = '<tr><td colspan="6" class="radar-message">' + radarText.unavailable + '<br><small>' + radarText.detail + '</small>' + '</td></tr>';
    if (radarStatus) radarStatus.textContent = radarTokens.length ? (radarText.last) : (radarText.interrupted);
    if (radarUpdated && !lastRadarSuccess) radarUpdated.textContent = radarText.retry;
  } finally {
    radarBusy = false;
    if (radarRefresh) { radarRefresh.disabled = false; radarRefresh.textContent = radarText.refresh; }
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
  const marketUi = {
    en:{scan:'SCANNING TOKEN…',unavailable:'MARKET DATA UNAVAILABLE',last:'LAST KNOWN DATA',activity:'PRICE AVAILABLE · ACTIVITY UNAVAILABLE',online:'TOKEN FEED ONLINE',lastUpdate:'LAST SOURCE UPDATE',updated:'SOURCE UPDATED',unknown:'UNKNOWN',error:'SIGNAL UNAVAILABLE',retry:'TRY REFRESHING LATER'},
    ru:{scan:'СКАНИРОВАНИЕ ТОКЕНА…',unavailable:'РЫНОЧНЫЕ ДАННЫЕ НЕДОСТУПНЫ',last:'ПОСЛЕДНИЕ ИЗВЕСТНЫЕ ДАННЫЕ',activity:'ЦЕНА ДОСТУПНА · АКТИВНОСТЬ НЕДОСТУПНА',online:'ПОТОК ТОКЕНА АКТИВЕН',lastUpdate:'ПОСЛЕДНЕЕ ОБНОВЛЕНИЕ ИСТОЧНИКА',updated:'ИСТОЧНИК ОБНОВЛЁН',unknown:'НЕИЗВЕСТНО',error:'СИГНАЛ НЕДОСТУПЕН',retry:'ПОПРОБУЙТЕ ОБНОВИТЬ ПОЗЖЕ'},
    de:{scan:'TOKEN WIRD GESCANNT…',unavailable:'MARKTDATEN NICHT VERFÜGBAR',last:'LETZTE BEKANNTE DATEN',activity:'PREIS VERFÜGBAR · AKTIVITÄT NICHT VERFÜGBAR',online:'TOKEN-FEED ONLINE',lastUpdate:'LETZTE QUELLENAKTUALISIERUNG',updated:'QUELLE AKTUALISIERT',unknown:'UNBEKANNT',error:'SIGNAL NICHT VERFÜGBAR',retry:'BITTE BALD ERNEUT AKTUALISIEREN'},
    fr:{scan:'ANALYSE DU TOKEN…',unavailable:'DONNÉES DE MARCHÉ INDISPONIBLES',last:'DERNIÈRES DONNÉES CONNUES',activity:'PRIX DISPONIBLE · ACTIVITÉ INDISPONIBLE',online:'FLUX DU TOKEN EN LIGNE',lastUpdate:'DERNIÈRE MISE À JOUR DE LA SOURCE',updated:'SOURCE ACTUALISÉE',unknown:'INCONNU',error:'SIGNAL INDISPONIBLE',retry:'RÉESSAYEZ D’ACTUALISER BIENTÔT'},
    it:{scan:'SCANSIONE TOKEN…',unavailable:'DATI DI MERCATO NON DISPONIBILI',last:'ULTIMI DATI NOTI',activity:'PREZZO DISPONIBILE · ATTIVITÀ NON DISPONIBILE',online:'FEED TOKEN ONLINE',lastUpdate:'ULTIMO AGGIORNAMENTO FONTE',updated:'FONTE AGGIORNATA',unknown:'SCONOSCIUTO',error:'SEGNALE NON DISPONIBILE',retry:'RIPROVA AD AGGIORNARE TRA POCO'},
    ja:{scan:'トークンをスキャン中…',unavailable:'市場データを利用できません',last:'最後に確認されたデータ',activity:'価格取得可能・取引活動は取得不可',online:'トークンフィード稼働中',lastUpdate:'ソース最終更新',updated:'ソース更新',unknown:'不明',error:'シグナル利用不可',retry:'しばらくして更新を試してください'},
    'zh-cn':{scan:'正在扫描代币…',unavailable:'市场数据不可用',last:'最近已知数据',activity:'价格可用 · 活跃度不可用',online:'代币数据流在线',lastUpdate:'来源上次更新',updated:'来源已更新',unknown:'未知',error:'信号不可用',retry:'请稍后尝试刷新'},
    tr:{scan:'TOKEN TARANIYOR…',unavailable:'PİYASA VERİSİ KULLANILAMIYOR',last:'SON BİLİNEN VERİ',activity:'FİYAT VAR · ETKİNLİK VERİSİ YOK',online:'TOKEN AKIŞI ÇEVRİMİÇİ',lastUpdate:'SON KAYNAK GÜNCELLEMESİ',updated:'KAYNAK GÜNCELLENDİ',unknown:'BİLİNMİYOR',error:'SİNYAL KULLANILAMIYOR',retry:'KISA SÜRE SONRA YENİDEN DENEYİN'},
    hi:{scan:'टोकन स्कैन हो रहा है…',unavailable:'बाज़ार डेटा उपलब्ध नहीं',last:'अंतिम ज्ञात डेटा',activity:'कीमत उपलब्ध · गतिविधि उपलब्ध नहीं',online:'टोकन फ़ीड ऑनलाइन',lastUpdate:'स्रोत का अंतिम अपडेट',updated:'स्रोत अपडेट',unknown:'अज्ञात',error:'संकेत उपलब्ध नहीं',retry:'कुछ देर बाद रीफ़्रेश करें'}
  };
  const mz = () => marketUi[(document.documentElement.lang||'en').toLowerCase()] || marketUi.en;
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
    window.__zombcashMarketCardStarted = true;
    zomBusy = true;
    if (zomStatus) zomStatus.textContent = mz().scan;
    if (zomRefresh) zomRefresh.disabled = true;
    try {
      const response = await zcApiFetch('https://zombcash-bot.fadehost.app/api/zombcash', {cache:'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      zomPrice.textContent = zomPriceText(data.priceUsd);
      const changeValue = data.priceChange?.h24;
      const change = changeValue == null ? NaN : Number(changeValue);
      zomChange.textContent = Number.isFinite(change) ? (change > 0 ? '+' : '') + change.toFixed(2) + '%' : '—';
      zomChange.className = Number.isFinite(change) && change > 0 ? 'change-up' : Number.isFinite(change) && change < 0 ? 'change-down' : '';
      zomVolume.textContent = data.volume?.h24 == null ? '—' : zomMoney(data.volume.h24);
      zomLiquidity.textContent = zomMoney(data.liquidity?.usd);
      zomCap.textContent = zomMoney(data.marketCap || data.fdv);
      const sourceTime = Number(data.updatedAt || 0) * 1000;
      const hasPrice = data.priceUsd != null && data.priceUsd !== '' && Number.isFinite(Number(data.priceUsd)) && Number(data.priceUsd) > 0;
      if (zomStatus) zomStatus.textContent = !hasPrice ? mz().unavailable : (data.stale ? mz().last : (data.activityAvailable === false ? mz().activity : mz().online));
      if (zomUpdated) zomUpdated.textContent = (data.stale ? mz().lastUpdate + ' ' : mz().updated + ' ') + (sourceTime ? new Date(sourceTime).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) : mz().unknown);
    } catch (error) {
      console.warn('ZombieCash token market update failed:', error);
      if (zomStatus) zomStatus.textContent = mz().error;
      if (zomUpdated) zomUpdated.textContent = mz().retry;
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
  const uiLocale = (document.documentElement.lang || 'en').toLowerCase();
  const missionJapaneseUI = uiLocale === 'ja';
  const newsUi = {
    en:{sync:'SYNCING RSS',quiet:'RSS FEED QUIET',waiting:'WAITING FOR EXTERNAL NEWS',online:'RSS FEED ONLINE',last:'LAST KNOWN RSS',updated:'UPDATED',interrupted:'SIGNAL INTERRUPTED',retry:'RETRYING AUTOMATICALLY',empty:'No external RSS transmissions are available right now. The feed will retry automatically.',quietError:'The RSS frequencies are quiet right now. The feed will retry automatically.',original:'☣ ZOMBIECASH ORIGINAL',znews:'ZOMBIECASH NEWS',rss:'RSS TRANSMISSION',comment:'🧟 ZOMBIE COMMENTARY'},
    ru:{sync:'СИНХРОНИЗАЦИЯ RSS',quiet:'RSS ЛЕНТА ПУСТА',waiting:'ОЖИДАНИЕ ВНЕШНИХ НОВОСТЕЙ',online:'RSS ЛЕНТА АКТИВНА',last:'ПОСЛЕДНИЙ RSS СНИМОК',updated:'ОБНОВЛЕНО',interrupted:'СИГНАЛ ПРЕРВАН',retry:'АВТОМАТИЧЕСКИЙ ПОВТОР',empty:'Сейчас нет внешних RSS-передач. Лента попробует обновиться автоматически.',quietError:'RSS-частоты сейчас тихи. Лента попробует обновиться автоматически.',original:'☣ ОРИГИНАЛ ZOMBIECASH',znews:'НОВОСТИ ZOMBIECASH',rss:'RSS-ПЕРЕДАЧА',comment:'🧟 КОММЕНТАРИЙ ЗОМБИ'},
    de:{sync:'RSS-SYNCHRONISIERUNG',quiet:'RSS-FEED LEER',waiting:'WARTEN AUF EXTERNE NACHRICHTEN',online:'RSS-FEED ONLINE',last:'LETZTER RSS-STAND',updated:'AKTUALISIERT',interrupted:'SIGNAL UNTERBROCHEN',retry:'AUTOMATISCHER NEUVERSUCH',empty:'Derzeit sind keine externen RSS-Meldungen verfügbar. Der Feed versucht es erneut.',quietError:'Die RSS-Frequenzen sind derzeit ruhig. Der Feed versucht es erneut.',original:'☣ ZOMBIECASH ORIGINAL',znews:'ZOMBIECASH-NACHRICHTEN',rss:'RSS-MELDUNG',comment:'🧟 ZOMBIE-KOMMENTAR'},
    fr:{sync:'SYNCHRONISATION RSS',quiet:'FLUX RSS CALME',waiting:'EN ATTENTE DE NOUVELLES EXTERNES',online:'FLUX RSS EN LIGNE',last:'DERNIER ÉTAT RSS',updated:'MIS À JOUR',interrupted:'SIGNAL INTERROMPU',retry:'NOUVEL ESSAI AUTOMATIQUE',empty:'Aucune transmission RSS externe pour le moment. Le flux réessaiera automatiquement.',quietError:'Les fréquences RSS sont calmes. Le flux réessaiera automatiquement.',original:'☣ ORIGINAL ZOMBIECASH',znews:'ACTUALITÉS ZOMBIECASH',rss:'TRANSMISSION RSS',comment:'🧟 COMMENTAIRE ZOMBIE'},
    it:{sync:'SINCRONIZZAZIONE RSS',quiet:'FEED RSS QUIETO',waiting:'IN ATTESA DI NOTIZIE ESTERNE',online:'FEED RSS ONLINE',last:'ULTIMO STATO RSS',updated:'AGGIORNATO',interrupted:'SEGNALE INTERROTTO',retry:'NUOVO TENTATIVO AUTOMATICO',empty:'Al momento non sono disponibili trasmissioni RSS esterne. Il feed riproverà automaticamente.',quietError:'Le frequenze RSS sono silenziose. Il feed riproverà automaticamente.',original:'☣ ORIGINALE ZOMBIECASH',znews:'NOTIZIE ZOMBIECASH',rss:'TRASMISSIONE RSS',comment:'🧟 COMMENTO ZOMBIE'},
    ja:{sync:'RSS同期中',quiet:'RSS配信なし',waiting:'外部ニュースを待機中',online:'RSSオンライン',last:'最新RSS状態',updated:'更新',interrupted:'シグナル中断',retry:'自動再試行中',empty:'現在、外部RSSニュースはありません。自動で再試行します。',quietError:'RSSの受信が静かな状態です。自動で再試行します。',original:'☣ ZOMBIECASHオリジナル',znews:'ZOMBIECASHニュース',rss:'RSS配信',comment:'🧟 ゾンビ解説'},
    'zh-cn':{sync:'RSS同步中',quiet:'RSS暂无内容',waiting:'等待外部新闻',online:'RSS在线',last:'最近RSS状态',updated:'更新于',interrupted:'信号中断',retry:'自动重试中',empty:'目前没有外部RSS资讯，系统将自动重试。',quietError:'RSS频道暂时安静，系统将自动重试。',original:'☣ ZOMBIECASH原创',znews:'ZOMBIECASH新闻',rss:'RSS传讯',comment:'🧟 僵尸点评'},
    tr:{sync:'RSS SENKRONİZE EDİLİYOR',quiet:'RSS AKIŞI SESSİZ',waiting:'HARİCİ HABERLER BEKLENİYOR',online:'RSS AKTİF',last:'SON RSS DURUMU',updated:'GÜNCELLENDİ',interrupted:'SİNYAL KESİLDİ',retry:'OTOMATİK YENİDEN DENENİYOR',empty:'Şu anda harici RSS yayını yok. Akış otomatik olarak yeniden denenecek.',quietError:'RSS frekansları şu an sessiz. Akış yeniden denenecek.',original:'☣ ZOMBIECASH ORİJİNAL',znews:'ZOMBIECASH HABERLERİ',rss:'RSS İLETİSİ',comment:'🧟 ZOMBİ YORUMU'},
    hi:{sync:'RSS सिंक हो रहा है',quiet:'RSS फ़ीड शांत है',waiting:'बाहरी समाचार की प्रतीक्षा',online:'RSS फ़ीड ऑनलाइन',last:'अंतिम RSS स्थिति',updated:'अपडेट',interrupted:'सिग्नल बाधित',retry:'स्वचालित पुनः प्रयास',empty:'अभी कोई बाहरी RSS समाचार उपलब्ध नहीं है। फ़ीड स्वतः पुनः प्रयास करेगी।',quietError:'RSS फ़्रीक्वेंसी अभी शांत हैं। फ़ीड स्वतः पुनः प्रयास करेगी।',original:'☣ ZOMBIECASH ओरिजिनल',znews:'ZOMBIECASH समाचार',rss:'RSS प्रसारण',comment:'🧟 ज़ॉम्बी टिप्पणी'}
  };
  const newsText = newsUi[uiLocale] || newsUi.en;
  const apiBase = 'https://zombcash-bot.fadehost.app';
  const newsList = document.getElementById('world-news-list');
  const newsStatus = document.getElementById('world-news-status');
  const newsUpdated = document.getElementById('world-news-updated');
  const alertList = document.getElementById('world-alert-list');
  const alertStatus = document.getElementById('world-alarm-status');
  const missionList = document.getElementById('world-missions');
  const missionCount = document.getElementById('world-mission-count');
  const missionDate = document.getElementById('world-mission-date');
  if (!missionList) return;

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

  if (!document.getElementById('zombcash-enriched-news-styles')) {
    const style = document.createElement('style');
    style.id = 'zombcash-enriched-news-styles';
    style.textContent = `
      .world-news-item.is-enriched{display:flex;flex-direction:column;gap:9px}
      .world-news-image{display:block;width:100%;height:auto;aspect-ratio:16/9;max-height:210px;object-fit:cover;border:1px solid #344b2d;background:#080d0a}
      .world-news-kind{display:inline-flex;align-self:flex-start;border:1px solid #567d36;padding:4px 7px;color:#a4ff43;font:700 8px Orbitron,sans-serif;letter-spacing:1px}
      .world-news-commentary{display:block;margin:2px 0 0;padding:10px 12px;border-left:2px solid #9bff45;background:linear-gradient(90deg,#9bff450d,transparent);color:#c9d7c2;font:500 13px/1.55 Rajdhani,sans-serif}
      .world-news-commentary b{display:block;margin-bottom:5px;color:#a4ff43;font:700 8px Orbitron,sans-serif;letter-spacing:1px}
      .world-news-telegram{display:inline-block;margin-top:2px;color:#9bff45;font:700 8px Orbitron,sans-serif;letter-spacing:.7px}
    `;
    document.head.append(style);
  }

  async function loadWorldNews() {
    window.__zombcashWorldNewsStarted = true;
    if (newsStatus) newsStatus.textContent = newsText.sync;
    try {
      const response = await zcApiFetch(apiBase + '/api/news', {cache:'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      const newsTopics = /\b(crypto|cryptocurrency|bitcoin|btc|ethereum|eth|solana|blockchain|defi|web3|token|wallet|exchange|digital asset|stablecoin|nft|fintech|artificial intelligence|\bai\b|machine learning|chip|semiconductor|cybersecurity|software|privacy|technology|tech)\b/i;
      const coreCryptoPublishers = /\b(coindesk|cointelegraph|the block)\b/i;
      const articles = Array.isArray(data.articles) ? data.articles.filter(article => {
        if (!article) return false;
        if (article.enriched === true) return article.kind === 'news';
        const source = String(article.source || '');
        const text = String(article.title || '') + ' ' + String(article.summary || '');
        // Keep ordinary external RSS, but remove unrelated general-news stories from this crypto/technology panel.
        return coreCryptoPublishers.test(source) || newsTopics.test(text);
      }) : [];
      if (!articles.length) {
        newsList.replaceChildren(makeNode('p', 'world-empty', newsText.empty));
        if (newsStatus) newsStatus.textContent = newsText.quiet;
        if (newsUpdated) newsUpdated.textContent = newsText.waiting;
        return;
      }
      newsList.replaceChildren();
      const seenArticleLinks = new Set();
      const seenArticleTitles = new Map();
      let renderedArticles = 0;
      for (const article of articles) {
        if (renderedArticles >= 7) break;
        const rawLink = String(article.link || '').trim();
        let identityLink = '';
        if (/^https?:\/\//i.test(rawLink)) {
          try {
            const parsed = new URL(rawLink);
            parsed.hash = '';
            [...parsed.searchParams.keys()].forEach(key => {
              if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$)/i.test(key)) parsed.searchParams.delete(key);
            });
            identityLink = parsed.origin + parsed.pathname.replace(/\/+$/, '') + parsed.search;
          } catch (_) {}
        }
        const identityTitle = String(article.title || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
        const duplicateByLink = identityLink && seenArticleLinks.has(identityLink);
        const duplicateByTitle = identityTitle && seenArticleTitles.has(identityTitle);
        if (duplicateByLink || duplicateByTitle) {
          const existingCard = duplicateByTitle ? seenArticleTitles.get(identityTitle) : null;
          // If a Telegram worker enriched an RSS story with Zombie Commentary, merge the commentary into the existing card rather than losing it to deduplication.
          if (existingCard && article.commentary && !existingCard.querySelector('.world-news-commentary')) {
            const commentary = makeNode('div', 'world-news-commentary');
            commentary.append(makeNode('b', '', newsText.comment), makeNode('span', '', article.commentary));
            existingCard.append(commentary);
            existingCard.classList.add('is-enriched');
          }
          continue;
        }
        if (identityLink) seenArticleLinks.add(identityLink);
        const link = document.createElement('a');
        link.className = 'world-news-item' + (article.enriched ? ' is-enriched' : '');
        link.href = /^https?:\/\//i.test(article.link || '') ? article.link : '#living-world';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        if (article.imageUrl) {
          const image = makeNode('img', 'world-news-image');
          image.width = 640;
          image.height = 360;
          image.src = /^https?:\/\//i.test(article.imageUrl) ? article.imageUrl : apiBase + article.imageUrl;
          image.alt = (article.imageSource === 'rss' || article.imageSource === 'publisher') ? 'Original publisher image for ' + (article.title || 'news') : 'ZombieCash news image for ' + (article.title || 'news');
          image.loading = 'lazy';
          image.referrerPolicy = 'no-referrer';
          link.append(image);
        }
        if (article.enriched) link.append(makeNode('span', 'world-news-kind', newsText.original));
        const meta = makeNode('span', 'world-news-meta');
        meta.append(makeNode('span', '', article.enriched ? newsText.znews : (article.source || newsText.rss)));
        meta.append(makeNode('time', '', safeDate(article.published)));
        link.append(meta, makeNode('strong', 'world-news-title', article.title || 'Untitled transmission'));
        if (article.summary) link.append(makeNode('p', 'world-news-summary', article.summary));
        if (article.commentary) {
          const commentary = makeNode('div', 'world-news-commentary');
          commentary.append(makeNode('b', '', newsText.comment));
          commentary.append(makeNode('span', '', article.commentary));
          link.append(commentary);
        }
        newsList.append(link);
        if (identityTitle) seenArticleTitles.set(identityTitle, link);
        renderedArticles += 1;
      }
      const updatedAtMs = Number(data.updatedAt || 0) * 1000;
      const apiSnapshotStale = !Number.isFinite(updatedAtMs) || updatedAtMs <= 0 || (Date.now() - updatedAtMs) > 45 * 60 * 1000;
      if (newsStatus) newsStatus.textContent = (data.stale === true || apiSnapshotStale) ? newsText.last : newsText.online;
      if (newsUpdated) newsUpdated.textContent = newsText.updated + ' ' + (updatedAtMs > 0 ? new Date(updatedAtMs).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) : newsText.waiting);
    } catch (error) {
      console.warn('Living World RSS unavailable:', error);
      if (newsStatus) newsStatus.textContent = newsText.interrupted;
      if (!newsList.querySelector('.world-news-item')) {
        newsList.replaceChildren(makeNode('p', 'world-empty', newsText.quietError));
      }
      if (newsUpdated) newsUpdated.textContent = newsText.retry;
    }
  }

  const alarmLocale = (document.documentElement.lang || 'en').toLowerCase();
const alarmUi = {
en:['MARKET CONNECTION','Could not confirm the latest $ZOMBCASH snapshot. The API will retry.','RETRYING','STALE MARKET SNAPSHOT','The source could not refresh; showing the last known data.','PRICE SURGE WATCH','$ZOMBCASH is up {n}% over 24h. Check liquidity and volatility before acting.','VOLATILE','DOWNSIDE ALERT','$ZOMBCASH is down {n}% over 24h. Review market conditions carefully.','HIGH VOLATILITY','VOLUME ACTIVITY','24h trading volume has reached $','OBSERVE','NO CRITICAL PRICE ALERTS','No ±10% 24h move detected in the latest snapshot. Stay curious, not careless.','MONITORING','SOLANA RADAR','Use the live radar to inspect other boosted tokens and compare liquidity.','LIVE','CONNECTION ISSUE','STALE DATA','MONITORING'],
ru:['СВЯЗЬ С РЫНКОМ','Не удалось подтвердить последний снимок $ZOMBCASH. API повторит запрос.','ПОВТОР','УСТАРЕВШИЕ ДАННЫЕ РЫНКА','Источник не обновился; показаны последние известные данные.','СЛЕДИМ ЗА РОСТОМ','$ZOMBCASH вырос на {n}% за 24 часа. Проверяйте ликвидность и волатильность.','ВОЛАТИЛЬНОСТЬ','СИГНАЛ ПАДЕНИЯ','$ZOMBCASH снизился на {n}% за 24 часа. Оцените рыночную ситуацию.','ВЫСОКАЯ ВОЛАТИЛЬНОСТЬ','АКТИВНОСТЬ ОБЪЁМА','Объём торгов за 24 часа достиг $','НАБЛЮДАТЬ','КРИТИЧЕСКИХ СИГНАЛОВ НЕТ','За последние 24 часа не зафиксировано изменение ±10%. Будьте внимательны.','НАБЛЮДЕНИЕ','РАДАР SOLANA','Изучайте другие токены через радар и сравнивайте ликвидность.','АКТИВЕН','ПРОБЛЕМА С СОЕДИНЕНИЕМ','УСТАРЕВШИЕ ДАННЫЕ','НАБЛЮДЕНИЕ'],
de:['MARKTVERBINDUNG','Der aktuelle $ZOMBCASH-Datenstand konnte nicht bestätigt werden. Die API versucht es erneut.','NEUER VERSUCH','VERALTETER MARKTSTAND','Die Quelle konnte nicht aktualisiert werden; der letzte bekannte Stand wird angezeigt.','KURSANSTIEG BEOBACHTEN','$ZOMBCASH liegt 24 Stunden um {n}% im Plus. Prüfe Liquidität und Volatilität.','VOLATIL','ABWÄRTSALARM','$ZOMBCASH liegt 24 Stunden um {n}% im Minus. Prüfe die Marktlage.','HOHE VOLATILITÄT','HANDELSVOLUMEN','Das 24-Stunden-Handelsvolumen beträgt $','BEOBACHTEN','KEINE KRITISCHEN PREISSIGNALE','Keine Veränderung von ±10 % in 24 Stunden erkannt. Bleib aufmerksam.','ÜBERWACHUNG','SOLANA-RADAR','Nutze das Live-Radar, um andere Token und ihre Liquidität zu vergleichen.','LIVE','VERBINDUNGSPROBLEM','VERALTETE DATEN','ÜBERWACHUNG'],
fr:['CONNEXION AU MARCHÉ','Impossible de confirmer le dernier instantané $ZOMBCASH. L’API réessaiera.','NOUVEL ESSAI','DONNÉES MARCHÉ OBSOLÈTES','La source n’a pas pu actualiser les données ; affichage du dernier état connu.','SURVEILLANCE DE LA HAUSSE','$ZOMBCASH est en hausse de {n}% sur 24 h. Vérifiez liquidité et volatilité.','VOLATIL','ALERTE À LA BAISSE','$ZOMBCASH baisse de {n}% sur 24 h. Examinez les conditions du marché.','FORTE VOLATILITÉ','ACTIVITÉ DU VOLUME','Le volume de trading sur 24 h atteint $','OBSERVER','AUCUNE ALERTE DE PRIX CRITIQUE','Aucun mouvement de ±10 % sur 24 h détecté. Restez vigilant.','SURVEILLANCE','RADAR SOLANA','Utilisez le radar pour examiner d’autres tokens et comparer leur liquidité.','EN DIRECT','PROBLÈME DE CONNEXION','DONNÉES OBSOLÈTES','SURVEILLANCE'],
it:['CONNESSIONE AL MERCATO','Impossibile confermare l’ultimo snapshot $ZOMBCASH. L’API riproverà.','NUOVO TENTATIVO','DATI DI MERCATO OBSOLETI','La fonte non si è aggiornata; vengono mostrati gli ultimi dati disponibili.','MONITORAGGIO RIALZO','$ZOMBCASH è in aumento del {n}% in 24 ore. Controlla liquidità e volatilità.','VOLATILE','ALLERTA RIBASSO','$ZOMBCASH è in calo del {n}% in 24 ore. Valuta le condizioni di mercato.','ALTA VOLATILITÀ','ATTIVITÀ VOLUMI','Il volume di trading nelle 24 ore ha raggiunto $','OSSERVA','NESSUN ALLARME PREZZO CRITICO','Nessuna variazione di ±10% nelle ultime 24 ore. Mantieni l’attenzione.','MONITORAGGIO','RADAR SOLANA','Usa il radar live per esaminare altri token e confrontare la liquidità.','LIVE','PROBLEMA DI CONNESSIONE','DATI OBSOLETI','MONITORAGGIO'],
ja:['市場接続','最新の$ZOMBCASHデータを確認できません。APIは再試行します。','再試行中','市場データが古い','データソースを更新できません。前回のデータを表示しています。','価格上昇を監視','$ZOMBCASHは24時間で{n}%上昇。流動性と変動に注意してください。','変動中','下落アラート','$ZOMBCASHは24時間で{n}%下落。市場状況を確認してください。','高い変動性','取引量の動き','24時間の取引量は$','監視','重大な価格アラートなし','直近24時間で±10%の変動は確認されていません。慎重に行動しましょう。','監視中','SOLANAレーダー','ライブレーダーで他のトークンを確認し、流動性を比較してください。','ライブ','接続の問題','古いデータ','監視中'],
'zh-cn':['市场连接','无法确认最新的$ZOMBCASH数据。API将重试。','正在重试','市场数据已过期','数据源未能刷新，显示最近已知数据。','关注价格上涨','$ZOMBCASH 24小时上涨{n}%。请关注流动性和波动。','波动','下跌警报','$ZOMBCASH 24小时下跌{n}%。请评估市场状况。','高波动','交易量活动','24小时交易量达到$','观察','暂无重大价格警报','最近24小时未发现±10%的变动。保持谨慎。','监测中','SOLANA雷达','使用实时雷达查看其他代币并比较流动性。','实时','连接异常','数据过期','监测中'],
tr:['PİYASA BAĞLANTISI','En son $ZOMBCASH verisi doğrulanamadı. API yeniden deneyecek.','YENİDEN DENENİYOR','ESKİ PİYASA VERİSİ','Kaynak yenilenemedi; son bilinen veriler gösteriliyor.','YÜKSELİŞ TAKİBİ','$ZOMBCASH 24 saatte {n}% yükseldi. Likidite ve oynaklığı kontrol edin.','VOLATİL','DÜŞÜŞ UYARISI','$ZOMBCASH 24 saatte {n}% düştü. Piyasa koşullarını inceleyin.','YÜKSEK OYNAKLIK','İŞLEM HACMİ','24 saatlik işlem hacmi $','İZLE','KRİTİK FİYAT UYARISI YOK','Son 24 saatte ±10% hareket görülmedi. Dikkatli olun.','İZLENİYOR','SOLANA RADARI','Canlı radarda diğer tokenları inceleyip likiditeyi karşılaştırın.','CANLI','BAĞLANTI SORUNU','ESKİ VERİ','İZLENİYOR'],
hi:['मार्केट कनेक्शन','$ZOMBCASH का नवीनतम डेटा सत्यापित नहीं हो सका। API पुनः प्रयास करेगी।','पुनः प्रयास','पुराना मार्केट डेटा','स्रोत अपडेट नहीं हुआ; पिछला ज्ञात डेटा दिखाया जा रहा है।','मूल्य वृद्धि पर नज़र','$ZOMBCASH 24 घंटे में {n}% बढ़ा। लिक्विडिटी और अस्थिरता जाँचें।','अस्थिर','गिरावट चेतावनी','$ZOMBCASH 24 घंटे में {n}% गिरा। बाज़ार स्थिति की समीक्षा करें।','उच्च अस्थिरता','वॉल्यूम गतिविधि','24 घंटे का ट्रेडिंग वॉल्यूम $','नज़र रखें','कोई गंभीर मूल्य अलर्ट नहीं','पिछले 24 घंटे में ±10% बदलाव नहीं मिला। सावधानी रखें।','निगरानी','SOLANA रडार','लाइव रडार पर अन्य टोकन देखें और लिक्विडिटी तुलना करें।','लाइव','कनेक्शन समस्या','पुराना डेटा','निगरानी']
};
const alarmText = alarmUi[alarmLocale] || alarmUi.en;
function renderAlarms(market, error) {
 if (!alertList) return;
 const t=alarmText, alerts=[];
 if(error||!market) alerts.push({level:'warn',icon:'⚠',title:t[0],message:t[1],badge:t[2]});
 else {
  const change=Number(market.priceChange?.h24),volume=Number(market.volume?.h24);
  if(market.stale) alerts.push({level:'warn',icon:'⚠',title:t[3],message:t[4],badge:t[21]});
  if(Number.isFinite(change)&&change>=10) alerts.push({level:'warn',icon:'↗',title:t[5],message:t[6].replace('{n}',change.toFixed(2)),badge:t[7]});
  else if(Number.isFinite(change)&&change<=-10) alerts.push({level:'danger',icon:'↘',title:t[8],message:t[9].replace('{n}',Math.abs(change).toFixed(2)),badge:t[10]});
  if(Number.isFinite(volume)&&volume>=10000) alerts.push({level:'',icon:'◉',title:t[11],message:t[12]+volume.toLocaleString('en-US',{maximumFractionDigits:0})+'.',badge:t[13]});
  if(!alerts.length) alerts.push({level:'',icon:'◉',title:t[14],message:t[15],badge:t[16]});
  alerts.push({level:'',icon:'⌁',title:t[17],message:t[18],badge:t[19]});
 }
 alertList.replaceChildren();
 alerts.forEach(alert=>{const row=makeNode('div','world-alert'+(alert.level?' alert-'+alert.level:''));row.append(makeNode('span','alert-icon',alert.icon));const body=makeNode('div','');body.append(makeNode('strong','',alert.title),makeNode('p','',alert.message));row.append(body,makeNode('span','alert-level',alert.badge));alertList.append(row);});
 if(alertStatus) alertStatus.textContent=error?t[20]:(market?.stale?t[21]:t[22]);
}
  async function loadMarketAlarms() {
    try {
      const response = await zcApiFetch(apiBase + '/api/zombcash', {cache:'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      renderAlarms(await response.json(), false);
    } catch (error) {
      console.warn('Living World market alarms unavailable:', error);
      renderAlarms(null, true);
    }
  }

  const missionLocale = (document.documentElement.lang || 'en').toLowerCase();
  const missionUi = {
 en:{sets:[[['Scan the outbreak','Open the live Solana radar and inspect one token.','#living-world','OPEN RADAR ↗'],['Check the signal','Review $ZOMBCASH movement and market activity.','#community-console','CHECK MARKET ↗'],['Report to the crew','Visit the Telegram community and share one useful thought.','https://t.me/ZombieCashCTO','JOIN THE CREW ↗']], [['Read a transmission','Open one story in the live news feed.','#living-world','READ NEWS ↗'],['Compare survivors','Compare volume and liquidity for two radar tokens.','#living-world','COMPARE TOKENS ↗'],['Join the resistance','Check the latest project discussion in Telegram.','https://t.me/ZombieCashCTO','OPEN COMMUNITY ↗']], [['Inspect the market','Review the latest $ZOMBCASH market snapshot.','#community-console','VIEW MARKET ↗'],['Find a new signal','Explore the radar for a token you have not seen before.','#living-world','EXPLORE RADAR ↗'],['Spread the signal','Share the ZombieCash homepage with another survivor.','https://t.me/ZOMBCASH','OPEN CHANNEL ↗']]],done:'DONE',reset:'DAILY RESET',resetButton:'RESET MISSIONS',progress:'MISSIONS COMPLETE'},
 ru:{sets:[[['Сканировать заражение','Откройте радар Solana и изучите один токен.','#living-world','ОТКРЫТЬ РАДАР ↗'],['Проверить сигнал','Изучите динамику $ZOMBCASH и активность рынка.','#community-console','ПРОВЕРИТЬ РЫНОК ↗'],['Доложить группе','Посетите Telegram и поделитесь полезной мыслью.','https://t.me/ZombieCashCTO','ВСТУПИТЬ ↗']], [['Прочитать передачу','Откройте одну новость в ленте.','#living-world','ЧИТАТЬ НОВОСТИ ↗'],['Сравнить выживших','Сравните объём и ликвидность двух токенов радара.','#living-world','СРАВНИТЬ ↗'],['Вступить в сопротивление','Посмотрите последнее обсуждение проекта в Telegram.','https://t.me/ZombieCashCTO','ОТКРЫТЬ ГРУППУ ↗']], [['Изучить рынок','Посмотрите последний рыночный снимок $ZOMBCASH.','#community-console','РЫНОК ↗'],['Найти новый сигнал','Найдите на радаре токен, который ещё не изучали.','#living-world','ИСКАТЬ НА РАДАРЕ ↗'],['Распространить сигнал','Поделитесь сайтом ZombieCash с другим выжившим.','https://t.me/ZOMBCASH','ОТКРЫТЬ КАНАЛ ↗']]],done:'ВЫПОЛНЕНО',reset:'СБРОС ЕЖЕДНЕВНО',resetButton:'СБРОСИТЬ ЗАДАНИЯ',progress:'ЗАДАНИЙ ВЫПОЛНЕНО'},
 de:{sets:[[['Ausbruch scannen','Öffne den Solana-Live-Radar und prüfe einen Token.','#living-world','RADAR ÖFFNEN ↗'],['Signal prüfen','Prüfe Kursbewegung und Marktaktivität von $ZOMBCASH.','#community-console','MARKT PRÜFEN ↗'],['Crew informieren','Besuche Telegram und teile einen hilfreichen Gedanken.','https://t.me/ZombieCashCTO','CREW BEITRETEN ↗']], [['Meldung lesen','Öffne eine Meldung im Live-Newsfeed.','#living-world','NEWS LESEN ↗'],['Überlebende vergleichen','Vergleiche Volumen und Liquidität zweier Radar-Token.','#living-world','TOKEN VERGLEICHEN ↗'],['Widerstand beitreten','Sieh dir die aktuelle Projektdiskussion auf Telegram an.','https://t.me/ZombieCashCTO','COMMUNITY ÖFFNEN ↗']], [['Markt prüfen','Sieh dir den aktuellen $ZOMBCASH-Marktsnapshot an.','#community-console','MARKT ANSEHEN ↗'],['Neues Signal finden','Suche im Radar nach einem noch unbekannten Token.','#living-world','RADAR ERKUNDEN ↗'],['Signal verbreiten','Teile die ZombieCash-Website mit einem anderen Überlebenden.','https://t.me/ZOMBCASH','KANAL ÖFFNEN ↗']]],done:'ERLEDIGT',reset:'TÄGLICHER RESET',resetButton:'MISSIONEN ZURÜCKSETZEN',progress:'MISSIONEN ERLEDIGT'},
 fr:{sets:[[['Scanner l’épidémie','Ouvrez le radar Solana et examinez un token.','#living-world','OUVRIR LE RADAR ↗'],['Vérifier le signal','Consultez le cours et l’activité de marché de $ZOMBCASH.','#community-console','VOIR LE MARCHÉ ↗'],['Informer l’équipe','Visitez Telegram et partagez une idée utile.','https://t.me/ZombieCashCTO','REJOINDRE ↗']], [['Lire une transmission','Ouvrez un article du flux d’actualités.','#living-world','LIRE LES NEWS ↗'],['Comparer les survivants','Comparez volume et liquidité de deux tokens du radar.','#living-world','COMPARER ↗'],['Rejoindre la résistance','Consultez la discussion récente sur Telegram.','https://t.me/ZombieCashCTO','COMMUNAUTÉ ↗']], [['Inspecter le marché','Consultez le dernier snapshot de $ZOMBCASH.','#community-console','VOIR LE MARCHÉ ↗'],['Trouver un nouveau signal','Explorez le radar pour un token encore inconnu.','#living-world','EXPLORER ↗'],['Diffuser le signal','Partagez le site ZombieCash avec un autre survivant.','https://t.me/ZOMBCASH','OUVRIR LE CANAL ↗']]],done:'TERMINÉ',reset:'RESET QUOTIDIEN',resetButton:'RÉINITIALISER',progress:'MISSIONS TERMINÉES'},
 it:{sets:[[['Scansiona l’epidemia','Apri il radar Solana e controlla un token.','#living-world','APRI RADAR ↗'],['Controlla il segnale','Verifica andamento e attività di mercato di $ZOMBCASH.','#community-console','CONTROLLA MERCATO ↗'],['Avvisa la squadra','Visita Telegram e condividi un pensiero utile.','https://t.me/ZombieCashCTO','UNISCITI ↗']], [['Leggi una trasmissione','Apri una notizia nel feed live.','#living-world','LEGGI NEWS ↗'],['Confronta i sopravvissuti','Confronta volume e liquidità di due token del radar.','#living-world','CONFRONTA ↗'],['Unisciti alla resistenza','Controlla la discussione recente su Telegram.','https://t.me/ZombieCashCTO','COMMUNITY ↗']], [['Esamina il mercato','Controlla l’ultimo snapshot di $ZOMBCASH.','#community-console','VEDI MERCATO ↗'],['Trova un nuovo segnale','Cerca nel radar un token che non hai ancora visto.','#living-world','ESPLORA RADAR ↗'],['Diffondi il segnale','Condividi il sito ZombieCash con un altro sopravvissuto.','https://t.me/ZOMBCASH','APRI CANALE ↗']]],done:'COMPLETATO',reset:'RESET GIORNALIERO',resetButton:'RESET MISSIONI',progress:'MISSIONI COMPLETATE'},
 ja:{sets:[[['感染状況をスキャン','Solanaのライブレーダーを開き、トークンを1つ確認する。','#living-world','レーダーを開く ↗'],['シグナルを確認','$ZOMBCASHの値動きと市場活動を確認する。','#community-console','市場を確認 ↗'],['クルーに報告','Telegramコミュニティを訪れ、有益な考えを共有する。','https://t.me/ZombieCashCTO','クルーに参加 ↗']], [['通信を読む','ライブニュースフィードの記事を1件開く。','#living-world','ニュースを読む ↗'],['トークンを比較','レーダーにある2つのトークンの取引量と流動性を比較する。','#living-world','トークンを比較 ↗'],['コミュニティに参加','Telegramでプロジェクトの最新の議論を確認する。','https://t.me/ZombieCashCTO','コミュニティを開く ↗']], [['市場を調査','$ZOMBCASHの最新市場スナップショットを確認する。','#community-console','市場を見る ↗'],['新しいシグナルを探す','まだ見たことのないトークンをレーダーで探す。','#living-world','レーダーを探索 ↗'],['シグナルを広める','ZombieCashのホームページを仲間に共有する。','https://t.me/ZOMBCASH','チャンネルを開く ↗']]],done:'完了',reset:'毎日リセット',resetButton:'ミッションをリセット',progress:'ミッション完了'},
 'zh-cn':{sets:[[['扫描疫情','打开 Solana 实时雷达并查看一个代币。','#living-world','打开雷达 ↗'],['检查信号','查看 $ZOMBCASH 价格走势和市场活动。','#community-console','查看市场 ↗'],['向队伍报告','访问 Telegram 社区并分享有用观点。','https://t.me/ZombieCashCTO','加入队伍 ↗']], [['阅读传讯','打开实时新闻 feed 中的一条新闻。','#living-world','阅读新闻 ↗'],['比较幸存者','比较雷达中两个代币的成交量和流动性。','#living-world','比较代币 ↗'],['加入抵抗','查看 Telegram 中项目的最新讨论。','https://t.me/ZombieCashCTO','打开社区 ↗']], [['检查市场','查看最新 $ZOMBCASH 市场快照。','#community-console','查看市场 ↗'],['寻找新信号','在雷达中寻找尚未查看的代币。','#living-world','探索雷达 ↗'],['传播信号','将 ZombieCash 网站分享给另一位幸存者。','https://t.me/ZOMBCASH','打开频道 ↗']]],done:'已完成',reset:'每日重置',resetButton:'重置任务',progress:'任务完成'},
 tr:{sets:[[['Salgını tara','Solana canlı radarını aç ve bir token incele.','#living-world','RADARI AÇ ↗'],['Sinyali kontrol et','$ZOMBCASH hareketini ve piyasa etkinliğini incele.','#community-console','PİYASAYI KONTROL ↗'],['Ekibe bildir','Telegram topluluğunu ziyaret edip faydalı bir fikir paylaş.','https://t.me/ZombieCashCTO','EKİBE KATIL ↗']], [['Bir yayın oku','Canlı haber akışından bir haber aç.','#living-world','HABERLERİ OKU ↗'],['Hayatta kalanları karşılaştır','Radardaki iki tokenın hacim ve likiditesini karşılaştır.','#living-world','TOKENLARI KARŞILAŞTIR ↗'],['Direnişe katıl','Telegram’daki son proje tartışmasını kontrol et.','https://t.me/ZombieCashCTO','TOPLULUĞU AÇ ↗']], [['Piyasayı incele','En son $ZOMBCASH piyasa görüntüsünü kontrol et.','#community-console','PİYASAYI GÖR ↗'],['Yeni sinyal bul','Radarda henüz görmediğin bir token keşfet.','#living-world','RADARI KEŞFET ↗'],['Sinyali yay','ZombieCash sitesini başka bir hayatta kalanla paylaş.','https://t.me/ZOMBCASH','KANALI AÇ ↗']]],done:'TAMAMLANDI',reset:'GÜNLÜK SIFIRLAMA',resetButton:'GÖREVLERİ SIFIRLA',progress:'GÖREV TAMAMLANDI'},
 hi:{sets:[[['प्रकोप स्कैन करें','Solana लाइव रडार खोलें और एक टोकन देखें।','#living-world','रडार खोलें ↗'],['सिग्नल जाँचें','$ZOMBCASH की कीमत और मार्केट गतिविधि देखें।','#community-console','मार्केट देखें ↗'],['टीम को रिपोर्ट करें','Telegram समुदाय पर जाएँ और उपयोगी विचार साझा करें।','https://t.me/ZombieCashCTO','टीम में शामिल ↗']], [['प्रसारण पढ़ें','लाइव न्यूज़ फ़ीड में एक समाचार खोलें।','#living-world','समाचार पढ़ें ↗'],['सर्वाइवर्स की तुलना','रडार के दो टोकन का वॉल्यूम और लिक्विडिटी तुलना करें।','#living-world','तुलना करें ↗'],['प्रतिरोध में शामिल हों','Telegram पर परियोजना की नवीनतम चर्चा देखें।','https://t.me/ZombieCashCTO','समुदाय खोलें ↗']], [['मार्केट जाँचें','$ZOMBCASH का नवीनतम मार्केट स्नैपशॉट देखें।','#community-console','मार्केट देखें ↗'],['नया सिग्नल खोजें','रडार पर ऐसा टोकन खोजें जिसे अभी तक नहीं देखा।','#living-world','रडार खोजें ↗'],['सिग्नल फैलाएँ','ZombieCash वेबसाइट किसी अन्य सर्वाइवर से साझा करें।','https://t.me/ZOMBCASH','चैनल खोलें ↗']]],done:'पूर्ण',reset:'दैनिक रीसेट',resetButton:'मिशन रीसेट करें',progress:'मिशन पूर्ण'}
 };
  const missionText = missionUi[missionLocale] || missionUi.en;
  const missionSets = missionText.sets;  const dayKey = new Date().toISOString().slice(0,10);
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
      const copy = makeNode('span', 'world-mission-copy');
      copy.append(makeNode('strong', '', mission[0]), makeNode('p', '', mission[1]));
      if (mission[2]) {
        const action = makeNode('a', 'world-mission-action', mission[3] || 'OPEN ↗');
        action.href = mission[2];
        if (/^https:\/\//i.test(mission[2])) { action.target = '_blank'; action.rel = 'noopener noreferrer'; }
        action.addEventListener('click', event => event.stopPropagation());
        copy.append(action);
      }
      label.append(checkbox, copy);
      missionList.append(label);
    });
    if (missionCount) missionCount.textContent = Math.min(done.length, missions.length) + ' / ' + missions.length + ' ' + missionText.done;
    if (missionDate) missionDate.textContent = missionText.reset + ' · ' + dayKey;
    const resetButton = document.getElementById('world-reset-missions');
    if (resetButton) resetButton.textContent = missionText.resetButton + ' ↻';
  }
  document.getElementById('world-reset-missions')?.addEventListener('click', () => {
    done = [];
    try { localStorage.removeItem(storageKey); } catch (_) {}
    renderMissions();
  });

  renderMissions();
  loadWorldNews();
  setInterval(loadWorldNews, 300000);
})();


// Community features: DexScreener trade counts, shared daily voting and survival leaderboard.
(() => {
  const communityLocale = (document.documentElement.lang || 'en').toLowerCase();
  const communityUi = {
    en:{poll:['More ZombieCash memes','Community raid mission','New survival game challenge'],activityLive:'DEXSCREENER LIVE',activityOffline:'SIGNAL OFFLINE',activityUnavailable:'Live trade counts are temporarily unavailable. They will retry automatically.',activityCount:(n)=>'DexScreener reports '+n+' transactions in this period. Counts are transactions, not unique buyers or wallets.',activityEmpty:'No transactions reported for this period in the latest DexScreener snapshot.',vote:'VOTE',votes:'VOTES',recorded:'VOTE RECORDED',open:'OPEN POLL',offline:'POLL OFFLINE',pollUnavailable:'The community poll is temporarily unavailable. Please try again shortly.',sending:'SENDING VOTE…',already:'ALREADY VOTED',failed:'VOTE FAILED',voteFailed:(e)=>'Could not save your vote: '+e,emptyBoard:'No records yet. Defend the base and claim the first spot.',record:'RECORD',communityRecord:'COMMUNITY RECORD',top:'TOP 10',boardOffline:'Leaderboard is temporarily unavailable.',scoreMin:'Score at least 10 points before saving.',submitting:'Submitting your record…',saved:'Record saved! Survival leaderboard updated.'},
    ru:{poll:['Больше мемов ZombieCash','Миссия рейда сообщества','Новый челлендж на выживание'],activityLive:'DEXSCREENER: В ЭФИРЕ',activityOffline:'СИГНАЛ НЕДОСТУПЕН',activityUnavailable:'Данные о сделках временно недоступны. Автоматически повторяем запрос.',activityCount:(n)=>'DexScreener показывает '+n+' сделок за период. Это число сделок, а не уникальных покупателей или кошельков.',activityEmpty:'В последнем снимке DexScreener за этот период сделок нет.',vote:'ГОЛОС',votes:'ГОЛОСОВ',recorded:'ГОЛОС ЗАПИСАН',open:'ОПРОС ОТКРЫТ',offline:'ОПРОС НЕДОСТУПЕН',pollUnavailable:'Опрос сообщества временно недоступен. Попробуйте позже.',sending:'ОТПРАВКА…',already:'УЖЕ ГОЛОСОВАЛИ',failed:'ОШИБКА ГОЛОСА',voteFailed:(e)=>'Не удалось сохранить голос: '+e,emptyBoard:'Записей пока нет. Защитите базу и займите первое место.',record:'РЕКОРД',communityRecord:'РЕКОРД СООБЩЕСТВА',top:'ТОП 10',boardOffline:'Таблица лидеров временно недоступна.',scoreMin:'Наберите минимум 10 очков, прежде чем сохранять.',submitting:'Сохраняем рекорд…',saved:'Рекорд сохранён! Таблица обновлена.'},
    de:{poll:['Mehr ZombieCash-Memes','Community-Raid-Mission','Neue Survival-Challenge'],activityLive:'DEXSCREENER LIVE',activityOffline:'SIGNAL OFFLINE',activityUnavailable:'Live-Handelsdaten sind vorübergehend nicht verfügbar. Neuer Versuch folgt automatisch.',activityCount:(n)=>'DexScreener meldet '+n+' Transaktionen in diesem Zeitraum. Transaktionen, keine einzigartigen Käufer oder Wallets.',activityEmpty:'Im aktuellen DexScreener-Snapshot wurden für diesen Zeitraum keine Transaktionen gemeldet.',vote:'STIMME',votes:'STIMMEN',recorded:'STIMME ERFASST',open:'UMFRAGE OFFEN',offline:'UMFRAGE OFFLINE',pollUnavailable:'Die Community-Umfrage ist vorübergehend nicht verfügbar. Bitte später erneut versuchen.',sending:'STIMME WIRD GESENDET…',already:'BEREITS ABGESTIMMT',failed:'ABSTIMMUNG FEHLGESCHLAGEN',voteFailed:(e)=>'Stimme konnte nicht gespeichert werden: '+e,emptyBoard:'Noch keine Rekorde. Verteidige die Basis und sichere den ersten Platz.',record:'REKORD',communityRecord:'COMMUNITY-REKORD',top:'TOP 10',boardOffline:'Rangliste ist vorübergehend nicht verfügbar.',scoreMin:'Erreiche mindestens 10 Punkte, bevor du speicherst.',submitting:'Rekord wird gesendet…',saved:'Rekord gespeichert! Rangliste aktualisiert.'},
    fr:{poll:['Plus de memes ZombieCash','Mission raid communautaire','Nouveau défi de survie'],activityLive:'DEXSCREENER EN DIRECT',activityOffline:'SIGNAL HORS LIGNE',activityUnavailable:'Les transactions en direct sont temporairement indisponibles. Nouvelle tentative automatique.',activityCount:(n)=>'DexScreener indique '+n+' transactions sur cette période. Il s’agit de transactions, pas d’acheteurs ou de portefeuilles uniques.',activityEmpty:'Aucune transaction signalée pour cette période dans le dernier instantané DexScreener.',vote:'VOTE',votes:'VOTES',recorded:'VOTE ENREGISTRÉ',open:'SONDAGE OUVERT',offline:'SONDAGE HORS LIGNE',pollUnavailable:'Le sondage communautaire est temporairement indisponible. Réessayez bientôt.',sending:'ENVOI DU VOTE…',already:'VOTE DÉJÀ EFFECTUÉ',failed:'ÉCHEC DU VOTE',voteFailed:(e)=>'Impossible d’enregistrer votre vote : '+e,emptyBoard:'Aucun record. Défendez la base et prenez la première place.',record:'RECORD',communityRecord:'RECORD COMMUNAUTAIRE',top:'TOP 10',boardOffline:'Le classement est temporairement indisponible.',scoreMin:'Obtenez au moins 10 points avant de sauvegarder.',submitting:'Enregistrement en cours…',saved:'Record enregistré ! Classement mis à jour.'},
    it:{poll:['Più meme ZombieCash','Missione raid della community','Nuova sfida di sopravvivenza'],activityLive:'DEXSCREENER LIVE',activityOffline:'SEGNALE OFFLINE',activityUnavailable:'Le transazioni live sono temporaneamente indisponibili. Nuovo tentativo automatico.',activityCount:(n)=>'DexScreener segnala '+n+' transazioni nel periodo. Sono transazioni, non acquirenti o wallet unici.',activityEmpty:'Nessuna transazione segnalata per questo periodo nell’ultimo snapshot DexScreener.',vote:'VOTO',votes:'VOTI',recorded:'VOTO REGISTRATO',open:'SONDAGGIO APERTO',offline:'SONDAGGIO OFFLINE',pollUnavailable:'Il sondaggio della community è temporaneamente indisponibile. Riprova tra poco.',sending:'INVIO VOTO…',already:'HAI GIÀ VOTATO',failed:'VOTO NON RIUSCITO',voteFailed:(e)=>'Impossibile salvare il voto: '+e,emptyBoard:'Nessun record. Difendi la base e conquista il primo posto.',record:'RECORD',communityRecord:'RECORD COMMUNITY',top:'TOP 10',boardOffline:'Classifica temporaneamente non disponibile.',scoreMin:'Ottieni almeno 10 punti prima di salvare.',submitting:'Salvataggio record…',saved:'Record salvato! Classifica aggiornata.'},
    ja:{poll:['ZombieCashのミームを増やす','コミュニティ襲撃ミッション','新しいサバイバル挑戦'],activityLive:'DEXSCREENER LIVE',activityOffline:'シグナル停止',activityUnavailable:'取引数を取得できません。自動で再試行します。',activityCount:(n)=>'DexScreenerによる期間内取引数は'+n+'件です。ユニーク購入者やウォレット数ではありません。',activityEmpty:'最新DexScreenerデータでは、この期間の取引はありません。',vote:'投票',votes:'票',recorded:'投票済み',open:'投票受付中',offline:'投票データ停止',pollUnavailable:'コミュニティ投票を一時取得できません。しばらくして再試行してください。',sending:'投票送信中…',already:'投票済み',failed:'投票失敗',voteFailed:(e)=>'投票を保存できません: '+e,emptyBoard:'記録はまだありません。基地を守り、最初の記録を残そう。',record:'記録',communityRecord:'コミュニティ記録',top:'TOP 10',boardOffline:'ランキングは一時利用できません。',scoreMin:'保存には10点以上が必要です。',submitting:'記録を送信中…',saved:'記録を保存しました。ランキング更新！'},
    'zh-cn':{poll:['更多 ZombieCash 表情包','社区突袭任务','新的生存挑战'],activityLive:'DEXSCREENER 实时',activityOffline:'信号离线',activityUnavailable:'实时交易数据暂时不可用，将自动重试。',activityCount:(n)=>'DexScreener 本时段报告 '+n+' 笔交易。交易数并非独立买家或钱包数。',activityEmpty:'最新 DexScreener 快照中，此时段没有交易记录。',vote:'投票',votes:'票',recorded:'投票已记录',open:'投票进行中',offline:'投票服务离线',pollUnavailable:'社区投票暂时不可用，请稍后再试。',sending:'正在提交投票…',already:'已投票',failed:'投票失败',voteFailed:(e)=>'无法保存投票：'+e,emptyBoard:'暂无记录。守卫基地，争取第一个名次。',record:'记录',communityRecord:'社区记录',top:'前 10',boardOffline:'排行榜暂时不可用。',scoreMin:'请至少获得 10 分后再保存。',submitting:'正在提交记录…',saved:'记录已保存！排行榜已更新。'},
    tr:{poll:['Daha fazla ZombieCash memi','Topluluk baskın görevi','Yeni hayatta kalma mücadelesi'],activityLive:'DEXSCREENER CANLI',activityOffline:'SİNYAL ÇEVRİMDIŞI',activityUnavailable:'Canlı işlem sayıları geçici olarak kullanılamıyor. Otomatik yeniden denenecek.',activityCount:(n)=>'DexScreener bu dönemde '+n+' işlem bildiriyor. Bu, benzersiz alıcı veya cüzdan sayısı değildir.',activityEmpty:'Son DexScreener verisinde bu dönem için işlem yok.',vote:'OY',votes:'OY',recorded:'OY KAYDEDİLDİ',open:'ANKET AÇIK',offline:'ANKET ÇEVRİMDIŞI',pollUnavailable:'Topluluk anketi geçici olarak kullanılamıyor. Daha sonra tekrar deneyin.',sending:'OY GÖNDERİLİYOR…',already:'ZATEN OY VERDİN',failed:'OY BAŞARISIZ',voteFailed:(e)=>'Oy kaydedilemedi: '+e,emptyBoard:'Henüz kayıt yok. Üssü savun ve ilk sırayı al.',record:'REKOR',communityRecord:'TOPLULUK REKORU',top:'İLK 10',boardOffline:'Liderlik tablosu geçici olarak kullanılamıyor.',scoreMin:'Kaydetmeden önce en az 10 puan al.',submitting:'Rekor gönderiliyor…',saved:'Rekor kaydedildi! Sıralama güncellendi.'},
    hi:{poll:['अधिक ZombieCash मीम','समुदाय रेड मिशन','नई सर्वाइवल चुनौती'],activityLive:'DEXSCREENER लाइव',activityOffline:'सिग्नल ऑफ़लाइन',activityUnavailable:'लाइव ट्रेड डेटा अस्थायी रूप से उपलब्ध नहीं है। स्वतः पुनः प्रयास होगा।',activityCount:(n)=>'DexScreener इस अवधि में '+n+' लेनदेन दिखाता है। यह लेनदेन संख्या है, अलग खरीदार या वॉलेट नहीं।',activityEmpty:'नवीनतम DexScreener डेटा में इस अवधि के लेनदेन नहीं हैं।',vote:'वोट',votes:'वोट',recorded:'वोट दर्ज',open:'मतदान खुला',offline:'मतदान ऑफ़लाइन',pollUnavailable:'समुदाय मतदान अस्थायी रूप से उपलब्ध नहीं है। बाद में प्रयास करें।',sending:'वोट भेज रहे हैं…',already:'पहले ही वोट दिया',failed:'वोट विफल',voteFailed:(e)=>'वोट सहेजा नहीं जा सका: '+e,emptyBoard:'अभी रिकॉर्ड नहीं। बेस की रक्षा करें और पहला स्थान लें।',record:'रिकॉर्ड',communityRecord:'समुदाय रिकॉर्ड',top:'टॉप 10',boardOffline:'लीडरबोर्ड अस्थायी रूप से उपलब्ध नहीं है।',scoreMin:'सहेजने से पहले कम से कम 10 अंक प्राप्त करें।',submitting:'रिकॉर्ड भेज रहे हैं…',saved:'रिकॉर्ड सहेजा गया! लीडरबोर्ड अपडेट हुआ।'}
  };
  const communityText = communityUi[communityLocale] || communityUi.en;
  const activityJapaneseUI = communityLocale === 'ja';
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
      ? communityText.activityCount(prettyCount(total))
      : 'No transactions reported for this period in the latest DexScreener snapshot.';
  }
  async function loadActivity() {
    try {
      const response = await zcApiFetch(apiBase + '/api/activity', {cache:'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      activityData = await response.json();
      renderActivity();
      if (activityStatus) activityStatus.textContent = communityText.activityLive;
    } catch (error) {
      if (activityStatus) activityStatus.textContent = communityText.activityOffline;
      if (activityNote) activityNote.textContent = communityText.activityUnavailable;
    }
  }
  document.querySelectorAll('.activity-tab').forEach(button => button.addEventListener('click', () => {
    activityPeriod = button.dataset.period || 'h1';
    document.querySelectorAll('.activity-tab').forEach(tab => tab.classList.toggle('active', tab === button));
    renderActivity();
  }));

  const pollLabels = {
    meme: communityText.poll[0],
    raid: communityText.poll[1],
    game: communityText.poll[2]
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
    if (voteTotal) voteTotal.textContent = prettyCount(total) + (total === 1 ? ' '+communityText.vote : ' '+communityText.votes);
    if (voteDate) voteDate.textContent = 'UTC · ' + (data.date || new Date().toISOString().slice(0,10));
    if (voteStatus) voteStatus.textContent = alreadyVoted ? communityText.recorded : communityText.open;
  }
  async function loadVote() {
    try {
      const response = await zcApiFetch(apiBase + '/api/vote', {cache:'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      let alreadyVoted = false;
      try { alreadyVoted = localStorage.getItem('zombcash-voted-' + data.date) === 'yes'; } catch (_) {}
      renderVote(data, alreadyVoted);
    } catch (error) {
      if (voteStatus) voteStatus.textContent = communityText.offline;
      if (voteOptionsEl) voteOptionsEl.innerHTML = '<p class="crew-note">'+communityText.pollUnavailable+'</p>';
    }
  }
  async function castVote(option) {
    if (voteBusy) return;
    voteBusy = true;
    chosenVote = option;
    if (voteStatus) voteStatus.textContent = communityText.sending;
    try {
      const response = await zcApiFetch(apiBase + '/api/vote', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({option, voter:voterId})
      });
      const data = await response.json();
      if (!response.ok && response.status !== 409) throw new Error(data.error || 'Vote failed');
      if (data.date) {
        try { localStorage.setItem('zombcash-voted-' + data.date, 'yes'); } catch (_) {}
      }
      renderVote(data, true);
      if (voteStatus && response.status === 409) voteStatus.textContent = communityText.already;
    } catch (error) {
      if (voteStatus) voteStatus.textContent = communityText.failed;
      if (voteOptionsEl) {
        const notice = document.createElement('p');
        notice.className = 'crew-note';
        notice.textContent = communityText.voteFailed(error.message);
        voteOptionsEl.append(notice);
      }
    } finally { voteBusy = false; }
  }

  function renderLeaderboard(data) {
    if (!leaderboardEl) return;
    leaderboardEl.replaceChildren();
    const scores=Array.isArray(data.scores)?data.scores:[];
    if(!scores.length){const empty=document.createElement('p');empty.className='crew-note';empty.textContent='No records yet. Defend the base and claim the first spot.';leaderboardEl.append(empty);}
    else scores.slice(0,10).forEach((item,index)=>{const row=document.createElement('div');row.className='survivor-row';const rank=document.createElement('span');rank.className='survivor-rank';rank.textContent='#'+(index+1);const name=document.createElement('span');name.className='survivor-name';name.textContent=item.name||'Survivor';const date=document.createElement('small');date.className='survivor-date';date.textContent=item.date?communityText.record+' · '+item.date:communityText.communityRecord;name.append(date);const points=document.createElement('strong');points.className='survivor-time';points.textContent=Number(item.points||0).toLocaleString('en-US')+' PTS';row.append(rank,name,points);leaderboardEl.append(row);});
    if(leaderboardStatus)leaderboardStatus.textContent='TOP 10';
  }
  async function loadLeaderboard(){try{const response=await zcApiFetch(apiBase+'/api/survival-scores',{cache:'no-store'});if(!response.ok)throw new Error('HTTP '+response.status);renderLeaderboard(await response.json());}catch(_){if(leaderboardStatus)leaderboardStatus.textContent='OFFLINE';if(leaderboardEl)leaderboardEl.innerHTML='<p class="crew-note">Leaderboard is temporarily unavailable.</p>';}}
  submitScoreButton?.addEventListener('click',async()=>{const points=Number(window.lastSurvivalPoints);if(!Number.isFinite(points)||points<10||points>100000){if(submitScoreStatus)submitScoreStatus.textContent='Score at least 10 points before saving.';return;}submitScoreButton.disabled=true;if(submitScoreStatus)submitScoreStatus.textContent='Submitting your record…';try{const response=await zcApiFetch(apiBase+'/api/survival-scores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:getEl('survivor-name')?.value||'Survivor',points,voter:voterId})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not save record');if(submitScoreStatus)submitScoreStatus.textContent='Record saved! Survival leaderboard updated.';renderLeaderboard(data);}catch(error){if(submitScoreStatus)submitScoreStatus.textContent=error.message;submitScoreButton.disabled=false;}});



  const chartEl = document.getElementById('activity-price-chart');
  const chartStatus = document.getElementById('activity-chart-status');
  const chartCurrent = document.getElementById('activity-chart-current');
  const chartStart = document.getElementById('activity-chart-start');
  const chartEnd = document.getElementById('activity-chart-end');
  const tradesEl = document.getElementById('recent-trades-list');
  let chartPeriod = '24h';
  function money(value) {
    const n = Number(value || 0);
    if (!Number.isFinite(n) || n <= 0) return '—';
    if (n < 0.000001) return '$' + n.toExponential(2);
    if (n < 0.001) return '$' + n.toFixed(10);
    if (n < 1) return '$' + n.toFixed(8);
    if (n < 1000) return '$' + n.toFixed(6);
    return '$' + n.toLocaleString('en-US', {maximumFractionDigits: 4});
  }
  function chartMessage(message) {
    if (!chartEl) return;
    chartEl.replaceChildren();
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    node.setAttribute('x','360'); node.setAttribute('y','95');
    node.setAttribute('text-anchor','middle'); node.setAttribute('fill','#91a18d');
    node.setAttribute('font-size','12'); node.textContent = message; chartEl.append(node);
  }
  function renderPriceChart(data) {
    if (!chartEl) return;
    const points = (Array.isArray(data && data.points) ? data.points.filter(p => Number(p.time)>0 && Number(p.price)>0) : [])
      .sort((a,b)=>Number(a.time)-Number(b.time));
    const periodSeconds = ({'24h':86400,'7d':604800,'30d':2592000})[chartPeriod] || 86400;
    const cutoff = Date.now()/1000 - periodSeconds;
    const inPeriodPoints = points.filter(p=>Number(p.time)>=cutoff);
    const stale = inPeriodPoints.length < 2;
    const chartPoints = stale ? points : inPeriodPoints;
    chartEl.replaceChildren();
    chartEl.setAttribute('aria-label', stale ? 'Stale price history; no candles in selected period, showing last available history' : 'Price history for selected period');
    if (chartPoints.length < 2) {
      if (chartStatus) chartStatus.textContent = activityJapaneseUI ? '価格履歴を利用できません' : 'PRICE HISTORY UNAVAILABLE';
      chartMessage(activityJapaneseUI ? '価格履歴は一時的に利用できません' : 'Price history is temporarily unavailable'); return;
    }
    const W=720,H=190,pad=12, vals=chartPoints.map(p=>Number(p.price));
    const min=Math.min(...vals), max=Math.max(...vals), span=(max-min)||Math.max(max*.02,1e-12);
    const pts=chartPoints.map((p,i)=>({x:pad+i*(W-pad*2)/(chartPoints.length-1),y:H-pad-((Number(p.price)-min)/span)*(H-pad*2)}));
    for(let k=1;k<=3;k++){const g=document.createElementNS('http://www.w3.org/2000/svg','line');g.setAttribute('x1','0');g.setAttribute('x2',String(W));g.setAttribute('y1',String(k*H/4));g.setAttribute('y2',String(k*H/4));g.setAttribute('stroke','#9bff45');g.setAttribute('stroke-opacity','.12');chartEl.append(g);}
    const area=document.createElementNS('http://www.w3.org/2000/svg','path');
    area.setAttribute('d','M '+pts[0].x+' '+H+' L '+pts.map(p=>p.x+' '+p.y).join(' L ')+' L '+pts[pts.length-1].x+' '+H+' Z');
    area.setAttribute('fill','#9bff45');area.setAttribute('fill-opacity','.09');chartEl.append(area);
    const line=document.createElementNS('http://www.w3.org/2000/svg','path');
    line.setAttribute('d',pts.map((p,i)=>(i?'L':'M')+' '+p.x+' '+p.y).join(' '));line.setAttribute('fill','none');line.setAttribute('stroke','#9bff45');line.setAttribute('stroke-width','2.5');line.setAttribute('stroke-linejoin','round');chartEl.append(line);
    if(stale){const warning=document.createElementNS('http://www.w3.org/2000/svg','text');warning.setAttribute('x','12');warning.setAttribute('y','16');warning.setAttribute('fill','#f0bd72');warning.setAttribute('font-size','10');warning.textContent=activityJapaneseUI?'選択期間内のデータなし — 最新の履歴を表示':'No candles in selected period — last available history shown';chartEl.append(warning);}
    const last=pts[pts.length-1],dot=document.createElementNS('http://www.w3.org/2000/svg','circle');
    dot.setAttribute('cx',String(last.x));dot.setAttribute('cy',String(last.y));dot.setAttribute('r','4');dot.setAttribute('fill','#d9ffb0');dot.setAttribute('stroke','#9bff45');dot.setAttribute('stroke-width','2');chartEl.append(dot);
    if(chartStatus)chartStatus.textContent=(data.source||(activityJapaneseUI?'価格データ':'PRICE FEED'))+(data.stale?(activityJapaneseUI?' · キャッシュ':' · CACHED'):'')+(stale?(activityJapaneseUI?' · 古い履歴':' · STALE'):'')+' · '+chartPoints.length+(activityJapaneseUI?'ポイント':' POINTS');

    if(chartCurrent)chartCurrent.textContent=money(points[points.length-1].price);
    const fmt=t=>new Date(Number(t)*1000).toLocaleDateString(activityJapaneseUI?'ja-JP':'en-US',{month:'short',day:'numeric',hour:chartPeriod==='24h'?'2-digit':undefined,minute:chartPeriod==='24h'?'2-digit':undefined});
    if(chartStart)chartStart.textContent=fmt(chartPoints[0].time);if(chartEnd)chartEnd.textContent=fmt(chartPoints[chartPoints.length-1].time);
  }
  async function loadPriceChart() {
    if(!chartEl)return;if(chartStatus)chartStatus.textContent=activityJapaneseUI?'価格履歴を読み込み中…':'LOADING PRICE HISTORY…';
    try {const response=await zcApiFetch(apiBase+'/api/price-history?period='+encodeURIComponent(chartPeriod),{cache:'no-store',signal:AbortSignal.timeout(25000)});if(!response.ok)throw new Error('HTTP '+response.status);renderPriceChart(await response.json());}
    catch(error){const detail=String(error&&error.message||'REQUEST FAILED').slice(0,80);chartMessage(activityJapaneseUI?'価格履歴は一時的に利用できません':'Price history is temporarily unavailable');if(chartStatus){chartStatus.textContent=activityJapaneseUI?'価格履歴を利用できません':'PRICE HISTORY UNAVAILABLE';chartStatus.dataset.error=detail;}console.warn('ZombieCash price history unavailable:',detail);}
  }
  document.querySelectorAll('.activity-chart-tab').forEach(button=>button.addEventListener('click',()=>{chartPeriod=button.dataset.chartPeriod||'24h';document.querySelectorAll('.activity-chart-tab').forEach(tab=>tab.classList.toggle('active',tab===button));loadPriceChart();}));
  async function loadRecentTrades() {
    if(!tradesEl)return;
    try {
      const response=await zcApiFetch(apiBase+'/api/recent-trades',{cache:'no-store',signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw new Error('HTTP '+response.status);
      const data=await response.json(), trades=Array.isArray(data.trades)?data.trades:[];
      tradesEl.replaceChildren();
      if(!trades.length){const empty=document.createElement('p');empty.className='recent-trade-empty';empty.textContent=activityJapaneseUI?'現在、最近の取引データはありません。':'No recent transactions are available right now.';tradesEl.append(empty);return;}
      trades.slice(0,8).forEach(trade=>{
        const row=document.createElement('div');row.className='recent-trade-row';
        const type=String(trade.type||'trade').toLowerCase(),side=document.createElement('span');
        side.className='recent-trade-side '+(type==='buy'?'buy':type==='sell'?'sell':'');side.textContent=type==='buy'?(activityJapaneseUI?'買い':'BUY'):type==='sell'?(activityJapaneseUI?'売り':'SELL'):(activityJapaneseUI?'取引':'TRADE');
        const main=document.createElement('div');main.className='recent-trade-main';const hash=String(trade.txHash||'');
        const link=document.createElement('a');link.href='https://solscan.io/tx/'+encodeURIComponent(hash);link.target='_blank';link.rel='noopener noreferrer';link.textContent=hash?hash.slice(0,7)+'…'+hash.slice(-6):'Transaction';
        const meta=document.createElement('small'),when=Number(trade.timestamp||0),wallet=String(trade.wallet||'');
        meta.textContent=(when?new Date(when*1000).toLocaleString(activityJapaneseUI?'ja-JP':undefined):(activityJapaneseUI?'時刻不明':'Time unavailable'))+(wallet?' · '+wallet.slice(0,4)+'…'+wallet.slice(-4):'');main.append(link,meta);
        const value=document.createElement('strong');value.className='recent-trade-value';value.textContent=money(trade.usd);row.append(side,main,value);tradesEl.append(row);
      });
    } catch(error){const notice=document.createElement('p');notice.className='recent-trade-empty';notice.textContent=(activityJapaneseUI?'取引APIエラー：':'Transaction API error: ')+String(error&&error.message||'request failed').slice(0,70);tradesEl.replaceChildren(notice);}
  }

  loadActivity();
  loadPriceChart();
  loadRecentTrades();
  loadVote();
  loadLeaderboard();
  setInterval(loadActivity, 60000);
  setInterval(loadPriceChart, 120000);
  setInterval(loadRecentTrades, 60000);
  setInterval(loadVote, 60000);
  setInterval(loadLeaderboard, 60000);
})();


/* Four-game community leaderboard dialog */
(() => {
 const api='https://zombcash-bot.fadehost.app';
 const dialog=document.getElementById('all-leaderboards-dialog');
 const open=document.getElementById('open-all-leaderboards');
 const close=document.getElementById('close-all-leaderboards');
 const list=document.getElementById('all-leaderboards-list');
 const caption=document.getElementById('all-leaderboards-caption');
 if(!dialog||!open||!close||!list)return;
 const labels={snake:'Zombie Snake',breaker:'Zombie Breaker',maze:'Zombie Maze',wall:'Undead Wall'};
 const esc=(value)=>String(value??'Survivor').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 async function load(game){
  document.querySelectorAll('[data-leaderboard-game]').forEach(b=>{const active=b.dataset.leaderboardGame===game;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));});
  caption.textContent=labels[game]+' · Top 10 records';list.textContent='Loading records…';
  try{
   const url=game==='snake'?api+'/api/survival-scores':api+'/api/arcade-scores?game='+encodeURIComponent(game);
   const response=await zcApiFetch(url,{cache:'no-store'});if(!response.ok)throw new Error('HTTP '+response.status);
   const data=await response.json();const scores=Array.isArray(data.scores)?data.scores:[];list.replaceChildren();
   if(!scores.length){list.textContent='No records yet. Play '+labels[game]+' and claim the first spot.';return;}
   scores.slice(0,10).forEach((item,i)=>{const row=document.createElement('div');row.className='survivor-row';const rank=document.createElement('span');rank.className='survivor-rank';rank.textContent='#'+(i+1);const name=document.createElement('span');name.className='survivor-name';name.textContent=item.name||'Survivor';const date=document.createElement('small');date.className='survivor-date';date.textContent=item.date?communityText.record+' · '+item.date:communityText.communityRecord;name.append(date);const points=document.createElement('strong');points.className='survivor-points';points.textContent=Number(item.points||0).toLocaleString('en-US')+' PTS';row.append(rank,name,points);list.append(row);});
  }catch(e){list.textContent='Records are temporarily unavailable. Please try again shortly.';}
 }
 open.addEventListener('click',()=>{if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');load('snake');});
 close.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 document.querySelectorAll('[data-leaderboard-game]').forEach(b=>b.addEventListener('click',()=>load(b.dataset.leaderboardGame)));
})();

/* Anonymous visitor statistics display.
   shared-nav.js owns the site-wide visitor heartbeat; this widget is read-only. */
(() => {
  if (new URLSearchParams(window.location.search).get('arcadeSnake') === '1') return;
  const apiBase = 'https://zombcash-bot.fadehost.app';
  const totalEl = document.getElementById('visits-total');
  const todayEl = document.getElementById('visits-today');
  const onlineEl = document.getElementById('visits-online');
  const updatedEl = document.getElementById('visits-updated');
  if (!totalEl || !todayEl || !updatedEl) return;

  const render = data => {
    if (Number.isFinite(Number(data.total))) totalEl.textContent = Number(data.total).toLocaleString();
    if (Number.isFinite(Number(data.today))) todayEl.textContent = Number(data.today).toLocaleString();
    if (onlineEl && Number.isFinite(Number(data.online))) onlineEl.textContent = Number(data.online).toLocaleString();
    updatedEl.textContent = 'UTC DAY · UPDATED ' + new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  };
  const refreshVisits = async () => {
    try {
      const response = await zcApiFetch(apiBase + '/api/visits', {cache:'no-store'});
      if (!response.ok) throw new Error('Visit counter unavailable');
      render(await response.json());
    } catch (_) {
      updatedEl.textContent = 'VISITOR STATS TEMPORARILY OFFLINE';
    }
  };
  refreshVisits();
  setInterval(refreshVisits, 15000);
})();



// Dedicated swap help dialog: keep instructions out of the main layout until requested.
(() => {
  const dialog = document.getElementById('swap-help-dialog');
  const openButton = document.getElementById('swap-help-open');
  const closeButton = document.getElementById('swap-help-close');
  if (!dialog || !openButton) return;
  openButton.addEventListener('click', () => {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  });
  closeButton?.addEventListener('click', () => {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog && typeof dialog.close === 'function') dialog.close();
  });
})();

/* Live system status: use real API responses and never display fabricated market data. */
(() => {
  if (new URLSearchParams(window.location.search).get('arcadeSnake') === '1') return;
  const apiBase = 'https://zombcash-bot.fadehost.app';
  const statusCopy = {
    en:{online:'ONLINE',offline:'OFFLINE',stale:'LAST KNOWN MARKET DATA',live:'LIVE DEXSCREENER MARKET DATA',unavailable:'MARKET DATA TEMPORARILY UNAVAILABLE',operational:'SYSTEMS OPERATIONAL',partial:'PARTIAL SIGNAL',interrupted:'SIGNAL INTERRUPTED',operationalMsg:'Market data is responding. Community services are checked independently below.',partialMsg:'The API is reachable, but market data is temporarily unavailable.',interruptedMsg:'Live status could not be verified. The page will retry automatically.'},
    ru:{online:'В СЕТИ',offline:'ОФЛАЙН',stale:'ПОСЛЕДНИЕ ИЗВЕСТНЫЕ ДАННЫЕ',live:'АКТУАЛЬНЫЕ ДАННЫЕ DEXSCREENER',unavailable:'РЫНОЧНЫЕ ДАННЫЕ ВРЕМЕННО НЕДОСТУПНЫ',operational:'СИСТЕМЫ РАБОТАЮТ',partial:'ЧАСТИЧНЫЙ СИГНАЛ',interrupted:'СИГНАЛ ПРЕРВАН',operationalMsg:'Рыночные данные доступны. Сервисы сообщества проверяются отдельно ниже.',partialMsg:'API доступен, но рыночные данные временно недоступны.',interruptedMsg:'Не удалось проверить статус в реальном времени. Страница повторит проверку автоматически.'},
    de:{online:'ONLINE',offline:'OFFLINE',stale:'LETZTE BEKANNTE MARKTDATEN',live:'LIVE-DEXSCREENER-DATEN',unavailable:'MARKTDATEN VORÜBERGEHEND NICHT VERFÜGBAR',operational:'SYSTEME AKTIV',partial:'TEILWEISES SIGNAL',interrupted:'SIGNAL UNTERBROCHEN',operationalMsg:'Marktdaten reagieren. Community-Dienste werden unten separat geprüft.',partialMsg:'Die API ist erreichbar, aber Marktdaten sind vorübergehend nicht verfügbar.',interruptedMsg:'Der Live-Status konnte nicht bestätigt werden. Die Seite versucht es automatisch erneut.'},
    fr:{online:'EN LIGNE',offline:'HORS LIGNE',stale:'DERNIÈRES DONNÉES CONNUES',live:'DONNÉES DEXSCREENER EN DIRECT',unavailable:'DONNÉES DE MARCHÉ TEMPORAIREMENT INDISPONIBLES',operational:'SYSTÈMES OPÉRATIONNELS',partial:'SIGNAL PARTIEL',interrupted:'SIGNAL INTERROMPU',operationalMsg:'Les données du marché répondent. Les services communautaires sont vérifiés séparément ci-dessous.',partialMsg:'L’API est accessible, mais les données du marché sont temporairement indisponibles.',interruptedMsg:'Le statut en direct n’a pas pu être vérifié. La page réessaiera automatiquement.'},
    it:{online:'ONLINE',offline:'OFFLINE',stale:'ULTIMI DATI NOTI',live:'DATI DEXSCREENER LIVE',unavailable:'DATI DI MERCATO TEMPORANEAMENTE NON DISPONIBILI',operational:'SISTEMI OPERATIVI',partial:'SEGNALE PARZIALE',interrupted:'SEGNALE INTERROTTO',operationalMsg:'I dati di mercato rispondono. I servizi della community vengono verificati separatamente qui sotto.',partialMsg:'L’API è raggiungibile, ma i dati di mercato sono temporaneamente indisponibili.',interruptedMsg:'Lo stato live non è verificabile. La pagina riproverà automaticamente.'},
    ja:{online:'オンライン',offline:'オフライン',stale:'最新確認済み市場データ',live:'DEXSCREENERライブデータ',unavailable:'市場データは一時的に利用できません',operational:'システム稼働中',partial:'部分的なシグナル',interrupted:'シグナル中断',operationalMsg:'市場データは応答しています。コミュニティサービスは下で個別に確認されます。',partialMsg:'APIには接続できますが、市場データは一時的に利用できません。',interruptedMsg:'ライブ状態を確認できませんでした。自動で再試行します。'},
    'zh-cn':{online:'在线',offline:'离线',stale:'最近已知市场数据',live:'DEXSCREENER 实时数据',unavailable:'市场数据暂时不可用',operational:'系统运行正常',partial:'信号部分正常',interrupted:'信号中断',operationalMsg:'市场数据正常响应。社区服务将在下方单独检查。',partialMsg:'API可访问，但市场数据暂时不可用。',interruptedMsg:'无法验证实时状态，页面将自动重试。'},
    tr:{online:'ÇEVRİMİÇİ',offline:'ÇEVRİMDIŞI',stale:'SON BİLİNEN PİYASA VERİSİ',live:'CANLI DEXSCREENER VERİSİ',unavailable:'PİYASA VERİSİ GEÇİCİ OLARAK KULLANILAMIYOR',operational:'SİSTEMLER ÇALIŞIYOR',partial:'KISMİ SİNYAL',interrupted:'SİNYAL KESİLDİ',operationalMsg:'Piyasa verileri yanıt veriyor. Topluluk hizmetleri aşağıda ayrıca kontrol ediliyor.',partialMsg:'API erişilebilir ancak piyasa verileri geçici olarak kullanılamıyor.',interruptedMsg:'Canlı durum doğrulanamadı. Sayfa otomatik olarak yeniden deneyecek.'},
    hi:{online:'ऑनलाइन',offline:'ऑफ़लाइन',stale:'अंतिम ज्ञात बाज़ार डेटा',live:'DEXSCREENER लाइव डेटा',unavailable:'बाज़ार डेटा अस्थायी रूप से उपलब्ध नहीं',operational:'सिस्टम चालू',partial:'आंशिक संकेत',interrupted:'सिग्नल बाधित',operationalMsg:'बाज़ार डेटा प्रतिक्रिया दे रहा है। समुदाय सेवाओं की नीचे अलग से जाँच होती है।',partialMsg:'API उपलब्ध है, लेकिन बाज़ार डेटा अस्थायी रूप से उपलब्ध नहीं है।',interruptedMsg:'लाइव स्थिति सत्यापित नहीं हो सकी। पृष्ठ स्वचालित रूप से फिर प्रयास करेगा।'}
  };
  const sc = statusCopy[(document.documentElement.lang||'en').toLowerCase()] || statusCopy.en;
  const byId = id => document.getElementById(id);
  const setService = (name, state) => {
    const label = byId('service-' + name);
    const dot = byId('service-' + name + '-dot');
    if (label) label.textContent = state === 'ONLINE' ? sc.online : state === 'OFFLINE' ? sc.offline : state;
    if (dot) {
      dot.className = state === 'ONLINE' ? 'is-online' : state === 'OFFLINE' ? 'is-offline' : 'is-unknown';
      dot.setAttribute('aria-hidden', 'true');
      dot.removeAttribute('aria-label');
    }
  };
  const compact = value => {
    const n = Number(value);
    if (!Number.isFinite(n)) return '—';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + n.toFixed(2);
  };
  const setText = (id, value) => {
    const node = byId(id);
    if (node) node.textContent = value;
  };
  async function refreshStatus() {
    const checks = await Promise.allSettled([
      zcApiFetch(apiBase + '/health', {cache:'no-store'}).then(r => {
        if (!r.ok) throw new Error('Health HTTP ' + r.status);
        return r.json();
      }),
      zcApiFetch(apiBase + '/api/zombcash', {cache:'no-store'}).then(r => {
        if (!r.ok) throw new Error('Market HTTP ' + r.status);
        return r.json();
      }),
      zcApiFetch(apiBase + '/api/activity', {cache:'no-store'}).then(r => {
        if (!r.ok) throw new Error('Activity HTTP ' + r.status);
        return r.json();
      }),
      zcApiFetch(apiBase + '/api/visits', {cache:'no-store'}).then(r => {
        if (!r.ok) throw new Error('Visits HTTP ' + r.status);
        return r.json();
      })
    ]);
    const apiOk = checks[0].status === 'fulfilled' && checks[0].value && checks[0].value.ok !== false;
    const marketOk = checks[1].status === 'fulfilled' && Number(checks[1].value?.priceUsd) > 0;
    const activityOk = checks[2].status === 'fulfilled';
    const visitsOk = checks[3].status === 'fulfilled';
    setService('api', apiOk ? 'ONLINE' : 'OFFLINE');
    setService('market', marketOk ? 'ONLINE' : 'OFFLINE');
    setService('community', activityOk || visitsOk ? 'ONLINE' : 'OFFLINE');

    if (marketOk) {
      const data = checks[1].value;
      const change = Number(data.priceChange?.h24);
      const swing = Number.isFinite(change) ? Math.min(100, Math.abs(change)) : null;
      setText('chaos-value', swing === null ? '—' : (change > 0 ? '+' : '') + change.toFixed(2) + '%');
      const fill = byId('meter-fill');
      if (fill) fill.style.width = (swing === null ? 0 : swing) + '%';
      const meter = fill?.closest('.meter');
      if (meter) meter.setAttribute('aria-valuenow', String(swing === null ? 0 : Math.round(swing)));
      setText('outbreak-volume', compact(data.volume?.h24));
      setText('status-meter-note', data.stale ? sc.stale : sc.live);
    } else {
      setText('chaos-value', '—');
      setText('outbreak-volume', '—');
      setText('status-meter-note', sc.unavailable);
      const fill = byId('meter-fill');
      if (fill) fill.style.width = '0%';
    }
    if (visitsOk) {
      const visits = checks[3].value || {};
      const today = visits.today ?? visits.todayVisitors ?? visits.uniqueToday ?? visits.visitsToday;
      setText('outbreak-visits-today', Number.isFinite(Number(today)) ? Number(today).toLocaleString('en-US') : '—');
    } else setText('outbreak-visits-today', '—');

    if (apiOk && marketOk) {
      setText('outbreak-status', sc.operational);
      setText('outbreak-message', sc.operationalMsg);
    } else if (apiOk) {
      setText('outbreak-status', sc.partial);
      setText('outbreak-message', sc.partialMsg);
    } else {
      setText('outbreak-status', sc.interrupted);
      setText('outbreak-message', 'Live status could not be verified. The page will retry automatically.');
    }
  }
  refreshStatus();
  setInterval(refreshStatus, 60000);
})();


/* Zombie Radar Picks: consume the existing shared /api/radar feed.
   Time controls mirror bot-supported periods m5, h1 and h24. */
(() => {
  let localeCode = document.documentElement.lang || 'en';

  const signalCopy = {
    ru:{buy:'ПОКУПКА',sell:'ПРОДАЖА',trades:'СДЕЛКИ',none:'СДЕЛОК НЕТ',unavailable:'СИГНАЛ ПОТОКА СДЕЛОК НЕДОСТУПЕН'},
    de:{buy:'KÄUFE',sell:'VERKÄUFE',trades:'TRANSAKTIONEN',none:'KEINE TRANSAKTIONEN',unavailable:'HANDELSFLUSS-SIGNAL NICHT VERFÜGBAR'},
    fr:{buy:'ACHATS',sell:'VENTES',trades:'TRANSACTIONS',none:'AUCUNE TRANSACTION',unavailable:'SIGNAL DE FLUX DES TRANSACTIONS INDISPONIBLE'},
    it:{buy:'ACQUISTI',sell:'VENDITE',trades:'OPERAZIONI',none:'NESSUNA OPERAZIONE',unavailable:'SEGNALE DEL FLUSSO OPERAZIONI NON DISPONIBILE'},
    ja:{buy:'買い',sell:'売り',trades:'取引',none:'取引なし',unavailable:'取引フローのシグナルを利用できません'},
    'zh-CN':{buy:'买入',sell:'卖出',trades:'笔交易',none:'暂无交易',unavailable:'交易流信号不可用'},
    tr:{buy:'ALIMLAR',sell:'SATIŞLAR',trades:'İŞLEMLER',none:'İŞLEM YOK',unavailable:'İŞLEM AKIŞI SİNYALİ KULLANILAMIYOR'},
    hi:{buy:'खरीद',sell:'बिक्री',trades:'ट्रेड',none:'कोई ट्रेड नहीं',unavailable:'ट्रेड-फ्लो सिग्नल उपलब्ध नहीं'},
    en:{buy:'BUY',sell:'SELL',trades:'TRADES',none:'NO TRADES',unavailable:'TRADE-FLOW SIGNAL UNAVAILABLE'}
  };
  const signalLabels = () => signalCopy[localeCode] || signalCopy.en;
  const radarUi = {
    en:{scan:'SCANNING',refresh:'↻ REFRESH',loading:'Fetching the shared Zombie Radar feed…',empty:'No tokens with enough market data for this period. Refresh or try another horizon.',noPicks:'NO PICKS',change:'CHANGE',volume:'VOLUME',liquidity:'LIQUIDITY',signal:'SIGNAL',view:'VIEW',verified:'VERIFIED PICKS',note:'Radar only shows tokens with real data for this time horizon. Try another interval or refresh to discover more.',online:'RADAR ONLINE',stale:'STALE FEED',updated:'SOURCE UPDATED',unknown:'TIME UNKNOWN',staleSource:'SOURCE SNAPSHOT IS STALE',error:'API ERROR',unavailable:'Radar feed is unavailable. No recommendations are being shown; retry shortly.',failed:'Refresh failed. Previous radar data is retained and marked stale.',lastSuccess:'LAST SUCCESS',noSuccess:'NO SUCCESSFUL FETCH',periodNote:'Momentum and activity',last5:'last 5 minutes',hour:'last hour',day:'last 24 hours'},
    ru:{scan:'СКАНИРОВАНИЕ',refresh:'↻ ОБНОВИТЬ',loading:'Загрузка общего потока Zombie Radar…',empty:'Недостаточно рыночных данных за этот период. Обновите или выберите другой интервал.',noPicks:'НЕТ СИГНАЛОВ',change:'ИЗМЕНЕНИЕ',volume:'ОБЪЁМ',liquidity:'ЛИКВИДНОСТЬ',signal:'СИГНАЛ',view:'ОТКРЫТЬ',verified:'ПОДТВЕРЖДЁННЫХ СИГНАЛОВ',note:'Radar показывает только токены с реальными данными за выбранный период. Выберите другой интервал или обновите.',online:'RADAR АКТИВЕН',stale:'УСТАРЕВШИЙ ПОТОК',updated:'ИСТОЧНИК ОБНОВЛЁН',unknown:'ВРЕМЯ НЕИЗВЕСТНО',staleSource:'СНИМОК ДАННЫХ УСТАРЕЛ',error:'ОШИБКА API',unavailable:'Поток Radar недоступен. Рекомендации не показываются. Попробуйте позже.',failed:'Обновление не удалось. Предыдущие данные сохранены и отмечены как устаревшие.',lastSuccess:'ПОСЛЕДНИЙ УСПЕХ',noSuccess:'УСПЕШНЫХ ЗАПРОСОВ НЕТ',periodNote:'Динамика и активность',last5:'последние 5 минут',hour:'последний час',day:'последние 24 часа'},
    de:{scan:'SCANNT',refresh:'↻ AKTUALISIEREN',loading:'Gemeinsamer Zombie-Radar-Feed wird geladen…',empty:'Nicht genügend Marktdaten für diesen Zeitraum. Aktualisieren oder Zeitraum wechseln.',noPicks:'KEINE SIGNALE',change:'ÄNDERUNG',volume:'VOLUMEN',liquidity:'LIQUIDITÄT',signal:'SIGNAL',view:'ANSEHEN',verified:'VERIFIZIERTE SIGNALE',note:'Radar zeigt nur Token mit echten Daten für diesen Zeitraum. Zeitraum wechseln oder aktualisieren.',online:'RADAR ONLINE',stale:'VERALTETER FEED',updated:'QUELLE AKTUALISIERT',unknown:'ZEIT UNBEKANNT',staleSource:'DATENSTAND IST VERALTET',error:'API-FEHLER',unavailable:'Radar-Feed nicht verfügbar. Es werden keine Empfehlungen angezeigt. Bitte später erneut versuchen.',failed:'Aktualisierung fehlgeschlagen. Vorherige Daten bleiben als veraltet markiert.',lastSuccess:'LETZTER ERFOLG',noSuccess:'KEIN ERFOLGREICHER ABRUF',periodNote:'Momentum und Aktivität',last5:'letzte 5 Minuten',hour:'letzte Stunde',day:'letzte 24 Stunden'},
    fr:{scan:'ANALYSE',refresh:'↻ ACTUALISER',loading:'Chargement du flux Zombie Radar partagé…',empty:'Données de marché insuffisantes pour cette période. Actualisez ou changez d’intervalle.',noPicks:'AUCUN SIGNAL',change:'VARIATION',volume:'VOLUME',liquidity:'LIQUIDITÉ',signal:'SIGNAL',view:'VOIR',verified:'SIGNAUX VÉRIFIÉS',note:'Radar affiche uniquement les jetons disposant de données réelles pour cette période. Changez d’intervalle ou actualisez.',online:'RADAR EN LIGNE',stale:'FLUX OBSOLÈTE',updated:'SOURCE ACTUALISÉE',unknown:'HEURE INCONNUE',staleSource:'L’APERÇU DES DONNÉES EST OBSOLÈTE',error:'ERREUR API',unavailable:'Flux Radar indisponible. Aucune recommandation affichée. Réessayez plus tard.',failed:'Échec de l’actualisation. Les données précédentes sont conservées et marquées comme obsolètes.',lastSuccess:'DERNIÈRE RÉUSSITE',noSuccess:'AUCUNE RÉUSSITE DE RÉCUPÉRATION',periodNote:'Momentum et activité',last5:'5 dernières minutes',hour:'dernière heure',day:'24 dernières heures'},
    it:{scan:'SCANSIONE',refresh:'↻ AGGIORNA',loading:'Caricamento del feed Zombie Radar condiviso…',empty:'Dati di mercato insufficienti per questo periodo. Aggiorna o cambia intervallo.',noPicks:'NESSUN SEGNALE',change:'VARIAZIONE',volume:'VOLUME',liquidity:'LIQUIDITÀ',signal:'SEGNALE',view:'VEDI',verified:'SEGNALI VERIFICATI',note:'Radar mostra solo token con dati reali per questo intervallo. Cambia periodo o aggiorna.',online:'RADAR ONLINE',stale:'FEED OBSOLETO',updated:'FONTE AGGIORNATA',unknown:'ORARIO SCONOSCIUTO',staleSource:'DATI NON AGGIORNATI',error:'ERRORE API',unavailable:'Feed Radar non disponibile. Nessuna raccomandazione mostrata. Riprova più tardi.',failed:'Aggiornamento fallito. I dati precedenti sono conservati e contrassegnati come obsoleti.',lastSuccess:'ULTIMO SUCCESSO',noSuccess:'NESSUN RECUPERO RIUSCITO',periodNote:'Momentum e attività',last5:'ultimi 5 minuti',hour:'ultima ora',day:'ultime 24 ore'},
    ja:{scan:'スキャン中',refresh:'↻ 更新',loading:'共有Zombie Radarフィードを取得中…',empty:'この期間の市場データが不足しています。更新するか期間を変更してください。',noPicks:'候補なし',change:'変動',volume:'取引量',liquidity:'流動性',signal:'シグナル',view:'表示',verified:'確認済み候補',note:'Radarは選択期間の実データがあるトークンのみ表示します。期間変更または更新してください。',online:'RADAR稼働中',stale:'古いデータ',updated:'ソース更新',unknown:'時刻不明',staleSource:'データスナップショットが古い',error:'APIエラー',unavailable:'Radarフィードを利用できません。推奨は表示されません。しばらくして再試行してください。',failed:'更新失敗。前のデータは保持され、古いデータとして表示されます。',lastSuccess:'最終成功',noSuccess:'取得成功なし',periodNote:'勢いと取引活動',last5:'直近5分',hour:'直近1時間',day:'直近24時間'},
    'zh-cn':{scan:'扫描中',refresh:'↻ 刷新',loading:'正在获取共享 Zombie Radar 数据…',empty:'该时间段市场数据不足。请刷新或切换时间范围。',noPicks:'暂无信号',change:'涨跌',volume:'成交量',liquidity:'流动性',signal:'信号',view:'查看',verified:'已验证信号',note:'Radar仅展示该时间段有真实数据的代币。请切换区间或刷新。',online:'RADAR 在线',stale:'数据流过期',updated:'来源已更新',unknown:'时间未知',staleSource:'数据快照已过期',error:'API错误',unavailable:'Radar数据流暂不可用，当前不显示推荐。请稍后重试。',failed:'刷新失败。已保留旧数据并标记为过期。',lastSuccess:'上次成功',noSuccess:'尚无成功获取',periodNote:'动量与活跃度',last5:'最近5分钟',hour:'最近1小时',day:'最近24小时'},
    tr:{scan:'TARANIYOR',refresh:'↻ YENİLE',loading:'Paylaşılan Zombie Radar akışı yükleniyor…',empty:'Bu dönem için yeterli piyasa verisi yok. Yenileyin veya aralığı değiştirin.',noPicks:'SİNYAL YOK',change:'DEĞİŞİM',volume:'HACİM',liquidity:'LİKİDİTE',signal:'SİNYAL',view:'GÖR',verified:'DOĞRULANMIŞ SİNYAL',note:'Radar yalnızca bu dönem için gerçek verisi bulunan tokenları gösterir. Aralığı değiştirin veya yenileyin.',online:'RADAR ÇEVRİMİÇİ',stale:'ESKİ AKIŞ',updated:'KAYNAK GÜNCELLENDİ',unknown:'ZAMAN BİLİNMİYOR',staleSource:'VERİ ÖZETİ ESKİ',error:'API HATASI',unavailable:'Radar akışı kullanılamıyor. Öneriler gösterilmiyor; daha sonra tekrar deneyin.',failed:'Yenileme başarısız. Önceki veriler saklandı ve eski olarak işaretlendi.',lastSuccess:'SON BAŞARILI',noSuccess:'BAŞARILI ALIM YOK',periodNote:'Momentum ve etkinlik',last5:'son 5 dakika',hour:'son saat',day:'son 24 saat'},
    hi:{scan:'स्कैन हो रहा है',refresh:'↻ रीफ़्रेश',loading:'साझा Zombie Radar फ़ीड प्राप्त हो रही है…',empty:'इस अवधि के लिए पर्याप्त बाज़ार डेटा नहीं है। रीफ़्रेश करें या अवधि बदलें।',noPicks:'कोई संकेत नहीं',change:'बदलाव',volume:'वॉल्यूम',liquidity:'लिक्विडिटी',signal:'संकेत',view:'देखें',verified:'सत्यापित संकेत',note:'Radar केवल इस अवधि के वास्तविक डेटा वाले टोकन दिखाता है। अवधि बदलें या रीफ़्रेश करें।',online:'RADAR ऑनलाइन',stale:'पुरानी फ़ीड',updated:'स्रोत अपडेट',unknown:'समय अज्ञात',staleSource:'डेटा स्नैपशॉट पुराना है',error:'API त्रुटि',unavailable:'Radar फ़ीड उपलब्ध नहीं है। कोई सुझाव नहीं दिखाया जा रहा; बाद में पुनः प्रयास करें।',failed:'रीफ़्रेश विफल। पुराना डेटा सुरक्षित है और पुराना चिह्नित किया गया है।',lastSuccess:'अंतिम सफलता',noSuccess:'कोई सफल फ़ेच नहीं',periodNote:'गति और गतिविधि',last5:'पिछले 5 मिनट',hour:'पिछला घंटा',day:'पिछले 24 घंटे'}
  };
  const ui = () => radarUi[localeCode.toLowerCase()] || radarUi.en;
  const apiBase = 'https://zombcash-bot.fadehost.app';
  const panel = document.querySelector('.zombie-radar-ai-panel');
  const list = document.getElementById('zombie-radar-ai-list');
  const state = document.getElementById('zombie-radar-ai-state');
  const updated = document.getElementById('zombie-radar-ai-updated');
  const periodNote = document.getElementById('zombie-radar-ai-period-note');
  const refreshButton = document.getElementById('zombie-radar-ai-refresh');
  if (!panel || !list || !state || !refreshButton) return;

  const periods = {
    m5: {label:ui().last5},
    h1: {label:ui().hour},
    h24: {label:ui().day}
  };
  let activePeriod = 'm5';
  let requestId = 0;
  let lastPayload = null;
  let lastSuccessAt = 0;

  const setText = (node, value) => { if (node) node.textContent = value; };
  const number = value => {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };
  const compactMoney = value => {
    const n = number(value);
    return n === null ? '—' : '$' + n.toLocaleString('en-US', {notation:'compact', maximumFractionDigits:1});
  };
  const percent = value => {
    const n = number(value);
    return n === null ? '—' : (n > 0 ? '+' : '') + n.toFixed(2) + '%';
  };
  const safeHttpUrl = value => {
    try {
      const url = new URL(String(value || ''));
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (_) { return ''; }
  };
  const shortAddress = value => value ? value.slice(0, 5) + '…' + value.slice(-5) : '';
  const setState = (label, mode) => {
    setText(state, label);
    state.dataset.state = mode || 'neutral';
  };
  function setMessage(message, kind) {
    list.replaceChildren();
    const box = document.createElement('div');
    box.className = 'zrai-message' + (kind ? ' is-' + kind : '');
    box.textContent = message;
    list.append(box);
  }
  function createMetric(label, value, mood) {
    const item = document.createElement('span');
    item.className = 'zrai-metric' + (mood ? ' ' + mood : '');
    const key = document.createElement('small');
    key.textContent = label;
    const val = document.createElement('strong');
    val.textContent = value;
    item.append(key, val);
    return item;
  }
  function tokenMetrics(pair) {
    const changes = pair.priceChange || {};
    const volumes = pair.volume || {};
    const transactions = pair.txns || {};
    const change = number(changes[activePeriod]);
    const volume = number(volumes[activePeriod]);
    const flow = transactions[activePeriod] || {};
    const buys = number(flow.buys);
    const sells = number(flow.sells);
    const trades = (buys === null ? 0 : buys) + (sells === null ? 0 : sells);
    const liquidity = number(pair.liquidity && pair.liquidity.usd);
    const hasTrades = buys !== null || sells !== null;
    const buyRatio = trades ? (buys || 0) / trades : 0.5;
    const momentum = change === null ? 0 : (Math.max(-50, Math.min(change, 100)) + 50) / 150;
    // Transparent signal score from actual API fields; not a private Gemini result.
    const score = Math.max(0, Math.min(100,
      42 * Math.min(1, Math.log10(Math.max(volume || 0, 1)) / 6) +
      28 * Math.min(1, Math.log10(Math.max(liquidity || 0, 1)) / 6) +
      20 * momentum + 10 * buyRatio
    ));
    return {change, volume, buys, sells, trades, liquidity, hasTrades, score};
  }
  function rankPairs(payload) {
    const bestByAddress = new Map();
    (Array.isArray(payload.pairs) ? payload.pairs : []).forEach(pair => {
      if (!pair || pair.chainId !== 'solana') return;
      const address = String((pair.baseToken || {}).address || '').trim();
      if (!address) return;
      const liquidity = Number((pair.liquidity || {}).usd || 0);
      const previous = bestByAddress.get(address);
      if (!previous || liquidity > Number((previous.liquidity || {}).usd || 0)) bestByAddress.set(address, pair);
    });
    return Array.from(bestByAddress.values())
      .map(pair => ({pair, metrics:tokenMetrics(pair)}))
      .filter(({pair, metrics}) => {
        const price = number(pair.priceUsd);
        return price !== null && price > 0 && metrics.change !== null &&
          (metrics.volume !== null || metrics.hasTrades);
      })
      .sort((a, b) => b.metrics.score - a.metrics.score ||
        (b.metrics.volume || 0) - (a.metrics.volume || 0) ||
        b.metrics.trades - a.metrics.trades)
      .slice(0, 5);
  }
  function render(payload) {
    const ranked = rankPairs(payload).slice(0, 5);
    list.replaceChildren();
    if (!ranked.length) {
      setMessage(ui().empty, 'empty');
      setState(ui().noPicks, 'empty');
      return;
    }
    ranked.forEach(({pair, metrics}, index) => {
      const base = pair.baseToken || {};
      const address = String(base.address || '');
      const symbol = String(base.symbol || 'TOKEN').slice(0, 24);
      const name = String(base.name || symbol).slice(0, 64);
      const dexUrl = safeHttpUrl(pair.url) || 'https://dexscreener.com/solana/' + encodeURIComponent(address);
      const card = document.createElement('article');
      card.className = 'zrai-pick';
      const rank = document.createElement('span');
      rank.className = 'zrai-rank';
      rank.textContent = String(index + 1).padStart(2, '0');

      const body = document.createElement('div');
      body.className = 'zrai-pick-body';
      const heading = document.createElement('div');
      heading.className = 'zrai-pick-heading';
      const identity = document.createElement('div');
      identity.className = 'zrai-token-identity';
      const logo = document.createElement('span');
      logo.className = 'zrai-coin-icon';
      logo.setAttribute('aria-hidden', 'true');
      logo.textContent = symbol.replace(/^\$+/, '').slice(0, 2).toUpperCase();
      const imageUrl = safeHttpUrl(base.imageUrl || base.icon || pair.info && pair.info.imageUrl);
      if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = '';
        img.loading = 'lazy';
        img.referrerPolicy = 'no-referrer';
        img.onerror = () => { img.remove(); logo.classList.remove('has-image'); };
        logo.textContent = '';
        logo.classList.add('has-image');
        logo.append(img);
      }
      const nameWrap = document.createElement('div');
      nameWrap.className = 'zrai-token-name';
      const tokenSymbol = document.createElement('strong');
      tokenSymbol.id = 'zrai-token-symbol-' + index;
      tokenSymbol.textContent = String.fromCharCode(36) + symbol.replace(/^\u0024+/, '');
      const tokenName = document.createElement('span');
      tokenName.textContent = name;
      tokenName.title = name;
      nameWrap.append(tokenSymbol, tokenName);
      identity.append(logo, nameWrap);
      const score = document.createElement('span');
      score.className = 'zrai-score';
      score.textContent = Math.round(metrics.score) + ' ' + ui().signal;
      heading.append(identity, score);

      const metricsLine = document.createElement('div');
      metricsLine.className = 'zrai-metrics';
      metricsLine.append(
        createMetric(ui().change, percent(metrics.change), metrics.change > 0 ? 'positive' : metrics.change < 0 ? 'negative' : ''),
        createMetric(ui().volume, compactMoney(metrics.volume)),
        createMetric(ui().liquidity, compactMoney(metrics.liquidity))
      );
      const signal = document.createElement('div');
      signal.className = 'zrai-signal-line';
      const labels = signalLabels();
      signal.textContent = metrics.hasTrades
        ? labels.buy + ' ' + (metrics.buys === null ? '—' : metrics.buys.toLocaleString()) +
          ' · ' + labels.sell + ' ' + (metrics.sells === null ? '—' : metrics.sells.toLocaleString()) +
          ' · ' + (metrics.trades ? labels.trades + ' ' + metrics.trades.toLocaleString() : labels.none)
        : labels.unavailable;
      const addressLink = document.createElement('a');
      addressLink.className = 'zrai-address';
      addressLink.href = 'https://solscan.io/token/' + encodeURIComponent(address);
      addressLink.target = '_blank';
      addressLink.rel = 'noopener noreferrer';
      addressLink.textContent = shortAddress(address) + ' ↗';
      addressLink.title = address;
      body.append(heading, metricsLine, signal, addressLink);

      const view = document.createElement('a');
      view.className = 'zrai-open';
      view.href = dexUrl;
      view.target = '_blank';
      view.rel = 'noopener noreferrer';
      const viewLabel = document.createElement('span');
      viewLabel.id = 'zrai-open-label-' + index;
      viewLabel.textContent = ui().view;
      view.append(viewLabel);
      view.setAttribute('aria-labelledby', viewLabel.id + ' ' + tokenSymbol.id);
      card.append(rank, body, view);
      list.append(card);
    });
    if (ranked.length < 5) {
      const filler = document.createElement('div');
      filler.className = 'zrai-radar-note';
      const icon = document.createElement('span');
      icon.className = 'zrai-radar-note-icon';
      icon.textContent = '✳';
      const copy = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = ranked.length + ' ' + ui().verified;
      const detail = document.createElement('span');
      detail.textContent = ui().note;
      copy.append(title, detail);
      filler.append(icon, copy);
      list.append(filler);
    }
    setState(payload.stale ? ui().stale : ui().online, payload.stale ? 'stale' : 'online');
  }
  async function load(showLoading) {
    const currentRequest = ++requestId;
    refreshButton.disabled = true;
    refreshButton.classList.add('is-loading');
    setText(refreshButton, ui().scan);
    setState(ui().scan, 'loading');
    if (!lastPayload || showLoading) setMessage(ui().loading, 'loading');
    try {
      const response = await zcApiFetch(apiBase + '/api/radar', {
        cache: 'no-store',
        signal: AbortSignal.timeout(18000)
      });
      if (!response.ok) throw new Error('Radar API HTTP ' + response.status);
      const payload = await response.json();
      if (currentRequest !== requestId) return;
      if (!Array.isArray(payload.pairs) || payload.error) throw new Error(payload.error || 'Invalid radar response');
      lastPayload = payload;
      lastSuccessAt = Date.now();
      render(payload);
      const timestamp = number(payload.updatedAt);
      setText(updated, ui().updated + ' ' + (timestamp ? new Date(timestamp * 1000).toLocaleTimeString(localeCode,{hour:'2-digit',minute:'2-digit'}) : ui().unknown));
      if (payload.stale) setText(updated, ui().staleSource);
    } catch (error) {
      if (currentRequest !== requestId) return;
      console.warn('Zombie Radar feed request failed:', error);
      setState(lastPayload ? ui().stale : ui().error, lastPayload ? 'stale' : 'error');
      if (!lastPayload) setMessage(ui().unavailable, 'error');
      else setMessage(ui().failed, 'error');
      setText(updated, lastPayload
        ? ui().lastSuccess + ' ' + new Date(lastSuccessAt).toLocaleTimeString(localeCode,{hour:'2-digit',minute:'2-digit'})
        : ui().noSuccess);
    } finally {
      if (currentRequest === requestId) {
        refreshButton.disabled = false;
        refreshButton.classList.remove('is-loading');
        setText(refreshButton, ui().refresh);
      }
    }
  }
  document.querySelectorAll('[data-radar-period]').forEach(button => {
    button.addEventListener('click', () => {
      const period = button.dataset.radarPeriod;
      if (!periods[period] || period === activePeriod) return;
      activePeriod = period;
      document.querySelectorAll('[data-radar-period]').forEach(tab => {
        const active = tab === button;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-pressed', String(active));
      });
      setText(periodNote, ui().periodNote + ' · ' + periods[period].label);
      if (lastPayload) {
        render(lastPayload);
        if (lastPayload.stale) setState(ui().stale, 'stale');
      } else load(true);
    });
  });
  document.addEventListener('zombcash:languagechange', event => {
    localeCode = event.detail && event.detail.language || document.documentElement.lang || 'en';
    if (lastPayload) render(lastPayload);
  });
  refreshButton.addEventListener('click', () => load(true));
  load(false);
  setInterval(() => load(false), 60000);
})();

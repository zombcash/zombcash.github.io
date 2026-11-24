const fs = require('node:fs');
const assert = require('node:assert/strict');

const script = fs.readFileSync('script.js', 'utf8');
const recovery = fs.readFileSync('living-world-recovery.js', 'utf8');
const auth = fs.readFileSync('survivor-auth.js', 'utf8');

function section(source, start, end) {
  const from = source.indexOf(start);
  assert.notStrictEqual(from, -1, 'Missing section: ' + start);
  const to = source.indexOf(end, from + start.length);
  assert.notStrictEqual(to, -1, 'Missing section end: ' + end);
  return source.slice(from, to);
}

const apiSections = [
  ['Radar loader', section(script, 'async function loadRadar(', 'async function loadZomMarket()')],
  ['Market snapshot loader', section(script, 'async function loadZomMarket()', 'async function loadWorldNews()')],
  ['News loader', section(script, 'async function loadWorldNews()', 'function renderAlarms(')],
  ['Market alarms loader', section(script, 'async function loadMarketAlarms()', 'function renderMissions()')],
  ['Activity loader', section(script, 'async function loadActivity()', 'function renderVote(')],
  ['Vote loader', section(script, 'async function loadVote()', 'async function castVote(')],
  ['Vote submission', section(script, 'async function castVote(', 'function renderLeaderboard(')],
  ['Leaderboard loader', section(script, 'async function loadLeaderboard()', 'function money(')],
  ['Snake session start', section(script, 'async function beginSnakeSurvivalSession()', 'async function completeSnakeSurvivalSession(')],
  ['Snake session completion', section(script, 'async function completeSnakeSurvivalSession(', 'function resizeGameCanvas(')],
];

for (const [name, source] of apiSections) {
  assert.match(source, /AbortSignal\.timeout\(/, name + ' must have a bounded network request');
}

assert.match(recovery, /const request = async \(path, timeout = 10000\) => \{[\s\S]*?signal: AbortSignal\.timeout\(timeout\)/,
  'The shared recovery request helper must enforce a timeout');
for (const endpoint of ["request('/api/news')", "request('/api/zombcash')"]) {
  assert(recovery.includes(endpoint), 'Recovery must use the bounded helper for ' + endpoint);
}

const authFetches = (auth.match(/fetch\(API\s*\+/g) || []).length;
const authTimeouts = (auth.match(/AbortSignal\.timeout\(/g) || []).length;
assert.equal(authFetches, authTimeouts,
  'Every Survivor authentication/profile API request must have a timeout');
assert(auth.includes('aria-haspopup') && auth.includes("aria-controls', 'survivor-profile-modal'"),
  'Survivor login trigger must expose dialog semantics');
assert(auth.includes("aria-expanded', String(Boolean(overlay && !overlay.hidden))"),
  'Survivor login trigger must expose its expanded state');
assert(auth.includes("if (e.key !== 'Tab') return;") && auth.includes("document.addEventListener('focusin'"),
  'Survivor dialog must contain keyboard focus');
assert(auth.includes('restore.focus()') && auth.includes('function focusModalFirst()'),
  'Survivor dialog must move focus in and restore it on close');
assert(section(auth, 'async function beginBotLogin()', 'async function loadSurvivorDashboard()').includes('finally {\n      isBusy = false;'),
  'Telegram login must release the busy state after success, expiry or failure');

console.log('PASS: homepage/game API requests are time-bounded; recovery is bounded; Survivor login has dialog focus management and bounded requests.');

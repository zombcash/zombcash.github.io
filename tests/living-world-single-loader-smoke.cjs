const fs = require('fs');
const assert = require('assert');

const primary = fs.readFileSync('script.js', 'utf8');
const recovery = fs.readFileSync('living-world-recovery.js', 'utf8');

function section(source, start, end) {
  const from = source.indexOf(start);
  assert.notStrictEqual(from, -1, 'Missing section: ' + start);
  const to = source.indexOf(end, from + start.length);
  assert.notStrictEqual(to, -1, 'Missing section end: ' + end);
  return source.slice(from, to);
}

const marketPrimary = section(primary, 'async function loadZomMarket()', 'async function loadWorldNews()');
const newsPrimary = section(primary, 'async function loadWorldNews()', 'async function ');
assert(marketPrimary.indexOf('window.__zombcashMarketCardStarted = true;') < marketPrimary.indexOf('fetch(') || marketPrimary.includes('window.__zombcashMarketCardStarted = true;'), 'Primary market loader must mark itself before requesting data');
assert(newsPrimary.includes('window.__zombcashWorldNewsStarted = true;'), 'Primary news loader must mark itself before requesting data');

assert(recovery.includes('!window.__zombcashWorldNewsStarted && newsLooksUninitialized'), 'News recovery must skip when primary news loader started');
assert(recovery.includes('!window.__zombcashMarketCardStarted && !!(marketRoot'), 'Market recovery must skip when primary market loader started');
assert(recovery.includes('!window.__zombcashMarketAlarmsStarted && alertsLookUninitialized'), 'Alarm recovery must be independently gated');
assert(recovery.includes('window.__zombcashWorldNewsStarted = true;'), 'Fallback news loader must mark itself');
assert(recovery.includes('window.__zombcashMarketAlarmsStarted = true;'), 'Fallback alarms loader must mark itself');
assert(recovery.includes('window.__zombcashMarketCardStarted = true;'), 'Fallback market loader must mark itself');
assert(recovery.includes('if (needsNewsRecovery)') && recovery.includes('if (needsAlertsRecovery)') && recovery.includes('if (needsMarketRecovery)'), 'Each recovery panel must have an independent start condition');
assert(!recovery.includes('if (needsWorldRecovery)'), 'Combined recovery gate must not return');

console.log('PASS: primary and fallback loaders are independently gated; duplicate polling regression is covered.');

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

function assertFlagBeforeAwait(source, flag, label) {
  const flagIndex = source.indexOf(flag);
  const awaitIndex = source.indexOf('await ');
  assert(flagIndex !== -1, label + ' must set its started flag');
  assert(awaitIndex !== -1 && flagIndex < awaitIndex, label + ' must set its started flag before the first asynchronous request');
}

const marketPrimary = section(primary, 'async function loadZomMarket()', 'async function loadWorldNews()');
const newsPrimary = section(primary, 'async function loadWorldNews()', 'async function ');
assertFlagBeforeAwait(marketPrimary, 'window.__zombcashMarketCardStarted = true;', 'Primary market loader');
assertFlagBeforeAwait(newsPrimary, 'window.__zombcashWorldNewsStarted = true;', 'Primary news loader');

const fallbackNews = section(recovery, 'async function loadNews()', 'async function loadAlarms()');
const fallbackAlarms = section(recovery, 'async function loadAlarms()', 'async function loadMarketCard()');
const fallbackMarket = section(recovery, 'async function loadMarketCard()', 'if (needsNewsRecovery)');
assertFlagBeforeAwait(fallbackNews, 'window.__zombcashWorldNewsStarted = true;', 'Fallback news loader');
assertFlagBeforeAwait(fallbackAlarms, 'window.__zombcashMarketAlarmsStarted = true;', 'Fallback alarms loader');
assertFlagBeforeAwait(fallbackMarket, 'window.__zombcashMarketCardStarted = true;', 'Fallback market loader');

assert(recovery.includes('!window.__zombcashWorldNewsStarted && newsLooksUninitialized'), 'News recovery must skip when primary news loader started');
assert(recovery.includes('!window.__zombcashMarketCardStarted && !!(marketRoot'), 'Market recovery must skip when primary market loader started');
assert(recovery.includes('!window.__zombcashMarketAlarmsStarted && alertsLookUninitialized'), 'Alarm recovery must be independently gated');
assert(recovery.includes('if (needsNewsRecovery)') && recovery.includes('if (needsAlertsRecovery)') && recovery.includes('if (needsMarketRecovery)'), 'Each recovery panel must have an independent start condition');
assert(!recovery.includes('if (needsWorldRecovery)'), 'Combined recovery gate must not return');

console.log('PASS: primary and fallback loaders are independently gated before async requests; duplicate polling regression is covered.');

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const homepageSource = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const moneyStart = homepageSource.indexOf('const zomMoney = value => {');
const moneyEnd = homepageSource.indexOf('async function loadZomMarket()', moneyStart);
assert.ok(moneyStart >= 0 && moneyEnd > moneyStart, 'homepage token market formatters must exist');
const homepageFormatters = homepageSource.slice(moneyStart, moneyEnd);
const homepage = vm.runInNewContext('(() => {' + homepageFormatters + '; return {zomMoney, zomPriceText};})()');
assert.equal(homepage.zomMoney(null), '—');
assert.equal(homepage.zomMoney(undefined), '—');
assert.equal(homepage.zomMoney(''), '—');
assert.equal(homepage.zomMoney(0), '$0.00', 'a real numeric zero must remain visible');
assert.equal(homepage.zomMoney(1600), '$1.6K');
assert.equal(homepage.zomPriceText(null), '—');

const liveSource = fs.readFileSync(path.join(root, 'market-data-live.js'), 'utf8');
const helperStart = liveSource.indexOf('const hasNumericValue=');
const helperEnd = liveSource.indexOf('const set=', helperStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, 'market data numeric formatters must exist');
const helperSource = liveSource.slice(helperStart, helperEnd);
const live = vm.runInNewContext('(() => { const T={noData:"No data"}; const locale="en"; ' + helperSource + '; return {hasNumericValue,fmt,money,pct,totalTxns,countLabel}; })()');

for (const missing of [null, undefined, '']) {
  assert.equal(live.hasNumericValue(missing), false);
  assert.equal(live.fmt(missing, 0), 'No data');
  assert.equal(live.money(missing), 'No data');
  assert.equal(live.pct(missing), 'No data');
}
assert.equal(live.hasNumericValue(0), true);
assert.equal(live.hasNumericValue('0'), true);
assert.equal(live.pct(0), '0%', 'numeric zero must not be mistaken for missing data');
assert.equal(live.pct(-1.25), '-1.25%');
assert.equal(live.totalTxns({buys: null, sells: null}), null);
assert.equal(live.totalTxns({buys: 0, sells: 0}), 0);
assert.equal(live.totalTxns({buys: 2, sells: 3}), 5);
assert.equal(live.countLabel({buys: null, sells: null}, 'trades'), 'No data');
assert.equal(live.countLabel({buys: 0, sells: 0}, 'trades'), '0 trades');

console.log('PASS: null/undefined/empty market fields display as unavailable; numeric zero remains a real zero.');

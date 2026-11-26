const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'homepage-ribbons.js'), 'utf8');
const start = source.indexOf('function updateCrypto(){');
const end = source.indexOf('function updateFx()', start);
assert.ok(start >= 0 && end > start, 'homepage crypto updater must exist');
const updateCryptoSource = source.slice(start, end);

function createUpdater(fetchImpl) {
  const calls = [];
  const sources = [];
  const items = {};
  const updater = vm.runInNewContext('(' + updateCryptoSource + ')', {
    fetch: (...args) => { calls.push(args[0]); return fetchImpl(...args); },
    AbortSignal: { timeout: () => ({}) },
    setMarketSource: value => sources.push(value),
    setItem: (key, value) => { items[key] = value; },
    fmtPrice: value => 'USD ' + value,
    fmtChange: value => (value >= 0 ? '+' : '') + value.toFixed(2) + '%'
  });
  return { updater, calls, sources, items };
}

async function settle() {
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setTimeout(resolve, 0));
}

(async () => {
  const gecko = createUpdater(async () => ({
    ok: true,
    json: async () => ({
      bitcoin: { usd: 65000, usd_24h_change: 1.25 },
      ethereum: { usd: 3200, usd_24h_change: -0.5 },
      solana: { usd: 145, usd_24h_change: 2.1 }
    })
  }));
  gecko.updater();
  await settle();
  assert.equal(gecko.calls.length, 1, 'CoinGecko success must not call Binance');
  assert.ok(gecko.calls[0].startsWith('https://api.coingecko.com/'));
  assert.deepEqual(gecko.sources, ['COINGECKO']);
  assert.match(gecko.items['BTC:'], /65000/);
  assert.match(gecko.items['ETH:'], /3200/);
  assert.match(gecko.items['SOL:'], /145/);

  const rateLimited = createUpdater(async url => {
    assert.ok(url.includes('coingecko.com'), 'the browser must use the verified CORS-compatible CoinGecko endpoint');
    return { ok: false, status: 429, json: async () => ({}) };
  });
  rateLimited.updater();
  await settle();
  assert.equal(rateLimited.calls.length, 1, 'CoinGecko rate limits must not trigger a browser-side Binance request');
  assert.deepEqual(rateLimited.sources, ['']);
  for (const symbol of ['BTC', 'ETH', 'SOL']) {
    assert.equal(rateLimited.items[symbol + ':'], symbol + ': temporarily unavailable');
  }

  const unavailable = createUpdater(async url => {
    assert.ok(url.includes('coingecko.com'), 'CoinGecko remains the sole browser market provider');
    return { ok: false, status: 503, json: async () => ({}) };
  });
  unavailable.updater();
  await settle();
  assert.equal(unavailable.calls.length, 1, 'provider failure must not call a CORS-blocked fallback');
  assert.deepEqual(unavailable.sources, ['']);
  for (const symbol of ['BTC', 'ETH', 'SOL']) {
    assert.equal(unavailable.items[symbol + ':'], symbol + ': temporarily unavailable');
  }

  const missingChange = createUpdater(async () => ({
    ok: true,
    json: async () => ({
      bitcoin: { usd: 65000, usd_24h_change: null },
      ethereum: { usd: 3200 },
      solana: { usd: 145, usd_24h_change: 2.1 }
    })
  }));
  missingChange.updater();
  await settle();
  assert.equal(missingChange.calls.length, 1);
  assert.doesNotMatch(missingChange.items['BTC:'], /0\.00%/, 'missing 24h change must not be fabricated as zero');
  assert.doesNotMatch(missingChange.items['ETH:'], /0\.00%/, 'missing 24h change must not be fabricated as zero');

  console.log('PASS: CoinGecko is the sole browser market source; rate limits and provider failures show an explicit unavailable state; no fake prices or zero changes are displayed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

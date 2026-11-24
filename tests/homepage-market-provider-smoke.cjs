const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'homepage-ribbons.js'), 'utf8');
const start = source.indexOf('function updateCrypto(){');
const end = source.indexOf('\\n function updateFx()', start);
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

  const fallback = createUpdater(async url => {
    if (url.includes('coingecko.com')) return { ok: false, status: 429, json: async () => ({}) };
    return {
      ok: true,
      json: async () => [
        { symbol: 'BTCUSDT', lastPrice: '65000', priceChangePercent: '1.25' },
        { symbol: 'ETHUSDT', lastPrice: '3200', priceChangePercent: '-0.50' },
        { symbol: 'SOLUSDT', lastPrice: '145', priceChangePercent: '2.10' }
      ]
    };
  });
  fallback.updater();
  await settle();
  assert.equal(fallback.calls.length, 2, 'Binance must be requested only after CoinGecko fails');
  assert.ok(fallback.calls[0].includes('coingecko'));
  assert.ok(fallback.calls[1].includes('binance'));
  assert.deepEqual(fallback.sources, ['']);
  assert.match(fallback.items['BTC:'], /65000/);

  const unavailable = createUpdater(async () => ({ ok: false, status: 503, json: async () => ({}) }));
  unavailable.updater();
  await settle();
  assert.deepEqual(unavailable.sources, ['']);
  for (const symbol of ['BTC', 'ETH', 'SOL']) {
    assert.equal(unavailable.items[symbol + ':'], symbol + ': temporarily unavailable');
  }

  console.log('PASS: CoinGecko is primary; Binance is a bounded fallback; failed providers never display fake prices.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

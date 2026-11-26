const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'homepage-ribbons.js'), 'utf8');
const marketScript = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const recoveryScript = fs.readFileSync(path.join(root, 'living-world-recovery.js'), 'utf8');
assert.ok(marketScript.includes("zomVolume.textContent = data.activityAvailable === false || data.volume?.h24 == null || !Number.isFinite(Number(data.volume.h24)) || Number(data.volume.h24) <= 0 ? '—' : zomMoney(data.volume.h24);"), 'main market card must hide unavailable/zero/invalid activity volume');
assert.ok(recoveryScript.includes("if (byId('zombcash-volume')) byId('zombcash-volume').textContent = data.activityAvailable === false || !data.volume || data.volume.h24 == null || !Number.isFinite(Number(data.volume.h24)) || Number(data.volume.h24) <= 0 ? '—' : money(data.volume.h24);"), 'recovery market card must hide unavailable/zero/invalid activity volume');
assert.ok(marketScript.includes("const activityAvailable = activityData.activityAvailable === true || (activityData.activityAvailable !== false && hasPositiveActivity);"), 'activity panel must distinguish no confirmed activity from confirmed counters');
assert.ok(marketScript.includes("activityBuys.textContent = buys === null ? '—' : prettyCount(buys);"), 'unavailable buys must display a dash');
assert.ok(marketScript.includes("activitySells.textContent = sells === null ? '—' : prettyCount(sells);"), 'unavailable sells must display a dash');
assert.ok(marketScript.includes("!activityAvailable ? activityMessages.unavailable"), 'activity panel must show an explicit unavailable message');
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


// The ZOMBCASH ribbon must fall back to the site's cached GeckoTerminal-backed API
// when DexScreener returns no Solana pair or is temporarily unavailable.
const zombieStart = source.indexOf('function updateZombieCash(){');
const zombieEnd = source.indexOf('function refresh()', zombieStart);
assert.ok(zombieStart >= 0 && zombieEnd > zombieStart, 'ZombieCash ribbon updater must exist');
const zombieUpdaterSource = source.slice(zombieStart, zombieEnd);
function createZombieCashUpdater(fetchImpl) {
  const calls=[];
  const items={};
  const updater=vm.runInNewContext('('+zombieUpdaterSource+')',{
    fetch:(...args)=>{calls.push(args[0]);return fetchImpl(...args);},
    setItem:(key,value)=>{items[key]=value;},
    fmtPrice:value=>'USD '+Number(value).toFixed(8),
    fmtChange:value=>(value>=0?'+':'')+Number(value).toFixed(2)+'%'
  });
  return {updater,calls,items};
}
async function settleZombie() { await new Promise(resolve=>setTimeout(resolve,0)); await new Promise(resolve=>setTimeout(resolve,0)); await new Promise(resolve=>setTimeout(resolve,0)); }
(async()=>{
  const fallback=createZombieCashUpdater(async url=>{
    if(url.includes('dexscreener.com'))return {ok:true,json:async()=>({pairs:[]})};
    assert.ok(url.includes('/api/zombcash'),'fallback must use the project API');
    return {ok:true,json:async()=>({priceUsd:0.000002037,priceChange:{h24:0},marketDataAvailable:true,source:'GeckoTerminal'})};
  });
  fallback.updater();await settleZombie();
  assert.equal(fallback.calls.length,2,'empty DexScreener result must trigger one backend fallback');
  assert.match(fallback.items['$ZOMBCASH:'],/USD 0\.00000204/);
  assert.match(fallback.items['$ZOMBCASH:'],/GECKOTERMINAL/);

  const direct=createZombieCashUpdater(async url=>{
    assert.ok(url.includes('dexscreener.com'));
    return {ok:true,json:async()=>({pairs:[{chainId:'solana',priceUsd:'0.000003',priceChange:{h24:4.2},liquidity:{usd:100}}]})};
  });
  direct.updater();await settleZombie();
  assert.equal(direct.calls.length,1,'valid DexScreener pair must not invoke fallback');
  assert.match(direct.items['$ZOMBCASH:'],/\+4\.20%/);

  const unavailable=createZombieCashUpdater(async()=>({ok:false,status:503,json:async()=>({})}));
  unavailable.updater();await settleZombie();
  assert.equal(unavailable.calls.length,2,'DexScreener failure must attempt the backend fallback');
  assert.match(unavailable.items['$ZOMBCASH:'],/temporarily unavailable/);
  console.log('PASS: ZOMBCASH ticker uses GeckoTerminal-backed API fallback when DexScreener has no pair or errors.');
})().catch(error=>{console.error(error);process.exitCode=1;});

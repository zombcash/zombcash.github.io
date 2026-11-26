const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const start = source.indexOf('function renderPriceChart(data) {');
const end = source.indexOf('async function loadPriceChart()', start);
assert.ok(start >= 0 && end > start, 'price chart renderer must exist');
const rendererSource = source.slice(start, end).trim();

function makeNode() {
  return { attributes: {}, children: [], textContent: '', setAttribute(k,v){this.attributes[k]=String(v);}, append(n){this.children.push(n);}, replaceChildren(){this.children=[];} };
}
function run(period, points) {
  const chartEl=makeNode(), chartStatus={textContent:''}, chartCurrent={textContent:''}, chartStart={textContent:''}, chartEnd={textContent:''};
  const context={chartEl,chartStatus,chartCurrent,chartStart,chartEnd,chartPeriod:period,activityJapaneseUI:false,
    money:value=>'$'+Number(value).toFixed(8),
    chartMessage:message=>{chartEl.replaceChildren();const n=makeNode();n.textContent=message;chartEl.append(n);}};
  const render=vm.runInNewContext('('+rendererSource+')',context);
  render({source:'GeckoTerminal',points});
  return {chartEl,chartStatus,chartStart,chartEnd};
}
const now=Math.floor(Date.now()/1000);
const fresh=run('24h',[{time:now-3600,price:1},{time:now-1800,price:1.1}]);
assert.doesNotMatch(fresh.chartStatus.textContent,/STALE/i,'fresh 24h history must not be marked stale');
assert.equal(fresh.chartStart.textContent!==fresh.chartEnd.textContent,true,'fresh chart should show its range');

const stale=run('24h',[{time:now-10*86400,price:1},{time:now-2*86400,price:1.1}]);
assert.match(stale.chartStatus.textContent,/STALE/i,'history outside selected range must be explicitly marked stale');
assert.ok(stale.chartEl.children.some(node=>/No candles in selected period/i.test(node.textContent||'')),'stale chart must display an explanatory warning');
assert.match(stale.chartEl.attributes['aria-label']||'',/stale/i,'stale chart must expose warning to assistive technology');

const recent=run('7d',[{time:now-8*86400,price:1},{time:now-6*86400,price:1.1},{time:now-2*86400,price:1.2}]);
assert.doesNotMatch(recent.chartStatus.textContent,/STALE/i,'7d chart should use the two points inside its selected window');
assert.match(recent.chartStart.textContent,/Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct/i);
console.log('PASS: price history is filtered to selected time window; stale fallback is visibly and accessibly marked.');

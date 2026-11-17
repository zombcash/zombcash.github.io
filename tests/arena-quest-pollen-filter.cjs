const { chromium } = require('playwright');
const path = require('path');

const CATALOG = 'https://gen.pollinations.ai/models?category=decision';
const API = 'https://gen.pollinations.ai/alpha/decisions';
const eligible = [
  { id: 'provider/free-one', title: 'Free One', paid_only: false, supported_endpoints: ['/alpha/decisions'] },
  { id: 'provider/free-two', title: 'Free Two', paid_only: false, supported_endpoints: ['/alpha/decisions'] }
];
const catalogue = [
  { id: 'typesafe/jev-1.14', title: 'Jev', paid_only: true, supported_endpoints: ['/alpha/decisions'] },
  ...eligible,
  { id: 'provider/wrong-endpoint', title: 'Wrong Endpoint', paid_only: false, supported_endpoints: ['/openai'] },
  { id: 'provider/unknown-price', title: 'Unknown Price', supported_endpoints: ['/alpha/decisions'] }
];

function markup() {
  return `<!doctype html><html><body>
    <section id="zombcash-ai-arena">
      <span id="zai-mode"></span><p id="zai-live"></p><p id="zai-status"></p>
      <select id="zai-model-a"></select><select id="zai-model-b"></select>
      <button id="zai-play">Play</button><button id="zai-reset">Reset</button>
      <span id="zai-round"></span><span id="zai-score-a"></span><span id="zai-score-b"></span>
      <p id="zai-last"></p><div id="zai-log"></div>
    </section>
    <input id="zai-connect">
  </body></html>`;
}

async function boot(browser, catalogResponse) {
  const page = await browser.newPage();
  let apiCalls = [];
  await page.route(CATALOG, route => catalogResponse === 'error'
    ? route.fulfill({ status: 503, body: 'unavailable' })
    : route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(catalogResponse) }));
  await page.route(API, async route => {
    const body = route.request().postDataJSON();
    apiCalls.push(body);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ answers: { move: { choice: 'attack', confidence: 0.9 } } })
    });
  });
  await page.setContent(markup());
  await page.addScriptTag({ path: path.resolve(__dirname, '../ai-arena.js') });
  await page.waitForFunction(() => document.querySelector('#zai-status')?.textContent);
  return { page, apiCalls };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    // Paid-only, unsupported and unpriced entries must never enter either selector.
    const { page, apiCalls } = await boot(browser, catalogue);
    await page.waitForFunction(() => document.querySelectorAll('#zai-model-a option').length === 2);
    const ids = await page.locator('#zai-model-a option').evaluateAll(options => options.map(option => option.value));
    if (JSON.stringify(ids) !== JSON.stringify(eligible.map(model => model.id))) {
      throw new Error('Arena selectors contain a model that is not explicitly Quest-Pollen eligible: ' + ids.join(', '));
    }
    await page.evaluate(() => {
      const connector = document.querySelector('#zai-connect');
      connector.apiKey = 'test-pollen-key';
      connector.dispatchEvent(new Event('change'));
    });
    await page.waitForFunction(() => !document.querySelector('#zai-play').disabled);
    await page.locator('#zai-play').click();
    await page.waitForFunction(() => document.querySelector('#zai-round')?.textContent === '1');
    if (apiCalls.length !== 2) throw new Error('Expected exactly two live calls for the two verified free models');
    for (const call of apiCalls) {
      if (!eligible.some(model => model.id === call.model)) {
        throw new Error('Live request attempted a model outside the verified free catalogue: ' + call.model);
      }
    }
    await page.close();

    // A single eligible model is not enough for a two-player live match.
    const single = await boot(browser, [eligible[0]]);
    await single.page.waitForFunction(() => document.querySelectorAll('#zai-model-a option').length === 1);
    await single.page.evaluate(() => {
      const connector = document.querySelector('#zai-connect');
      connector.apiKey = 'test-pollen-key';
      connector.dispatchEvent(new Event('change'));
    });
    await single.page.waitForFunction(() => document.querySelector('#zai-status')?.textContent.includes('Fewer than two'));
    if (!(await single.page.locator('#zai-play').isDisabled())) throw new Error('Live play must be disabled when fewer than two eligible models exist');
    await single.page.locator('#zai-play').click();
    if (single.apiCalls.length) throw new Error('A live API request was sent without two verified eligible models');
    await single.page.close();

    // If the catalogue cannot be verified, live mode fails closed.
    const unavailable = await boot(browser, 'error');
    await unavailable.page.waitForFunction(() => document.querySelector('#zai-log')?.innerText.includes('Could not load the live decision-model catalogue'));
    await unavailable.page.evaluate(() => {
      const connector = document.querySelector('#zai-connect');
      connector.apiKey = 'test-pollen-key';
      connector.dispatchEvent(new Event('change'));
    });
    if (!(await unavailable.page.locator('#zai-play').isDisabled())) throw new Error('Live play must remain disabled when the model catalogue cannot be verified');
    if (unavailable.apiCalls.length) throw new Error('A live API request was sent while the model catalogue was unavailable');
    await unavailable.page.close();

    console.log('Quest Pollen regression passed: paid-only and unpriced models excluded; live requests use verified free models only; insufficient or unavailable catalogues fail closed.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});

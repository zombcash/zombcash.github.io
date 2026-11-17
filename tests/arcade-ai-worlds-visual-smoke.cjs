const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const base = process.env.SITE_URL || 'http://127.0.0.1:4173/';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(new URL('arcade.html', base).toString(), { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#zombcash-outbreak-world', { timeout: 30000 });
  await page.waitForSelector('#zw-mcp-endpoint');
  if (!(await page.locator('#zw-mcp-status').innerText()).includes('DEPLOYED')) throw new Error('MCP deployment status missing from live Arcade UI');
  if (!(await page.locator('#zw-mcp-endpoint').getAttribute('href')).startsWith('https://')) throw new Error('MCP endpoint link is not HTTPS');
  await page.locator('#zw-demo-start').click();
  await page.locator('#zw-demo-turn').click();
  if (!(await page.locator('#zw-outbreak-turns').innerText()).includes('1')) throw new Error('Outbreak local demo turn counter did not advance');
  await page.evaluate(() => { document.documentElement.lang = 'ru'; document.dispatchEvent(new CustomEvent('zombcash:languagechange', { detail: { language: 'ru' } })); });
  if (!(await page.locator('#zw-mcp-status').innerText()).includes('РАБОТАЕТ')) throw new Error('Russian translation is missing on the actual Arcade page');
  await page.evaluate(() => { document.documentElement.lang = 'en'; document.dispatchEvent(new CustomEvent('zombcash:languagechange', { detail: { language: 'en' } })); });
  const districts = page.locator('#zw-district-map .zw-district');
  if (await districts.count() !== 5) throw new Error('Five named districts are not rendered');
  if (!(await districts.nth(0).innerText()).includes('Market')) throw new Error('Market district is missing its name');
  await districts.nth(0).click();
  if (!(await districts.nth(0).innerText()).includes('CLEARED')) throw new Error('Searched district did not retain its cleared state');
  if (!(await districts.nth(0).isDisabled())) throw new Error('A searched district can be explored twice');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#zw-district-map .zw-district');
  const restoredDistricts = page.locator('#zw-district-map .zw-district');
  if (!(await restoredDistricts.nth(0).innerText()).includes('CLEARED')) throw new Error('Searched district state did not survive a page reload');
  if (!(await page.locator('#zw-world-turn').innerText()).includes('TURN 1')) throw new Error('Campaign turn did not survive a page reload');
  await page.evaluate(() => { document.documentElement.lang = 'ru'; document.dispatchEvent(new CustomEvent('zombcash:languagechange', { detail: { language: 'ru' } })); });
  if (!(await page.locator('#zw-district-map').innerText()).includes('Рынок')) throw new Error('District names did not localize to Russian');
  await page.locator('#zw-world-reset').click();
  if (!(await page.locator('#zw-district-map').innerText()).includes('НЕ ИЗУЧЕН')) throw new Error('World reset did not restore district exploration states');
  await page.evaluate(() => { document.documentElement.lang = 'en'; document.dispatchEvent(new CustomEvent('zombcash:languagechange', { detail: { language: 'en' } })); });
  await page.locator('#zw-next').click();
  if (!(await page.locator('#zw-world-turn').innerText()).includes('TURN 1')) throw new Error('A new campaign turn did not advance after reset');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#zw-district-map .zw-district');
  if (!(await page.locator('#zw-world-turn').innerText()).includes('TURN 1')) throw new Error('Campaign progress after reset did not persist');
  await page.evaluate(() => { document.documentElement.lang = 'en'; document.dispatchEvent(new CustomEvent('zombcash:languagechange', { detail: { language: 'en' } })); });
  async function runFinalDayScenario({food, shelters, expectedMessage, label}) {
    await page.evaluate(({food, shelters}) => {
      const key = 'zombcash.arcade.survival.v1';
      const state = JSON.parse(localStorage.getItem(key));
      if (!state) throw new Error('No saved campaign available for terminal scenario');
      state.turn = 27;
      state.food = food;
      state.danger = 1;
      state.worldFinished = false;
      state.agents.forEach((agent, index) => {
        agent.energy = 8;
        agent.home = index < shelters ? 1 : 0;
      });
      localStorage.setItem(key, JSON.stringify(state));
    }, {food, shelters});
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#zw-district-map .zw-district');
    if (!(await page.locator('#zw-world-turn').innerText()).includes('TURN 27')) throw new Error(label + ': campaign did not restore at day seven, turn 27');
    await page.selectOption('#zw-command', label === 'defeat' ? 'auto' : 'talk');
    await page.locator('#zw-next').click();
    await page.waitForFunction(() => document.querySelector('#zw-world-turn')?.textContent.includes('TURN 28'));
    await page.waitForFunction(expected => document.querySelector('#zw-world-feed')?.innerText.includes(expected), expectedMessage);
    if (!(await page.locator('#zw-next').isDisabled())) throw new Error(label + ': terminal campaign still allows another turn');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#zw-district-map .zw-district');
    if (!(await page.locator('#zw-world-feed').innerText()).includes(expectedMessage)) throw new Error(label + ': terminal result did not survive reload');
    if (!(await page.locator('#zw-next').isDisabled())) throw new Error(label + ': terminal state was not restored as finished');
  }
  await runFinalDayScenario({
    food: 8,
    shelters: 2,
    expectedMessage: 'SEVEN DAYS SURVIVED — two shelters secured. THE CREW LIVES!',
    label: 'full victory'
  });
  await runFinalDayScenario({
    food: 8,
    shelters: 0,
    expectedMessage: 'SEVEN DAYS SURVIVED, BUT THE SETTLEMENT IS EXPOSED.',
    label: 'partial victory'
  });
  await runFinalDayScenario({
    food: 0,
    shelters: 2,
    expectedMessage: 'SETTLEMENT LOST — the crew ran out of supplies or strength.',
    label: 'defeat'
  });
  await page.locator('#zw-world-reset').click();
  if (!(await page.locator('#zw-world-turn').innerText()).includes('TURN 0')) throw new Error('Reset World did not start a fresh campaign after a terminal result');
  if (await page.locator('#zw-next').isDisabled()) throw new Error('Reset World left the new campaign locked');
  if (!(await page.locator('#zw-world-mode').innerText()).includes('FREE LOCAL SIMULATION')) throw new Error('Balance run must use the free local simulation, not a live model');
  for (let expectedTurn = 1; expectedTurn <= 28; expectedTurn++) {
    if (await page.locator('#zw-next').isDisabled()) throw new Error('Default local strategy ended before turn ' + expectedTurn);
    await page.locator('#zw-next').click();
    await page.waitForFunction(turn => new RegExp('TURN\\s+' + turn + '\\b').test(document.querySelector('#zw-world-turn')?.textContent || ''), expectedTurn);
  }
  const balanceLog = await page.locator('#zw-world-feed').innerText();
  if (!balanceLog.includes('THE CREW LIVES!')) throw new Error('Default local strategy did not achieve a full seven-day victory');
  if (parseInt(await page.locator('#zw-shelter').innerText(), 10) < 2) throw new Error('Default local strategy did not build at least two shelters');
  if (parseInt(await page.locator('#zw-food').innerText(), 10) <= 0) throw new Error('Default local strategy reached victory without a food reserve');
  if (!(await page.locator('#zw-next').isDisabled())) throw new Error('Completed balance run still allows another turn');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#zw-district-map .zw-district');
  if (!(await page.locator('#zw-world-feed').innerText()).includes('THE CREW LIVES!')) throw new Error('Full victory from the default local strategy did not persist after reload');
  const out = path.join(process.cwd(), 'ai-worlds-visual-results');
  fs.mkdirSync(out, { recursive: true });
  await page.locator('#zombcash-outbreak-world').screenshot({ path: path.join(out, 'arcade-ai-worlds.png') });
  if (errors.length) throw new Error('Arcade page errors: ' + errors.join('; '));
  console.log('Actual Arcade page passed: MCP link, local match, locale switch. Screenshot saved.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });

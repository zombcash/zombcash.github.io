const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('file://' + path.resolve(__dirname, 'fixtures/ai-worlds.html'));
  await page.waitForSelector('#zombcash-outbreak-world');
  if (await page.locator('#zw-outbreak-map .zw-cell').count() !== 252) throw new Error('Outbreak board must render 18x14 tactical map');
  if (await page.locator('#zw-unit-roster .zw-unit').count() !== 18) throw new Error('Outbreak must spawn a large survivor roster');
  await page.selectOption('#zw-game-mode', 'ai-ai');
  await page.selectOption('#zw-ai-speed', '90');
  await page.locator('#zw-demo-start').click();
  await page.waitForFunction(() => document.querySelector('#zw-outbreak-turns').textContent.includes('1'), null, { timeout: 10000 });
  if (!(await page.locator('#zw-demo-turn').isDisabled())) throw new Error('Spectator mode must not allow manual turn control');
  await page.locator('#zw-demo-reset').click();
  await page.selectOption('#zw-game-mode', 'human-ai');
  await page.locator('#zw-demo-start').click();
  const moveCandidate = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('#zw-outbreak-map .zw-cell[data-unit-id^="H"]')];
    const roster = [...document.querySelectorAll('#zw-unit-roster .zw-unit')];
    for (const cell of cells) {
      const from = Number(cell.dataset.tile);
      const x = from % 18;
      const y = Math.floor(from / 18);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= 18 || ny < 0 || ny >= 14) continue;
        const target = ny * 18 + nx;
        const destination = document.querySelector('#zw-outbreak-map .zw-cell[data-tile="' + target + '"]');
        const blocked = ['zw-wall', 'zw-crate', 'zw-human', 'zw-zombie', 'zw-heli'];
        if (!destination || blocked.some(className => destination.classList.contains(className))) continue;
        const index = roster.findIndex(button => button.querySelector('small')?.textContent.trim() === cell.dataset.unitId);
        if (index >= 0) return { index, from, target, unitId: cell.dataset.unitId };
      }
    }
    return null;
  });
  if (!moveCandidate) throw new Error('No human-controlled unit has a legal adjacent tile');
  await page.locator('#zw-unit-roster .zw-unit').nth(moveCandidate.index).click();
  const selectedCell = page.locator('#zw-outbreak-map .zw-cell.zw-selected');
  const selectedTile = Number(await selectedCell.getAttribute('data-tile'));
  const selectedUnitId = await selectedCell.getAttribute('data-unit-id');
  if (selectedTile !== moveCandidate.from || selectedUnitId !== moveCandidate.unitId) throw new Error('The selected survivor does not match the available move candidate');
  await page.locator('#zw-outbreak-map .zw-cell[data-tile="' + moveCandidate.target + '"]').click();
  if (!(await page.locator('#zw-unit-roster .zw-unit').nth(moveCandidate.index).getAttribute('class')).includes('is-acted')) throw new Error('Human-controlled unit did not consume its action');
  await page.locator('#zw-next').click();
  await page.waitForFunction(() => document.querySelector('#zw-world-turn').textContent.includes('TURN 1'));
  await page.locator('#zw-auto').click();
  if (await page.locator('#zw-auto').innerText() !== 'AUTO: ON') throw new Error('Auto mode did not enable');
  await page.locator('#zw-auto').click();
  if (await page.locator('#zw-auto').innerText() !== 'AUTO: OFF') throw new Error('Auto mode did not disable');
  await page.evaluate(() => { document.documentElement.lang = 'ru'; document.dispatchEvent(new CustomEvent('zombcash:languagechange', { detail: { language: 'ru' } })); });
  if (!(await page.locator('#zw-mcp-status').innerText()).includes('РАБОТАЕТ')) throw new Error('Russian locale did not apply');
  if (!(await page.locator('#zw-demo-start').innerText()).includes('НАЧАТЬ')) throw new Error('Russian button translation missing');
  for (const lang of ['en', 'de', 'fr', 'it', 'ja', 'zh-CN', 'ru', 'tr', 'hi']) {
    await page.evaluate(code => { document.documentElement.lang = code; document.dispatchEvent(new CustomEvent('zombcash:languagechange', { detail: { language: code } })); }, lang);
    const status = await page.locator('#zw-mcp-status').innerText();
    if (!status || (lang !== 'en' && status === 'MCP SERVER: DEPLOYED · HTTPS')) throw new Error('AI Worlds locale missing: ' + lang);
  }
  if (errors.length) throw new Error('Browser errors: ' + errors.join('; '));
  console.log('AI Worlds browser smoke passed: board, outbreak turn, autonomous turn, auto toggle.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });

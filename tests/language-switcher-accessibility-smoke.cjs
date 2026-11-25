const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const SITE_URL = process.env.SITE_URL || 'http://127.0.0.1:4173/';
const routes = ['', 'de/', 'fr/', 'it/', 'ja/', 'zh-CN/', 'ru/', 'tr/', 'hi/'];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const route of routes) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(new URL(route, SITE_URL).href, { waitUntil: 'domcontentloaded', timeout: 30000 });

      const trigger = page.locator('.language-trigger');
      const menu = page.locator('#zombcash-language-menu');
      const options = menu.locator('.language-option');
      await trigger.waitFor({ state: 'visible', timeout: 15000 });
      await menu.waitFor({ state: 'attached' });

      assert.equal(await trigger.getAttribute('aria-controls'), 'zombcash-language-menu', route + ' language trigger aria-controls');
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false', route + ' initial aria-expanded');
      assert.ok((await trigger.getAttribute('aria-label'))?.trim(), route + ' localized language trigger label');
      assert.equal(await menu.getAttribute('role'), 'group', route + ' language options group role');
      assert.ok((await menu.getAttribute('aria-label'))?.trim(), route + ' localized language group label');
      assert.equal(await menu.isVisible(), false, route + ' menu starts hidden');
      assert.equal(await options.count(), 9, route + ' all nine language choices exist');

      await trigger.focus();
      await page.keyboard.press('Enter');
      assert.equal(await trigger.getAttribute('aria-expanded'), 'true', route + ' Enter opens language list');
      assert.equal(await menu.isVisible(), true, route + ' language list visible after Enter');

      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('.language-option')),
        true, route + ' Tab moves from trigger to first language option');

      await page.keyboard.press('Escape');
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false', route + ' Escape resets aria-expanded');
      assert.equal(await menu.isVisible(), false, route + ' Escape closes language list');
      assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('.language-trigger')),
        true, route + ' Escape restores focus to language trigger');

      await trigger.click();
      assert.equal(await trigger.getAttribute('aria-expanded'), 'true', route + ' pointer opens language list');
      await page.mouse.click(380, 800);
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false', route + ' outside click resets aria-expanded');
      assert.equal(await menu.isVisible(), false, route + ' outside click closes language list');

      await trigger.click();
      await options.last().focus();
      await page.keyboard.press('Tab');
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false', route + ' leaving switcher by keyboard closes it');
      assert.equal(await menu.isVisible(), false, route + ' focus leaving switcher hides language list');
      assert.deepEqual(errors, [], route + ' browser errors');

      results.push({ route: route || '/', status: 'PASS' });
      await page.close();
    }
    console.log(JSON.stringify({ result: 'PASS', testedLocales: routes.length, results }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const base = process.env.SITE_URL || 'http://127.0.0.1:4173/';
const routes = ['', 'de/', 'fr/', 'it/', 'ja/', 'zh-CN/', 'ru/', 'tr/', 'hi/'];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const route of routes) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(new URL(route, base).href, { waitUntil: 'domcontentloaded' });
      const toggle = page.locator('header.zombcash-shared-header .zsh-menu-toggle');
      const nav = page.locator('#zsh-navigation');
      await toggle.waitFor({ state: 'visible', timeout: 15000 });
      assert.ok((await toggle.getAttribute('aria-label') || '').trim(), route + ' menu toggle needs a non-empty accessible name');
      const localeFont = route === 'ja/' ? 'ja' : route === 'zh-CN/' ? 'zh' : route === 'hi/' ? 'hi' : null;
      if (localeFont) {
        const fontLink = page.locator('link[data-zsh-font-family="' + localeFont + '"]');
        await fontLink.waitFor({ state: 'attached', timeout: 10000 });
        const expectedText = await page.locator('.hero-content h1').evaluate(node => node.innerText.replace(/\\s+/g, ' ').trim());
        const fontUrl = new URL(await fontLink.getAttribute('href'));
        assert.equal(fontUrl.searchParams.get('text'), expectedText, route + ' locale font must be subset to the actual hero heading');
        assert.equal(fontUrl.searchParams.get('display'), 'optional', route + ' locale font display policy');
      }
      assert.equal(await toggle.getAttribute('aria-controls'), 'zsh-navigation', route + ' aria-controls');
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false', route + ' initial aria-expanded');
      assert.equal(await nav.isVisible(), false, route + ' menu should start closed');

      await toggle.focus();
      await page.keyboard.press('Enter');
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true', route + ' Enter opens menu');
      assert.equal(await nav.isVisible(), true, route + ' menu visible after Enter');

      await page.keyboard.press('Tab');
      const firstLinkFocused = await page.evaluate(() => document.activeElement === document.querySelector('#zsh-navigation a'));
      assert.equal(firstLinkFocused, true, route + ' Tab should move to first navigation link');

      await page.keyboard.press('Escape');
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false', route + ' Escape closes menu');
      assert.equal(await nav.isVisible(), false, route + ' menu hidden after Escape');
      const focusReturned = await page.evaluate(() => document.activeElement === document.querySelector('.zsh-menu-toggle'));
      assert.equal(focusReturned, true, route + ' Escape restores focus to trigger');

      await toggle.focus();
      await page.keyboard.press('Space');
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true', route + ' Space opens menu');
      await page.keyboard.press('Escape');
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false', route + ' Escape closes Space-opened menu');
      assert.deepEqual(errors, [], route + ' browser errors');
      results.push({ route: route || '/', status: 'PASS' });
      await page.close();
    }

    const tablet = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    await tablet.goto(base, { waitUntil: 'domcontentloaded' });
    const tabletToggle = tablet.locator('.zsh-menu-toggle');
    await tabletToggle.waitFor({ state: 'visible', timeout: 15000 });
    assert.equal(await tabletToggle.getAttribute('aria-expanded'), 'false');
    await tabletToggle.click();
    assert.equal(await tabletToggle.getAttribute('aria-expanded'), 'true');
    assert.equal(await tablet.locator('#zsh-navigation').isVisible(), true);
    await tablet.keyboard.press('Escape');
    assert.equal(await tabletToggle.getAttribute('aria-expanded'), 'false');
    results.push({ route: '/', viewport: '1024x768', status: 'PASS' });
    await tablet.close();

    console.log(JSON.stringify({ testedLocales: routes.length, results }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

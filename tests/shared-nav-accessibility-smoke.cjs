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

    const scrollPage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const scrollErrors = [];
    scrollPage.on('pageerror', error => scrollErrors.push(error.message));
    await scrollPage.goto(base, { waitUntil: 'domcontentloaded' });
    const scrollControls = scrollPage.locator('.page-scroll-controls');
    await scrollControls.waitFor({ state: 'attached', timeout: 15000 });
    await scrollPage.waitForFunction(() => window.__zshScrollControlsVisibilityBound === true);
    await scrollPage.evaluate(() => {
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: 500, bubbles: true }));
      window.scrollTo(0, Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
    });
    await scrollPage.waitForFunction(() => window.scrollY > 220);
    await scrollPage.waitForFunction(() =>
      document.querySelector('.page-scroll-controls')?.classList.contains('is-visible')
    );
    await scrollPage.evaluate(() => {
      const ad = document.createElement('div');
      ad.dataset.aa = 'qa-scroll-control-overlap';
      Object.assign(ad.style, {
        position: 'fixed', right: '8px', bottom: '8px',
        width: '70px', height: '100px', zIndex: '999999'
      });
      document.body.appendChild(ad);
    });
    await scrollPage.waitForFunction(() =>
      document.querySelector('.page-scroll-controls')?.classList.contains('is-ad-overlap')
    );
    await scrollPage.evaluate(() => document.querySelector('[data-aa="qa-scroll-control-overlap"]')?.remove());
    await scrollPage.waitForFunction(() =>
      !document.querySelector('.page-scroll-controls')?.classList.contains('is-ad-overlap')
    );
    await scrollPage.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.dataset.qaOverlap = 'game';
      Object.assign(canvas.style, {
        position: 'fixed', right: '8px', bottom: '8px',
        width: '70px', height: '100px', zIndex: '999999'
      });
      document.body.appendChild(canvas);
    });
    await scrollPage.waitForFunction(() =>
      document.querySelector('.page-scroll-controls')?.classList.contains('is-content-overlap')
    );
    await scrollPage.evaluate(() => document.querySelector('canvas[data-qa-overlap="game"]')?.remove());
    await scrollPage.waitForFunction(() =>
      !document.querySelector('.page-scroll-controls')?.classList.contains('is-content-overlap')
    );
    assert.deepEqual(scrollErrors, [], 'scroll-control overlap browser errors');
    results.push({ route: '/', viewport: '390x844', feature: 'scroll-control visibility and overlap', status: 'PASS' });
    await scrollPage.close();

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

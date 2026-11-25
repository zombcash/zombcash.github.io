const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sharedNavSource = fs.readFileSync(path.join(__dirname, '..', 'shared-nav.js'), 'utf8');
const updateStart = sharedNavSource.indexOf('const updateScrollControlsVisibility = () => {');
const updateEnd = sharedNavSource.indexOf('\n  };', updateStart);
assert.ok(updateStart >= 0 && updateEnd > updateStart, 'shared scroll-control updater must exist');
const updateSource = sharedNavSource.slice(updateStart, updateEnd);
const firstClassWrite = updateSource.indexOf('controls.classList.toggle');
const lastGeometryRead = updateSource.lastIndexOf('getBoundingClientRect');
assert.ok(firstClassWrite > lastGeometryRead, 'scroll-control geometry reads must finish before CSS classes change');
assert.match(sharedNavSource, /let scrollControlsUpdateFrame = 0;/, 'scroll-control updates must be frame-coalesced');
assert.match(sharedNavSource, /window\.requestAnimationFrame\(\(\) => \{/, 'scroll-control updates must be scheduled in requestAnimationFrame');
assert.match(sharedNavSource, /scrollControlsUpdateFrame = window\.requestAnimationFrame\(\(\) => \{\s*scrollControlsUpdateFrame = 0;\s*updateScrollControlsVisibility\(\);\s*\}\)/, 'the animation-frame callback must execute the geometry update, not reschedule itself');
assert.match(sharedNavSource, /window\.addEventListener\('scroll', scheduleScrollControlsVisibilityUpdate/, 'scroll events must use the frame scheduler');
assert.match(sharedNavSource, /window\.addEventListener\('resize', scheduleScrollControlsVisibilityUpdate/, 'resize events must use the frame scheduler');
assert.match(sharedNavSource, /new MutationObserver\(scheduleScrollControlsVisibilityUpdate\)/, 'DOM mutations must use the frame scheduler');


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
        const expectedText = await page.locator('.hero-content h1').evaluate(node => node.innerText.replace(/\s+/g, ' ').trim());
        const fontUrl = new URL(await fontLink.getAttribute('href'));
        assert.equal(fontUrl.searchParams.get('text'), expectedText, route + ' locale font must be subset to the actual hero heading');
        assert.equal(fontUrl.searchParams.get('display'), 'optional', route + ' locale font display policy');
      }
      for (const id of ['service-market-dot', 'service-api-dot', 'service-community-dot']) {
        const dot = page.locator('#' + id);
        await dot.waitFor({ state: 'attached', timeout: 5000 });
        assert.equal(await dot.getAttribute('aria-hidden'), 'true', route + ' ' + id + ' remains decorative');
        assert.equal(await dot.getAttribute('aria-label'), null, route + ' ' + id + ' must not expose an invalid aria-label');
      }
      for (const id of ['zc-promo-prev', 'zc-promo-next']) {
        const control = page.locator('#' + id);
        assert.equal(await control.getAttribute('aria-label'), null, route + ' ' + id + ' must use its visible localized label');
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

    // The homepage keeps a no-shared-nav fallback. Verify its own disclosure
    // control remains keyboard-operable if the shared navigation script fails.
    const fallback = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await fallback.route('**/shared-nav.js*', route => route.abort());
    await fallback.goto(base, { waitUntil: 'domcontentloaded' });
    const fallbackToggle = fallback.locator('header.topbar .menu-toggle');
    const fallbackNav = fallback.locator('#site-navigation');
    await fallbackToggle.waitFor({ state: 'visible', timeout: 15000 });
    assert.equal(await fallbackToggle.getAttribute('aria-controls'), 'site-navigation', 'fallback menu aria-controls');
    assert.equal(await fallbackToggle.getAttribute('aria-expanded'), 'false', 'fallback menu initial state');
    assert.equal(await fallbackNav.isVisible(), false, 'fallback menu starts closed');
    await fallbackToggle.focus();
    await fallback.keyboard.press('Enter');
    assert.equal(await fallbackToggle.getAttribute('aria-expanded'), 'true', 'fallback Enter opens menu');
    assert.equal(await fallbackNav.isVisible(), true, 'fallback menu visible after Enter');
    await fallback.keyboard.press('Escape');
    assert.equal(await fallbackToggle.getAttribute('aria-expanded'), 'false', 'fallback Escape closes menu');
    assert.equal(await fallbackNav.isVisible(), false, 'fallback menu hidden after Escape');
    assert.equal(await fallback.evaluate(() => document.activeElement === document.querySelector('.menu-toggle')), true, 'fallback Escape restores focus');
    await fallbackToggle.click();
    assert.equal(await fallbackToggle.getAttribute('aria-expanded'), 'true', 'fallback pointer opens menu');
    await fallbackNav.locator('a').first().click();
    assert.equal(await fallbackToggle.getAttribute('aria-expanded'), 'false', 'fallback navigation link closes menu');
    results.push({ route: '/', viewport: '390x844', mode: 'shared-nav unavailable', status: 'PASS' });
    await fallback.close();

    console.log(JSON.stringify({ testedLocales: routes.length, results }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

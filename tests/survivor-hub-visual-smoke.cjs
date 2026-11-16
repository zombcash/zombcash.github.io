'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE_URL = process.env.SITE_URL || 'http://127.0.0.1:4173/';
const RESULTS_DIR = path.join(process.cwd(), 'survivor-hub-visual-results');
const LOCALES = ['en', 'de', 'fr', 'it', 'ja', 'zh-CN', 'ru', 'tr', 'hi'];
const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1600, height: 1000 },
];
const VISUAL_CASES = [
  ...LOCALES.map(locale => ({ locale, viewport: VIEWPORTS[0] })),
  ...['en', 'ru', 'ja'].flatMap(locale =>
    VIEWPORTS.slice(1).map(viewport => ({ locale, viewport })),
  ),
];

function pagePath(locale) {
  return locale === 'en' ? 'survivor-hub.html' : locale + '/survivor-hub.html';
}

(async () => {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const { locale, viewport } of VISUAL_CASES) {
        const page = await browser.newPage({ viewport });
        const pageErrors = [];
        page.on('pageerror', error => pageErrors.push(error.message));

        await page.route('https://zombcash-bot.fadehost.app/**', route => {
          const url = new URL(route.request().url());
          if (url.pathname.endsWith('/api/survivors/leaderboard')) {
            return route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ leaderboard: [], totalSurvivors: 0, totalPoints: 0 }),
            });
          }
          return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
        });

        await page.goto(new URL(pagePath(locale), BASE_URL).href, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await page.waitForSelector('header.zombcash-shared-header', { timeout: 10000 });
        await page.waitForSelector('header.zombcash-shared-header .language-trigger', { timeout: 10000 });
        await page.waitForFunction(code => document.documentElement.lang === code, locale, { timeout: 10000 });

        const layout = await page.evaluate(() => {
          const header = document.querySelector('header.zombcash-shared-header');
          const actions = header?.querySelector('.zsh-actions');
          const nav = header?.querySelector('.zsh-nav');
          const toggle = header?.querySelector('.zsh-menu-toggle');
          const home = header?.querySelector('.zsh-home');
          const language = header?.querySelector('.language-trigger');
          const login = header?.querySelector('.zsh-login-button');
          const main = document.querySelector('#survivor-hub');
          const rect = element => {
            if (!element) return null;
            const r = element.getBoundingClientRect();
            return { left: r.left, right: r.right, width: r.width, height: r.height };
          };
          return {
            language: document.documentElement.lang,
            viewportWidth: window.innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            bodyWidth: document.body.scrollWidth,
            header: rect(header),
            actions: rect(actions),
            navDisplay: nav ? getComputedStyle(nav).display : 'missing',
            toggleDisplay: toggle ? getComputedStyle(toggle).display : 'missing',
            home: rect(home),
            languageButton: rect(language),
            login: rect(login),
            main: rect(main),
            hasLeaderboard: !!document.querySelector('#leaderboard'),
            hasHeading: !!document.querySelector('#survivor-hub h1'),
          };
        });

        assert.equal(layout.language, locale, locale + ' document language mismatch at ' + viewport.width + 'px');
        assert.ok(layout.header && layout.header.height > 0, locale + ' shared header is missing');
        assert.ok(layout.actions && layout.actions.width > 0, locale + ' header actions are missing');
        assert.ok(layout.home && layout.home.width > 0, locale + ' Back to Home control is missing');
        assert.ok(layout.languageButton && layout.languageButton.width > 0, locale + ' language selector is missing');
        assert.ok(layout.login && layout.login.width > 0, locale + ' registration/login control is missing');
        assert.ok(layout.main && layout.main.width > 0, locale + ' Hub content is missing');
        assert.ok(layout.hasLeaderboard && layout.hasHeading, locale + ' Hub content is incomplete');
        assert.ok(layout.documentWidth <= viewport.width + 1, locale + ' has horizontal document overflow at ' + viewport.width + 'px');
        assert.ok(layout.bodyWidth <= viewport.width + 1, locale + ' body overflows at ' + viewport.width + 'px');
        assert.ok(layout.header.right <= viewport.width + 1, locale + ' header overflows at ' + viewport.width + 'px');
        assert.ok(layout.actions.right <= viewport.width + 1, locale + ' header actions overflow at ' + viewport.width + 'px');

        if (viewport.width <= 1450) {
          const toggle = page.locator('header.zombcash-shared-header .zsh-menu-toggle');
          assert.ok(await toggle.isVisible(), locale + ' mobile navigation toggle is not visible');
          await toggle.click();
          await page.waitForFunction(() => document.querySelector('.zsh-nav')?.classList.contains('zsh-open'));
          assert.equal(await toggle.getAttribute('aria-expanded'), 'true', locale + ' menu toggle did not expose expanded state');
          await toggle.click();
          await page.waitForFunction(() => !document.querySelector('.zsh-nav')?.classList.contains('zsh-open'));
        } else {
          assert.equal(layout.navDisplay, 'flex', locale + ' desktop navigation is not visible');
          assert.ok(layout.login.right >= layout.languageButton.right - 1, locale + ' registration control is not the rightmost action');
          assert.ok(layout.languageButton.right >= layout.home.right - 1, locale + ' language selector is not to the right of Back to Home');
        }

        const languageTrigger = page.locator('header.zombcash-shared-header .language-trigger');
        await languageTrigger.click();
        assert.ok(await page.locator('.language-menu').isVisible(), locale + ' language menu did not open');
        assert.ok(await page.locator('.language-option[data-lang="ru"]').isVisible(), locale + ' language menu is missing Russian');
        const menuRect = await page.locator('.language-menu').evaluate(element => {
          const rect = element.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            width: rect.width,
            innerWidth: window.innerWidth,
            position: getComputedStyle(element).position,
          };
        });
        if (viewport.width === 360) {
          await page.screenshot({
            path: path.join(RESULTS_DIR, locale + '-' + viewport.width + '-language-menu.png'),
            fullPage: true,
          });
        }
        assert.ok(menuRect.left >= -1 && menuRect.right <= viewport.width + 1,
          locale + ' language menu overflows at ' + viewport.width + 'px: ' + JSON.stringify(menuRect));
        await languageTrigger.click();

        await page.screenshot({
          path: path.join(RESULTS_DIR, locale + '-' + viewport.width + 'px.png'),
          fullPage: true,
        });
        assert.deepEqual(pageErrors, [], locale + ' produced browser JavaScript errors at ' + viewport.width + 'px');
        console.log('PASS: Survivor Hub browser layout/navigation ' + locale + ' @ ' + viewport.width + 'px');
        await page.close();
    }

    const switchPage = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await switchPage.route('https://zombcash-bot.fadehost.app/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"leaderboard":[],"totalSurvivors":0,"totalPoints":0}' }),
    );
    await switchPage.goto(new URL('survivor-hub.html', BASE_URL).href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await switchPage.waitForSelector('.language-trigger', { timeout: 10000 });
    await switchPage.locator('.language-trigger').click();
    await switchPage.locator('.language-option[data-lang="de"]').click();
    await switchPage.waitForURL(url => url.pathname === '/de/survivor-hub.html', { timeout: 10000 });
    await switchPage.waitForFunction(() => document.documentElement.lang === 'de', null, { timeout: 10000 });
    console.log('PASS: Survivor Hub language selector navigates to the dedicated German page');
    await switchPage.close();
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

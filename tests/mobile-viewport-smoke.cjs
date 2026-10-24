const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE_URL = process.env.SITE_URL || 'https://zombcash.github.io/';
const widths = [390, 375, 430];
const outDir = path.join(process.cwd(), 'mobile-test-results');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  try {
    for (const width of widths) {
      const page = await browser.newPage({
        viewport: { width, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      });
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));

      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForSelector('header.zombcash-shared-header', { timeout: 20000 });

      const result = await page.evaluate(() => {
        const header = document.querySelector('header.zombcash-shared-header');
        const menuButton = header?.querySelector('.zsh-menu-toggle');
        const nav = header?.querySelector('.zsh-nav');
        const languageButton = header?.querySelector('.language-trigger');
        const languageMenu = header?.querySelector('.language-menu');
        const rect = element => {
          if (!element) return null;
          const r = element.getBoundingClientRect();
          return { x: Math.round(r.x), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) };
        };
        return {
          viewportWidth: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          header: rect(header),
          menuButton: { visible: !!menuButton && getComputedStyle(menuButton).display !== 'none', rect: rect(menuButton) },
          navInitiallyClosed: !!nav && !nav.classList.contains('zsh-open'),
          languageButton: { exists: !!languageButton, rect: rect(languageButton) },
          languageMenuExists: !!languageMenu,
          languageMenuRect: rect(languageMenu),
        };
      });

      const issues = [];
      if (result.documentWidth > width + 1) issues.push(`horizontal overflow: document width ${result.documentWidth}px at viewport ${width}px`);
      if (!result.menuButton.visible) issues.push('mobile menu button is not visible');
      if (!result.navInitiallyClosed) issues.push('navigation is not collapsed by default');
      if (!result.languageButton.exists) issues.push('language selector button is missing');

      if (result.menuButton.visible) {
        await page.locator('header.zombcash-shared-header .zsh-menu-toggle').click();
        const expanded = await page.locator('header.zombcash-shared-header .zsh-nav').evaluate(el => el.classList.contains('zsh-open'));
        if (!expanded) issues.push('menu button did not open navigation');
        await page.screenshot({ path: path.join(outDir, `viewport-${width}-menu.png`), fullPage: false });
      }

      if (result.languageButton.exists) {
        await page.locator('header.zombcash-shared-header .language-trigger').click();
        const menuShown = await page.locator('header.zombcash-shared-header .language-menu').isVisible().catch(() => false);
        if (!menuShown) issues.push('language dropdown did not become visible after click');
        await page.screenshot({ path: path.join(outDir, `viewport-${width}-languages.png`), fullPage: false });
      }

      if (pageErrors.length) issues.push('browser JavaScript errors: ' + pageErrors.join(' | '));
      const report = { width, result, issues, pageErrors };
      fs.writeFileSync(path.join(outDir, `viewport-${width}.json`), JSON.stringify(report, null, 2));
      console.log(JSON.stringify(report, null, 2));
      if (issues.length) failures.push({ width, issues });
      await page.close();
    }
  } finally {
    await browser.close();
  }

  if (failures.length) {
    console.error('Mobile viewport smoke test failed:', JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  } else {
    console.log('All mobile viewport smoke tests passed for: ' + widths.join(', ') + 'px');
  }
})();

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
  const out = path.join(process.cwd(), 'ai-worlds-visual-results');
  fs.mkdirSync(out, { recursive: true });
  await page.locator('#zombcash-outbreak-world').screenshot({ path: path.join(out, 'arcade-ai-worlds.png') });
  if (errors.length) throw new Error('Arcade page errors: ' + errors.join('; '));
  console.log('Actual Arcade page passed: MCP link, local match, locale switch. Screenshot saved.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });

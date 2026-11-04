const { chromium } = require("playwright");
const assert = require("node:assert/strict");

const baseUrl = process.env.SITE_URL || "http://127.0.0.1:4173/";
const widths = [320, 360, 390, 430, 768, 1024, 1440];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  try {
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
      await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForFunction(() => {
        const stage = document.querySelector(".zc-hero-ad-stage");
        return stage && stage.getBoundingClientRect().width > 0 && stage.getBoundingClientRect().height > 0;
      }, { timeout: 15000 });

      const result = await page.evaluate(() => {
        const stage = document.querySelector(".zc-hero-ad-stage");
        const unit = document.querySelector(".zc-hero-ad-unit");
        const sr = stage.getBoundingClientRect();
        const ur = unit.getBoundingClientRect();
        const options = window.atOptions || {};
        return {
          viewport: window.innerWidth,
          document: document.documentElement.scrollWidth,
          stage: { width: sr.width, height: sr.height, x: sr.x, right: sr.right },
          unit: { width: ur.width, height: ur.height, x: ur.x, right: ur.right },
          expected: { width: Number(options.width), height: Number(options.height) }
        };
      });

      const issues = [];
      const expectedRatio = result.expected.width / result.expected.height;
      const actualRatio = result.stage.width / result.stage.height;
      if (!Number.isFinite(expectedRatio) || !Number.isFinite(actualRatio) ||
          Math.abs(actualRatio - expectedRatio) > 0.04) {
        issues.push(`reserved slot ratio ${actualRatio.toFixed(3)} does not match native ${expectedRatio.toFixed(3)}`);
      }
      if (result.document > width + 1) issues.push(`horizontal overflow: document ${result.document}px > viewport ${width}px`);
      if (result.stage.width > width + 1) issues.push(`slot width ${result.stage.width}px exceeds viewport`);
      if (Math.abs(result.unit.width - result.stage.width) > 2 ||
          Math.abs(result.unit.height - result.stage.height) > 2) {
        issues.push("scaled banner and reserved stage dimensions differ");
      }
      if (result.unit.x < result.stage.x - 1 || result.unit.right > result.stage.right + 1) {
        issues.push("scaled banner escapes reserved stage");
      }
      console.log(JSON.stringify({ width, result, issues }));
      if (issues.length) failures.push({ width, issues });
      await page.close();
    }
  } finally {
    await browser.close();
  }
  assert.equal(failures.length, 0, JSON.stringify(failures, null, 2));
  console.log("Responsive Adsterra geometry smoke passed at all viewport widths.");
})().catch(error => { console.error(error); process.exit(1); });

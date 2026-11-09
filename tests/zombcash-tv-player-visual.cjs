const { chromium } = require("playwright");
const assert = require("node:assert/strict");

const base = process.env.SITE_URL || "http://127.0.0.1:4173";
const locales = [
  ["en", "ZOMBCASH TV — LIVE FROM THE OUTBREAK"],
  ["de", "ZOMBCASH TV — LIVE AUS DEM AUSBRUCHSGEBIET"],
  ["fr", "ZOMBCASH TV — EN DIRECT DE L’ÉPIDÉMIE"],
  ["it", "ZOMBCASH TV — IN DIRETTA DALL’EPIDEMIA"],
  ["ja", "ZOMBCASH TV — アウトブレイク現場から生中継"],
  ["zh-CN", "ZOMBCASH TV — 疫情前线直播"],
  ["ru", "ZOMBCASH TV — ПРЯМОЙ ЭФИР ИЗ ЗОНЫ ВСПЫШКИ"],
  ["tr", "ZOMBCASH TV — SALGIN BÖLGESİNDEN CANLI"],
  ["hi", "ZOMBCASH TV — प्रकोप क्षेत्र से सीधा प्रसारण"]
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [locale, expectedTitle] of locales) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await page.route("https://zombcash-bot.fadehost.app/api/tv/episodes**", route =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            episodes: [{
              episode_id: "123e4567-e89b-12d3-a456-426614174000",
              title: "TV visual QA episode",
              description: "Mock episode for layout and interaction checks.",
              created_at: 1794268800,
              duration_seconds: 42
            }],
            page: 1, per_page: 8, total: 1, total_pages: 1
          })
        })
      );
      await page.route("https://zombcash-bot.fadehost.app/api/tv/episodes/*/video", route =>
        route.fulfill({ status: 200, contentType: "video/mp4", body: Buffer.from([]) })
      );
      const path = locale === "en" ? "/outbreak-transmission.html" : "/" + locale + "/outbreak-transmission.html";
      await page.goto(base + path, { waitUntil: "domcontentloaded" });
      await page.locator("#zombcash-tv").waitFor({ state: "visible" });
      await page.waitForFunction(expected => document.querySelector("#zctv-title")?.textContent?.trim() === expected, expectedTitle);
      assert.equal((await page.locator("#zctv-title").textContent()).trim(), expectedTitle, "localized title: " + locale);
      await page.getByRole("button", { name: "TV visual QA episode" }).waitFor({ state: "visible" });
      await page.getByRole("button", { name: "TV visual QA episode" }).click();
      const src = await page.locator("#zombcash-tv video").getAttribute("src");
      assert.ok(src && src.includes("/api/tv/episodes/123e4567-e89b-12d3-a456-426614174000/video"), "episode selection: " + locale);
      const ratio = await page.locator(".zctv-screen").evaluate(el => {
        const box = el.getBoundingClientRect();
        return box.width / box.height;
      });
      assert.ok(Math.abs(ratio - 16 / 9) < 0.08, "16:9 player ratio: " + locale);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(100);
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(100);
      await page.setViewportSize({ width: 320, height: 740 });
      await page.waitForTimeout(100);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      assert.equal(overflow, false, "no horizontal overflow at 320px: " + locale);
      await page.close();
      console.log("PASS " + locale);
    }
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

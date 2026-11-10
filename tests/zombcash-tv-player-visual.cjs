const { chromium } = require("playwright");
const assert = require("node:assert/strict");

const base = process.env.SITE_URL || "http://127.0.0.1:4173";
const locales = [
  ["en", "ZOMBCASH TV — LIVE FROM THE OUTBREAK", "Choose an episode from the archive.", "ARCHIVE ONLINE · AWAITING FIRST TRANSMISSION"],
  ["de", "ZOMBCASH TV — LIVE AUS DEM AUSBRUCHSGEBIET", "Wähle eine Folge aus dem Archiv.", "ARCHIV ONLINE · ERSTE ÜBERTRAGUNG AUSSTEHEND"],
  ["fr", "ZOMBCASH TV — EN DIRECT DE L’ÉPIDÉMIE", "Choisissez un épisode dans les archives.", "ARCHIVES EN LIGNE · EN ATTENTE DE LA PREMIÈRE TRANSMISSION"],
  ["it", "ZOMBCASH TV — IN DIRETTA DALL’EPIDEMIA", "Scegli un episodio dall’archivio.", "ARCHIVIO ONLINE · IN ATTESA DELLA PRIMA TRASMISSIONE"],
  ["ja", "ZOMBCASH TV — アウトブレイク現場から生中継", "アーカイブからエピソードを選択してください。", "アーカイブ稼働中 · 初回配信待ち"],
  ["zh-CN", "ZOMBCASH TV — 疫情前线直播", "从档案中选择一期节目。", "档案已上线 · 等待首期节目"],
  ["ru", "ZOMBCASH TV — ПРЯМОЙ ЭФИР ИЗ ЗОНЫ ВСПЫШКИ", "Выберите выпуск из архива.", "АРХИВ ДОСТУПЕН · ОЖИДАЕТСЯ ПЕРВЫЙ ВЫПУСК"],
  ["tr", "ZOMBCASH TV — SALGIN BÖLGESİNDEN CANLI", "Arşivden bir bölüm seç.", "ARŞİV ÇEVRİMİÇİ · İLK YAYIN BEKLENİYOR"],
  ["hi", "ZOMBCASH TV — प्रकोप क्षेत्र से सीधा प्रसारण", "संग्रह से एक एपिसोड चुनें।", "संग्रह ऑनलाइन · पहले प्रसारण की प्रतीक्षा"]
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [locale, expectedTitle, expectedChoose, expectedStatus] of locales) {
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
      assert.equal(await page.locator("#zombcash-tv video").evaluate(el => el.controls), true, "native accessible video controls: " + locale);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(100);
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(100);
      await page.setViewportSize({ width: 320, height: 740 });
      await page.waitForTimeout(100);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      assert.equal(overflow, false, "no horizontal overflow at 320px: " + locale);
      await page.close();

      // Empty archive state must be localized and must leave the connecting state.
      const emptyPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await emptyPage.route("https://zombcash-bot.fadehost.app/api/tv/episodes**", route =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ episodes: [], page: 1, per_page: 8, total: 0, total_pages: 0 })
        })
      );
      await emptyPage.goto(base + path, { waitUntil: "domcontentloaded" });
      await emptyPage.waitForFunction(({ status, title }) =>
        document.querySelector("#zombcash-tv .zctv-status")?.textContent?.trim() === status &&
        document.querySelector("#zombcash-tv .zctv-current-title")?.textContent?.trim() === title,
        { status: expectedStatus, title: expectedChoose },
        { timeout: 10000 }
      );
      assert.equal((await emptyPage.locator(".zctv-current-title").textContent()).trim(), expectedChoose, "localized empty-state prompt: " + locale);
      assert.equal((await emptyPage.locator(".zctv-status").textContent()).trim(), expectedStatus, "localized empty-archive status: " + locale);
      assert.equal(await emptyPage.locator(".zctv-screen-empty").isVisible(), true, "empty-state screen remains visible: " + locale);
      assert.equal(await emptyPage.locator(".zctv-episode").count(), 0, "empty archive has no episode cards: " + locale);
      await emptyPage.close();
      console.log("PASS " + locale + " + empty state");
    }
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

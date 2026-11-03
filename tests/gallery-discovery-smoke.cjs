const { chromium } = require("playwright");
const { spawn } = require("child_process");

(async () => {
  const server = spawn("python3", ["-m", "http.server", "4173", "--bind", "127.0.0.1"], { stdio: "ignore", cwd: process.cwd() });
  let browser;
  try {
    await new Promise((resolve, reject) => {
      const started = Date.now();
      const timer = setInterval(async () => {
        try {
          const response = await fetch("http://127.0.0.1:4173/gallery.html");
          if (response.ok) { clearInterval(timer); resolve(); }
        } catch (_) {
          if (Date.now() - started > 15000) { clearInterval(timer); reject(new Error("Local static server did not start")); }
        }
      }, 250);
    });
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.route("https://**/*", route => route.abort());
    await page.route("https://zombcash-bot.fadehost.app/api/gallery/likes?*", async route => {
      const url = new URL(route.request().url());
      const ids = (url.searchParams.get("ids") || "").split(",").filter(Boolean);
      const stats = ids.map(image_id => ({
        image_id,
        like_count: image_id === "ZOMBCASH/3583:0" ? 100 : (image_id === "ZOMBCASH/4102:0" ? 10 : 0),
        liked: false
      }));
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ stats }) });
    });
    await page.goto("http://127.0.0.1:4173/gallery.html", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".gallery-toolbar");
    await page.waitForFunction(() => document.querySelectorAll("#gallery-grid .gallery-card").length === 50);
    await page.waitForFunction(() => typeof window.ZombieCashTrack === "function");
    await page.evaluate(() => {
      window.__galleryEvents = [];
      const originalTrack = window.ZombieCashTrack;
      window.ZombieCashTrack = (event, target) => {
        window.__galleryEvents.push({ event, target });
        originalTrack(event, target);
      };
    });
    const initial = await page.locator("#gallery-grid .gallery-card").count();
    if (initial !== 50) throw new Error("Expected 50 gallery cards, got " + initial);
    const likeButtons = await page.locator("#gallery-grid .gallery-like-button").count();
    if (likeButtons !== 50) throw new Error("Expected 50 card like controls, got " + likeButtons);
    await page.locator("#gallery-grid .gallery-card").first().click({ position: { x: 20, y: 20 } });
    await page.waitForSelector(".gallery-lightbox.is-open .gallery-lightbox-like");
    const openTracked = await page.evaluate(() => window.__galleryEvents.some(item => item.event === "gallery_image_open"));
    if (!openTracked) throw new Error("Gallery image open analytics event was not recorded");
    const detailDescription = await page.locator(".gallery-lightbox-description").textContent();
    if (!detailDescription) throw new Error("Lightbox should include the editorial description");
    await page.locator(".gallery-lightbox-close").click();
    await page.getByRole("button", { name: "Nightmare & Horror" }).click();
    const filterTracked = await page.evaluate(() => window.__galleryEvents.some(item => item.event === "gallery_filter"));
    if (!filterTracked) throw new Error("Gallery filter analytics event was not recorded");
    const horror = await page.locator("#gallery-grid .gallery-card").count();
    if (horror !== 16) throw new Error("Nightmare filter expected 16 cards, got " + horror);
    await page.locator(".gallery-search").fill("goldfish");
    const searchTracked = await page.evaluate(() => window.__galleryEvents.some(item => item.event === "gallery_search"));
    if (!searchTracked) throw new Error("Gallery search analytics event was not recorded");
    const search = await page.locator("#gallery-grid .gallery-card").count();
    if (search !== 0) throw new Error("Search should hide non-matching horror items, got " + search);
    await page.locator(".gallery-reset").click();
    const resetTracked = await page.evaluate(() => window.__galleryEvents.some(item => item.event === "gallery_filter_reset"));
    if (!resetTracked) throw new Error("Gallery reset analytics event was not recorded");
    const reset = await page.locator("#gallery-grid .gallery-card").count();
    if (reset !== 50) throw new Error("Clear filters should restore 50 cards, got " + reset);
    if (await page.locator("#gallery-grid .gallery-like-button").count() !== 50) throw new Error("Clear filters should restore like controls");
    await page.locator(".gallery-search").fill("goldfish");
    const matching = await page.locator("#gallery-grid .gallery-card").count();
    if (matching !== 1) throw new Error("Search expected one goldfish caption, got " + matching);
    await page.locator(".gallery-reset").click();
    await page.locator(".gallery-sort").selectOption("oldest");
    const oldestFirst = await page.locator("#gallery-grid .gallery-card").first().getAttribute("data-gallery-id");
    if (!oldestFirst) throw new Error("Sorted cards must retain stable image IDs");
    await page.locator(".gallery-sort").selectOption("liked");
    if (await page.locator("#gallery-grid .gallery-card").count() !== 50) throw new Error("Most-liked sort should preserve all gallery cards");
    const mostLikedFirst = await page.locator("#gallery-grid .gallery-card").first().getAttribute("data-gallery-id");
    if (mostLikedFirst !== "ZOMBCASH/3583:0") throw new Error("Most-liked sort did not rank the highest-count image first: " + mostLikedFirst);
    const sortTracked = await page.evaluate(() => window.__galleryEvents.some(item => item.event === "gallery_sort"));
    if (!sortTracked) throw new Error("Gallery sort analytics event was not recorded");
    await page.evaluate(() => {
      document.documentElement.lang = "ja";
      document.dispatchEvent(new CustomEvent("zombcash:languagechange", { detail: { language: "ja" } }));
    });
    const japaneseFilter = await page.getByRole("button", { name: "悪夢とホラー" }).count();
    if (japaneseFilter !== 1) throw new Error("Japanese category label did not render");
    const mobile = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 });
    await mobile.route("https://**/*", route => route.abort());
    await mobile.goto("http://127.0.0.1:4173/gallery.html", { waitUntil: "domcontentloaded" });
    await mobile.waitForSelector(".gallery-toolbar");
    await mobile.waitForFunction(() => document.querySelectorAll("#gallery-grid .gallery-card").length === 50);
    const overflow = await mobile.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
      toolbar: document.querySelector(".gallery-toolbar").scrollWidth,
      toolbarClient: document.querySelector(".gallery-toolbar").clientWidth
    }));
    if (overflow.page > overflow.viewport + 1) throw new Error("Mobile page has horizontal overflow: " + JSON.stringify(overflow));
    if (overflow.toolbar > overflow.toolbarClient + 1) throw new Error("Gallery toolbar overflows horizontally: " + JSON.stringify(overflow));
    const russian = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await russian.route("https://**/*", route => route.abort());
    await russian.goto("http://127.0.0.1:4173/ru/gallery.html", { waitUntil: "domcontentloaded" });
    await russian.waitForSelector(".gallery-toolbar");
    await russian.waitForFunction(() => document.querySelectorAll("#gallery-grid .gallery-card").length === 50);
    const russianLang = await russian.locator("html").getAttribute("lang");
    if (russianLang !== "ru") throw new Error("Russian gallery html lang is incorrect");
    const russianCanonical = await russian.locator('link[rel="canonical"]').getAttribute("href");
    if (russianCanonical !== "https://zombcash.github.io/ru/gallery.html") throw new Error("Russian gallery canonical is incorrect");
    if (await russian.getByRole("button", { name: "Кошмары и хоррор" }).count() !== 1) throw new Error("Russian category labels did not render");
    if (!(await russian.locator(".gallery-search").getAttribute("placeholder")).includes("Поиск")) throw new Error("Russian gallery search placeholder did not render");
    await russian.close();

    await mobile.screenshot({ path: "gallery-mobile-smoke.png", fullPage: true });
    await page.screenshot({ path: "gallery-desktop-smoke.png", fullPage: true });
    console.log(JSON.stringify({ status: "passed", initial, horror, search, reset, matching, oldestFirst, japaneseFilter, mobile: overflow }));
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

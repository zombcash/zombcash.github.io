const { chromium } = require("playwright");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const galleryData = JSON.parse(fs.readFileSync("gallery-data.json", "utf8"));
const imageIdByUrl = new Map(galleryData.items.map(item => [item.image, item.id]));

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
    await page.route("https://cdn4.telesco.pe/file/**", route => route.continue());
    fs.mkdirSync("gallery-visual-audit/images", { recursive: true });
    const imageNetworkEvents = [];
    const imageResponseTasks = [];
    page.on("response", response => {
      const url = response.url();
      if (!url.includes("cdn4.telesco.pe/file/")) return;
      if (response.status() >= 400) {
        imageNetworkEvents.push({ type: "http-error", status: response.status(), url });
        return;
      }
      const imageId = imageIdByUrl.get(url);
      if (imageId && response.status() === 200) {
        imageResponseTasks.push((async () => {
          try {
            const body = await response.body();
            const safeId = imageId.replace(/[^a-zA-Z0-9_-]/g, "_");
            fs.writeFileSync(path.join("gallery-visual-audit", "images", safeId + ".jpg"), body);
          } catch (error) {
            imageNetworkEvents.push({ type: "body-read-failed", error: String(error), url });
          }
        })());
      }
    });
    page.on("requestfailed", request => {
      if (request.url().includes("cdn4.telesco.pe/file/")) {
        imageNetworkEvents.push({ type: "request-failed", error: request.failure()?.errorText || "unknown", url: request.url() });
      }
    });
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
    await page.locator("#gallery-grid img").evaluateAll(images => images.forEach(image => { image.loading = "eager"; }));
    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll("#gallery-grid img"));
      await Promise.all(images.map(image => new Promise(resolve => {
        if (image.complete) return resolve();
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
        setTimeout(resolve, 15000);
      })));
    });
    const imageLoadAudit = await page.locator("#gallery-grid img").evaluateAll(images => ({
      total: images.length,
      originalLoaded: images.filter(image => !image.dataset.fallbackApplied && image.naturalWidth > 0).length,
      fallbacks: images.filter(image => image.dataset.fallbackApplied).length
    }));
    await page.screenshot({ path: "gallery-desktop-smoke.png", fullPage: true });
    await Promise.all(imageResponseTasks);
    const recoveryChecks = [];
    for (const event of imageNetworkEvents.filter(item => item.type === "request-failed")) {
      try {
        const response = await page.request.get(event.url, { timeout: 12000 });
        const body = await response.body();
        recoveryChecks.push({
          url: event.url,
          status: response.status(),
          contentType: response.headers()["content-type"] || "",
          bytes: body.length
        });
      } catch (error) {
        recoveryChecks.push({ url: event.url, error: String(error) });
      }
    }
    const visualAudit = [];
    for (const card of await page.locator("#gallery-grid .gallery-card").all()) {
      const image = card.locator("img");
      const details = await card.evaluate(element => {
        const img = element.querySelector("img");
        return {
          id: element.dataset.galleryId || "",
          title: element.dataset.galleryTitle || "",
          src: img?.dataset.originalSrc || img?.currentSrc || img?.src || "",
          alt: img?.dataset.originalAlt || img?.alt || "",
          naturalWidth: img?.naturalWidth || 0,
          naturalHeight: img?.naturalHeight || 0,
          fallbackApplied: Boolean(img?.dataset.fallbackApplied)
        };
      });
      const safeId = details.id.replace(/[^a-zA-Z0-9_-]/g, "_");
      if (details.fallbackApplied || details.naturalWidth === 0) {
        details.screenshot = "images/" + safeId + ".png";
        await image.screenshot({ path: path.join("gallery-visual-audit", details.screenshot) });
      }
      details.sourceFile = fs.existsSync(path.join("gallery-visual-audit", "images", safeId + ".jpg"))
        ? "images/" + safeId + ".jpg"
        : (details.screenshot || null);
      visualAudit.push(details);
    }
    fs.writeFileSync("gallery-visual-audit/report.json", JSON.stringify({
      generatedAt: new Date().toISOString(),
      total: visualAudit.length,
      loaded: visualAudit.filter(item => item.naturalWidth > 0 && !item.fallbackApplied).length,
      fallback: visualAudit.filter(item => item.fallbackApplied).length,
      failed: visualAudit.filter(item => item.naturalWidth === 0),
      networkEvents: imageNetworkEvents,
      recoveryChecks,
      images: visualAudit
    }, null, 2) + "\n");
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
    await page.evaluate(() => {
      window.__sharedPayload = null;
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async payload => { window.__sharedPayload = payload; }
      });
    });
    await page.screenshot({ path: "gallery-lightbox-smoke.png" });
    await page.locator(".gallery-lightbox-share").click();
    await page.waitForFunction(() => Boolean(window.__sharedPayload));
    const sharedPayload = await page.evaluate(() => window.__sharedPayload);
    if (!sharedPayload.url.includes("#gallery-image-")) throw new Error("Gallery share URL must use the stable image anchor");
    await page.waitForFunction(() => window.__galleryEvents.some(item => item.event === "gallery_share"));
    await page.locator(".gallery-lightbox-close").click();
    await page.getByRole("button", { name: "Nightmare & Horror" }).click();
    const filterTracked = await page.evaluate(() => window.__galleryEvents.some(item => item.event === "gallery_filter"));
    if (!filterTracked) throw new Error("Gallery filter analytics event was not recorded");
    const horror = await page.locator("#gallery-grid .gallery-card").count();
    if (horror !== 16) throw new Error("Nightmare filter expected 16 cards, got " + horror);
    await page.locator(".gallery-search").fill("goldfish");
    await page.locator(".gallery-search").press("Tab");
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
    await page.getByRole("button", { name: "Zombie Characters" }).click();
    const zombieCharacters = await page.locator("#gallery-grid .gallery-card").count();
    if (zombieCharacters !== 17) throw new Error("Zombie Characters filter should show 17 visually classified items, got " + zombieCharacters);
    await page.getByRole("button", { name: "Apocalypse & Survival" }).click();
    const apocalypseSurvival = await page.locator("#gallery-grid .gallery-card").count();
    if (apocalypseSurvival !== 3) throw new Error("Apocalypse & Survival filter should show 3 visually classified items, got " + apocalypseSurvival);
    await page.locator(".gallery-reset").click();
    const categoryReset = await page.locator("#gallery-grid .gallery-card").count();
    if (categoryReset !== 50) throw new Error("Reset after taxonomy filters should restore all 50 images");
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
    await mobile.route("https://cdn4.telesco.pe/file/**", route => route.continue());
    await mobile.goto("http://127.0.0.1:4173/gallery.html", { waitUntil: "domcontentloaded" });
    await mobile.waitForSelector(".gallery-toolbar");
    await mobile.waitForFunction(() => document.querySelectorAll("#gallery-grid .gallery-card").length === 50);
    await mobile.locator("#gallery-grid img").evaluateAll(images => images.forEach(image => { image.loading = "eager"; }));
    await mobile.evaluate(async () => {
      const images = Array.from(document.querySelectorAll("#gallery-grid img"));
      await Promise.all(images.map(image => new Promise(resolve => {
        if (image.complete) return resolve();
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
        setTimeout(resolve, 15000);
      })));
    });
    await mobile.screenshot({ path: "gallery-mobile-smoke.png", fullPage: true });
    const overflow = await mobile.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
      toolbar: document.querySelector(".gallery-toolbar").scrollWidth,
      toolbarClient: document.querySelector(".gallery-toolbar").clientWidth
    }));
    const mobileGalleryLayout = await mobile.locator(".gallery-scroll-panel").evaluate(panel => ({
      overflowY: getComputedStyle(panel).overflowY,
      height: panel.clientHeight,
      scrollHeight: panel.scrollHeight,
      columns: getComputedStyle(document.querySelector("#gallery-grid")).columnCount
    }));
    if (mobileGalleryLayout.overflowY !== "visible") throw new Error("Mobile gallery should use natural page scrolling");
    if (mobileGalleryLayout.columns !== "2") throw new Error("Mobile gallery should render two compact columns");
    if (overflow.page > overflow.viewport + 1) throw new Error("Mobile page has horizontal overflow: " + JSON.stringify(overflow));
    if (overflow.toolbar > overflow.toolbarClient + 1) throw new Error("Gallery toolbar overflows horizontally: " + JSON.stringify(overflow));
    await mobile.locator("#gallery-grid .gallery-card").first().click();
    const mobileShare = mobile.locator(".gallery-lightbox-share");
    await mobileShare.waitFor();
    const mobileShareBox = await mobileShare.boundingBox();
    const mobileSharePosition = await mobileShare.evaluate(element => getComputedStyle(element).position);
    if (!mobileShareBox || mobileShareBox.x < 0 || mobileShareBox.x + mobileShareBox.width > 375) throw new Error("Mobile lightbox share control overflows the viewport");
    if (mobileSharePosition !== "static") throw new Error("Mobile lightbox share control must stay in the caption flow");
    await mobile.screenshot({ path: "gallery-lightbox-mobile-smoke.png" });
    await mobile.locator(".gallery-lightbox-close").click();
    const russian = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await russian.route("https://**/*", route => route.abort());
    await russian.route("https://cdn4.telesco.pe/file/**", route => route.continue());
    await russian.goto("http://127.0.0.1:4173/ru/gallery.html", { waitUntil: "domcontentloaded" });
    await russian.waitForSelector(".gallery-toolbar");
    await russian.waitForFunction(() => document.querySelectorAll("#gallery-grid .gallery-card").length === 50);
    await russian.screenshot({ path: "gallery-russian-smoke.png", fullPage: true });
    const russianLang = await russian.locator("html").getAttribute("lang");
    if (russianLang !== "ru") throw new Error("Russian gallery html lang is incorrect");
    const russianCanonical = await russian.locator('link[rel="canonical"]').getAttribute("href");
    if (russianCanonical !== "https://zombcash.github.io/ru/gallery.html") throw new Error("Russian gallery canonical is incorrect");
    if (await russian.getByRole("button", { name: "Кошмары и хоррор" }).count() !== 1) throw new Error("Russian category labels did not render");
    if (!(await russian.locator(".gallery-search").getAttribute("placeholder")).includes("Поиск")) throw new Error("Russian gallery search placeholder did not render");
    await russian.waitForSelector(".language-trigger");
    await russian.locator(".language-trigger").click();
    await russian.locator('.language-option[data-lang="de"]').click();
    await russian.waitForURL(url => url.pathname === "/de/gallery.html");
    if (await russian.locator("html").getAttribute("lang") !== "de") throw new Error("Language switcher failed to route Russian gallery to German");
    await russian.locator(".language-trigger").click();
    await russian.locator('.language-option[data-lang="en"]').click();
    await russian.waitForURL(url => url.pathname === "/gallery.html");
    if (await russian.locator("html").getAttribute("lang") !== "en") throw new Error("Language switcher failed to route German gallery to English");
    await russian.close();

    const localeAudit = [];
    for (const locale of ["de", "fr", "it", "ja", "zh-CN", "ru", "tr", "hi"]) {
      const localized = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await localized.route("https://**/*", route => route.abort());
      await localized.route("https://cdn4.telesco.pe/file/**", route => route.continue());
      await localized.goto("http://127.0.0.1:4173/" + locale + "/gallery.html", { waitUntil: "domcontentloaded" });
      await localized.waitForSelector(".gallery-toolbar");
      await localized.waitForFunction(() => document.querySelectorAll("#gallery-grid .gallery-card").length === 50);
      const lang = await localized.locator("html").getAttribute("lang");
      const canonical = await localized.locator('link[rel="canonical"]').getAttribute("href");
      const alternates = await localized.locator('link[rel="alternate"][hreflang]').count();
      const title = await localized.title();
      const schemaText = await localized.locator("#gallery-collection-jsonld").textContent();
      const schema = JSON.parse(schemaText);
      const controls = await localized.locator(".gallery-category-chip").allTextContents();
      if (lang !== locale) throw new Error(locale + " gallery lang mismatch: " + lang);
      if (canonical !== "https://zombcash.github.io/" + locale + "/gallery.html") throw new Error(locale + " canonical mismatch: " + canonical);
      if (alternates !== 10) throw new Error(locale + " should expose nine hreflang locales plus x-default, got " + alternates);
      if (schema["@type"] !== "CollectionPage" || schema.url !== canonical || schema.inLanguage !== locale) throw new Error(locale + " CollectionPage JSON-LD is invalid");
      if (!title || !title.includes("Zombie") && locale !== "ja" && locale !== "zh-CN" && locale !== "hi") throw new Error(locale + " localized title is missing");
      if (controls.length < 2 || controls.some(label => !label.trim())) throw new Error(locale + " category controls are missing localized labels");
      await localized.locator("#gallery-grid .gallery-card").first().click();
      const shareLabel = (await localized.locator(".gallery-lightbox-share").textContent()).trim();
      if (!shareLabel || shareLabel === "SHARE") throw new Error(locale + " gallery share control is not localized");
      await localized.locator(".gallery-lightbox-close").click();
      localeAudit.push({ locale, lang, alternates, cards: 50, title, shareLabel });
      await localized.close();
    }

    console.log(JSON.stringify({ status: "passed", initial, horror, search, reset, matching, oldestFirst, japaneseFilter, mobile: overflow, imageLoadAudit, imageNetworkEvents, recoveryChecks, localeAudit }));
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

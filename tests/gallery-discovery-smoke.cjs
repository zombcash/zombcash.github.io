const { chromium } = require("playwright");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const galleryData = JSON.parse(fs.readFileSync("gallery-data.json", "utf8"));
const imageIdByUrl = new Map(galleryData.items.map(item => [item.image, item.id]));
const expectedGalleryCount = Math.min(150, galleryData.items.length);
const firstPageItems = galleryData.items.slice(0, expectedGalleryCount);
const installGalleryDataMock = page => page.addInitScript(data => {
  localStorage.setItem("zombcash-survivor-token", "smoke-survivor-session");
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === "string" ? input : (input?.url || "");
    if (url.includes("/gallery-data.json")) {
      return Promise.resolve(new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }));
    }
    return nativeFetch(input, init);
  };
}, galleryData);
if (galleryData.items.some(item => /\bZOMBIECASH\s+SITE\s+SPOTLIGHT\b/i.test(String(item.caption || "")))) throw new Error("SITE SPOTLIGHT promotional cards must be excluded");
if (galleryData.items.some(item => (item.category_ids || []).includes("site-transmissions") || item.series === "site-transmissions" || /\bZOMBIECASH\s+SITE\s+TRANSMISSION\b/i.test(String(item.caption || "")))) throw new Error("Site Transmission screenshots must stay out of the gallery archive");
for (const locale of ["en", "de", "fr", "it", "ja", "zh-CN", "ru", "tr", "hi"]) { const pagePath = locale === "en" ? "gallery.html" : locale + "/gallery.html"; const pageHtml = fs.readFileSync(pagePath, "utf8"); if (/data-categories="site-transmissions"/.test(pageHtml)) throw new Error(locale + " gallery still contains Site Transmission screenshot cards"); }
const targetLikeImageId = galleryData.items[0]?.id || "";
const gallerySearchCorpus = galleryData.items.map(item =>
  [item.title || "", item.description || "", item.caption || "", item.series || "", ...(item.category_ids || []), ...(item.tags || [])].join(" ").toLowerCase()
);
const nonHorrorSearchItem = firstPageItems.find(item => !(item.category_ids || []).includes("nightmare-horror")) || galleryData.items[0];
const searchCandidates = String(nonHorrorSearchItem?.title || "") + " " + String(nonHorrorSearchItem?.caption || "");
const gallerySearchWords = searchCandidates.toLowerCase().match(/[a-z0-9]{6,}/g) || [];
const horrorSearchCorpus = galleryData.items
  .filter(item => (item.category_ids || []).includes("nightmare-horror"))
  .map(item => [item.title || "", item.description || "", item.caption || "", item.series || "", ...(item.category_ids || []), ...(item.tags || [])].join(" ").toLowerCase());
// Choose a real term from a non-horror card that is guaranteed not to match any horror card.
// Falling back to a common word such as "undead" made this assertion nondeterministic.
const gallerySearchTerm = gallerySearchWords.find(word =>
  gallerySearchCorpus.some(text => text.includes(word)) &&
  !horrorSearchCorpus.some(text => text.includes(word))
);
if (!gallerySearchTerm) {
  throw new Error("Could not find a non-horror gallery search term that is absent from the Nightmare & Horror category.");
}
const expectedSearchCount = gallerySearchCorpus.filter(text => text.includes(gallerySearchTerm)).length;

(async () => {
  const server = spawn("python3", ["-m", "http.server", "4173", "--bind", "127.0.0.1"], { stdio: "ignore", cwd: process.cwd() });
  let browser;
  try {
    await new Promise((resolve, reject) => {
      const started = Date.now();
      const timer = setInterval(async () => {
        try {
          const response = await fetch("http://127.0.0.1:4173/gallery.html");
          if (response.ok) { await response.arrayBuffer(); clearInterval(timer); resolve(); }
        } catch (_) {
          if (Date.now() - started > 15000) { clearInterval(timer); reject(new Error("Local static server did not start")); }
        }
      }, 250);
    });
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const likeToggleCalls = [];
    await installGalleryDataMock(page);
    page.on("pageerror", error => console.error("[pageerror]", error.stack || String(error)));
    page.on("console", message => { if (message.type() === "error") console.error("[console]", message.text()); });
    page.on("requestfailed", request => console.error("[requestfailed]", request.url(), request.failure()?.errorText || "unknown"));
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
      const imageId = imageIdByUrl.get(url) || imageIdByUrl.get(url.split("?")[0]);
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
        like_count: image_id === targetLikeImageId ? 100 : (image_id === "ZOMBCASH/4102:0" ? 10 : 0),
        liked: false
      }));
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ stats }) });
    });
    await page.route("https://zombcash-bot.fadehost.app/api/gallery/like", async route => {
      const request = route.request();
      const payload = request.postDataJSON() || {};
      const authorization = request.headers()["authorization"] || "";
      likeToggleCalls.push({ authorization, imageId: payload.imageId, liked: payload.liked });
      if (authorization !== "Bearer smoke-survivor-session" || payload.imageId !== targetLikeImageId || typeof payload.liked !== "boolean") {
        await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false, error: "invalid smoke session or payload" }) });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, stats: { image_id: payload.imageId, like_count: payload.liked ? 101 : 100, liked: payload.liked } })
      });
    });
    await page.goto("http://127.0.0.1:4173/gallery.html", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".gallery-toolbar");
    try {
      await page.waitForFunction(expected => document.querySelectorAll("#gallery-grid .gallery-card").length === expected, expectedGalleryCount, { timeout: 12000 });
    const initialLoadingHints = await page.locator("#gallery-grid img").evaluateAll(images => images.map(image => ({ loading: image.loading, priority: image.fetchPriority })));
    if (initialLoadingHints.length !== expectedGalleryCount ||
        initialLoadingHints.slice(0, 6).some(item => item.loading !== "eager") ||
        initialLoadingHints.slice(6).some(item => item.loading !== "lazy") ||
        initialLoadingHints.slice(0, 2).some(item => item.priority !== "high") ||
        initialLoadingHints.slice(2).some(item => item.priority !== "auto")) {
      throw new Error("The first six gallery images should be eager, the rest lazy; only the first two should have high priority: " + JSON.stringify(initialLoadingHints.slice(0, 8)));
    }
    } catch (error) {
      console.error("[gallery-diagnostics]", await page.evaluate(() => ({
        lang: document.documentElement.lang,
        cardCount: document.querySelectorAll("#gallery-grid .gallery-card").length,
        toolbar: Boolean(document.querySelector(".gallery-toolbar")),
        galleryCount: document.getElementById("gallery-count")?.textContent || "",
        gridText: document.getElementById("gallery-grid")?.textContent?.slice(0, 500) || "",
        scriptSrcs: Array.from(document.scripts).map(script => script.src)
      })));
      throw error;
    }
    await page.waitForFunction(() => typeof window.ZombieCashTrack === "function");
    const imageSampleSize = Math.min(24, expectedGalleryCount);
    await page.locator("#gallery-grid img").evaluateAll((images, sampleSize) => {
      images.slice(0, sampleSize).forEach(image => { image.loading = "eager"; });
    }, imageSampleSize);
    await page.waitForFunction(payload => {
      const images = Array.from(document.querySelectorAll("#gallery-grid img"));
      return images.length === payload.expected && images.slice(0, payload.sampleSize).every(image =>
        image.complete && (image.naturalWidth > 0 || image.dataset.fallbackApplied === "true")
      );
    }, { expected: expectedGalleryCount, sampleSize: imageSampleSize }, { timeout: 60000 });
    await page.locator("#gallery-grid img").evaluateAll(async (images, sampleSize) => {
      await Promise.all(images.slice(0, sampleSize).map(image => image.decode().catch(() => {})));
    }, imageSampleSize);
    const imageLoadAudit = await page.locator("#gallery-grid img").evaluateAll((images, sampleSize) => {
      const sample = images.slice(0, sampleSize);
      return {
        total: sample.length,
        galleryTotal: images.length,
        originalLoaded: sample.filter(image => !image.dataset.fallbackApplied && image.naturalWidth > 0).length,
        fallbacks: sample.filter(image => image.dataset.fallbackApplied).length,
        fallbackLoaded: sample.filter(image => image.dataset.fallbackApplied && image.naturalWidth > 0).length,
        missingDimensions: sample.filter(image => !image.hasAttribute("width") || !image.hasAttribute("height")).length
      };
    }, imageSampleSize);
    // Telegram CDN can intermittently trigger browser ORB/network errors even when
    // the original URL is reachable. Permit up to 2% successfully rendered fallbacks.
    const maxFallbacks = Math.max(1, Math.ceil(imageLoadAudit.total * 0.02));
    if (imageLoadAudit.originalLoaded + imageLoadAudit.fallbackLoaded !== imageLoadAudit.total ||
        imageLoadAudit.fallbacks > maxFallbacks) {
      throw new Error("Gallery images must render; no more than 2% may use a loaded fallback: " + JSON.stringify(imageLoadAudit));
    }
    await page.screenshot({ path: "gallery-desktop-smoke.png", fullPage: true });
    await Promise.all(imageResponseTasks);
    const pendingDimensionCount = galleryData.items.filter(item => item.alt_review_status !== "visual-reviewed" && (!item.image_width || !item.image_height)).length;
    if (imageLoadAudit.missingDimensions > pendingDimensionCount) throw new Error("Only caption-pending images may lack intrinsic dimensions");
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
    for (const card of (await page.locator("#gallery-grid .gallery-card").all()).slice(0, 24)) {
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
    if (initial !== expectedGalleryCount) throw new Error("Expected " + expectedGalleryCount + " gallery cards, got " + initial);
    const likeButtons = await page.locator("#gallery-grid .gallery-like-button").count();
    if (likeButtons !== expectedGalleryCount) throw new Error("Expected " + expectedGalleryCount + " card like controls, got " + likeButtons);
    const firstCard = page.locator("#gallery-grid .gallery-card[data-gallery-id=\"" + targetLikeImageId + "\"]");
    const firstLikeButton = firstCard.locator(".gallery-like-button");
    await page.waitForFunction(imageId => Array.from(document.querySelectorAll("#gallery-grid .gallery-card")).find(card => card.dataset.galleryId === imageId)?.querySelector(".gallery-like-count")?.textContent === "100", targetLikeImageId);
    await firstLikeButton.click();
    await page.waitForFunction(imageId => { const card = Array.from(document.querySelectorAll("#gallery-grid .gallery-card")).find(item => item.dataset.galleryId === imageId); return card?.querySelector(".gallery-like-button")?.getAttribute("aria-pressed") === "true" && card?.querySelector(".gallery-like-count")?.textContent === "101"; }, targetLikeImageId);
    if (!await page.evaluate(() => window.__galleryEvents.some(item => item.event === "gallery_like"))) throw new Error("Authenticated gallery like event was not recorded");
    await firstLikeButton.click();
    await page.waitForFunction(imageId => { const card = Array.from(document.querySelectorAll("#gallery-grid .gallery-card")).find(item => item.dataset.galleryId === imageId); return card?.querySelector(".gallery-like-button")?.getAttribute("aria-pressed") === "false" && card?.querySelector(".gallery-like-count")?.textContent === "100"; }, targetLikeImageId);
    if (!await page.evaluate(() => window.__galleryEvents.some(item => item.event === "gallery_unlike"))) throw new Error("Authenticated gallery unlike event was not recorded");
    if (likeToggleCalls.length !== 2 || likeToggleCalls[0].liked !== true || likeToggleCalls[1].liked !== false) throw new Error("Like/unlike API payload sequence was incorrect: " + JSON.stringify(likeToggleCalls));
    await page.locator("#gallery-grid .gallery-card").first().click({ position: { x: 20, y: 20 } });
    await page.waitForSelector(".gallery-lightbox.is-open .gallery-lightbox-like");
    const openTracked = await page.evaluate(() => window.__galleryEvents.some(item => item.event === "gallery_image_open"));
    if (!openTracked) throw new Error("Gallery image open analytics event was not recorded");
    const fullTelegramCaption = await page.locator(".gallery-lightbox-caption").textContent();
    const expectedTelegramCaption = String(galleryData.items.find(item => item.id === targetLikeImageId)?.caption || "")
      .replace(/\s+/g, " ")
      .split(/━━━━━━━━|🧟\s*\$ZOMBCASH|MARKET DIED\.|📋\s*CA:|🌐\s*Website:|𝕏\s*X Community|💬\s*Telegram/i)[0]
      .trim();
    const headingPattern = /^(?:📓\s*HEROINE[’']?S\s+SURVIVAL\s+DIARY|HEROINE[’']?S\s+SURVIVAL\s+DIARY|🌙\s*UNDEAD\s+AFTER\s+DARK|😂\s*ZOMBIECASH\s+MEMES?|🩸\s*NIGHTMARE\s*(?:&|AND)\s*HORROR|🛰️\s*ZOMBIECASH\s+SITE\s+TRANSMISSION|NIGHTMARE\s+DROP|ZOMBIE\s+MEME(?:\s+OF\s+THE\s+HOUR)?|ZOMBIECASH\s+MEMES?)/i;
    const expectedHeading = expectedTelegramCaption.match(headingPattern)?.[0].trim() || "";
    const expectedHashtags = [...expectedTelegramCaption.matchAll(/#[\p{L}\p{N}_]+/gu)].map(match => match[0]);
    const expectedCaptionBody = expectedTelegramCaption
      .replace(/#[\p{L}\p{N}_]+/gu, " ")
      .replace(headingPattern, "")
      .replace(/\s+/g, " ")
      .trim();
    const expectedLightboxMeta = [expectedHeading, [...new Set(expectedHashtags)].join(" ")].filter(Boolean).join("  ·  ");
    if (!fullTelegramCaption || fullTelegramCaption !== expectedCaptionBody) {
      throw new Error("Lightbox caption body must contain the Telegram text once, without its separate series/hashtag metadata: " + JSON.stringify({ expectedCaptionBody, fullTelegramCaption }));
    }
    const lightboxTitle = await page.locator(".gallery-lightbox-title").textContent().catch(() => "");
    if (lightboxTitle.trim() !== expectedLightboxMeta) {
      throw new Error("Lightbox must preserve series and hashtag metadata separately: " + JSON.stringify({ expectedLightboxMeta, lightboxTitle }));
    }
    if (await page.locator(".gallery-lightbox-description:not(.gallery-lightbox-caption)").count() !== 0) throw new Error("Lightbox must hide an absent or duplicate editorial description");
    const lightboxCaption = await page.locator(".gallery-lightbox figcaption").textContent();
    if (!lightboxCaption.includes("SOURCE")) throw new Error("Lightbox must retain its Telegram source link");
    const detailMetadata = await page.locator(".gallery-lightbox-title").textContent().catch(() => "");
    const cardMetadata = await page.locator("#gallery-grid .gallery-card").first().locator(".gallery-card-meta").textContent().catch(() => "");
    if (detailMetadata.trim() !== cardMetadata.trim()) {
      throw new Error("Lightbox series/hashtag metadata should match the card metadata without duplication");
    }
    const sourceLabel = (await page.locator(".gallery-lightbox-source").textContent()).trim();
    if (sourceLabel.endsWith("↗ ↗")) throw new Error("Lightbox source link must not repeat its arrow");
    await page.evaluate(() => {
      window.__copiedShareUrl = null;
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: async url => { window.__copiedShareUrl = url; } }
      });
    });
    const imageOnlyButton = page.locator(".gallery-lightbox-image-only");
    if (!await imageOnlyButton.isVisible()) throw new Error("Image-only viewing control must be visible in detail mode");
    const controlGeometry = await page.evaluate(() => {
      const close = document.querySelector(".gallery-lightbox-close").getBoundingClientRect();
      const imageOnly = document.querySelector(".gallery-lightbox-image-only").getBoundingClientRect();
      return { close: { left: close.left, right: close.right, top: close.top, bottom: close.bottom },
        imageOnly: { left: imageOnly.left, right: imageOnly.right, top: imageOnly.top, bottom: imageOnly.bottom } };
    });
    const overlaps = controlGeometry.imageOnly.left < controlGeometry.close.right &&
      controlGeometry.imageOnly.right > controlGeometry.close.left &&
      controlGeometry.imageOnly.top < controlGeometry.close.bottom &&
      controlGeometry.imageOnly.bottom > controlGeometry.close.top;
    if (overlaps) throw new Error("Image-only and close controls overlap: " + JSON.stringify(controlGeometry));
    await imageOnlyButton.click();
    await page.waitForFunction(() => document.querySelector(".gallery-lightbox")?.classList.contains("is-image-only"));
    if (await page.locator(".gallery-lightbox figcaption").isVisible()) throw new Error("Image-only mode must hide the caption");
    if (!await page.locator(".gallery-lightbox-prev").isVisible() || !await page.locator(".gallery-lightbox-next").isVisible()) throw new Error("Image-only mode must keep previous/next navigation visible");
    if (!await page.locator(".gallery-lightbox-image-only").isVisible()) throw new Error("Image-only mode must keep the return-to-details control visible");
    if (!await page.locator(".gallery-lightbox-close").isVisible()) throw new Error("Image-only mode must keep the close control visible");
    const imageBeforeNavigation = await page.locator(".gallery-lightbox figure img").getAttribute("src");
    await page.locator(".gallery-lightbox-next").click();
    const imageAfterNext = await page.locator(".gallery-lightbox figure img").getAttribute("src");
    if (imageAfterNext === imageBeforeNavigation) throw new Error("Next control did not change the image in image-only mode");
    await page.locator(".gallery-lightbox-prev").click();
    if (await page.locator(".gallery-lightbox figure img").getAttribute("src") !== imageBeforeNavigation) throw new Error("Previous control did not return to the prior image in image-only mode");
    await imageOnlyButton.click();
    await page.waitForFunction(() => !document.querySelector(".gallery-lightbox")?.classList.contains("is-image-only"));
    if (!await page.locator(".gallery-lightbox figcaption").isVisible()) throw new Error("The ⛶ control should return to the detail view");
    await imageOnlyButton.click();
    await page.waitForFunction(() => document.querySelector(".gallery-lightbox")?.classList.contains("is-image-only"));
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector(".gallery-lightbox")?.classList.contains("is-image-only"));
    if (!await page.locator(".gallery-lightbox figcaption").isVisible()) throw new Error("Escape should return to the detail view, not close the gallery");
    await page.screenshot({ path: "gallery-lightbox-smoke.png" });
    await page.locator(".gallery-lightbox-share").click();
    await page.waitForFunction(() => {
      const menu = document.querySelector(".gallery-share-menu");
      return Boolean(menu && !menu.hidden && menu.querySelector(".gallery-share-copy"));
    });
    const shareUrl = await page.locator(".gallery-share-copy").getAttribute("data-share-url");
    if (!shareUrl || !shareUrl.includes("#gallery-image-")) throw new Error("Gallery share URL must use the stable image anchor");
    if (await page.locator(".gallery-share-option").count() !== 6) throw new Error("Gallery share menu must expose all six supported destinations");
    await page.locator(".gallery-share-copy").click();
    await page.waitForFunction(expected => window.__copiedShareUrl === expected, shareUrl);
    await page.waitForFunction(() => document.querySelector(".gallery-share-status")?.dataset.state === "success");
    await page.waitForFunction(() => window.__galleryEvents.some(item => item.event === "gallery_share_menu_open"));
    await page.locator(".gallery-share-close").click();
    await page.locator(".gallery-lightbox-close").click();
    await page.getByRole("button", { name: "Nightmare & Horror" }).click();
    const filterTracked = await page.evaluate(() => window.__galleryEvents.some(item => item.event === "gallery_filter"));
    if (!filterTracked) throw new Error("Gallery filter analytics event was not recorded");
    const newestFirst = items => [...items].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    const expectedCategoryIds = categoryId => newestFirst(galleryData.items.filter(item => (item.category_ids || []).includes(categoryId))).map(item => item.id);
    const visibleCategoryIds = async () => page.locator("#gallery-grid .gallery-card").evaluateAll(cards => cards.map(card => card.dataset.galleryId));
    const expectedHorrorIds = expectedCategoryIds("nightmare-horror");
    const horror = await page.locator("#gallery-grid .gallery-card").count();
    const expectedHorrorCount = Math.min(50, expectedHorrorIds.length);
    if (horror !== expectedHorrorCount || JSON.stringify(await visibleCategoryIds()) !== JSON.stringify(expectedHorrorIds.slice(0, expectedHorrorCount))) {
      throw new Error("Nightmare filter does not match the first category batch: expected " + expectedHorrorCount + ", got " + horror);
    }
    await page.locator(".gallery-search").fill(gallerySearchTerm);
    await page.locator(".gallery-search").press("Tab");
    const searchTracked = await page.evaluate(() => window.__galleryEvents.some(item => item.event === "gallery_search"));
    if (!searchTracked) throw new Error("Gallery search analytics event was not recorded");
    const search = await page.locator("#gallery-grid .gallery-card").count();
    if (search !== 0) throw new Error("Search should hide non-matching horror items, got " + search);
    await page.locator(".gallery-reset").click();
    const resetTracked = await page.evaluate(() => window.__galleryEvents.some(item => item.event === "gallery_filter_reset"));
    if (!resetTracked) throw new Error("Gallery reset analytics event was not recorded");
    const reset = await page.locator("#gallery-grid .gallery-card").count();
    if (reset !== expectedGalleryCount) throw new Error("Clear filters should restore " + expectedGalleryCount + " cards, got " + reset);
    if (await page.locator("#gallery-grid .gallery-like-button").count() !== expectedGalleryCount) throw new Error("Clear filters should restore like controls");
    const assertCategoryFilter = async (label, expectedIds) => {
      const button = page.getByRole("button", { name: label, exact: true });
      if (expectedIds.length > 0) {
        if (await button.count() !== 1) throw new Error(label + " filter is missing despite matching gallery items");
        await button.click();
        const expectedVisible = Math.min(50, expectedIds.length);
        const visible = await page.locator("#gallery-grid .gallery-card").count();
        if (visible !== expectedVisible || JSON.stringify(await visibleCategoryIds()) !== JSON.stringify(expectedIds.slice(0, expectedVisible))) {
          throw new Error(label + " filter does not match its first category batch: expected " + expectedVisible + ", got " + visible);
        }
      } else if (await button.count() !== 0) {
        throw new Error("Empty " + label + " category should not be rendered as a filter");
      }
    };
    const isHeroineDiary = item => /#ZombieCashDiary\b/i.test(String(item.caption || "") + " " + String(item.title || "")) ||
      /HEROINE[’']?S\s+SURVIVAL\s+DIARY/i.test(String(item.caption || "") + " " + String(item.title || ""));
    const normalizedCategoryIds = item => {
      if (isHeroineDiary(item)) return ["heroine-survival-diary"];
      return [...new Set((item.category_ids || []).map(id => id === "nightmare-horror" || id === "undead-after-dark" ? id : "zombie-memes"))];
    };
    const expectedZombieMemeIds = newestFirst(galleryData.items
      .filter(item => normalizedCategoryIds(item).includes("zombie-memes")))
      .map(item => item.id);
    await assertCategoryFilter("Zombie Memes", expectedZombieMemeIds);
    await assertCategoryFilter("Undead After Dark", expectedCategoryIds("undead-after-dark"));
    for (const label of ["Zombie Characters", "Apocalypse & Survival", "Crypto Apocalypse", "Community Creations"]) {
      if (await page.getByRole("button", { name: label, exact: true }).count() !== 0) {
        throw new Error(label + " should not appear as a separate filter in the three-category gallery taxonomy");
      }
    }
    await page.locator(".gallery-reset").click();
    const categoryReset = await page.locator("#gallery-grid .gallery-card").count();
    if (categoryReset !== expectedGalleryCount) throw new Error("Reset after taxonomy filters should restore all gallery images");
    await page.locator(".gallery-search").fill(gallerySearchTerm);
    const matching = await page.locator("#gallery-grid .gallery-card").count();
    if (matching !== Math.min(150, expectedSearchCount)) throw new Error("Search expected " + Math.min(150, expectedSearchCount) + " matching cards for " + gallerySearchTerm + ", got " + matching);
    await page.locator(".gallery-reset").click();
    await page.locator(".gallery-sort").selectOption("oldest");
    const oldestFirst = await page.locator("#gallery-grid .gallery-card").first().getAttribute("data-gallery-id");
    if (!oldestFirst) throw new Error("Sorted cards must retain stable image IDs");
    await page.locator(".gallery-sort").selectOption("liked");
    if (await page.locator("#gallery-grid .gallery-card").count() !== expectedGalleryCount) throw new Error("Most-liked sort should preserve all gallery cards");
    const mostLikedFirst = await page.locator("#gallery-grid .gallery-card").first().getAttribute("data-gallery-id");
    if (mostLikedFirst !== targetLikeImageId) throw new Error("Most-liked sort did not rank the highest-count image first: " + mostLikedFirst + " (expected " + targetLikeImageId + ")");
    const sortTracked = await page.evaluate(() => window.__galleryEvents.some(item => item.event === "gallery_sort"));
    if (!sortTracked) throw new Error("Gallery sort analytics event was not recorded");
    const turkishExpected = galleryData.items.filter(item =>
      [item.title,item.description,item.caption,item.series,...(item.category_ids||[]),...(item.tags||[])]
        .join(" ").toLocaleLowerCase("tr").includes("ı")
    ).length;
    await page.locator(".gallery-search").fill("I");
    await page.evaluate(() => {
      document.documentElement.lang = "tr";
      document.dispatchEvent(new CustomEvent("zombcash:languagechange", { detail: { language: "tr" } }));
    });
    const turkishSearchCount = await page.locator("#gallery-grid .gallery-card").count();
    if (turkishSearchCount !== Math.min(150, turkishExpected)) {
      throw new Error("Search query was not re-normalized after switching to Turkish: expected " + Math.min(150, turkishExpected) + ", got " + turkishSearchCount);
    }
    const turkishCountLabel = await page.locator("#gallery-count").textContent();
    const turkishUpdatedLabel = await page.locator("#gallery-updated").textContent();
    if (!turkishCountLabel.includes("GÖRSEL") || !turkishUpdatedLabel.startsWith("GÜNCELLENDİ")) {
      throw new Error("Gallery count and update metadata must switch to Turkish with the controls");
    }
    await page.locator(".gallery-reset").click();
    await page.evaluate(() => {
      document.documentElement.lang = "ja";
      document.dispatchEvent(new CustomEvent("zombcash:languagechange", { detail: { language: "ja" } }));
    });
    const japaneseFilter = await page.getByRole("button", { name: "悪夢とホラー" }).count();
    if (japaneseFilter !== 1) throw new Error("Japanese category label did not render");
    const japaneseCountLabel = await page.locator("#gallery-count").textContent();
    const japaneseUpdatedLabel = await page.locator("#gallery-updated").textContent();
    if (!japaneseCountLabel.includes("枚") || !japaneseUpdatedLabel.startsWith("更新")) {
      throw new Error("Gallery count and update metadata must switch to Japanese with the controls");
    }
    const mobile = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 });
    await mobile.route("https://**/*", route => route.abort());
    await mobile.route("https://cdn4.telesco.pe/file/**", route => route.continue());
    await mobile.goto("http://127.0.0.1:4173/gallery.html", { waitUntil: "domcontentloaded" });
    await mobile.waitForSelector(".gallery-toolbar");
    await mobile.waitForFunction(expected => document.querySelectorAll("#gallery-grid .gallery-card").length === expected, expectedGalleryCount);
    await mobile.locator("#gallery-grid img").evaluateAll(images => {
      images.slice(0, 12).forEach(image => { image.loading = "eager"; });
    });
    await mobile.waitForFunction(expected => {
      const images = Array.from(document.querySelectorAll("#gallery-grid img"));
      return images.length === expected && images.slice(0, 12).every(image =>
        image.complete && (image.naturalWidth > 0 || image.dataset.fallbackApplied === "true")
      );
    }, expectedGalleryCount, { timeout: 60000 });
    await mobile.locator("#gallery-grid img").evaluateAll(async images => {
      await Promise.all(images.slice(0, 12).map(image => image.decode().catch(() => {})));
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
    if (mobileShareBox.y < 0 || mobileShareBox.y + mobileShareBox.height > 812) throw new Error("Mobile lightbox share control is clipped below the viewport");
    if (mobileSharePosition !== "static") throw new Error("Mobile lightbox share control must stay in the caption flow");
    await mobile.waitForFunction(() => {
      const lightbox = document.querySelector(".gallery-lightbox");
      return lightbox?.classList.contains("is-open") && Number.parseFloat(getComputedStyle(lightbox).opacity) >= 0.99;
    });
    const mobileCaptionMetrics = await mobile.locator(".gallery-lightbox figcaption").evaluate(element => ({
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight
    }));
    if (mobileCaptionMetrics.scrollHeight > mobileCaptionMetrics.clientHeight + 2) {
      throw new Error("Mobile lightbox caption is clipped instead of fully visible: " + JSON.stringify(mobileCaptionMetrics));
    }
    await mobile.screenshot({ path: "gallery-lightbox-mobile-smoke.png" });
    await mobile.locator(".gallery-lightbox-close").click();
    const russian = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await russian.route("https://**/*", route => route.abort());
    await russian.route("https://cdn4.telesco.pe/file/**", route => route.continue());
    await installGalleryDataMock(russian);
    await russian.goto("http://127.0.0.1:4173/ru/gallery.html", { waitUntil: "domcontentloaded" });
    await russian.waitForSelector(".gallery-toolbar");
    await russian.waitForFunction(expected => document.querySelectorAll("#gallery-grid .gallery-card").length === expected, expectedGalleryCount);
    const visuallyReviewedIds = firstPageItems.filter(item => item.alt_review_status === "visual-reviewed").map(item => item.id);
    const russianSampleIds = Array.from(new Set([
      ...galleryData.items.slice(0, 24).map(item => item.id),
      ...visuallyReviewedIds
    ]));
    await russian.locator("#gallery-grid .gallery-card").evaluateAll((cards, ids) => {
      const wanted = new Set(ids);
      cards.forEach(card => {
        if (wanted.has(card.dataset.galleryId)) {
          const image = card.querySelector("img");
          if (image) image.loading = "eager";
        }
      });
    }, russianSampleIds);
    await russian.waitForFunction(payload => {
      const cards = Array.from(document.querySelectorAll("#gallery-grid .gallery-card"));
      if (cards.length !== payload.expected) return false;
      return payload.ids.every(id => {
        const card = cards.find(item => item.dataset.galleryId === id);
        const image = card?.querySelector("img");
        if (!image || !image.complete || image.naturalWidth <= 0) return false;
        return !payload.reviewed.includes(id) || image.naturalWidth === 800;
      });
    }, { expected: expectedGalleryCount, ids: russianSampleIds, reviewed: visuallyReviewedIds }, { timeout: 60000 });
    await russian.locator("#gallery-grid .gallery-card img").evaluateAll(async (images, ids) => {
      const wanted = new Set(ids);
      await Promise.all(images.filter(image => wanted.has(image.closest(".gallery-card")?.dataset.galleryId))
        .map(image => image.decode().catch(() => {})));
    }, russianSampleIds);
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
      await installGalleryDataMock(localized);
      await localized.goto("http://127.0.0.1:4173/" + locale + "/gallery.html", { waitUntil: "domcontentloaded" });
      await localized.waitForSelector(".gallery-toolbar");
      await localized.waitForFunction(expected => document.querySelectorAll("#gallery-grid .gallery-card").length === expected, expectedGalleryCount);
      const lang = await localized.locator("html").getAttribute("lang");
      const canonical = await localized.locator('link[rel="canonical"]').getAttribute("href");
      const alternates = await localized.locator('link[rel="alternate"][hreflang]').count();
      const title = await localized.title();
      const schemaText = await localized.locator("#gallery-collection-jsonld").textContent();
      const schema = JSON.parse(schemaText);
      const controls = await localized.locator(".gallery-category-chip").allTextContents();
      const firstCardTitle = (await localized.locator("#gallery-grid .gallery-caption p").first().textContent()) || "";
      const firstCardMeta = (await localized.locator("#gallery-grid .gallery-card-meta").first().textContent()) || "";
      const localizedCategoryLabels = {
        "undead-after-dark": { de: "Untote bei Nacht", fr: "Morts-vivants nocturnes", it: "Non morti dopo il tramonto", ja: "夜更けのアンデッド", "zh-CN": "午夜不死者", ru: "Нежить после заката", tr: "Gece Yarısı Ölüleri", hi: "रात ढलने के बाद के ज़ॉम्बी" },
        "zombie-memes": { de: "Zombie-Memes", fr: "Mèmes zombies", it: "Meme zombie", ja: "ゾンビミーム", "zh-CN": "僵尸梗图", ru: "Зомби-мемы", tr: "Zombi Memleri", hi: "ज़ॉम्बी मीम" },
        "nightmare-horror": { de: "Albtraum & Horror", fr: "Cauchemar et horreur", it: "Incubo e horror", ja: "悪夢とホラー", "zh-CN": "噩梦与恐怖", ru: "Кошмары и хоррор", tr: "Kâbus ve Korku", hi: "दुःस्वप्न और हॉरर" },
        "crypto-apocalypse": { de: "Krypto-Apokalypse", fr: "Crypto-apocalypse", it: "Crypto-apocalisse", ja: "暗号資産アポカリプス", "zh-CN": "加密末日", ru: "Криптоапокалипсис", tr: "Kripto Kıyameti", hi: "क्रिप्टो प्रलय" },
        "community-creations": { de: "Community-Kreationen", fr: "Créations de la communauté", it: "Creazioni della community", ja: "コミュニティ作品", "zh-CN": "社区创作", ru: "Работы сообщества", tr: "Topluluk Eserleri", hi: "समुदाय की कलाकृतियाँ" }
      };
      const firstCategoryId = galleryData.items[0]?.category_ids?.[0];
      const normalizedFirstCategoryId = firstCategoryId === "nightmare-horror" || firstCategoryId === "undead-after-dark" ? firstCategoryId : "zombie-memes";
      const localizedFirstCategory = localizedCategoryLabels[normalizedFirstCategoryId]?.[locale];
      if (localizedFirstCategory && !controls.includes(localizedFirstCategory)) {
        throw new Error(locale + " category filter label is not translated: " + localizedFirstCategory);
      }
      if (/NIGHTMARE & HORROR|ZOMBIECASH MEMES|ZOMBIECASH MEME|UNDEAD AFTER DARK|SITE TRANSMISSION/i.test(firstCardTitle)) throw new Error(locale + " source series header was not removed from the caption: " + firstCardTitle);
      const siteTransmissionLabels = ["Website-Meldungen", "Actualités du site", "Aggiornamenti dal sito", "サイト通信", "网站播报", "Передачи с сайта", "Site Duyuruları", "साइट अपडेट", "Site Transmissions"];
      if (controls.some(label => siteTransmissionLabels.includes(label))) throw new Error(locale + " removed Site Transmissions category is still visible");
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
      localeAudit.push({ locale, lang, alternates, cards: expectedGalleryCount, title, shareLabel, firstCardTitle, firstCardMeta, firstCategoryLabel: localizedFirstCategory });
      await localized.close();
    }

    if (galleryData.items.length > 150) {
      // The interactive archive grows in 150-image batches while preserving newest-first order.
      await page.locator(".gallery-sort").selectOption("newest");
      const loadMoreButton = page.locator(".gallery-load-more-button");
      if (!(await loadMoreButton.isVisible())) throw new Error("Gallery load-more control is not visible after the first 150 images");
      await loadMoreButton.click();
      const expandedCount = Math.min(300, galleryData.items.length);
      await page.waitForFunction(expected => document.querySelectorAll("#gallery-grid .gallery-card").length === expected, expandedCount);
      const firstId = await page.locator("#gallery-grid .gallery-card").first().getAttribute("data-gallery-id");
      const batchBoundaryId = await page.locator("#gallery-grid .gallery-card").nth(150).getAttribute("data-gallery-id");
      if (firstId !== galleryData.items[0].id) throw new Error("Loading more images must preserve the newest-first first card");
      if (batchBoundaryId !== galleryData.items[150].id) throw new Error("The next 150-image batch must continue at the correct archive item");
    }
    console.log(JSON.stringify({ status: "passed", initial, horror, search, reset, matching, oldestFirst, japaneseFilter, mobile: overflow, imageLoadAudit, imageNetworkEvents, recoveryChecks, localeAudit }));
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

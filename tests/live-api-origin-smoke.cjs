const { chromium } = require("playwright");

const origin = "https://zombcash.github.io";
const api = "https://zombcash-bot.fadehost.app";
const endpoints = ["/health", "/api/radar", "/api/zombcash", "/api/news", "/api/activity"];

(async () => {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const navigation = await page.goto(origin, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (!navigation || !navigation.ok()) throw new Error("Could not open the live ZombieCash origin");

    const results = await page.evaluate(async ({ api, endpoints }) => {
      return Promise.all(endpoints.map(async path => {
        try {
          const response = await fetch(api + path, {
            cache: "no-store",
            credentials: "omit",
            signal: AbortSignal.timeout(15000)
          });
          const body = await response.text();
          let data = null;
          try { data = JSON.parse(body); } catch (_) {}
          return { path, resolved: true, type: response.type, status: response.status, data, preview: body.slice(0, 220) };
        } catch (error) {
          return { path, resolved: false, error: error.name + ": " + error.message };
        }
      }));
    }, { api, endpoints });

    for (const result of results) {
      if (!result.resolved) throw new Error(result.path + " browser fetch failed: " + result.error);
      if (result.type !== "cors") throw new Error(result.path + " expected CORS response, received " + result.type);
      if (result.status !== 200) throw new Error(result.path + " returned HTTP " + result.status + ": " + result.preview);
      if (!result.data || typeof result.data !== "object") throw new Error(result.path + " did not return a JSON object");
    }

    const byPath = Object.fromEntries(results.map(result => [result.path, result.data]));
    if (byPath["/health"].ok !== true) throw new Error("/health did not confirm the API is healthy");
    if (!Array.isArray(byPath["/api/radar"].pairs) || byPath["/api/radar"].pairs.length === 0) {
      throw new Error("/api/radar returned no token pairs");
    }
    const market = byPath["/api/zombcash"];
    if (!Number.isFinite(Number(market.priceUsd)) || Number(market.priceUsd) <= 0) {
      throw new Error("/api/zombcash did not return a positive token price");
    }
    const articles = byPath["/api/news"].articles;
    if (!Array.isArray(articles) || !articles.some(article =>
      article && article.enriched !== true && /^https?:\/\//i.test(String(article.link || ""))
    )) {
      throw new Error("/api/news returned no external RSS article for the public news panel");
    }
    const activity = byPath["/api/activity"];
    if (!activity.buys || !activity.sells || !activity.volume || !activity.source) {
      throw new Error("/api/activity is missing the fields consumed by the activity panel");
    }

    console.log("PASS: live ZombieCash API is browser-readable from the site origin.");
    console.log("PASS: health=ok; radarPairs=" + byPath["/api/radar"].pairs.length +
      "; tokenPriceUsd=" + market.priceUsd +
      "; newsArticles=" + articles.length +
      "; externalRss=" + articles.filter(article => article && article.enriched !== true).length +
      "; activitySource=" + activity.source);
  } finally {
    if (browser) await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

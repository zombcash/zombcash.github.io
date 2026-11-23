const { chromium } = require("playwright");

const endpoint = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin%2Cethereum%2Csolana&vs_currencies=usd&include_24hr_change=true";

(async () => {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const navigation = await page.goto("https://zombcash.github.io/", {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });
    if (!navigation || !navigation.ok()) {
      throw new Error("Could not open the live ZombieCash origin for the CORS check");
    }

    const result = await page.evaluate(async url => {
      try {
        const response = await fetch(url, {
          cache: "no-store",
          credentials: "omit",
          signal: AbortSignal.timeout(15000)
        });
        const body = await response.text();
        let data = null;
        try { data = JSON.parse(body); } catch (_) {}
        return { resolved: true, type: response.type, status: response.status, data, preview: body.slice(0, 240) };
      } catch (error) {
        return { resolved: false, error: error.name + ": " + error.message };
      }
    }, endpoint);

    if (!result.resolved) {
      throw new Error("CoinGecko browser request failed from https://zombcash.github.io/: " + result.error);
    }
    if (result.type !== "cors") {
      throw new Error("Expected a cross-origin CORS response, received " + result.type);
    }
    if (result.status === 429) {
      console.log("PASS: CORS is permitted from the live ZombieCash origin; CoinGecko returned HTTP 429 (rate limited).");
      return;
    }
    if (result.status !== 200) {
      throw new Error("CoinGecko CORS succeeded but API returned HTTP " + result.status + ": " + result.preview);
    }
    for (const id of ["bitcoin", "ethereum", "solana"]) {
      const price = Number(result.data && result.data[id] && result.data[id].usd);
      if (!Number.isFinite(price) || price <= 0) throw new Error("Missing valid USD price for " + id);
    }
    console.log("PASS: CoinGecko returned BTC, ETH and SOL prices through browser fetch from the live ZombieCash origin.");
  } finally {
    if (browser) await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

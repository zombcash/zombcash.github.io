const fs = require("fs");
const assert = require("assert");

const index = fs.readFileSync("index.html", "utf8");
const shared = fs.readFileSync("shared-nav.js", "utf8");

assert(!/<script\s+src=["']https:\/\/plugin\.jup\.ag\/plugin-v1\.js["'][^>]*><\/script>/i.test(index),
  "Jupiter plugin must not be parser-blocking in the document head");
assert(index.includes("new IntersectionObserver"), "Jupiter must load on proximity to the swap panel");
assert(index.includes("script.async = true"), "Jupiter plugin must load asynchronously");
assert(index.includes("script.fetchPriority = 'low'"), "Jupiter plugin must use low fetch priority");
assert(index.includes("https://jup.ag/swap/SOL-6cCBF9gtyp3c6VmyxUWzETk3yFmxhjvPm15cxicfpump"),
  "External Jupiter fallback must remain available");
assert(index.includes("&display=optional"), "Homepage brand fonts must avoid late swap layout shifts");
assert(index.includes('controls playsinline preload="none"'), "Promo video must not fetch before user playback");
assert(!index.includes("player.src=safeUrl(item.src);player.load();"), "Promo video must not force metadata loading on page render");
assert(shared.includes("window.gtag('config', 'G-2FZH07QTR7')"), "GA4 config must remain queued");
assert(shared.includes("requestIdleCallback(loadGaScript"), "GA4 script must be delayed until idle");
assert(shared.includes("display=optional"), "Shared fonts must use optional display");
assert(shared.includes("stage.style.minHeight = reservedHeight + 'px';") && shared.includes("unit.style.flexShrink = '0';"), "Adsterra reserved slot layout must remain intact");
assert(shared.includes("Noto+Sans+SC") && shared.includes("Noto+Sans+JP") && shared.includes("Noto+Sans+Devanagari"),
  "Chinese, Japanese and Hindi font fallbacks must remain available");

console.log("CWV static smoke passed: Jupiter lazy-load, GA4 queue, multilingual fonts and fallback link preserved.");

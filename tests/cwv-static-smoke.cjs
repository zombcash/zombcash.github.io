const fs = require("fs");
const assert = require("assert");

const read = path => fs.readFileSync(path, "utf8");
const index = read("index.html");
const shared = read("shared-nav.js");
const tv = read("assets/js/zctv-player.js");
const news = read("script.js");
const recovery = read("living-world-recovery.js");

assert(!/<script\\s+src=["']https:\\/\\/plugin\\.jup\\.ag\\/plugin-v1\\.js["'][^>]*><\\/script>/i.test(index),
  "Jupiter plugin must not be parser-blocking in the homepage head");
assert(index.includes("new IntersectionObserver") && index.includes("observer.observe(terminal)"),
  "Jupiter must load only when the swap panel approaches the viewport");
assert(index.includes("script.async = true") && index.includes("script.fetchPriority = 'low'"),
  "Jupiter plugin must load asynchronously with low priority");
assert(index.includes('preload="none"'), "Promo video must not fetch media metadata on initial page load");
assert(index.includes('loading="lazy" fetchpriority="low"'),
  "Below-the-fold ZombieCash TV host art must load lazily");
assert(index.includes('rel="preload" as="image"') && index.includes("Overgrown_city%2Cpost-apocalyptic.jpg") && index.includes('fetchpriority="high"'),
  "Homepage CSS hero background must be preloaded at high priority");
assert(index.includes("display=optional"), "Homepage brand fonts must avoid late font-swap layout shifts");
assert(index.includes('src="runtime-fixes.js?v=20261027-2" defer') &&
       index.includes('src="script.js?v=market-status-fix-20261029-1" defer') &&
       index.includes('src="living-world-recovery.js?v=news-commentary-sync-20261021-2" defer'),
  "Homepage utility scripts must be deferred");

assert(shared.includes("requestIdleCallback(loadGaScript") && shared.includes("gaScript.fetchPriority = 'low'"),
  "GA4 library must load after page load/idle with low priority");
assert(shared.includes("link.href.includes('fonts.googleapis.com/css2')") &&
       shared.includes("Noto+Sans+JP") && shared.includes("Noto+Sans+SC") &&
       shared.includes("Noto+Sans+Devanagari") && shared.includes("display=optional"),
  "Shared navigation must load only the current locale's required font families");

const featured = tv.slice(tv.indexOf("function showFeaturedPromo"), tv.indexOf("function playPromoAt"));
assert(featured.includes("queueFeaturedMedia") && !featured.includes("player.load()") && !featured.includes("player.poster"),
  "Featured TV video and poster must not load before the player approaches the viewport");
assert(tv.includes("function queueFeaturedMedia(src)") &&
       tv.includes("function loadPlayerMedia(src)") &&
       tv.includes("rootMargin: '650px 0px'"),
  "TV media must use the lazy IntersectionObserver loader");

for (const [path, source] of [["script.js", news], ["living-world-recovery.js", recovery]]) {
  assert(source.includes("image.width = 640;") && source.includes("image.height = 360;"),
    path + " must reserve dimensions for dynamic news images");
  assert(source.includes("aspect-ratio:16/9"),
    path + " must reserve a stable 16:9 news image box");
}

console.log("PASS: homepage Core Web Vitals loading guards.");

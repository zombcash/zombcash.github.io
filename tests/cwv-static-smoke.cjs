const fs = require("fs");
const assert = require("assert");

const read = path => fs.readFileSync(path, "utf8");
const index = read("index.html");
const shared = read("shared-nav.js");
const tv = read("assets/js/zctv-player.js");
const news = read("script.js");
const recovery = read("living-world-recovery.js");
const localePaths = ["de/index.html", "fr/index.html", "it/index.html", "ja/index.html", "zh-CN/index.html", "ru/index.html", "tr/index.html", "hi/index.html"];
const homepages = [["index.html", index], ...localePaths.map(path => [path, read(path)])];

for (const [path, page] of homepages) {
  assert(!page.includes('<script src="https://plugin.jup.ag/plugin-v1.js"></script>'),
    path + " must not load the Jupiter plugin as a parser-blocking script");
  assert(page.includes("new IntersectionObserver") && page.includes("observer.observe(terminal)"),
    path + " must load Jupiter only when the Swap panel approaches the viewport");
  assert(page.includes("script.async = true") && page.includes("script.fetchPriority = 'low'"),
    path + " must load Jupiter asynchronously at low priority");
  assert(page.includes('preload="none"'), path + " must not preload promo video metadata");
  assert(page.includes('loading="lazy" fetchpriority="low"'),
    path + " must lazy-load below-the-fold TV host art");
  assert(page.includes('rel="preload" as="image"') &&
         page.includes("Overgrown_city%2C_post-apocalyptic.jpg") &&
         page.includes('fetchpriority="high"'),
    path + " must preload the CSS hero background at high priority");
  assert(page.includes("display=optional"), path + " must use optional display for brand fonts");
}

const hasDeferredScript = (page, filename, rootRelative = false) => {
  const expectedSrc = rootRelative ? `/${filename}` : filename;
  const scriptTags = page.match(/<script\b[^>]*>/gi) || [];
  return scriptTags.some(tag => {
    const srcMatch = tag.match(/\bsrc=["']([^"']+)["']/i);
    if (!srcMatch) return false;
    const srcWithoutQuery = srcMatch[1].split("?")[0];
    return srcWithoutQuery === expectedSrc && /\bdefer(?=\s|=|>|$)/i.test(tag);
  });
};

assert(hasDeferredScript(index, "runtime-fixes.js") &&
       hasDeferredScript(index, "script.js") &&
       hasDeferredScript(index, "living-world-recovery.js"),
  "English homepage utility scripts must be deferred");
for (const path of localePaths) {
  const page = read(path);
  assert(hasDeferredScript(page, "runtime-fixes.js", true) &&
         hasDeferredScript(page, "script.js", true) &&
         hasDeferredScript(page, "living-world-recovery.js", true),
    path + " utility scripts must be deferred");
}

assert(shared.includes("requestIdleCallback(loadGaScript") && shared.includes("gaScript.fetchPriority = 'low'"),
  "GA4 library must load after page load/idle with low priority");
assert(shared.includes("const fontNeeded = Array.from(document.querySelectorAll('style')).some(style =>") &&
       shared.includes("style.textContent.includes(localeFont.cssFamily)") &&
       shared.includes("Noto+Sans+JP") && shared.includes("Noto+Sans+SC") &&
       shared.includes("Noto+Sans+Devanagari") && shared.includes("display=optional"),
  "Shared navigation must load locale fonts only when page styles require them");

const localeFontPages = [
  ["ja/index.html", "ja", "Noto+Sans+JP"],
  ["ja/avoid-fake-token-websites-wallet-scams.html", "ja", "Noto+Sans+JP"],
  ["ja/check-liquidity-holder-distribution-solana.html", "ja", "Noto+Sans+JP"],
  ["ja/how-to-research-solana-meme-coins.html", "ja", "Noto+Sans+JP"],
  ["ja/solana-memecoin-research-guide.html", "ja", "Noto+Sans+JP"],
  ["ja/solana-token-safety-checklist.html", "ja", "Noto+Sans+JP"],
  ["zh-CN/index.html", "zh", "Noto+Sans+SC"],
  ["hi/index.html", "hi", "Noto+Sans+Devanagari"]
];
for (const [path, familyName, family] of localeFontPages) {
  const page = read(path);
  const head = page.slice(0, page.indexOf("</head>"));
  assert(head.includes(`data-zsh-font-family="${familyName}"`) &&
         head.includes(`family=${family}:wght@400;500;700&display=optional`),
    path + " must request its locale font from <head> to prevent late font layout shifts");
}
assert(shared.includes("document.addEventListener('zombcash:languagechange', ensureZshFonts)"),
  "Shared navigation must re-evaluate font requirements after a language switch");

const featured = tv.slice(tv.indexOf("function showFeaturedPromo"), tv.indexOf("function playPromoAt"));
assert(featured.includes("queueFeaturedMedia") && !featured.includes("player.load()") && !featured.includes("player.poster"),
  "Featured TV video and poster must not load before the player approaches the viewport");
assert(tv.includes("function queueFeaturedMedia(src)") &&
       tv.includes("function loadPlayerMedia(src)") &&
       tv.includes("rootMargin: '250px 0px'"),
  "TV media must use the lazy IntersectionObserver loader");

for (const [path, source] of [["script.js", news], ["living-world-recovery.js", recovery]]) {
  assert(source.includes("image.width = 640;") && source.includes("image.height = 360;"),
    path + " must reserve dimensions for dynamic news images");
  assert(source.includes("aspect-ratio:16/9"),
    path + " must reserve a stable 16:9 news image box");
}

console.log("PASS: homepage Core Web Vitals loading guards.");

/* ZombieCash Adcash AutoTag — global zone supplied by the site owner. */
(() => {
  'use strict';
  try {
    if (window.__zcAdcashAutoTagLoaded) return;
    window.__zcAdcashAutoTagLoaded = true;
    const script = document.createElement('script');
    script.id = 'zc-adcash-aclib';
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://acscdn.com/script/aclib.js';
    script.onload = () => {
      try {
        if (window.aclib && typeof window.aclib.runAutoTag === 'function' && !window.__zcAdcashZoneStarted) {
          window.__zcAdcashZoneStarted = true;
          window.aclib.runAutoTag({ zoneId: 'f0ha7epib3' });
        }
      } catch (error) {
        console.warn('[ZombieCash] Adcash AutoTag could not start:', error);
      }
    };
    script.onerror = () => console.warn('[ZombieCash] Adcash library failed to load.');
    document.head.appendChild(script);
  } catch (error) {
    console.warn('[ZombieCash] Adcash integration skipped:', error);
  }
})();

/* ZombieCash site-wide Adsterra placement — shared across every language/page. */
(() => {
  'use strict';
  try {
  if (window.__zcSitewideAdsterraInit) return;
  window.__zcSitewideAdsterraInit = true;
  const NATIVE_ID = '4420dadadbd2f0727c322cd6c632be3e';
  const MOBILE_KEY = 'fbb2658d8dcb4503b358387f042869d1';
  const nativeContainerId = 'container-4420dadadbd2f0727c322cd6c632be3e';
  const copy = {
    en: 'COMMUNITY SUPPORT / SPONSORED',
    de: 'COMMUNITY-UNTERSTÜTZUNG / ANZEIGE',
    fr: 'SOUTIEN DE LA COMMUNAUTÉ / SPONSORISÉ',
    it: 'SUPPORTO ALLA COMMUNITY / SPONSORIZZATO',
    ja: 'コミュニティ支援 / 広告',
    'zh-CN': '社区支持 / 赞助内容',
    ru: 'ПОДДЕРЖКА СООБЩЕСТВА / РЕКЛАМА',
    tr: 'TOPLULUK DESTEĞİ / SPONSORLU',
    hi: 'समुदाय सहयोग / प्रायोजित'
  };
  const mobileQuery = window.matchMedia('(max-width: 767px)');
  function loadNative(slot) {
    if (!slot || slot.dataset.loaded === '1') return;
    slot.dataset.loaded = '1';
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://bauval.org/21/' + NATIVE_ID;
    slot.appendChild(script);
  }
  function loadMobile(slot) {
    if (!slot || slot.dataset.loaded === '1') return;
    slot.dataset.loaded = '1';
    window.atOptions = { key: MOBILE_KEY, format: 'iframe', height: 50, width: 320, params: {} };
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = false;
    script.src = 'https://bauval.org/22/' + MOBILE_KEY;
    script.setAttribute('data-zc-adsterra-placement', 'mobile-320x50');
    slot.appendChild(script);
  }
  function initSitewideAd() {
    if (document.querySelector('#home .zc-adsterra-native-slot, #home .zc-adsterra-mobile-slot')) return;
    if (document.querySelector('.zc-sitewide-adsterra')) return;
    const main = document.querySelector('main') || document.querySelector('.page-shell') || document.body;
    if (!main) return;
    // Respect any page-specific Adsterra slot already authored anywhere in the page.
    if (document.querySelector('.zc-adsterra-native-slot, .zc-adsterra-mobile-slot, [data-zc-adsterra-slot], [data-zc-adsterra-placement]')) return;
    const lang = (document.documentElement.lang || 'en').toLowerCase();
    const locale = lang === 'zh-cn' ? 'zh-CN' : (lang.split('-')[0] || 'en');
    const label = copy[locale] || copy.en;
    const aside = document.createElement('aside');
    aside.className = 'zc-sitewide-adsterra';
    aside.setAttribute('aria-label', 'Sponsored content');
    aside.innerHTML =
      '<div class="zc-sitewide-adsterra-label"></div>' +
      '<div class="zc-sitewide-adsterra-native"><div id="' + nativeContainerId + '"></div></div>' +
      '<div class="zc-sitewide-adsterra-mobile"></div>';
    aside.querySelector('.zc-sitewide-adsterra-label').textContent = label;
    const footer = main.querySelector('footer');
    if (footer) main.insertBefore(aside, footer);
    else if (main === document.body) main.appendChild(aside);
    else main.insertAdjacentElement('afterend', aside);
    const style = document.createElement('style');
    style.id = 'zc-sitewide-adsterra-style-20261105';
    style.textContent = [
      '.zc-sitewide-adsterra{box-sizing:border-box;width:min(100% - 32px,1080px);margin:30px auto 26px;padding:16px 18px;border:1px solid #9bff4540;border-radius:5px;background:linear-gradient(145deg,#0a120d,#070b09 65%,#0d1010);box-shadow:0 12px 36px #0005;text-align:center;overflow:hidden}',
      '.zc-sitewide-adsterra-label{margin:0 0 12px;color:#829481;font:600 9px/1.5 Orbitron,Arial,sans-serif;letter-spacing:1.5px}',
      '.zc-sitewide-adsterra-native{display:block;width:100%;max-width:640px;min-height:300px;margin:0 auto}',
      '.zc-sitewide-adsterra-native>div{width:100%;max-width:640px;min-height:300px;margin:0 auto}',
      '.zc-sitewide-adsterra-mobile{display:none;width:320px;max-width:100%;height:50px;min-height:50px;margin:0 auto;overflow:hidden}',
      '.zc-sitewide-adsterra-mobile iframe{display:block;width:320px;max-width:100%;height:50px;border:0}',
      '@media(max-width:767px){.zc-sitewide-adsterra{width:calc(100% - 20px);margin:22px auto;padding:12px 8px}.zc-sitewide-adsterra-label{margin-bottom:8px}.zc-sitewide-adsterra-native{display:none}.zc-sitewide-adsterra-mobile{display:block}}',
      '@media(min-width:768px){.zc-sitewide-adsterra-native{display:block}.zc-sitewide-adsterra-mobile{display:none}}'
    ].join('');
    document.head.appendChild(style);
    const nativeSlot = aside.querySelector('.zc-sitewide-adsterra-native');
    const mobileSlot = aside.querySelector('.zc-sitewide-adsterra-mobile');
    function syncAd() {
      if (mobileQuery.matches) loadMobile(mobileSlot);
      else loadNative(nativeSlot);
    }
    syncAd();
    if (typeof mobileQuery.addEventListener === 'function') mobileQuery.addEventListener('change', syncAd);
    else if (typeof mobileQuery.addListener === 'function') mobileQuery.addListener(syncAd);
  }
  const safeInitSitewideAd = () => { try { initSitewideAd(); } catch (error) { console.warn('[ZombieCash] Optional ad placement failed:', error); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', safeInitSitewideAd, { once: true });
  else safeInitSitewideAd();
  } catch (error) { console.warn('[ZombieCash] Optional ad initializer skipped:', error); }
})();


/* ZombieCash shared navigation — one source of truth for every public page.
 * Keep page-specific styling below the header; header layout is owned here.
 */
(() => {
  'use strict';
  /* Anonymous site-wide presence heartbeat. This shared file runs on every public page. */
  try { (() => {
    // The arcade game embeds index.html in an iframe; do not count that embedded document as a separate visit.
    if (new URLSearchParams(location.search).get('arcadeSnake') === '1') return;
    const api = 'https://zombcash-bot.fadehost.app/api/visits';
    const key = 'zombcash_site_visitor_v1';
    const validVisitor = value => /^[a-f0-9-]{16,80}$/.test(value);
    const makeVisitorId = () => {
      try {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
          return window.crypto.randomUUID().toLowerCase();
        }
      } catch (_) {}
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      }).toLowerCase();
    };
    let visitor = '';
    try { visitor = localStorage.getItem(key) || ''; } catch (_) {}
    if (!validVisitor(visitor)) {
      visitor = makeVisitorId();
      // Persistence is best-effort. If storage is blocked, keep a valid ID for
      // this page session so the API does not reject the visitor heartbeat.
      try { localStorage.setItem(key, visitor); } catch (_) {}
    }
    const heartbeat = () => {
      if (document.visibilityState === 'hidden') return;
      fetch(api, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({visitor}), keepalive:true}).catch(() => {});
    };
    heartbeat();
    setInterval(heartbeat, 20000);
    document.addEventListener('visibilitychange', heartbeat);
  })(); } catch (error) { console.warn('[ZombieCash] Optional presence heartbeat skipped:', error); }


  // ZombieCash GA4: centralized measurement tag for pages loading shared-nav.js.
  try {
  // Keep the measurement ID in one place to avoid duplicate tags across HTML pages.
  if (new URLSearchParams(location.search).get('arcadeSnake') !== '1' && !window.__zombcashGa4Loaded) {
    window.__zombcashGa4Loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', 'G-2FZH07QTR7');

    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-2FZH07QTR7';
    document.head.appendChild(gaScript);
  }
  } catch (error) { console.warn('[ZombieCash] Optional analytics initialization skipped:', error); }
  const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isHome = file === 'index.html';
  const isGermanPage = location.pathname === '/de/' || location.pathname.startsWith('/de/');
  if (!isHome) document.body.classList.add('zsh-inner-page');
  // All shared navigation destinations are rooted at the site root. Relative links
  // incorrectly sent visitors from /ru/, /de/, etc. to nonexistent translated copies.
  const home = '/';
  const labels = [
    ['HOME', '/', 'home'],
    ['FIELD MANUAL', '/survivor-field-manual.html', 'manual'],
    ['WHITEPAPER', '/whitepaper.html', 'whitepaper'],
    ['MARKET DATA', '/zombcash-market-data.html', 'market-data'],
    ['TRANSMISSION', '/outbreak-transmission.html', 'transmission'],
    ['CREW VOTE', '/crew-vote.html', 'vote'],
    ['SURVIVOR HUB', '/survivor-hub.html', 'hub'],
    ['ARCADE', '/arcade.html', 'arcade'],
    ['ZOMBIE GALLERY', '/gallery.html', 'gallery'],
    ['ZOMBIE MAKER', '/zombie-maker.html', 'maker'],
    ['LOTTERY', '/roulette.html', 'lottery'],
    ['BUY $ZOMBCASH', '/buy-zombcash.html', 'buy']
  ];
  // Reuse only a page-level shell header. Descendant headers may belong to article content
  // (for example, article breadcrumbs and their language links) and must remain untouched.
  // Support the legacy top-level wrappers used by older page templates without selecting
  // headers nested inside .article, article, or main content.
  // Do not mistake a semantic article header inside <main class="wrap"> for the
  // global site header. Market Data and other content pages use this exact layout.
  let header = document.querySelector(
    'body > header:not(.hero), body > .wrap:not(main) > header:not(.hero), body > .container:not(main) > header:not(.hero), body > .page-wrap:not(main) > header:not(.hero)'
  );
  if (!header) {
    header = document.createElement('header');
    document.body.insertBefore(header, document.body.firstChild);
  }

  // Legacy pages often wrap their header in a centered .wrap (for example,
  // Outbreak Transmission uses a 1000px content wrapper). Move the shared
  // header to the body so it can span the viewport consistently on every page.
  if (header.parentElement !== document.body) {
    document.body.insertBefore(header, document.body.firstChild);
  }

  // Preserve the Survivor Hub's working Telegram login control before rebuilding its common shell.
  const loginButton = file === 'survivor-hub.html'
    ? header.querySelector('button[data-i18n="login"], button.top-cta')
    : null;
  const supportedLocales = ['de','fr','it','ja','zh-CN','ru','tr','hi'];
  const supportedLocaleSet = new Set(['de','fr','it','ja','zh-CN','ru','tr','hi']);
  // These pages actually have a translated HTML file in the language manifest.
  // For other destinations preserve the active locale with ?lang= rather than
  // constructing a path to a file that may not exist.
  const localizedPagesByLocale = {
    de: new Set(["about.html","memecoin-promotion-platforms-comparison.html","avoid-fake-token-websites-wallet-scams.html","buy-zombcash.html","check-liquidity-holder-distribution-solana.html","how-to-research-solana-meme-coins.html","index.html","outbreak-transmission.html","solana-memecoin-research-guide.html","survivor-field-manual.html","transmission-last-backup-ai-apocalypse.html","transmission-memecoin-graveyard.html","transmission-memecoin-knowledge-business.html","transmission-rug-pull-check.html","transmission-solana-memecoin-warning-signs.html","transmission-trump-family-memecoins.html","transmission-wallet-security-red-flags.html","transmission-zombie-fiction-rpg-guide.html","zombcash-buying-guide.html","whitepaper.html","gallery.html","zombcash-market-data.html","transmission-liquidity-is-not-market-cap.html","the-city-went-quiet-raven-outbreak.html"]),
    fr: new Set(["about.html","memecoin-promotion-platforms-comparison.html","avoid-fake-token-websites-wallet-scams.html","buy-zombcash.html","check-liquidity-holder-distribution-solana.html","how-to-research-solana-meme-coins.html","index.html","outbreak-transmission.html","solana-memecoin-research-guide.html","survivor-field-manual.html","transmission-last-backup-ai-apocalypse.html","transmission-memecoin-graveyard.html","transmission-memecoin-knowledge-business.html","transmission-rug-pull-check.html","transmission-solana-memecoin-warning-signs.html","transmission-trump-family-memecoins.html","transmission-wallet-security-red-flags.html","transmission-zombie-fiction-rpg-guide.html","zombcash-buying-guide.html","whitepaper.html","gallery.html","zombcash-market-data.html","transmission-liquidity-is-not-market-cap.html","the-city-went-quiet-raven-outbreak.html"]),
    it: new Set(["about.html","memecoin-promotion-platforms-comparison.html","buy-zombcash.html","index.html","outbreak-transmission.html","solana-memecoin-research-guide.html","survivor-field-manual.html","transmission-last-backup-ai-apocalypse.html","transmission-memecoin-graveyard.html","transmission-memecoin-knowledge-business.html","transmission-rug-pull-check.html","transmission-solana-memecoin-warning-signs.html","transmission-trump-family-memecoins.html","transmission-wallet-security-red-flags.html","transmission-zombie-fiction-rpg-guide.html","zombcash-buying-guide.html","whitepaper.html","gallery.html","zombcash-market-data.html","transmission-liquidity-is-not-market-cap.html","the-city-went-quiet-raven-outbreak.html"]),
    ja: new Set(["about.html","memecoin-promotion-platforms-comparison.html","buy-zombcash.html","index.html","outbreak-transmission.html","solana-memecoin-research-guide.html","survivor-field-manual.html","transmission-last-backup-ai-apocalypse.html","transmission-memecoin-graveyard.html","transmission-memecoin-knowledge-business.html","transmission-rug-pull-check.html","transmission-solana-memecoin-warning-signs.html","transmission-trump-family-memecoins.html","transmission-wallet-security-red-flags.html","transmission-zombie-fiction-rpg-guide.html","zombcash-buying-guide.html","whitepaper.html","gallery.html","zombcash-market-data.html","transmission-liquidity-is-not-market-cap.html","the-city-went-quiet-raven-outbreak.html"]),
    'zh-CN': new Set(["about.html","memecoin-promotion-platforms-comparison.html","buy-zombcash.html","index.html","outbreak-transmission.html","solana-memecoin-research-guide.html","survivor-field-manual.html","transmission-last-backup-ai-apocalypse.html","transmission-memecoin-graveyard.html","transmission-memecoin-knowledge-business.html","transmission-rug-pull-check.html","transmission-solana-memecoin-warning-signs.html","transmission-trump-family-memecoins.html","transmission-wallet-security-red-flags.html","transmission-zombie-fiction-rpg-guide.html","zombcash-buying-guide.html","whitepaper.html","gallery.html","zombcash-market-data.html","transmission-liquidity-is-not-market-cap.html","the-city-went-quiet-raven-outbreak.html"]),
    ru: new Set(["about.html","memecoin-promotion-platforms-comparison.html","avoid-fake-token-websites-wallet-scams.html","buy-zombcash.html","check-liquidity-holder-distribution-solana.html","how-to-research-solana-meme-coins.html","index.html","outbreak-transmission.html","solana-memecoin-research-guide.html","solana-token-safety-checklist.html","survivor-field-manual.html","transmission-last-backup-ai-apocalypse.html","transmission-memecoin-graveyard.html","transmission-memecoin-knowledge-business.html","transmission-rug-pull-check.html","transmission-solana-memecoin-warning-signs.html","transmission-trump-family-memecoins.html","transmission-wallet-security-red-flags.html","transmission-zombie-fiction-rpg-guide.html","zombcash-buying-guide.html","whitepaper.html","gallery.html","zombcash-market-data.html","transmission-liquidity-is-not-market-cap.html","the-city-went-quiet-raven-outbreak.html"]),
    tr: new Set(["about.html","memecoin-promotion-platforms-comparison.html","buy-zombcash.html","index.html","outbreak-transmission.html","solana-memecoin-research-guide.html","survivor-field-manual.html","transmission-last-backup-ai-apocalypse.html","transmission-memecoin-graveyard.html","transmission-memecoin-knowledge-business.html","transmission-rug-pull-check.html","transmission-solana-memecoin-warning-signs.html","transmission-trump-family-memecoins.html","transmission-wallet-security-red-flags.html","transmission-zombie-fiction-rpg-guide.html","zombcash-buying-guide.html","whitepaper.html","gallery.html","zombcash-market-data.html","transmission-liquidity-is-not-market-cap.html","the-city-went-quiet-raven-outbreak.html"]),
    hi: new Set(["about.html","memecoin-promotion-platforms-comparison.html","buy-zombcash.html","index.html","outbreak-transmission.html","solana-memecoin-research-guide.html","survivor-field-manual.html","transmission-last-backup-ai-apocalypse.html","transmission-memecoin-graveyard.html","transmission-memecoin-knowledge-business.html","transmission-rug-pull-check.html","transmission-solana-memecoin-warning-signs.html","transmission-wallet-security-red-flags.html","transmission-zombie-fiction-rpg-guide.html","zombcash-buying-guide.html","transmission-trump-family-memecoins.html","whitepaper.html","gallery.html","zombcash-market-data.html","transmission-liquidity-is-not-market-cap.html","the-city-went-quiet-raven-outbreak.html"])
  };
  const target = (href) => {
    const parts = location.pathname.split('/').filter(Boolean);
    const pathLocale = parts.length && supportedLocaleSet.has(parts[0]) ? parts[0] : '';
    const params = new URLSearchParams(location.search);
    const queryLocale = params.get('lang') || '';
    // A recognized locale path takes precedence over ?lang= on mixed URLs such as /de/?lang=fr.
    const locale = pathLocale || (supportedLocaleSet.has(queryLocale) ? queryLocale : 'en');
    const source = new URL(href, location.origin);
    const destinationPath = source.pathname.split('/').filter(Boolean);
    const destinationLocale = destinationPath.length && supportedLocaleSet.has(destinationPath[0]) ? destinationPath[0] : '';
    const key = (destinationPath.slice(destinationLocale ? 1 : 0).pop() || 'index.html').toLowerCase();
    const suffix = source.hash;
    if (locale === 'en') {
      if (destinationLocale) {
        source.pathname = '/' + destinationPath.slice(1).join('/');
        if (!source.pathname || source.pathname === '') source.pathname = '/';
      }
      source.searchParams.delete('lang');
      return source.pathname + source.search + suffix;
    }
    if (localizedPagesByLocale[locale]?.has(key)) {
      const localizedPath = key === 'index.html' ? '/' + locale + '/' : '/' + locale + '/' + key;
      return localizedPath + source.search + suffix;
    }
    source.searchParams.set('lang', locale);
    return source.pathname + source.search + suffix;
  };
  const brandHref = target(isHome ? '/#home' : '/');

  header.classList.add('zombcash-shared-header');
  header.innerHTML =
    '<a class="zsh-brand notranslate" translate="no" href="' + brandHref + '" aria-label="ZOMBIECASH HOME">' +
      '<span class="zsh-mark" aria-hidden="true">☣</span>' +
      '<span class="zsh-brand-copy">ZOMBIE<span class="zsh-green">CASH</span><small>THE UNDEAD INTERNET</small></span>' +
    '</a>' +
    '<button class="zsh-menu-toggle" type="button" aria-label="OPEN NAVIGATION" aria-controls="zsh-navigation" aria-expanded="false"><span aria-hidden="true">☰</span><span class="zsh-menu-label">MENU</span></button>' +
    '<nav id="zsh-navigation" class="zsh-nav" aria-label="MAIN NAVIGATION">' +
      labels.map(([label, href, id]) => {
        const navPathParts = location.pathname.split('/').filter(Boolean);
        const navPathLocale = navPathParts.length && supportedLocaleSet.has(navPathParts[0]) ? navPathParts[0] : '';
        const navQueryLocale = new URLSearchParams(location.search).get('lang') || '';
        const navLocale = navPathLocale || (supportedLocaleSet.has(navQueryLocale) ? navQueryLocale : 'en');
        const destination = id === 'whitepaper'
          ? (navLocale !== 'en' && localizedPagesByLocale[navLocale]?.has('whitepaper.html') ? '/' + navLocale + '/whitepaper.html' : '/whitepaper.html')
          : target(href);
        const active = (id === 'manual' && file === 'survivor-field-manual.html') ||
          (id === 'whitepaper' && file === 'whitepaper.html') ||
          (id === 'market-data' && file === 'zombcash-market-data.html') ||
          (id === 'vote' && file === 'crew-vote.html') ||
          (id === 'arcade' && file === 'arcade.html') ||
          (id === 'gallery' && file === 'gallery.html') ||
          (id === 'maker' && file === 'zombie-maker.html') ||
          (id === 'hub' && file === 'survivor-hub.html') ||
          (id === 'transmission' && file === 'outbreak-transmission.html') ||
          (id === 'lottery' && file === 'roulette.html') ||
          (id === 'buy' && file === 'buy-zombcash.html');
        return '<a href="' + destination + '"' + (active ? ' aria-current="page"' : '') + '>' + label + '</a>';
      }).join('') +
    '</nav>' +
    '<div class="zsh-actions">' +
      (!isHome ? '<a class="zsh-home home-return-button" href="' + target('/') + '"><span aria-hidden="true">←</span> BACK TO HOME</a>' : '') +
      '<div class="zsh-language-slot"></div>' +
      (loginButton ? '<span class="zsh-preserved-login-slot"></span>' : '<button class="zsh-login-button" type="button" data-zsh-login>LOGIN WITH TELEGRAM</button>') +
    '</div>';

  const actions = header.querySelector('.zsh-actions');
  const languageSlot = header.querySelector('.zsh-language-slot');
  const homeButton = header.querySelector('.zsh-home.home-return-button');
  if (homeButton && actions && languageSlot && homeButton.parentElement !== actions) {
    actions.insertBefore(homeButton, languageSlot);
  }

  const loginSlot = header.querySelector('.zsh-preserved-login-slot');
  if (loginButton && loginSlot) {
    loginButton.classList.add('zsh-login-button');
    loginButton.removeAttribute('data-i18n');
    loginButton.textContent = 'LOGIN WITH TELEGRAM';
    loginSlot.replaceWith(loginButton);
  }

  // Load the same two typefaces on pages whose legacy templates did not import them.
  if (!document.querySelector('link[data-zsh-fonts]')) {
    const fonts = document.createElement('link');
    fonts.rel = 'stylesheet';
    fonts.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Orbitron:wght@400;500;600;700;800&family=Rajdhani:wght@400;500;600;700&display=swap';
    fonts.setAttribute('data-zsh-fonts', 'true');
    document.head.append(fonts);
  }

  const style = document.createElement('style');
  style.id = 'zombcash-shared-navigation-style';
  style.textContent = `
    header.zombcash-shared-header{
      position:sticky!important;top:0!important;z-index:10000!important;
      display:grid!important;grid-template-columns:auto minmax(0,1fr) auto!important;
      align-items:center!important;gap:clamp(10px,1.25vw,20px)!important;
      width:100%!important;max-width:none!important;min-width:0!important;min-height:76px!important;height:auto!important;
      margin:0!important;margin-inline:0!important;padding:12px clamp(16px,3vw,48px)!important;
      border:0!important;border-bottom:1px solid #9bff4533!important;
      background:#050907f5!important;backdrop-filter:blur(12px)!important;
      box-sizing:border-box!important;isolation:isolate;
    }
    header.zombcash-shared-header *{box-sizing:border-box}
    header.zombcash-shared-header .zsh-brand{
      display:flex!important;align-items:center!important;gap:10px!important;min-width:0!important;
      flex:0 0 auto!important;color:#edf5e5!important;text-decoration:none!important;
    }
    header.zombcash-shared-header .zsh-mark{
      display:grid!important;place-items:center!important;flex:0 0 42px!important;
      width:42px!important;height:42px!important;border:1px solid #9bff45!important;border-radius:8px!important;
      color:#9bff45!important;font:400 24px/1 system-ui,sans-serif!important;
      box-shadow:inset 0 0 18px #9bff4518;
    }
    header.zombcash-shared-header .zsh-brand-copy{
      display:block!important;color:#edf5e5!important;font:800 15px/1.2 Orbitron,system-ui,sans-serif!important;
      letter-spacing:-.35px!important;white-space:nowrap!important;
    }
    header.zombcash-shared-header .zsh-green{color:#9bff45!important}
    header.zombcash-shared-header .zsh-brand-copy small{
      display:block!important;margin-top:4px!important;color:#9aa797!important;
      font:600 7px/1.3 Orbitron,system-ui,sans-serif!important;letter-spacing:1.6px!important;white-space:nowrap!important;
    }
    header.zombcash-shared-header .zsh-nav{
      position:absolute!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;
      display:flex!important;align-items:center!important;justify-content:center!important;
      gap:clamp(8px,.85vw,15px)!important;min-width:0!important;max-width:calc(100% - 600px)!important;
      margin:0!important;padding:0!important;border:0!important;background:transparent!important;
      flex-wrap:nowrap!important;overflow:visible!important;max-height:none!important;
    }
    header.zombcash-shared-header .zsh-nav>a{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      flex:0 1 auto!important;min-width:0!important;min-height:32px!important;width:auto!important;
      margin:0!important;padding:6px 0!important;border:0!important;background:transparent!important;
      color:#c5d0c3!important;text-decoration:none!important;
      font:600 clamp(7px,.58vw,9px)/1.25 Orbitron,system-ui,sans-serif!important;
      letter-spacing:0!important;white-space:nowrap!important;overflow-wrap:normal!important;word-break:normal!important;
    }
    header.zombcash-shared-header .zsh-nav>a:hover,
    header.zombcash-shared-header .zsh-nav>a[aria-current="page"]{color:#9bff45!important}
    header.zombcash-shared-header .zsh-nav>a[aria-current="page"]{border-bottom:1px solid #9bff45!important;text-decoration:none!important;box-shadow:none!important;background-image:none!important}
    header.zombcash-shared-header .zsh-nav>a,header.zombcash-shared-header .zsh-nav>a::before,header.zombcash-shared-header .zsh-nav>a::after{box-shadow:none!important;text-decoration:none!important;background-image:none!important}
    header.zombcash-shared-header .zsh-nav>a::before,header.zombcash-shared-header .zsh-nav>a::after{content:none!important}
    header.zombcash-shared-header .zsh-actions>.zsh-home{
      flex:0 0 auto!important;min-height:30px!important;padding:7px 9px!important;
      border:1px solid #42613a!important;color:#b8f992!important;font-size:7px!important;
    }
    header.zombcash-shared-header .zsh-actions{
      display:flex!important;align-items:center!important;justify-content:flex-end!important;
      gap:8px!important;min-width:0!important;flex:0 0 auto!important;
    }
    header.zombcash-shared-header .zsh-actions .survivor-entry-button,
    header.zombcash-shared-header .zsh-actions .top-cta{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      flex:0 0 auto!important;min-height:36px!important;margin:0!important;padding:9px 12px!important;
      border:1px solid #42613a!important;background:#0b120c!important;color:#b8f992!important;
      font:700 9px/1.2 Orbitron,system-ui,sans-serif!important;white-space:nowrap!important;
    }
    header.zombcash-shared-header .zsh-cta{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;
      flex:0 0 auto!important;min-height:34px!important;max-width:none!important;margin:0!important;padding:9px 10px!important;
      border:1px solid #42613a!important;border-radius:0!important;background:#0b120c!important;
      color:#b8f992!important;text-decoration:none!important;
      font:700 8px/1.2 Orbitron,system-ui,sans-serif!important;white-space:nowrap!important;overflow-wrap:normal!important;
    }
    header.zombcash-shared-header .zsh-cta:hover{border-color:#9bff45!important;color:#d4ffc0!important}
    header.zombcash-shared-header .zsh-language-slot{order:2!important;display:flex!important;align-items:center!important;flex:0 0 auto!important}
    header.zombcash-shared-header .language-switcher{position:relative!important;display:inline-flex!important;flex:0 0 auto!important;margin:0!important;z-index:10002!important}
    header.zombcash-shared-header .language-trigger{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;
      min-width:58px!important;min-height:34px!important;margin:0!important;padding:8px 9px!important;
      border:1px solid #426341!important;border-radius:0!important;background:#0b120c!important;
      color:#b8f992!important;font:700 9px/1.2 Orbitron,system-ui,sans-serif!important;white-space:nowrap!important;cursor:pointer;
    }
    header.zombcash-shared-header .language-menu{top:calc(100% + 8px)!important;right:0!important;z-index:10050!important}
    header.zombcash-shared-header .zsh-menu-toggle{display:none!important}
    header.zombcash-shared-header .zsh-login-button{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:32px!important;
      padding:7px 9px!important;border:1px solid #42613a!important;background:#0b120c!important;color:#b8f992!important;
      font:700 8px/1.2 Orbitron,system-ui,sans-serif!important;white-space:nowrap!important;cursor:pointer;
    }
    header.zombcash-shared-header .zsh-login-slot{display:flex!important;align-items:center!important}
    /* One shared control system: back, language and account buttons always align. */
    header.zombcash-shared-header .zsh-actions>.zsh-home,
    header.zombcash-shared-header .zsh-actions .language-trigger,
    header.zombcash-shared-header .zsh-actions .survivor-entry-button,
    header.zombcash-shared-header .zsh-actions .top-cta,
    header.zombcash-shared-header .zsh-actions .zsh-login-button{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      box-sizing:border-box!important;height:36px!important;min-height:36px!important;
      margin:0!important;padding:0 12px!important;border:1px solid #42613a!important;
      border-radius:2px!important;background:#0b120c!important;color:#b8f992!important;
      font:700 8px/1 Orbitron,system-ui,sans-serif!important;letter-spacing:.1px!important;
      white-space:nowrap!important;vertical-align:middle!important;
    }
    /* Back-to-home uses the same arrow, spacing, sizing and alignment on every page. */
    header.zombcash-shared-header .zsh-actions>.zsh-home{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      gap:6px!important;white-space:nowrap!important;text-indent:0!important;
    }
    header.zombcash-shared-header .zsh-actions>.zsh-home>span[aria-hidden="true"]{
      display:inline-block!important;position:static!important;flex:0 0 auto!important;
      width:auto!important;height:auto!important;margin:0!important;padding:0!important;
      font:700 12px/1 Arial,sans-serif!important;line-height:1!important;
      opacity:1!important;visibility:visible!important;transform:none!important;
    }
    header.zombcash-shared-header .zsh-actions>.zsh-home,
    header.zombcash-shared-header .zsh-actions .survivor-entry-button,
    header.zombcash-shared-header .zsh-actions .top-cta,
    header.zombcash-shared-header .zsh-actions .zsh-login-button{cursor:pointer;text-decoration:none!important}
    /* Registration CTA: use the shared navigation button component, not legacy page .top-cta styling. */
    header.zombcash-shared-header .zsh-actions .zsh-login-button{
      appearance:none!important;-webkit-appearance:none!important;display:inline-flex!important;
      align-items:center!important;justify-content:center!important;box-sizing:border-box!important;
      flex:0 0 auto!important;width:auto!important;min-width:max-content!important;height:36px!important;min-height:36px!important;
      margin:0!important;padding:0 12px!important;border:1px solid #42613a!important;border-radius:2px!important;
      background:#0b120c!important;color:#b8f992!important;box-shadow:none!important;
      font:700 8px/1 Orbitron,system-ui,sans-serif!important;letter-spacing:.1px!important;
      text-align:center!important;text-decoration:none!important;text-transform:none!important;
      white-space:nowrap!important;overflow:visible!important;overflow-wrap:normal!important;
    }
    /* Back to Home first, language selector second, registration CTA at far right. */
    header.zombcash-shared-header .zsh-actions>.zsh-home{order:1!important}
    header.zombcash-shared-header .zsh-actions .zsh-language-slot{order:2!important}
    header.zombcash-shared-header .zsh-actions .zsh-login-button{order:3!important}
    header.zombcash-shared-header .zsh-actions>.zsh-home:hover,
    header.zombcash-shared-header .zsh-actions .language-trigger:hover,
    header.zombcash-shared-header .zsh-actions .survivor-entry-button:hover,
    header.zombcash-shared-header .zsh-actions .top-cta:hover,
    header.zombcash-shared-header .zsh-actions .zsh-login-button:hover{
      border-color:#9bff45!important;color:#d4ffc0!important;background:#101b12!important;
    }
    header.zombcash-shared-header .zsh-menu-label{font:700 8px Orbitron,system-ui,sans-serif;letter-spacing:1px}

    /* Shared page typography: consistent hierarchy beneath the common header.
       Keep the home hero and interactive game canvases untouched. */
    /* Strong shared heading rules intentionally outrank legacy per-page IDs. */
    body.zsh-inner-page h1:not(#zsh-never-h1){
      font-family:Orbitron,Arial,sans-serif!important;font-weight:800!important;
      font-size:clamp(38px,4.2vw,58px)!important;
      line-height:1.08!important;letter-spacing:-.035em!important;
      margin:12px 0 18px!important;max-width:100%!important;
      overflow-wrap:anywhere;
    }
    body.zsh-inner-page h2:not(#zsh-never-h2){
      font-family:Orbitron,Arial,sans-serif!important;font-weight:700!important;
      font-size:clamp(21px,2vw,28px)!important;line-height:1.25!important;
      letter-spacing:-.025em!important;
    }
    body.zsh-inner-page h3:not(#zsh-never-h3){
      font-family:Orbitron,Arial,sans-serif!important;font-weight:700!important;
      font-size:clamp(15px,1.35vw,19px)!important;line-height:1.3!important;
    }
    body.zsh-inner-page p:not(.keep-compact),
    body.zsh-inner-page li{
      font-family:Rajdhani,Arial,sans-serif!important;font-size:18px!important;line-height:1.55!important;
    }
    body.zsh-inner-page .eyebrow,
    body.zsh-inner-page .kicker{
      font-family:Orbitron,Arial,sans-serif!important;font-size:11px!important;
      font-weight:700!important;letter-spacing:.16em!important;line-height:1.5!important;
      margin-top:24px!important;margin-bottom:10px!important;
    }
    body.zsh-inner-page .lead{
      font-family:Rajdhani,Arial,sans-serif!important;font-size:clamp(18px,1.55vw,21px)!important;
      line-height:1.55!important;max-width:820px!important;margin:0 0 22px!important;
    }
    body main .eyebrow{
      margin-top:24px!important;margin-bottom:10px!important;
      font-size:clamp(10px,.82vw,12px)!important;line-height:1.5!important;
      letter-spacing:.16em!important;
    }
    body main .lead{
      font-size:clamp(18px,1.55vw,21px)!important;
      line-height:1.55!important;max-width:820px!important;
      margin:0 0 22px!important;
    }
    body.zsh-inner-page main{
      min-width:0!important;
      font-family:Rajdhani,Arial,sans-serif!important;
      font-size:18px;
      line-height:1.6;
    }
    body.zsh-inner-page main h1,
    body.zsh-inner-page h2,
    body.zsh-inner-page h3,
    body.zsh-inner-page h4{
      font-family:Orbitron,Arial,sans-serif!important;
      font-weight:700!important;
      letter-spacing:-.025em;
    }
    body.zsh-inner-page h2{font-size:clamp(22px,2.2vw,30px)!important;line-height:1.25!important}
    body.zsh-inner-page h3{font-size:clamp(16px,1.5vw,20px)!important;line-height:1.3!important}
    body.zsh-inner-page main p,
    body.zsh-inner-page main li{font-family:Rajdhani,Arial,sans-serif!important;font-size:18px;line-height:1.6}
    body.zsh-inner-page main .wrap,
    body.zsh-inner-page main .container,
    body.zsh-inner-page main .page-wrap{box-sizing:border-box;max-width:min(1240px,calc(100% - 48px));margin-left:auto;margin-right:auto}
    /* Normalize legacy page-level wrappers to the same content width. */
    body.zsh-inner-page>.wrap,
    body.zsh-inner-page>.container,
    body.zsh-inner-page>.page-wrap{
      box-sizing:border-box!important;width:min(1240px,calc(100% - 48px))!important;
      max-width:1240px!important;margin-left:auto!important;margin-right:auto!important;
    }
    body.zsh-inner-page main .eyebrow,
    body.zsh-inner-page main .kicker{font-family:Orbitron,Arial,sans-serif!important;font-size:11px!important;font-weight:700!important;letter-spacing:.16em!important;line-height:1.5!important}
    body.zsh-inner-page main .lead{font-family:Rajdhani,Arial,sans-serif!important;font-size:clamp(18px,1.55vw,21px)!important;line-height:1.55!important;max-width:820px!important;margin:0 0 22px!important}
    @media(max-width:1450px){
      header.zombcash-shared-header .zsh-nav{display:none!important}
      header.zombcash-shared-header .zsh-nav.zsh-open{display:flex!important}
      header.zombcash-shared-header .zsh-menu-toggle{display:inline-flex!important;position:absolute!important;left:18px!important;top:50%!important;transform:translateY(-50%)!important;z-index:2!important}
      header.zombcash-shared-header .zsh-brand{margin-left:54px!important}
    }
    @media(max-width:650px){
      body.zsh-inner-page h1{font-size:clamp(32px,8vw,44px)!important;line-height:1.08!important}
      body main .eyebrow{margin-top:18px!important}
      body main .lead{font-size:18px!important}
    }

    @media(min-width:1451px) and (max-width:1700px){
      header.zombcash-shared-header{grid-template-columns:minmax(0,1fr) auto!important;gap:10px!important;padding:10px 18px!important}
      header.zombcash-shared-header .zsh-actions{grid-column:2;grid-row:1}
      header.zombcash-shared-header .zsh-nav{
        position:static!important;left:auto!important;top:auto!important;transform:none!important;
        display:flex!important;grid-column:1/-1;grid-row:2;justify-content:flex-start!important;
        align-items:stretch!important;flex-wrap:wrap!important;gap:4px 16px!important;
        max-width:100%!important;padding:10px 0 3px!important;border-top:1px solid #9bff4520!important;
      }
      header.zombcash-shared-header .zsh-nav.zsh-open{display:flex!important}
      header.zombcash-shared-header .zsh-menu-toggle{
        display:none!important;grid-column:1;grid-row:1;align-items:center!important;justify-content:center!important;
        gap:8px!important;min-width:42px!important;min-height:36px!important;margin:0!important;padding:7px 10px!important;
        border:1px solid #42613a!important;border-radius:0!important;background:#0b120c!important;color:#9bff45!important;
        font-size:17px!important;cursor:pointer;
      }
      header.zombcash-shared-header .zsh-brand{grid-column:1;grid-row:1;justify-self:start;margin-left:0!important}
      header.zombcash-shared-header .zsh-menu-toggle{position:absolute;left:18px;top:50%;transform:translateY(-50%);z-index:2}
      header.zombcash-shared-header .zsh-brand{margin-left:0!important}
      header.zombcash-shared-header .zsh-nav>a{flex:0 0 auto!important;min-height:34px!important;padding:8px 0!important;font-size:8px!important}
      header.zombcash-shared-header .zsh-home{flex-basis:auto!important;width:auto!important}
      header.zombcash-shared-header .language-trigger{min-width:50px!important;padding:7px!important;font-size:8px!important}
      header.zombcash-shared-header .zsh-login-slot{width:100%}
    }
    @media(max-width:650px){
      header.zombcash-shared-header{min-height:68px!important;padding:9px 12px!important;gap:8px!important}
      header.zombcash-shared-header .zsh-brand{gap:7px!important;margin-left:44px!important}
      header.zombcash-shared-header .zsh-mark{flex-basis:34px!important;width:34px!important;height:34px!important;font-size:20px!important}
      header.zombcash-shared-header .zsh-brand-copy{font-size:12px!important}
      header.zombcash-shared-header .zsh-brand-copy small{font-size:6px!important;letter-spacing:1px!important}
      header.zombcash-shared-header .zsh-actions{gap:5px!important}
      header.zombcash-shared-header .zsh-menu-toggle{min-height:34px!important;padding:7px 8px!important}
      header.zombcash-shared-header .zsh-nav{gap:4px 13px!important;max-height:70vh!important;overflow-y:auto!important}
      header.zombcash-shared-header .zsh-nav>a{font-size:8px!important}
      header.zombcash-shared-header .language-trigger{min-width:44px!important;min-height:32px!important;font-size:8px!important}
      header.zombcash-shared-header .zsh-actions>.zsh-home,
      header.zombcash-shared-header .zsh-actions .language-trigger,
      header.zombcash-shared-header .zsh-actions .survivor-entry-button,
      header.zombcash-shared-header .zsh-actions .top-cta,
      header.zombcash-shared-header .zsh-actions .zsh-login-button{
        height:36px!important;min-height:36px!important;padding:0 9px!important;font-size:8px!important;
      }
      header.zombcash-shared-header .language-menu{width:180px!important;max-width:calc(100vw - 20px)!important}
    }
    /* Desktop: reserve separate grid columns for brand, navigation and actions.
       Avoid absolute centering, which let long navigation labels overlap the buttons. */
    @media(min-width:1701px){
      header.zombcash-shared-header{position:sticky!important;left:auto!important;transform:none!important;width:100vw!important;max-width:100vw!important;margin-left:calc(50% - 50vw)!important;margin-right:0!important;grid-template-columns:auto minmax(0,1fr) auto!important;gap:clamp(8px,.7vw,12px)!important}
      header.zombcash-shared-header .zsh-nav{position:static!important;left:auto!important;top:auto!important;transform:none!important;display:flex!important;grid-column:2!important;grid-row:1!important;justify-self:center!important;justify-content:center!important;flex-wrap:nowrap!important;gap:clamp(5px,.45vw,8px)!important;width:auto!important;max-width:100%!important;min-width:0!important;overflow:visible!important}
      header.zombcash-shared-header .zsh-nav>a{font-size:clamp(7px,.48vw,8px)!important;flex:0 1 auto!important}
      header.zombcash-shared-header .zsh-brand{grid-column:1!important;grid-row:1!important}
      header.zombcash-shared-header .zsh-actions{grid-column:3!important;grid-row:1!important;gap:5px!important}
      header.zombcash-shared-header .zsh-actions>.zsh-home,
      header.zombcash-shared-header .zsh-actions .language-trigger,
      header.zombcash-shared-header .zsh-actions .zsh-login-button{padding-left:8px!important;padding-right:8px!important;font-size:7px!important}
    }
    @media(max-width:390px){
      header.zombcash-shared-header{grid-template-columns:minmax(0,1fr) auto!important;padding:8px!important}
      header.zombcash-shared-header .zsh-brand{margin-left:40px!important}
      header.zombcash-shared-header .zsh-brand-copy{font-size:11px!important}
      header.zombcash-shared-header .zsh-brand-copy small{letter-spacing:.5px!important}
    }

    /* FINAL SHARED HEADER OVERRIDE — one predictable two-row layout on every page. */
    header.zombcash-shared-header{
      display:grid!important;
      grid-template-columns:minmax(0,1fr) auto!important;
      grid-template-rows:auto auto!important;
      align-items:center!important;
      gap:0 14px!important;
      width:100vw!important;max-width:100vw!important;
      margin-left:calc(50% - 50vw)!important;margin-right:0!important;
      padding:12px clamp(14px,2.5vw,36px) 0!important;
      min-height:0!important;height:auto!important;
      overflow:visible!important;
    }
    header.zombcash-shared-header .zsh-brand{
      grid-column:1!important;grid-row:1!important;
      margin:0!important;justify-self:start!important;
    }
    header.zombcash-shared-header .zsh-actions{
      grid-column:2!important;grid-row:1!important;
      display:flex!important;justify-self:end!important;
      align-items:center!important;justify-content:flex-end!important;
      flex-wrap:nowrap!important;gap:8px!important;
    }
    /* Unified centered navigation: same button shape and spacing on every page. */
    header.zombcash-shared-header .zsh-nav{
      position:static!important;left:auto!important;top:auto!important;transform:none!important;
      grid-column:1/-1!important;grid-row:2!important;
      display:flex!important;align-items:center!important;justify-content:center!important;
      flex-wrap:wrap!important;gap:8px 10px!important;
      width:100%!important;max-width:100%!important;min-width:0!important;
      margin:10px 0 0!important;padding:12px 0 12px!important;
      border-top:1px solid #9bff4520!important;
      overflow:visible!important;overscroll-behavior:initial!important;
    }
    header.zombcash-shared-header .zsh-nav>a{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      flex:0 0 auto!important;min-width:0!important;min-height:34px!important;
      margin:0!important;padding:8px 11px!important;
      border:1px solid #314a30!important;border-radius:3px!important;
      background:linear-gradient(180deg,#101811,#090e0a)!important;
      color:#c5d0c3!important;text-decoration:none!important;
      font:700 clamp(7px,.58vw,9px)/1.2 Orbitron,system-ui,sans-serif!important;
      letter-spacing:.15px!important;white-space:nowrap!important;
      box-shadow:none!important;
    }
    header.zombcash-shared-header .zsh-nav>a:hover,
    header.zombcash-shared-header .zsh-nav>a[aria-current="page"]{
      border-color:#9bff45!important;background:#9bff4510!important;color:#9bff45!important;
    }
    header.zombcash-shared-header .zsh-nav>a[aria-current="page"]{
      box-shadow:inset 0 -2px 0 #9bff45!important;
    }
    /* Consistent action order on every page: Back to Home, language, registration at far right. */
    header.zombcash-shared-header .zsh-actions>.zsh-home{order:1!important}
    header.zombcash-shared-header .zsh-actions .zsh-language-slot{order:2!important}
    header.zombcash-shared-header .zsh-actions .zsh-login-button{order:3!important}
    body.zsh-inner-page>.wrap,
    body.zsh-inner-page>.container,
    body.zsh-inner-page>.page-wrap,
    body.zsh-inner-page>main>.wrap,
    body.zsh-inner-page>main>.container,
    body.zsh-inner-page>main>.page-wrap{
      box-sizing:border-box!important;
      width:min(1240px,calc(100% - 48px))!important;
      max-width:1080px!important;
      margin-left:auto!important;margin-right:auto!important;
    }
    body.zsh-inner-page main h1{
      font-family:Orbitron,Arial,sans-serif!important;
      font-size:clamp(36px,4.1vw,58px)!important;
      line-height:1.08!important;letter-spacing:-.035em!important;
      margin:12px 0 20px!important;
    }
    @media(max-width:900px){
      header.zombcash-shared-header{padding:10px 16px 0!important;gap:0 10px!important}
      header.zombcash-shared-header .zsh-actions{gap:5px!important}
      header.zombcash-shared-header .zsh-actions .zsh-login-button,
      header.zombcash-shared-header .zsh-actions .language-trigger,
      header.zombcash-shared-header .zsh-actions>.zsh-home{
        min-height:32px!important;height:auto!important;padding:7px 8px!important;font-size:7px!important;
      }
      header.zombcash-shared-header .zsh-nav{gap:14px!important;margin-top:8px!important;padding:8px 0!important}
    }
    @media(max-width:560px){
      /* Mobile navigation must stay inside the header and remain collapsed until MENU is tapped. */
      header.zombcash-shared-header{
        grid-template-columns:minmax(0,1fr)!important;
        grid-template-rows:auto auto auto!important;
        padding:10px 12px 0!important;
      }
      header.zombcash-shared-header .zsh-brand{grid-column:1!important;grid-row:1!important}
      header.zombcash-shared-header .zsh-actions{
        grid-column:1!important;grid-row:2!important;justify-self:start!important;
        flex-wrap:wrap!important;justify-content:flex-start!important;margin-top:9px!important;
      }
      header.zombcash-shared-header .zsh-menu-toggle{
        display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;
        position:absolute!important;right:12px!important;top:12px!important;min-height:36px!important;
        padding:8px 10px!important;border:1px solid #42613a!important;border-radius:2px!important;
        background:#0b120c!important;color:#b8f992!important;cursor:pointer!important;z-index:10003!important;
      }
      header.zombcash-shared-header .zsh-nav{
        position:static!important;left:auto!important;top:auto!important;transform:none!important;
        grid-column:1!important;grid-row:3!important;display:none!important;
        width:100%!important;max-width:none!important;min-width:0!important;
        flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;
        flex-wrap:nowrap!important;gap:0!important;margin:10px 0 12px!important;padding:6px!important;
        border:1px solid #263a2a!important;background:#080d09!important;overflow:visible!important;
      }
      header.zombcash-shared-header .zsh-nav.zsh-open{display:flex!important}
      header.zombcash-shared-header .zsh-nav>a{
        display:flex!important;width:100%!important;min-height:40px!important;padding:10px 12px!important;
        justify-content:flex-start!important;border-bottom:1px solid #1b2a1d!important;
        font-size:10px!important;white-space:normal!important;
      }
      header.zombcash-shared-header .zsh-nav>a:last-child{border-bottom:0!important}
      header.zombcash-shared-header .zsh-brand-copy{font-size:12px!important}
      body.zsh-inner-page main h1{font-size:clamp(30px,8vw,42px)!important}
      body.zsh-inner-page>.wrap,
      body.zsh-inner-page>.container,
      body.zsh-inner-page>.page-wrap,
      body.zsh-inner-page>main>.wrap,
      body.zsh-inner-page>main>.container,
      body.zsh-inner-page>main>.page-wrap{
        width:calc(100% - 24px)!important;
      }
    }

    /* FINAL EDGE-TO-EDGE CANVAS RULE: every page uses the same 24px desktop gutters.
       The main site uses the full viewport; only content is constrained to the shared width. */
    html, body { max-width:100%!important; }
    body.zsh-inner-page > main,
    body.zsh-inner-page > .wrap,
    body.zsh-inner-page > .container,
    body.zsh-inner-page > .page-wrap {
      box-sizing:border-box!important;
      width:calc(100% - 48px)!important;
      max-width:1440px!important;
      margin-left:auto!important;
      margin-right:auto!important;
    }
    body.zsh-inner-page > main > .wrap,
    body.zsh-inner-page > main > .container,
    body.zsh-inner-page > main > .page-wrap {
      box-sizing:border-box!important;
      width:100%!important;
      max-width:none!important;
      margin-left:auto!important;
      margin-right:auto!important;
    }
    body.zsh-inner-page > main > section,
    body.zsh-inner-page > main > article {
      box-sizing:border-box!important;
      width:100%!important;
      max-width:none!important;
      margin-left:auto!important;
      margin-right:auto!important;
    }
    @media(max-width:700px) {
      body.zsh-inner-page > main,
      body.zsh-inner-page > .wrap,
      body.zsh-inner-page > .container,
      body.zsh-inner-page > .page-wrap {
        width:calc(100% - 24px)!important;
      }
    }
    /* One centered page canvas across all inner pages. */
    /* SINGLE SITE-WIDE CONTENT GRID: identical left/right gutters on every page. */
    body.zsh-inner-page > main,
    body.zsh-inner-page > .wrap,
    body.zsh-inner-page > .container,
    body.zsh-inner-page > .page-wrap,
    body.zsh-inner-page > main > .wrap,
    body.zsh-inner-page > main > .container,
    body.zsh-inner-page > main > .page-wrap {
      box-sizing:border-box!important;
      width:calc(100% - 64px)!important;
      max-width:1440px!important;
      margin-left:auto!important;
      margin-right:auto!important;
    }
    body.zsh-inner-page main .wrap,
    body.zsh-inner-page main .container,
    body.zsh-inner-page main .page-wrap {
      box-sizing:border-box!important;
      width:100%!important;
      max-width:1440px!important;
      margin-left:auto!important;
      margin-right:auto!important;
    }
    body.zsh-inner-page main > section,
    body.zsh-inner-page main > article {
      box-sizing:border-box!important;
      max-width:100%!important;
    }
    @media(max-width:700px) {
      body.zsh-inner-page > main,
      body.zsh-inner-page > .wrap,
      body.zsh-inner-page > .container,
      body.zsh-inner-page > .page-wrap,
      body.zsh-inner-page > main > .wrap,
      body.zsh-inner-page > main > .container,
      body.zsh-inner-page > main > .page-wrap {
        width:calc(100% - 32px)!important;
      }
    }
    /* Reduce oversized side gutters while keeping every page on one shared canvas. */
    body.zsh-inner-page>main{
      box-sizing:border-box!important;width:min(1440px,calc(100% - 32px))!important;
      max-width:1440px!important;margin-left:auto!important;margin-right:auto!important;
    }
    body.zsh-inner-page>main>.wrap,body.zsh-inner-page>main>.container,body.zsh-inner-page>main>.page-wrap,
    body.zsh-inner-page>.wrap,body.zsh-inner-page>.container,body.zsh-inner-page>.page-wrap{
      box-sizing:border-box!important;width:min(1440px,calc(100% - 32px))!important;
      max-width:1440px!important;margin-left:auto!important;margin-right:auto!important;
    }
    body.zsh-inner-page main .wrap,body.zsh-inner-page main .container,body.zsh-inner-page main .page-wrap{
      box-sizing:border-box!important;max-width:1440px!important;margin-left:auto!important;margin-right:auto!important;
    }
    @media(max-width:900px){
      /* Final tablet/mobile override: never show the full desktop link grid by default. */
      header.zombcash-shared-header{
        position:sticky!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;
        grid-template-rows:auto auto auto!important;gap:0 10px!important;
        min-height:0!important;height:auto!important;padding:12px 16px 10px!important;
      }
      header.zombcash-shared-header .zsh-brand{grid-column:1!important;grid-row:1!important;min-height:42px!important}
      header.zombcash-shared-header .zsh-menu-toggle{
        display:inline-flex!important;grid-column:2!important;grid-row:1!important;
        position:static!important;left:auto!important;right:auto!important;top:auto!important;transform:none!important;
        align-self:center!important;justify-self:end!important;min-height:36px!important;padding:8px 10px!important;
        border:1px solid #42613a!important;border-radius:2px!important;background:#0b120c!important;
        color:#b8f992!important;font:700 9px/1 Orbitron,system-ui,sans-serif!important;z-index:10003!important;
      }
      header.zombcash-shared-header .zsh-actions{
        grid-column:1 / -1!important;grid-row:2!important;display:flex!important;flex-wrap:wrap!important;
        justify-content:flex-start!important;align-items:center!important;gap:7px!important;
        width:100%!important;margin:10px 0 0!important;
      }
      header.zombcash-shared-header .zsh-nav,
      header.zombcash-shared-header .zsh-nav.zsh-open{
        position:static!important;left:auto!important;top:auto!important;transform:none!important;
        grid-column:1 / -1!important;grid-row:3!important;display:none!important;
        flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;
        flex-wrap:nowrap!important;gap:0!important;width:100%!important;max-width:none!important;min-width:0!important;
        max-height:65vh!important;overflow-y:auto!important;overflow-x:hidden!important;
        margin:10px 0 0!important;padding:6px!important;border:1px solid #263a2a!important;
        background:#080d09!important;
      }
      header.zombcash-shared-header .zsh-nav.zsh-open{display:flex!important}
      header.zombcash-shared-header .zsh-nav>a{
        display:flex!important;flex:0 0 auto!important;justify-content:flex-start!important;
        width:100%!important;min-height:40px!important;padding:10px 12px!important;
        border-bottom:1px solid #1b2a1d!important;font-size:10px!important;white-space:normal!important;
      }
      header.zombcash-shared-header .zsh-nav>a:last-child{border-bottom:0!important}
      header.zombcash-shared-header .zsh-actions .zsh-login-button,
      header.zombcash-shared-header .zsh-actions .language-trigger,
      header.zombcash-shared-header .zsh-actions>.zsh-home{
        height:36px!important;min-height:36px!important;padding:0 10px!important;font-size:8px!important;
      }
    }
    @media(max-width:560px){
      body.zsh-inner-page>main,body.zsh-inner-page>main>.wrap,body.zsh-inner-page>main>.container,body.zsh-inner-page>main>.page-wrap,
      body.zsh-inner-page>.wrap,body.zsh-inner-page>.container,body.zsh-inner-page>.page-wrap{width:calc(100% - 20px)!important}
      header.zombcash-shared-header{padding:10px 12px!important}
      header.zombcash-shared-header .zsh-brand-copy{font-size:12px!important}
    }


    /* FINAL DESKTOP REPAIR: one predictable row on wide screens; no wrapped last link. */
    @media (min-width: 1200px) {
      header.zombcash-shared-header {
        display: grid !important;
        grid-template-columns: 220px minmax(0, 1fr) 205px !important;
        grid-template-rows: auto !important;
        align-items: center !important;
        gap: 12px !important;
        min-height: 76px !important;
        padding: 12px clamp(16px, 3vw, 48px) !important;
      }
      header.zombcash-shared-header .zsh-brand {
        grid-column: 1 !important;
        grid-row: 1 !important;
        margin: 0 !important;
        justify-self: start !important;
      }
      header.zombcash-shared-header .zsh-nav,
      header.zombcash-shared-header .zsh-nav.zsh-open {
        position: static !important;
        grid-column: 2 !important;
        grid-row: 1 !important;
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
        justify-content: center !important;
        gap: clamp(5px, .55vw, 9px) !important;
        width: 100% !important;
        max-width: none !important;
        min-width: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        overflow: visible !important;
        transform: none !important;
      }
      header.zombcash-shared-header .zsh-nav > a {
        flex: 0 1 auto !important;
        min-width: 0 !important;
        padding: 6px 0 !important;
        font-size: clamp(7px, .48vw, 8px) !important;
        letter-spacing: 0 !important;
        white-space: nowrap !important;
      }
      header.zombcash-shared-header .zsh-actions {
        grid-column: 3 !important;
        grid-row: 1 !important;
        display: flex !important;
        flex-wrap: nowrap !important;
        justify-content: flex-end !important;
        gap: 6px !important;
        width: auto !important;
        margin: 0 !important;
      }
      header.zombcash-shared-header .zsh-menu-toggle {
        display: none !important;
      }
    }
    /* Tablet landscape: use a menu instead of crushing the desktop navigation. */
    @media (min-width: 761px) and (max-width: 1199px) {
      header.zombcash-shared-header {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto !important;
        grid-template-rows: auto auto !important;
        gap: 8px 12px !important;
        padding: 12px 20px !important;
      }
      header.zombcash-shared-header .zsh-brand {
        grid-column: 1 !important;
        grid-row: 1 !important;
        margin: 0 !important;
      }
      header.zombcash-shared-header .zsh-menu-toggle {
        display: inline-flex !important;
        position: static !important;
        grid-column: 2 !important;
        grid-row: 1 !important;
        transform: none !important;
      }
      header.zombcash-shared-header .zsh-actions {
        grid-column: 1 / -1 !important;
        grid-row: 2 !important;
        justify-content: flex-start !important;
        margin: 0 !important;
      }
      header.zombcash-shared-header .zsh-nav,
      header.zombcash-shared-header .zsh-nav.zsh-open {
        position: static !important;
        grid-column: 1 / -1 !important;
        grid-row: 3 !important;
        display: none !important;
        flex-direction: column !important;
        align-items: stretch !important;
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 6px !important;
        border: 1px solid #263a2a !important;
        background: #080d09 !important;
        transform: none !important;
      }
      header.zombcash-shared-header .zsh-nav.zsh-open { display: flex !important; }
      header.zombcash-shared-header .zsh-nav > a {
        width: 100% !important;
        min-height: 38px !important;
        padding: 9px 12px !important;
        font-size: 10px !important;
        white-space: normal !important;
      }
    }


    /* Desktop primary navigation: clean text links, not a row of boxed buttons. */
    @media (min-width: 1200px) {
      header.zombcash-shared-header .zsh-nav > a {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-height: 28px !important;
        margin: 0 !important;
        padding: 5px 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        color: #c5d0c3 !important;
        font-size: clamp(8px, .58vw, 10px) !important;
        font-weight: 600 !important;
        letter-spacing: 0 !important;
        text-decoration: none !important;
      }
      header.zombcash-shared-header .zsh-nav > a:hover {
        color: #9bff45 !important;
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
      }
      header.zombcash-shared-header .zsh-nav > a[aria-current="page"] {
        color: #9bff45 !important;
        background: transparent !important;
        border: 0 !important;
        box-shadow: inset 0 -1px 0 #9bff45 !important;
      }
    }

    /* Mobile-only layout overrides. Desktop navigation remains unchanged. */
    @media (max-width: 760px) {
      header.zombcash-shared-header {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto !important;
        grid-template-rows: auto auto auto !important;
        gap: 0 10px !important;
        padding: 10px 12px 0 !important;
        min-height: 0 !important;
        height: auto !important;
      }
      header.zombcash-shared-header .zsh-brand {
        grid-column: 1 !important;
        grid-row: 1 !important;
        margin: 0 !important;
        min-width: 0 !important;
        justify-self: start !important;
      }
      header.zombcash-shared-header .zsh-menu-toggle {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        position: absolute !important;
        right: 12px !important;
        left: auto !important;
        top: 12px !important;
        transform: none !important;
        min-height: 36px !important;
        padding: 8px 10px !important;
        z-index: 10003 !important;
      }
      header.zombcash-shared-header .zsh-actions {
        grid-column: 1 / -1 !important;
        grid-row: 2 !important;
        justify-self: start !important;
        display: flex !important;
        flex-wrap: wrap !important;
        justify-content: flex-start !important;
        gap: 6px !important;
        margin: 9px 0 0 !important;
        min-width: 0 !important;
      }
      header.zombcash-shared-header .zsh-nav {
        position: static !important;
        left: auto !important;
        top: auto !important;
        transform: none !important;
        grid-column: 1 / -1 !important;
        grid-row: 3 !important;
        display: none !important;
        width: 100% !important;
        max-width: none !important;
        min-width: 0 !important;
        flex-direction: column !important;
        align-items: stretch !important;
        justify-content: flex-start !important;
        flex-wrap: nowrap !important;
        gap: 0 !important;
        margin: 10px 0 12px !important;
        padding: 6px !important;
        overflow-y: auto !important;
        max-height: 65vh !important;
      }
      header.zombcash-shared-header .zsh-nav.zsh-open { display: flex !important; }
      header.zombcash-shared-header .zsh-nav > a {
        display: flex !important;
        width: 100% !important;
        min-height: 40px !important;
        padding: 10px 12px !important;
        justify-content: flex-start !important;
        white-space: normal !important;
      }
      header.zombcash-shared-header .zsh-brand-copy { font-size: 12px !important; }
      header.zombcash-shared-header .zsh-brand-copy small {
        font-size: 6px !important;
        letter-spacing: 1px !important;
      }
      header.zombcash-shared-header .zsh-actions > .zsh-home,
      header.zombcash-shared-header .zsh-actions .language-trigger,
      header.zombcash-shared-header .zsh-actions .zsh-login-button {
        height: 34px !important;
        min-height: 34px !important;
        padding: 0 8px !important;
        font-size: 7px !important;
      }
    }
    @media (max-width: 390px) {
      header.zombcash-shared-header { padding: 9px 8px 0 !important; }
      header.zombcash-shared-header .zsh-brand { gap: 6px !important; }
      header.zombcash-shared-header .zsh-brand-copy { font-size: 11px !important; }
      header.zombcash-shared-header .zsh-actions { gap: 4px !important; }
      header.zombcash-shared-header .zsh-actions > .zsh-home,
      header.zombcash-shared-header .zsh-actions .language-trigger,
      header.zombcash-shared-header .zsh-actions .zsh-login-button {
        padding: 0 6px !important;
        font-size: 6px !important;
      }
    }



    /* 2026-10-23 layout repair: keep actions and nav in separate rows at common desktop widths. */
    header.zombcash-shared-header {
      width:100%!important;max-width:100%!important;
      margin-left:0!important;margin-right:0!important;
    }
    header.zombcash-shared-header .zsh-actions>.zsh-home{order:1!important}
    header.zombcash-shared-header .zsh-actions .zsh-language-slot{order:2!important}
    header.zombcash-shared-header .zsh-actions .zsh-login-button{order:3!important}
    @media (min-width:1200px) and (max-width:1699px) {
      header.zombcash-shared-header {
        grid-template-columns:minmax(0,1fr) auto!important;
        grid-template-rows:auto auto!important;
        align-items:center!important;gap:8px 16px!important;
        padding:12px clamp(16px,2.5vw,36px)!important;
      }
      header.zombcash-shared-header .zsh-brand{grid-column:1!important;grid-row:1!important}
      header.zombcash-shared-header .zsh-actions{
        grid-column:2!important;grid-row:1!important;flex-wrap:nowrap!important;
        width:auto!important;max-width:100%!important;justify-content:flex-end!important;
      }
      header.zombcash-shared-header .zsh-nav,
      header.zombcash-shared-header .zsh-nav.zsh-open {
        position:static!important;grid-column:1/-1!important;grid-row:2!important;
        display:flex!important;flex-direction:row!important;flex-wrap:wrap!important;
        justify-content:flex-start!important;align-items:center!important;
        gap:4px 18px!important;width:100%!important;max-width:100%!important;
        margin:0!important;padding:10px 0 2px!important;
        border-top:1px solid #9bff4520!important;transform:none!important;
      }
      header.zombcash-shared-header .zsh-menu-toggle{display:none!important}
    }

    /* LAST-WINS desktop override: primary nav items are text links, not boxed buttons. */
    @media (min-width: 1200px) {
      header.zombcash-shared-header .zsh-nav > a,
      header.zombcash-shared-header .zsh-nav > a::before,
      header.zombcash-shared-header .zsh-nav > a::after {
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        background-image: none !important;
        box-shadow: none !important;
        outline: 0 !important;
        text-decoration: none !important;
      }
      header.zombcash-shared-header .zsh-nav > a {
        min-height: 28px !important;
        padding: 5px 0 !important;
        color: #c5d0c3 !important;
        font-size: clamp(8px, .58vw, 10px) !important;
      }
      header.zombcash-shared-header .zsh-nav > a:hover {
        color: #9bff45 !important;
      }
      header.zombcash-shared-header .zsh-nav > a[aria-current="page"] {
        color: #9bff45 !important;
        box-shadow: inset 0 -1px 0 #9bff45 !important;
      }
    }


    /* Unified desktop header: brand and actions on row 1, centered navigation on row 2.
       Use the same layout at every desktop width and on every page using shared-nav.js. */
    @media (min-width: 1200px) {
      header.zombcash-shared-header {
        display:grid!important;
        grid-template-columns:minmax(0,1fr) auto minmax(0,1fr)!important;
        grid-template-rows:auto auto!important;
        align-items:center!important;
        gap:8px 16px!important;
        min-height:0!important;
        padding:12px clamp(16px,2.5vw,36px) 10px!important;
      }
      header.zombcash-shared-header .zsh-brand {
        grid-column:1!important;grid-row:1!important;justify-self:start!important;
      }
      header.zombcash-shared-header .zsh-actions {
        grid-column:3!important;grid-row:1!important;justify-self:end!important;
        display:flex!important;flex-wrap:nowrap!important;justify-content:flex-end!important;
      }
      header.zombcash-shared-header .zsh-nav,
      header.zombcash-shared-header .zsh-nav.zsh-open {
        position:static!important;left:auto!important;top:auto!important;transform:none!important;
        grid-column:1 / -1!important;grid-row:2!important;
        display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;
        justify-content:center!important;align-items:center!important;
        gap:clamp(8px,.9vw,16px)!important;width:100%!important;max-width:none!important;
        min-width:0!important;margin:0!important;padding:8px 0 0!important;
        border:0!important;border-top:1px solid #9bff4520!important;
        background:transparent!important;overflow:visible!important;
      }
      header.zombcash-shared-header .zsh-nav>a {
        flex:0 1 auto!important;width:auto!important;min-width:0!important;
        min-height:28px!important;padding:5px 0!important;
        font-size:clamp(8px,.58vw,10px)!important;white-space:nowrap!important;
      }
      header.zombcash-shared-header .zsh-menu-toggle {display:none!important}
    }


    /* Mobile hotfix 2026-10-24: keep language and account actions on the right. */
    @media (max-width: 760px) {
      header.zombcash-shared-header {
        grid-template-columns:minmax(0,1fr) auto!important;
        overflow:visible!important;
      }
      header.zombcash-shared-header .zsh-menu-toggle {
        position:static!important;
        grid-column:2!important;
        grid-row:1!important;
        justify-self:end!important;
        align-self:center!important;
        margin:0!important;
      }
      header.zombcash-shared-header .zsh-actions {
        grid-column:1 / -1!important;
        grid-row:2!important;
        width:100%!important;
        display:flex!important;
        flex-wrap:nowrap!important;
        align-items:center!important;
        justify-content:flex-end!important;
        gap:6px!important;
        margin:9px 0 0!important;
        min-width:0!important;
      }
      header.zombcash-shared-header .zsh-language-slot {
        order:2!important;display:flex!important;align-items:center!important;flex:0 0 auto!important;
      }
      header.zombcash-shared-header .zsh-actions>.zsh-home { order:1!important; }
      header.zombcash-shared-header .zsh-actions .zsh-login-button { order:3!important; }
      header.zombcash-shared-header .language-switcher {
        position:relative!important;flex:0 0 auto!important;max-width:none!important;
      }
      header.zombcash-shared-header .language-menu {
        position:absolute!important;top:calc(100% + 6px)!important;right:0!important;left:auto!important;
        width:min(220px, calc(100vw - 24px))!important;max-width:calc(100vw - 24px)!important;
        max-height:min(60vh, 360px)!important;overflow-y:auto!important;z-index:10050!important;
      }
      header.zombcash-shared-header .zsh-nav {
        position:static!important;left:auto!important;top:auto!important;transform:none!important;
        grid-column:1 / -1!important;grid-row:3!important;display:none!important;
        width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;
      }
      header.zombcash-shared-header .zsh-nav.zsh-open { display:flex!important; }
      html, body { max-width:100%; overflow-x:clip; }
    }
    @media (max-width: 390px) {
      header.zombcash-shared-header .zsh-actions { gap:4px!important; }
      header.zombcash-shared-header .zsh-actions>.zsh-home,
      header.zombcash-shared-header .zsh-actions .language-trigger,
      header.zombcash-shared-header .zsh-actions .zsh-login-button {
        padding-left:6px!important;padding-right:6px!important;font-size:6px!important;
      }
    }
  `;
  /* Ensure every page using the shared header gets the Telegram registration modal. */
  if (!document.querySelector('script[src*="survivor-auth.js"]')) {
    const authScript = document.createElement('script');
    authScript.src = '/survivor-auth.js?v=telegram-register-20261030-01';
    authScript.defer = true;
    document.head.append(authScript);
  }

  document.head.querySelector('#zombcash-shared-navigation-style')?.remove();
  document.head.append(style);

  const toggle = header.querySelector('.zsh-menu-toggle');
  const nav = header.querySelector('.zsh-nav');
  const menuAriaLabels = {
    de: ['Navigation öffnen', 'Navigation schließen'],
    fr: ['Ouvrir la navigation', 'Fermer la navigation'],
    it: ['Apri la navigazione', 'Chiudi la navigazione'],
    ja: ['ナビゲーションを開く', 'ナビゲーションを閉じる'],
    'zh-CN': ['打开导航', '关闭导航'],
    ru: ['Открыть навигацию', 'Закрыть навигацию'],
    tr: ['Gezinmeyi aç', 'Gezinmeyi kapat'],
    hi: ['नेविगेशन खोलें', 'नेविगेशन बंद करें']
  };
  const updateMenuToggleLabel = (open) => {
    const language = document.documentElement.lang || 'en';
    const labels = menuAriaLabels[language] || ['Open navigation', 'Close navigation'];
    toggle.setAttribute('aria-label', labels[open ? 1 : 0]);
  };
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('zsh-open');
    toggle.setAttribute('aria-expanded', String(open));
    updateMenuToggleLabel(open);
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      nav.classList.remove('zsh-open');
      toggle.setAttribute('aria-expanded', 'false');
      updateMenuToggleLabel(false);
    }
  });

  // Keep the generated navigation labels in sync with the existing nine-language selector.
  const navDictionary = {
    de:['STARTSEITE','FELDHANDBUCH','WHITEPAPER','MARKTDATEN','ÜBERTRAGUNGEN','CREW-ABSTIMMUNG','ÜBERLEBENDEN-ZENTRUM','ARCADE','ZOMBIE-GALERIE','ZOMBIE-GENERATOR','LOTTERIE','$ZOMBCASH KAUFEN','ZURÜCK ZUR STARTSEITE','MIT TELEGRAM REGISTRIEREN','TELEGRAM ÖFFNEN','MENÜ'],
    fr:['ACCUEIL','MANUEL DE TERRAIN','LIVRE BLANC','DONNÉES DE MARCHÉ','TRANSMISSIONS','VOTE DE L’ÉQUIPE','CENTRE DES SURVIVANTS','ARCADE','GALERIE ZOMBIE','CRÉATEUR DE ZOMBIES','LOTERIE','ACHETER $ZOMBCASH','RETOUR À L’ACCUEIL','S’INSCRIRE AVEC TELEGRAM','OUVRIR TELEGRAM','MENU'],
    it:['HOME','MANUALE DA CAMPO','WHITEPAPER','DATI DI MERCATO','TRASMISSIONI','VOTO DELLA CREW','CENTRO DEI SOPRAVVISSUTI','ARCADE','GALLERIA ZOMBIE','CREA ZOMBIE','LOTTERIA','COMPRA $ZOMBCASH','TORNA ALLA HOME','REGISTRATI CON TELEGRAM','APRI TELEGRAM','MENU'],
    ja:['ホーム','サバイバルガイド','ホワイトペーパー','マーケットデータ','ニュース配信','クルー投票','サバイバーハブ','アーケード','ゾンビギャラリー','ゾンビメーカー','宝くじ','$ZOMBCASHを購入','ホームに戻る','TELEGRAMで登録','Telegramを開く','メニュー'],
    'zh-CN':['首页','生存指南','白皮书','市场数据','疫情快讯','团队投票','幸存者中心','街机游戏','僵尸画廊','僵尸制作器','抽奖','购买 $ZOMBCASH','返回首页','使用 TELEGRAM 注册','打开 Telegram','菜单'],
    ru:['ГЛАВНАЯ','ПОЛЕВОЕ РУКОВОДСТВО','ДОКУМЕНТ ПРОЕКТА','РЫНОЧНЫЕ ДАННЫЕ','ТРАНСЛЯЦИЯ','ГОЛОСОВАНИЕ КОМАНДЫ','ЦЕНТР ВЫЖИВШИХ','АРКАДА','ГАЛЕРЕЯ ЗОМБИ','СОЗДАТЕЛЬ ЗОМБИ','ЛОТЕРЕЯ','КУПИТЬ $ZOMBCASH','НА ГЛАВНУЮ','РЕГИСТРАЦИЯ ЧЕРЕЗ TELEGRAM','ОТКРЫТЬ TELEGRAM','МЕНЮ'],
    tr:['ANA SAYFA','SAHA REHBERİ','PROJE TANITIM BELGESİ','PİYASA VERİLERİ','YAYINLAR','EKİP OYLAMASI','HAYATTA KALANLAR MERKEZİ','ARCADE','ZOMBİ GALERİSİ','ZOMBİ OLUŞTURUCU','ÇEKİLİŞ','$ZOMBCASH SATIN AL','ANA SAYFAYA DÖN','TELEGRAM İLE KAYIT OL','TELEGRAM’I AÇ','MENÜ'],
    hi:['होम','जीवन रक्षा मार्गदर्शिका','व्हाइटपेपर','बाज़ार डेटा','प्रसारण','टीम मतदान','सर्वाइवर केंद्र','आर्केड','ज़ॉम्बी गैलरी','ज़ॉम्बी मेकर','लॉटरी','$ZOMBCASH खरीदें','होम पर लौटें','TELEGRAM से पंजीकरण करें','TELEGRAM खोलें','मेन्यू']
  };
  function localizeNav(language) {
    const translated = navDictionary[language];
    const links = [...nav.querySelectorAll(':scope > a')].filter(link => !link.classList.contains('zsh-home'));
    labels.forEach((item, index) => {
      if (!links[index]) return;
      links[index].textContent = translated ? translated[index] : item[0];
      links[index].href = target(item[1]);
    });
    const back = header.querySelector('.zsh-actions > .zsh-home');
    if (back) back.innerHTML = '<span aria-hidden="true">←</span> ' + (translated ? translated[12] : 'BACK TO HOME');
    /* The approved site-wide account action is LOGIN WITH TELEGRAM on every page. */
    const menuLabel = header.querySelector('.zsh-menu-label');
    if (menuLabel) menuLabel.textContent = translated ? translated[15] : 'MENU';
    const brandSmall = header.querySelector('.zsh-brand-copy small');
    const brandLabels = {de:'DAS INTERNET DER UNTOTEN',fr:'L’INTERNET DES MORTS-VIVANTS',it:'INTERNET DEI NON MORTI',ja:'アンデッド・インターネット','zh-CN':'不死者互联网',ru:'ИНТЕРНЕТ НЕЖИТИ',tr:'YAŞAYAN ÖLÜLERİN İNTERNETİ',hi:'मरे हुओं का इंटरनेट'};
    if (brandSmall) brandSmall.textContent = language === 'en' ? 'THE UNDEAD INTERNET' : (brandLabels[language] || 'THE UNDEAD INTERNET');
    const menuToggle = header.querySelector('.zsh-menu-toggle');
    const menuAria = {de:['Navigation öffnen','Navigation schließen'],fr:['Ouvrir la navigation','Fermer la navigation'],it:['Apri la navigazione','Chiudi la navigazione'],ja:['ナビゲーションを開く','ナビゲーションを閉じる'],'zh-CN':['打开导航','关闭导航'],ru:['Открыть навигацию','Закрыть навигацию'],tr:['Gezinmeyi aç','Gezinmeyi kapat'],hi:['नेविगेशन खोलें','नेविगेशन बंद करें']};
    if (menuToggle) menuToggle.setAttribute('aria-label', (menuAria[language] || ['Open navigation','Close navigation'])[nav.classList.contains('zsh-open') ? 1 : 0]);
    const languageTrigger = header.querySelector('.language-trigger');
    const languageAria = {de:'Sprache auswählen',fr:'Choisir la langue',it:'Scegli la lingua',ja:'言語を選択','zh-CN':'选择语言',ru:'Выбрать язык',tr:'Dil seçin',hi:'भाषा चुनें'};
    if (languageTrigger) languageTrigger.setAttribute('aria-label', languageAria[language] || 'Choose language');
    const loginControl = header.querySelector('.zsh-login-button');
    if (loginControl) {
      const loginLabels = {de:'MIT TELEGRAM ANMELDEN',fr:'SE CONNECTER AVEC TELEGRAM',it:'ACCEDI CON TELEGRAM',ja:'TELEGRAMでログイン','zh-CN':'使用 TELEGRAM 登录',ru:'ВОЙТИ ЧЕРЕЗ TELEGRAM',tr:'TELEGRAM İLE GİRİŞ',hi:'TELEGRAM से लॉग इन करें'};
      loginControl.textContent = language === 'en' ? 'LOGIN WITH TELEGRAM' : (loginLabels[language] || 'LOGIN WITH TELEGRAM');
    }
  }
  const readLanguage = () => {
    // A localized URL is authoritative. Do not render English navigation first
    // just because localStorage contains a language selected on another page.
    const pathParts = location.pathname.split('/').filter(Boolean);
    const routeLanguage = pathParts.length >= 1 && navDictionary[pathParts[0]] ? pathParts[0] : 'en';
    // The URL is the source of truth for page language. A saved preference must
    // never translate an English-only article or tool page into another language.
    // Language switching should navigate to the matching localized URL instead.
    localizeNav(routeLanguage);
  };
  document.addEventListener('zombcash:languagechange', event => localizeNav(event.detail && event.detail.language || 'en'));
  readLanguage();

  // Shared fixed page-scroll controls: identical size and position on every page.
  const ensurePageScrollControls = () => {
    let controls = document.querySelector('.page-scroll-controls');
    if (!controls) {
      controls = document.createElement('div');
      controls.className = 'page-scroll-controls';
      controls.setAttribute('aria-label', 'Page navigation');
      controls.innerHTML = '<button type="button" id="scroll-to-top" aria-label="Scroll to top" title="Back to top"><span aria-hidden="true">↑</span></button><button type="button" id="scroll-to-bottom" aria-label="Scroll to bottom" title="Go to bottom"><span aria-hidden="true">↓</span></button>';
      document.body.appendChild(controls);
    }
    const topButton = controls.querySelector('#scroll-to-top');
    const bottomButton = controls.querySelector('#scroll-to-bottom');
    if (topButton && !topButton.dataset.zshBound) {
      topButton.dataset.zshBound = '1';
      topButton.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
    }
    if (bottomButton && !bottomButton.dataset.zshBound) {
      bottomButton.dataset.zshBound = '1';
      bottomButton.addEventListener('click', () => window.scrollTo({top:Math.max(document.documentElement.scrollHeight, document.body.scrollHeight), behavior:'smooth'}));
    }
    if (!document.getElementById('zsh-shared-scroll-controls-style')) {
      const style = document.createElement('style');
      style.id = 'zsh-shared-scroll-controls-style';
      style.textContent = '.page-scroll-controls{position:fixed!important;z-index:1000!important;right:clamp(12px,2vw,26px)!important;bottom:clamp(18px,4vh,34px)!important;display:flex!important;flex-direction:column!important;gap:8px!important;margin:0!important;padding:0!important}.page-scroll-controls button{box-sizing:border-box!important;width:42px!important;height:42px!important;min-width:42px!important;min-height:42px!important;max-width:42px!important;max-height:42px!important;display:grid!important;place-items:center!important;padding:0!important;border:1px solid #4a7044!important;border-radius:0!important;background:#0a140eef!important;color:#9bff45!important;font:700 24px/1 Rajdhani,sans-serif!important;box-shadow:0 5px 22px #0007!important;cursor:pointer!important;backdrop-filter:blur(10px);transition:background .18s,border-color .18s,color .18s,transform .18s}.page-scroll-controls button:hover{background:#9bff45!important;color:#071007!important;border-color:#9bff45!important;transform:translateY(-2px)}.page-scroll-controls button:focus-visible{outline:2px solid #9bff45!important;outline-offset:3px}.page-scroll-controls.is-content-overlap,.page-scroll-controls.is-ad-overlap{opacity:0!important;visibility:hidden!important;pointer-events:none!important}#zombcash-floating-assistant.zfa-content-overlap,#zombcash-floating-assistant.zfa-ad-overlap{pointer-events:none!important}#zombcash-floating-assistant.zfa-content-overlap .zfa-launch,#zombcash-floating-assistant.zfa-ad-overlap .zfa-launch{opacity:0!important;visibility:hidden!important;pointer-events:none!important}@media(min-width:761px){#zombcash-floating-assistant{right:max(92px,calc(env(safe-area-inset-right) + 86px))!important}}@media(max-width:760px){.page-scroll-controls{opacity:0!important;visibility:hidden!important;pointer-events:none!important;right:10px!important;bottom:14px!important}.page-scroll-controls.is-visible{opacity:1!important;visibility:visible!important;pointer-events:auto!important}.page-scroll-controls.is-ad-overlap,.page-scroll-controls.is-content-overlap{opacity:0!important;visibility:hidden!important;pointer-events:none!important}#zombcash-floating-assistant.zfa-content-overlap .zfa-launch{opacity:0!important;visibility:hidden!important;pointer-events:none!important}#zombcash-floating-assistant.zfa-ad-overlap .zfa-launch{opacity:0!important;visibility:hidden!important;pointer-events:none!important}.page-scroll-controls button{width:38px!important;height:38px!important;min-width:38px!important;min-height:38px!important;max-width:38px!important;max-height:38px!important;font-size:22px!important}}';
      document.head.appendChild(style);
    }
  };
  ensurePageScrollControls();
  // On mobile, keep fixed scroll controls out of the initial viewport so they
  // cannot cover the first ad or page content. Reveal them after the user scrolls.
  const updateScrollControlsVisibility = () => {
    const controls = document.querySelector('.page-scroll-controls');
    if (!controls) return;
    const mobile = window.matchMedia('(max-width: 760px)').matches;
    controls.classList.toggle('is-visible', mobile && window.scrollY > 220);
    const assistant = document.getElementById('zombcash-floating-assistant');
    const assistantLauncher = assistant && assistant.querySelector('.zfa-launch');
    const adSelectors = '.zc-adsterra-section, .outbreak-ad-unit, .arcade-ad-unit, .gallery-ad-unit, .field-manual-ad, .maker-ad-unit, .aads-ad-section, .zsh-shared-ad, aside[aria-label="Advertisement"], #frame, [data-aa], [id^="frame-"]';
    const intersectsAd = (element) => {
      if (!element || element.getClientRects().length === 0) return false;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      for (const ad of document.querySelectorAll(adSelectors)) {
        if (ad.contains(element) || ad.getClientRects().length === 0) continue;
        const adRect = ad.getBoundingClientRect();
        if (adRect.width > 0 && adRect.height > 0 &&
            rect.left < adRect.right && rect.right > adRect.left &&
            rect.top < adRect.bottom && rect.bottom > adRect.top) return true;
      }
      return false;
    };
    const intersectsTargets = (element, selector) => {
      if (!element || element.getClientRects().length === 0) return false;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      for (const target of document.querySelectorAll(selector)) {
        if (target.contains(element) || target.getClientRects().length === 0) continue;
        const targetRect = target.getBoundingClientRect();
        if (targetRect.width > 0 && targetRect.height > 0 && rect.left < targetRect.right && rect.right > targetRect.left && rect.top < targetRect.bottom && rect.bottom > targetRect.top) return true;
      }
      return false;
    };
    const controlsOverlapAd = intersectsAd(controls) && (!mobile || window.scrollY > 220);
    controls.classList.toggle('is-ad-overlap', controlsOverlapAd);
    const controlsOverlapGame = intersectsTargets(controls, 'iframe, canvas, .leaderboard, .player-progress, .leaderboard-card, .player-progress-grid');
    controls.classList.toggle('is-content-overlap', controlsOverlapGame);
    const assistantOverlapAd = intersectsAd(assistantLauncher);
    let assistantOverlapsContent = false;
    if (assistantLauncher && assistantLauncher.getClientRects().length) {
      const launcherRect = assistantLauncher.getBoundingClientRect();
      const contentSelectors = 'iframe, img, picture, video, canvas, button, [role="button"], input, select, textarea, .leaderboard, .player-progress, .leaderboard-card, .player-progress-grid';
      for (const target of document.querySelectorAll(contentSelectors)) {
        if (assistant.contains(target) || target.closest('header, nav, footer, .page-scroll-controls, #zombcash-floating-assistant, .zc-adsterra-section, .zsh-shared-ad, .outbreak-ad-unit, [data-aa], [id^="frame-"]') || target.getClientRects().length === 0) continue;
        const targetRect = target.getBoundingClientRect();
        if (targetRect.width > 0 && targetRect.height > 0 &&
            launcherRect.left < targetRect.right && launcherRect.right > targetRect.left &&
            launcherRect.top < targetRect.bottom && launcherRect.bottom > targetRect.top) {
          assistantOverlapsContent = true;
          break;
        }
      }
    }
    if (assistant) {
      assistant.classList.toggle('zfa-ad-overlap', assistantOverlapAd);
      assistant.classList.toggle('zfa-content-overlap', assistantOverlapsContent);
    }
  };
  if (!window.__zshScrollControlsVisibilityBound) {
    window.__zshScrollControlsVisibilityBound = true;
    window.addEventListener('scroll', updateScrollControlsVisibility, {passive:true});
    window.addEventListener('resize', updateScrollControlsVisibility, {passive:true});
    window.addEventListener('load', updateScrollControlsVisibility, {once:true});
    const adObserver = new MutationObserver(() => updateScrollControlsVisibility());
    adObserver.observe(document.body, {childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
    updateScrollControlsVisibility();
  }

  // Load the shared site assistant.
  const assistantScript = document.createElement('script');
  assistantScript.src = '/site-assistant.js?v=assistant-mobile-clear-20261027-1';
  assistantScript.defer = true;
  document.head.append(assistantScript);

  // language.js creates the switcher after DOMContentLoaded; place it in the same fixed slot.
  const moveLanguage = () => {
    const language = document.querySelector('.language-switcher');
    const slot = header.querySelector('.zsh-language-slot');
    if (language && slot && language.parentElement !== slot) slot.append(language);
  };
  moveLanguage();
  new MutationObserver(moveLanguage).observe(document.body, {childList:true,subtree:true});
})();

/* Shared page-level visit counters, loaded after the common navigation shell. */
(() => {
  if (new URLSearchParams(location.search).get('arcadeSnake') === '1') return;
  if (document.querySelector('script[data-zsh-page-footprint]')) return;
  const script = document.createElement('script');
  script.src = '/page-footprint.js?v=20261026-1';
  script.defer = true;
  script.dataset.zshPageFootprint = 'true';
  document.head.appendChild(script);
})();

/* Shared About link: visible from every page without crowding the main navigation. */
(() => {
  const localeCandidate = (location.pathname.split('/').filter(Boolean)[0] || 'en');
  const queryLocale = new URLSearchParams(location.search).get('lang');
  const supportedLocales = ['de','fr','it','ja','zh-CN','ru','tr','hi'];
  const locale = supportedLocales.includes(localeCandidate) ? localeCandidate : (supportedLocales.includes(queryLocale) ? queryLocale : 'en');
  const labels = {
    en: ['ABOUT & EDITORIAL POLICY','Independent community project','FOLLOW THE OUTBREAK'],
    de: ['ÜBER UNS & REDAKTIONSRICHTLINIEN','Unabhängiges Community-Projekt','DEM AUSBRUCH FOLGEN'],
    fr: ['À PROPOS & POLITIQUE ÉDITORIALE','Projet communautaire indépendant','SUIVRE L’ÉPIDÉMIE'],
    it: ['CHI SIAMO & POLITICA EDITORIALE','Progetto comunitario indipendente','SEGUI L’EPIDEMIA'],
    ja: ['概要・編集方針','独立したコミュニティプロジェクト','アウトブレイクをフォロー'],
    'zh-CN': ['关于我们与编辑政策','独立社区项目','关注疫情动态'],
    ru: ['О ПРОЕКТЕ И РЕДАКЦИОННОЙ ПОЛИТИКЕ','Независимый проект сообщества','СЛЕДИТЬ ЗА ВСПЫШКОЙ'],
    tr: ['HAKKIMIZDA VE YAYIN POLİTİKASI','Bağımsız topluluk projesi','SALGINI TAKİP ET'],
    hi: ['हमारे बारे में और संपादकीय नीति','स्वतंत्र समुदाय परियोजना','आउटब्रेक को फ़ॉलो करें']
  };
  const addAboutFooter = () => {
    if (!document.body || document.getElementById('zsh-about-footer')) return;
    const copy = labels[locale] || labels.en;
    const footer = document.createElement('footer');
    footer.id = 'zsh-about-footer';
    const aboutHref = locale === 'en' ? '/about.html' : '/' + locale + '/about.html';
    footer.innerHTML = '<div class="zsh-footer-about"><a href="' + aboutHref + '">' + copy[0] + '</a><span>ZombieCash · ' + copy[1] + '</span></div>' +
      '<nav class="zsh-footer-social" aria-label="' + copy[2] + '"><span class="zsh-footer-social-label">' + copy[2] + '</span>' +
      '<a href="https://discord.gg/9spZhHMhfQ" target="_blank" rel="noopener noreferrer" aria-label="ZombieCash on Discord">DISCORD</a>' +
      '<a href="https://www.pinterest.com/ZOMBCASH/" target="_blank" rel="noopener noreferrer" aria-label="ZombieCash on Pinterest">PINTEREST</a>' +
      '<a href="https://bsky.app/profile/zombcash.bsky.social" target="_blank" rel="noopener noreferrer" aria-label="ZombieCash on Bluesky">BLUESKY</a></nav>';
    const style = document.createElement('style');
    style.id = 'zsh-about-footer-style';
    style.textContent = '#zsh-about-footer{box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:18px;width:100%;max-width:100%;margin:36px 0 0;padding:18px clamp(16px,4vw,48px);border-top:1px solid #9bff4533;background:#050907;color:#8e9d8d;font:500 12px/1.5 Rajdhani,Arial,sans-serif}#zsh-about-footer .zsh-footer-about{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px}#zsh-about-footer a{color:#b8f992;text-decoration:none;font:700 10px/1.5 Orbitron,Arial,sans-serif;letter-spacing:.04em}#zsh-about-footer a:hover{color:#9bff45;text-decoration:underline}#zsh-about-footer span{color:#718071}#zsh-about-footer .zsh-footer-social{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px}#zsh-about-footer .zsh-footer-social-label{color:#718071;font:700 9px/1.5 Orbitron,Arial,sans-serif;letter-spacing:.08em}#zsh-about-footer .zsh-footer-social a{padding:5px 8px;border:1px solid #9bff4533;border-radius:2px;background:#09110c;font-size:9px;letter-spacing:.06em}#zsh-about-footer .zsh-footer-social a:hover{border-color:#9bff45;background:#101b12}@media(max-width:600px){#zsh-about-footer{flex-direction:column;align-items:flex-start;padding:16px}#zsh-about-footer .zsh-footer-social{gap:8px}}';
    document.head.appendChild(style);
    document.body.appendChild(footer);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addAboutFooter, {once:true});
  else addAboutFooter();
})();


/* Responsive Adsterra slot stays inside the original right-hand hero panel. */
(() => {
  'use strict';
  const path = location.pathname;
  const isHomepage = path === '/' || path === '/index.html' ||
    /^\/(?:de|fr|it|ja|zh-CN|ru|tr|hi)(?:\/index\.html)?\/?$/.test(path);

  const removeLegacyAds = () => {
    document.querySelectorAll('iframe[data-aa], iframe[src*="acceptable.a-ads.com"], script[src*="acceptable.a-ads.com"]').forEach(node => node.remove());
    if (!isHomepage) {
      document.querySelectorAll('.aads-ad-section, .zsh-shared-ad, .outbreak-ad-unit, .arcade-ad-unit, .gallery-ad-unit, .field-manual-ad, .maker-ad-unit, .zc-adsterra-section, [data-zombcash-ad-slot]').forEach(node => node.remove());
      document.querySelectorAll('script[src*="bauval.org"]').forEach(node => node.remove());
    }
  };

  const fitHeroAd = () => {
    if (!isHomepage) return;
    const stage = document.querySelector('.zc-hero-ad-stage');
    const unit = document.querySelector('.zc-hero-ad-unit');
    if (!stage || !unit) return;
    const mobile = window.matchMedia('(max-width: 900px)').matches;
    const nativeWidth = mobile ? 320 : 728;
    const nativeHeight = mobile ? 50 : 90;
    // Measure the sponsor container, not the stage itself: the stage width is
    // set by this function, so reading it on resize would preserve the old
    // scaled width when moving between mobile and desktop breakpoints.
    const container = stage.parentElement;
    const available = Math.max(1, container ? container.clientWidth : nativeWidth);
    const scale = Math.min(1, available / nativeWidth);
    unit.style.width = nativeWidth + 'px';
    unit.style.minWidth = nativeWidth + 'px';
    unit.style.height = nativeHeight + 'px';
    unit.style.flexBasis = nativeWidth + 'px';
    unit.style.transform = 'scale(' + scale + ')';
    unit.style.transformOrigin = 'top center';
    const reservedWidth = nativeWidth * scale;
    const reservedHeight = nativeHeight * scale;
    // The homepage CSS uses !important to preserve the native 728x90/320x50
    // banner footprint. Apply the scaled dimensions with the same priority so
    // narrow hero columns keep the exact banner aspect ratio instead of being
    // forced back to a fixed 90px/50px height.
    stage.style.setProperty('width', reservedWidth + 'px', 'important');
    stage.style.setProperty('height', reservedHeight + 'px', 'important');
    stage.style.setProperty('min-height', reservedHeight + 'px', 'important');
    stage.style.setProperty('max-height', reservedHeight + 'px', 'important');
    stage.style.setProperty('flex', '0 0 ' + reservedHeight + 'px', 'important');
    stage.style.setProperty('flex-basis', reservedHeight + 'px', 'important');
    unit.style.flexShrink = '0';
  };

  const run = () => {
    removeLegacyAds();
    fitHeroAd();
    const stage = document.querySelector('.zc-hero-ad-stage');
    if (stage && window.ResizeObserver && !stage.dataset.zcAdResizeObserver) {
      const observer = new ResizeObserver(fitHeroAd);
      observer.observe(stage.parentElement || stage);
      stage.dataset.zcAdResizeObserver = 'true';
    }
    if (!window.__zcHeroAdResizeBound) {
      window.__zcHeroAdResizeBound = true;
      window.addEventListener('resize', fitHeroAd, {passive:true});
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, {once:true});
  else run();
})();


// Shared global visitor footprint for every non-home page.
// This is a site-wide total, separate from any page-specific analytics card.
(() => {
  'use strict';
  const api = 'https://zombcash-bot.fadehost.app/api/visits';
  const addFootprint = () => {
    if (!document.body || location.pathname === '/' || location.pathname === '/index.html' ||
        document.getElementById('zsh-global-footprint') ||
        document.querySelector('[data-zombcash-global-footprint]')) return;
    const section = document.createElement('section');
    section.id = 'zsh-global-footprint';
    section.setAttribute('data-zombcash-global-footprint', 'true');
    const footprintLang = (document.documentElement.lang || 'en').toLowerCase();
    const footprintCopy = {
      en: ['GLOBAL OUTBREAK FOOTPRINT', 'ALL-TIME VISITORS', "TODAY'S VISITORS", 'ONLINE NOW', 'CONNECTING TO THE OUTBREAK…', 'UTC DAY · UPDATED'],
      de: ['GLOBALE AUSBRUCHSÜBERSICHT', 'BESUCHER INSGESAMT', 'BESUCHER HEUTE', 'JETZT ONLINE', 'VERBINDUNG ZUM AUSBRUCH…', 'UTC-TAG · AKTUALISIERT'],
      fr: ['BILAN MONDIAL DE L’ÉPIDÉMIE', 'VISITEURS AU TOTAL', 'VISITEURS AUJOURD’HUI', 'EN LIGNE', 'CONNEXION À L’ÉPIDÉMIE…', 'JOUR UTC · MIS À JOUR'],
      it: ['QUADRO GLOBALE DELL’EPIDEMIA', 'VISITATORI TOTALI', 'VISITATORI DI OGGI', 'ONLINE ORA', 'CONNESSIONE ALL’EPIDEMIA…', 'GIORNO UTC · AGGIORNATO'],
      ja: ['世界のアウトブレイク状況', '累計訪問者数', '本日の訪問者数', '現在オンライン', 'アウトブレイクに接続中…', 'UTC日付 · 更新'],
      'zh-cn': ['全球疫情动态', '累计访客', '今日访客', '当前在线', '正在连接疫情网络…', 'UTC日期 · 更新'],
      tr: ['KÜRESEL SALGIN DURUMU', 'TOPLAM ZİYARETÇİ', 'BUGÜNKÜ ZİYARETÇİLER', 'ŞU AN ÇEVRİMİÇİ', 'SALGIN AĞINA BAĞLANILIYOR…', 'UTC GÜNÜ · GÜNCELLENDİ'],
      hi: ['वैश्विक प्रकोप स्थिति', 'कुल आगंतुक', 'आज के आगंतुक', 'अभी ऑनलाइन', 'प्रकोप नेटवर्क से जुड़ रहा है…', 'UTC दिन · अपडेट'],
      ru: ['ГЛОБАЛЬНАЯ СВОДКА ВСПЫШКИ', 'ВСЕГО ПОСЕТИТЕЛЕЙ', 'ПОСЕТИТЕЛЕЙ СЕГОДНЯ', 'СЕЙЧАС ОНЛАЙН', 'ПОДКЛЮЧЕНИЕ К СЕТИ…', 'ДЕНЬ UTC · ОБНОВЛЕНО']
    };
    const footprintText = footprintCopy[footprintLang] || footprintCopy[footprintLang.split('-')[0]] || footprintCopy.en;
    section.setAttribute('aria-label', footprintText[0]);
    section.innerHTML = '<div class="zsh-global-footprint-inner"><div class="zsh-global-footprint-heading"><span class="zsh-global-pulse" aria-hidden="true"></span><span>' + footprintText[0] + '</span></div><div class="zsh-global-footprint-stats"><div><small>' + footprintText[1] + '</small><strong id="zsh-global-total">—</strong></div><div><small>' + footprintText[2] + '</small><strong id="zsh-global-today">—</strong></div><div><small>' + footprintText[3] + '</small><strong id="zsh-global-online">—</strong></div></div><p id="zsh-global-updated">' + footprintText[4] + '</p></div>';
    const style = document.createElement('style');
    style.id = 'zsh-global-footprint-style';
    style.textContent = '#zsh-global-footprint{box-sizing:border-box;width:100%;max-width:100%;margin:30px auto 18px;padding:18px clamp(14px,4vw,48px);background:linear-gradient(110deg,#07100b,#080d0c 58%,#080b11);border-top:1px solid #9bff4538;border-bottom:1px solid #9bff4524;color:#d5e6d0;overflow:hidden}#zsh-global-footprint *{box-sizing:border-box}#zsh-global-footprint .zsh-global-footprint-inner{width:100%;max-width:1180px;margin:0 auto}#zsh-global-footprint .zsh-global-footprint-heading{display:flex;align-items:center;gap:9px;margin-bottom:14px;color:#9bff45;font:700 10px/1.5 Orbitron,Arial,sans-serif;letter-spacing:.1em}#zsh-global-footprint .zsh-global-pulse{width:7px;height:7px;flex:0 0 7px;border-radius:50%;background:#9bff45;box-shadow:0 0 10px #9bff45;animation:zshGlobalPulse 1.8s ease-in-out infinite}@keyframes zshGlobalPulse{50%{opacity:.45;box-shadow:0 0 3px #9bff45}}#zsh-global-footprint .zsh-global-footprint-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}#zsh-global-footprint .zsh-global-footprint-stats>div{min-width:0;padding:12px 14px;border:1px solid #9bff4524;background:#03080680}#zsh-global-footprint small{display:block;color:#849384;font:600 9px/1.5 Orbitron,Arial,sans-serif;letter-spacing:.05em}#zsh-global-footprint strong{display:block;margin-top:5px;color:#9bff45;font:700 clamp(20px,3vw,28px)/1.1 Orbitron,Arial,sans-serif;font-variant-numeric:tabular-nums}#zsh-global-footprint p{margin:10px 0 0;color:#657565;font:500 9px/1.5 Orbitron,Arial,sans-serif;letter-spacing:.06em}@media(max-width:520px){#zsh-global-footprint{margin:22px auto 14px;padding:14px 10px}#zsh-global-footprint .zsh-global-footprint-stats{gap:6px}#zsh-global-footprint .zsh-global-footprint-stats>div{padding:10px 7px}#zsh-global-footprint small{font-size:7px;letter-spacing:0}#zsh-global-footprint strong{font-size:18px}}';
    document.head.appendChild(style);
    const footer = document.getElementById('zsh-about-footer') || document.querySelector('body > footer, body footer');
    if (footer && footer.parentNode) footer.parentNode.insertBefore(section, footer);
    else document.body.appendChild(section);
    const render = data => {
      const total = document.getElementById('zsh-global-total');
      const today = document.getElementById('zsh-global-today');
      const online = document.getElementById('zsh-global-online');
      const updated = document.getElementById('zsh-global-updated');
      if (total && Number.isFinite(Number(data.total))) total.textContent = Number(data.total).toLocaleString();
      if (today && Number.isFinite(Number(data.today))) today.textContent = Number(data.today).toLocaleString();
      if (online && Number.isFinite(Number(data.online))) online.textContent = Number(data.online).toLocaleString();
      if (updated) updated.textContent = footprintText[5] + ' ' + new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    };
    const refresh = () => fetch(api, {cache:'no-store'}).then(response => {
      if (!response.ok) throw new Error('stats unavailable');
      return response.json();
    }).then(render).catch(() => {
      const updated = document.getElementById('zsh-global-updated');
      if (updated) {
        const unavailable = {
          en: 'VISITOR STATS TEMPORARILY UNAVAILABLE',
          de: 'BESUCHERSTATISTIK VORÜBERGEHEND NICHT VERFÜGBAR',
          fr: 'STATISTIQUES DES VISITEURS TEMPORAIREMENT INDISPONIBLES',
          it: 'STATISTICHE DEI VISITATORI TEMPORANEAMENTE NON DISPONIBILI',
          ja: '訪問者統計は一時的に利用できません',
          'zh-cn': '访客统计暂时不可用',
          tr: 'ZİYARETÇİ İSTATİSTİKLERİ GEÇİCİ OLARAK KULLANILAMIYOR',
          hi: 'आगंतुक आँकड़े अस्थायी रूप से उपलब्ध नहीं हैं',
          ru: 'Статистика посетителей временно недоступна'
        };
        updated.textContent = unavailable[footprintLang] || unavailable[footprintLang.split('-')[0]] || unavailable.en;
      }
    });
    refresh();
    window.setInterval(refresh, 20000);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addFootprint, {once:true});
  else addFootprint();

  // GA4 action tracking: measure meaningful navigation and acquisition clicks.
  // These events are sent to GA4; mark selected events as key events in GA4 Admin.
  if (new URLSearchParams(location.search).get('arcadeSnake') !== '1' && !window.__zombcashConversionTrackingLoaded) {
    window.__zombcashConversionTrackingLoaded = true;
    document.addEventListener('click', function(event) {
      const target = event.target && event.target.closest ? event.target.closest('a,button,[role="button"]') : null;
      if (!target || typeof window.gtag !== 'function') return;
      const href = target.getAttribute('href') || target.dataset.href || '';
      let url = null;
      try { if (href) url = new URL(href, location.href); } catch (_) {}
      const text = (target.innerText || target.getAttribute('aria-label') || target.getAttribute('title') || '').trim().replace(/\s+/g, ' ').slice(0, 120);
      const domain = url ? url.hostname.toLowerCase() : '';
      const path = url ? url.pathname.toLowerCase() : '';
      const params = {
        link_url: url ? url.href.slice(0, 500) : '',
        link_text: text,
        link_domain: domain,
        page_path: location.pathname
      };
      const isTelegram = /(^|\.)t\.me$|(^|\.)telegram\.me$/.test(domain) || /telegram/i.test(text);
      const isX = /(^|\.)x\.com$|(^|\.)twitter\.com$/.test(domain) || /\b(x community|follow on x|twitter)\b/i.test(text);
      const isTokenMarket = /pump\.fun$|dexscreener\.com$|jup\.ag$/.test(domain) || /buy zombcash|view token|open on dex/i.test(text);
      const isLogin = /zsh-login-button|telegram-login/i.test(String(target.className || '') + ' ' + text) || /login with telegram|register|join the survivors/i.test(text);
      if (isLogin) {
        window.gtag('event', 'telegram_login_click', Object.assign({cta_type:'login'}, params));
      } else if (isTelegram) {
        window.gtag('event', 'telegram_community_click', params);
      } else if (isX) {
        window.gtag('event', 'x_community_click', params);
      } else if (isTokenMarket) {
        window.gtag('event', 'token_market_click', params);
      } else if (/zombie-maker\.html/.test(path) || /zombie maker/i.test(text)) {
        window.gtag('event', 'zombie_maker_open', params);
      } else if (/arcade\.html|survivor-hub\.html|survivor-challenge/i.test(path) || /\b(play|launch|start game)\b/i.test(text)) {
        window.gtag('event', 'game_open', params);
      } else if (url && url.origin !== location.origin) {
        window.gtag('event', 'outbound_click', params);
      }
    }, {capture:true, passive:true});
  }
})();


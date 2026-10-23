/* ZombieCash shared navigation — one source of truth for every public page.
 * Keep page-specific styling below the header; header layout is owned here.
 */
(() => {
  'use strict';
  const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isHome = file === 'index.html';
  if (!isHome) document.body.classList.add('zsh-inner-page');
  // All shared navigation destinations are rooted at the site root. Relative links
  // incorrectly sent visitors from /ru/, /de/, etc. to nonexistent translated copies.
  const home = '/index.html';
  const labels = [
    ['LIVE WORLD', '/index.html#living-world', 'home'],
    ['FIELD MANUAL', '/survivor-field-manual.html', 'manual'],
    ['TRANSMISSION', '/outbreak-transmission.html', 'transmission'],
    ['CREW VOTE', '/crew-vote.html', 'vote'],
    ['SURVIVOR HUB', '/survivor-hub.html', 'hub'],
    ['ARCADE', '/arcade.html', 'arcade'],
    ['ZOMBIE GALLERY', '/gallery.html', 'gallery'],
    ['ZOMBIE MAKER', '/zombie-maker.html', 'maker'],
    ['COMMUNITY', '/index.html#community', 'home'],
    ['BUY $ZOMBCASH', '/index.html#community-console', 'home']
  ];
  const header = document.querySelector('body > header, body header');
  if (!header) return;

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
  const brandHref = isHome ? '/index.html#home' : '/index.html';
  const target = (href) => href;

  header.classList.add('zombcash-shared-header');
  header.innerHTML =
    '<a class="zsh-brand" href="' + brandHref + '" aria-label="ZombieCash home">' +
      '<span class="zsh-mark" aria-hidden="true">☣</span>' +
      '<span class="zsh-brand-copy">ZOMBIE<span class="zsh-green">CASH</span><small>THE UNDEAD INTERNET</small></span>' +
    '</a>' +
    '<button class="zsh-menu-toggle" type="button" aria-label="Open navigation" aria-controls="zsh-navigation" aria-expanded="false"><span aria-hidden="true">☰</span><span class="zsh-menu-label">MENU</span></button>' +
    '<nav id="zsh-navigation" class="zsh-nav" aria-label="Main navigation">' +
      labels.map(([label, href, id]) => {
        const destination = id === 'home' ? target(href) : href;
        const active = (id === 'manual' && file === 'survivor-field-manual.html') ||
          (id === 'vote' && file === 'crew-vote.html') ||
          (id === 'arcade' && file === 'arcade.html') ||
          (id === 'gallery' && file === 'gallery.html') ||
          (id === 'maker' && file === 'zombie-maker.html') ||
          (id === 'hub' && file === 'survivor-hub.html') ||
          (id === 'transmission' && file === 'outbreak-transmission.html');
        return '<a href="' + destination + '"' + (active ? ' aria-current="page"' : '') + '>' + label + '</a>';
      }).join('') +
    '</nav>' +
    '<div class="zsh-actions">' +
      (loginButton ? '<span class="zsh-preserved-login-slot"></span>' : '<a class="zsh-login-button top-cta" href="/survivor-hub.html" data-zsh-login>LOGIN WITH TELEGRAM</a>') +
      '<div class="zsh-language-slot"></div>' +
      (!isHome ? '<a class="zsh-home home-return-button" href="/index.html"><span aria-hidden="true">←</span> BACK TO HOME</a>' : '') +
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
    fonts.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800&family=Rajdhani:wght@400;500;600;700&display=swap';
    fonts.setAttribute('data-zsh-fonts', 'true');
    document.head.append(fonts);
  }

  const style = document.createElement('style');
    /* MOBILE REPAIR 2026-10-23: keep the shared header stable on every phone width.
       Several earlier media queries conflicted; these final rules deliberately win. */
    @media(max-width:760px){
      header.zombcash-shared-header{
        display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;
        grid-template-rows:auto auto auto!important;gap:0 10px!important;
        padding:10px 12px 0!important;min-height:0!important;height:auto!important;
      }
      header.zombcash-shared-header .zsh-brand{
        grid-column:1!important;grid-row:1!important;margin:0!important;
        min-width:0!important;justify-self:start!important;
      }
      header.zombcash-shared-header .zsh-actions{
        grid-column:1/-1!important;grid-row:2!important;justify-self:start!important;
        display:flex!important;flex-wrap:wrap!important;justify-content:flex-start!important;
        gap:6px!important;margin:9px 0 0!important;min-width:0!important;
      }
      header.zombcash-shared-header .zsh-menu-toggle{
        display:inline-flex!important;align-items:center!important;justify-content:center!important;
        position:absolute!important;right:12px!important;left:auto!important;top:12px!important;
        transform:none!important;min-height:36px!important;padding:8px 10px!important;
        border:1px solid #42613a!important;background:#0b120c!important;color:#b8f992!important;
        z-index:10003!important;
      }
      header.zombcash-shared-header .zsh-nav{
        position:static!important;left:auto!important;top:auto!important;transform:none!important;
        grid-column:1/-1!important;grid-row:3!important;display:none!important;
        width:100%!important;max-width:none!important;min-width:0!important;
        flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;
        flex-wrap:nowrap!important;gap:0!important;margin:10px 0 12px!important;padding:6px!important;
        border:1px solid #263a2a!important;background:#080d09!important;
        overflow-y:auto!important;max-height:65vh!important;
      }
      header.zombcash-shared-header .zsh-nav.zsh-open{display:flex!important}
      header.zombcash-shared-header .zsh-nav>a{
        display:flex!important;width:100%!important;min-height:40px!important;padding:10px 12px!important;
        justify-content:flex-start!important;border:0!important;border-bottom:1px solid #1b2a1d!important;
        font-size:10px!important;white-space:normal!important;
      }
      header.zombcash-shared-header .zsh-nav>a:last-child{border-bottom:0!important}
      header.zombcash-shared-header .zsh-brand-copy{font-size:12px!important}
      header.zombcash-shared-header .zsh-brand-copy small{font-size:6px!important;letter-spacing:1px!important}
      header.zombcash-shared-header .zsh-actions>.zsh-home,
      header.zombcash-shared-header .zsh-actions .language-trigger,
      header.zombcash-shared-header .zsh-actions .zsh-login-button{
        height:34px!important;min-height:34px!important;padding:0 8px!important;font-size:7px!important;
      }
    }
    @media(max-width:390px){
      header.zombcash-shared-header{padding:9px 8px 0!important}
      header.zombcash-shared-header .zsh-brand{gap:6px!important}
      header.zombcash-shared-header .zsh-brand-copy{font-size:11px!important}
      header.zombcash-shared-header .zsh-actions{gap:4px!important}
      header.zombcash-shared-header .zsh-actions>.zsh-home,
      header.zombcash-shared-header .zsh-actions .language-trigger,
      header.zombcash-shared-header .zsh-actions .zsh-login-button{padding:0 6px!important;font-size:6px!important}
    }

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
    /* Keep language control first, Back to Home before registration, registration at far right. */
    header.zombcash-shared-header .zsh-actions .zsh-language-slot{order:1!important}
    header.zombcash-shared-header .zsh-actions>.zsh-home{order:2!important}
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

    @media(max-width:1700px){
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
    header.zombcash-shared-header .zsh-menu-toggle{display:none!important}
    header.zombcash-shared-header .zsh-actions .zsh-login-button{order:1!important}
    header.zombcash-shared-header .zsh-actions .zsh-language-slot{order:2!important}
    header.zombcash-shared-header .zsh-actions>.zsh-home{order:3!important}
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
  `;
  document.head.querySelector('#zombcash-shared-navigation-style')?.remove();
  document.head.append(style);

  const toggle = header.querySelector('.zsh-menu-toggle');
  const nav = header.querySelector('.zsh-nav');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('zsh-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      nav.classList.remove('zsh-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
    }
  });

  // Keep the generated navigation labels in sync with the existing nine-language selector.
  const navDictionary = {
    de:['LEBENDIGE WELT','FELDHANDBUCH','ÜBERTRAGUNG','CREW-ABSTIMMUNG','SURVIVOR HUB','ARCADE','ZOMBIE-GALERIE','ZOMBIE-MAKER','COMMUNITY','$ZOMBCASH KAUFEN','ZURÜCK ZUR STARTSEITE','ÜBERLEBENDEN BEITRETEN','TELEGRAM ÖFFNEN','MENÜ'],
    fr:['MONDE VIVANT','GUIDE DE SURVIE','TRANSMISSION','VOTE DE L’ÉQUIPE','SURVIVOR HUB','ARCADE','GALERIE ZOMBIE','CRÉATEUR DE ZOMBIES','COMMUNAUTÉ','ACHETER $ZOMBCASH','RETOUR À L’ACCUEIL','REJOINDRE LES SURVIVANTS','OUVRIR TELEGRAM','MENU'],
    it:['MONDO VIVO','MANUALE DI SOPRAVVIVENZA','TRASMISSIONE','VOTO DELLA CREW','SURVIVOR HUB','ARCADE','GALLERIA ZOMBIE','CREA ZOMBIE','COMMUNITY','COMPRA $ZOMBCASH','TORNA ALLA HOME','UNISCITI AI SOPRAVVISSUTI','APRI TELEGRAM','MENU'],
    ja:['ライブワールド','サバイバルガイド','アウトブレイク通信','クルー投票','サバイバーハブ','アーケード','ゾンビギャラリー','ゾンビメーカー','コミュニティ','$ZOMBCASHを購入','ホームに戻る','サバイバーに参加','Telegramを開く','メニュー'],
    'zh-CN':['实时世界','生存指南','疫情广播','团队投票','幸存者中心','街机','僵尸画廊','僵尸制作器','社区','购买 $ZOMBCASH','返回首页','加入幸存者','打开 Telegram','菜单'],
    ru:['ЖИВОЙ МИР','СПРАВОЧНИК ВЫЖИВШЕГО','ТРАНСЛЯЦИЯ','ГОЛОСОВАНИЕ КОМАНДЫ','РЕФЕРАЛЫ / SURVIVOR HUB','АРКАДА','ГАЛЕРЕЯ ЗОМБИ','СОЗДАТЕЛЬ ЗОМБИ','СООБЩЕСТВО','КУПИТЬ $ZOMBCASH','НА ГЛАВНУЮ','ПРИСОЕДИНИТЬСЯ К ВЫЖИВШИМ','ОТКРЫТЬ TELEGRAM','МЕНЮ'],
    tr:['CANLI DÜNYA','HAYATTA KALMA REHBERİ','YAYINLAR','EKİP OYLAMASI','SURVIVOR MERKEZİ','ARCADE','ZOMBİ GALERİSİ','ZOMBİ OLUŞTURUCU','TOPLULUK','$ZOMBCASH SATIN AL','ANA SAYFAYA DÖN','HAYATTA KALANLARA KATIL','TELEGRAM’I AÇ','MENÜ'],
    hi:['लाइव दुनिया','सर्वाइवल गाइड','प्रसारण','टीम वोट','सर्वाइवर हब','आर्केड','ज़ॉम्बी गैलरी','ज़ॉम्बी मेकर','समुदाय','$ZOMBCASH खरीदें','होम पर लौटें','सर्वाइवर्स से जुड़ें','TELEGRAM खोलें','मेन्यू']
  };
  function localizeNav(language) {
    const translated = navDictionary[language];
    const links = [...nav.querySelectorAll(':scope > a')].filter(link => !link.classList.contains('zsh-home'));
    labels.forEach((item, index) => { if (links[index]) links[index].textContent = translated ? translated[index] : item[0]; });
    const back = header.querySelector('.zsh-actions > .zsh-home');
    if (back) back.innerHTML = '<span aria-hidden="true">←</span> ' + (translated ? translated[10] : 'BACK TO HOME');
    /* The global header now uses LOGIN WITH TELEGRAM, not a registration CTA. */
    const menuLabel = header.querySelector('.zsh-menu-label');
    if (menuLabel) menuLabel.textContent = translated ? translated[13] : 'MENU';
    const brandSmall = header.querySelector('.zsh-brand-copy small');
    if (brandSmall) brandSmall.textContent = language === 'ru' ? 'ИНТЕРНЕТ НЕЖИТИ' : 'THE UNDEAD INTERNET';
    const loginControl = header.querySelector('.zsh-login-button');
    if (loginControl) {
      const loginLabels = {de:'MIT TELEGRAM ANMELDEN',fr:'SE CONNECTER AVEC TELEGRAM',it:'ACCEDI CON TELEGRAM',ja:'TELEGRAMでログイン','zh-CN':'使用 TELEGRAM 登录',ru:'ВОЙТИ ЧЕРЕЗ TELEGRAM',tr:'TELEGRAM İLE GİRİŞ',hi:'TELEGRAM से लॉग इन करें'};
      loginControl.textContent = language === 'en' ? 'LOGIN WITH TELEGRAM' : (loginLabels[language] || 'LOGIN WITH TELEGRAM');
    }
  }
  const readLanguage = () => {
    let language = 'en';
    try { language = localStorage.getItem('zombcash-language') || 'en'; } catch (_) {}
    localizeNav(language);
  };
  document.addEventListener('zombcash:languagechange', event => localizeNav(event.detail && event.detail.language || 'en'));
  readLanguage();

  // language.js creates the switcher after DOMContentLoaded; place it in the same fixed slot.
  const moveLanguage = () => {
    const language = document.querySelector('.language-switcher');
    const slot = header.querySelector('.zsh-language-slot');
    if (language && slot && language.parentElement !== slot) slot.append(language);
  };
  moveLanguage();
  new MutationObserver(moveLanguage).observe(document.body, {childList:true,subtree:true});
})();

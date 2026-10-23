/* ZombieCash shared navigation — one source of truth for every public page.
 * Keep page-specific styling below the header; header layout is owned here.
 */
(() => {
  'use strict';
  const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isHome = file === 'index.html';
  if (!isHome) document.body.classList.add('zsh-inner-page');
  const home = 'index.html';
  const labels = [
    ['LIVE WORLD', '#living-world', 'home'],
    ['FIELD MANUAL', 'survivor-field-manual.html', 'manual'],
    ['TRANSMISSION', 'outbreak-transmission.html', 'transmission'],
    ['CREW VOTE', 'crew-vote.html', 'vote'],
    ['SURVIVOR HUB', 'survivor-hub.html', 'hub'],
    ['ARCADE', 'arcade.html', 'arcade'],
    ['ZOMBIE GALLERY', 'gallery.html', 'gallery'],
    ['ZOMBIE MAKER', 'zombie-maker.html', 'maker'],
    ['COMMUNITY', '#community', 'home'],
    ['BUY $ZOMBCASH', '#community-console', 'home']
  ];
  const header = document.querySelector('body > header, body header');
  if (!header) return;

  // Preserve the Survivor Hub's working Telegram login control before rebuilding its common shell.
  const loginButton = file === 'survivor-hub.html'
    ? header.querySelector('button[data-i18n="login"], button.top-cta')
    : null;
  const brandHref = isHome ? '#home' : 'index.html';
  const target = (href) => href.startsWith('#') && !isHome ? home + href : href;

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
      (!isHome ? '<a class="zsh-home home-return-button" href="index.html"><span aria-hidden="true">←</span> BACK TO HOME</a>' : '') +
      '<div class="zsh-language-slot"></div>' +
      (loginButton ? '<span class="zsh-preserved-login-slot"></span>' : '') +
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

  const style = document.createElement('style');
  style.id = 'zombcash-shared-navigation-style';
  style.textContent = `
    header.zombcash-shared-header{
      position:sticky!important;top:0!important;z-index:10000!important;
      display:grid!important;grid-template-columns:auto minmax(0,1fr) auto!important;
      align-items:center!important;gap:clamp(10px,1.25vw,20px)!important;
      width:100%!important;min-width:0!important;min-height:76px!important;height:auto!important;
      margin:0!important;padding:12px clamp(16px,3vw,48px)!important;
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
    header.zombcash-shared-header .zsh-language-slot{display:flex!important;align-items:center!important;flex:0 0 auto!important}
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
    header.zombcash-shared-header .zsh-actions>.zsh-home,
    header.zombcash-shared-header .zsh-actions .survivor-entry-button,
    header.zombcash-shared-header .zsh-actions .top-cta,
    header.zombcash-shared-header .zsh-actions .zsh-login-button{cursor:pointer;text-decoration:none!important}
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
    body.zsh-inner-page main h1{
      font-size:clamp(38px,4.6vw,64px)!important;
      line-height:1.06!important;letter-spacing:-.035em!important;
      margin:12px 0 18px!important;max-width:100%!important;
      overflow-wrap:anywhere;
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
    body.zsh-inner-page main h2,
    body.zsh-inner-page main h3,
    body.zsh-inner-page main h4{
      font-family:Orbitron,Arial,sans-serif!important;
      font-weight:700!important;
      letter-spacing:-.025em;
    }
    body.zsh-inner-page main h2{font-size:clamp(22px,2.2vw,30px)!important;line-height:1.25!important}
    body.zsh-inner-page main h3{font-size:clamp(16px,1.5vw,20px)!important;line-height:1.3!important}
    body.zsh-inner-page main p,
    body.zsh-inner-page main li{font-family:Rajdhani,Arial,sans-serif!important;font-size:18px;line-height:1.6}
    body.zsh-inner-page main .wrap,
    body.zsh-inner-page main .container,
    body.zsh-inner-page main .page-wrap{box-sizing:border-box;max-width:min(1080px,calc(100% - 40px));margin-left:auto;margin-right:auto}
    body.zsh-inner-page main .eyebrow,
    body.zsh-inner-page main .kicker{font-family:Orbitron,Arial,sans-serif!important;font-size:11px!important;font-weight:700!important;letter-spacing:.16em!important;line-height:1.5!important}
    body.zsh-inner-page main .lead{font-family:Rajdhani,Arial,sans-serif!important;font-size:clamp(18px,1.55vw,21px)!important;line-height:1.55!important;max-width:820px!important;margin:0 0 22px!important}
    @media(max-width:650px){
      body.zsh-inner-page main h1{font-size:clamp(32px,8vw,44px)!important;line-height:1.08!important}
      body main .eyebrow{margin-top:18px!important}
      body main .lead{font-size:18px!important}
    }

    @media(max-width:1450px){
      header.zombcash-shared-header{grid-template-columns:minmax(0,1fr) auto!important;gap:10px!important;padding:10px 18px!important}
      header.zombcash-shared-header .zsh-actions{grid-column:2;grid-row:1}
      header.zombcash-shared-header .zsh-nav{
        position:static!important;left:auto!important;top:auto!important;transform:none!important;
        display:none!important;grid-column:1/-1;grid-row:2;justify-content:flex-start!important;
        align-items:stretch!important;flex-wrap:wrap!important;gap:4px 16px!important;
        max-width:100%!important;padding:10px 0 3px!important;border-top:1px solid #9bff4520!important;
      }
      header.zombcash-shared-header .zsh-nav.zsh-open{display:flex!important}
      header.zombcash-shared-header .zsh-menu-toggle{
        display:inline-flex!important;grid-column:1;grid-row:1;align-items:center!important;justify-content:center!important;
        gap:8px!important;min-width:42px!important;min-height:36px!important;margin:0!important;padding:7px 10px!important;
        border:1px solid #42613a!important;border-radius:0!important;background:#0b120c!important;color:#9bff45!important;
        font-size:17px!important;cursor:pointer;
      }
      header.zombcash-shared-header .zsh-brand{grid-column:1;grid-row:1;justify-self:start;margin-left:0!important}
      header.zombcash-shared-header .zsh-menu-toggle{position:absolute;left:18px;top:50%;transform:translateY(-50%);z-index:2}
      header.zombcash-shared-header .zsh-brand{margin-left:54px!important}
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
    /* Desktop: anchor the navigation to the viewport center on every page. */
    @media(min-width:1451px){
      header.zombcash-shared-header{position:sticky!important;left:auto!important;transform:none!important;width:100vw!important;max-width:100vw!important;margin-left:calc(50% - 50vw)!important;margin-right:0!important;grid-template-columns:auto minmax(0,1fr) auto!important;gap:clamp(12px,1.2vw,20px)!important}
      header.zombcash-shared-header .zsh-nav{position:absolute!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;display:flex!important;grid-column:auto!important;grid-row:auto!important;justify-content:center!important;flex-wrap:nowrap!important;gap:clamp(8px,.75vw,13px)!important;width:max-content!important;max-width:calc(100% - 600px)!important;overflow:visible!important}
      header.zombcash-shared-header .zsh-nav>a{font-size:clamp(8px,.58vw,9px)!important;flex:0 0 auto!important}
      header.zombcash-shared-header .zsh-brand{grid-column:1!important;grid-row:1!important}
      header.zombcash-shared-header .zsh-actions{grid-column:3!important;grid-row:1!important}
    }
    @media(max-width:390px){
      header.zombcash-shared-header{grid-template-columns:minmax(0,1fr) auto!important;padding:8px!important}
      header.zombcash-shared-header .zsh-brand{margin-left:40px!important}
      header.zombcash-shared-header .zsh-brand-copy{font-size:11px!important}
      header.zombcash-shared-header .zsh-brand-copy small{letter-spacing:.5px!important}
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
    de:['LEBENDIGE WELT','FELDHANDBUCH','CREW-ABSTIMMUNG','SURVIVOR HUB','ARCADE','ZOMBIE-GALERIE','ZOMBIE-MAKER','COMMUNITY','$ZOMBCASH KAUFEN','ZURÜCK ZUR STARTSEITE','ÜBERLEBENDEN BEITRETEN','TELEGRAM ÖFFNEN','MENÜ'],
    fr:['MONDE VIVANT','GUIDE DE SURVIE','VOTE DE L’ÉQUIPE','SURVIVOR HUB','ARCADE','GALERIE ZOMBIE','CRÉATEUR DE ZOMBIES','COMMUNAUTÉ','ACHETER $ZOMBCASH','RETOUR À L’ACCUEIL','REJOINDRE LES SURVIVANTS','OUVRIR TELEGRAM','MENU'],
    it:['MONDO VIVO','MANUALE DI SOPRAVVIVENZA','VOTO DELLA CREW','SURVIVOR HUB','ARCADE','GALLERIA ZOMBIE','CREA ZOMBIE','COMMUNITY','COMPRA $ZOMBCASH','TORNA ALLA HOME','UNISCITI AI SOPRAVVISSUTI','APRI TELEGRAM','MENU'],
    ja:['ライブワールド','サバイバルガイド','クルー投票','サバイバーハブ','アーケード','ゾンビギャラリー','ゾンビメーカー','コミュニティ','$ZOMBCASHを購入','ホームに戻る','サバイバーに参加','Telegramを開く','メニュー'],
    'zh-CN':['实时世界','生存指南','团队投票','幸存者中心','街机','僵尸画廊','僵尸制作器','社区','购买 $ZOMBCASH','返回首页','加入幸存者','打开 Telegram','菜单'],
    ru:['ЖИВОЙ МИР','СПРАВОЧНИК ВЫЖИВШЕГО','ГОЛОСОВАНИЕ КОМАНДЫ','РЕФЕРАЛЫ / SURVIVOR HUB','АРКАДА','ГАЛЕРЕЯ ЗОМБИ','СОЗДАТЕЛЬ ЗОМБИ','СООБЩЕСТВО','КУПИТЬ $ZOMBCASH','НА ГЛАВНУЮ','ПРИСОЕДИНИТЬСЯ К ВЫЖИВШИМ','ОТКРЫТЬ TELEGRAM','МЕНЮ'],
    tr:['CANLI DÜNYA','HAYATTA KALMA REHBERİ','EKİP OYLAMASI','SURVIVOR MERKEZİ','ARCADE','ZOMBİ GALERİSİ','ZOMBİ OLUŞTURUCU','TOPLULUK','$ZOMBCASH SATIN AL','ANA SAYFAYA DÖN','HAYATTA KALANLARA KATIL','TELEGRAM’I AÇ','MENÜ'],
    hi:['लाइव दुनिया','सर्वाइवल गाइड','टीम वोट','सर्वाइवर हब','आर्केड','ज़ॉम्बी गैलरी','ज़ॉम्बी मेकर','समुदाय','$ZOMBCASH खरीदें','होम पर लौटें','सर्वाइवर्स से जुड़ें','TELEGRAM खोलें','मेन्यू']
  };
  function localizeNav(language) {
    const translated = navDictionary[language];
    const links = [...nav.querySelectorAll(':scope > a')].filter(link => !link.classList.contains('zsh-home'));
    labels.forEach((item, index) => { if (links[index]) links[index].textContent = translated ? translated[index] : item[0]; });
    const back = header.querySelector('.zsh-actions > .zsh-home');
    if (back) back.innerHTML = '<span aria-hidden="true">←</span> ' + (translated ? translated[9] : 'BACK TO HOME');
    const menuLabel = header.querySelector('.zsh-menu-label');
    if (menuLabel) menuLabel.textContent = translated ? translated[12] : 'MENU';
    const brandSmall = header.querySelector('.zsh-brand-copy small');
    if (brandSmall) brandSmall.textContent = language === 'ru' ? 'ИНТЕРНЕТ НЕЖИТИ' : 'THE UNDEAD INTERNET';
    if (loginButton) {
      const loginLabels = {de:'MIT TELEGRAM ANMELDEN',fr:'SE CONNECTER AVEC TELEGRAM',it:'ACCEDI CON TELEGRAM',ja:'TELEGRAMでログイン','zh-CN':'使用 TELEGRAM 登录',ru:'ВОЙТИ ЧЕРЕЗ TELEGRAM',tr:'TELEGRAM İLE GİRİŞ',hi:'TELEGRAM से लॉग इन करें'};
      loginButton.textContent = language === 'en' ? 'LOGIN WITH TELEGRAM' : (loginLabels[language] || 'LOGIN WITH TELEGRAM');
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

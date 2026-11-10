(function () {
  'use strict';
  const root = document.getElementById('zctv-channel-hub');
  if (!root || root.dataset.apiPlayerReady === '1') return;
  root.dataset.apiPlayerReady = '1';

  const API = 'https://zombcash-bot.fadehost.app/api/tv';
  const FEATURED_VIDEO = 'https://github.com/zombcash/zombcash.github.io/releases/download/zombiecash-promo-2026-10/zombiecash_final_real_screens.mp4-1080p-.ANONMP4.TO.mp4';
  const FEATURED_POSTER = '/assets/images/zombcash-tv-raven.png';
  const mount = root.querySelector('[data-zctv-player-mount]');
  const oldWrap = document.querySelector('#promo-video .zc-promo-player-wrap');
  if (mount && oldWrap) mount.appendChild(oldWrap);

  const player = root.querySelector('#zc-promo-player');
  const list = root.querySelector('[data-zctv-episodes]');
  const archive = root.querySelector('.zctv-archive');
  const column = root.querySelector('.zctv-player-column');
  const cards = Array.from(root.querySelectorAll('[data-channel]'));
  const heading = root.querySelector('[data-zctv-archive-title]');
  const status = root.querySelector('#zc-promo-status');
  const version = root.querySelector('#zc-promo-version');
  const download = root.querySelector('#zc-promo-download');
  const promoCount = document.getElementById('zc-promo-count');
  const promoPrev = document.getElementById('zc-promo-prev');
  const promoNext = document.getElementById('zc-promo-next');
  const promoRelease = document.getElementById('zc-promo-release');
  const liveLabel = root.querySelector('.zctv-live-label');
  const promoControls = document.querySelector('#promo-video .zc-promo-video-controls');
  const promoStatus = document.querySelector('#promo-video #zc-promo-status');
  if (column && mount) {
    [promoControls, promoStatus, promoRelease].forEach(function (node) { if (node) column.insertBefore(node, mount); });
  }
  const labels = { all: 'ALL EPISODES', news: 'OUTBREAK NEWS', meme: 'MEME SHOW', lab: 'ZOMBIE LAB' };
  const metaStream = document.querySelector('meta[name="zctv-live-stream"]');
  const liveUrl = (root.dataset.liveStream || (metaStream && metaStream.content) || '').trim();
  let episodes = [];
  let promoVideos = [];
  let promoIndex = 0;
  let active = 'news';
  let mode = liveUrl ? 'live' : 'archive';
  let currentId = '';
  let livePlaying = false;

  const style = document.createElement('style');
  style.id = 'zctv-broadcast-console-v3';
  style.textContent = `
    /* ZombieCash TV — single authoritative responsive layout */
    #zctv-channel-hub{
      position:relative!important;isolation:isolate!important;
      padding:clamp(34px,4vw,64px) clamp(16px,4vw,64px)!important;
      overflow:hidden!important;
      background:
        radial-gradient(ellipse at 74% 32%,#173d1f55 0,transparent 42%),
        radial-gradient(ellipse at 12% 92%,#4d267018 0,transparent 38%),
        linear-gradient(130deg,#050907 0%,#080e0b 55%,#0c0a11 100%)!important;
      border-block:1px solid #9bff4530!important;
    }
    #zctv-channel-hub .zctv-inner{
      width:min(100%,1680px)!important;max-width:1680px!important;min-width:0!important;
      margin-inline:auto!important;box-sizing:border-box!important;
    }
    #zctv-channel-hub .zctv-kicker{
      display:flex!important;align-items:center!important;gap:10px!important;
      margin:0 0 18px 4px!important;color:#b9d4ae!important;
      font:700 9px Orbitron,sans-serif!important;letter-spacing:2.2px!important;
    }
    #zctv-channel-hub .zctv-kicker i{
      width:7px!important;height:7px!important;border-radius:50%!important;
      background:#9bff45!important;box-shadow:0 0 12px #9bff45!important;
    }
    #zctv-channel-hub .zctv-layout{
      display:grid!important;width:100%!important;min-width:0!important;
      grid-template-columns:minmax(300px,1.05fr) minmax(300px,.95fr) minmax(420px,1.35fr)!important;
      grid-template-rows:auto!important;grid-template-areas:"intro host player"!important;
      grid-auto-flow:row!important;gap:clamp(16px,1.65vw,28px)!important;
      align-items:stretch!important;margin:18px 0 24px!important;
    }
    #zctv-channel-hub .zctv-intro{
      grid-area:intro!important;align-self:center!important;
      min-width:0!important;padding:clamp(20px,2.1vw,34px)!important;
      border:1px solid #9bff4540!important;border-radius:18px!important;
      background:linear-gradient(145deg,#101a12ef,#080d0bf5 72%,#110d17f2)!important;
      box-shadow:0 18px 55px #0008,inset 0 1px #ffffff08!important;
      backdrop-filter:blur(12px)!important;
    }
    #zctv-channel-hub .zctv-intro .eyebrow{
      display:inline-flex!important;max-width:100%!important;padding:8px 11px!important;
      border:1px solid #9bff4540!important;border-radius:999px!important;
      background:#9bff450b!important;color:#aaff72!important;
      font:700 8px Orbitron,sans-serif!important;letter-spacing:1px!important;
    }
    #zctv-channel-hub .zctv-intro h2{
      margin:20px 0 14px!important;color:#f1f6eb!important;
      font:800 clamp(25px,2.25vw,38px)/1.08 Orbitron,sans-serif!important;
      letter-spacing:-1px!important;
    }
    #zctv-channel-hub .zctv-intro h2 span{color:#9bff45!important;text-shadow:0 0 25px #9bff4530!important}
    #zctv-channel-hub .zctv-intro p{
      max-width:40ch!important;margin:0!important;color:#b4c0b0!important;
      font:500 clamp(15px,1.05vw,17px)/1.5 Rajdhani,sans-serif!important;
    }
    #zctv-channel-hub .zctv-host-tag{
      display:flex!important;align-items:center!important;gap:10px!important;
      margin-top:22px!important;padding-top:15px!important;
      border-top:1px solid #9bff4524!important;color:#e7f2e0!important;
      font:700 10px Orbitron,sans-serif!important;
    }
    #zctv-channel-hub .zctv-host-tag small{
      display:block!important;margin-top:5px!important;color:#8da18a!important;
      font:500 12px Rajdhani,sans-serif!important;
    }
    #zctv-channel-hub .zctv-host-art{
      position:relative!important;grid-area:host!important;
      display:flex!important;align-self:stretch!important;justify-content:center!important;
      min-width:0!important;height:clamp(390px,31vw,510px)!important;max-height:510px!important;
      overflow:hidden!important;border:1px solid #9bff4540!important;border-radius:18px!important;
      background:radial-gradient(ellipse at 50% 28%,#4a8c3d70,transparent 60%),linear-gradient(145deg,#111b13,#080c0d 75%)!important;
      box-shadow:0 18px 55px #0008!important;
    }
    #zctv-channel-hub .zctv-host-art:before{
      content:""!important;position:absolute!important;inset:11px!important;
      border:1px solid #c2ff6d25!important;border-radius:12px!important;pointer-events:none!important;z-index:2!important;
    }
    #zctv-channel-hub .zctv-host-art:after{
      content:"ZC // STUDIO 01"!important;position:absolute!important;top:18px!important;left:18px!important;
      padding:7px 10px!important;border:1px solid #9bff4545!important;border-radius:999px!important;
      background:#060b09b8!important;color:#d0e7c6!important;
      font:700 7px Orbitron,sans-serif!important;letter-spacing:1.5px!important;z-index:3!important;
    }
    #zctv-channel-hub .zctv-host-art img{
      position:relative!important;z-index:1!important;width:100%!important;height:100%!important;
      object-fit:cover!important;object-position:center 18%!important;
      filter:saturate(1.08) contrast(1.04)!important;
      mask-image:linear-gradient(to bottom,#000 94%,transparent 100%)!important;
    }
    #zctv-channel-hub .zctv-player-column{
      grid-area:player!important;display:flex!important;
      flex-direction:column!important;align-self:stretch!important;gap:12px!important;
      width:100%!important;min-width:0!important;box-sizing:border-box!important;
    }
    #zctv-channel-hub .zctv-live-label{
      display:flex!important;align-items:center!important;justify-content:space-between!important;
      gap:12px!important;min-height:48px!important;padding:9px 15px!important;
      border:1px solid #9bff4550!important;border-radius:999px!important;
      background:linear-gradient(90deg,#101b12,#0a100d 60%,#100d16)!important;
      color:#aebda8!important;font:700 8px Orbitron,sans-serif!important;letter-spacing:1px!important;
      box-shadow:0 8px 26px #0006!important;
    }
    #zctv-channel-hub .zctv-live-label strong{
      display:flex!important;align-items:center!important;gap:9px!important;
      color:#aab9a4!important;font-size:9px!important;white-space:nowrap!important;
    }
    #zctv-channel-hub .zctv-live-label strong i{
      display:inline-block!important;flex:0 0 auto!important;width:8px!important;height:8px!important;
      border-radius:50%!important;background:#596358!important;
    }
    #zctv-channel-hub .zctv-mode-switch{display:flex!important;gap:6px!important;flex-wrap:wrap!important}
    #zctv-channel-hub .zctv-mode-switch button{
      min-height:34px!important;padding:8px 15px!important;border:1px solid #52684b!important;
      border-radius:999px!important;background:#080e0a!important;color:#b5c4ae!important;
      font:700 8px Orbitron,sans-serif!important;letter-spacing:1px!important;cursor:pointer!important;
    }
    #zctv-channel-hub .zctv-mode-switch button[aria-pressed="true"]{
      border-color:#aaff72!important;background:linear-gradient(135deg,#9bff45,#c1ff88)!important;
      color:#071006!important;box-shadow:0 0 22px #9bff4526!important;
    }
    #zctv-channel-hub .zctv-player-mount{
      width:100%!important;min-width:0!important;padding:0!important;border:0!important;
      border-radius:18px!important;background:transparent!important;overflow:hidden!important;
      box-shadow:0 22px 65px #0009,0 0 35px #9bff4510!important;
    }
    #zctv-channel-hub .zc-promo-video-controls{
      display:flex!important;align-items:center!important;justify-content:space-between!important;
      gap:8px!important;flex-wrap:wrap!important;width:100%!important;margin:0!important;
    }
    #zctv-channel-hub .zc-promo-video-controls button{
      min-height:36px!important;padding:8px 12px!important;border:1px solid #526b45!important;
      border-radius:8px!important;background:#0a120c!important;color:#c7e5ba!important;
      font:700 8px Orbitron,sans-serif!important;cursor:pointer!important;
    }
    #zctv-channel-hub .zc-promo-video-controls button:disabled{opacity:.4!important;cursor:not-allowed!important}
    #zctv-channel-hub #zc-promo-count{color:#9bff45!important;font:700 8px Orbitron,sans-serif!important}
    #zctv-channel-hub #zc-promo-status{margin:0!important;color:#91a78a!important;font:600 11px Rajdhani,sans-serif!important}
    #zctv-channel-hub #zc-promo-release{margin:0!important;color:#b9f58e!important;font:700 8px Orbitron,sans-serif!important}
    #zctv-channel-hub .zc-promo-player-wrap{
      display:block!important;width:100%!important;max-width:none!important;margin:0!important;
      overflow:hidden!important;border:1px solid #8fb97880!important;border-radius:18px!important;
      background:#020403!important;box-shadow:0 0 0 1px #ffffff06,inset 0 1px #ffffff0a!important;
    }
    #zctv-channel-hub .zc-promo-player-top{
      display:flex!important;align-items:center!important;justify-content:space-between!important;
      gap:10px!important;min-height:42px!important;padding:10px 16px!important;
      background:linear-gradient(90deg,#111b12,#080d0b 60%,#100c14)!important;
    }
    #zctv-channel-hub #zc-promo-player{
      display:block!important;width:100%!important;max-width:100%!important;max-height:none!important;
      aspect-ratio:16/9!important;object-fit:contain!important;background:#010302!important;
    }
    #zctv-channel-hub .zc-promo-player-foot{
      display:flex!important;align-items:center!important;justify-content:space-between!important;
      gap:12px!important;min-height:42px!important;padding:10px 16px!important;background:#080d0b!important;
    }
    #zctv-channel-hub .zctv-archive{
      display:block!important;width:100%!important;min-width:0!important;height:auto!important;
      max-height:300px!important;min-height:100px!important;flex:0 0 auto!important;
      align-self:stretch!important;padding:14px 16px!important;overflow:hidden!important;
      border:1px solid #607d4d80!important;border-radius:16px!important;
      background:linear-gradient(145deg,#0d150f,#080c0a 72%,#100d15)!important;
      box-shadow:0 14px 38px #0007!important;
    }
    #zctv-channel-hub .zctv-archive-head{
      display:flex!important;justify-content:space-between!important;gap:12px!important;
      margin:0 0 8px!important;padding:0 2px 10px!important;
      border-bottom:1px solid #9bff4526!important;color:#b8d6a9!important;
      font:700 8px Orbitron,sans-serif!important;letter-spacing:1px!important;
    }
    #zctv-channel-hub .zctv-episodes{
      display:grid!important;grid-template-columns:1fr!important;gap:5px!important;
      max-height:220px!important;overflow:auto!important;padding:2px!important;
    }
    #zctv-channel-hub .zctv-episode{
      display:flex!important;align-items:center!important;justify-content:space-between!important;
      gap:12px!important;padding:10px 12px!important;border:1px solid #ffffff0a!important;
      border-radius:10px!important;background:linear-gradient(90deg,#111a12,#0b100d)!important;
    }
    #zctv-channel-hub .zctv-episode strong{display:block!important;color:#e5f0df!important;font:700 10px Rajdhani,sans-serif!important}
    #zctv-channel-hub .zctv-episode span{display:block!important;margin-top:3px!important;color:#7f927b!important;font:600 8px Orbitron,sans-serif!important}
    #zctv-channel-hub .zctv-episode button{
      min-height:32px!important;padding:0 14px!important;border:1px solid #aaff72!important;
      border-radius:999px!important;background:#aaff72!important;color:#071006!important;
      font:700 8px Orbitron,sans-serif!important;cursor:pointer!important;
    }
    #zctv-channel-hub .zctv-empty{padding:18px!important;color:#aab9a4!important;font:500 13px Rajdhani,sans-serif!important}
    #zctv-channel-hub .zctv-channels{
      display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;
      gap:14px!important;margin:0!important;
    }
    #zctv-channel-hub .zctv-channel-card{
      position:relative!important;display:flex!important;flex-direction:column!important;
      align-items:flex-start!important;min-width:0!important;min-height:124px!important;
      padding:17px 19px!important;border:1px solid #51644a!important;border-radius:16px!important;
      background:linear-gradient(145deg,#121b13,#090e0b 75%,#100d15)!important;
      box-shadow:0 12px 34px #0006!important;text-align:left!important;cursor:pointer!important;
      transition:transform .22s,border-color .22s,box-shadow .22s!important;
    }
    #zctv-channel-hub .zctv-channel-card:hover{
      transform:translateY(-3px)!important;border-color:#aaff72!important;
      box-shadow:0 18px 42px #0008,0 0 24px #9bff4512!important;
    }
    #zctv-channel-hub .zctv-channel-card[aria-pressed="true"]{
      border-color:#aaff72!important;background:linear-gradient(145deg,#1a2b19,#0a110c 80%)!important;
      box-shadow:inset 0 0 28px #9bff450c,0 0 24px #9bff4518!important;
    }
    #zctv-channel-hub .zctv-channel-card[data-channel="meme"]{border-color:#73447b!important;background:linear-gradient(145deg,#211127,#0b0b12)!important}
    #zctv-channel-hub .zctv-channel-card[data-channel="lab"]{border-color:#286c5a!important;background:linear-gradient(145deg,#0d211c,#080d0d)!important}
    #zctv-channel-hub .zctv-channel-card .num{color:#9bff45!important;font:700 9px Orbitron,sans-serif!important;letter-spacing:1.5px!important}
    #zctv-channel-hub .zctv-channel-card[data-channel="meme"] .num,
    #zctv-channel-hub .zctv-channel-card[data-channel="meme"] .actions b{color:#e879ff!important}
    #zctv-channel-hub .zctv-channel-card[data-channel="lab"] .num,
    #zctv-channel-hub .zctv-channel-card[data-channel="lab"] .actions b{color:#38e8b5!important}
    #zctv-channel-hub .zctv-channel-card strong{margin:12px 0 6px!important;color:#f0f5e9!important;font:800 clamp(14px,1.2vw,17px) Orbitron,sans-serif!important}
    #zctv-channel-hub .zctv-channel-card p{margin:0 0 15px!important;color:#9eae9d!important;font:500 13px Rajdhani,sans-serif!important}
    #zctv-channel-hub .zctv-channel-card .actions{
      display:flex!important;justify-content:space-between!important;gap:8px!important;width:100%!important;
      margin-top:auto!important;color:#a9bd9f!important;font:700 8px Orbitron,sans-serif!important;letter-spacing:.5px!important;
    }
    #zctv-channel-hub .zctv-channel-card .actions b{color:#9bff45!important}
    #zctv-channel-hub .zctv-foot{
      display:flex!important;justify-content:space-between!important;gap:12px!important;
      margin-top:16px!important;padding:12px 4px 0!important;border-top:1px solid #9bff4520!important;
      color:#82927d!important;font:600 8px Orbitron,sans-serif!important;letter-spacing:1px!important;
    }
    @keyframes zctvPulse{
      0%,100%{opacity:1;box-shadow:0 0 8px #9bff45,0 0 20px #9bff4580}
      50%{opacity:.55;box-shadow:0 0 3px #9bff45,0 0 9px #9bff4560}
    }
    @media(max-width:1200px){
      #zctv-channel-hub .zctv-layout{
        grid-template-columns:minmax(240px,.95fr) minmax(260px,1.05fr)!important;
        grid-template-rows:auto auto!important;grid-template-areas:"intro host" "player player"!important;
        grid-auto-flow:row!important;gap:18px!important;
      }
      #zctv-channel-hub .zctv-intro{grid-area:intro!important}
      #zctv-channel-hub .zctv-host-art{grid-area:host!important;height:clamp(300px,36vw,430px)!important}
      #zctv-channel-hub .zctv-player-column{
        grid-area:player!important;width:min(100%,1040px)!important;
        justify-self:center!important;margin-inline:auto!important;
      }
    }
    @media(max-width:700px){
      #zctv-channel-hub{padding:30px 5%!important}
      #zctv-channel-hub .zctv-layout{
        display:flex!important;flex-direction:column!important;align-items:stretch!important;
        grid-template-columns:minmax(0,1fr)!important;grid-template-rows:none!important;
        gap:15px!important;
      }
      #zctv-channel-hub .zctv-intro{order:1!important;grid-area:auto!important;padding:22px!important}
      #zctv-channel-hub .zctv-host-art{
        order:2!important;grid-area:auto!important;width:100%!important;
        height:clamp(280px,82vw,420px)!important;max-height:420px!important;
      }
      #zctv-channel-hub .zctv-player-column{
        order:3!important;grid-area:auto!important;width:100%!important;
      }
      #zctv-channel-hub .zctv-live-label{align-items:flex-start!important;border-radius:14px!important;flex-direction:column!important}
      #zctv-channel-hub .zctv-player-mount,#zctv-channel-hub .zc-promo-player-wrap{border-radius:13px!important}
      #zctv-channel-hub .zctv-archive{max-height:270px!important;padding:12px!important;border-radius:13px!important}
      #zctv-channel-hub .zctv-episodes{max-height:195px!important}
      #zctv-channel-hub .zctv-channels{grid-template-columns:1fr!important;gap:9px!important}
      #zctv-channel-hub .zctv-channel-card{min-height:104px!important;padding:15px!important;border-radius:13px!important}
      #zctv-channel-hub .zctv-foot{flex-direction:column!important}
    }
  `;
  document.head.appendChild(style);

  function text(node, value) { if (node) node.textContent = value; }
  function videoUrl(id) { return API + '/episodes/' + encodeURIComponent(id) + '/video'; }
  function updatePromoControls() {
    const total = promoVideos.length;
    if (promoCount) promoCount.textContent = total ? String(promoIndex + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0') : 'VIDEO LIBRARY UNAVAILABLE';
    if (promoPrev) promoPrev.disabled = total < 2 || promoIndex <= 0;
    if (promoNext) promoNext.disabled = total < 2 || promoIndex >= total - 1;
    if (promoRelease) promoRelease.href = 'https://github.com/zombcash/zombcash.github.io/releases';
  }
  function showFeaturedPromo() {
    if (!player || currentId && currentId !== 'featured-promo') return;
    const item = promoVideos[promoIndex] || { title: 'ZombieCash Promo Video', tag: 'FEATURED PROMO', date: '2026-10-24', src: FEATURED_VIDEO, releaseUrl: 'https://github.com/zombcash/zombcash.github.io/releases/tag/zombiecash-promo-2026-10' };
    player.pause();
    player.poster = FEATURED_POSTER;
    player.src = item.src || FEATURED_VIDEO;
    player.load();
    currentId = 'featured-promo';
    text(version, item.tag || 'FEATURED PROMO');
    text(status, (item.title || 'OFFICIAL ZOMBIECASH PROMO') + ' · PRESS PLAY');
    if (download) { download.href = item.src || FEATURED_VIDEO; download.textContent = 'OPEN / DOWNLOAD ↗'; }
    updatePromoControls();
    setSignal(false, 'FEATURED TRANSMISSION');
  }
  function playPromoAt(index) {
    if (!promoVideos.length) return;
    promoIndex = Math.max(0, Math.min(index, promoVideos.length - 1));
    mode = 'archive'; root.dataset.zctvMode = mode;
    if (archive) archive.hidden = false;
    currentId = '';
    showFeaturedPromo();
    updateModeButtons();
  }
  if (promoPrev) promoPrev.addEventListener('click', function () { playPromoAt(promoIndex - 1); });
  if (promoNext) promoNext.addEventListener('click', function () { playPromoAt(promoIndex + 1); });
  fetch('/promo-videos.json?v=20261110-tv-library', { cache: 'no-store', credentials: 'omit' })
    .then(function (response) { if (!response.ok) throw new Error('Promo manifest unavailable'); return response.json(); })
    .then(function (payload) {
      promoVideos = Array.isArray(payload.videos) ? payload.videos.filter(function (item) {
        if (!item || typeof item.src !== 'string') return false;
        try { return new URL(item.src, location.href).protocol === 'https:'; } catch (_) { return false; }
      }) : [];
      if (!promoVideos.length) throw new Error('No valid promo videos');
      updatePromoControls();
      if (currentId === 'featured-promo' || (!currentId && mode === 'archive')) showFeaturedPromo();
    })
    .catch(function () {
      promoVideos = [{ title: 'ZombieCash Promo Video', tag: 'FEATURED PROMO', date: '2026-10-24', src: FEATURED_VIDEO, releaseUrl: 'https://github.com/zombcash/zombcash.github.io/releases/tag/zombiecash-promo-2026-10' }];
      promoIndex = 0;
      updatePromoControls();
      if (currentId === 'featured-promo') showFeaturedPromo();
    });
  function setSignal(on, label) {
    livePlaying = !!on;
    root.dataset.zctvLive = livePlaying ? 'true' : 'false';
    const signal = liveLabel && liveLabel.querySelector('strong');
    if (signal) { signal.replaceChildren(document.createElement('i'), document.createTextNode(label)); }
  }
  function clearPlayer() {
    if (!player) return;
    player.pause();
    player.removeAttribute('src');
    player.load();
    currentId = '';
    setSignal(false, mode === 'live' ? 'LIVE SIGNAL STANDBY' : 'ARCHIVE MODE');
  }
  function showEmpty(message) {
    if (!list) return;
    const empty = document.createElement('div');
    empty.className = 'zctv-empty';
    empty.textContent = message;
    list.replaceChildren(empty);
  }
  function playEpisode(episode, autoplay) {
    if (!player || !episode || !episode.episode_id) return;
    mode = 'archive';
    root.dataset.zctvMode = mode;
    if (archive) archive.hidden = false;
    const src = videoUrl(episode.episode_id);
    if (currentId !== episode.episode_id) {
      player.pause();
      player.src = src;
      player.load();
      currentId = episode.episode_id;
    }
    setSignal(false, 'ARCHIVE PLAYBACK');
    text(version, 'SERVER ARCHIVE');
    text(status, 'ARCHIVE · ' + new Date((episode.created_at || 0) * 1000).toLocaleDateString());
    if (download) { download.href = src; download.textContent = 'OPEN / DOWNLOAD ↗'; }
    updateModeButtons();
    if (autoplay) player.play().catch(function () {});
  }
  function updateModeButtons() {
    const buttons = liveLabel ? Array.from(liveLabel.querySelectorAll('[data-zctv-mode]')) : [];
    buttons.forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.zctvMode === mode)); });
  }
  function render() {
    if (!list) return;
    text(heading, labels[active] || labels.all);
    const shown = episodes.filter(function (item) { return active === 'all' || !item.channel || item.channel === active; });
    list.replaceChildren();
    if (!shown.length) {
      showEmpty(active === 'news' ? 'No Outbreak News episodes have been published yet.' : 'No episodes in this channel yet. New transmissions will appear here.');
      if (mode === 'archive' && !currentId) {
        if (episodes.length === 0) showFeaturedPromo();
        else { text(status, 'ARCHIVE READY · AWAITING FIRST EPISODE'); text(version, 'SERVER ARCHIVE'); }
      }
      return;
    }
    shown.forEach(function (episode) {
      const article = document.createElement('article');
      article.className = 'zctv-episode';
      const copy = document.createElement('div');
      const title = document.createElement('strong');
      const meta = document.createElement('span');
      const button = document.createElement('button');
      title.textContent = episode.title || 'ZombieCash transmission';
      meta.textContent = episode.duration_seconds ? episode.duration_seconds + ' SEC' : 'SERVER EPISODE';
      copy.append(title, meta);
      button.type = 'button'; button.textContent = currentId === episode.episode_id ? 'SELECTED' : 'PLAY';
      button.addEventListener('click', function () { playEpisode(episode, true); });
      article.append(copy, button); list.append(article);
    });
  }
  function setMode(nextMode) {
    if (nextMode === 'live' && !liveUrl) {
      mode = 'live'; root.dataset.zctvMode = mode;
      clearPlayer();
      if (archive) archive.hidden = true;
      text(version, 'LIVE INPUT NOT CONFIGURED');
      text(status, 'LIVE SIGNAL UNAVAILABLE · ARCHIVE REMAINS AVAILABLE');
      if (download) { download.removeAttribute('href'); download.textContent = 'LIVE SIGNAL OFFLINE'; }
      setSignal(false, 'LIVE SIGNAL OFFLINE');
      updateModeButtons();
      return;
    }
    mode = nextMode; root.dataset.zctvMode = mode;
    if (mode === 'live') {
      if (archive) archive.hidden = true;
      clearPlayer();
      player.src = liveUrl; player.load();
      text(version, 'LIVE TRANSMISSION'); text(status, 'CONNECTING TO LIVE SIGNAL…');
      if (download) { download.removeAttribute('href'); download.textContent = 'LIVE TRANSMISSION'; }
      setSignal(false, 'CONNECTING TO LIVE');
      player.play().catch(function () { text(status, 'LIVE SIGNAL READY · PRESS PLAY'); });
    } else {
      if (archive) archive.hidden = false;
      clearPlayer();
      text(version, 'SERVER ARCHIVE'); text(status, 'ARCHIVE MODE · SELECT AN EPISODE');
      if (download) { download.removeAttribute('href'); download.textContent = 'SELECT AN EPISODE'; }
      render(); if (!currentId && promoVideos.length) showFeaturedPromo(); setSignal(false, currentId === 'featured-promo' ? 'FEATURED TRANSMISSION' : 'ARCHIVE MODE');
    }
    updateModeButtons();
  }

  if (liveLabel) {
    liveLabel.replaceChildren();
    const signal = document.createElement('strong');
    signal.append(document.createElement('i'), document.createTextNode('ARCHIVE MODE'));
    const switcher = document.createElement('div'); switcher.className = 'zctv-mode-switch';
    [['live','LIVE'],['archive','ARCHIVE']].forEach(function (item) {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.zctvMode = item[0]; button.textContent = item[1];
      button.addEventListener('click', function () { setMode(item[0]); }); switcher.append(button);
    });
    liveLabel.append(signal, switcher);
  }
  if (player) {
    player.addEventListener('playing', function () {
      if (mode === 'live' && liveUrl) { setSignal(true, 'LIVE · ON AIR'); text(status, 'LIVE TRANSMISSION IS ON AIR'); }
      else setSignal(false, 'ARCHIVE PLAYBACK');
    });
    player.addEventListener('pause', function () { if (mode === 'live') setSignal(false, 'LIVE · PAUSED'); });
    player.addEventListener('waiting', function () { if (mode === 'live') setSignal(false, 'LIVE · BUFFERING'); });
    player.addEventListener('error', function () { if (mode === 'live') { setSignal(false, 'LIVE SIGNAL ERROR'); text(status, 'LIVE STREAM COULD NOT BE PLAYED'); } });
  }
  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      active = card.dataset.channel || 'news';
      cards.forEach(function (item) { item.setAttribute('aria-pressed', String(item === card)); });
      setMode('archive');
    });
  });

  fetch(API + '/episodes?page=1&per_page=24', { cache: 'no-store', credentials: 'omit' })
    .then(function (response) { if (!response.ok) throw new Error('Archive request failed (' + response.status + ')'); return response.json(); })
    .then(function (payload) { episodes = Array.isArray(payload.episodes) ? payload.episodes : []; if (mode === 'archive') render(); })
    .catch(function () { showEmpty('SERVER ARCHIVE OFFLINE · PLEASE TRY AGAIN LATER'); text(status, 'SERVER CONNECTION UNAVAILABLE'); text(version, 'OFFLINE'); setSignal(false, 'SIGNAL UNAVAILABLE'); });

  const defaultCard = cards.find(function (card) { return card.dataset.channel === active; });
  if (defaultCard) defaultCard.setAttribute('aria-pressed', 'true');
  root.dataset.zctvMode = mode;
  setMode(mode);
})();

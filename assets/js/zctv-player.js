(function () {
  'use strict';
  const root = document.getElementById('zctv-channel-hub');
  if (!root || root.dataset.apiPlayerReady === '1') return;
  root.dataset.apiPlayerReady = '1';

  const API = 'https://zombcash-bot.fadehost.app/api/tv';
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
  const liveLabel = root.querySelector('.zctv-live-label');
  const labels = { all: 'ALL EPISODES', news: 'OUTBREAK NEWS', meme: 'MEME SHOW', lab: 'ZOMBIE LAB' };
  const metaStream = document.querySelector('meta[name="zctv-live-stream"]');
  const liveUrl = (root.dataset.liveStream || (metaStream && metaStream.content) || '').trim();
  let episodes = [];
  let active = 'news';
  let mode = liveUrl ? 'live' : 'archive';
  let currentId = '';
  let livePlaying = false;

  const style = document.createElement('style');
  style.id = 'zctv-broadcast-console-v3';
  style.textContent = `
    #zctv-channel-hub{padding:clamp(24px,3vw,42px) clamp(16px,3.5vw,56px)!important}
    #zctv-channel-hub .zctv-inner{max-width:1660px!important}
    #zctv-channel-hub .zctv-layout{display:grid!important;grid-template-columns:minmax(220px,.28fr) minmax(0,1fr)!important;gap:clamp(18px,2.4vw,36px)!important;align-items:start!important;margin:16px 0 22px!important}
    #zctv-channel-hub .zctv-host-art{display:none!important}
    #zctv-channel-hub .zctv-intro{grid-column:1!important;grid-row:1!important;align-self:center!important;padding:clamp(16px,2vw,26px)!important;border:1px solid #9bff4530!important;background:linear-gradient(145deg,#0b130d,#080c0b 72%,#100d16)!important;box-shadow:0 14px 40px #0005!important}
    #zctv-channel-hub .zctv-intro h2{font-size:clamp(22px,2.1vw,34px)!important;line-height:1.12!important}
    #zctv-channel-hub .zctv-intro p{font-size:15px!important}
    #zctv-channel-hub .zctv-host-tag{margin-top:18px!important}
    #zctv-channel-hub .zctv-player-column{grid-column:2!important;grid-row:1!important;display:flex!important;flex-direction:column!important;gap:10px!important;min-width:0!important}
    #zctv-channel-hub .zctv-live-label{min-height:48px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;padding:9px 14px!important;border:1px solid #9bff4555!important;background:linear-gradient(90deg,#0a160d,#080c0b)!important}
    #zctv-channel-hub .zctv-live-label strong{display:flex!important;align-items:center!important;gap:9px!important;color:#80907e!important;font-size:9px!important;white-space:nowrap!important}
    #zctv-channel-hub .zctv-live-label strong i{display:inline-block!important;width:9px!important;height:9px!important;border-radius:50%!important;background:#596358!important;box-shadow:none!important;flex:0 0 auto!important}
    #zctv-channel-hub[data-zctv-live="true"] .zctv-live-label strong{color:#aaff72!important}
    #zctv-channel-hub[data-zctv-live="true"] .zctv-live-label strong i{background:#9bff45!important;box-shadow:0 0 8px #9bff45,0 0 20px #9bff4580!important;animation:zctvPulse 1.5s ease-in-out infinite!important}
    #zctv-channel-hub .zctv-mode-switch{display:flex!important;gap:6px!important;flex-wrap:wrap!important}
    #zctv-channel-hub .zctv-mode-switch button{min-height:32px!important;padding:7px 13px!important;border:1px solid #40533e!important;background:#080d0a!important;color:#9aaa95!important;font:700 8px Orbitron,sans-serif!important;letter-spacing:1px!important;cursor:pointer!important}
    #zctv-channel-hub .zctv-mode-switch button[aria-pressed="true"]{border-color:#9bff45!important;color:#baff83!important;background:#142012!important;box-shadow:inset 0 0 18px #9bff4510,0 0 14px #9bff4510!important}
    #zctv-channel-hub .zctv-player-mount{width:100%!important;min-width:0!important;padding:0!important;border:0!important;background:transparent!important}
    #zctv-channel-hub .zc-promo-player-wrap{width:100%!important;max-width:none!important;border:1px solid #66834d!important;box-shadow:0 22px 65px #0009,0 0 35px #9bff4510!important}
    #zctv-channel-hub .zc-promo-player-top{min-height:42px!important;padding:10px 16px!important;background:#090f0b!important}
    #zctv-channel-hub #zc-promo-player{width:100%!important;max-height:none!important;aspect-ratio:16/9!important;object-fit:contain!important;background:#010302!important}
    #zctv-channel-hub .zc-promo-player-foot{min-height:42px!important;padding:8px 15px!important}
    #zctv-channel-hub .zctv-archive{width:100%!important;max-height:260px!important;overflow:hidden!important;border:1px solid #354a32!important;background:#080d0a!important}
    #zctv-channel-hub .zctv-archive-head{display:flex!important;justify-content:space-between!important;gap:12px!important;padding:11px 14px!important;border-bottom:1px solid #2b3b29!important;color:#a9c49e!important;font:700 8px Orbitron,sans-serif!important;letter-spacing:1px!important}
    #zctv-channel-hub .zctv-episodes{max-height:205px!important;overflow:auto!important;padding:5px 12px!important}
    #zctv-channel-hub .zctv-episode{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;padding:9px 3px!important;border-bottom:1px solid #263326!important}
    #zctv-channel-hub .zctv-episode strong{display:block!important;color:#e5f0df!important;font:700 10px Rajdhani,sans-serif!important}
    #zctv-channel-hub .zctv-episode span{display:block!important;margin-top:3px!important;color:#7f927b!important;font:600 8px Orbitron,sans-serif!important}
    #zctv-channel-hub .zctv-episode button{padding:7px 12px!important;border:1px solid #63844a!important;background:#0c160d!important;color:#aaff72!important;font:700 8px Orbitron,sans-serif!important;cursor:pointer!important}
    #zctv-channel-hub .zctv-empty{padding:14px!important;color:#82917e!important;font:500 13px Rajdhani,sans-serif!important}
    #zctv-channel-hub .zctv-channels{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;margin-top:20px!important}
    #zctv-channel-hub .zctv-channel-card{min-height:116px!important;padding:15px 17px!important}
    @keyframes zctvPulse{0%,100%{opacity:1;box-shadow:0 0 8px #9bff45,0 0 20px #9bff4580}50%{opacity:.55;box-shadow:0 0 3px #9bff45,0 0 9px #9bff4560}}
    @media(max-width:900px){#zctv-channel-hub .zctv-layout{grid-template-columns:minmax(0,1fr)!important}#zctv-channel-hub .zctv-player-column{grid-column:1!important;grid-row:1!important}#zctv-channel-hub .zctv-intro{grid-column:1!important;grid-row:2!important}}
    @media(max-width:600px){#zctv-channel-hub{padding:24px 4%!important}#zctv-channel-hub .zctv-live-label{align-items:flex-start!important;flex-direction:column!important}#zctv-channel-hub .zctv-channels{grid-template-columns:1fr!important}#zctv-channel-hub .zctv-channel-card{min-height:105px!important}#zctv-channel-hub .zctv-archive{max-height:250px!important}#zctv-channel-hub #zc-promo-player{max-height:none!important}}


    /* Cinematic studio refinement: one dominant screen, host portrait as a secondary rail. */
    #zctv-channel-hub{padding:clamp(30px,4vw,64px) clamp(14px,3vw,44px)!important;background:radial-gradient(ellipse at 72% 38%,#183b1e65 0,transparent 42%),radial-gradient(ellipse at 12% 88%,#4d26701c 0,transparent 38%),linear-gradient(130deg,#050907 0%,#080e0b 52%,#0c0a11 100%)!important}
    #zctv-channel-hub .zctv-inner{width:min(100%,1780px)!important;max-width:1780px!important;margin-inline:auto!important}
    #zctv-channel-hub .zctv-kicker{margin:0 0 18px 4px!important;color:#b9d4ae!important;letter-spacing:2.4px!important}
    #zctv-channel-hub .zctv-layout{display:grid!important;grid-template-columns:minmax(230px,.34fr) minmax(0,1.66fr)!important;grid-template-rows:auto auto!important;gap:16px clamp(18px,2.2vw,34px)!important;align-items:stretch!important;margin:0 0 22px!important}
    #zctv-channel-hub .zctv-intro{grid-column:1!important;grid-row:1!important;align-self:end!important;padding:clamp(18px,2vw,28px)!important;border:1px solid #9bff4538!important;border-radius:18px!important;background:linear-gradient(145deg,#101a12ef,#080d0bf2 72%,#110d17f2)!important;box-shadow:0 18px 55px #0008,inset 0 1px #ffffff08!important;backdrop-filter:blur(12px)!important}
    #zctv-channel-hub .zctv-intro .eyebrow{display:inline-flex!important;max-width:100%!important;padding:8px 11px!important;border:1px solid #9bff4540!important;border-radius:999px!important;background:#9bff450b!important;font-size:8px!important;letter-spacing:1px!important}
    #zctv-channel-hub .zctv-intro h2{margin:18px 0 12px!important;font-size:clamp(22px,2.1vw,34px)!important;line-height:1.08!important;letter-spacing:-.8px!important}
    #zctv-channel-hub .zctv-intro p{max-width:38ch!important;font-size:15px!important;line-height:1.48!important;color:#b4c0b0!important}
    #zctv-channel-hub .zctv-host-tag{margin-top:18px!important;padding-top:14px!important;border-top:1px solid #9bff4524!important;color:#e7f2e0!important}
    #zctv-channel-hub .zctv-host-art{grid-column:1!important;grid-row:2!important;display:flex!important;height:clamp(190px,19vw,280px)!important;min-height:190px!important;max-height:280px!important;border:1px solid #9bff4540!important;border-radius:18px!important;overflow:hidden!important;background:radial-gradient(ellipse at 50% 28%,#4a8c3d70,transparent 60%),linear-gradient(145deg,#111b13,#080c0d 75%)!important;box-shadow:0 18px 55px #0008!important}
    #zctv-channel-hub .zctv-host-art:before{inset:10px!important;border-radius:12px!important;border-color:#c2ff6d25!important}
    #zctv-channel-hub .zctv-host-art:after{top:20px!important;left:20px!important;padding:7px 10px!important;border:1px solid #9bff4545!important;border-radius:999px!important;background:#060b09b8!important;color:#d0e7c6!important;font-size:7px!important;backdrop-filter:blur(8px)!important}
    #zctv-channel-hub .zctv-host-art img{object-fit:cover!important;object-position:center 18%!important;mask-image:linear-gradient(to bottom,#000 90%,transparent 100%)!important;filter:saturate(1.08) contrast(1.04)!important}
    #zctv-channel-hub .zctv-player-column{grid-column:2!important;grid-row:1 / span 2!important;align-self:stretch!important;gap:12px!important;min-width:0!important}
    #zctv-channel-hub .zctv-live-label{min-height:50px!important;align-items:center!important;padding:9px 16px!important;border:1px solid #9bff4550!important;border-radius:999px!important;background:linear-gradient(90deg,#101b12,#0a100d 60%,#100d16)!important;box-shadow:0 8px 26px #0006!important}
    #zctv-channel-hub .zctv-live-label strong{display:flex!important;align-items:center!important;gap:9px!important;color:#9aaa94!important;font-size:9px!important}
    #zctv-channel-hub .zctv-live-label strong i{width:8px!important;height:8px!important;border-radius:50%!important;background:#596358!important}
    #zctv-channel-hub .zctv-mode-switch button{min-height:34px!important;padding:8px 16px!important;border:1px solid #52684b!important;border-radius:999px!important;background:#080e0a!important;color:#b5c4ae!important;font-size:8px!important;transition:all .2s ease!important}
    #zctv-channel-hub .zctv-mode-switch button:hover{border-color:#b5ff78!important;color:#d7ffc1!important;transform:translateY(-1px)!important}
    #zctv-channel-hub .zctv-mode-switch button[aria-pressed="true"]{border-color:#aaff72!important;border-radius:999px!important;background:linear-gradient(135deg,#9bff45,#c1ff88)!important;color:#071006!important;box-shadow:0 0 22px #9bff4526!important}
    #zctv-channel-hub .zctv-player-mount{padding:0!important;border:0!important;border-radius:20px!important;background:transparent!important;box-shadow:0 26px 80px #000a,0 0 50px #9bff4510!important;overflow:hidden!important}
    #zctv-channel-hub .zc-promo-player-wrap{width:100%!important;max-width:none!important;margin:0!important;border:1px solid #8fb97880!important;border-radius:20px!important;overflow:hidden!important;background:#020403!important;box-shadow:0 0 0 1px #ffffff06,inset 0 1px #ffffff0a!important}
    #zctv-channel-hub .zc-promo-player-top{min-height:42px!important;padding:10px 18px!important;background:linear-gradient(90deg,#111b12,#080d0b 60%,#100c14)!important}
    #zctv-channel-hub #zc-promo-player{width:100%!important;max-height:none!important;aspect-ratio:16/9!important;object-fit:contain!important;background:radial-gradient(ellipse at center,#121714,#010302 75%)!important}
    #zctv-channel-hub .zc-promo-player-foot{padding:10px 17px!important;background:#080d0b!important}
    #zctv-channel-hub .zctv-archive{max-height:310px!important;padding:14px 16px!important;border:1px solid #607d4d80!important;border-radius:16px!important;background:linear-gradient(145deg,#0d150f,#080c0a 72%,#100d15)!important;box-shadow:0 14px 38px #0007!important}
    #zctv-channel-hub .zctv-archive-head{margin:0 0 8px!important;padding:0 2px 10px!important;border-bottom:1px solid #9bff4526!important;color:#b8d6a9!important}
    #zctv-channel-hub .zctv-episodes{max-height:230px!important;gap:5px!important;padding:2px!important}
    #zctv-channel-hub .zctv-episode{padding:10px 12px!important;border:1px solid #ffffff0a!important;border-radius:10px!important;background:linear-gradient(90deg,#111a12,#0b100d)!important;transition:border-color .2s,background .2s!important}
    #zctv-channel-hub .zctv-episode:hover{border-color:#9bff4555!important;background:#142016!important}
    #zctv-channel-hub .zctv-episode strong{font-size:10px!important}
    #zctv-channel-hub .zctv-episode button{min-height:32px!important;padding:0 14px!important;border:1px solid #aaff72!important;border-radius:999px!important;background:#aaff72!important;color:#071006!important}
    #zctv-channel-hub .zctv-empty{padding:18px!important;color:#aab9a4!important}
    #zctv-channel-hub .zctv-channels{gap:12px!important;margin-top:0!important}
    #zctv-channel-hub .zctv-channel-card{min-height:124px!important;padding:17px 19px!important;border:1px solid #51644a!important;border-radius:16px!important;background:linear-gradient(145deg,#121b13,#090e0b 75%,#100d15)!important;box-shadow:0 12px 34px #0006!important;transition:transform .22s,border-color .22s,box-shadow .22s!important}
    #zctv-channel-hub .zctv-channel-card:hover{transform:translateY(-3px)!important;border-color:#aaff72!important;box-shadow:0 18px 42px #0008,0 0 24px #9bff4512!important}
    #zctv-channel-hub .zctv-channel-card[aria-pressed="true"]{border-color:#aaff72!important;background:linear-gradient(145deg,#1a2b19,#0a110c 80%)!important;box-shadow:inset 0 0 28px #9bff450c,0 0 24px #9bff4518!important}
    #zctv-channel-hub .zctv-foot{margin-top:16px!important;padding:12px 4px 0!important;border-top:1px solid #9bff4520!important;color:#82927d!important}
    @media(max-width:900px){#zctv-channel-hub .zctv-layout{grid-template-columns:minmax(0,1fr)!important;grid-template-rows:auto auto auto!important;gap:14px!important}#zctv-channel-hub .zctv-player-column{grid-column:1!important;grid-row:1!important}#zctv-channel-hub .zctv-intro{grid-column:1!important;grid-row:2!important}#zctv-channel-hub .zctv-host-art{grid-column:1!important;grid-row:3!important;height:clamp(220px,45vw,340px)!important;max-height:340px!important}#zctv-channel-hub .zctv-channels{margin-top:14px!important}}
    @media(max-width:600px){#zctv-channel-hub{padding:28px 4%!important}#zctv-channel-hub .zctv-live-label{border-radius:14px!important;align-items:flex-start!important;flex-direction:column!important}#zctv-channel-hub .zctv-channels{grid-template-columns:1fr!important;gap:9px!important}#zctv-channel-hub .zctv-channel-card{min-height:104px!important;border-radius:13px!important}#zctv-channel-hub .zctv-archive{max-height:270px!important;padding:12px!important;border-radius:13px!important}#zctv-channel-hub .zctv-episodes{max-height:195px!important}#zctv-channel-hub .zctv-player-mount,#zctv-channel-hub .zc-promo-player-wrap{border-radius:13px!important}}

  `;
  document.head.appendChild(style);

  function text(node, value) { if (node) node.textContent = value; }
  function videoUrl(id) { return API + '/episodes/' + encodeURIComponent(id) + '/video'; }
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
      if (mode === 'archive' && !currentId) { text(status, 'ARCHIVE READY · AWAITING FIRST EPISODE'); text(version, 'SERVER ARCHIVE'); }
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
      render(); setSignal(false, 'ARCHIVE MODE');
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

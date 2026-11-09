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
  const cards = Array.from(root.querySelectorAll('[data-channel]'));
  const heading = root.querySelector('[data-zctv-archive-title]');
  const status = document.getElementById('zc-promo-status');
  const version = document.getElementById('zc-promo-version');
  const download = document.getElementById('zc-promo-download');
  const labels = { all: 'ALL EPISODES', news: 'OUTBREAK NEWS', meme: 'MEME SHOW', lab: 'ZOMBIE LAB' };
  let episodes = [];
  let active = 'news';
  let currentId = '';

  function text(node, value) { if (node) node.textContent = value; }
  function videoUrl(id) {
    return API + '/episodes/' + encodeURIComponent(id) + '/video';
  }
  function clearPlayer() {
    if (!player) return;
    player.pause();
    player.removeAttribute('src');
    player.load();
    currentId = '';
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
    const src = videoUrl(episode.episode_id);
    if (currentId !== episode.episode_id) {
      player.pause();
      player.src = src;
      player.load();
      currentId = episode.episode_id;
    }
    if (oldWrap) oldWrap.style.display = 'block';
    text(version, 'SERVER ARCHIVE');
    text(status, 'SERVER ARCHIVE · ' + new Date((episode.created_at || 0) * 1000).toLocaleDateString());
    if (download) {
      download.href = src;
      download.textContent = 'OPEN / DOWNLOAD ↗';
    }
    if (autoplay) player.play().catch(function () {});
  }
  function render() {
    if (!list) return;
    text(heading, labels[active] || labels.all);
    const shown = episodes.filter(function (item) {
      return active === 'all' || !item.channel || item.channel === active;
    });
    list.replaceChildren();
    if (!shown.length) {
      clearPlayer();
      showEmpty(active === 'news'
        ? 'No Outbreak News episodes have been published yet.'
        : 'This channel is ready. New episodes will appear here after publication.');
      text(status, 'AWAITING TRANSMISSION');
      text(version, 'SERVER ARCHIVE');
      return;
    }
    shown.forEach(function (episode, index) {
      const article = document.createElement('article');
      article.className = 'zctv-episode';
      const copy = document.createElement('div');
      const title = document.createElement('strong');
      const meta = document.createElement('span');
      const button = document.createElement('button');
      title.textContent = episode.title || 'ZombieCash transmission';
      meta.textContent = episode.duration_seconds ? episode.duration_seconds + ' SEC' : 'SERVER EPISODE';
      copy.append(title, meta);
      button.type = 'button';
      button.textContent = 'PLAY';
      button.addEventListener('click', function () { playEpisode(episode, true); });
      article.append(copy, button);
      list.append(article);
      if (index === 0 && !currentId) playEpisode(episode, false);
    });
  }
  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      active = card.dataset.channel || 'news';
      cards.forEach(function (item) {
        item.setAttribute('aria-pressed', String(item === card));
      });
      render();
    });
  });

  fetch(API + '/episodes?page=1&per_page=24', { cache: 'no-store', credentials: 'omit' })
    .then(function (response) {
      if (!response.ok) throw new Error('Archive request failed (' + response.status + ')');
      return response.json();
    })
    .then(function (payload) {
      episodes = Array.isArray(payload.episodes) ? payload.episodes : [];
      render();
    })
    .catch(function () {
      showEmpty('SERVER ARCHIVE OFFLINE · PLEASE TRY AGAIN LATER');
      text(status, 'SERVER CONNECTION UNAVAILABLE');
      text(version, 'OFFLINE');
    });
  const defaultCard = cards.find(function (card) { return card.dataset.channel === active; });
  if (defaultCard) defaultCard.setAttribute('aria-pressed', 'true');
})();

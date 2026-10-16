(() => {
  const grid = document.getElementById('gallery-grid');
  const count = document.getElementById('gallery-count');
  const updated = document.getElementById('gallery-updated');
  if (!grid) return;
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const state = (title, message, link = true) => {
    grid.innerHTML = '<div class="gallery-state"><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(message) + '</p>' +
      (link ? '<a class="gallery-empty-link" href="https://t.me/ZOMBCASH" target="_blank" rel="noreferrer">OPEN @ZOMBCASH ↗</a>' : '') + '</div>';
  };
  fetch('gallery-data.json?ts=' + Date.now(), {cache:'no-store'})
    .then(response => { if (!response.ok) throw new Error('Gallery data not available'); return response.json(); })
    .then(data => {
      const items = Array.isArray(data.items) ? data.items.filter(item => item.image && item.caption) : [];
      count.textContent = items.length + ' ARCHIVED IMAGES';
      updated.textContent = data.updated_at ? 'SYNCED ' + new Date(data.updated_at).toLocaleString(undefined,{month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : 'SYNC STATUS UNKNOWN';
      if (!items.length) {
        state('NO TRANSMISSIONS INDEXED YET', 'The gallery sync has not completed its first run. The original images are still available in our Telegram channel.');
        return;
      }
      grid.innerHTML = items.map((item, index) => {
        const caption = escapeHtml(item.caption);
        const image = escapeHtml(item.image);
        const post = item.post_url ? escapeHtml(item.post_url) : 'https://t.me/ZOMBCASH';
        const date = item.date ? new Date(item.date) : null;
        const label = date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) : 'AI TRANSMISSION';
        return '<article class="gallery-card" tabindex="0" aria-label="' + caption + '">' +
          '<img src="' + image + '" alt="' + caption + '" loading="' + (index < 8 ? 'eager' : 'lazy') + '" decoding="async">' +
          '<div class="gallery-caption"><span class="gallery-number">TRANSMISSION ' + String(index + 1).padStart(3,'0') + ' · ' + escapeHtml(label) + '</span>' +
          '<p>' + caption + '</p><a href="' + post + '" target="_blank" rel="noreferrer">VIEW TELEGRAM POST ↗</a></div></article>';
      }).join('');
    })
    .catch(() => {
      count.textContent = 'ARCHIVE CONNECTION PENDING';
      updated.textContent = 'TELEGRAM SYNC UNAVAILABLE';
      state('COULD NOT LOAD THE ARCHIVE', 'Try again shortly, or open the Telegram channel directly.');
    });
})();

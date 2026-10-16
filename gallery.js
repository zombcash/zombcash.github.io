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

  // Full-size image viewer: click a card, or press Enter while it is focused.
  const lightbox = document.createElement('div');
  lightbox.className = 'gallery-lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Expanded gallery image');
  lightbox.innerHTML = '<button class="gallery-lightbox-close" type="button" aria-label="Close image">×</button><button class="gallery-lightbox-prev" type="button" aria-label="Previous image">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="gallery-lightbox-next" type="button" aria-label="Next image">›</button>';
  document.body.appendChild(lightbox);
  const fullImage = lightbox.querySelector('img');
  const fullCaption = lightbox.querySelector('figcaption');
  const closeButton = lightbox.querySelector('.gallery-lightbox-close');
  let cards = [];
  let activeIndex = 0;
  const showImage = index => {
    if (!cards.length) return;
    activeIndex = (index + cards.length) % cards.length;
    const img = cards[activeIndex].querySelector('img');
    const caption = cards[activeIndex].querySelector('.gallery-caption p');
    fullImage.src = img.currentSrc || img.src;
    fullImage.alt = img.alt || '';
    fullCaption.textContent = caption ? caption.textContent : '';
    lightbox.classList.add('is-open');
    document.body.classList.add('gallery-lightbox-open');
    closeButton.focus();
  };
  const closeImage = () => {
    lightbox.classList.remove('is-open');
    document.body.classList.remove('gallery-lightbox-open');
    fullImage.removeAttribute('src');
  };
  closeButton.addEventListener('click', closeImage);
  lightbox.querySelector('.gallery-lightbox-prev').addEventListener('click', () => showImage(activeIndex - 1));
  lightbox.querySelector('.gallery-lightbox-next').addEventListener('click', () => showImage(activeIndex + 1));
  lightbox.addEventListener('click', event => { if (event.target === lightbox) closeImage(); });
  document.addEventListener('keydown', event => {
    if (!lightbox.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeImage();
    if (event.key === 'ArrowLeft') showImage(activeIndex - 1);
    if (event.key === 'ArrowRight') showImage(activeIndex + 1);
  });

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
        return '<article class="gallery-card" tabindex="0" role="button" aria-label="Open image: ' + caption + '" data-gallery-index="' + index + '">' +
          '<img src="' + image + '" alt="' + caption + '" loading="' + (index < 8 ? 'eager' : 'lazy') + '" decoding="async">' +
          '<div class="gallery-caption"><span class="gallery-number">TRANSMISSION ' + String(index + 1).padStart(3,'0') + ' · ' + escapeHtml(label) + '</span>' +
          '<p>' + caption + '</p><a href="' + post + '" target="_blank" rel="noreferrer">VIEW TELEGRAM POST ↗</a></div></article>';
      }).join('');
      cards = Array.from(grid.querySelectorAll('.gallery-card'));
      cards.forEach((card, index) => {
        card.addEventListener('click', event => {
          if (event.target.closest('a')) return;
          showImage(index);
        });
        card.addEventListener('keydown', event => {
          if ((event.key === 'Enter' || event.key === ' ') && event.target === card) {
            event.preventDefault();
            showImage(index);
          }
        });
      });
    })
    .catch(() => {
      count.textContent = 'ARCHIVE CONNECTION PENDING';
      updated.textContent = 'TELEGRAM SYNC UNAVAILABLE';
      state('COULD NOT LOAD THE ARCHIVE', 'Try again shortly, or open the Telegram channel directly.');
    });
})();

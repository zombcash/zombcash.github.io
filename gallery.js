(() => {
  const grid = document.getElementById("gallery-grid");
  const count = document.getElementById("gallery-count");
  const updated = document.getElementById("gallery-updated");
  if (!grid) return;

  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[ch];
  });
  const cleanCaption = value => String(value ?? "")
    .replace(/\s+/g, " ")
    .split(/━━━━━━━━|🧟\s*\$ZOMBCASH|MARKET DIED\.|📋\s*CA:|🌐\s*Website:|𝕏\s*X Community|💬\s*Telegram/i)[0]
    .trim();

  const state = (title, message) => {
    grid.innerHTML = '<div class="gallery-state"><h3>' + escapeHtml(title) +
      '</h3><p>' + escapeHtml(message) +
      '</p><a class="gallery-empty-link" href="https://t.me/ZOMBCASH" target="_blank" rel="noreferrer">OPEN @ZOMBCASH ↗</a></div>';
  };

  const lightbox = document.createElement("div");
  lightbox.className = "gallery-lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Expanded gallery image");
  lightbox.innerHTML = '<button class="gallery-lightbox-close" type="button" aria-label="Close image">×</button>' +
    '<button class="gallery-lightbox-prev" type="button" aria-label="Previous image">‹</button>' +
    '<figure><img alt=""><figcaption></figcaption></figure>' +
    '<button class="gallery-lightbox-next" type="button" aria-label="Next image">›</button>';
  document.body.appendChild(lightbox);

  const fullImage = lightbox.querySelector("img");
  const fullCaption = lightbox.querySelector("figcaption");
  const closeButton = lightbox.querySelector(".gallery-lightbox-close");
  let cards = [];
  let activeIndex = 0;

  const showImage = index => {
    if (!cards.length) return;
    activeIndex = (index + cards.length) % cards.length;
    const image = cards[activeIndex].querySelector("img");
    fullImage.src = image.currentSrc || image.src;
    fullImage.alt = image.alt || "";
    fullCaption.textContent = cards[activeIndex].querySelector(".gallery-caption p")?.textContent || "";
    lightbox.classList.add("is-open");
    document.body.classList.add("gallery-lightbox-open");
    closeButton.focus();
  };
  const closeImage = () => {
    lightbox.classList.remove("is-open");
    document.body.classList.remove("gallery-lightbox-open");
    fullImage.removeAttribute("src");
  };
  closeButton.addEventListener("click", closeImage);
  lightbox.querySelector(".gallery-lightbox-prev").addEventListener("click", () => showImage(activeIndex - 1));
  lightbox.querySelector(".gallery-lightbox-next").addEventListener("click", () => showImage(activeIndex + 1));
  lightbox.addEventListener("click", event => { if (event.target === lightbox) closeImage(); });
  document.addEventListener("keydown", event => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") closeImage();
    if (event.key === "ArrowLeft") showImage(activeIndex - 1);
    if (event.key === "ArrowRight") showImage(activeIndex + 1);
  });

  // Use a short timeout so a stalled data request never leaves the spinner forever.
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Gallery data request timed out")), 12000));
  Promise.race([
    fetch("gallery-data.json?v=gallery-data-v1-20261016", { cache: "no-store" }).then(response => {
      if (!response.ok) throw new Error("Gallery data request failed: " + response.status);
      return response.json();
    }),
    timeout
  ]).then(data => {
    const allowedGalleryCaption = caption => /\bNIGHTMARE\s+DROP\b/i.test(String(caption ?? "")) || /\bZOMBIE\s+MEME(?:\s+OF\s+THE\s+HOUR)?\b/i.test(String(caption ?? ""));
    const items = Array.isArray(data.items)
      ? data.items.filter(item => item.image && item.caption && allowedGalleryCaption(item.caption))
      : [];
    if (count) count.textContent = items.length + " IMAGES";
    if (updated) updated.textContent = data.updated_at
      ? "UPDATED " + new Date(data.updated_at).toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      : "";
    if (!items.length) {
      state("NO IMAGES YET", "The Telegram archive has not synced any images yet.");
      return;
    }
    grid.innerHTML = items.map(item => {
      const caption = cleanCaption(item.caption);
      const image = escapeHtml(item.image);
      const post = item.post_url ? escapeHtml(item.post_url) : "https://t.me/ZOMBCASH";
      return '<article class="gallery-card" tabindex="0" role="button" aria-label="Open image: ' + escapeHtml(caption) + '">' +
        '<img src="' + image + '" alt="' + escapeHtml(caption) + '" loading="lazy" decoding="async">' +
        '<div class="gallery-caption"><p>' + escapeHtml(caption) + '</p>' +
        '<a href="' + post + '" target="_blank" rel="noreferrer">SOURCE ↗</a></div></article>';
    }).join("");
    cards = Array.from(grid.querySelectorAll(".gallery-card"));
    cards.forEach((card, index) => {
      const image = card.querySelector("img");
      image?.addEventListener("error", () => {
        if (image.dataset.fallbackApplied) return;
        image.dataset.fallbackApplied = "true";
        image.src = "/zombcash-hand-logo.svg";
        image.alt = "Gallery image temporarily unavailable";
      }, { once: true });
      card.addEventListener("click", event => { if (!event.target.closest("a")) showImage(index); });
      card.addEventListener("keydown", event => {
        if ((event.key === "Enter" || event.key === " ") && event.target === card) {
          event.preventDefault();
          showImage(index);
        }
      });
    });
  }).catch(error => {
    if (count) count.textContent = "ARCHIVE OFFLINE";
    if (updated) updated.textContent = "";
    state("COULD NOT LOAD IMAGES", "The gallery data request failed or timed out. Refresh the page, or open the Telegram channel directly.");
  });
})();
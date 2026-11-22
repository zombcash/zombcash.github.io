// Gallery cards reserve their intrinsic dimensions to prevent layout shifts.
(() => {
  const grid = document.getElementById("gallery-grid");
  const count = document.getElementById("gallery-count");
  const updated = document.getElementById("gallery-updated");
  if (!grid) return;

  const galleryLocale = {
    en:{images:"IMAGES",updated:"UPDATED",offline:"ARCHIVE OFFLINE",none:"NO IMAGES YET",noneMsg:"The Telegram archive has not synced any images yet.",error:"COULD NOT LOAD IMAGES",errorMsg:"The gallery data request failed or timed out. Refresh the page, or open the Telegram channel directly.",close:"CLOSE",closeAria:"Close fullscreen image",source:"SOURCE ↗",open:"OPEN @ZOMBCASH ↗"},
    ru:{images:"ИЗОБРАЖЕНИЙ",updated:"ОБНОВЛЕНО",offline:"АРХИВ НЕДОСТУПЕН",none:"ПОКА НЕТ ИЗОБРАЖЕНИЙ",noneMsg:"Архив Telegram ещё не синхронизировал изображения.",error:"НЕ УДАЛОСЬ ЗАГРУЗИТЬ ИЗОБРАЖЕНИЯ",errorMsg:"Не удалось загрузить данные галереи или истекло время ожидания. Обнови страницу или открой Telegram-канал.",close:"ЗАКРЫТЬ",closeAria:"Закрыть полноэкранный просмотр",source:"ИСТОЧНИК ↗",open:"ОТКРЫТЬ @ZOMBCASH ↗"},
    de:{images:"BILDER",updated:"AKTUALISIERT",offline:"ARCHIV OFFLINE",none:"NOCH KEINE BILDER",noneMsg:"Das Telegram-Archiv hat noch keine Bilder synchronisiert.",error:"BILDER KONNTEN NICHT GELADEN WERDEN",errorMsg:"Die Galerie-Datenanfrage ist fehlgeschlagen oder abgelaufen. Aktualisiere die Seite oder öffne direkt den Telegram-Kanal.",close:"SCHLIESSEN",closeAria:"Vollbildansicht schließen",source:"QUELLE ↗",open:"@ZOMBCASH ÖFFNEN ↗"},
    fr:{images:"IMAGES",updated:"MIS À JOUR",offline:"ARCHIVES HORS LIGNE",none:"PAS ENCORE D’IMAGES",noneMsg:"L’archive Telegram n’a pas encore synchronisé d’images.",error:"IMPOSSIBLE DE CHARGER LES IMAGES",errorMsg:"La demande de données de la galerie a échoué ou expiré. Actualisez la page ou ouvrez directement le canal Telegram.",close:"FERMER",closeAria:"Fermer l’image en plein écran",source:"SOURCE ↗",open:"OUVRIR @ZOMBCASH ↗"},
    it:{images:"IMMAGINI",updated:"AGGIORNATO",offline:"ARCHIVIO OFFLINE",none:"ANCORA NESSUNA IMMAGINE",noneMsg:"L’archivio Telegram non ha ancora sincronizzato immagini.",error:"IMPOSSIBILE CARICARE LE IMMAGINI",errorMsg:"La richiesta dei dati della galleria non è riuscita o è scaduta. Aggiorna la pagina o apri direttamente il canale Telegram.",close:"CHIUDI",closeAria:"Chiudi la visualizzazione a schermo intero",source:"FONTE ↗",open:"APRI @ZOMBCASH ↗"},
    ja:{images:"枚",updated:"更新",offline:"アーカイブ停止中",none:"画像はまだありません",noneMsg:"Telegramアーカイブにはまだ画像が同期されていません。",error:"画像を読み込めませんでした",errorMsg:"ギャラリーデータの取得に失敗したか、タイムアウトしました。ページを更新するか、Telegramチャンネルを直接開いてください。",close:"閉じる",closeAria:"全画面表示を閉じる",source:"出典 ↗",open:"@ZOMBCASHを開く ↗"},
    "zh-CN":{images:"张图片",updated:"更新于",offline:"档案离线",none:"暂无图片",noneMsg:"Telegram 档案库尚未同步任何图片。",error:"无法加载图片",errorMsg:"图库数据请求失败或超时。请刷新页面，或直接打开 Telegram 频道。",close:"关闭",closeAria:"关闭全屏图片",source:"来源 ↗",open:"打开 @ZOMBCASH ↗"},
    tr:{images:"GÖRSEL",updated:"GÜNCELLENDİ",offline:"ARŞİV ÇEVRİMDIŞI",none:"HENÜZ GÖRSEL YOK",noneMsg:"Telegram arşivi henüz hiçbir görseli senkronize etmedi.",error:"GÖRSELLER YÜKLENEMEDİ",errorMsg:"Galeri veri isteği başarısız oldu veya zaman aşımına uğradı. Sayfayı yenile ya da Telegram kanalını doğrudan aç.",close:"KAPAT",closeAria:"Tam ekran görüntüsünü kapat",source:"KAYNAK ↗",open:"@ZOMBCASH'İ AÇ ↗"},
    hi:{images:"इमेज",updated:"अपडेट",offline:"आर्काइव ऑफ़लाइन",none:"अभी कोई इमेज नहीं",noneMsg:"Telegram आर्काइव ने अभी तक कोई इमेज सिंक नहीं की है।",error:"इमेज लोड नहीं हो सकीं",errorMsg:"गैलरी डेटा अनुरोध विफल हुआ या समय समाप्त हो गया। पेज रीफ़्रेश करें या Telegram चैनल सीधे खोलें।",close:"बंद करें",closeAria:"फ़ुल-स्क्रीन छवि बंद करें",source:"स्रोत ↗",open:"@ZOMBCASH खोलें ↗"}
  };
  const galleryShareLabels = {
    en:{share:"SHARE",copied:"LINK COPIED",shared:"SHARE COMPLETED",cancelled:"SHARE CANCELLED",unavailable:"SHARING UNAVAILABLE",error:"SHARE FAILED",title:"SHARE THIS IMAGE",hint:"Choose where to share this ZombieCash artwork.",copy:"COPY IMAGE LINK",close:"CLOSE"},
    ru:{share:"ПОДЕЛИТЬСЯ",copied:"ССЫЛКА СКОПИРОВАНА",shared:"ОТПРАВКА ЗАВЕРШЕНА",cancelled:"ОТПРАВКА ОТМЕНЕНА",unavailable:"ОТПРАВКА НЕДОСТУПНА",error:"НЕ УДАЛОСЬ ПОДЕЛИТЬСЯ",title:"ПОДЕЛИТЬСЯ ИЗОБРАЖЕНИЕМ",hint:"Выберите площадку для публикации арта ZombieCash.",copy:"КОПИРОВАТЬ ССЫЛКУ",close:"ЗАКРЫТЬ"},
    de:{share:"TEILEN",copied:"LINK KOPIERT",shared:"TEILEN ABGESCHLOSSEN",cancelled:"TEILEN ABGEBROCHEN",unavailable:"TEILEN NICHT VERFÜGBAR",error:"TEILEN FEHLGESCHLAGEN",title:"DIESES BILD TEILEN",hint:"Wähle eine Plattform für dieses ZombieCash-Motiv.",copy:"BILDLINK KOPIEREN",close:"SCHLIESSEN"},
    fr:{share:"PARTAGER",copied:"LIEN COPIÉ",shared:"PARTAGE TERMINÉ",cancelled:"PARTAGE ANNULÉ",unavailable:"PARTAGE INDISPONIBLE",error:"ÉCHEC DU PARTAGE",title:"PARTAGER CETTE IMAGE",hint:"Choisissez où partager cette création ZombieCash.",copy:"COPIER LE LIEN",close:"FERMER"},
    it:{share:"CONDIVIDI",copied:"LINK COPIATO",shared:"CONDIVISIONE COMPLETATA",cancelled:"CONDIVISIONE ANNULLATA",unavailable:"CONDIVISIONE NON DISPONIBILE",error:"CONDIVISIONE NON RIUSCITA",title:"CONDIVIDI QUESTA IMMAGINE",hint:"Scegli dove condividere questa creazione ZombieCash.",copy:"COPIA IL LINK",close:"CHIUDI"},
    ja:{share:"共有",copied:"リンクをコピーしました",shared:"共有を完了しました",cancelled:"共有をキャンセルしました",unavailable:"共有できません",error:"共有に失敗しました",title:"この画像を共有",hint:"ZombieCashのアートを共有する場所を選択してください。",copy:"画像リンクをコピー",close:"閉じる"},
    "zh-CN":{share:"分享",copied:"链接已复制",shared:"分享已完成",cancelled:"已取消分享",unavailable:"暂无法分享",error:"分享失败",title:"分享这张图片",hint:"选择分享这幅 ZombieCash 作品的平台。",copy:"复制图片链接",close:"关闭"},
    tr:{share:"PAYLAŞ",copied:"BAĞLANTI KOPYALANDI",shared:"PAYLAŞIM TAMAMLANDI",cancelled:"PAYLAŞIM İPTAL EDİLDİ",unavailable:"PAYLAŞIM KULLANILAMIYOR",error:"PAYLAŞIM BAŞARISIZ",title:"BU GÖRSELİ PAYLAŞ",hint:"ZombieCash çalışmasını paylaşacağın platformu seç.",copy:"GÖRSEL LİNKİNİ KOPYALA",close:"KAPAT"},
    hi:{share:"साझा करें",copied:"लिंक कॉपी हुआ",shared:"शेयर पूरा हुआ",cancelled:"शेयर रद्द हुआ",unavailable:"साझा करना उपलब्ध नहीं",error:"साझा नहीं हो सका",title:"यह इमेज शेयर करें",hint:"ZombieCash आर्टवर्क साझा करने के लिए प्लेटफ़ॉर्म चुनें।",copy:"इमेज लिंक कॉपी करें",close:"बंद करें"}
  };
  let galleryLang=document.documentElement.lang||"en";
  let refreshGalleryControls = () => {};
  const gtx=k=>(galleryLocale[galleryLang]||galleryLocale.en)[k]||galleryLocale.en[k]||k;
  const localizeGalleryMeta=(items,updatedAt)=>{if(count&&items!==null)count.textContent=items.length+" "+gtx("images");if(updated)updated.textContent=updatedAt?gtx("updated")+" "+new Date(updatedAt).toLocaleString(galleryLang,{month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit"}):"";};
  document.addEventListener("zombcash:languagechange",e=>{galleryLang=e.detail?.language||document.documentElement.lang||"en";galleryShareMenu.hidden=true;const shareButton=lightbox.querySelector(".gallery-lightbox-share");if(shareButton){const shareLabels=galleryShareLabels[galleryLang]||galleryShareLabels.en;shareButton.textContent=shareLabels.share;shareButton.setAttribute("aria-label",shareLabels.share);}grid.querySelectorAll(".gallery-caption p").forEach(p=>{p.textContent=cleanCardTitle(p.dataset.originalTitle||p.dataset.originalCaption||p.textContent);});grid.querySelectorAll(".gallery-caption a").forEach(a=>a.textContent=gtx("source"));if(count&&/IMAGES|ИЗОБРАЖЕНИЙ|BILDER|IMAGES|IMMAGINI|枚|张图片|GÖRSEL|इमेज/.test(count.textContent)){const n=parseInt(count.textContent,10);if(Number.isFinite(n))count.textContent=n+" "+gtx("images");}if(updated&&updated.textContent){const raw=updated.textContent.replace(/^(UPDATED|ОБНОВЛЕНО|AKTUALISIERT|MIS À JOUR|AGGIORNATO|更新|更新于|GÜNCELLENDİ|अपडेट)\s*/,"");updated.textContent=gtx("updated")+" "+raw;}refreshGalleryControls();});
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[ch];
  });
  const cleanCaption = value => String(value ?? "")
    .replace(/\\n+/g, " ")
    .replace(/\s+/g, " ")
    .split(/━━━━━━━━|🧟\s*\$ZOMBCASH|MARKET DIED\.|📋\s*CA:|🌐\s*Website:|𝕏\s*X Community|💬\s*Telegram/i)[0]
    .trim();
  const cleanCardTitle = value => cleanCaption(value)
    .replace(/^(?:🩸|🌙|😂|🛰️)\s*(?:NIGHTMARE\s*&\s*HORROR|NIGHTMARE\s+DROP|ZOMBIECASH\s+MEMES?|ZOMBIE\s+MEME(?:\s+OF\s+THE\s+HOUR)?|UNDEAD\s+AFTER\s+DARK|ZOMBIECASH\s+SITE\s+TRANSMISSION)\s*/i, "")
    .trim();

  const state = (title, message) => {
    grid.innerHTML = '<div class="gallery-state"><h3>' + escapeHtml(title) +
      '</h3><p>' + escapeHtml(message) +
      '</p><a class="gallery-empty-link" href="https://t.me/ZOMBCASH" target="_blank" rel="noreferrer">'+escapeHtml(gtx("open"))+'</a></div>';
  };

  const lightbox = document.createElement("div");
  lightbox.className = "gallery-lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Expanded gallery image");
  lightbox.innerHTML = '<button class="gallery-lightbox-close" type="button" aria-label="Close fullscreen image">✕ <span>CLOSE</span></button>' +
    '<button class="gallery-lightbox-image-only" type="button" aria-label="View image only" title="View image only">⛶</button>' +
    '<button class="gallery-lightbox-prev" type="button" aria-label="Previous image">‹</button>' +
    '<figure><img alt=""><figcaption></figcaption></figure>' +
    '<button class="gallery-lightbox-next" type="button" aria-label="Next image">›</button>';
  document.body.appendChild(lightbox);
  const galleryShareMenu = document.createElement("div");
  galleryShareMenu.className = "gallery-share-menu";
  galleryShareMenu.hidden = true;
  galleryShareMenu.setAttribute("role", "group");
  galleryShareMenu.setAttribute("aria-label", "Share this image");
  lightbox.appendChild(galleryShareMenu);

  const fullImage = lightbox.querySelector("img");
  const fullCaption = lightbox.querySelector("figcaption");
  const closeButton = lightbox.querySelector(".gallery-lightbox-close");
  const imageOnlyButton = lightbox.querySelector(".gallery-lightbox-image-only");
  imageOnlyButton.addEventListener("click", () => {
    const enteringImageOnly = !lightbox.classList.contains("is-image-only");
    lightbox.classList.toggle("is-image-only", enteringImageOnly);
    imageOnlyButton.setAttribute("aria-pressed", enteringImageOnly ? "true" : "false");
    imageOnlyButton.setAttribute("aria-label", enteringImageOnly ? "Return to image details" : "View image only");
    imageOnlyButton.setAttribute("title", enteringImageOnly ? "Return to image details" : "View image only");
    if (enteringImageOnly) fullImage.focus?.();
    else imageOnlyButton.focus();
  });
  const updateCloseLabel = () => {
    const locale = galleryLocale[galleryLang] || galleryLocale.en;
    closeButton.setAttribute("aria-label", locale.closeAria || galleryLocale.en.closeAria);
    closeButton.innerHTML = '✕ <span>' + (locale.close || galleryLocale.en.close) + '</span>';
  };
  updateCloseLabel();
  document.addEventListener("zombcash:languagechange", event => {
    galleryLang = event.detail?.language || document.documentElement.lang || "en";
    updateCloseLabel();
  });
  let cards = [];
  let activeIndex = 0;
  const galleryLikeStats = new Map();
  let galleryLikeLabels = {like:"LIKE",unlike:"LIKED",loginLike:"Log in with Telegram to like",likeError:"Could not update like. Try again."};
  let handleGalleryLike = null;
  let refreshGalleryForLikes = () => {};
  const trackGalleryEvent = (event, target = "gallery") => { try { window.ZombieCashTrack?.(event, target); } catch (_) {} };
  const readGalleryToken = () => {
    try { return window.ZombieCashSurvivorAuth?.getToken?.() || localStorage.getItem("zombcash-survivor-token") || ""; }
    catch (_) { return ""; }
  };
  const likeStateFor = card => galleryLikeStats.get(card?.dataset?.galleryId || "") || {like_count:0,liked:false};
  const updateCardLikeButton = card => {
    const button = card?.querySelector(".gallery-like-button");
    if (!button) return;
    const stats = likeStateFor(card);
    button.setAttribute("aria-pressed", stats.liked ? "true" : "false");
    button.setAttribute("aria-label", (stats.liked ? galleryLikeLabels.unlike : galleryLikeLabels.like) + ": " + stats.like_count);
    button.title = readGalleryToken() ? (stats.liked ? galleryLikeLabels.unlike : galleryLikeLabels.like) : galleryLikeLabels.loginLike;
    button.innerHTML = '<span class="gallery-like-heart" aria-hidden="true">' + (stats.liked ? "♥" : "♡") + '</span><span class="gallery-like-count">' + Number(stats.like_count || 0) + '</span>';
  };
  const syncLightboxLikeButton = () => {
    const button = lightbox.querySelector(".gallery-lightbox-like");
    const card = cards[activeIndex];
    if (!button || !card) return;
    const stats = likeStateFor(card);
    button.setAttribute("aria-pressed", stats.liked ? "true" : "false");
    button.setAttribute("aria-label", (stats.liked ? galleryLikeLabels.unlike : galleryLikeLabels.like) + ": " + stats.like_count);
    button.title = readGalleryToken() ? (stats.liked ? galleryLikeLabels.unlike : galleryLikeLabels.like) : galleryLikeLabels.loginLike;
    button.innerHTML = (stats.liked ? "♥ " + galleryLikeLabels.unlike : "♡ " + galleryLikeLabels.like) + " · " + Number(stats.like_count || 0);
  };

  const showImage = index => {
    if (!cards.length) return;
    galleryShareMenu.hidden = true;
    const preserveImageOnly = lightbox.classList.contains("is-open") && lightbox.classList.contains("is-image-only");
    activeIndex = (index + cards.length) % cards.length;
    const image = cards[activeIndex].querySelector("img");
    fullImage.src = image.currentSrc || image.src;
    fullImage.alt = image.alt || "";
    lightbox.classList.toggle("is-image-only", preserveImageOnly);
    imageOnlyButton.setAttribute("aria-pressed", preserveImageOnly ? "true" : "false");
    imageOnlyButton.setAttribute("aria-label", preserveImageOnly ? "Return to image details" : "View image only");
    imageOnlyButton.setAttribute("title", preserveImageOnly ? "Return to image details" : "View image only");
    const card = cards[activeIndex];
    const title = card.dataset.galleryTitle || card.querySelector(".gallery-caption p")?.textContent || "";
    const originalCaption = card.querySelector(".gallery-caption p")?.dataset.originalCaption || "";
    const description = card.dataset.galleryDescription || "";
    const normalizeLightboxText = value => String(value || "").toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, " ").trim();
    const normalizedTitle = normalizeLightboxText(cleanCaption(title));
    const normalizedCaption = normalizeLightboxText(cleanCaption(originalCaption));
    const normalizedDescription = normalizeLightboxText(cleanCaption(description));
    const titleIsDuplicate = !normalizedTitle || !normalizedCaption ||
      normalizedCaption.startsWith(normalizedTitle) || normalizedTitle.startsWith(normalizedCaption);
    const descriptionIsDuplicate = !normalizedDescription ||
      normalizedDescription === normalizedCaption ||
      normalizedDescription === normalizedTitle ||
      normalizedCaption.startsWith(normalizedDescription) ||
      normalizedDescription.startsWith(normalizedCaption) ||
      normalizedTitle.startsWith(normalizedDescription) ||
      normalizedDescription.startsWith(normalizedTitle);
    const captionToShow = titleIsDuplicate
      ? cleanCaption(originalCaption)
      : (!descriptionIsDuplicate ? cleanCaption(description) : "");
    const categories = Array.from(card.querySelectorAll(".gallery-category-tag"))
      .map(tag => tag.textContent.trim()).filter(Boolean).join(" · ");
    const sourceUrl = card.querySelector(".gallery-caption a")?.href || "https://t.me/ZOMBCASH";
    const shareLabels = galleryShareLabels[galleryLang] || galleryShareLabels.en;
    trackGalleryEvent("gallery_image_open", "image_" + String(card.dataset.galleryId || "").replace(/[^0-9]/g, "_"));
    fullCaption.innerHTML =
      (!titleIsDuplicate ? '<strong class="gallery-lightbox-title">' + escapeHtml(title) + '</strong>' : '') +
      (captionToShow ? '<span class="gallery-lightbox-description gallery-lightbox-caption">' + escapeHtml(captionToShow) + '</span>' : '') +
      (categories ? '<span class="gallery-lightbox-categories">' + escapeHtml(categories) + '</span>' : '') +
      '<span class="gallery-lightbox-actions">' +
      '<button class="gallery-lightbox-like" type="button" aria-pressed="false"></button>' +
      '<button class="gallery-lightbox-share" type="button" aria-label="' + escapeHtml(shareLabels.share) + '">' + escapeHtml(shareLabels.share) + '</button>' +
      '<span class="gallery-share-status" role="status" aria-live="polite"></span>' +
      '</span>' +
      '<a class="gallery-lightbox-source" href="' + escapeHtml(sourceUrl) + '" target="_blank" rel="noreferrer">' + escapeHtml(gtx("source")) + '</a>';
    syncLightboxLikeButton();
    lightbox.classList.add("is-open");
    document.body.classList.add("gallery-lightbox-open");
    closeButton.focus();
  };
  const closeImage = () => {
    galleryShareMenu.hidden = true;
    lightbox.classList.remove("is-open");
    document.body.classList.remove("gallery-lightbox-open");
    fullImage.removeAttribute("src");
    refreshGalleryForLikes();
  };
  closeButton.addEventListener("click", closeImage);
  fullImage.tabIndex = 0;
  lightbox.querySelector(".gallery-lightbox-prev").addEventListener("click", () => showImage(activeIndex - 1));
  lightbox.querySelector(".gallery-lightbox-next").addEventListener("click", () => showImage(activeIndex + 1));
  lightbox.addEventListener("click", async event => {
    const likeButton = event.target.closest(".gallery-lightbox-like");
    if (likeButton) {
      event.preventDefault();
      event.stopPropagation();
      if (handleGalleryLike && cards[activeIndex]) handleGalleryLike(cards[activeIndex]);
      return;
    }
    const shareButton = event.target.closest(".gallery-lightbox-share");
    if (shareButton) {
      event.preventDefault();
      event.stopPropagation();
      const card = cards[activeIndex];
      if (!card) return;
      const menu = galleryShareMenu;
      if (!menu) return;
      const shareUrl = new URL("/gallery.html", window.location.origin);
      const imageAnchor = card.id || card.dataset.galleryId || "";
      if (imageAnchor) {
        shareUrl.searchParams.set("image", imageAnchor);
        shareUrl.hash = imageAnchor;
      }
      const url = shareUrl.href;
      const title = card.dataset.galleryTitle || "ZombieCash Gallery";
      const caption = card.querySelector(".gallery-caption p")?.dataset.originalCaption || title;
      const message = (caption || title) + " — $ZOMBCASH";
      const enc = encodeURIComponent;
      const links = [
        ["Telegram", "https://t.me/share/url?url=" + enc(url) + "&text=" + enc(message)],
        ["X (Twitter)", "https://twitter.com/intent/tweet?url=" + enc(url) + "&text=" + enc(message)],
        ["Bluesky", "https://bsky.app/intent/compose?text=" + enc(message + " " + url)],
        ["Facebook", "https://www.facebook.com/sharer/sharer.php?u=" + enc(url)],
        ["Reddit", "https://www.reddit.com/submit?url=" + enc(url) + "&title=" + enc(title)],
        ["WhatsApp", "https://api.whatsapp.com/send?text=" + enc(message + " " + url)]
      ];
      const labels = galleryShareLabels[galleryLang] || galleryShareLabels.en;
      menu.innerHTML = '<div class="gallery-share-panel"><div class="gallery-share-panel-head"><div><span class="gallery-share-eyebrow">$ZOMBCASH · SOCIAL TRANSMISSION</span><h2>' + escapeHtml(labels.title) + '</h2><p>' + escapeHtml(labels.hint) + '</p></div><button class="gallery-share-close" type="button" aria-label="' + escapeHtml(labels.close) + '">×</button></div><div class="gallery-share-grid">' +
        links.map(([name, href]) => '<a class="gallery-share-option" href="' + escapeHtml(href) + '" target="_blank" rel="noopener noreferrer"><span>' + escapeHtml(name) + '</span><b aria-hidden="true">↗</b></a>').join("") +
        '</div><button class="gallery-share-copy" type="button" data-share-url="' + escapeHtml(url) + '"><span>⧉</span>' + escapeHtml(labels.copy) + '</button></div>';
      menu.hidden = !menu.hidden;
      shareButton.setAttribute("aria-expanded", menu.hidden ? "false" : "true");
      const status = lightbox.querySelector(".gallery-share-status");
      if (status) { status.textContent = ""; status.dataset.state = ""; }
      trackGalleryEvent("gallery_share_menu_open", "image_" + String(card.dataset.galleryId || "").replace(/[^0-9]/g, "_"));
      return;
    }
    const shareClose = event.target.closest(".gallery-share-close");
    if (shareClose) {
      event.preventDefault();
      galleryShareMenu.hidden = true;
      lightbox.querySelector(".gallery-lightbox-share")?.setAttribute("aria-expanded", "false");
      lightbox.querySelector(".gallery-lightbox-share")?.focus();
      return;
    }
    const copyButton = event.target.closest(".gallery-share-copy");
    if (copyButton) {
      event.preventDefault();
      event.stopPropagation();
      const url = copyButton.dataset.shareUrl || "";
      const status = lightbox.querySelector(".gallery-share-status");
      let copied = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          copied = true;
        }
      } catch (_) {}
      if (!copied) {
        const field = document.createElement("textarea");
        field.value = url;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        try { copied = document.execCommand("copy"); } catch (_) {}
        field.remove();
      }
      if (status) {
        status.textContent = copied ? (galleryShareLabels[galleryLang] || galleryShareLabels.en).copied : (galleryShareLabels[galleryLang] || galleryShareLabels.en).error;
        status.dataset.state = copied ? "success" : "error";
      }
      if (copied) copyButton.innerHTML = "✓ " + escapeHtml((galleryShareLabels[galleryLang] || galleryShareLabels.en).copied);
      return;
    }
    if (event.target === lightbox) closeImage();
  });
  document.addEventListener("keydown", event => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      if (lightbox.classList.contains("is-image-only")) {
        lightbox.classList.remove("is-image-only");
        imageOnlyButton.setAttribute("aria-pressed", "false");
        imageOnlyButton.setAttribute("aria-label", "View image only");
        imageOnlyButton.setAttribute("title", "View image only");
        imageOnlyButton.focus();
      } else closeImage();
    }
    if (event.key === "ArrowLeft") showImage(activeIndex - 1);
    if (event.key === "ArrowRight") showImage(activeIndex + 1);
  });

  // Use a short timeout so a stalled data request never leaves the spinner forever.
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Gallery data request timed out")), 12000));
  Promise.race([
    fetch("/gallery-data.json?v=gallery-data-v2-undead-reach-20261103", { cache: "no-store" }).then(response => {
      if (!response.ok) throw new Error("Gallery data request failed: " + response.status);
      return response.json();
    }),
    timeout
  ]).then(data => {
    const allowedGalleryCaption = caption =>
      /\bNIGHTMARE\s+DROP\b/i.test(String(caption ?? "")) ||
      /\bZOMBIE\s+MEME(?:\s+OF\s+THE\s+HOUR)?\b/i.test(String(caption ?? "")) ||
      /\bUNDEAD\s+AFTER\s+DARK\b/i.test(String(caption ?? ""));
    const items = Array.isArray(data.items)
      ? data.items.filter(item => item.image && item.caption && !/\bZOMBIECASH\s+SITE\s+SPOTLIGHT\b/i.test(String(item.caption)) && (Array.isArray(item.category_ids) ? item.category_ids.length : allowedGalleryCaption(item.caption)))
      : [];
    localizeGalleryMeta(items, data.updated_at);
    if (!items.length) {
      state(gtx("none"), gtx("noneMsg"));
      return;
    }

    const controlText = {
      en:{previousPage:"← PREVIOUS 200",nextPage:"NEXT 200 →",page:"PAGE",mostLiked:"Most liked",like:"LIKE",unlike:"LIKED",loginLike:"Log in with Telegram to like",likeError:"Could not update like. Try again.",categories:"Gallery categories",clear:"Clear filters",all:"ALL ART",search:"Search titles, captions or tags…",sort:"SORT",newest:"Newest first",oldest:"Oldest first",results:"RESULTS",empty:"No images match this filter."},
      ru:{previousPage:"← ПРЕДЫДУЩИЕ 200",nextPage:"СЛЕДУЮЩИЕ 200 →",page:"СТРАНИЦА",mostLiked:"Сначала популярные",like:"НРАВИТСЯ",unlike:"ОТМЕЧЕНО",loginLike:"Войдите через Telegram, чтобы отметить",likeError:"Не удалось обновить отметку. Попробуйте ещё раз.",categories:"Категории галереи",clear:"Сбросить фильтры",all:"ВСЕ РАБОТЫ",search:"Поиск по названию, описанию или тегам…",sort:"СОРТИРОВКА",newest:"Сначала новые",oldest:"Сначала старые",results:"НАЙДЕНО",empty:"По этому фильтру изображений нет."},
      de:{previousPage:"← VORHERIGE 200",nextPage:"NÄCHSTE 200 →",page:"SEITE",mostLiked:"Am beliebtesten",like:"GEFÄLLT MIR",unlike:"GEFÄLLT DIR",loginLike:"Mit Telegram anmelden, um zu liken",likeError:"Like konnte nicht gespeichert werden. Bitte erneut versuchen.",categories:"Galeriekategorien",clear:"Filter zurücksetzen",all:"ALLE BILDER",search:"Titel, Beschreibungen oder Tags suchen…",sort:"SORTIEREN",newest:"Neueste zuerst",oldest:"Älteste zuerst",results:"ERGEBNISSE",empty:"Keine Bilder für diesen Filter."},
      fr:{previousPage:"← 200 PRÉCÉDENTES",nextPage:"200 SUIVANTES →",page:"PAGE",mostLiked:"Les plus aimées",like:"J’AIME",unlike:"AIMÉ",loginLike:"Connectez-vous avec Telegram pour aimer",likeError:"Impossible d’enregistrer le like. Réessayez.",categories:"Catégories de la galerie",clear:"Effacer les filtres",all:"TOUTES LES ŒUVRES",search:"Rechercher titres, descriptions ou tags…",sort:"TRIER",newest:"Plus récentes",oldest:"Plus anciennes",results:"RÉSULTATS",empty:"Aucune image ne correspond à ce filtre."},
      it:{previousPage:"← 200 PRECEDENTI",nextPage:"200 SUCCESSIVE →",page:"PAGINA",mostLiked:"Più apprezzate",like:"MI PIACE",unlike:"TI PIACE",loginLike:"Accedi con Telegram per mettere Mi piace",likeError:"Impossibile aggiornare il Mi piace. Riprova.",categories:"Categorie della galleria",clear:"Azzera filtri",all:"TUTTE LE OPERE",search:"Cerca titoli, descrizioni o tag…",sort:"ORDINA",newest:"Prima le più recenti",oldest:"Prima le più vecchie",results:"RISULTATI",empty:"Nessuna immagine corrisponde al filtro."},
      ja:{previousPage:"← 前の200件",nextPage:"次の200件 →",page:"ページ",mostLiked:"人気順",like:"いいね",unlike:"いいね済み",loginLike:"いいねするにはTelegramでログイン",likeError:"いいねを更新できません。再試行してください。",categories:"ギャラリーのカテゴリ",clear:"フィルターを解除",all:"すべての作品",search:"タイトル・説明・タグを検索…",sort:"並べ替え",newest:"新しい順",oldest:"古い順",results:"件数",empty:"条件に一致する画像はありません。"},
      "zh-CN":{previousPage:"← 上一组200张",nextPage:"下一组200张 →",page:"页码",mostLiked:"最受欢迎",like:"点赞",unlike:"已点赞",loginLike:"使用 Telegram 登录后点赞",likeError:"点赞更新失败，请重试。",categories:"图库分类",clear:"清除筛选",all:"全部作品",search:"搜索标题、说明或标签…",sort:"排序",newest:"最新优先",oldest:"最早优先",results:"结果",empty:"没有符合筛选条件的图片。"},
      tr:{previousPage:"← ÖNCEKİ 200",nextPage:"SONRAKİ 200 →",page:"SAYFA",mostLiked:"En çok beğenilen",like:"BEĞEN",unlike:"BEĞENİLDİ",loginLike:"Beğenmek için Telegram ile giriş yap",likeError:"Beğeni güncellenemedi. Tekrar dene.",categories:"Galeri kategorileri",clear:"Filtreleri temizle",all:"TÜM GÖRSELLER",search:"Başlık, açıklama veya etiket ara…",sort:"SIRALA",newest:"En yeni önce",oldest:"En eski önce",results:"SONUÇLAR",empty:"Bu filtreyle eşleşen görsel yok."},
      hi:{previousPage:"← पिछले 200",nextPage:"अगले 200 →",page:"पृष्ठ",mostLiked:"सबसे लोकप्रिय",like:"पसंद",unlike:"पसंद किया",loginLike:"पसंद करने के लिए Telegram से लॉग इन करें",likeError:"पसंद अपडेट नहीं हो सकी। फिर प्रयास करें।",categories:"गैलरी श्रेणियाँ",clear:"फ़िल्टर साफ़ करें",all:"सभी कलाकृतियाँ",search:"शीर्षक, विवरण या टैग खोजें…",sort:"क्रम",newest:"नवीनतम पहले",oldest:"सबसे पुरानी पहले",results:"परिणाम",empty:"इस फ़िल्टर से कोई इमेज नहीं मिली।"}
    };
    const categoryText = {
      en:{"zombie-memes":"Zombie Memes","nightmare-horror":"Nightmare & Horror","undead-after-dark":"Undead After Dark","zombie-characters":"Zombie Characters","apocalypse-survival":"Apocalypse & Survival","crypto-apocalypse":"Crypto Apocalypse","community-creations":"Community Creations"},
      ru:{"zombie-memes":"Зомби-мемы","nightmare-horror":"Кошмары и хоррор","undead-after-dark":"Нежить после заката","zombie-characters":"Персонажи-зомби","apocalypse-survival":"Апокалипсис и выживание","crypto-apocalypse":"Криптоапокалипсис","community-creations":"Работы сообщества"},
      de:{"zombie-memes":"Zombie-Memes","nightmare-horror":"Albtraum & Horror","undead-after-dark":"Untote bei Nacht","zombie-characters":"Zombie-Charaktere","apocalypse-survival":"Apokalypse & Überleben","crypto-apocalypse":"Krypto-Apokalypse","community-creations":"Community-Kreationen"},
      fr:{"zombie-memes":"Mèmes zombies","nightmare-horror":"Cauchemar et horreur","undead-after-dark":"Morts-vivants nocturnes","zombie-characters":"Personnages zombies","apocalypse-survival":"Apocalypse et survie","crypto-apocalypse":"Crypto-apocalypse","community-creations":"Créations de la communauté"},
      it:{"zombie-memes":"Meme zombie","nightmare-horror":"Incubo e horror","undead-after-dark":"Non morti dopo il tramonto","zombie-characters":"Personaggi zombie","apocalypse-survival":"Apocalisse e sopravvivenza","crypto-apocalypse":"Crypto-apocalisse","community-creations":"Creazioni della community"},
      ja:{"zombie-memes":"ゾンビミーム","nightmare-horror":"悪夢とホラー","undead-after-dark":"夜更けのアンデッド","zombie-characters":"ゾンビキャラクター","apocalypse-survival":"終末とサバイバル","crypto-apocalypse":"暗号資産アポカリプス","community-creations":"コミュニティ作品"},
      "zh-CN":{"zombie-memes":"僵尸梗图","nightmare-horror":"噩梦与恐怖","undead-after-dark":"午夜不死者","zombie-characters":"僵尸角色","apocalypse-survival":"末日与生存","crypto-apocalypse":"加密末日","community-creations":"社区创作"},
      tr:{"zombie-memes":"Zombi Memleri","nightmare-horror":"Kâbus ve Korku","undead-after-dark":"Gece Yarısı Ölüleri","zombie-characters":"Zombi Karakterleri","apocalypse-survival":"Kıyamet ve Hayatta Kalma","crypto-apocalypse":"Kripto Kıyameti","community-creations":"Topluluk Eserleri"},
      hi:{"zombie-memes":"ज़ॉम्बी मीम","nightmare-horror":"दुःस्वप्न और हॉरर","undead-after-dark":"रात ढलने के बाद के ज़ॉम्बी","zombie-characters":"ज़ॉम्बी किरदार","apocalypse-survival":"प्रलय और उत्तरजीविता","crypto-apocalypse":"क्रिप्टो प्रलय","community-creations":"समुदाय की कलाकृतियाँ"}
    };
    const categories = ["zombie-memes","nightmare-horror","undead-after-dark","zombie-characters","apocalypse-survival","crypto-apocalypse","community-creations"];
    const toolbar = document.createElement("div");
    toolbar.className = "gallery-toolbar";
    toolbar.innerHTML = '<div class="gallery-filter-row"><div class="gallery-category-filters" role="group" aria-label="Gallery categories"></div><label class="gallery-search-label"><span class="sr-only">Search gallery</span><input class="gallery-search" type="search" autocomplete="off"></label><label class="gallery-sort-label"><span class="sr-only">Sort gallery</span><select class="gallery-sort"><option value="newest"></option><option value="oldest"></option><option value="liked"></option></select></label><button class="gallery-reset" type="button"></button></div><p class="gallery-results" aria-live="polite"></p>';
    grid.parentElement.insertBefore(toolbar, grid);
    const filterRow = toolbar.querySelector(".gallery-category-filters");
    const searchInput = toolbar.querySelector(".gallery-search");
    const sortSelect = toolbar.querySelector(".gallery-sort");
    const resultsLabel = toolbar.querySelector(".gallery-results");
    const resetButton = toolbar.querySelector(".gallery-reset");
    const pagination = document.createElement("nav");
    pagination.className = "gallery-pagination";
    pagination.setAttribute("aria-label", "Gallery pages");
    pagination.innerHTML = '<button class="gallery-page-prev" type="button"></button><span class="gallery-page-status" aria-live="polite"></span><button class="gallery-page-next" type="button"></button>';
    grid.parentElement.appendChild(pagination);
    const previousPageButton = pagination.querySelector(".gallery-page-prev");
    const nextPageButton = pagination.querySelector(".gallery-page-next");
    const pageStatus = pagination.querySelector(".gallery-page-status");
    previousPageButton.addEventListener("click", () => { if (pageIndex > 0) { pageIndex--; renderGallery(); grid.parentElement.scrollTo({top:0,behavior:"smooth"}); } });
    nextPageButton.addEventListener("click", () => { pageIndex++; renderGallery(); grid.parentElement.scrollTo({top:0,behavior:"smooth"}); });

    let selectedCategory = "all";
    let searchTerm = "";
    let sortOrder = "newest";
    const PAGE_SIZE = 200;
    let pageIndex = 0;
    let visibleItemCount = items.length;

    const renderToolbar = () => {
      const t = controlText[galleryLang] || controlText.en;
      galleryLikeLabels = t;
      const c = categoryText[galleryLang] || categoryText.en;
      filterRow.setAttribute("aria-label", t.categories);
      searchInput.placeholder = t.search;
      searchInput.setAttribute("aria-label", t.search);
      sortSelect.setAttribute("aria-label", t.sort);
      sortSelect.options[0].textContent = t.newest;
      sortSelect.options[1].textContent = t.oldest;
      sortSelect.options[2].textContent = t.mostLiked;
      resetButton.textContent = t.clear;
      const present = new Set(items.flatMap(item => Array.isArray(item.category_ids) ? item.category_ids : []));
      filterRow.innerHTML = "";
      const buttons = [{id:"all",label:t.all}, ...categories.filter(id => present.has(id)).map(id => ({id,label:c[id]||id}))];
      buttons.forEach(({id,label}) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "gallery-category-chip" + (selectedCategory === id ? " is-active" : "");
        button.textContent = label;
        button.setAttribute("aria-pressed", selectedCategory === id ? "true" : "false");
        button.addEventListener("click", () => { selectedCategory = id; pageIndex = 0; trackGalleryEvent("gallery_filter", id); renderToolbar(); renderGallery(); });
        filterRow.appendChild(button);
      });
      updatePagination(visibleItemCount, grid.querySelectorAll(".gallery-card").length);
    };
    const GALLERY_API = "https://zombcash-bot.fadehost.app";
    const loadGalleryLikeStats = async (force = false) => {
      const ids = [...new Set(items.map(item => item.id).filter(Boolean))]
        .filter(id => force || !galleryLikeStats.has(id));
      if (!ids.length) return;
      const token = readGalleryToken();
      const headers = {};
      if (token) headers.Authorization = "Bearer " + token;
      try {
        // The API deliberately accepts at most 50 IDs per request; keep requests bounded.
        const batches = [];
        for (let index = 0; index < ids.length; index += 50) {
          batches.push(ids.slice(index, index + 50));
        }
        const batchStats = await Promise.all(batches.map(async batch => {
          const response = await fetch(GALLERY_API + "/api/gallery/likes?ids=" + encodeURIComponent(batch.join(",")), {
            headers,
            cache: "no-store"
          });
          if (!response.ok) return [];
          const payload = await response.json();
          return Array.isArray(payload.stats) ? payload.stats : [];
        }));
        batchStats.flat().forEach(row => {
          if (!row || !row.image_id) return;
          galleryLikeStats.set(row.image_id, {
            like_count: Number(row.like_count || 0),
            liked: Boolean(row.liked)
          });
        });
        cards.forEach(updateCardLikeButton);
        syncLightboxLikeButton();
        if (sortOrder === "liked" && !lightbox.classList.contains("is-open")) renderGallery();
      } catch (_) {}
    };

    handleGalleryLike = async card => {
      if (!card) return;
      const token = readGalleryToken();
      if (!token) {
        const auth = window.ZombieCashSurvivorAuth;
        if (auth?.openLogin) auth.openLogin();
        else document.querySelector(".top-cta, .survivor-entry-button, .zsh-login-button")?.click();
        return;
      }
      const imageId = card.dataset.galleryId || "";
      if (!imageId) return;
      const current = likeStateFor(card);
      const button = card.querySelector(".gallery-like-button");
      if (button) button.disabled = true;
      try {
        const response = await fetch(GALLERY_API + "/api/gallery/like", {
          method: "POST",
          headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
          body: JSON.stringify({ imageId, liked: !current.liked }),
          cache: "no-store"
        });
        const payload = await response.json().catch(() => ({}));
        if (response.status === 401) {
          const auth = window.ZombieCashSurvivorAuth;
          if (auth?.clearSession) auth.clearSession();
          if (auth?.openLogin) auth.openLogin();
          else document.querySelector(".top-cta, .survivor-entry-button, .zsh-login-button")?.click();
          return;
        }
        if (!response.ok || !payload.ok || !payload.stats) {
          if (button) button.title = payload.error || galleryLikeLabels.likeError;
          return;
        }
        const stats = {
          like_count: Number(payload.stats.like_count || 0),
          liked: Boolean(payload.stats.liked)
        };
        galleryLikeStats.set(imageId, stats);
        trackGalleryEvent(stats.liked ? "gallery_like" : "gallery_unlike", "image_" + imageId.replace(/[^0-9]/g, "_"));
        cards.forEach(updateCardLikeButton);
        syncLightboxLikeButton();
        if (sortOrder === "liked" && !lightbox.classList.contains("is-open")) renderGallery();
      } catch (_) {
        if (button) button.title = galleryLikeLabels.likeError;
      } finally {
        if (button) button.disabled = false;
      }
    };

    document.addEventListener("zombcash:survivorlogin", () => { loadGalleryLikeStats(true); });
    document.addEventListener("zombcash:survivorlogout", () => { loadGalleryLikeStats(true); });

    const renderGallery = () => {
      let visible = items.filter(item => {
        const matchesCategory = selectedCategory === "all" || (Array.isArray(item.category_ids) && item.category_ids.includes(selectedCategory));
        const haystack = [item.title,item.description,item.caption,item.series,...(item.category_ids||[]),...(item.tags||[])].join(" ").toLocaleLowerCase(galleryLang);
        return matchesCategory && (!searchTerm || haystack.includes(searchTerm));
      });
      visible.sort((a,b) => {
        const delta = String(a.date||"").localeCompare(String(b.date||""));
        if (sortOrder === "liked") {
          const likesA = Number(galleryLikeStats.get(a.id)?.like_count || 0);
          const likesB = Number(galleryLikeStats.get(b.id)?.like_count || 0);
          return (likesB - likesA) || -delta;
        }
        return sortOrder === "oldest" ? delta : -delta;
      });
      visibleItemCount = visible.length;
      const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
      pageIndex = Math.min(pageIndex, pageCount - 1);
      const pageItems = visible.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE);
      grid.innerHTML = pageItems.length ? pageItems.map((item, index) => {
        const caption = cleanCaption(item.caption);
        const rawTitle = String(item.title || caption);
        const title = cleanCaption(rawTitle);
        const cardTitle = cleanCardTitle(rawTitle);
        const image = escapeHtml(item.image);
        const imageLoading = index === 0 ? "eager" : "lazy";
        const imagePriority = index === 0 ? "high" : "auto";
        const imageWidth = Number(item.image_width);
        const imageHeight = Number(item.image_height);
        const dimensionAttributes = Number.isInteger(imageWidth) && imageWidth > 0 && imageWidth <= 10000 &&
          Number.isInteger(imageHeight) && imageHeight > 0 && imageHeight <= 10000
          ? ' width="' + imageWidth + '" height="' + imageHeight + '"'
          : '';
        const post = item.post_url ? escapeHtml(item.post_url) : "https://t.me/ZOMBCASH";
        const alt = String(item.alt_text || ("ZombieCash gallery artwork accompanying the story: " + (item.description || caption)));
        const labels = categoryText[galleryLang] || categoryText.en;
        const categoryMarkup = (item.category_ids || []).map(id => '<span class="gallery-category-tag">' + escapeHtml(labels[id] || id) + '</span>').join("");
        return '<article class="gallery-card" id="' + escapeHtml(item.anchor_id || "") + '" data-gallery-id="' + escapeHtml(item.id || "") + '" data-categories="' + escapeHtml((item.category_ids || []).join(" ")) + '" data-gallery-title="' + escapeHtml(rawTitle) + '" data-gallery-description="' + escapeHtml(item.description || "") + '" tabindex="0" role="group" aria-label="Open image: ' + escapeHtml(title) + '">' +
          '<img' + dimensionAttributes + ' src="' + image + '" alt="' + escapeHtml(alt) + '" loading="' + imageLoading + '" fetchpriority="' + imagePriority + '" decoding="async">' +
          '<div class="gallery-caption"><p data-original-caption="' + escapeHtml(item.caption) + '" data-original-title="' + escapeHtml(rawTitle) + '">' + escapeHtml(cardTitle) + '</p>' +
          '<div class="gallery-card-tags">' + categoryMarkup + '</div>' +
          '<div class="gallery-card-actions"><button class="gallery-like-button" type="button" aria-pressed="false" title="' + escapeHtml(galleryLikeLabels.loginLike) + '"><span class="gallery-like-heart" aria-hidden="true">♡</span><span class="gallery-like-count">0</span></button></div>' +
          '<a href="' + post + '" target="_blank" rel="noreferrer">'+escapeHtml(gtx("source"))+'</a></div></article>';
      }).join("") : '<div class="gallery-state"><h3>' + escapeHtml((controlText[galleryLang]||controlText.en).empty) + '</h3></div>';
      cards = Array.from(grid.querySelectorAll(".gallery-card"));
      cards.forEach((card, index) => {
        const image = card.querySelector("img");
        if (image) {
          image.dataset.originalSrc = image.currentSrc || image.src;
          image.dataset.originalAlt = image.alt;
        }
        image?.addEventListener("error", () => {
          if (!image.dataset.retryAttempted) {
            image.dataset.retryAttempted = "true";
            const originalSrc = image.dataset.originalSrc || image.src;
            try {
              const retryUrl = new URL(originalSrc);
              retryUrl.searchParams.set("zcretry", "1");
              window.setTimeout(() => { image.src = retryUrl.toString(); }, 350);
            } catch (_) {
              window.setTimeout(() => { image.src = originalSrc; }, 350);
            }
            return;
          }
          if (image.dataset.fallbackApplied) return;
          image.dataset.fallbackApplied = "true";
          image.dataset.originalLoadFailed = "true";
          image.src = "/zombcash-hand-logo.svg";
          image.alt = "Gallery image temporarily unavailable";
        });
        const likeButton = card.querySelector(".gallery-like-button");
        likeButton?.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); handleGalleryLike?.(card); });
        const sourceLink = card.querySelector(".gallery-caption a");
        sourceLink?.addEventListener("click", () => trackGalleryEvent("gallery_source_open", "image_" + String(card.dataset.galleryId || "").replace(/[^0-9]/g, "_")));
        updateCardLikeButton(card);
        card.addEventListener("click", event => { if (!event.target.closest("a,button")) showImage(index); });
        card.addEventListener("keydown", event => {
          if ((event.key === "Enter" || event.key === " ") && event.target === card) {
            event.preventDefault();
            showImage(index);
          }
        });
      });
      renderToolbarCount();
      loadGalleryLikeStats();
    };
    const updatePagination = (total, shown) => {
      const t = controlText[galleryLang] || controlText.en;
      const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
      const start = total ? pageIndex * PAGE_SIZE + 1 : 0;
      const end = Math.min(total, pageIndex * PAGE_SIZE + shown);
      resultsLabel.textContent = t.results + ": " + start + "–" + end + " / " + total;
      previousPageButton.textContent = t.previousPage;
      nextPageButton.textContent = t.nextPage;
      previousPageButton.disabled = pageIndex <= 0;
      nextPageButton.disabled = pageIndex >= pageCount - 1;
      pagination.hidden = pageCount <= 1;
      pageStatus.textContent = t.page + " " + (pageIndex + 1) + " / " + pageCount;
    };
    const renderToolbarCount = () => {
      const t = controlText[galleryLang] || controlText.en;
      updatePagination(visibleItemCount, cards.length);
    };
    refreshGalleryControls = () => { renderToolbar(); renderGallery(); };
    refreshGalleryForLikes = () => { if (sortOrder === "liked") renderGallery(); };
    searchInput.addEventListener("input", () => { searchTerm = searchInput.value.trim().toLocaleLowerCase(galleryLang); pageIndex = 0; renderGallery(); });
    searchInput.addEventListener("change", () => { if (searchInput.value.trim()) trackGalleryEvent("gallery_search", "gallery"); });
    sortSelect.addEventListener("change", () => { sortOrder = sortSelect.value; pageIndex = 0; trackGalleryEvent("gallery_sort", sortOrder); renderGallery(); });
    resetButton.addEventListener("click", () => { selectedCategory = "all"; searchTerm = ""; sortOrder = "newest"; pageIndex = 0; searchInput.value = ""; sortSelect.value = "newest"; trackGalleryEvent("gallery_filter_reset", "gallery"); renderToolbar(); renderGallery(); });
    renderToolbar();
    renderGallery();

    // Shared image links must reopen the exact artwork, not merely the gallery grid.
    const openLinkedImage = () => {
      const params = new URLSearchParams(window.location.search);
      const target = params.get("image") || (window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : "");
      if (!target) return;
      const targetIndex = items.findIndex(item => item.anchor_id === target || item.id === target);
      if (targetIndex < 0) return;
      selectedCategory = "all";
      searchTerm = "";
      pageIndex = 0;
      searchInput.value = "";
      sortSelect.value = "newest";
      renderToolbar();
      renderGallery();
      const cardIndex = cards.findIndex(card => card.id === target || card.dataset.galleryId === target);
      if (cardIndex >= 0) {
        cards[cardIndex].scrollIntoView({block:"center",behavior:"auto"});
        showImage(cardIndex);
      }
    };
    openLinkedImage();
  }).catch(error => {
    if (count) count.textContent = gtx("offline");
    if (updated) updated.textContent = "";
    state(gtx("error"), gtx("errorMsg"));
  });
})();
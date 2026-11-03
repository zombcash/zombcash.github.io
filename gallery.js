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
  const galleryCaptionLabels = {
    en:{"NIGHTMARE DROP":"NIGHTMARE DROP","ZOMBIE MEME OF THE HOUR":"ZOMBIE MEME OF THE HOUR","ZOMBIE MEME":"ZOMBIE MEME","UNDEAD AFTER DARK":"UNDEAD AFTER DARK"},
    ru:{"NIGHTMARE DROP":"НОЧНОЙ КОШМАР","ZOMBIE MEME OF THE HOUR":"ЗОМБИ-МЕМ ЧАСА","ZOMBIE MEME":"ЗОМБИ-МЕМ","UNDEAD AFTER DARK":"НЕЖИТЬ ПОСЛЕ ЗАКАТА"},
    de:{"NIGHTMARE DROP":"ALBTRAUM-DROP","ZOMBIE MEME OF THE HOUR":"ZOMBIE-MEME DER STUNDE","ZOMBIE MEME":"ZOMBIE-MEME","UNDEAD AFTER DARK":"UNTOTE NACH EINBRUCH DER DUNKELHEIT"},
    fr:{"NIGHTMARE DROP":"DROP CAUCHEMAR","ZOMBIE MEME OF THE HOUR":"LE MÈME ZOMBIE DU MOMENT","ZOMBIE MEME":"MÈME ZOMBIE","UNDEAD AFTER DARK":"MORTS-VIVANTS APRÈS LA NUIT"},
    it:{"NIGHTMARE DROP":"DROP DA INCUBO","ZOMBIE MEME OF THE HOUR":"IL MEME ZOMBIE DEL MOMENTO","ZOMBIE MEME":"MEME ZOMBIE","UNDEAD AFTER DARK":"NON MORTI DOPO IL TRAMONTO"},
    ja:{"NIGHTMARE DROP":"悪夢のドロップ","ZOMBIE MEME OF THE HOUR":"今時のゾンビミーム","ZOMBIE MEME":"ゾンビミーム","UNDEAD AFTER DARK":"夜更けのアンデッド"},
    "zh-CN":{"NIGHTMARE DROP":"噩梦掉落","ZOMBIE MEME OF THE HOUR":"本小时僵尸梗图","ZOMBIE MEME":"僵尸梗图","UNDEAD AFTER DARK":"午夜不死者"},
    tr:{"NIGHTMARE DROP":"KÂBUS PAYLAŞIMI","ZOMBIE MEME OF THE HOUR":"SAATİN ZOMBİ MEMİ","ZOMBIE MEME":"ZOMBİ MEMİ","UNDEAD AFTER DARK":"GECE SONRASI YAŞAYAN ÖLÜLER"},
    hi:{"NIGHTMARE DROP":"दुःस्वप्न ड्रॉप","ZOMBIE MEME OF THE HOUR":"इस घंटे का ज़ॉम्बी मीम","ZOMBIE MEME":"ज़ॉम्बी मीम","UNDEAD AFTER DARK":"रात के बाद अनडेड"}
  };
  let galleryLang=document.documentElement.lang||"en";
  let refreshGalleryControls = () => {};
  const gtx=k=>(galleryLocale[galleryLang]||galleryLocale.en)[k]||galleryLocale.en[k]||k;
  const localizeGalleryMeta=(items,updatedAt)=>{if(count&&items!==null)count.textContent=items.length+" "+gtx("images");if(updated)updated.textContent=updatedAt?gtx("updated")+" "+new Date(updatedAt).toLocaleString(galleryLang,{month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit"}):"";};
  document.addEventListener("zombcash:languagechange",e=>{galleryLang=e.detail?.language||document.documentElement.lang||"en";grid.querySelectorAll(".gallery-caption p").forEach(p=>{p.textContent=cleanCaption(p.dataset.originalTitle||p.dataset.originalCaption||p.textContent);});grid.querySelectorAll(".gallery-caption a").forEach(a=>a.textContent=gtx("source"));if(count&&/IMAGES|ИЗОБРАЖЕНИЙ|BILDER|IMAGES|IMMAGINI|枚|张图片|GÖRSEL|इमेज/.test(count.textContent)){const n=parseInt(count.textContent,10);if(Number.isFinite(n))count.textContent=n+" "+gtx("images");}if(updated&&updated.textContent){const raw=updated.textContent.replace(/^(UPDATED|ОБНОВЛЕНО|AKTUALISIERT|MIS À JOUR|AGGIORNATO|更新|更新于|GÜNCELLENDİ|अपडेट)\\s*/,"");updated.textContent=gtx("updated")+" "+raw;}refreshGalleryControls();});
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[ch];
  });
  const cleanCaption = value => {
    let caption = String(value ?? "")
      .replace(/\s+/g, " ")
      .split(/━━━━━━━━|🧟\s*\$ZOMBCASH|MARKET DIED\.|📋\s*CA:|🌐\s*Website:|𝕏\s*X Community|💬\s*Telegram/i)[0]
      .trim();
    const labels = galleryCaptionLabels[galleryLang] || galleryCaptionLabels.en;
    Object.keys(galleryCaptionLabels.en).sort((a, b) => b.length - a.length).forEach(key => {
      caption = caption.replace(new RegExp(key, "ig"), labels[key] || key);
    });
    return caption;
  };

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
    '<button class="gallery-lightbox-prev" type="button" aria-label="Previous image">‹</button>' +
    '<figure><img alt=""><figcaption></figcaption></figure>' +
    '<button class="gallery-lightbox-next" type="button" aria-label="Next image">›</button>';
  document.body.appendChild(lightbox);

  const fullImage = lightbox.querySelector("img");
  const fullCaption = lightbox.querySelector("figcaption");
  const closeButton = lightbox.querySelector(".gallery-lightbox-close");
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

  const showImage = index => {
    if (!cards.length) return;
    activeIndex = (index + cards.length) % cards.length;
    const image = cards[activeIndex].querySelector("img");
    fullImage.src = image.currentSrc || image.src;
    fullImage.alt = image.alt || "";
    const card = cards[activeIndex];
    const title = card.dataset.galleryTitle || card.querySelector(".gallery-caption p")?.textContent || "";
    const description = card.dataset.galleryDescription || "";
    const categories = card.querySelector(".gallery-card-tags")?.textContent || "";
    const sourceUrl = card.querySelector(".gallery-caption a")?.href || "https://t.me/ZOMBCASH";
    fullCaption.innerHTML =
      '<strong class="gallery-lightbox-title">' + escapeHtml(title) + '</strong>' +
      (description ? '<span class="gallery-lightbox-description">' + escapeHtml(description) + '</span>' : '') +
      (categories ? '<span class="gallery-lightbox-categories">' + escapeHtml(categories) + '</span>' : '') +
      '<a class="gallery-lightbox-source" href="' + escapeHtml(sourceUrl) + '" target="_blank" rel="noreferrer">' + escapeHtml(gtx("source")) + ' ↗</a>';
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
    fetch("gallery-data.json?v=gallery-data-v2-undead-reach-20261103", { cache: "no-store" }).then(response => {
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
      ? data.items.filter(item => item.image && item.caption && (Array.isArray(item.category_ids) ? item.category_ids.length : allowedGalleryCaption(item.caption)))
      : [];
    localizeGalleryMeta(items, data.updated_at);
    if (!items.length) {
      state(gtx("none"), gtx("noneMsg"));
      return;
    }

    const controlText = {
      en:{categories:"Gallery categories",clear:"Clear filters",all:"ALL ART",search:"Search titles, captions or tags…",sort:"SORT",newest:"Newest first",oldest:"Oldest first",results:"RESULTS",empty:"No images match this filter."},
      ru:{categories:"Категории галереи",clear:"Сбросить фильтры",all:"ВСЕ РАБОТЫ",search:"Поиск по названию, описанию или тегам…",sort:"СОРТИРОВКА",newest:"Сначала новые",oldest:"Сначала старые",results:"НАЙДЕНО",empty:"По этому фильтру изображений нет."},
      de:{categories:"Galeriekategorien",clear:"Filter zurücksetzen",all:"ALLE BILDER",search:"Titel, Beschreibungen oder Tags suchen…",sort:"SORTIEREN",newest:"Neueste zuerst",oldest:"Älteste zuerst",results:"ERGEBNISSE",empty:"Keine Bilder für diesen Filter."},
      fr:{categories:"Catégories de la galerie",clear:"Effacer les filtres",all:"TOUTES LES ŒUVRES",search:"Rechercher titres, descriptions ou tags…",sort:"TRIER",newest:"Plus récentes",oldest:"Plus anciennes",results:"RÉSULTATS",empty:"Aucune image ne correspond à ce filtre."},
      it:{categories:"Categorie della galleria",clear:"Azzera filtri",all:"TUTTE LE OPERE",search:"Cerca titoli, descrizioni o tag…",sort:"ORDINA",newest:"Prima le più recenti",oldest:"Prima le più vecchie",results:"RISULTATI",empty:"Nessuna immagine corrisponde al filtro."},
      ja:{categories:"ギャラリーのカテゴリ",clear:"フィルターを解除",all:"すべての作品",search:"タイトル・説明・タグを検索…",sort:"並べ替え",newest:"新しい順",oldest:"古い順",results:"件数",empty:"条件に一致する画像はありません。"},
      "zh-CN":{categories:"图库分类",clear:"清除筛选",all:"全部作品",search:"搜索标题、说明或标签…",sort:"排序",newest:"最新优先",oldest:"最早优先",results:"结果",empty:"没有符合筛选条件的图片。"},
      tr:{categories:"Galeri kategorileri",clear:"Filtreleri temizle",all:"TÜM GÖRSELLER",search:"Başlık, açıklama veya etiket ara…",sort:"SIRALA",newest:"En yeni önce",oldest:"En eski önce",results:"SONUÇ",empty:"Bu filtreyle eşleşen görsel yok."},
      hi:{categories:"गैलरी श्रेणियाँ",clear:"फ़िल्टर साफ़ करें",all:"सभी कलाकृतियाँ",search:"शीर्षक, विवरण या टैग खोजें…",sort:"क्रम",newest:"नवीनतम पहले",oldest:"सबसे पुरानी पहले",results:"परिणाम",empty:"इस फ़िल्टर से कोई इमेज नहीं मिली।"}
    };
    const categoryText = {
      en:{"zombie-memes":"Zombie Memes","nightmare-horror":"Nightmare & Horror","undead-after-dark":"Undead After Dark","zombie-characters":"Zombie Characters","apocalypse-survival":"Apocalypse & Survival","crypto-apocalypse":"Crypto Apocalypse","community-creations":"Community Creations"},
      ru:{"zombie-memes":"Зомби-мемы","nightmare-horror":"Кошмары и хоррор","undead-after-dark":"Нежить после заката","zombie-characters":"Персонажи-зомби","apocalypse-survival":"Апокалипсис и выживание","crypto-apocalypse":"Криптоапокалипсис","community-creations":"Работы сообщества"},
      de:{"zombie-memes":"Zombie-Memes","nightmare-horror":"Albtraum & Horror","undead-after-dark":"Untote nach Einbruch der Dunkelheit","zombie-characters":"Zombie-Charaktere","apocalypse-survival":"Apokalypse & Überleben","crypto-apocalypse":"Krypto-Apokalypse","community-creations":"Community-Kreationen"},
      fr:{"zombie-memes":"Mèmes zombies","nightmare-horror":"Cauchemar et horreur","undead-after-dark":"Morts-vivants après la nuit","zombie-characters":"Personnages zombies","apocalypse-survival":"Apocalypse et survie","crypto-apocalypse":"Crypto-apocalypse","community-creations":"Créations de la communauté"},
      it:{"zombie-memes":"Meme zombie","nightmare-horror":"Incubo e horror","undead-after-dark":"Non morti dopo il tramonto","zombie-characters":"Personaggi zombie","apocalypse-survival":"Apocalisse e sopravvivenza","crypto-apocalypse":"Crypto-apocalisse","community-creations":"Creazioni della community"},
      ja:{"zombie-memes":"ゾンビミーム","nightmare-horror":"悪夢とホラー","undead-after-dark":"夜更けのアンデッド","zombie-characters":"ゾンビキャラクター","apocalypse-survival":"終末とサバイバル","crypto-apocalypse":"暗号資産アポカリプス","community-creations":"コミュニティ作品"},
      "zh-CN":{"zombie-memes":"僵尸梗图","nightmare-horror":"噩梦与恐怖","undead-after-dark":"午夜不死者","zombie-characters":"僵尸角色","apocalypse-survival":"末日与生存","crypto-apocalypse":"加密末日","community-creations":"社区创作"},
      tr:{"zombie-memes":"Zombi Memleri","nightmare-horror":"Kâbus ve Korku","undead-after-dark":"Gece Sonrası Yaşayan Ölüler","zombie-characters":"Zombi Karakterleri","apocalypse-survival":"Kıyamet ve Hayatta Kalma","crypto-apocalypse":"Kripto Kıyameti","community-creations":"Topluluk Eserleri"},
      hi:{"zombie-memes":"ज़ॉम्बी मीम","nightmare-horror":"दुःस्वप्न और हॉरर","undead-after-dark":"रात के बाद अनडेड","zombie-characters":"ज़ॉम्बी किरदार","apocalypse-survival":"प्रलय और उत्तरजीविता","crypto-apocalypse":"क्रिप्टो प्रलय","community-creations":"समुदाय की कलाकृतियाँ"}
    };
    const categories = ["zombie-memes","nightmare-horror","undead-after-dark","zombie-characters","apocalypse-survival","crypto-apocalypse","community-creations"];
    const toolbar = document.createElement("div");
    toolbar.className = "gallery-toolbar";
    toolbar.innerHTML = '<div class="gallery-filter-row"><div class="gallery-category-filters" role="group" aria-label="Gallery categories"></div><label class="gallery-search-label"><span class="sr-only">Search gallery</span><input class="gallery-search" type="search" autocomplete="off"></label><label class="gallery-sort-label"><span class="sr-only">Sort gallery</span><select class="gallery-sort"><option value="newest"></option><option value="oldest"></option></select></label><button class="gallery-reset" type="button"></button></div><p class="gallery-results" aria-live="polite"></p>';
    grid.parentElement.insertBefore(toolbar, grid);
    const filterRow = toolbar.querySelector(".gallery-category-filters");
    const searchInput = toolbar.querySelector(".gallery-search");
    const sortSelect = toolbar.querySelector(".gallery-sort");
    const resultsLabel = toolbar.querySelector(".gallery-results");
    const resetButton = toolbar.querySelector(".gallery-reset");
    let selectedCategory = "all";
    let searchTerm = "";
    let sortOrder = "newest";

    const renderToolbar = () => {
      const t = controlText[galleryLang] || controlText.en;
      const c = categoryText[galleryLang] || categoryText.en;
      filterRow.setAttribute("aria-label", t.categories);
      searchInput.placeholder = t.search;
      searchInput.setAttribute("aria-label", t.search);
      sortSelect.setAttribute("aria-label", t.sort);
      sortSelect.options[0].textContent = t.newest;
      sortSelect.options[1].textContent = t.oldest;
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
        button.addEventListener("click", () => { selectedCategory = id; renderToolbar(); renderGallery(); });
        filterRow.appendChild(button);
      });
      resultsLabel.textContent = t.results + ": " + grid.querySelectorAll(".gallery-card").length + " / " + items.length;
    };
    const renderGallery = () => {
      let visible = items.filter(item => {
        const matchesCategory = selectedCategory === "all" || (Array.isArray(item.category_ids) && item.category_ids.includes(selectedCategory));
        const haystack = [item.title,item.description,item.caption,item.series,...(item.category_ids||[]),...(item.tags||[])].join(" ").toLocaleLowerCase(galleryLang);
        return matchesCategory && (!searchTerm || haystack.includes(searchTerm));
      });
      visible.sort((a,b) => {
        const delta = String(a.date||"").localeCompare(String(b.date||""));
        return sortOrder === "oldest" ? delta : -delta;
      });
      grid.innerHTML = visible.length ? visible.map(item => {
        const caption = cleanCaption(item.caption);
        const title = String(item.title || caption);
        const image = escapeHtml(item.image);
        const post = item.post_url ? escapeHtml(item.post_url) : "https://t.me/ZOMBCASH";
        const alt = String(item.alt_text || ("ZombieCash artwork: " + caption));
        const labels = categoryText[galleryLang] || categoryText.en;
        const categoryMarkup = (item.category_ids || []).map(id => '<span class="gallery-category-tag">' + escapeHtml(labels[id] || id) + '</span>').join("");
        return '<article class="gallery-card" data-gallery-id="' + escapeHtml(item.id || "") + '" data-categories="' + escapeHtml((item.category_ids || []).join(" ")) + '" data-gallery-title="' + escapeHtml(title) + '" data-gallery-description="' + escapeHtml(item.description || "") + '" tabindex="0" role="button" aria-label="Open image: ' + escapeHtml(title) + '">' +
          '<img src="' + image + '" alt="' + escapeHtml(alt) + '" loading="lazy" decoding="async">' +
          '<div class="gallery-caption"><p data-original-caption="' + escapeHtml(item.caption) + '" data-original-title="' + escapeHtml(title) + '">' + escapeHtml(title) + '</p>' +
          '<div class="gallery-card-tags">' + categoryMarkup + '</div>' +
          '<a href="' + post + '" target="_blank" rel="noreferrer">'+escapeHtml(gtx("source"))+'</a></div></article>';
      }).join("") : '<div class="gallery-state"><h3>' + escapeHtml((controlText[galleryLang]||controlText.en).empty) + '</h3></div>';
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
      renderToolbarCount();
    };
    const renderToolbarCount = () => {
      const t = controlText[galleryLang] || controlText.en;
      resultsLabel.textContent = t.results + ": " + cards.length + " / " + items.length;
    };
    refreshGalleryControls = () => { renderToolbar(); renderGallery(); };
    searchInput.addEventListener("input", () => { searchTerm = searchInput.value.trim().toLocaleLowerCase(galleryLang); renderGallery(); });
    sortSelect.addEventListener("change", () => { sortOrder = sortSelect.value; renderGallery(); });
    resetButton.addEventListener("click", () => { selectedCategory = "all"; searchTerm = ""; sortOrder = "newest"; searchInput.value = ""; sortSelect.value = "newest"; renderToolbar(); renderGallery(); });
    renderToolbar();
    renderGallery();
  }).catch(error => {
    if (count) count.textContent = gtx("offline");
    if (updated) updated.textContent = "";
    state(gtx("error"), gtx("errorMsg"));
  });
})();
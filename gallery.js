(() => {
  const grid = document.getElementById('gallery-grid');
  const count = document.getElementById('gallery-count');
  const updated = document.getElementById('gallery-updated');
  if (!grid) return;
  const escapeHtml = value => String(value ?? '').replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[ch]));
  const cleanCaption = value => String(value ?? '').replace(/\s+/g,' ').split(/━━━━━━━━|🧟\s*\$ZOMBCASH|MARKET DIED\.|📋\s*CA:|🌐\s*Website:|𝕏\s*X Community|💬\s*Telegram/i)[0].trim();
  const state = (title, message, link = true) => {
    grid.innerHTML = '<div class="gallery-state"><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(message) + '</p>' +
      (link ? '<a class="gallery-empty-link" href="https://t.me/ZOMBCASH" target="_blank" rel="noreferrer">OPEN @ZOMBCASH ↗</a>' : '') + '</div>';
  };
  const lightbox = document.createElement('div');
  lightbox.className = 'gallery-lightbox';
  lightbox.setAttribute('role','dialog'); lightbox.setAttribute('aria-modal','true'); lightbox.setAttribute('aria-label','Expanded gallery image');
  lightbox.innerHTML = '<button class="gallery-lightbox-close" type="button" aria-label="Close image">×</button><button class="gallery-lightbox-prev" type="button" aria-label="Previous image">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="gallery-lightbox-next" type="button" aria-label="Next image">›</button>';
  document.body.appendChild(lightbox);
  const fullImage=lightbox.querySelector('img'), fullCaption=lightbox.querySelector('figcaption'), closeButton=lightbox.querySelector('.gallery-lightbox-close');
  let cards=[],activeIndex=0;
  const showImage=index=>{if(!cards.length)return;activeIndex=(index+cards.length)%cards.length;const img=cards[activeIndex].querySelector('img');fullImage.src=img.currentSrc||img.src;fullImage.alt=img.alt||'';fullCaption.textContent=cards[activeIndex].querySelector('.gallery-caption p')?.textContent||'';lightbox.classList.add('is-open');document.body.classList.add('gallery-lightbox-open');closeButton.focus();};
  const closeImage=()=>{lightbox.classList.remove('is-open');document.body.classList.remove('gallery-lightbox-open');fullImage.removeAttribute('src');};
  closeButton.addEventListener('click',closeImage);
  lightbox.querySelector('.gallery-lightbox-prev').addEventListener('click',()=>showImage(activeIndex-1));
  lightbox.querySelector('.gallery-lightbox-next').addEventListener('click',()=>showImage(activeIndex+1));
  lightbox.addEventListener('click',event=>{if(event.target===lightbox)closeImage();});
  document.addEventListener('keydown',event=>{if(!lightbox.classList.contains('is-open'))return;if(event.key==='Escape')closeImage();if(event.key==='ArrowLeft')showImage(activeIndex-1);if(event.key==='ArrowRight')showImage(activeIndex+1);});
  fetch('gallery-data.json?ts='+Date.now(),{cache:'no-store'}).then(response=>{if(!response.ok)throw Error('Gallery data not available');return response.json();}).then(data=>{
    const items=Array.isArray(data.items)?data.items.filter(item=>item.image&&item.caption):[];
    count.textContent=items.length+' IMAGES';
    updated.textContent=data.updated_at?'UPDATED '+new Date(data.updated_at).toLocaleString(undefined,{month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'';
    if(!items.length){state('NO IMAGES YET','The Telegram archive has not synced yet.');return;}
    grid.innerHTML=items.map(item=>{const caption=cleanCaption(item.caption);const image=escapeHtml(item.image);const post=item.post_url?escapeHtml(item.post_url):'https://t.me/ZOMBCASH';return '<article class="gallery-card" tabindex="0" role="button" aria-label="Open image: '+escapeHtml(caption)+'"><img src="'+image+'" alt="'+escapeHtml(caption)+'" loading="lazy" decoding="async"><div class="gallery-caption"><p>'+escapeHtml(caption)+'</p><a href="'+post+'" target="_blank" rel="noreferrer">SOURCE ↗</a></div></article>';}).join('');
    cards=Array.from(grid.querySelectorAll('.gallery-card'));cards.forEach((card,index)=>{card.addEventListener('click',event=>{if(!event.target.closest('a'))showImage(index);});card.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target===card){event.preventDefault();showImage(index);}});});
  }).catch(()=>{count.textContent='ARCHIVE OFFLINE';updated.textContent='';state('COULD NOT LOAD IMAGES','Try again shortly, or open the Telegram channel directly.');});
})();
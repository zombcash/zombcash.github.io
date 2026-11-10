(() => {
"use strict";
const API="https://zombcash-bot.fadehost.app";
const known=["en","de","fr","it","ja","zh-CN","ru","tr","hi"];
const first=location.pathname.split("/").filter(Boolean)[0]||"en";
const lang=known.includes(first)?first:"en";
const copy={
en:{log:"BROADCAST LOG",now:"NOW SELECTED",ready:"TRANSMISSION SELECTED · READY TO PLAY",kicker:"THE OUTBREAK, ON AIR",title:"ZOMBCASH TV — LIVE FROM THE OUTBREAK",intro:"Live transmissions, field briefings and the growing ZombieCash video archive. Select an episode to watch; the archive will appear here as new videos are published.",empty:"NO TRANSMISSIONS YET",emptyNote:"Published episodes will appear here when the TV archive is connected.",connecting:"CONNECTING TO THE BUNKER...",selected:"NOW SELECTED",choose:"Choose an episode from the archive.",recent:"RECENT TRANSMISSIONS",more:"LOAD MORE",online:"ARCHIVE ONLINE",awaiting:"AWAITING FIRST TRANSMISSION",unavailable:"ARCHIVE UNAVAILABLE",error:"Could not reach the TV archive. Try again later.",videoError:"VIDEO NOT AVAILABLE"},
de:{log:"SENDEREGISTER",now:"JETZT AUSGEWÄHLT",ready:"ÜBERTRAGUNG AUSGEWÄHLT · BEREIT",kicker:"DER AUSBRUCH AUF SENDUNG",title:"ZOMBCASH TV — LIVE AUS DEM AUSBRUCHSGEBIET",intro:"Live-Übertragungen, Lageberichte und das wachsende ZombieCash-Videoarchiv. Wähle eine Folge aus; neue Videos erscheinen hier nach der Veröffentlichung.",empty:"NOCH KEINE ÜBERTRAGUNGEN",emptyNote:"Veröffentlichte Folgen erscheinen hier, sobald das TV-Archiv verbunden ist.",connecting:"VERBINDUNG ZUM BUNKER...",selected:"JETZT AUSGEWÄHLT",choose:"Wähle eine Folge aus dem Archiv.",recent:"LETZTE ÜBERTRAGUNGEN",more:"MEHR LADEN",online:"ARCHIV ONLINE",awaiting:"ERSTE ÜBERTRAGUNG AUSSTEHEND",unavailable:"ARCHIV NICHT VERFÜGBAR",error:"Das TV-Archiv ist nicht erreichbar. Versuche es später erneut.",videoError:"VIDEO NICHT VERFÜGBAR"},
fr:{log:"JOURNAL DES ÉMISSIONS",now:"SÉLECTION ACTUELLE",ready:"TRANSMISSION SÉLECTIONNÉE · PRÊTE",kicker:"L’ÉPIDÉMIE À L’ANTENNE",title:"ZOMBCASH TV — EN DIRECT DE L’ÉPIDÉMIE",intro:"Transmissions en direct, briefings de terrain et archives vidéo ZombieCash. Sélectionnez un épisode ; les nouvelles vidéos apparaîtront ici après publication.",empty:"AUCUNE TRANSMISSION POUR LE MOMENT",emptyNote:"Les épisodes publiés apparaîtront ici lorsque l’archive TV sera connectée.",connecting:"CONNEXION AU BUNKER...",selected:"SÉLECTION ACTUELLE",choose:"Choisissez un épisode dans les archives.",recent:"DERNIÈRES TRANSMISSIONS",more:"CHARGER PLUS",online:"ARCHIVES EN LIGNE",awaiting:"EN ATTENTE DE LA PREMIÈRE TRANSMISSION",unavailable:"ARCHIVES INDISPONIBLES",error:"Impossible d’accéder aux archives TV. Réessayez plus tard.",videoError:"VIDÉO INDISPONIBLE"},
it:{log:"REGISTRO TRASMISSIONI",now:"SELEZIONE ATTUALE",ready:"TRASMISSIONE SELEZIONATA · PRONTA",kicker:"L’EPIDEMIA IN ONDA",title:"ZOMBCASH TV — IN DIRETTA DALL’EPIDEMIA",intro:"Trasmissioni in diretta, briefing dal campo e archivio video ZombieCash in crescita. Seleziona un episodio; i nuovi video appariranno qui dopo la pubblicazione.",empty:"NESSUNA TRASMISSIONE AL MOMENTO",emptyNote:"Gli episodi pubblicati appariranno qui quando l’archivio TV sarà collegato.",connecting:"CONNESSIONE AL BUNKER...",selected:"SELEZIONE ATTUALE",choose:"Scegli un episodio dall’archivio.",recent:"ULTIME TRASMISSIONI",more:"CARICA ALTRO",online:"ARCHIVIO ONLINE",awaiting:"IN ATTESA DELLA PRIMA TRASMISSIONE",unavailable:"ARCHIVIO NON DISPONIBILE",error:"Impossibile raggiungere l’archivio TV. Riprova più tardi.",videoError:"VIDEO NON DISPONIBILE"},
ja:{log:"放送ログ",now:"選択中",ready:"配信を選択しました · 再生できます",kicker:"アウトブレイク、放送中",title:"ZOMBCASH TV — アウトブレイク現場から生中継",intro:"ライブ配信、現地ブリーフィング、拡大するZombieCash動画アーカイブ。エピソードを選択してください。新しい動画は公開後ここに表示されます。",empty:"まだ配信はありません",emptyNote:"TVアーカイブに接続されると、公開済みのエピソードがここに表示されます。",connecting:"バンカーに接続中…",selected:"選択中",choose:"アーカイブからエピソードを選択してください。",recent:"最近の配信",more:"さらに読み込む",online:"アーカイブ稼働中",awaiting:"初回配信待ち",unavailable:"アーカイブを利用できません",error:"TVアーカイブに接続できません。後でもう一度お試しください。",videoError:"動画を再生できません"},
"zh-CN":{log:"节目记录",now:"当前选择",ready:"已选择节目 · 可以播放",kicker:"疫情现场，正在播出",title:"ZOMBCASH TV — 疫情前线直播",intro:"现场直播、前线简报和不断扩展的 ZombieCash 视频档案。选择一期观看；新视频发布后会显示在这里。",empty:"暂无节目",emptyNote:"电视档案接入后，已发布的节目将在此显示。",connecting:"正在连接地下避难所……",selected:"当前选择",choose:"从档案中选择一期节目。",recent:"近期节目",more:"加载更多",online:"档案已上线",awaiting:"等待首期节目",unavailable:"档案暂不可用",error:"无法连接电视档案，请稍后重试。",videoError:"视频不可用"},
ru:{log:"ЖУРНАЛ ЭФИРА",now:"ВЫБРАННЫЙ ВЫПУСК",ready:"ВЫПУСК ВЫБРАН · ГОТОВ К ПРОСМОТРУ",kicker:"ЭФИР ИЗ ЗОНЫ ВСПЫШКИ",title:"ZOMBCASH TV — ПРЯМОЙ ЭФИР ИЗ ЗОНЫ ВСПЫШКИ",intro:"Прямые трансляции, сводки с мест и растущий видеоархив ZombieCash. Выберите выпуск для просмотра; новые видео появятся здесь после публикации.",empty:"ТРАНСЛЯЦИЙ ПОКА НЕТ",emptyNote:"Опубликованные выпуски появятся здесь после подключения ТВ-архива.",connecting:"СВЯЗЬ С БУНКЕРОМ...",selected:"ВЫБРАННЫЙ ВЫПУСК",choose:"Выберите выпуск из архива.",recent:"ПОСЛЕДНИЕ ВЫПУСКИ",more:"ЗАГРУЗИТЬ ЕЩЁ",online:"АРХИВ ДОСТУПЕН",awaiting:"ОЖИДАЕТСЯ ПЕРВЫЙ ВЫПУСК",unavailable:"АРХИВ НЕДОСТУПЕН",error:"Не удалось связаться с ТВ-архивом. Попробуйте позже.",videoError:"ВИДЕО НЕДОСТУПНО"},
tr:{log:"YAYIN KAYDI",now:"SEÇİLİ YAYIN",ready:"YAYIN SEÇİLDİ · OYNATMAYA HAZIR",kicker:"SALGIN YAYINDA",title:"ZOMBCASH TV — SALGIN BÖLGESİNDEN CANLI",intro:"Canlı yayınlar, saha brifingleri ve büyüyen ZombieCash video arşivi. İzlemek için bir bölüm seç; yeni videolar yayımlandıkça burada görünecek.",empty:"HENÜZ YAYIN YOK",emptyNote:"TV arşivi bağlandığında yayımlanan bölümler burada görünecek.",connecting:"SIĞINAĞA BAĞLANILIYOR...",selected:"SEÇİLİ YAYIN",choose:"Arşivden bir bölüm seç.",recent:"SON YAYINLAR",more:"DAHA FAZLA YÜKLE",online:"ARŞİV ÇEVRİMİÇİ",awaiting:"İLK YAYIN BEKLENİYOR",unavailable:"ARŞİV KULLANILAMIYOR",error:"TV arşivine ulaşılamadı. Daha sonra tekrar dene.",videoError:"VİDEO KULLANILAMIYOR"},
hi:{log:"प्रसारण लॉग",now:"वर्तमान चयन",ready:"प्रसारण चुना गया · चलाने के लिए तैयार",kicker:"प्रकोप का सीधा प्रसारण",title:"ZOMBCASH TV — प्रकोप क्षेत्र से सीधा प्रसारण",intro:"लाइव प्रसारण, फील्ड ब्रीफिंग और बढ़ता ZombieCash वीडियो संग्रह। देखने के लिए एक एपिसोड चुनें; नए वीडियो प्रकाशित होने पर यहाँ दिखाई देंगे।",empty:"अभी कोई प्रसारण नहीं",emptyNote:"टीवी संग्रह जुड़ने पर प्रकाशित एपिसोड यहाँ दिखाई देंगे।",connecting:"बंकर से कनेक्ट हो रहा है...",selected:"वर्तमान चयन",choose:"संग्रह से एक एपिसोड चुनें।",recent:"हाल के प्रसारण",more:"और लोड करें",online:"संग्रह ऑनलाइन",awaiting:"पहले प्रसारण की प्रतीक्षा",unavailable:"संग्रह उपलब्ध नहीं",error:"टीवी संग्रह तक पहुँचा नहीं जा सका। बाद में फिर प्रयास करें।",videoError:"वीडियो उपलब्ध नहीं"}
};
const t=copy[lang]||copy.en;
const root=document.getElementById("zombcash-tv");
if(!root)return;
// The uploader is only rendered for the configured bot-owner identity. The API
// independently verifies the signed Telegram session and administrator allow-list.
try{
const profile=JSON.parse(localStorage.getItem("zombcash-survivor-profile")||"null");
const session=localStorage.getItem("zombcash-survivor-token")||"";
if(session&&profile&&String(profile.telegramId)==="8461681081"){
const panel=document.createElement("form");
panel.className="zctv-admin-upload";
panel.innerHTML='<details><summary>'+(lang==="ru"?"АДМИН: ОПУБЛИКОВАТЬ ВЫПУСК":"ADMIN: PUBLISH EPISODE")+'</summary><div class="zctv-upload-fields"><label>'+(lang==="ru"?"Название":"Title")+'<input name="title" maxlength="160" required></label><label>'+(lang==="ru"?"Описание":"Description")+'<textarea name="description" maxlength="1000" rows="2"></textarea></label><label>'+(lang==="ru"?"MP4-файл (до 250 МБ)":"MP4 file (up to 250 MB)")+'<input name="video" type="file" accept="video/mp4,.mp4" required></label><label>'+(lang==="ru"?"Длительность, сек. (необязательно)":"Duration in seconds (optional)")+'<input name="duration_seconds" type="number" min="1" max="86400"></label><button type="submit">'+(lang==="ru"?"ОПУБЛИКОВАТЬ В АРХИВ":"PUBLISH TO ARCHIVE")+'</button><p class="zctv-upload-status" role="status" aria-live="polite"></p></div></details>';
const grid=root.querySelector(".zctv-grid");
if(grid)root.insertBefore(panel,grid);
panel.addEventListener("submit",async event=>{
event.preventDefault();
const button=panel.querySelector('button[type="submit"]'),status=panel.querySelector(".zctv-upload-status"),formData=new FormData(panel);
const file=panel.querySelector('input[name="video"]').files[0];
if(!file)return;
if(file.size>250*1024*1024){status.textContent=lang==="ru"?"Файл больше 250 МБ":"File exceeds 250 MB";return;}
button.disabled=true;status.textContent=lang==="ru"?"ЗАГРУЗКА В БУНКЕР...":"UPLOADING TO BUNKER...";
try{
const response=await fetch(API+"/api/tv/episodes/upload",{method:"POST",headers:{Authorization:"Bearer "+session},body:formData,cache:"no-store"});
const result=await response.json().catch(()=>({}));
if(!response.ok)throw new Error(result.error||("HTTP "+response.status));
status.textContent=(lang==="ru"?"ОПУБЛИКОВАНО: ":"PUBLISHED: ")+(result.title||result.episode_id);
await load();
}catch(error){status.textContent=(lang==="ru"?"ОШИБКА: ":"ERROR: ")+(error.message||"Upload failed");}
finally{button.disabled=false;}
});
}
}catch(_){}
root.querySelector(".zctv-kicker").textContent=t.kicker;
root.querySelector("#zctv-title").textContent=t.title;
root.querySelector(".zctv-heading p:last-child").textContent=t.intro;
root.querySelector(".zctv-screen-empty strong").textContent=t.empty;
root.querySelector(".zctv-screen-empty span:last-child").textContent=t.emptyNote;
root.querySelector(".zctv-now .zctv-label").textContent=t.now;
root.querySelector(".zctv-archive-head .zctv-label").textContent=t.log;
root.querySelector("#zctv-archive-title").textContent=t.recent;
root.querySelector(".zctv-more").textContent=t.more;
const video=root.querySelector("video"),empty=root.querySelector(".zctv-screen-empty"),status=root.querySelector(".zctv-status"),meta=root.querySelector(".zctv-meta"),list=root.querySelector(".zctv-episodes"),more=root.querySelector(".zctv-more"),count=root.querySelector(".zctv-count"),current=root.querySelector(".zctv-current-title"),desc=root.querySelector(".zctv-current-description");
current.textContent=t.choose;
let page=1,totalPages=1,selected=null;
const setStatus=(value,state="idle")=>{status.textContent=value;meta.dataset.state=state;};
const date=value=>{const d=new Date(Number(value)*1000);return Number.isNaN(d.getTime())?"":new Intl.DateTimeFormat(lang,{year:"numeric",month:"short",day:"numeric"}).format(d);};
const choose=(episode,button)=>{selected=episode.episode_id;list.querySelectorAll("button").forEach(b=>b.setAttribute("aria-current",String(b===button)));current.textContent=episode.title||"Untitled transmission";desc.textContent=episode.description||"";empty.hidden=true;video.hidden=false;video.src=API+"/api/tv/episodes/"+encodeURIComponent(episode.episode_id)+"/video";video.load();setStatus(t.ready,"ready");};
const render=episode=>{const b=document.createElement("button");b.type="button";b.className="zctv-episode";b.setAttribute("aria-current","false");const strong=document.createElement("strong");strong.textContent=episode.title||"Untitled transmission";const small=document.createElement("small");small.textContent=date(episode.created_at)+(episode.duration_seconds?" · "+Math.round(Number(episode.duration_seconds))+" sec":"");b.append(strong,small);b.addEventListener("click",()=>choose(episode,b));list.append(b);if(!selected)choose(episode,b);};
async function load(next=false){if(!next){page=1;selected=null;list.replaceChildren();video.removeAttribute("src");video.hidden=true;video.load();empty.hidden=false;setStatus(t.connecting);}try{const res=await fetch(API+"/api/tv/episodes?page="+page+"&per_page=8",{headers:{Accept:"application/json"},cache:"no-store"});if(!res.ok)throw new Error("HTTP "+res.status);const data=await res.json(),episodes=Array.isArray(data.episodes)?data.episodes:[];totalPages=Number(data.total_pages)||1;count.textContent=String(Number(data.total)||0);episodes.forEach(render);more.hidden=page>=totalPages;if(!episodes.length&&page===1){const note=document.createElement("p");note.className="zctv-muted";note.textContent=t.empty;list.append(note);empty.hidden=false;setStatus(t.online+" · "+t.awaiting);}else if(episodes.length)setStatus(t.online+" · "+(Number(data.total)||0), "ready");}catch(_){if(page===1){list.replaceChildren();const note=document.createElement("p");note.className="zctv-muted";note.textContent=t.error;list.append(note);empty.hidden=false;video.hidden=true;count.textContent="—";setStatus(t.unavailable);}more.hidden=true;}}
video.addEventListener("error",()=>setStatus(t.videoError,"error"));more.addEventListener("click",()=>{if(page<totalPages){page+=1;load(true);}});load();
})();
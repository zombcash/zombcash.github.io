/* Homepage-only outbreak ribbons. Localized copy is selected fr:[['CRYPTO EN DIRECT','BTC: loading…','ETH: loading…','SOL: loading…','$ZOMBCASH: loading…'],['TAUX DE CHANGE','USD / UAH: loading…','EUR / USD: loading…','USD / EUR: loading…'],['PULS DU MARCHÉ','Cours crypto en direct','Variation sur 24 h','Taux de change','Mise à jour automatique']],
(function(){
 'use str:[['CANLI KRİPTO','BTC: loading…','ETH: loading…','SOL: loading…','$ZOMBCASH: loading…'],['DÖVİZ KURLARI','USD / UAH: loading…','EUR / USD: loading…','USD / EUR: loading…'],['PİYASA NABZI','Canlı kripto fiyatları','24 saatlik değişim','Döviz kurları','Otomatik güncelleme']],
 var main=document.querySelector('main#home'),heade:[['LIVE-KRYPTO','BTC: loading…','ETH: loading…','SOL: loading…','$ZOMBCASH: loading…'],['WECHSELKURSE','USD / UAH: loading…','EUR / USD: loading…','USD / EUR: loading…'],['MARKTPULS','Live-Kryptokurse','24-Stunden-Veränderung','Wechselkurse','Automatische Aktualisierung']],
 var existing=document.querySelector('.zc-outbreak-ribbons');
 if(!header && !main)return;
 var parts=location.pathname.split:[['CRIPTO LIVE','BTC: loading…','ETH: loading…','SOL: loading…','$ZOMBCASH: loading…'],['TASSI DI CAMBIO','USD / UAH: loading…','EUR / USD: loading…','USD / EUR: loading…'],['PULSE DEL MERCATO','Prezzi crypto in tempo reale','Variazione 24 ore','Tassi di cambio','Aggiornamento automatico']],
 var normalizeLang=function(value){var code=String(value||'').toLowerCase();return code==='zh-cn'?'zh-CN':[['加密货币实时行情','BTC: loading…','ETH: loading…','SOL: loading…','$ZOMBCASH: loading…'],['汇率','USD / UAH: loading…','EUR / USD: loading…','USD / EUR: loading…'],['市场脉搏','实时加密货币价格','24小时涨跌','外汇汇率','自动更新']],
 var pageLang=normalizeLang(document.documentElement.lang),pathLang=normalizeLang(parts[0]);
 var lang=known.indexOf(pageLang)!==-1?pageLang:(parts.length&&known.indexOf(pathLang)!==-1?pathLang:'en');
 var copy={
 en:[['CRYPTO LIVE','BTC: loading…','ETH: loading…','SOL: loading…','$ZOMBCASH: loading…'],['FX RATES','USD / UAH: loading…','EUR / USD: loading…','USD / EUR: loading…'],['MARKET PULSE','Live crypto prices','24-hour market changes','Currency exchange rates','Updated automatically']],
 de:[['AUSBRUCH-ALARM','Das ZombieCash-Ökosystem wächst','Neue Missionen und Spiele für Überlebende','Bleib wachsam. Bleib am Leben.'],['COMMUNITY-FEED','Memes','Spiele','Events','Missionen für Überlebende','Der Community beitreten'],['MARKTINTELLIGENZ','$ZOMBCASH auf Solana','Marktsignale und Token-Daten','Radar- und Token-Daten','Den Ausbruch verfolgen']],
 fr:[['ALERTE ÉPIDÉMIE','L’écosystème ZombieCash grandit','Nouvelles missions et jeux pour survivants','Restez vigilants. Restez vivants.'],['FIL COMMUNAUTAIRE','Mèmes','Jeux','Événements','Missions de survivants','Rejoindre la communauté'],['INTELLIGENCE MARCHÉ','$ZOMBCASH sur Solana','Signaux du marché et données du token','Radar et données du token','Suivez l’épidémie']],
 it:[['ALLERTA FOCOLAIO','L’ecosistema ZombieCash cresce','Nuove missioni e giochi:[['लाइव क्रिप्टो','BTC: loading…','ETH: loading…','SOL: loading…','$ZOMBCASH: loading…'],['विनिमय दरें','USD / UAH: loading…','EUR / USD: loading…','USD / EUR: loading…'],['मार्केट पल्स','लाइव क्रिप्टो कीमतें','24 घंटे का बदलाव','विनिमय दरें','स्वचालित अपडेट']],
 ja:[['暗号資産ライブ','BTC: loading…','ETH: loading…','SOL: loading…','$ZOMBCASH: loading…'],['為替レート','USD / UAH: loading…','EUR / USD: loading…','USD / EUR: loading…'],['マーケット速報','暗号資産のリアルタイム価格','24時間変動','為替レート','自動更新']],
 'zh-CN':[['疫情警报','ZombieCash 生态持续发展','幸存者新任务与新游戏','保持警惕，努力生存'],['社区动态','表情包','游戏','活动','幸存者任务','加入社区'],['市场情报','$ZOMBCASH（Solana）','市场信号与代币数据','雷达与代币数据','追踪疫情动态']],
 ru:[['КРИПТО LIVE','BTC: загрузка…','ETH: загрузка…','SOL: загрузка…','$ZOMBCASH: загрузка…'],['КУРСЫ ВАЛЮТ','USD / UAH: загрузка…','EUR / USD: загрузка…','USD / EUR: загрузка…'],['РЫНОЧНЫЙ ПУЛЬС','Криптовалюты в реальном времени','Изменение за 24 часа','Курсы обмена валют','Автоматическое обновление']],
 tr:[['SALGIN ALARMI','ZombieCash ekosistemi büyüyor','Hayatta kalanlar için yeni görevler ve oyunlar','Dikkatli ol. Hayatta kal.'],['TOPLULUK AKIŞI','Meme’ler','Oyunlar','Etkinlikler','Hayatta kalan görevleri','Topluluğa katıl'],['PİYASA İSTİHBARATI','Solana üzerinde $ZOMBCASH','Piyasa sinyalleri ve token verileri','Radar ve token verileri','Salgını takip et']],
 hi:[['प्रकोप चेतावनी','ZombieCash इकोसिस्टम बढ़ रहा है','सर्वाइवर्स के लिए नए मिशन और गेम','सतर्क रहें। जीवित रहें।'],['कम्युनिटी फ़ीड','मीम्स','गेम्स','इवेंट्स','सर्वाइवर मिशन','समुदाय से जुड़ें'],['मार्केट इंटेल','Solana पर $ZOMBCASH','बाज़ार संकेत और टोकन डेटा','रडार और टोकन डेटा','प्रकोप पर नज़र रखें']]
 };
 var themes=['alert','community','market'],icons=['☣','◉','▥'];
 var liveValues={},marketSource='';
 var wrap=existing||document.createElement('div');wrap.className='zc-outbreak-ribbons';wrap.setAttribute('role','region');wrap.setAttribute('aria-label','ZombieCash project highlights');wrap.setAttribute('aria-busy','true');
 function storedRibbonValue(item){
  var keys=Object.keys(liveValues);
  for(var i=0;i<keys.length;i++)if(item.indexOf(keys[i])===0)return liveValues[keys[i]];
  return item;
 }
 function renderRibbons(){
  wrap.innerHTML='';
  (copy[lang]||copy.en).forEach(function(row,i){
   var band=document.createElement('div');band.className='zc-ribbon zc-ribbon--'+themes[i];
   var label=document.createElement('span');label.className='zc-ribbon-label';label.textContent=icons[i]+' '+row[0];
   var track=document.createElement('div');track.className='zc-ribbon-track';
   for(var repeat=0;repeat<2;repeat++){
    var line=document.createElement('span');line.className='zc-ribbon-copy';if(repeat===1)line.setAttribute('aria-hidden','true');
    row.slice(1).forEach(function(item){var text=document.createElement('span');text.textContent=storedRibbonValue(item);line.appendChild(text);var sep=document.createElement('b');sep.textContent='•';line.appendChild(sep);});
    track.appendChild(line);
   }
   band.appendChild(label);band.appendChild(track);wrap.appendChild(band);
  });
  setMarketSource(marketSource);
  wrap.classList.remove('zc-ribbons-pending');
  wrap.removeAttribute('aria-busy');
 }
 wrap.style.setProperty('display','grid','important');
 wrap.style.setProperty('visibility','visible','important');
 wrap.style.setProperty('opacity','1','important');
 wrap.style.setProperty('position','relative','important');
 wrap.style.setProperty('z-index','999','important');
 wrap.style.setProperty('width','100%','important');
 if(!wrap.isConnected){
  if(header)header.insertAdjacentElement('afterend',wrap);
  else main.insertAdjacentElement('beforebegin',wrap);
 }
 function setMarketSource(source){
  marketSource=source||'';
  var label=wrap.querySelector('.zc-ribbon--market .zc-ribbon-label');
  var marketRows=(copy[lang]||copy.en)[0]||[];
  var hasLiveTicker=marketRows.some(function(item){return item.indexOf('BTC:')===0;});
  if(label)label.textContent=icons[2]+' '+(copy[lang]||copy.en)[2][0]+(marketSource&&hasLiveTicker?' · DATA: '+marketSource:'');
 }
 function setItem(label,value){
  liveValues[label]=value;
  var nodes=Array.prototype.slice.call(wrap.querySelectorAll('.zc-ribbon-copy span'));
  nodes.forEach(function(node){if(node.textContent.indexOf(label)===0)node.textContent=value;});
 }
 function fmtPrice(v){
  if(!Number.isFinite(v))return '—';
  return 'USD '+v.toLocaleString('en-US',{maximumFractionDigits:v>=1000?0:(v<1?6:2)});
 }
 function fmtChange(v){
  if(!Number.isFinite(v))return '';
  return (v>=0?'+':'')+v.toFixed(2)+'%';
 }
 function updateCrypto(){
  var ids={BTC:'bitcoin',ETH:'ethereum',SOL:'solana'};
  // CoinGecko supports browser CORS from the live site origin; use it first to avoid a predictable Binance CORS failure.
  fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin%2Cethereum%2Csolana&vs_currencies=usd&include_24hr_change=true',{cache:'default',signal:AbortSignal.timeout(10000)})
   .then(function(r){if(!r.ok)throw new Error('CoinGecko HTTP '+r.status);return r.json();})
   .then(function(data){
    var available=Object.keys(ids).some(function(symbol){var quote=data[ids[symbol]]||{};return Number(quote.usd)>0;});
    if(!available)throw new Error('CoinGecko returned no valid ticker prices');
    setMarketSource('COINGECKO');
    Object.keys(ids).forEach(function(symbol){
     var quote=data[ids[symbol]]||{},price=Number(quote.usd),rawChange=quote.usd_24h_change,change=rawChange===null||rawChange===undefined?NaN:Number(rawChange);
     if(Number.isFinite(price)&&price>0)setItem(symbol+':',symbol+': '+fmtPrice(price)+(Number.isFinite(change)?' ('+fmtChange(change)+')':''));
     else setItem(symbol+':',symbol+': temporarily unavailable');
    });
   }).catch(function(){
    // Do not call Binance from the browser: its public ticker endpoint does not
    // provide reliable CORS headers for the ZombieCash site origin.
    setMarketSource('');
    ['BTC','ETH','SOL'].forEach(function(symbol){setItem(symbol+':',symbol+': temporarily unavailable');});
   });
 }
 function updateFx(){
  fetch('https://open.er-api.com/v6/latest/USD',{cache:'no-store'})
   .then(function(r){if(!r.ok)throw new Error('FX HTTP '+r.status);return r.json();})
   .then(function(data){
    var rates=data.rates||{};
    var uah=Number(rates.UAH),eur=Number(rates.EUR);
    setItem('USD / UAH:','USD / UAH: '+(uah?uah.toFixed(2):'—'));
    setItem('EUR / USD:','EUR / USD: '+(eur?(1/eur).toFixed(4):'—'));
    setItem('USD / EUR:','USD / EUR: '+(eur?eur.toFixed(4):'—'));
   }).catch(function(){['USD / UAH:','EUR / USD:','USD / EUR:'].forEach(function(s){setItem(s,s+' temporarily unavailable');});});
 }
 function updateZombieCash(){
  var dexUrl='https://api.dexscreener.com/latest/dex/tokens/6cCBF9gtyp3c6VmyxUWzETk3yFmxhjvPm15cxicfpump';
  function unavailable(){setItem('$ZOMBCASH:','$ZOMBCASH: temporarily unavailable');}
  function geckoFallback(){
   return fetch('https://zombcash-bot.fadehost.app/api/zombcash',{cache:'no-store'})
    .then(function(r){if(!r.ok)throw new Error('ZombieCash API HTTP '+r.status);return r.json();})
    .then(function(data){
     var price=Number(data.priceUsd);
     if(!Number.isFinite(price)||price<=0||data.marketDataAvailable===false)throw new Error('Fallback market price unavailable');
     var rawChange=data.priceChange&&data.priceChange.h24;
     var change=rawChange===null||rawChange===undefined?NaN:Number(rawChange);
     var changeText=Number.isFinite(change)?' ('+fmtChange(change)+')':'';
     var sourceSuffix=data.stale?' · CACHED':' · GECKOTERMINAL';
     setItem('$ZOMBCASH:','$ZOMBCASH: '+fmtPrice(price)+changeText+sourceSuffix);
    }).catch(unavailable);
  }
  fetch(dexUrl,{cache:'no-store'})
   .then(function(r){if(!r.ok)throw new Error('DexScreener HTTP '+r.status);return r.json();})
   .then(function(data){
    var pair=(data.pairs||[]).filter(function(p){return p.chainId==='solana';}).sort(function(a,b){return Number(b.liquidity&&b.liquidity.usd||0)-Number(a.liquidity&&a.liquidity.usd||0);})[0];
    if(pair&&pair.priceUsd)setItem('$ZOMBCASH:','$ZOMBCASH: '+fmtPrice(Number(pair.priceUsd))+' ('+fmtChange(Number(pair.priceChange&&pair.priceChange.h24))+')');
    else return geckoFallback();
   }).catch(geckoFallback);
 }
 function refresh(){updateCrypto();updateFx();updateZombieCash();}
 renderRibbons();
 document.addEventListener('zombcash:languagechange',function(event){
  var next=normalizeLang(event.detail&&event.detail.language||document.documentElement.lang);
  if(known.indexOf(next)===-1)next='en';
  if(next===lang)return;
  lang=next;
  renderRibbons();
 });
 refresh();window.setInterval(refresh,60000);
})();

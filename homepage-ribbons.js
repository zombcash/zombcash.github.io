/* Homepage-only outbreak ribbons. Localized copy is selected from the page locale. */
(function(){
 'use strict';
 var main=document.querySelector('main#home'),header=document.querySelector('header.topbar, header');
 if(!header)return;
 var existing=document.querySelector('.zc-outbreak-ribbons');
 if(existing){window.setTimeout(function(){existing.style.setProperty('display','grid','important');},0);return;}
 var parts=location.pathname.split('/').filter(Boolean),known=['de','fr','it','ja','zh-CN','ru','tr','hi'];
 var lang=parts.length&&known.indexOf(parts[0])!==-1?parts[0]:'en';
 var copy={
 en:[['CRYPTO LIVE','BTC: loading…','ETH: loading…','SOL: loading…','$ZOMBCASH: loading…'],['FX RATES','USD / UAH: loading…','EUR / USD: loading…','USD / EUR: loading…'],['MARKET PULSE','Live crypto prices','24-hour market changes','Currency exchange rates','Updated automatically']],
 de:[['AUSBRUCH-ALARM','Das ZombieCash-Ökosystem wächst','Neue Missionen und Spiele für Überlebende','Bleib wachsam. Bleib am Leben.'],['COMMUNITY-FEED','Memes','Spiele','Events','Missionen für Überlebende','Der Community beitreten'],['MARKTINTELLIGENZ','$ZOMBCASH auf Solana','Marktsignale und Token-Daten','Radar- und Token-Daten','Den Ausbruch verfolgen']],
 fr:[['ALERTE ÉPIDÉMIE','L’écosystème ZombieCash grandit','Nouvelles missions et jeux pour survivants','Restez vigilants. Restez vivants.'],['FIL COMMUNAUTAIRE','Mèmes','Jeux','Événements','Missions de survivants','Rejoindre la communauté'],['INTELLIGENCE MARCHÉ','$ZOMBCASH sur Solana','Signaux du marché et données du token','Radar et données du token','Suivez l’épidémie']],
 it:[['ALLERTA FOCOLAIO','L’ecosistema ZombieCash cresce','Nuove missioni e giochi per i sopravvissuti','Resta vigile. Resta vivo.'],['FEED COMMUNITY','Meme','Giochi','Eventi','Missioni dei sopravvissuti','Unisciti alla community'],['DATI DI MERCATO','$ZOMBCASH su Solana','Segnali di mercato e dati del token','Radar e dati del token','Monitora il focolaio']],
 ja:[['アウトブレイク警報','ZombieCashエコシステムが拡大中','サバイバー向けの新ミッションとゲーム','警戒を続け、生き延びよう'],['コミュニティ情報','ミーム','ゲーム','イベント','サバイバーミッション','コミュニティに参加'],['マーケット情報','$ZOMBCASH（Solana）','市場シグナルとトークンデータ','レーダーとトークンデータ','感染状況をチェック']],
 'zh-CN':[['疫情警报','ZombieCash 生态持续发展','幸存者新任务与新游戏','保持警惕，努力生存'],['社区动态','表情包','游戏','活动','幸存者任务','加入社区'],['市场情报','$ZOMBCASH（Solana）','市场信号与代币数据','雷达与代币数据','追踪疫情动态']],
 ru:[['КРИПТО LIVE','BTC: загрузка…','ETH: загрузка…','SOL: загрузка…','$ZOMBCASH: загрузка…'],['КУРСЫ ВАЛЮТ','USD / UAH: загрузка…','EUR / USD: загрузка…','USD / EUR: загрузка…'],['РЫНОЧНЫЙ ПУЛЬС','Криптовалюты в реальном времени','Изменение за 24 часа','Курсы обмена валют','Автоматическое обновление']],
 tr:[['SALGIN ALARMI','ZombieCash ekosistemi büyüyor','Hayatta kalanlar için yeni görevler ve oyunlar','Dikkatli ol. Hayatta kal.'],['TOPLULUK AKIŞI','Meme’ler','Oyunlar','Etkinlikler','Hayatta kalan görevleri','Topluluğa katıl'],['PİYASA İSTİHBARATI','Solana üzerinde $ZOMBCASH','Piyasa sinyalleri ve token verileri','Radar ve token verileri','Salgını takip et']],
 hi:[['प्रकोप चेतावनी','ZombieCash इकोसिस्टम बढ़ रहा है','सर्वाइवर्स के लिए नए मिशन और गेम','सतर्क रहें। जीवित रहें।'],['कम्युनिटी फ़ीड','मीम्स','गेम्स','इवेंट्स','सर्वाइवर मिशन','समुदाय से जुड़ें'],['मार्केट इंटेल','Solana पर $ZOMBCASH','बाज़ार संकेत और टोकन डेटा','रडार और टोकन डेटा','प्रकोप पर नज़र रखें']]
 };
 var themes=['alert','community','market'],icons=['☣','◉','▥'];
 var wrap=document.createElement('div');wrap.className='zc-outbreak-ribbons';wrap.setAttribute('role','region');wrap.setAttribute('aria-label','ZombieCash project highlights');
 (copy[lang]||copy.en).forEach(function(row,i){
  var band=document.createElement('div');band.className='zc-ribbon zc-ribbon--'+themes[i];
  var label=document.createElement('span');label.className='zc-ribbon-label';label.textContent=icons[i]+' '+row[0];
  var track=document.createElement('div');track.className='zc-ribbon-track';
  for(var repeat=0;repeat<2;repeat++){
   var line=document.createElement('span');line.className='zc-ribbon-copy';if(repeat===1)line.setAttribute('aria-hidden','true');
   row.slice(1).forEach(function(item){var text=document.createElement('span');text.textContent=item;line.appendChild(text);var sep=document.createElement('b');sep.textContent='•';line.appendChild(sep);});
   track.appendChild(line);
  }
  band.appendChild(label);band.appendChild(track);wrap.appendChild(band);
 });
 header.insertAdjacentElement('afterend',wrap);
 function setItem(label,value){
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
  var symbols=['BTCUSDT','ETHUSDT','SOLUSDT'];
  fetch('https://api.binance.com/api/v3/ticker/24hr?symbols='+encodeURIComponent(JSON.stringify(symbols)),{cache:'no-store'})
   .then(function(r){if(!r.ok)throw new Error('Binance HTTP '+r.status);return r.json();})
   .then(function(rows){
    rows.forEach(function(row){
     var name=row.symbol.replace('USDT','');
     var change=Number(row.priceChangePercent);
     setItem(name+':',name+': '+fmtPrice(Number(row.lastPrice))+' ('+fmtChange(change)+')');
    });
   }).catch(function(){['BTC','ETH','SOL'].forEach(function(s){setItem(s+':',s+': temporarily unavailable');});});
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
  fetch('https://api.dexscreener.com/latest/dex/tokens/6cCBF9gtyp3c6VmyxUWzETk3yFmxhjvPm15cxicfpump',{cache:'no-store'})
   .then(function(r){if(!r.ok)throw new Error('DexScreener HTTP '+r.status);return r.json();})
   .then(function(data){
    var pair=(data.pairs||[]).filter(function(p){return p.chainId==='solana';}).sort(function(a,b){return Number(b.liquidity&&b.liquidity.usd||0)-Number(a.liquidity&&a.liquidity.usd||0);})[0];
    if(pair&&pair.priceUsd)setItem('$ZOMBCASH:','$ZOMBCASH: '+fmtPrice(Number(pair.priceUsd))+' ('+fmtChange(Number(pair.priceChange&&pair.priceChange.h24))+')');
    else setItem('$ZOMBCASH:','$ZOMBCASH: no live pair data');
   }).catch(function(){setItem('$ZOMBCASH:','$ZOMBCASH: temporarily unavailable');});
 }
 function refresh(){updateCrypto();updateFx();updateZombieCash();}
 refresh();window.setInterval(refresh,60000);
})();
+v.toLocaleString('en-US',{maximumFractionDigits:v>=1000?0:(v<1?6:2)});
 }
 function fmtChange(v){
  if(!Number.isFinite(v))return '';
  return (v>=0?'+':'')+v.toFixed(2)+'%';
 }
 function updateCrypto(){
  var symbols=['BTCUSDT','ETHUSDT','SOLUSDT'];
  fetch('https://api.binance.com/api/v3/ticker/24hr?symbols='+encodeURIComponent(JSON.stringify(symbols)),{cache:'no-store'})
   .then(function(r){if(!r.ok)throw new Error('Binance HTTP '+r.status);return r.json();})
   .then(function(rows){
    rows.forEach(function(row){
     var name=row.symbol.replace('USDT','');
     var change=Number(row.priceChangePercent);
     setItem(name+':',name+': '+fmtPrice(Number(row.lastPrice))+' ('+fmtChange(change)+')');
    });
   }).catch(function(){['BTC','ETH','SOL'].forEach(function(s){setItem(s+':',s+': temporarily unavailable');});});
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
  fetch('https://api.dexscreener.com/latest/dex/tokens/6cCBF9gtyp3c6VmyxUWzETk3yFmxhjvPm15cxicfpump',{cache:'no-store'})
   .then(function(r){if(!r.ok)throw new Error('DexScreener HTTP '+r.status);return r.json();})
   .then(function(data){
    var pair=(data.pairs||[]).filter(function(p){return p.chainId==='solana';}).sort(function(a,b){return Number(b.liquidity&&b.liquidity.usd||0)-Number(a.liquidity&&a.liquidity.usd||0);})[0];
    if(pair&&pair.priceUsd)setItem('$ZOMBCASH:','$ZOMBCASH: '+fmtPrice(Number(pair.priceUsd))+' ('+fmtChange(Number(pair.priceChange&&pair.priceChange.h24))+')');
    else setItem('$ZOMBCASH:','$ZOMBCASH: no live pair data');
   }).catch(function(){setItem('$ZOMBCASH:','$ZOMBCASH: temporarily unavailable');});
 }
 function refresh(){updateCrypto();updateFx();updateZombieCash();}
 refresh();window.setInterval(refresh,60000);
})();

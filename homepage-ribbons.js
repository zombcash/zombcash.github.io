/* Homepage-only outbreak ribbons. Localized copy is selected from the page locale. */
(function(){
 'use strict';
 var main=document.querySelector('main#home'),header=document.querySelector('header.topbar');
 if(!main||!header||document.querySelector('.zc-outbreak-ribbons'))return;
 var parts=location.pathname.split('/').filter(Boolean),known=['de','fr','it','ja','zh-CN','ru','tr','hi'];
 var lang=parts.length&&known.indexOf(parts[0])!==-1?parts[0]:'en';
 var copy={
 en:[['OUTBREAK ALERT','The ZombieCash ecosystem is growing','New missions and games for survivors','Stay sharp. Stay alive.'],['COMMUNITY FEED','Memes','Games','Events','Earn Survival Points (SP)','Grow the horde'],['MARKET INTEL','$ZOMBCASH on Solana','Live market signals','Radar and token data','Track the outbreak']],
 de:[['AUSBRUCH-ALARM','Das ZombieCash-Ökosystem wächst','Neue Missionen und Spiele für Überlebende','Bleib wachsam. Bleib am Leben.'],['COMMUNITY-FEED','Memes','Spiele','Events','Survival-Punkte (SP) sammeln','Die Horde vergrößern'],['MARKTINTELLIGENZ','$ZOMBCASH auf Solana','Live-Marktsignale','Radar- und Token-Daten','Den Ausbruch verfolgen']],
 fr:[['ALERTE ÉPIDÉMIE','L’écosystème ZombieCash grandit','Nouvelles missions et jeux pour survivants','Restez vigilants. Restez vivants.'],['FIL COMMUNAUTAIRE','Mèmes','Jeux','Événements','Gagnez des points de survie (SP)','Agrandissez la horde'],['INTELLIGENCE MARCHÉ','$ZOMBCASH sur Solana','Signaux du marché en direct','Radar et données du token','Suivez l’épidémie']],
 it:[['ALLERTA FOCOLAIO','L’ecosistema ZombieCash cresce','Nuove missioni e giochi per i sopravvissuti','Resta vigile. Resta vivo.'],['FEED COMMUNITY','Meme','Giochi','Eventi','Ottieni Survival Points (SP)','Fai crescere l’orda'],['DATI DI MERCATO','$ZOMBCASH su Solana','Segnali di mercato in tempo reale','Radar e dati del token','Monitora il focolaio']],
 ja:[['アウトブレイク警報','ZombieCashエコシステムが拡大中','サバイバー向けの新ミッションとゲーム','警戒を続け、生き延びよう'],['コミュニティ情報','ミーム','ゲーム','イベント','サバイバルポイント（SP）を獲得','仲間を増やそう'],['マーケット情報','$ZOMBCASH（Solana）','リアルタイム市場シグナル','レーダーとトークンデータ','感染状況をチェック']],
 'zh-CN':[['疫情警报','ZombieCash 生态持续发展','幸存者新任务与新游戏','保持警惕，努力生存'],['社区动态','表情包','游戏','活动','赚取生存积分（SP）','壮大幸存者队伍'],['市场情报','$ZOMBCASH（Solana）','实时市场信号','雷达与代币数据','追踪疫情动态']],
 ru:[['ТРЕВОГА: ВСПЫШКА','Экосистема ZombieCash развивается','Новые миссии и игры для выживших','Будь начеку. Выживай.'],['ЛЕНТА СООБЩЕСТВА','Мемы','Игры','События','Зарабатывай Survival Points (SP)','Увеличивай орду'],['РЫНОЧНАЯ РАЗВЕДКА','$ZOMBCASH в Solana','Рыночные сигналы в реальном времени','Радар и данные токена','Следи за вспышкой']],
 tr:[['SALGIN ALARMI','ZombieCash ekosistemi büyüyor','Hayatta kalanlar için yeni görevler ve oyunlar','Dikkatli ol. Hayatta kal.'],['TOPLULUK AKIŞI','Meme’ler','Oyunlar','Etkinlikler','Survival Points (SP) kazan','Sürüyü büyüt'],['PİYASA İSTİHBARATI','Solana üzerinde $ZOMBCASH','Canlı piyasa sinyalleri','Radar ve token verileri','Salgını takip et']],
 hi:[['प्रकोप चेतावनी','ZombieCash इकोसिस्टम बढ़ रहा है','सर्वाइवर्स के लिए नए मिशन और गेम','सतर्क रहें। जीवित रहें।'],['कम्युनिटी फ़ीड','मीम्स','गेम्स','इवेंट्स','Survival Points (SP) कमाएँ','समुदाय बढ़ाएँ'],['मार्केट इंटेल','$ZOMBCASH on Solana','लाइव मार्केट संकेत','रडार और टोकन डेटा','प्रकोप पर नज़र रखें']]
 };
 var themes=['alert','community','market'],icons=['☣','◉','▥'];
 var wrap=document.createElement('div');wrap.className='zc-outbreak-ribbons';wrap.setAttribute('aria-label','ZombieCash live information');
 (copy[lang]||copy.en).forEach(function(row,i){
  var band=document.createElement('div');band.className='zc-ribbon zc-ribbon--'+themes[i];
  var label=document.createElement('span');label.className='zc-ribbon-label';label.textContent=icons[i]+' '+row[0];
  var track=document.createElement('div');track.className='zc-ribbon-track';
  for(var repeat=0;repeat<2;repeat++){
   var line=document.createElement('span');line.className='zc-ribbon-copy';
   row.slice(1).forEach(function(item){var text=document.createElement('span');text.textContent=item;line.appendChild(text);var sep=document.createElement('b');sep.textContent='•';line.appendChild(sep);});
   track.appendChild(line);
  }
  band.appendChild(label);band.appendChild(track);wrap.appendChild(band);
 });
 header.insertAdjacentElement('afterend',wrap);
})();

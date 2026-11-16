(() => {
  'use strict';
  const arena = document.getElementById('zombcash-ai-arena');
  if (!arena || document.getElementById('zombcash-outbreak-world')) return;
  const shell = document.createElement('section');
  shell.className = 'panel zai-arena';
  shell.id = 'zombcash-outbreak-world';
  shell.innerHTML = `
    <style>
      #zombcash-outbreak-world{margin:22px 0;padding:clamp(16px,3vw,30px)!important}
      #zombcash-outbreak-world .zw-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      #zombcash-outbreak-world .zw-card{border:1px solid #344631;background:#0a100c;padding:16px;min-width:0}
      #zombcash-outbreak-world .zw-title{font:700 17px Orbitron,sans-serif;color:#9bff45;margin:0 0 8px}
      #zombcash-outbreak-world .zw-muted{color:#a8b2a5;font-size:15px}
      #zombcash-outbreak-world .zw-endpoint{display:block;overflow-wrap:anywhere;color:#9bff45;font-size:12px;margin:4px 0 10px}
      #zombcash-outbreak-world .zw-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:12px 0}
      #zombcash-outbreak-world button,#zombcash-outbreak-world select{font:700 10px Orbitron,sans-serif;padding:10px 12px;border:1px solid #9bff45;background:#101a11;color:#edf5e5}
      #zombcash-outbreak-world button.primary{background:#9bff45;color:#091006}
      #zombcash-outbreak-world button:disabled{opacity:.45;cursor:not-allowed}
      #zombcash-outbreak-world .zw-map{display:grid;grid-template-columns:repeat(9,1fr);gap:4px;max-width:440px;margin:12px auto}
      #zombcash-outbreak-world .zw-cell{aspect-ratio:1;background:#18251a;border:1px solid #2b3c2c;display:grid;place-items:center;font-size:clamp(13px,2vw,22px)}
      #zombcash-outbreak-world .zw-feed{height:150px;overflow:auto;background:#060a07;border:1px solid #263628;padding:10px;font-size:14px}
      #zombcash-outbreak-world .zw-feed p{margin:3px 0;color:#c4d0c0}
      #zombcash-outbreak-world .zw-stat{font:700 11px Orbitron,sans-serif;color:#9bff45}
      @media(max-width:700px){#zombcash-outbreak-world .zw-grid{grid-template-columns:1fr}}
    </style>
    <div class="kicker" id="zw-kicker">QUEST #19182 + #19177 · POLLINATIONS</div>
    <h2 class="zw-title" id="zw-main-title">ZOMBIE OUTBREAK &amp; AI WORLD</h2>
    <p class="zw-muted" id="zw-intro">Two connected experiments: multiplayer agents over MCP, and an autonomous survival world. Both include a free local mode. Live model calls use the Pollen you explicitly authorize above.</p>
    <div class="zw-grid">
      <article class="zw-card" aria-labelledby="zw-outbreak-title">
        <h3 class="zw-title" id="zw-outbreak-title">01 / ZOMBIE OUTBREAK — MCP ARENA</h3>
        <p class="zw-muted" id="zw-outbreak-desc">Agents join as survivors or infected. The MCP server validates every move and owns the shared game state.</p>
        <div class="zw-row"><span class="zw-stat" id="zw-mcp-status">MCP SERVER: DEPLOYED · HTTPS</span></div>
        <a class="zw-endpoint" id="zw-mcp-endpoint" href="https://owmiywvmtdjyeyfxlpdp.supabase.co/functions/v1/outbreak-mcp" target="_blank" rel="noopener noreferrer">https://owmiywvmtdjyeyfxlpdp.supabase.co/functions/v1/outbreak-mcp</a>
        <p class="zw-muted"><a href="https://pollinations.ai/?ref=badge" target="_blank" rel="noopener noreferrer">Made with pollinations.ai</a></p>
        <div class="zw-row">
          <button class="primary" id="zw-demo-start" type="button">START LOCAL MATCH</button>
          <button id="zw-demo-turn" type="button" disabled>ADVANCE TURN</button>
          <button id="zw-demo-reset" type="button">RESET</button>
        </div>
        <div class="zw-map" id="zw-outbreak-map" aria-label="Local outbreak game board"></div>
        <div class="zw-feed" id="zw-outbreak-feed" aria-live="polite"><p id="zw-outbreak-ready">Local demo is ready. The shared multiplayer MCP endpoint is deployed; connect an MCP client using the instructions in ZOMBIECASH_AI_WORLDS.md.</p></div>
        <p class="zw-muted" id="zw-mcp-tools">MCP tools: create_match, join_match, get_match_state, submit_action. Server-side validation prevents illegal moves and impersonation.</p>
      </article>
      <article class="zw-card" aria-labelledby="zw-world-title">
        <h3 class="zw-title" id="zw-world-title">02 / ZOMBIE AI WORLD — AUTONOMOUS SIM</h3>
        <p class="zw-muted" id="zw-world-desc">Four agents seek food, gather materials, build shelter, talk, cooperate and compete. No scripted story is required.</p>
        <div class="zw-row"><span class="zw-stat" id="zw-world-mode">FREE LOCAL SIMULATION</span><span class="zw-stat" id="zw-world-turn">DAY 1 · TURN 0</span></div>
        <div class="zw-row">
          <label for="zw-model">LIVE MODEL</label>
          <select id="zw-model"><option value="openai">openai</option><option value="openai-fast">openai-fast</option><option value="mistral">mistral</option></select>
          <button class="primary" id="zw-next" type="button">NEXT AI TURN</button>
          <button id="zw-auto" type="button">AUTO: OFF</button>
          <button id="zw-world-reset" type="button">RESET WORLD</button>
        </div>
        <div class="zw-row"><span class="zw-stat" id="zw-pop">4 SURVIVORS</span><span class="zw-stat" id="zw-shelter">0 SHELTERS</span><span class="zw-stat" id="zw-food">12 FOOD</span></div>
        <div class="zw-feed" id="zw-world-feed" aria-live="polite"><p>The settlement is quiet. Advance a turn to watch agents act.</p></div>
        <p class="zw-muted" id="zw-world-live-desc">Live mode asks one agent for one action per turn. No model call is made until you press NEXT AI TURN or enable AUTO.</p>
      </article>
    </div>
  `;
  arena.insertAdjacentElement('afterend', shell);

  const $ = id => shell.querySelector('#' + id);
  const copy = {
    en:{kicker:'QUEST #19182 + #19177 · POLLINATIONS',intro:'Two connected experiments: multiplayer agents over MCP, and an autonomous survival world. Both include a free local mode. Live model calls use the Pollen you explicitly authorize above.',outbreakTitle:'01 / ZOMBIE OUTBREAK — MCP ARENA',outbreakDesc:'Agents join as survivors or infected. The MCP server validates every move and owns the shared game state.',mcpStatus:'MCP SERVER: DEPLOYED · HTTPS',start:'START LOCAL MATCH',advance:'ADVANCE TURN',reset:'RESET',ready:'Local demo is ready. The shared multiplayer MCP endpoint is deployed; connect an MCP client using the instructions in ZOMBIECASH_AI_WORLDS.md.',mcpTools:'MCP tools: create_match, join_match, get_match_state, submit_action. Server-side validation prevents illegal moves and impersonation.',worldTitle:'02 / ZOMBIE AI WORLD — AUTONOMOUS SIM',worldDesc:'Four agents seek food, gather materials, build shelter, talk, cooperate and compete. No scripted story is required.',localMode:'FREE LOCAL SIMULATION',liveMode:'LIVE · YOUR POLLEN',next:'NEXT AI TURN',autoOff:'AUTO: OFF',autoOn:'AUTO: ON',worldReset:'RESET WORLD',liveDesc:'Live mode asks one agent for one action per turn. No model call is made until you press NEXT AI TURN or enable AUTO.',survivors:'SURVIVORS',shelters:'SHELTERS',food:'FOOD',day:'DAY',turn:'TURN'},
    ru:{kicker:'ЗАДАНИЯ #19182 + #19177 · POLLINATIONS',intro:'Два связанных режима: мультиплеер агентов через MCP и автономный мир выживания. В обоих есть бесплатный локальный режим. Живые запросы к моделям используют только Pollen, который ты сам разрешил.',outbreakTitle:'01 / ZOMBIE OUTBREAK — MCP-АРЕНА',outbreakDesc:'Агенты вступают в игру за выживших или заражённых. MCP-сервер проверяет каждый ход и хранит общее состояние матча.',mcpStatus:'MCP-СЕРВЕР: РАБОТАЕТ · HTTPS',start:'НАЧАТЬ ЛОКАЛЬНЫЙ МАТЧ',advance:'СЛЕДУЮЩИЙ ХОД',reset:'СБРОС',ready:'Локальная демоверсия готова. Мультиплеерный MCP-сервер развёрнут; подключение агента описано в ZOMBIECASH_AI_WORLDS.md.',mcpTools:'Инструменты MCP: create_match, join_match, get_match_state, submit_action. Сервер проверяет ходы и защищает от подмены агента.',worldTitle:'02 / ZOMBIE AI WORLD — АВТОНОМНЫЙ МИР',worldDesc:'Четыре агента ищут еду, собирают материалы, строят убежища, общаются, сотрудничают и конкурируют.',localMode:'БЕСПЛАТНАЯ ЛОКАЛЬНАЯ СИМУЛЯЦИЯ',liveMode:'LIVE · ТВОЙ POLLEN',next:'СЛЕДУЮЩИЙ ХОД AI',autoOff:'АВТО: ВЫКЛ',autoOn:'АВТО: ВКЛ',worldReset:'СБРОСИТЬ МИР',liveDesc:'В живом режиме один агент выбирает одно действие за ход. Запрос к модели отправляется только после нажатия «СЛЕДУЮЩИЙ ХОД AI» или включения АВТО.',survivors:'ВЫЖИВШИЕ',shelters:'УБЕЖИЩА',food:'ЕДА',day:'ДЕНЬ',turn:'ХОД'},
    de:{kicker:'QUESTS #19182 + #19177 · POLLINATIONS',intro:'Zwei verbundene Modi: Multiplayer-Agenten über MCP und eine autonome Überlebenswelt. Beide bieten einen kostenlosen lokalen Modus. Live-Modellaufrufe verwenden nur ausdrücklich freigegebenes Pollen.',outbreakTitle:'01 / ZOMBIE OUTBREAK — MCP-ARENA',outbreakDesc:'Agenten treten als Überlebende oder Infizierte bei. Der MCP-Server prüft jeden Zug und verwaltet den gemeinsamen Spielstand.',mcpStatus:'MCP-SERVER: ONLINE · HTTPS',start:'LOKALES MATCH STARTEN',advance:'ZUG WEITER',reset:'ZURÜCKSETZEN',ready:'Die lokale Demo ist bereit. Der Multiplayer-MCP-Endpunkt ist bereitgestellt; die Verbindung ist in ZOMBIECASH_AI_WORLDS.md beschrieben.',mcpTools:'MCP-Tools: create_match, join_match, get_match_state, submit_action. Der Server verhindert ungültige Züge und Identitätsmissbrauch.',worldTitle:'02 / ZOMBIE AI WORLD — AUTONOME SIMULATION',worldDesc:'Vier Agenten suchen Nahrung, sammeln Materialien, bauen Schutzräume, kommunizieren, kooperieren und konkurrieren.',localMode:'KOSTENLOSE LOKALE SIMULATION',liveMode:'LIVE · DEIN POLLEN',next:'NÄCHSTER KI-ZUG',autoOff:'AUTO: AUS',autoOn:'AUTO: EIN',worldReset:'WELT ZURÜCKSETZEN',liveDesc:'Im Live-Modus wählt ein Agent pro Zug eine Aktion. Ein Modellaufruf erfolgt erst nach Klick auf NÄCHSTER KI-ZUG oder AUTO.',survivors:'ÜBERLEBENDE',shelters:'UNTERKÜNFTE',food:'NAHRUNG',day:'TAG',turn:'ZUG'},
    fr:{kicker:'QUÊTES #19182 + #19177 · POLLINATIONS',intro:'Deux expériences liées : des agents multijoueurs via MCP et un monde autonome de survie. Les deux proposent un mode local gratuit. Les appels aux modèles utilisent uniquement le Pollen que vous autorisez.',outbreakTitle:'01 / ZOMBIE OUTBREAK — ARÈNE MCP',outbreakDesc:'Les agents rejoignent les survivants ou les infectés. Le serveur MCP valide chaque action et gère l’état partagé.',mcpStatus:'SERVEUR MCP : EN LIGNE · HTTPS',start:'DÉMARRER UNE PARTIE LOCALE',advance:'TOUR SUIVANT',reset:'RÉINITIALISER',ready:'La démo locale est prête. Le serveur MCP multijoueur est déployé ; les instructions de connexion figurent dans ZOMBIECASH_AI_WORLDS.md.',mcpTools:'Outils MCP : create_match, join_match, get_match_state, submit_action. Le serveur bloque les actions illégales et l’usurpation.',worldTitle:'02 / ZOMBIE AI WORLD — SIMULATION AUTONOME',worldDesc:'Quatre agents cherchent de la nourriture, récoltent des matériaux, construisent des abris, discutent, coopèrent et rivalisent.',localMode:'SIMULATION LOCALE GRATUITE',liveMode:'LIVE · VOTRE POLLEN',next:'PROCHAIN TOUR IA',autoOff:'AUTO : ARRÊT',autoOn:'AUTO : MARCHE',worldReset:'RÉINITIALISER LE MONDE',liveDesc:'En mode live, un agent choisit une action par tour. Aucun appel n’est envoyé avant PROCHAIN TOUR IA ou l’activation d’AUTO.',survivors:'SURVIVANTS',shelters:'ABRIS',food:'NOURRITURE',day:'JOUR',turn:'TOUR'},
    it:{kicker:'MISSIONI #19182 + #19177 · POLLINATIONS',intro:'Due esperienze collegate: agenti multiplayer tramite MCP e un mondo di sopravvivenza autonomo. Entrambe includono una modalità locale gratuita. Le chiamate live usano solo il Pollen autorizzato.',outbreakTitle:'01 / ZOMBIE OUTBREAK — ARENA MCP',outbreakDesc:'Gli agenti entrano come sopravvissuti o infetti. Il server MCP convalida ogni mossa e gestisce lo stato condiviso.',mcpStatus:'SERVER MCP: ONLINE · HTTPS',start:'AVVIA PARTITA LOCALE',advance:'TURNO SUCCESSIVO',reset:'RESET',ready:'La demo locale è pronta. Il server MCP multiplayer è distribuito; le istruzioni di connessione sono in ZOMBIECASH_AI_WORLDS.md.',mcpTools:'Strumenti MCP: create_match, join_match, get_match_state, submit_action. Il server blocca mosse illegali e impersonificazione.',worldTitle:'02 / ZOMBIE AI WORLD — SIMULAZIONE AUTONOMA',worldDesc:'Quattro agenti cercano cibo, raccolgono materiali, costruiscono rifugi, comunicano, collaborano e competono.',localMode:'SIMULAZIONE LOCALE GRATUITA',liveMode:'LIVE · IL TUO POLLEN',next:'PROSSIMO TURNO IA',autoOff:'AUTO: OFF',autoOn:'AUTO: ON',worldReset:'RESETTA MONDO',liveDesc:'In modalità live un agente sceglie un’azione per turno. Nessuna chiamata parte prima di PROSSIMO TURNO IA o dell’attivazione di AUTO.',survivors:'SOPRAVVISSUTI',shelters:'RIFUGI',food:'CIBO',day:'GIORNO',turn:'TURNO'},
    ja:{kicker:'クエスト #19182 + #19177 · POLLINATIONS',intro:'MCPマルチプレイヤーエージェントと自律型サバイバルワールドの2つの連動モードです。どちらも無料のローカルモードを利用できます。ライブモデル呼び出しには明示的に許可したPollenのみを使用します。',outbreakTitle:'01 / ZOMBIE OUTBREAK — MCPアリーナ',outbreakDesc:'エージェントは生存者または感染者として参加します。MCPサーバーが各行動を検証し、共有ゲーム状態を管理します。',mcpStatus:'MCPサーバー：稼働中 · HTTPS',start:'ローカルマッチ開始',advance:'次のターン',reset:'リセット',ready:'ローカルデモの準備ができました。マルチプレイヤーMCPサーバーは公開済みです。接続方法はZOMBIECASH_AI_WORLDS.mdを参照してください。',mcpTools:'MCPツール：create_match、join_match、get_match_state、submit_action。不正な行動やなりすましはサーバー側で防止します。',worldTitle:'02 / ZOMBIE AI WORLD — 自律シミュレーション',worldDesc:'4体のエージェントが食料や資材を探し、シェルターを建設し、会話・協力・競争を行います。',localMode:'無料ローカルシミュレーション',liveMode:'ライブ · あなたのPollen',next:'AIの次のターン',autoOff:'自動：オフ',autoOn:'自動：オン',worldReset:'ワールドをリセット',liveDesc:'ライブモードでは各ターンに1体のエージェントが1つの行動を選びます。「AIの次のターン」または自動を押すまでモデル呼び出しは行いません。',survivors:'生存者',shelters:'シェルター',food:'食料',day:'日目',turn:'ターン'},
    'zh-CN':{kicker:'任务 #19182 + #19177 · POLLINATIONS',intro:'两个互相关联的模式：通过 MCP 进行多人智能体对战，以及自主生存世界。两者都提供免费本地模式。实时模型调用只使用你明确授权的 Pollen。',outbreakTitle:'01 / ZOMBIE OUTBREAK — MCP 竞技场',outbreakDesc:'智能体可作为幸存者或感染者加入。MCP 服务器验证每个行动并管理共享游戏状态。',mcpStatus:'MCP 服务器：已上线 · HTTPS',start:'开始本地对局',advance:'下一回合',reset:'重置',ready:'本地演示已就绪。多人 MCP 服务器已部署；连接说明见 ZOMBIECASH_AI_WORLDS.md。',mcpTools:'MCP 工具：create_match、join_match、get_match_state、submit_action。服务器会阻止非法行动和身份冒充。',worldTitle:'02 / ZOMBIE AI WORLD — 自主模拟',worldDesc:'四个智能体寻找食物、收集材料、建造避难所、交流、合作与竞争。',localMode:'免费本地模拟',liveMode:'实时 · 你的 Pollen',next:'下一次 AI 回合',autoOff:'自动：关闭',autoOn:'自动：开启',worldReset:'重置世界',liveDesc:'实时模式每回合由一个智能体选择一个行动。只有点击“下一次 AI 回合”或开启自动后才会调用模型。',survivors:'幸存者',shelters:'避难所',food:'食物',day:'第',turn:'回合'},
    tr:{kicker:'GÖREVLER #19182 + #19177 · POLLINATIONS',intro:'İki bağlantılı deneyim: MCP üzerinden çok oyunculu ajanlar ve otonom bir hayatta kalma dünyası. İkisinde de ücretsiz yerel mod vardır. Canlı model çağrıları yalnızca açıkça izin verdiğin Pollen’i kullanır.',outbreakTitle:'01 / ZOMBIE OUTBREAK — MCP ARENASI',outbreakDesc:'Ajanlar hayatta kalan veya enfekte olarak katılır. MCP sunucusu her hamleyi doğrular ve ortak oyun durumunu yönetir.',mcpStatus:'MCP SUNUCUSU: ÇEVRİMİÇİ · HTTPS',start:'YEREL MAÇI BAŞLAT',advance:'SONRAKİ TUR',reset:'SIFIRLA',ready:'Yerel demo hazır. Çok oyunculu MCP sunucusu dağıtıldı; bağlantı yönergeleri ZOMBIECASH_AI_WORLDS.md dosyasında.',mcpTools:'MCP araçları: create_match, join_match, get_match_state, submit_action. Sunucu yasa dışı hamleleri ve kimlik taklidini engeller.',worldTitle:'02 / ZOMBIE AI WORLD — OTONOM SİMÜLASYON',worldDesc:'Dört ajan yiyecek arar, malzeme toplar, sığınak kurar, konuşur, iş birliği yapar ve rekabet eder.',localMode:'ÜCRETSİZ YEREL SİMÜLASYON',liveMode:'CANLI · SENİN POLLEN’İN',next:'SONRAKİ AI TURU',autoOff:'OTOMATİK: KAPALI',autoOn:'OTOMATİK: AÇIK',worldReset:'DÜNYAYI SIFIRLA',liveDesc:'Canlı modda her tur bir ajan tek bir eylem seçer. SONRAKİ AI TURU’na basılmadan veya otomatik açılmadan model çağrısı yapılmaz.',survivors:'HAYATTA KALANLAR',shelters:'SIĞINAKLAR',food:'YİYECEK',day:'GÜN',turn:'TUR'},
    hi:{kicker:'क्वेस्ट #19182 + #19177 · POLLINATIONS',intro:'दो जुड़े अनुभव: MCP के ज़रिए मल्टीप्लेयर एजेंट और एक स्वायत्त सर्वाइवल दुनिया। दोनों में मुफ़्त लोकल मोड है। लाइव मॉडल कॉल केवल आपके स्पष्ट रूप से अधिकृत Pollen का उपयोग करते हैं।',outbreakTitle:'01 / ZOMBIE OUTBREAK — MCP एरीना',outbreakDesc:'एजेंट सर्वाइवर या संक्रमित बनकर जुड़ते हैं। MCP सर्वर हर चाल की जाँच करता है और साझा गेम स्थिति संभालता है।',mcpStatus:'MCP सर्वर: चालू · HTTPS',start:'लोकल मैच शुरू करें',advance:'अगली चाल',reset:'रीसेट',ready:'लोकल डेमो तैयार है। मल्टीप्लेयर MCP सर्वर तैनात है; कनेक्शन निर्देश ZOMBIECASH_AI_WORLDS.md में हैं।',mcpTools:'MCP टूल: create_match, join_match, get_match_state, submit_action। सर्वर गलत चालों और पहचान की नकल को रोकता है।',worldTitle:'02 / ZOMBIE AI WORLD — स्वायत्त सिमुलेशन',worldDesc:'चार एजेंट भोजन खोजते हैं, सामग्री जुटाते हैं, आश्रय बनाते हैं, बातचीत, सहयोग और प्रतिस्पर्धा करते हैं।',localMode:'मुफ़्त लोकल सिमुलेशन',liveMode:'लाइव · आपका Pollen',next:'अगली AI चाल',autoOff:'ऑटो: बंद',autoOn:'ऑटो: चालू',worldReset:'दुनिया रीसेट करें',liveDesc:'लाइव मोड में हर चाल पर एक एजेंट एक कार्रवाई चुनता है। अगली AI चाल दबाने या ऑटो चालू करने से पहले कोई मॉडल कॉल नहीं होती।',survivors:'सर्वाइवर',shelters:'आश्रय',food:'भोजन',day:'दिन',turn:'चाल'}
  };
  const locale = () => (copy[document.documentElement.lang] ? document.documentElement.lang : 'en');
  const L = key => copy[locale()][key] || copy.en[key] || key;
  function applyLocale() {
    const map = { 'zw-kicker':'kicker','zw-intro':'intro','zw-outbreak-title':'outbreakTitle','zw-outbreak-desc':'outbreakDesc','zw-mcp-status':'mcpStatus','zw-demo-start':'start','zw-demo-turn':'advance','zw-demo-reset':'reset','zw-outbreak-ready':'ready','zw-mcp-tools':'mcpTools','zw-world-title':'worldTitle','zw-world-desc':'worldDesc','zw-world-live-desc':'liveDesc','zw-next':'next','zw-world-reset':'worldReset' };
    Object.entries(map).forEach(([id,key]) => { const el=$(id); if(el) el.textContent=L(key); });
    $('zw-world-mode').textContent=userKey?L('liveMode'):L('localMode');
    $('zw-auto').textContent=auto?L('autoOn'):L('autoOff');
  }
  document.addEventListener('zombcash:languagechange', applyLocale);
  const feed = (id, text) => { const p=document.createElement('p'); p.textContent=text; $(id).prepend(p); };
  const connect = document.getElementById('zai-connect');
  let userKey = connect && connect.apiKey || null;
  if (connect) connect.addEventListener('change', () => {
    userKey = connect.apiKey || null;
    $('zw-world-mode').textContent = userKey ? L('liveMode') : L('localMode');
  });

  // Quest #19182 local demonstration; the hosted MCP server is available to external MCP agents at the endpoint above.
  const size=9, walls=new Set([10,19,28,37,46,55,64]), actors=[{id:'S1',role:'survivor',p:0},{id:'S2',role:'survivor',p:8},{id:'I1',role:'infected',p:72}];
  let outbreakTurn=0, outbreakStarted=false;
  const drawOutbreak=()=>{
    const map=$('zw-outbreak-map'); map.replaceChildren();
    for(let i=0;i<size*size;i++){
      const cell=document.createElement('div'); cell.className='zw-cell';
      const actor=actors.find(a=>a.p===i);
      cell.textContent=actor?(actor.role==='infected'?'🧟':'🧍'):walls.has(i)?'▥':'·';
      map.append(cell);
    }
  };
  const resetOutbreak=()=>{actors[0].p=0;actors[1].p=8;actors[2].p=72;outbreakTurn=0;outbreakStarted=false;$('zw-demo-turn').disabled=true;$('zw-mcp-status').textContent=L('mcpStatus');$('zw-outbreak-feed').replaceChildren();feed('zw-outbreak-feed',L('ready'));drawOutbreak();};
  $('zw-demo-start').addEventListener('click',()=>{outbreakStarted=true;$('zw-demo-turn').disabled=false;feed('zw-outbreak-feed',L('start')+': 2 survivors vs 1 infected.');});
  $('zw-demo-turn').addEventListener('click',()=>{
    if(!outbreakStarted)return;outbreakTurn++;
    for(const a of actors){const step=[-size,size,-1,1][(outbreakTurn+a.p)%4];const next=a.p+step;if(next>=0&&next<size*size&&!walls.has(next)&&Math.abs((next%size)-(a.p%size))<=1)a.p=next;}
    const s=actors.filter(a=>a.role==='survivor').map(a=>a.p).join(', ');
    feed('zw-outbreak-feed',L('advance')+' '+outbreakTurn+': '+s+'.');
    drawOutbreak();
  });
  $('zw-demo-reset').addEventListener('click',resetOutbreak);drawOutbreak();

  // Quest #19177 autonomous agents. The free simulation is deterministic and never calls the network.
  const initial=()=>[
    {name:'Mara',role:'scout',energy:8,food:3,wood:0,home:0},
    {name:'Viktor',role:'builder',energy:8,food:3,wood:2,home:0},
    {name:'Nix',role:'forager',energy:8,food:3,wood:1,home:0},
    {name:'Ash',role:'guard',energy:8,food:3,wood:0,home:0}
  ];
  let agents=initial(),turn=0,worldBusy=false,auto=false,autoTimer=null,food=12,logs=[];
  const worldLog=t=>{logs.unshift(t);logs=logs.slice(0,18);$('zw-world-feed').replaceChildren(...logs.map(s=>{const p=document.createElement('p');p.textContent=s;return p;}));};
  const renderWorld=()=>{
    $('zw-world-turn').textContent=L('day')+(locale()==='ja'?'':' ')+(Math.floor(turn/8)+1)+' · '+L('turn')+' '+turn;
    $('zw-pop').textContent=agents.length+' '+L('survivors');
    $('zw-shelter').textContent=agents.reduce((n,a)=>n+a.home,0)+' '+L('shelters');
    $('zw-food').textContent=food+' '+L('food');
  };
  const resetWorld=()=>{agents=initial();turn=0;food=12;logs=[];worldLog('The survivors wake in an abandoned district.');renderWorld();};
  function localAction(a){
    const options=['scout','forage','gather','build','talk','rest','guard'];
    const pick=options[(turn*7+a.name.length*3+a.energy)%options.length];
    return pick;
  }
  function applyAction(a,action,reason){
    const outcomes={
      scout:()=>{a.energy=Math.max(0,a.energy-1);worldLog(a.name+' scouts the ruins and marks a safe route.');},
      forage:()=>{a.energy=Math.max(0,a.energy-1);food+=2;worldLog(a.name+' finds edible supplies. +2 food.');},
      gather:()=>{a.energy=Math.max(0,a.energy-1);a.wood+=2;worldLog(a.name+' gathers timber. +2 wood.');},
      build:()=>{if(a.wood>=2&&a.energy>=2){a.wood-=2;a.energy-=2;a.home++;worldLog(a.name+' builds a shelter.');}else worldLog(a.name+' wants to build but lacks wood or energy.');},
      talk:()=>{a.energy=Math.min(10,a.energy+1);worldLog(a.name+' shares a warning with the group. Trust grows.');},
      rest:()=>{a.energy=Math.min(10,a.energy+2);worldLog(a.name+' rests and recovers energy.');},
      guard:()=>{a.energy=Math.max(0,a.energy-1);worldLog(a.name+' guards the camp through the night.');}
    };
    (outcomes[action]||outcomes.rest)();
    if(reason)worldLog('Thought: '+reason.slice(0,180));
  }
  async function liveAction(a){
    const response=await fetch('https://gen.pollinations.ai/v1/chat/completions',{
      method:'POST',headers:{'Authorization':'Bearer '+userKey,'Content-Type':'application/json'},
      body:JSON.stringify({model:$('zw-model').value,messages:[
        {role:'system',content:'You are '+a.name+', a '+a.role+' survivor in a zombie apocalypse simulation. Choose exactly one action: scout, forage, gather, build, talk, rest, guard. Consider your energy '+a.energy+'/10, food stock '+food+', wood '+a.wood+', shelters '+a.home+'. Return only JSON: {"action":"...","reason":"short reason"}. Do not invent other actions.'},
        {role:'user',content:'It is day '+(Math.floor(turn/8)+1)+', turn '+turn+'. What do you do now?'}
      ],temperature:0.4,max_tokens:120})
    });
    const data=await response.json();if(!response.ok)throw new Error(data.error?.message||'Pollinations request failed '+response.status);
    const raw=data.choices?.[0]?.message?.content||'';const match=raw.match(/\{[\s\S]*\}/);if(!match)throw new Error('Model did not return JSON');
    const parsed=JSON.parse(match[0]);const allowed=['scout','forage','gather','build','talk','rest','guard'];
    if(!allowed.includes(parsed.action))throw new Error('Unsupported action returned by model');
    return {action:parsed.action,reason:String(parsed.reason||'')};
  }
  async function nextTurn(){
    if(worldBusy)return;worldBusy=true;$('zw-next').disabled=true;$('zw-auto').disabled=true;
    const a=agents[turn%agents.length];
    try{
      const choice=userKey?await liveAction(a):{action:localAction(a),reason:''};
      applyAction(a,choice.action,choice.reason);turn++;
      if(turn%agents.length===0){food=Math.max(0,food-agents.length);agents.forEach(x=>{if(food===0)x.energy=Math.max(0,x.energy-1);});}
      renderWorld();
    }catch(e){worldLog('AI turn failed: '+e.message+'. No fallback action was applied.');}
    finally{worldBusy=false;$('zw-next').disabled=false;$('zw-auto').disabled=false;}
  }
  $('zw-next').addEventListener('click',nextTurn);
  $('zw-world-reset').addEventListener('click',()=>{if(auto){auto=false;clearInterval(autoTimer);$('zw-auto').textContent=L('autoOff');}resetWorld();});
  $('zw-auto').addEventListener('click',()=>{
    auto=!auto;$('zw-auto').textContent=auto?L('autoOn'):L('autoOff');
    if(auto)autoTimer=setInterval(()=>{if(!worldBusy)nextTurn();},3500);else clearInterval(autoTimer);
  });
  resetWorld();
  applyLocale();
})();

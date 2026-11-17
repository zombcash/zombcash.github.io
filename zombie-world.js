(() => {
  'use strict';
  const arena = document.getElementById('zombcash-ai-arena');
  if (!arena || document.getElementById('zombcash-outbreak-world')) return;
  const shell = document.createElement('section');
  shell.className = 'panel zai-arena';
  shell.id = 'zombcash-outbreak-world';
  shell.innerHTML = `
    <style>
      #zombcash-outbreak-world{margin:22px 0;padding:clamp(16px,3vw,30px)!important;border:1px solid #465c45!important;background:radial-gradient(ellipse at 10% 0,#203c32 0,transparent 48%),linear-gradient(145deg,#101a17,#090d12)!important}
      #zombcash-outbreak-world .zw-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
      #zombcash-outbreak-world .zw-card{border:1px solid #526b59;background:linear-gradient(155deg,#14251f,#0a1215);padding:clamp(13px,2vw,20px);min-width:0;box-shadow:0 12px 28px #0005}
      #zombcash-outbreak-world .zw-title{font:700 17px Orbitron,sans-serif;color:#b9ff72;margin:0 0 8px;text-shadow:0 0 18px #8cff6b35}
      #zombcash-outbreak-world .zw-muted{color:#bdc9c1;font-size:15px;line-height:1.5}
      #zombcash-outbreak-world .zw-endpoint{display:block;overflow-wrap:anywhere;color:#7ee8cf;font-size:12px;margin:4px 0 10px}
      #zombcash-outbreak-world .zw-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:12px 0}
      #zombcash-outbreak-world button,#zombcash-outbreak-world select{font:700 10px Orbitron,sans-serif;padding:10px 12px;border:1px solid #78d9a0;background:#12251d;color:#f0fff4;border-radius:5px}
      #zombcash-outbreak-world button.primary{background:linear-gradient(135deg,#c8ff73,#69e6a4);border-color:#c8ff73;color:#102016;box-shadow:0 0 18px #a6ff7130}
      #zombcash-outbreak-world button:hover:not(:disabled){filter:brightness(1.15);transform:translateY(-1px)}
      #zombcash-outbreak-world button:disabled{opacity:.45;cursor:not-allowed}
      #zombcash-outbreak-world .zw-map{display:grid;grid-template-columns:repeat(9,1fr);gap:4px;max-width:440px;margin:14px auto;padding:9px;border:1px solid #405d54;border-radius:10px;background:radial-gradient(circle at 50% 40%,#1b3732,#08110f)}
      #zombcash-outbreak-world .zw-cell{aspect-ratio:1;background:linear-gradient(145deg,#213d35,#142721);border:1px solid #416052;border-radius:5px;display:grid;place-items:center;font-size:clamp(13px,2vw,22px);box-shadow:inset 0 1px #ffffff12}
      #zombcash-outbreak-world .zw-cell.zw-wall{background:repeating-linear-gradient(135deg,#39464b,#39464b 5px,#27343b 5px,#27343b 10px);border-color:#75858b}
      #zombcash-outbreak-world .zw-cell.zw-exit{background:linear-gradient(145deg,#8affb4,#1b9b75);border-color:#c5ffe0;box-shadow:0 0 16px #51ffac80}
      #zombcash-outbreak-world .zw-legend{display:flex;gap:8px 14px;flex-wrap:wrap;justify-content:center;color:#d4e4d8;font-size:12px;margin:8px 0 14px}
      #zombcash-outbreak-world .zw-legend span{white-space:nowrap}
      #zombcash-outbreak-world .zw-objective{padding:11px 13px;margin:12px 0;border:1px solid #607b50;border-left:4px solid #c5f66b;border-radius:5px;background:#1b2a1d;color:#e7f5d9;font-size:14px;line-height:1.5}
      #zombcash-outbreak-world .zw-feed{height:160px;overflow:auto;background:linear-gradient(180deg,#08120f,#0b151a);border:1px solid #3a5b50;border-radius:6px;padding:10px;font-size:14px}
      #zombcash-outbreak-world .zw-feed p{margin:5px 0;padding:5px 7px;border-radius:4px;background:#ffffff08;color:#d6e7dc}
      #zombcash-outbreak-world .zw-stat{font:700 11px Orbitron,sans-serif;color:#baff7b;background:#172b21;border:1px solid #41694b;border-radius:5px;padding:7px 9px}
      #zombcash-outbreak-world .zw-world-meter{height:9px;border-radius:9px;background:#253b34;overflow:hidden;margin:8px 0 12px}
      #zombcash-outbreak-world .zw-world-meter i{display:block;height:100%;width:50%;background:linear-gradient(90deg,#67d8bb,#c5ff72);transition:width .25s}
      #zombcash-outbreak-world .zw-agent-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:12px 0}
      #zombcash-outbreak-world .zw-agent{padding:9px;border:1px solid #3b5a4a;border-radius:5px;background:#102019;color:#e8f5e8;font-size:12px}
      #zombcash-outbreak-world .zw-agent b{color:#c9ff8c}
      #zombcash-outbreak-world .zw-card{border-radius:14px;position:relative;overflow:hidden}
      #zombcash-outbreak-world .zw-card:first-child{background:radial-gradient(circle at 85% 8%,#3c4f78 0,transparent 32%),linear-gradient(150deg,#172c3c,#101b25 65%,#111a1c)}
      #zombcash-outbreak-world .zw-card:last-child{background:radial-gradient(circle at 90% 5%,#5b3b68 0,transparent 34%),linear-gradient(150deg,#263348,#15212b 65%,#10231e)}
      #zombcash-outbreak-world .zw-title{color:#d6ff8c;font-size:clamp(16px,1.6vw,20px)}
      #zombcash-outbreak-world .zw-objective{border-radius:9px;background:linear-gradient(110deg,#243e37,#29324b);border-color:#8bcf91;color:#f3ffe8;box-shadow:inset 0 0 24px #8dffad12}
      #zombcash-outbreak-world .zw-map{gap:5px;padding:10px;background:linear-gradient(145deg,#101e2b,#182a27);border:1px solid #6a8a83;border-radius:13px}
      #zombcash-outbreak-world .zw-cell{border-radius:7px;background:linear-gradient(145deg,#294b50,#1c343b);border-color:#537b79;color:#eafff2;font-weight:800;transition:transform .15s,filter .15s}
      #zombcash-outbreak-world .zw-cell:not(.zw-wall):not(.zw-exit){background:linear-gradient(145deg,#315b54,#24423d)}
      #zombcash-outbreak-world .zw-cell.zw-wall{background:linear-gradient(145deg,#68758a,#38485d);border-color:#aebbd0;color:#fff}
      #zombcash-outbreak-world .zw-cell.zw-exit{background:radial-gradient(circle,#f7ffbd,#7cf5ad 58%,#238d80);border-color:#eaffd7;color:#102b28;box-shadow:0 0 18px #6effb8a0}
      #zombcash-outbreak-world .zw-cell.zw-survivor{background:linear-gradient(145deg,#4d8df0,#3456a2);border-color:#a9d3ff;box-shadow:0 0 14px #4c91ff70}
      #zombcash-outbreak-world .zw-cell.zw-infected{background:linear-gradient(145deg,#f16d82,#8f2c55);border-color:#ffc1c9;box-shadow:0 0 16px #ff547b85;animation:zw-pulse 1.5s infinite}
      #zombcash-outbreak-world .zw-legend{font-size:13px;gap:8px}
      #zombcash-outbreak-world .zw-legend span{padding:6px 9px;border-radius:20px;background:#ffffff12;border:1px solid #ffffff20}
      #zombcash-outbreak-world .zw-stat{border-radius:20px;background:linear-gradient(120deg,#243b50,#263d34);border-color:#638d83;color:#e7ffbd}
      #zombcash-outbreak-world #zw-command{min-width:210px;max-width:100%;background:linear-gradient(145deg,#263b50,#182a36);border-color:#9bd4ae;color:#fff}
      #zombcash-outbreak-world #zw-command-hint{padding:8px 11px;border-left:3px solid #a9ed8c;background:#ffffff09;border-radius:6px}
      #zombcash-outbreak-world .zw-agent{border-radius:10px;background:linear-gradient(145deg,#1b3544,#1a302d);border-color:#5d8e91;padding:11px;box-shadow:inset 0 0 18px #8df9d20a}
      #zombcash-outbreak-world .zw-agent:nth-child(2){border-color:#d2a36d}
      #zombcash-outbreak-world .zw-agent:nth-child(3){border-color:#7cc7a2}
      #zombcash-outbreak-world .zw-agent:nth-child(4){border-color:#b18be1}
      #zombcash-outbreak-world .zw-agent b{color:#f0ffb7}
      #zombcash-outbreak-world .zw-world-meter{height:12px;border:1px solid #668b7d}
      #zombcash-outbreak-world .zw-world-meter i{background:linear-gradient(90deg,#ff806d,#f8d66d,#7df3a4)}
      #zombcash-outbreak-world .zw-settlement{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin:12px 0}
      #zombcash-outbreak-world .zw-site{min-height:68px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border:1px solid #668b86;border-radius:10px;background:linear-gradient(145deg,#30485a,#1a3332);font-size:23px;box-shadow:inset 0 0 16px #b4ffd20b}
      #zombcash-outbreak-world .zw-site small{font:700 9px Orbitron,sans-serif;color:#d9f6d9;letter-spacing:.04em}
      #zombcash-outbreak-world .zw-site.is-active{border-color:#a9ed8c;background:linear-gradient(145deg,#42684c,#24463b);box-shadow:0 0 12px #8dff9250}
      #zombcash-outbreak-world .zw-site.is-danger{border-color:#ff8294;background:linear-gradient(145deg,#70394f,#3a2639);box-shadow:0 0 12px #ff647550}
      #zombcash-outbreak-world .zw-feed{border-radius:10px;background:linear-gradient(180deg,#101c29,#0b1718);border-color:#547a78}
      #zombcash-outbreak-world button,#zombcash-outbreak-world select{border-radius:8px;font-size:11px}
      @keyframes zw-pulse{50%{filter:brightness(1.3);transform:scale(.96)}}
      @media(max-width:700px){#zombcash-outbreak-world .zw-grid{grid-template-columns:1fr}#zombcash-outbreak-world .zw-map{max-width:100%}}
    </style>
    <div class="kicker" id="zw-kicker">QUEST #19182 + #19177 · POLLINATIONS</div>
    <h2 class="zw-title" id="zw-main-title">ZOMBIE OUTBREAK &amp; AI WORLD</h2>
    <p class="zw-muted" id="zw-intro">Two connected experiments: multiplayer agents over MCP, and an autonomous survival world. Both include a free local mode. Live model calls use the Pollen you explicitly authorize above.</p>
    <div class="zw-grid">
      <article class="zw-card" aria-labelledby="zw-outbreak-title">
        <h3 class="zw-title" id="zw-outbreak-title">01 / ZOMBIE OUTBREAK — MCP ARENA</h3>
        <p class="zw-muted" id="zw-outbreak-desc">Agents join as survivors or infected. The MCP server validates every move and owns the shared game state.</p>
        <div class="zw-objective" id="zw-outbreak-objective">MISSION: escort both survivors to the glowing extraction tile. The infected hunts them. Escape together to win; lose both survivors and the outbreak wins.</div>
        <div class="zw-row"><span class="zw-stat" id="zw-mcp-status">MCP SERVER: DEPLOYED · HTTPS</span></div>
        <a class="zw-endpoint" id="zw-mcp-endpoint" href="https://owmiywvmtdjyeyfxlpdp.supabase.co/functions/v1/outbreak-mcp" target="_blank" rel="noopener noreferrer">https://owmiywvmtdjyeyfxlpdp.supabase.co/functions/v1/outbreak-mcp</a>
        <p class="zw-muted"><a href="https://pollinations.ai/?ref=badge" target="_blank" rel="noopener noreferrer">Made with pollinations.ai</a></p>
        <div class="zw-row">
          <button class="primary" id="zw-demo-start" type="button">START LOCAL MATCH</button>
          <button id="zw-demo-turn" type="button" disabled>ADVANCE TURN</button>
          <button id="zw-demo-reset" type="button">RESET</button>
        </div>
        <div class="zw-legend" id="zw-outbreak-legend"><span>🧍 Survivor</span><span>🧟 Infected</span><span>🟩 Extraction</span><span>▥ Ruins</span></div>
        <div class="zw-map" id="zw-outbreak-map" aria-label="Local outbreak game board"></div>
        <div class="zw-row"><span class="zw-stat" id="zw-escaped">0 / 2 ESCAPED</span><span class="zw-stat" id="zw-captured">0 CAPTURED</span><span class="zw-stat" id="zw-outbreak-turns">TURN 0</span></div>
        <div class="zw-feed" id="zw-outbreak-feed" aria-live="polite"><p id="zw-outbreak-ready">Local demo is ready. The shared multiplayer MCP endpoint is deployed; connect an MCP client using the instructions in ZOMBIECASH_AI_WORLDS.md.</p></div>
        <p class="zw-muted" id="zw-mcp-tools">MCP tools: create_match, join_match, get_match_state, submit_action. Server-side validation prevents illegal moves and impersonation.</p>
      </article>
      <article class="zw-card" aria-labelledby="zw-world-title">
        <h3 class="zw-title" id="zw-world-title">02 / ZOMBIE AI WORLD — AUTONOMOUS SIM</h3>
        <p class="zw-muted" id="zw-world-desc">Four agents seek food, gather materials, build shelter, talk, cooperate and compete. No scripted story is required.</p>
        <div class="zw-objective" id="zw-world-objective">7-DAY SURVIVAL: keep food stocked, restore energy, build at least 2 shelters and keep danger under control. Every fourth action ends a day.</div>
        <div class="zw-row"><span class="zw-stat" id="zw-world-mode">FREE LOCAL SIMULATION</span><span class="zw-stat" id="zw-world-turn">DAY 1 · TURN 0</span></div>
        <div class="zw-row">
          <label for="zw-model">LIVE MODEL</label>
          <select id="zw-model"><option value="openai">openai</option><option value="openai-fast">openai-fast</option><option value="mistral">mistral</option></select>
          <label for="zw-command">YOUR ORDER</label>
          <select id="zw-command" aria-label="Choose the next survivor action">
            <option value="auto">Let the survivor decide</option>
            <option value="forage">🥫 Forage for food</option>
            <option value="gather">🪵 Gather timber</option>
            <option value="build">🛖 Build a shelter</option>
            <option value="scout">🧭 Scout safe routes</option>
            <option value="guard">🛡️ Guard the camp</option>
            <option value="rest">🛏️ Rest and recover</option>
            <option value="talk">💬 Rally the crew</option>
          </select>
          <button class="primary" id="zw-next" type="button">NEXT AI TURN</button>
          <button id="zw-auto" type="button">AUTO: OFF</button>
          <button id="zw-world-reset" type="button">RESET WORLD</button>
        </div>
        <div class="zw-row"><span class="zw-stat" id="zw-pop">4 SURVIVORS</span><span class="zw-stat" id="zw-shelter">0 SHELTERS</span><span class="zw-stat" id="zw-food">12 FOOD</span><span class="zw-stat" id="zw-danger">DANGER 1</span></div>
        <p class="zw-muted" id="zw-command-hint">Choose an order before the next turn to override the active survivor's decision. AUTO lets the crew decide.</p>
        <div class="zw-world-meter" aria-label="Survival energy"><i id="zw-energy-meter"></i></div>
        <div class="zw-settlement" id="zw-settlement" aria-label="Settlement status">
          <div class="zw-site zw-site-camp" id="zw-site-camp">🏕️<small>BASE</small></div>
          <div class="zw-site" id="zw-site-food">🥫<small>FOOD</small></div>
          <div class="zw-site" id="zw-site-danger">🌫️<small>OUTSKIRTS</small></div>
          <div class="zw-site" id="zw-site-shelter-1">🛖<small>SHELTER 1</small></div>
          <div class="zw-site" id="zw-site-shelter-2">🛖<small>SHELTER 2</small></div>
        </div>
        <div class="zw-objective" id="zw-expedition-title">🧭 DISTRICT EXPEDITION · Search abandoned sites for supplies and survivors.</div>
        <div class="zw-row"><span class="zw-stat" id="zw-expedition-progress">0 / 5 SITES SEARCHED</span><span class="zw-stat" id="zw-expedition-loot">0 LOOT FOUND</span></div>
        <div class="zw-row"><button id="zw-explore" type="button">EXPLORE NEXT DISTRICT</button><span class="zw-muted" id="zw-expedition-hint">Exploring costs 2 energy. Each site is searched once; events can help or hurt the crew.</span></div>
        <div class="zw-agent-cards" id="zw-agent-cards"></div>
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
  const extraCopy={
    en:{outObjective:'MISSION: escort both survivors to the glowing extraction tile. The infected hunts them. Escape together to win; lose both survivors and the outbreak wins.',worldObjective:'7-DAY SURVIVAL: keep food stocked, restore energy, build at least 2 shelters and keep danger under control. Every fourth action ends a day.',legend:'🧍 Survivor   🧟 Infected   🚁 Extraction   ▥ Ruins',escaped:'ESCAPED',captured:'CAPTURED',turnLabel:'TURN',missionStart:'🚨 EXTRACTION MISSION STARTED — both survivors must reach the helicopter.',survivorEscaped:'🟢 {name} reached extraction!',survivorCaught:'☠️ {name} was caught by the infected!',infectedHunts:'🧟 The infected tracks {name} through the ruins.',missionWon:'🏆 EXTRACTION COMPLETE — both survivors escaped. YOU WIN!',missionLost:'💀 OUTBREAK OVERRUN — both survivors were lost.',missionTimeout:'⏱ EXTRACTION WINDOW CLOSED — mission failed.',worldStart:'🌅 DAY 1 — The crew reaches an abandoned district. Goal: survive seven days and build two shelters.',worldLost:'💀 SETTLEMENT LOST — the crew ran out of supplies or strength. Reset and plan better.',worldWon:'🏆 SEVEN DAYS SURVIVED — two shelters secured. THE CREW LIVES!',worldPartial:'⚠️ SEVEN DAYS SURVIVED, BUT THE SETTLEMENT IS EXPOSED. Build at least two shelters next run for a full victory.'},
    ru:{outObjective:'МИССИЯ: доведи обоих выживших до точки эвакуации. Заражённый охотится на них. Оба спасены — победа; оба пойманы — поражение.',worldObjective:'ВЫЖИВИ 7 ДНЕЙ: пополняй еду, восстанавливай энергию, построй минимум 2 убежища и сдерживай опасность. Каждые 4 действия заканчивают день.',legend:'🧍 Выживший   🧟 Заражённый   🚁 Эвакуация   ▥ Руины',escaped:'СПАСЕНО',captured:'ПОЙМАНО',turnLabel:'ХОД',missionStart:'🚨 ЭВАКУАЦИЯ НАЧАЛАСЬ — оба выживших должны добраться до вертолёта.',survivorEscaped:'🟢 {name} добрался до эвакуации!',survivorCaught:'☠️ {name} пойман заражённым!',infectedHunts:'🧟 Заражённый преследует {name} среди руин.',missionWon:'🏆 ЭВАКУАЦИЯ ЗАВЕРШЕНА — оба выживших спасены. ПОБЕДА!',missionLost:'💀 ЗАРАЖЕНИЕ ПОБЕДИЛО — оба выживших потеряны.',missionTimeout:'⏱ ВРЕМЯ ЭВАКУАЦИИ ИСТЕКЛО — миссия провалена.',worldStart:'🌅 ДЕНЬ 1 — команда входит в заброшенный район. Цель: продержаться 7 дней и построить два убежища.',worldLost:'💀 ПОСЕЛЕНИЕ ПОГИБЛО — закончились припасы или силы. Начни заново и измени стратегию.',worldWon:'🏆 СЕМЬ ДНЕЙ ПОЗАДИ — два убежища построены. КОМАНДА ВЫЖИЛА!',worldPartial:'⚠️ Семь дней пройдены, но поселение без защиты. Для полной победы построй минимум два убежища.'},
    de:{outObjective:'MISSION: Bringe beide Überlebenden zum Evakuierungspunkt. Der Infizierte jagt sie. Gemeinsam entkommen bedeutet Sieg.',worldObjective:'7 TAGE ÜBERLEBEN: Nahrung sichern, Energie regenerieren, mindestens 2 Schutzräume bauen und die Gefahr kontrollieren. Vier Aktionen ergeben einen Tag.',legend:'🧍 Überlebender   🧟 Infizierter   🚁 Evakuierung   ▥ Ruinen',escaped:'ENTKOMMEN',captured:'ERWISCHT',turnLabel:'ZUG'},
    fr:{outObjective:'MISSION : escortez les deux survivants jusqu’à l’extraction. L’infecté les traque. Les deux s’échappent : victoire.',worldObjective:'SURVIVRE 7 JOURS : garder des vivres, récupérer de l’énergie, construire 2 abris minimum et maîtriser le danger. Quatre actions terminent une journée.',legend:'🧍 Survivant   🧟 Infecté   🚁 Extraction   ▥ Ruines',escaped:'ÉVADÉS',captured:'CAPTURÉS',turnLabel:'TOUR'},
    it:{outObjective:'MISSIONE: accompagna entrambi i sopravvissuti al punto di estrazione. L’infetto li caccia. Se scappano entrambi, vinci.',worldObjective:'SOPRAVVIVI 7 GIORNI: fai scorta di cibo, recupera energia, costruisci almeno 2 rifugi e controlla il pericolo. Quattro azioni completano un giorno.',legend:'🧍 Sopravvissuto   🧟 Infetto   🚁 Estrazione   ▥ Rovine',escaped:'SALVATI',captured:'CATTURATI',turnLabel:'TURNO'},
    ja:{outObjective:'ミッション：2人の生存者を脱出地点まで導こう。感染者が追跡する。2人とも脱出すれば勝利。',worldObjective:'7日間生き延びよう：食料を確保し、体力を回復し、避難所を2つ以上建設して危険を抑える。4アクションで1日終了。',legend:'🧍 生存者   🧟 感染者   🚁 脱出地点   ▥ 廃墟',escaped:'脱出',captured:'捕獲',turnLabel:'ターン'},
    'zh-CN':{outObjective:'任务：护送两名幸存者到达撤离点。感染者会追捕他们。两人都逃脱即可获胜。',worldObjective:'生存7天：储备食物、恢复体力、建造至少2座避难所并控制危险。每4个行动结束一天。',legend:'🧍 幸存者   🧟 感染者   🚁 撤离点   ▥ 废墟',escaped:'已撤离',captured:'已被抓',turnLabel:'回合'},
    tr:{outObjective:'GÖREV: iki hayatta kalanı tahliye noktasına ulaştır. Enfekte onları avlıyor. İkisi de kaçarsa kazanırsın.',worldObjective:'7 GÜN HAYATTA KAL: yiyecek stokla, enerjiyi yenile, en az 2 sığınak kur ve tehlikeyi kontrol et. Dört eylem bir günü tamamlar.',legend:'🧍 Hayatta kalan   🧟 Enfekte   🚁 Tahliye   ▥ Harabe',escaped:'KURTULDU',captured:'YAKALANDI',turnLabel:'TUR'},
    hi:{outObjective:'मिशन: दोनों सर्वाइवर को निकासी स्थल तक पहुँचाएँ। संक्रमित उनका पीछा करता है। दोनों बच गए तो जीत।',worldObjective:'7 दिन जीवित रहें: भोजन जमा करें, ऊर्जा लौटाएँ, कम से कम 2 आश्रय बनाएँ और खतरे को नियंत्रित रखें। हर 4 चालों में एक दिन पूरा होता है।',legend:'🧍 सर्वाइवर   🧟 संक्रमित   🚁 निकासी   ▥ खंडहर',escaped:'बच निकले',captured:'पकड़े गए',turnLabel:'चाल'}
  };
  Object.entries(extraCopy).forEach(([language,values])=>Object.assign(copy[language]||(copy[language]={}),values));
  const expeditionCopy = {
    en:{expeditionTitle:'🧭 DISTRICT EXPEDITION · Search abandoned sites for supplies and survivors.',explore:'EXPLORE NEXT DISTRICT',expeditionHint:'Exploring costs 2 energy. Each site is searched once; events can help or hurt the crew.',sites:'SITES SEARCHED',loot:'LOOT FOUND',expeditionDone:'All five districts have been searched.',expeditionNeedEnergy:'Not enough energy to explore. Rest first.',eventCache:'📦 Supply cache found: +3 food and +2 timber.',eventAmbush:'🧟 Ambush! Danger +2 and {name} loses 2 energy.',eventSurvivor:'🧍 A stranded survivor joins the crew. Meet June, a medic.',eventNothing:'🌫️ The site is empty, but the route is mapped. Danger −1.'},
    ru:{expeditionTitle:'🧭 РАЗВЕДКА РАЙОНОВ · Ищи припасы и выживших в заброшенных местах.',explore:'ИССЛЕДОВАТЬ РАЙОН',expeditionHint:'Разведка стоит 2 энергии. Каждый район исследуется один раз; события могут помочь или навредить.',sites:'РАЙОНОВ ИЗУЧЕНО',loot:'ПРИПАСОВ НАЙДЕНО',expeditionDone:'Все пять районов исследованы.',expeditionNeedEnergy:'Недостаточно энергии для разведки. Сначала отдохни.',eventCache:'📦 Найден тайник: +3 еды и +2 древесины.',eventAmbush:'🧟 Засада! Опасность +2, {name} теряет 2 энергии.',eventSurvivor:'🧍 К отряду присоединяется выжившая Джун, медик.',eventNothing:'🌫️ Район пуст, но маршрут нанесён на карту. Опасность −1.'},
    de:{expeditionTitle:'🧭 GEBIETSERKUNDUNG · Suche verlassene Orte nach Vorräten und Überlebenden ab.',explore:'NÄCHSTES GEBIET ERKUNDEN',expeditionHint:'Erkundung kostet 2 Energie. Jeder Ort wird einmal durchsucht; Ereignisse können helfen oder schaden.',sites:'ORTE ERKUNDET',loot:'BEUTE GEFUNDEN',expeditionDone:'Alle fünf Gebiete wurden durchsucht.',expeditionNeedEnergy:'Nicht genug Energie. Ruhe dich zuerst aus.',eventCache:'📦 Vorratslager gefunden: +3 Nahrung und +2 Holz.',eventAmbush:'🧟 Hinterhalt! Gefahr +2 und {name} verliert 2 Energie.',eventSurvivor:'🧍 Die Überlebende June, eine Sanitäterin, schließt sich an.',eventNothing:'🌫️ Der Ort ist leer, aber die Route ist kartiert. Gefahr −1.'},
    fr:{expeditionTitle:'🧭 EXPLORATION · Fouillez les lieux abandonnés pour trouver vivres et survivants.',explore:'EXPLORER LE PROCHAIN SECTEUR',expeditionHint:'Explorer coûte 2 énergie. Chaque lieu est fouillé une fois ; les événements peuvent aider ou nuire.',sites:'LIEUX EXPLORÉS',loot:'BUTIN TROUVÉ',expeditionDone:'Les cinq secteurs ont été fouillés.',expeditionNeedEnergy:'Énergie insuffisante. Reposez-vous d’abord.',eventCache:'📦 Réserve trouvée : +3 nourriture et +2 bois.',eventAmbush:'🧟 Embuscade ! Danger +2 et {name} perd 2 énergie.',eventSurvivor:'🧍 June, une infirmière, rejoint le groupe.',eventNothing:'🌫️ Le lieu est vide, mais la route est cartographiée. Danger −1.'},
    it:{expeditionTitle:'🧭 ESPLORAZIONE · Cerca provviste e sopravvissuti negli edifici abbandonati.',explore:'ESPLORA IL PROSSIMO DISTRETTO',expeditionHint:'Esplorare costa 2 energia. Ogni luogo si visita una volta; gli eventi possono aiutare o danneggiare.',sites:'LUOGHI ESPLORATI',loot:'BOTTINO TROVATO',expeditionDone:'Tutti e cinque i distretti sono stati esplorati.',expeditionNeedEnergy:'Energia insufficiente. Riposati prima.',eventCache:'📦 Scorta trovata: +3 cibo e +2 legname.',eventAmbush:'🧟 Agguato! Pericolo +2 e {name} perde 2 energia.',eventSurvivor:'🧍 June, una medica, si unisce al gruppo.',eventNothing:'🌫️ Il luogo è vuoto, ma il percorso è mappato. Pericolo −1.'},
    ja:{expeditionTitle:'🧭 地区探索 · 廃墟を調べて物資と生存者を探そう。',explore:'次の地区を探索',expeditionHint:'探索にはエネルギー2が必要。各地点は一度だけ調査でき、イベントは助けにも脅威にもなる。',sites:'探索済み地点',loot:'発見した物資',expeditionDone:'5つすべての地区を探索した。',expeditionNeedEnergy:'探索するエネルギーが足りない。先に休もう。',eventCache:'📦 物資発見：食料+3、木材+2。',eventAmbush:'🧟 待ち伏せ！危険度+2、{name}のエネルギー-2。',eventSurvivor:'🧍 医療担当の生存者ジューンが仲間に加わった。',eventNothing:'🌫️ 何もないが、経路を地図に記録した。危険度-1。'},
    'zh-CN':{expeditionTitle:'🧭 区域探索 · 搜索废弃地点，寻找物资和幸存者。',explore:'探索下一个区域',expeditionHint:'探索消耗2点能量。每个地点只能搜索一次；随机事件可能带来帮助或危险。',sites:'已搜索地点',loot:'发现物资',expeditionDone:'五个区域均已搜索。',expeditionNeedEnergy:'能量不足，先休息。',eventCache:'📦 找到补给箱：食物+3，木材+2。',eventAmbush:'🧟 遭遇伏击！危险度+2，{name}能量-2。',eventSurvivor:'🧍 医护幸存者June加入队伍。',eventNothing:'🌫️ 地点空无一物，但路线已标记。危险度-1。'},
    tr:{expeditionTitle:'🧭 BÖLGE KEŞFİ · Terk edilmiş yerlerde erzak ve hayatta kalanları ara.',explore:'SONRAKİ BÖLGEYİ KEŞFET',expeditionHint:'Keşif 2 enerji harcar. Her yer bir kez aranır; olaylar ekibe yardım edebilir veya zarar verebilir.',sites:'ARAMA YAPILAN YER',loot:'BULUNAN GANİMET',expeditionDone:'Beş bölgenin tamamı arandı.',expeditionNeedEnergy:'Keşif için enerji yetersiz. Önce dinlen.',eventCache:'📦 Erzak bulundu: +3 yiyecek ve +2 kereste.',eventAmbush:'🧟 Pusu! Tehlike +2 ve {name} 2 enerji kaybeder.',eventSurvivor:'🧍 Sağlık görevlisi June ekibe katıldı.',eventNothing:'🌫️ Yer boş, ancak rota haritaya işlendi. Tehlike −1.'},
    hi:{expeditionTitle:'🧭 जिला खोज · आपूर्ति और बचे लोगों के लिए छोड़ी गई जगहों की तलाशी लें।',explore:'अगला जिला खोजें',expeditionHint:'खोज में 2 ऊर्जा लगती है। हर स्थान एक बार खोजा जाता है; घटनाएँ मदद या नुकसान कर सकती हैं।',sites:'खोजे गए स्थान',loot:'मिली सामग्री',expeditionDone:'सभी पाँच जिलों की तलाशी हो गई।',expeditionNeedEnergy:'खोज के लिए ऊर्जा कम है। पहले आराम करें।',eventCache:'📦 आपूर्ति मिली: भोजन +3 और लकड़ी +2।',eventAmbush:'🧟 घात! खतरा +2 और {name} की ऊर्जा −2।',eventSurvivor:'🧍 चिकित्सक June दल में शामिल हुई।',eventNothing:'🌫️ जगह खाली है, लेकिन रास्ता मानचित्र पर दर्ज है। खतरा −1।'}
  };
  Object.entries(expeditionCopy).forEach(([language,values])=>Object.assign(copy[language]||(copy[language]={}),values));
  const locale = () => (copy[document.documentElement.lang] ? document.documentElement.lang : 'en');
  const L = key => copy[locale()][key] || copy.en[key] || key;
  function applyLocale() {
    const map = { 'zw-kicker':'kicker','zw-intro':'intro','zw-outbreak-title':'outbreakTitle','zw-outbreak-desc':'outbreakDesc','zw-mcp-status':'mcpStatus','zw-demo-start':'start','zw-demo-turn':'advance','zw-demo-reset':'reset','zw-outbreak-ready':'ready','zw-mcp-tools':'mcpTools','zw-world-title':'worldTitle','zw-world-desc':'worldDesc','zw-world-live-desc':'liveDesc','zw-next':'next','zw-world-reset':'worldReset','zw-outbreak-objective':'outObjective','zw-world-objective':'worldObjective' };
    Object.entries(map).forEach(([id,key]) => { const el=$(id); if(el) el.textContent=L(key); });
    $('zw-world-mode').textContent=userKey?L('liveMode'):L('localMode');
    $('zw-auto').textContent=auto?L('autoOn'):L('autoOff');
    $('zw-outbreak-legend').textContent=L('legend');
    paintOutbreakStats();
    renderExpedition();
  }
  document.addEventListener('zombcash:languagechange', applyLocale);
  const feed = (id, text) => { const p=document.createElement('p'); p.textContent=text; $(id).prepend(p); };
  const connect = document.getElementById('zai-connect');
  let userKey = connect && connect.apiKey || null;
  if (connect) connect.addEventListener('change', () => {
    userKey = connect.apiKey || null;
    $('zw-world-mode').textContent = userKey ? L('liveMode') : L('localMode');
  });

  // Local outbreak: survivors must reach extraction while the infected hunts them.
  const size=9, walls=new Set([10,19,28,37,46,55,64]), actors=[{id:'S1',name:'Mara',role:'survivor',p:0},{id:'S2',name:'Viktor',role:'survivor',p:8},{id:'I1',name:'Stalker',role:'infected',p:72}];
  const exitTile=80;
  let outbreakTurn=0,outbreakStarted=false,escaped=0,captured=0,outbreakEnded=false;
  function pathStep(from,to){
    const queue=[[from,[]]],seen=new Set([from]);
    while(queue.length){const [at,path]=queue.shift();if(at===to)return path[0]??from;
      const x=at%size,y=Math.floor(at/size);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,np=ny*size+nx;if(nx<0||nx>=size||ny<0||ny>=size||walls.has(np)||seen.has(np))continue;seen.add(np);queue.push([np,[...path,np]])}
    }return from;
  }
  const paintOutbreakStats=()=>{$('zw-escaped').textContent=escaped+' / 2 '+L('escaped');$('zw-captured').textContent=captured+' '+L('captured');$('zw-outbreak-turns').textContent=L('turnLabel')+' '+outbreakTurn;};
  const drawOutbreak=()=>{
    const map=$('zw-outbreak-map');map.replaceChildren();
    for(let i=0;i<size*size;i++){
      const cell=document.createElement('div');cell.className='zw-cell';
      const actor=actors.find(a=>a.p===i&&a.role!=='escaped'&&a.role!=='captured');
      if(actor){cell.classList.add(actor.role==='infected'?'zw-infected':'zw-survivor');cell.textContent=actor.role==='infected'?'🧟':'🧍';cell.title=actor.name+(actor.role==='infected'?' · infected':' · survivor')}
      else if(i===exitTile){cell.classList.add('zw-exit');cell.textContent='🚁';cell.title='Extraction point'}
      else if(walls.has(i)){cell.classList.add('zw-wall');cell.textContent='🧱';cell.title='Blocked ruins'}
      else {cell.textContent='';cell.title='Safe street'}
      map.append(cell);
    }paintOutbreakStats();
  };
  const resetOutbreak=()=>{
    actors[0].p=0;actors[0].role='survivor';actors[1].p=8;actors[1].role='survivor';actors[2].p=72;actors[2].role='infected';
    outbreakTurn=0;escaped=0;captured=0;outbreakStarted=false;outbreakEnded=false;
    $('zw-demo-turn').disabled=true;$('zw-mcp-status').textContent=L('mcpStatus');
    $('zw-outbreak-feed').replaceChildren();feed('zw-outbreak-feed','Mission ready: guide both survivors to the helicopter. The infected moves after them.');drawOutbreak();
  };
  $('zw-demo-start').addEventListener('click',()=>{if(outbreakEnded)resetOutbreak();outbreakStarted=true;$('zw-demo-turn').disabled=false;feed('zw-outbreak-feed',L('missionStart'));});
  $('zw-demo-turn').addEventListener('click',()=>{
    if(!outbreakStarted||outbreakEnded)return;outbreakTurn++;
    for(const survivor of actors.filter(a=>a.role==='survivor')){
      const next=pathStep(survivor.p,exitTile);if(next===survivor.p)continue;
      survivor.p=next;
      if(survivor.p===exitTile){survivor.role='escaped';escaped++;feed('zw-outbreak-feed',L('survivorEscaped').replace('{name}',survivor.name));}
    }
    const hunter=actors.find(a=>a.role==='infected');
    if(hunter){const targets=actors.filter(a=>a.role==='survivor');if(targets.length){targets.sort((a,b)=>Math.abs(a.p%size-hunter.p%size)+Math.abs(Math.floor(a.p/size)-Math.floor(hunter.p/size))-(Math.abs(b.p%size-hunter.p%size)+Math.abs(Math.floor(b.p/size)-Math.floor(hunter.p/size))));const target=targets[0];hunter.p=pathStep(hunter.p,target.p);if(hunter.p===target.p){target.role='captured';captured++;feed('zw-outbreak-feed',L('survivorCaught').replace('{name}',target.name));}else feed('zw-outbreak-feed',L('infectedHunts').replace('{name}',target.name));}}
    if(escaped===2){outbreakEnded=true;feed('zw-outbreak-feed',L('missionWon'));}
    else if(captured===2||outbreakTurn>=18){outbreakEnded=true;feed('zw-outbreak-feed',captured===2?L('missionLost'):L('missionTimeout'));}
    if(outbreakEnded)$('zw-demo-turn').disabled=true;
    drawOutbreak();
  });
  $('zw-demo-reset').addEventListener('click',resetOutbreak);resetOutbreak();

  // Seven-day survival campaign. Every action changes shared resources and the settlement's fate.
  const initial=()=>[
    {name:'Mara',role:'SCOUT',energy:8,food:0,wood:0,home:0},
    {name:'Viktor',role:'BUILDER',energy:8,food:0,wood:2,home:0},
    {name:'Nix',role:'FORAGER',energy:8,food:0,wood:1,home:0},
    {name:'Ash',role:'GUARD',energy:8,food:0,wood:0,home:0}
  ];
  let agents=initial(),turn=0,worldBusy=false,auto=false,autoTimer=null,food=12,danger=1,logs=[],worldFinished=false;
  const worldLog=t=>{logs.unshift(t);logs=logs.slice(0,18);$('zw-world-feed').replaceChildren(...logs.map(s=>{const p=document.createElement('p');p.textContent=s;return p;}));};
  const renderWorld=()=>{
    const day=Math.floor(turn/4)+1;
    $('zw-world-turn').textContent=L('day')+' '+Math.min(day,7)+' · '+L('turn')+' '+turn;
    $('zw-pop').textContent=agents.length+' '+L('survivors');
    $('zw-shelter').textContent=agents.reduce((n,a)=>n+a.home,0)+' '+L('shelters');
    $('zw-food').textContent=food+' '+L('food');
    $('zw-danger').textContent='DANGER '+danger;
    const avg=agents.reduce((n,a)=>n+a.energy,0)/(agents.length||1);
    $('zw-energy-meter').style.width=Math.max(0,avg*10)+'%';
    const shelterCount=agents.reduce((n,a)=>n+a.home,0);
    $('zw-site-food').classList.toggle('is-active',food>=8);$('zw-site-food').classList.toggle('is-danger',food<=4);
    $('zw-site-danger').classList.toggle('is-danger',danger>=3);$('zw-site-danger').classList.toggle('is-active',danger<3);
    $('zw-site-shelter-1').classList.toggle('is-active',shelterCount>=1);$('zw-site-shelter-2').classList.toggle('is-active',shelterCount>=2);
    $('zw-site-food').title='Food supplies: '+food;$('zw-site-danger').title='Outbreak danger: '+danger+'/5';
    $('zw-site-shelter-1').title=shelterCount>=1?'Shelter secured':'Shelter not built';$('zw-site-shelter-2').title=shelterCount>=2?'Second shelter secured':'Second shelter not built';
    const roleIcons={SCOUT:'🧭',BUILDER:'🛠️',FORAGER:'🥫',GUARD:'🛡️'};
    $('zw-agent-cards').replaceChildren(...agents.map(a=>{const card=document.createElement('div');card.className='zw-agent';const name=document.createElement('b');name.textContent=(roleIcons[a.role]||'🧍')+' '+a.name+' · '+a.role;const stats=document.createElement('div');stats.textContent='⚡ '+a.energy+'/10  ·  🪵 '+a.wood+'  ·  🛖 '+a.home;card.append(name,stats);return card;}));
  };
  const stopAuto=()=>{auto=false;if(autoTimer)clearInterval(autoTimer);autoTimer=null;$('zw-auto').textContent=L('autoOff');};
  let searchedSites=0,lootFound=0,rescuedJune=false;
  const expeditionEvents=['cache','ambush','survivor','nothing'];
  function renderExpedition(){
    $('zw-expedition-title').textContent=L('expeditionTitle');
    $('zw-explore').textContent=L('explore');
    $('zw-expedition-hint').textContent=L('expeditionHint');
    $('zw-expedition-progress').textContent=searchedSites+' / 5 '+L('sites');
    $('zw-expedition-loot').textContent=lootFound+' '+L('loot');
    $('zw-explore').disabled=searchedSites>=5||worldFinished;
    if(searchedSites>=5)$('zw-expedition-hint').textContent=L('expeditionDone');
  }
  function exploreDistrict(){
    if(worldBusy||worldFinished||searchedSites>=5)return;
    const explorer=agents[turn%agents.length];
    if(explorer.energy<2){worldLog(L('expeditionNeedEnergy'));return;}
    explorer.energy-=2;searchedSites++;
    let event=expeditionEvents[Math.floor(Math.random()*expeditionEvents.length)];
    if(event==='survivor'&&rescuedJune)event='cache';
    if(event==='cache'){food+=3;explorer.wood+=2;lootFound+=5;worldLog(L('eventCache'));}
    else if(event==='ambush'){danger=Math.min(5,danger+2);explorer.energy=Math.max(0,explorer.energy-2);worldLog(L('eventAmbush').replace('{name}',explorer.name));}
    else if(event==='survivor'){rescuedJune=true;agents.push({name:'June',role:'MEDIC',energy:8,food:0,wood:0,home:0});worldLog(L('eventSurvivor'));}
    else {danger=Math.max(0,danger-1);worldLog(L('eventNothing'));}
    turn++;
    if(turn%4===0){food=Math.max(0,food-4);danger=Math.min(5,danger+1);agents.forEach(x=>{x.energy=Math.max(0,x.energy-(x.home?0:1));});worldLog('🌙 DAY '+Math.floor(turn/4)+' ENDS — the crew consumes 4 rations. Food: '+food+'.');}
    if(food===0||agents.every(x=>x.energy===0)){worldFinished=true;stopAuto();worldLog(L('worldLost'));}
    else if(turn>=28){worldFinished=true;stopAuto();const shelters=agents.reduce((n,x)=>n+x.home,0);worldLog(shelters>=2?L('worldWon'):L('worldPartial'));}
    renderWorld();renderExpedition();$('zw-next').disabled=worldFinished;
  }
  $('zw-explore').addEventListener('click',exploreDistrict);
  const resetWorld=()=>{
    agents=initial();turn=0;food=12;danger=1;logs=[];worldFinished=false;searchedSites=0;lootFound=0;rescuedJune=false;
    worldLog(L('worldStart'));
    renderWorld();renderExpedition();$('zw-next').disabled=false;
  };
  function localAction(a){
    if(a.energy<=3)return 'rest';
    if(food<=6)return 'forage';
    if(danger>=3&&a.role==='GUARD')return 'guard';
    if(a.wood>=3&&a.home<2)return 'build';
    if(a.wood<3&&a.role==='BUILDER')return 'gather';
    if(a.role==='FORAGER'&&food<12)return 'forage';
    if(a.role==='SCOUT'&&danger>1)return 'scout';
    if(a.role==='GUARD')return 'guard';
    if(a.wood<3)return 'gather';
    return 'talk';
  }
  function applyAction(a,action,reason){
    const outcomes={
      scout:()=>{a.energy=Math.max(0,a.energy-1);danger=Math.max(0,danger-1);worldLog('🧭 '+a.name+' scouts a safe route. Danger −1.');},
      forage:()=>{a.energy=Math.max(0,a.energy-1);food+=4;worldLog('🥫 '+a.name+' finds canned food. Rations +4.');},
      gather:()=>{a.energy=Math.max(0,a.energy-1);a.wood+=2;worldLog('🪵 '+a.name+' salvages timber. Materials +2.');},
      build:()=>{if(a.wood>=3&&a.energy>=2){a.wood-=3;a.energy-=2;a.home++;danger=Math.max(0,danger-1);worldLog('🛖 '+a.name+' completes a shelter. Shelter +1, danger −1.');}else worldLog('🔧 '+a.name+' cannot build yet — needs 3 timber and 2 energy.');},
      talk:()=>{a.energy=Math.min(10,a.energy+1);worldLog('💬 '+a.name+' rallies the crew. Energy +1.');},
      rest:()=>{a.energy=Math.min(10,a.energy+3);worldLog('🛏️ '+a.name+' rests and recovers 3 energy.');},
      guard:()=>{a.energy=Math.max(0,a.energy-1);danger=Math.max(0,danger-1);worldLog('🛡️ '+a.name+' secures the perimeter. Danger −1.');}
    };
    (outcomes[action]||outcomes.rest)();
    if(reason)worldLog('💭 '+a.name+': '+reason.slice(0,150));
  }
  async function liveAction(a){
    const response=await fetch('https://gen.pollinations.ai/v1/chat/completions',{
      method:'POST',headers:{'Authorization':'Bearer '+userKey,'Content-Type':'application/json'},
      body:JSON.stringify({model:$('zw-model').value,messages:[
        {role:'system',content:'You are '+a.name+', a '+a.role+' survivor in a 7-day zombie apocalypse campaign. Choose exactly one action: scout, forage, gather, build, talk, rest, guard. Your energy '+a.energy+'/10, shared food '+food+', your wood '+a.wood+', shelters '+agents.reduce((n,x)=>n+x.home,0)+', danger '+danger+'/5. Priorities: prevent starvation (forage if food <= 6), rest if energy <= 3, build if you have 3 wood and fewer than 2 shelters, gather timber if low, reduce danger with guard/scout. Return only JSON: {"action":"...","reason":"short reason"}. No other actions.'},
        {role:'user',content:'Day '+(Math.floor(turn/4)+1)+', action '+(turn%4+1)+' of 4. What do you do to help the crew survive seven days?'}
      ],temperature:0.3,max_tokens:120})
    });
    const data=await response.json();if(!response.ok)throw new Error(data.error?.message||'Pollinations request failed '+response.status);
    const raw=data.choices?.[0]?.message?.content||'';const match=raw.match(/\{[\s\S]*\}/);if(!match)throw new Error('Model did not return JSON');
    const parsed=JSON.parse(match[0]);const allowed=['scout','forage','gather','build','talk','rest','guard'];
    if(!allowed.includes(parsed.action))throw new Error('Unsupported action returned by model');
    return {action:parsed.action,reason:String(parsed.reason||'')};
  }
  async function nextTurn(){
    if(worldBusy||worldFinished)return;worldBusy=true;$('zw-next').disabled=true;$('zw-auto').disabled=true;
    const a=agents[turn%agents.length];
    try{
      const command=$('zw-command').value;
      const choice=userKey?await liveAction(a):{action:command==='auto'?localAction(a):command,reason:command==='auto'?'':'Player order'};
      applyAction(a,choice.action,choice.reason);turn++;
      if(command!=='auto'){$('zw-command').value='auto';worldLog('🎮 Player order delivered to '+a.name+'.');}
      if(turn%4===0){
        food=Math.max(0,food-4);danger=Math.min(5,danger+1);
        agents.forEach(x=>{x.energy=Math.max(0,x.energy-(x.home?0:1));});
        worldLog('🌙 DAY '+Math.floor(turn/4)+' ENDS — the crew consumes 4 rations. Food: '+food+'.');
      }
      if(food===0||agents.every(x=>x.energy===0)){
        worldFinished=true;stopAuto();worldLog(L('worldLost'));
      }else if(turn>=28){
        const shelters=agents.reduce((n,x)=>n+x.home,0);
        worldFinished=true;stopAuto();worldLog(shelters>=2?L('worldWon'):L('worldPartial'));
      }
      renderWorld();renderExpedition();
    }catch(e){worldLog('AI turn failed: '+e.message+'. No fallback action was applied.');}
    finally{worldBusy=false;$('zw-next').disabled=worldFinished;$('zw-auto').disabled=false;}
  }
  $('zw-next').addEventListener('click',nextTurn);
  $('zw-world-reset').addEventListener('click',()=>{stopAuto();resetWorld();});
  $('zw-auto').addEventListener('click',()=>{
    auto=!auto;$('zw-auto').textContent=auto?L('autoOn'):L('autoOff');
    if(auto)autoTimer=setInterval(()=>{if(!worldBusy&&!worldFinished)nextTurn();},3500);else clearInterval(autoTimer);
  });
  resetWorld();
  applyLocale();
})();

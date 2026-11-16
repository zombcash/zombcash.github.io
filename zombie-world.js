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
      #zombcash-outbreak-world .zw-muted{color:#a8b2a5;font-size:15px}\n      #zombcash-outbreak-world .zw-endpoint{display:block;overflow-wrap:anywhere;color:#9bff45;font-size:12px;margin:4px 0 10px}
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
    <div class="kicker">QUEST #19182 + #19177 · POLLINATIONS</div>
    <h2 class="zw-title" id="zw-main-title">ZOMBIE OUTBREAK &amp; AI WORLD</h2>
    <p class="zw-muted">Two connected experiments: multiplayer agents over MCP, and an autonomous survival world. Both include a free local mode. Live model calls use the Pollen you explicitly authorize above.</p>
    <div class="zw-grid">
      <article class="zw-card" aria-labelledby="zw-outbreak-title">
        <h3 class="zw-title" id="zw-outbreak-title">01 / ZOMBIE OUTBREAK — MCP ARENA</h3>
        <p class="zw-muted">Agents join as survivors or infected. The MCP server validates every move and owns the shared game state.</p>
        <div class="zw-row"><span class="zw-stat" id="zw-mcp-status">MCP SERVER: DEPLOYED · HTTPS</span></div>\n        <a class="zw-endpoint" id="zw-mcp-endpoint" href="https://owmiywvmtdjyeyfxlpdp.supabase.co/functions/v1/outbreak-mcp" target="_blank" rel="noopener noreferrer">https://owmiywvmtdjyeyfxlpdp.supabase.co/functions/v1/outbreak-mcp</a>
        <div class="zw-row">
          <button class="primary" id="zw-demo-start" type="button">START LOCAL MATCH</button>
          <button id="zw-demo-turn" type="button" disabled>ADVANCE TURN</button>
          <button id="zw-demo-reset" type="button">RESET</button>
        </div>
        <div class="zw-map" id="zw-outbreak-map" aria-label="Local outbreak game board"></div>
        <div class="zw-feed" id="zw-outbreak-feed" aria-live="polite"><p>Local demo is ready. The shared multiplayer MCP endpoint is deployed; connect an MCP client using the instructions in ZOMBIECASH_AI_WORLDS.md.</p></div>
        <p class="zw-muted">MCP tools planned: create_match, join_match, get_state, submit_action. Server-side validation prevents agents from changing illegal moves.</p>
      </article>
      <article class="zw-card" aria-labelledby="zw-world-title">
        <h3 class="zw-title" id="zw-world-title">02 / ZOMBIE AI WORLD — AUTONOMOUS SIM</h3>
        <p class="zw-muted">Four agents seek food, gather materials, build shelter, talk, cooperate and compete. No scripted story is required.</p>
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
        <p class="zw-muted">Live mode asks one agent for one action per turn. No model call is made until you press NEXT AI TURN or enable AUTO.</p>
      </article>
    </div>
  `;
  arena.insertAdjacentElement('afterend', shell);

  const $ = id => shell.querySelector('#' + id);
  const feed = (id, text) => { const p=document.createElement('p'); p.textContent=text; $(id).prepend(p); };
  const connect = document.getElementById('zai-connect');
  let userKey = connect && connect.apiKey || null;
  if (connect) connect.addEventListener('change', () => {
    userKey = connect.apiKey || null;
    $('zw-world-mode').textContent = userKey ? 'LIVE · YOUR POLLEN' : 'FREE LOCAL SIMULATION';
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
  const resetOutbreak=()=>{actors[0].p=0;actors[1].p=8;actors[2].p=72;outbreakTurn=0;outbreakStarted=false;$('zw-demo-turn').disabled=true;$('zw-mcp-status').textContent='MCP SERVER: DEPLOYED · HTTPS';$('zw-outbreak-feed').replaceChildren();feed('zw-outbreak-feed','Local match reset. Hosted multiplayer MCP endpoint is online.');drawOutbreak();};
  $('zw-demo-start').addEventListener('click',()=>{outbreakStarted=true;$('zw-demo-turn').disabled=false;feed('zw-outbreak-feed','Local match started: two survivors versus one infected agent.');});
  $('zw-demo-turn').addEventListener('click',()=>{
    if(!outbreakStarted)return;outbreakTurn++;
    for(const a of actors){const step=[-size,size,-1,1][(outbreakTurn+a.p)%4];const next=a.p+step;if(next>=0&&next<size*size&&!walls.has(next)&&Math.abs((next%size)-(a.p%size))<=1)a.p=next;}
    const s=actors.filter(a=>a.role==='survivor').map(a=>a.p).join(', ');
    feed('zw-outbreak-feed','Turn '+outbreakTurn+': server-style local rules advanced all agents. Survivor positions: '+s+'.');
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
    $('zw-world-turn').textContent='DAY '+(Math.floor(turn/8)+1)+' · TURN '+turn;
    $('zw-pop').textContent=agents.length+' SURVIVORS';
    $('zw-shelter').textContent=agents.reduce((n,a)=>n+a.home,0)+' SHELTERS';
    $('zw-food').textContent=food+' FOOD';
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
  $('zw-world-reset').addEventListener('click',()=>{if(auto){auto=false;clearInterval(autoTimer);$('zw-auto').textContent='AUTO: OFF';}resetWorld();});
  $('zw-auto').addEventListener('click',()=>{
    auto=!auto;$('zw-auto').textContent=auto?'AUTO: ON':'AUTO: OFF';
    if(auto)autoTimer=setInterval(()=>{if(!worldBusy)nextTurn();},3500);else clearInterval(autoTimer);
  });
  resetWorld();
})();

// ZombieCash Outbreak MCP — stateless Streamable HTTP endpoint.
// Authentication is enforced by the Supabase Edge gateway (verify_jwt=true).
// Match state is persisted in Postgres; no in-memory state is relied upon.

const PROJECT_URL = Deno.env.get("SUPABASE_URL")!;
const SECRET_KEYS = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
const DB_KEY = SECRET_KEYS.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!DB_KEY) throw new Error("Supabase server secret is not configured");

const W = 18, H = 14, MAX_PLAYERS = 8;
const HELI = [0, 17, 8 + 13 * W];
const DIRS: Record<string, [number, number]> = { north: [0,-1], south: [0,1], west: [-1,0], east: [1,0] };
const ROLES = new Set(["survivor", "infected"]);
const ACTIONS = new Set([...Object.keys(DIRS).map(d => "move_"+d), ...Object.keys(DIRS).map(d => "push_"+d), "wait"]);
const PROTOCOLS = ["2025-03-26", "2025-06-18", "2025-11-25"];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, mcp-session-id, mcp-protocol-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, Mcp-Protocol-Version",
  "Vary": "Origin",
};

function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json", ...extra } });
}
function rpcError(id: unknown, code: number, message: string) {
  return json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, 200);
}
function toolResult(value: unknown) {
  const text = JSON.stringify(value);
  return { content: [{ type: "text", text }], structuredContent: value, isError: false };
}
function toolError(message: string) {
  return { content: [{ type: "text", text: message }], isError: true };
}
function tile(x:number,y:number){return y*W+x;}
function buildWorld(){
  const walls:number[]=[],crates:number[]=[],hazards:number[]=[],candidates:number[]=[];
  for(let y=4;y<=8;y++)for(let x=1;x<W-1;x++){
    const p=tile(x,y);
    if(x!==8&&y!==6&&Math.random()<0.14)walls.push(p);
    if(x!==8&&y!==6&&!walls.includes(p))candidates.push(p);
  }
  for(let i=candidates.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
  crates.push(...candidates.slice(0,10));hazards.push(...candidates.slice(12,16));
  const used=new Set<number>(),humans:any[]=[],zombies:any[]=[];
  const humanCells:number[]=[];for(let y=0;y<4;y++)for(let x=0;x<W;x++)if(x<7||x>10)humanCells.push(tile(x,y));
  const hNames=["Mara","Viktor","Nix","Ash","June","Rook","Iris","Milo","Sable","Kai","Echo","Dante","Nova","Finn","Zara","Wolf","Pip","Raven"];
  for(let i=0;i<hNames.length;i++){const p=humanCells.find(p=>!used.has(p)&&!walls.includes(p)&&!crates.includes(p)&&!HELI.includes(p))!;used.add(p);humans.push({id:"H"+(i+1),name:hNames[i],position:p,alive:true,escaped:false,acted:false});}
  const zombieCells:number[]=[];for(let y=9;y<H;y++)for(let x=0;x<W;x++)if(x<7||x>10)zombieCells.push(tile(x,y));
  const zNames=["Alpha","Brute","Howler","Stalker","Crawler","Warden"];
  for(let i=0;i<zNames.length;i++){const p=zombieCells.find(p=>!used.has(p)&&!walls.includes(p)&&!crates.includes(p)&&!HELI.includes(p))!;used.add(p);zombies.push({id:"Z"+(i+1),name:zNames[i],position:p,alive:true,acted:false});}
  return {walls,crates,hazards,helipads:[...HELI],humans,zombies,escaped:0,infected:0};
}
function publicState(m:any){
  const w=m.world;
  return {
    match_id:m.id,name:m.name,turn:m.turn,status:m.status,
    controllers:Object.values(m.players).map((p:any)=>({agent_id:p.agent_id,role:p.role})),
    units:{
      survivors:w.humans.map((a:any)=>({id:a.id,name:a.name,position:a.position,alive:a.alive,escaped:a.escaped,acted:a.acted})),
      infected:w.zombies.map((a:any)=>({id:a.id,name:a.name,position:a.position,alive:a.alive,acted:a.acted})),
    },
    map:{width:W,height:H,walls:w.walls,movable_obstacles:w.crates,hazards:w.hazards,helicopters:w.helipads},
    score:{escaped:w.escaped,infected:w.infected,survivors_alive:w.humans.filter((a:any)=>a.alive).length,zombies_alive:w.zombies.filter((a:any)=>a.alive).length},
    events:m.events.slice(-20),
  };
}
async function dbRequest(path: string, init: RequestInit = {}) {
  const response = await fetch(`${PROJECT_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: DB_KEY,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Database request failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  if (response.status === 204) return null;
  const raw = await response.text();
  return raw ? JSON.parse(raw) : null;
}
async function loadMatch(id: string) {
  const rows = await dbRequest(`outbreak_matches?id=eq.${encodeURIComponent(id)}&select=state,updated_at`);
  return rows?.[0] ?? null;
}
async function saveMatch(m: any, expectedUpdatedAt?: string) {
  const updatedAt = new Date().toISOString();
  if (!expectedUpdatedAt) {
    await dbRequest("outbreak_matches?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ id: m.id, state: m, updated_at: updatedAt }),
    });
    return;
  }
  const rows = await dbRequest(`outbreak_matches?id=eq.${encodeURIComponent(m.id)}&updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ state: m, updated_at: updatedAt }),
  });
  if (!rows?.length) throw new Error("Match changed concurrently. Fetch the latest state and retry your action.");
}
async function tokenHash(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}
function requiredString(args: any, key: string, max: number) {
  const value = args?.[key];
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`${key} must be a non-empty string of at most ${max} characters`);
  return value.trim();
}
function finishIfNeeded(m:any){
  const w=m.world,alive=w.humans.filter((a:any)=>a.alive).length;
  if(w.escaped>=10){m.status="finished";m.events.push("SURVIVORS WIN: evacuation threshold reached");}
  else if(alive===0||w.infected>=13){m.status="finished";m.events.push("OUTBREAK WINS: the horde consumed the evacuation zone");}
  else if(m.turn>=32){m.status="finished";m.events.push("QUARANTINE COLLAPSED: turn limit reached");}
}
async function callTool(name:string,args:any){
  if(name==="create_match"){
    const matchName=typeof args?.name==="string"?args.name.trim().slice(0,48)||"Zombie Outbreak":"Zombie Outbreak";
    const id=crypto.randomUUID().replaceAll("-","").slice(0,12);
    const match={id,name:matchName,turn:0,status:"waiting",players:{},world:buildWorld(),events:["Quarantine breached. 18 survivors, 6 infected."],created:new Date().toISOString()};
    await saveMatch(match);return publicState(match);
  }
  const matchId=requiredString(args,"match_id",64),row=await loadMatch(matchId);
  if(!row)throw new Error("Match not found");
  const m=row.state;
  if(!m.world)throw new Error("This match uses retired 9x9 rules. Create a new 18x14 outbreak match.");
  if(name==="get_match_state")return publicState(m);
  if(name==="join_match"){
    const agentId=requiredString(args,"agent_id",48),role=requiredString(args,"role",16);
    if(!ROLES.has(role))throw new Error("role must be survivor or infected");
    if(m.players[agentId])throw new Error("Agent ID is already taken in this match");
    if(Object.keys(m.players).length>=MAX_PLAYERS)throw new Error("Match is full");
    if(m.status==="finished")throw new Error("Match is finished");
    const token=crypto.randomUUID()+crypto.randomUUID();
    m.players[agentId]={agent_id:agentId,role,token_hash:await tokenHash(token)};
    const roles=new Set(Object.values(m.players).map((p:any)=>p.role));
    m.status=roles.has("survivor")&&roles.has("infected")?"running":"waiting";
    m.events.push(`${agentId} joined as ${role} controller`);
    await saveMatch(m,row.updated_at);
    return {...publicState(m),agent_token:token,token_notice:"Store this token securely. It is shown only once and is required to submit actions."};
  }
  if(name==="submit_action"){
    const agentId=requiredString(args,"agent_id",48),action=requiredString(args,"action",32),token=requiredString(args,"agent_token",128);
    const controller=m.players[agentId];if(!controller)throw new Error("Agent has not joined this match");
    if(!controller.token_hash||await tokenHash(token)!==controller.token_hash)throw new Error("Invalid agent token");
    if(m.status!=="running")throw new Error("Match needs both faction controllers and must be running");
    if(!ACTIONS.has(action))throw new Error("Unsupported action");
    const w=m.world,side=controller.role==="survivor"?w.humans:w.zombies;
    const unitId=typeof args.unit_id==="string"?args.unit_id:"";
    const unit=unitId?side.find((a:any)=>a.id===unitId):side.find((a:any)=>a.alive&&!a.acted);
    if(!unit||!unit.alive)throw new Error("Unit not found or no longer active on your faction");
    if(unit.acted)throw new Error("Unit already acted this round");
    if(action==="wait"){unit.acted=true;m.events.push(`${agentId} ordered ${unit.id} to hold position`);}
    else{
      const [dx,dy]=DIRS[action.split("_",2)[1]],x=unit.position%W,y=Math.floor(unit.position/W),tx=x+dx,ty=y+dy;
      if(tx<0||tx>=W||ty<0||ty>=H)throw new Error("Illegal move: outside map");
      const target=ty*W+tx;
      if(action.startsWith("push_")){
        if(!w.crates.includes(target))throw new Error("No movable obstacle adjacent in that direction");
        const bx=tx+dx,by=ty+dy;if(bx<0||bx>=W||by<0||by>=H)throw new Error("Cannot push obstacle outside map");
        const beyond=by*W+bx,occupied=[...w.humans,...w.zombies].some((a:any)=>a.alive&&a.position===beyond);
        if(w.walls.includes(beyond)||w.crates.includes(beyond)||w.helipads.includes(beyond)||occupied)throw new Error("Obstacle destination is blocked");
        w.crates=w.crates.filter((p:number)=>p!==target);w.crates.push(beyond);unit.acted=true;m.events.push(`${unit.id} pushed debris from ${target} to ${beyond}`);
      }else{
        if(w.walls.includes(target)||w.crates.includes(target))throw new Error("Illegal move: blocked tile");
        const opponents=controller.role==="survivor"?w.zombies:w.humans;
        const victim=opponents.find((a:any)=>a.alive&&a.position===target);
        if(victim){
          if(controller.role!=="infected")throw new Error("Tile occupied by another faction");
          victim.alive=false;w.infected++;
          w.zombies.push({id:"Z"+(w.zombies.length+1),name:victim.name+" · turned",position:target,alive:true,acted:false});
          m.events.push(`${victim.name} was infected and joined the horde`);
        }else if(side.some((a:any)=>a.alive&&a.position===target))throw new Error("Tile occupied by an ally");
        else unit.position=target;
        if(controller.role==="survivor"&&w.helipads.includes(target)){unit.alive=false;unit.escaped=true;w.escaped++;m.events.push(`${unit.name} escaped by helicopter`);}
        unit.acted=true;m.events.push(`${unit.id}: ${action}`);
      }
    }
    const active=[...w.humans,...w.zombies].filter((a:any)=>a.alive);
    if(active.length&&active.every((a:any)=>a.acted)){m.turn++;active.forEach((a:any)=>a.acted=false);m.events.push(`Round ${m.turn} begins`);}
    finishIfNeeded(m);await saveMatch(m,row.updated_at);return publicState(m);
  }
  throw new Error(`Unknown tool: ${name}`);
}
const TOOLS=[
  {name:"create_match",description:"Create an 18x14 ZombieCash Outbreak map with 18 survivors, 6 infected, movable debris and helicopter extraction zones.",inputSchema:{type:"object",properties:{name:{type:"string",description:"Optional match name"}},additionalProperties:false}},
  {name:"join_match",description:"Join as the survivor or infected faction controller. A controller can command all units on its side.",inputSchema:{type:"object",properties:{match_id:{type:"string"},agent_id:{type:"string"},role:{type:"string",enum:["survivor","infected"]}},required:["match_id","agent_id","role"],additionalProperties:false}},
  {name:"get_match_state",description:"Read the authoritative 18x14 map, all units, score and recent events.",inputSchema:{type:"object",properties:{match_id:{type:"string"}},required:["match_id"],additionalProperties:false}},
  {name:"submit_action",description:"Move one unit one tile, push an adjacent movable obstacle one tile, or wait. Each unit acts once per round. Optional unit_id selects a unit; otherwise the first ready unit is selected.",inputSchema:{type:"object",properties:{match_id:{type:"string"},agent_id:{type:"string"},agent_token:{type:"string"},unit_id:{type:"string"},action:{type:"string",enum:[...ACTIONS]}},required:["match_id","agent_id","agent_token","action"],additionalProperties:false}},
];
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method === "GET") {
    if (req.headers.get("accept")?.includes("text/event-stream")) return new Response(null, { status: 405, headers: { ...cors, Allow: "POST, OPTIONS" } });
    return json({ name: "ZombieCash Outbreak MCP", status: "active", transport: "Streamable HTTP", endpoint: "/functions/v1/outbreak-mcp", tools: TOOLS.map(t => t.name), map: { width: W, height: H }, units: { survivors: 18, infected: 6 } });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, { Allow: "GET, POST, OPTIONS" });

  let body: any;
  try { body = await req.json(); } catch { return rpcError(null, -32700, "Parse error"); }
  if (!body || body.jsonrpc !== "2.0" || typeof body.method !== "string") return rpcError(body?.id, -32600, "Invalid Request");

  if (body.method === "notifications/initialized" || body.method === "notifications/cancelled") return new Response(null, { status: 202, headers: cors });
  if (body.method === "initialize") {
    const requested = body.params?.protocolVersion;
    const protocolVersion = PROTOCOLS.includes(requested) ? requested : "2025-03-26";
    return json({ jsonrpc: "2.0", id: body.id, result: {
      protocolVersion,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "zombcash-outbreak", version: "2.0.0" },
      instructions: "ZombieCash Outbreak strategic multiplayer. Create an 18x14 match, join as survivor or infected faction controller, inspect all units, and submit one-tile move/push/wait actions for each unit. Humans can escape by helicopter; infected convert humans on contact. State persists in Supabase."
    } }, 200, { "Mcp-Protocol-Version": protocolVersion });
  }
  if (body.method === "ping") return json({ jsonrpc: "2.0", id: body.id, result: {} });
  if (body.method === "tools/list") return json({ jsonrpc: "2.0", id: body.id, result: { tools: TOOLS } });
  if (body.method === "tools/call") {
    const name = body.params?.name;
    if (!TOOLS.some(t => t.name === name)) return rpcError(body.id, -32602, "Unknown tool");
    try {
      const result = await callTool(name, body.params?.arguments || {});
      return json({ jsonrpc: "2.0", id: body.id, result: toolResult(result) });
    } catch (error) {
      return json({ jsonrpc: "2.0", id: body.id, result: toolError(error instanceof Error ? error.message : "Tool call failed") });
    }
  }
  if (body.id === undefined) return new Response(null, { status: 202, headers: cors });
  return rpcError(body.id, -32601, "Method not found");
});

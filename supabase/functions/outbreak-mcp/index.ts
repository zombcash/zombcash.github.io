// ZombieCash Outbreak MCP — stateless Streamable HTTP endpoint.
// Authentication is enforced by the Supabase Edge gateway (verify_jwt=true).
// Match state is persisted in Postgres; no in-memory state is relied upon.

const PROJECT_URL = Deno.env.get("SUPABASE_URL")!;
const SECRET_KEYS = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
const DB_KEY = SECRET_KEYS.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!DB_KEY) throw new Error("Supabase server secret is not configured");

const W = 9, H = 9, MAX_PLAYERS = 8;
const WALLS = [10, 19, 28, 37, 46, 55, 64];
const ROLES = new Set(["survivor", "infected"]);
const ACTIONS = new Set(["move_north", "move_south", "move_east", "move_west", "scavenge", "barricade", "attack", "wait"]);
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
function publicState(m: any) {
  return {
    match_id: m.id, name: m.name, turn: m.turn, status: m.status,
    players: Object.values(m.players).map((p: any) => ({
      agent_id: p.agent_id, role: p.role, position: p.position, health: p.health,
      food: p.food, wood: p.wood, acted_turn: p.acted_turn,
    })),
    map: { width: W, height: H, walls: [...WALLS, ...(m.barricades || [])].sort((a: number, b: number) => a-b) },
    events: m.events.slice(-12),
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
  const rows = await dbRequest(`outbreak_matches?id=eq.${encodeURIComponent(id)}&select=state`);
  return rows?.[0]?.state ?? null;
}
async function saveMatch(m: any) {
  await dbRequest("outbreak_matches?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ id: m.id, state: m, updated_at: new Date().toISOString() }),
  });
}
function requiredString(args: any, key: string, max: number) {
  const value = args?.[key];
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`${key} must be a non-empty string of at most ${max} characters`);
  return value.trim();
}
async function callTool(name: string, args: any) {
  if (name === "create_match") {
    const matchName = typeof args?.name === "string" ? args.name.trim().slice(0, 48) || "Outbreak" : "Outbreak";
    const id = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
    const match = { id, name: matchName, turn: 0, status: "waiting", players: {}, barricades: [], events: ["Match created"], created: new Date().toISOString() };
    await saveMatch(match);
    return publicState(match);
  }
  const matchId = requiredString(args, "match_id", 64);
  const match = await loadMatch(matchId);
  if (!match) throw new Error("Match not found");
  if (name === "get_match_state") return publicState(match);
  if (name === "join_match") {
    const agentId = requiredString(args, "agent_id", 48);
    const role = requiredString(args, "role", 16);
    if (!ROLES.has(role)) throw new Error("role must be survivor or infected");
    if (match.players[agentId]) return publicState(match);
    if (Object.keys(match.players).length >= MAX_PLAYERS) throw new Error("Match is full");
    if (match.status === "finished") throw new Error("Match is finished");
    match.players[agentId] = { agent_id: agentId, role, position: role === "survivor" ? 0 : 80, health: 3, food: 2, wood: 0, acted_turn: -1 };
    match.status = Object.keys(match.players).length >= 2 ? "running" : "waiting";
    match.events.push(`${agentId} joined as ${role}`);
    await saveMatch(match);
    return publicState(match);
  }
  if (name === "submit_action") {
    const agentId = requiredString(args, "agent_id", 48);
    const action = requiredString(args, "action", 32);
    const player = match.players[agentId];
    if (!player) throw new Error("Agent has not joined this match");
    if (match.status !== "running") throw new Error("Match needs at least two agents");
    if (!ACTIONS.has(action)) throw new Error("Unsupported action");
    if (player.acted_turn === match.turn) throw new Error("Agent already acted this turn");
    const pos = player.position;
    const target = ({ move_north: pos-W, move_south: pos+W, move_west: pos-1, move_east: pos+1 } as Record<string, number>)[action];
    if (action.startsWith("move_")) {
      if (target === undefined || target < 0 || target >= W*H || WALLS.includes(target) || (match.barricades || []).includes(target) ||
          (action === "move_west" && pos % W === 0) || (action === "move_east" && pos % W === W-1)) throw new Error("Illegal move");
      player.position = target;
    } else if (action === "scavenge") {
      player.food += 1;
    } else if (action === "barricade") {
      if (player.wood < 1) player.wood += 1;
      else {
        const cell = Math.min(W*H-1, Math.max(0, player.position + W));
        if (!WALLS.includes(cell) && !match.barricades.includes(cell)) {
          player.wood -= 1; match.barricades.push(cell);
          match.events.push(`${agentId} built a barricade at ${cell}`);
        } else match.events.push(`${agentId} could not build a barricade`);
      }
    } else if (action === "attack") {
      const opponents = Object.values(match.players).filter((p: any) =>
        p.health > 0 && p.role !== player.role &&
        Math.abs(p.position % W - pos % W) + Math.abs(Math.floor(p.position / W) - Math.floor(pos / W)) <= 1
      ) as any[];
      if (opponents.length) {
        opponents[0].health = Math.max(0, opponents[0].health - 1);
        if (opponents[0].health === 0) match.events.push(`${opponents[0].agent_id} was eliminated`);
      } else match.events.push(`${agentId} attacked but found no target`);
    }
    player.acted_turn = match.turn;
    match.events.push(`${agentId}: ${action}`);
    const active = Object.values(match.players).filter((p: any) => p.health > 0) as any[];
    if (active.length && active.every((p: any) => p.acted_turn === match.turn)) match.turn += 1;
    const hasSurvivor = active.some((p: any) => p.role === "survivor");
    const hasInfected = active.some((p: any) => p.role === "infected");
    if (!hasSurvivor || !hasInfected) match.status = "finished";
    await saveMatch(match);
    return publicState(match);
  }
  throw new Error(`Unknown tool: ${name}`);
}

const TOOLS = [
  { name: "create_match", description: "Create a shared ZombieCash Outbreak match. Returns match_id for other agents to join.", inputSchema: { type: "object", properties: { name: { type: "string", description: "Optional match name" } }, additionalProperties: false } },
  { name: "join_match", description: "Join a match as a survivor or infected agent.", inputSchema: { type: "object", properties: { match_id: { type: "string" }, agent_id: { type: "string" }, role: { type: "string", enum: ["survivor", "infected"] } }, required: ["match_id", "agent_id", "role"], additionalProperties: false } },
  { name: "get_match_state", description: "Read the authoritative state of a shared match.", inputSchema: { type: "object", properties: { match_id: { type: "string" } }, required: ["match_id"], additionalProperties: false } },
  { name: "submit_action", description: "Submit one legal action for the current turn. Supported actions: move_north, move_south, move_east, move_west, scavenge, barricade, attack, wait.", inputSchema: { type: "object", properties: { match_id: { type: "string" }, agent_id: { type: "string" }, action: { type: "string", enum: [...ACTIONS] } }, required: ["match_id", "agent_id", "action"], additionalProperties: false } },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method === "GET") return json({ name: "ZombieCash Outbreak MCP", transport: "Streamable HTTP", endpoint: "/functions/v1/outbreak-mcp", tools: TOOLS.map(t => t.name) });
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
      serverInfo: { name: "zombcash-outbreak", version: "1.0.0" },
      instructions: "ZombieCash Outbreak multiplayer arena. Create a match, join as survivor or infected, inspect state, and submit one action per turn. Match state persists in the ZombieCash Supabase database."
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

[![Made with pollinations.ai](https://raw.githubusercontent.com/pollinations/pollinations/main/packages/ui/src/brand/badge-made-with.svg)](https://pollinations.ai/?ref=badge)

# ZombieCash AI Worlds

Two Pollinations community-quest experiences built for the existing ZombieCash Arcade.

## Quest #19182 — Zombie Outbreak: MCP Arena

The public MCP server implementation is in `mcp-server/server.py`. It owns match state and exposes:

- `create_match(name)`
- `join_match(match_id, agent_id, role)` — returns a one-time private `agent_token`
- `get_match_state(match_id)`
- `submit_action(match_id, agent_id, agent_token, action)` — requires the token issued to that agent

Agents connect to the deployed Streamable HTTP MCP endpoint using their MCP client. The server, not the agent, validates movement, actions, turn order and match completion. Each joined agent receives a unique token; only its hash is stored, and another caller cannot submit actions for that agent without the token. Concurrent hosted turn writes use an optimistic database version check so simultaneous agents cannot silently overwrite each other's actions.

### Run the MCP server

```bash
cd mcp-server
python -m pip install -r requirements.txt
python server.py
```

Default local endpoint: `http://localhost:8000/mcp`.

**Hosted MCP endpoint (live):** https://owmiywvmtdjyeyfxlpdp.supabase.co/functions/v1/outbreak-mcp

The hosted endpoint is a stateless Streamable HTTP MCP server on the existing ZombieCash Supabase project. Match state is persisted in the `public.outbreak_matches` table, so matches survive Edge Function cold starts and concurrent requests.

### Connect an MCP client

- Transport: Streamable HTTP
- URL: `https://owmiywvmtdjyeyfxlpdp.supabase.co/functions/v1/outbreak-mcp`
- Authentication: add both headers using the project's **legacy anon JWT** (publishable client credential; never use the server secret):
  - `Authorization: Bearer <SUPABASE_ANON_KEY>`
  - `apikey: <SUPABASE_ANON_KEY>`

The Edge Function gateway verifies the JWT. The server's database secret stays in Supabase and is never exposed to clients. The MCP server is stateless at the HTTP layer; no session affinity is required.

Example MCP client configuration:

```json
{
  "mcpServers": {
    "zombcash-outbreak": {
      "type": "streamable-http",
      "url": "https://owmiywvmtdjyeyfxlpdp.supabase.co/functions/v1/outbreak-mcp",
      "headers": {
        "Authorization": "Bearer <SUPABASE_ANON_KEY>",
        "apikey": "<SUPABASE_ANON_KEY>"
      }
    }
  }
}
```

The same server can also be run locally with the Python implementation above.

## Quest #19177 — Zombie AI World

Four autonomous survivor agents have individual roles, energy, food and materials. They can scout, forage, gather, build shelters, talk, rest and guard. Local mode is free and deterministic. Live mode calls one Pollinations text model for one agent turn at a time, using the visitor's existing BYOP session from the Arcade AI Arena. No call occurs until the visitor presses **NEXT AI TURN** or explicitly enables **AUTO**.

## Pollen and privacy

- No project-owned Pollinations API key is used.
- No request is sent in free local mode.
- Live model calls use the visitor's BYOP key and the budget they approved in the Pollinations consent screen.
- Disconnecting BYOP returns the world to free local simulation.
- This project does not enable developer earnings markup.

## Status

The browser UI, Python MCP reference server and deployed Supabase Edge Function source are in this repository. The hosted MCP endpoint is active and JWT-protected. The deployed endpoint has not yet passed an external MCP Inspector handshake/tool-call test in this environment. Live BYOP calls still require a separate explicit Pollen-spend test.

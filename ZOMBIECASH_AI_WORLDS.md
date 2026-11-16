# ZombieCash AI Worlds

Two Pollinations community-quest experiences built for the existing ZombieCash Arcade.

## Quest #19182 — Zombie Outbreak: MCP Arena

The public MCP server implementation is in `mcp-server/server.py`. It owns match state and exposes:

- `create_match(name)`
- `join_match(match_id, agent_id, role)`
- `get_match_state(match_id)`
- `submit_action(match_id, agent_id, action)`

Agents connect to the deployed Streamable HTTP MCP endpoint using their MCP client. The server, not the agent, validates movement, actions, turn order and match completion.

### Run the MCP server

```bash
cd mcp-server
python -m pip install -r requirements.txt
python server.py
```

Default local endpoint: `http://localhost:8000/mcp`. Deploy this service on an always-on Python host and publish its HTTPS endpoint before submitting quest #19182. The Arcade currently labels the hosted endpoint as pending; no fake live URL is shown.

## Quest #19177 — Zombie AI World

Four autonomous survivor agents have individual roles, energy, food and materials. They can scout, forage, gather, build shelters, talk, rest and guard. Local mode is free and deterministic. Live mode calls one Pollinations text model for one agent turn at a time, using the visitor's existing BYOP session from the Arcade AI Arena. No call occurs until the visitor presses **NEXT AI TURN** or explicitly enables **AUTO**.

## Pollen and privacy

- No project-owned Pollinations API key is used.
- No request is sent in free local mode.
- Live model calls use the visitor's BYOP key and the budget they approved in the Pollinations consent screen.
- Disconnecting BYOP returns the world to free local simulation.
- This project does not enable developer earnings markup.

## Status

The browser UI and MCP server source are prepared in the public site repository. The MCP service still needs deployment to a public HTTPS host and an end-to-end MCP Inspector test before quest #19182 can be submitted. Live BYOP calls also require a user-approved test.

"""ZombieCash Outbreak MCP server for Pollinations Quest #19182.

Run with: python -m pip install -r requirements.txt && python server.py
The MCP server owns authoritative match state; AI clients connect through MCP tools.
"""
from __future__ import annotations

import os
import hashlib
import secrets
import time
from typing import Any

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("ZombieCash Outbreak Arena", stateless_http=False, json_response=True)
MATCHES: dict[str, dict[str, Any]] = {}
MAX_PLAYERS = 8
ROLES = {"survivor", "infected"}
ACTIONS = {"move_north", "move_south", "move_east", "move_west", "scavenge", "barricade", "attack", "wait"}
W = H = 9
WALLS = {10, 19, 28, 37, 46, 55, 64}


def _public(match: dict[str, Any]) -> dict[str, Any]:
    return {
        "match_id": match["id"], "turn": match["turn"], "status": match["status"],
        "players": [{"agent_id": p["agent_id"], "role": p["role"], "position": p["position"], "health": p["health"], "food": p["food"], "wood": p["wood"]} for p in match["players"].values()],
        "map": {"width": W, "height": H, "walls": sorted(WALLS)},
        "events": match["events"][-12:],
    }


@mcp.tool()
def create_match(name: str = "Outbreak") -> dict[str, Any]:
    """Create a shared ZombieCash match. Returns match_id for other agents to join."""
    match_id = secrets.token_urlsafe(6)
    MATCHES[match_id] = {"id": match_id, "name": name[:48], "turn": 0, "status": "waiting", "players": {}, "events": ["Match created"], "created": time.time()}
    return _public(MATCHES[match_id])


@mcp.tool()
def join_match(match_id: str, agent_id: str, role: str) -> dict[str, Any]:
    """Join a match as a survivor or infected agent."""
    match = MATCHES.get(match_id)
    if not match:
        raise ValueError("Match not found")
    if role not in ROLES:
        raise ValueError("role must be survivor or infected")
    if not agent_id or len(agent_id) > 48:
        raise ValueError("agent_id must be 1-48 characters")
    if agent_id in match["players"]:
        raise ValueError("Agent ID is already taken in this match. Choose a new agent_id.")
    if len(match["players"]) >= MAX_PLAYERS:
        raise ValueError("Match is full")
    if match["status"] == "finished":
        raise ValueError("Match is finished")
    agent_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(agent_token.encode("utf-8")).hexdigest()
    match["players"][agent_id] = {"agent_id": agent_id, "role": role, "position": 0 if role == "survivor" else 80, "health": 3, "food": 2, "wood": 0, "acted_turn": -1, "token_hash": token_hash}
    match["status"] = "running" if len(match["players"]) >= 2 else "waiting"
    match["events"].append(f"{agent_id} joined as {role}")
    return {**_public(match), "agent_token": agent_token, "token_notice": "Store this token securely. It is shown only once and is required to submit actions for this agent."}


@mcp.tool()
def get_match_state(match_id: str) -> dict[str, Any]:
    """Read the authoritative state of a shared match."""
    match = MATCHES.get(match_id)
    if not match:
        raise ValueError("Match not found")
    return _public(match)


@mcp.tool()
def submit_action(match_id: str, agent_id: str, agent_token: str, action: str) -> dict[str, Any]:
    """Submit one legal turn action. Requires the private token returned by join_match."""
    match = MATCHES.get(match_id)
    if not match:
        raise ValueError("Match not found")
    player = match["players"].get(agent_id)
    if not player:
        raise ValueError("Agent has not joined this match")
    supplied_hash = hashlib.sha256(agent_token.encode("utf-8")).hexdigest()
    if not secrets.compare_digest(player.get("token_hash", ""), supplied_hash):
        raise ValueError("Invalid agent token")
    if match["status"] != "running":
        raise ValueError("Match needs at least two agents")
    if action not in ACTIONS:
        raise ValueError("Unsupported action")
    if player.get("acted_turn") == match["turn"]:
        raise ValueError("Agent already acted this turn")
    pos = player["position"]
    target = {"move_north": pos-W, "move_south": pos+W, "move_west": pos-1, "move_east": pos+1}.get(action, pos)
    if action.startswith("move_"):
        if not 0 <= target < W*H or target in WALLS or (action == "move_west" and pos % W == 0) or (action == "move_east" and pos % W == W-1):
            raise ValueError("Illegal move")
        player["position"] = target
    elif action == "scavenge":
        player["food"] += 1
    elif action == "barricade":
        if player["wood"] < 1:
            player["wood"] += 1
        else:
            match["events"].append(f"{agent_id} reinforced a barricade")
    elif action == "attack":
        opponents = [p for p in match["players"].values() if p["role"] != player["role"] and abs(p["position"] % W - pos % W) + abs(p["position"] // W - pos // W) <= 1]
        if opponents:
            opponents[0]["health"] = max(0, opponents[0]["health"] - 1)
            if opponents[0]["health"] == 0:
                match["events"].append(f"{opponents[0]['agent_id']} was eliminated")
        else:
            match["events"].append(f"{agent_id} attacked but found no target")
    player["acted_turn"] = match["turn"]
    match["events"].append(f"{agent_id}: {action}")
    active = [p for p in match["players"].values() if p["health"] > 0]
    if active and all(p.get("acted_turn") == match["turn"] for p in active):
        match["turn"] += 1
    if not any(p["role"] == "survivor" and p["health"] > 0 for p in active) or not any(p["role"] == "infected" and p["health"] > 0 for p in active):
        match["status"] = "finished"
    return _public(match)


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    mcp.settings.host = "0.0.0.0"
    mcp.settings.port = port
    mcp.run(transport="streamable-http")

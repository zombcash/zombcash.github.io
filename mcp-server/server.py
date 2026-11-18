"""Authoritative ZombieCash Outbreak MCP game server.

The match contains a large survivor group and an expanding infected horde.
Each unit may move one tile or push one adjacent debris block per round.
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
W, H = 18, 14
HELI = {0, 17, 8 + 13 * W}
DIRECTIONS = {"north": (0, -1), "south": (0, 1), "west": (-1, 0), "east": (1, 0)}
ACTIONS = {f"move_{d}" for d in DIRECTIONS} | {f"push_{d}" for d in DIRECTIONS} | {"wait"}
HUMAN_NAMES = ["Mara", "Viktor", "Nix", "Ash", "June", "Rook", "Iris", "Milo", "Sable", "Kai", "Echo", "Dante", "Nova", "Finn", "Zara", "Wolf", "Pip", "Raven"]
ZOMBIE_NAMES = ["Alpha", "Brute", "Howler", "Stalker", "Crawler", "Warden"]


def _tile(x: int, y: int) -> int:
    return y * W + x


def _map() -> tuple[set[int], set[int], set[int]]:
    walls: set[int] = set()
    crates: set[int] = set()
    hazards: set[int] = set()
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            p = _tile(x, y)
            if (x % 5 == 2 and y % 4 != 1) or (y % 5 == 3 and x % 6 == 4):
                if p not in HELI:
                    walls.add(p)
    for y in range(H):
        walls.discard(_tile(8, y))
    for x in range(W):
        walls.discard(_tile(x, 6))
    for x, y in [(3, 2), (5, 9), (12, 3), (14, 10), (2, 11), (10, 8), (15, 5), (7, 3), (11, 12), (16, 8)]:
        p = _tile(x, y)
        if p not in walls and p not in HELI:
            crates.add(p)
    for x, y in [(4, 5), (13, 7), (6, 11), (15, 2)]:
        p = _tile(x, y)
        if p not in walls:
            hazards.add(p)
    return walls, crates, hazards


def _new_world() -> dict[str, Any]:
    walls, crates, hazards = _map()
    used: set[int] = set()
    humans = []
    human_cells = [_tile(x, y) for y in range(4) for x in range(W) if x < 7 or x > 10]
    for i, name in enumerate(HUMAN_NAMES):
        p = next(p for p in human_cells if p not in used and p not in walls and p not in crates and p not in HELI)
        used.add(p)
        humans.append({"id": f"H{i+1}", "name": name, "position": p, "alive": True, "escaped": False, "acted": False})
    zombies = []
    zombie_cells = [_tile(x, y) for y in range(9, H) for x in range(W) if x < 7 or x > 10]
    for i, name in enumerate(ZOMBIE_NAMES):
        p = next(p for p in zombie_cells if p not in used and p not in walls and p not in crates and p not in HELI)
        used.add(p)
        zombies.append({"id": f"Z{i+1}", "name": name, "position": p, "alive": True, "acted": False})
    return {"walls": sorted(walls), "crates": sorted(crates), "hazards": sorted(hazards), "helipads": sorted(HELI),
            "humans": humans, "zombies": zombies, "escaped": 0, "infected": 0}


def _public(match: dict[str, Any]) -> dict[str, Any]:
    world = match["world"]
    return {
        "match_id": match["id"], "turn": match["turn"], "status": match["status"],
        "controllers": [{"agent_id": p["agent_id"], "role": p["role"]} for p in match["players"].values()],
        "units": {
            "survivors": [{k: a[k] for k in ("id", "name", "position", "alive", "escaped", "acted")} for a in world["humans"]],
            "infected": [{k: a[k] for k in ("id", "name", "position", "alive", "acted")} for a in world["zombies"]],
        },
        "map": {"width": W, "height": H, "walls": world["walls"], "movable_obstacles": world["crates"],
                "hazards": world["hazards"], "helicopters": world["helipads"]},
        "score": {"escaped": world["escaped"], "infected": world["infected"],
                  "survivors_alive": sum(a["alive"] for a in world["humans"]),
                  "zombies_alive": sum(a["alive"] for a in world["zombies"])},
        "events": match["events"][-20:],
    }


def _distance(a: int, b: int) -> int:
    return abs(a % W - b % W) + abs(a // W - b // W)


@mcp.tool()
def create_match(name: str = "Zombie Outbreak") -> dict[str, Any]:
    """Create an 18x14 outbreak with 18 survivors, 6 infected, movable debris and helicopter extraction zones."""
    match_id = secrets.token_urlsafe(6)
    MATCHES[match_id] = {"id": match_id, "name": name[:48], "turn": 0, "status": "waiting",
                         "players": {}, "world": _new_world(), "events": ["Quarantine breached. 18 survivors, 6 infected."]}
    return _public(MATCHES[match_id])


@mcp.tool()
def join_match(match_id: str, agent_id: str, role: str) -> dict[str, Any]:
    """Join as the survivor or infected faction controller. The controller can command every unit on its side."""
    match = MATCHES.get(match_id)
    if not match:
        raise ValueError("Match not found")
    if role not in {"survivor", "infected"}:
        raise ValueError("role must be survivor or infected")
    if not agent_id or len(agent_id) > 48:
        raise ValueError("agent_id must be 1-48 characters")
    if agent_id in match["players"]:
        raise ValueError("Agent ID is already taken in this match")
    if len(match["players"]) >= MAX_PLAYERS:
        raise ValueError("Match is full")
    if match["status"] == "finished":
        raise ValueError("Match is finished")
    token = secrets.token_urlsafe(32)
    match["players"][agent_id] = {"agent_id": agent_id, "role": role,
                                  "token_hash": hashlib.sha256(token.encode()).hexdigest()}
    roles = {p["role"] for p in match["players"].values()}
    match["status"] = "running" if roles == {"survivor", "infected"} else "waiting"
    match["events"].append(f"{agent_id} joined as {role} controller")
    return {**_public(match), "agent_token": token,
            "token_notice": "Store this token securely. It is shown only once and is required to submit actions."}


@mcp.tool()
def get_match_state(match_id: str) -> dict[str, Any]:
    """Read the authoritative 18x14 map, all units, score and recent events."""
    match = MATCHES.get(match_id)
    if not match:
        raise ValueError("Match not found")
    return _public(match)


def _finish_if_needed(match: dict[str, Any]) -> None:
    world = match["world"]
    total = len(world["humans"])
    alive_humans = sum(a["alive"] for a in world["humans"])
    if world["escaped"] >= 10:
        match["status"] = "finished"
        match["events"].append("SURVIVORS WIN: evacuation threshold reached")
    elif alive_humans == 0 or world["infected"] >= 13:
        match["status"] = "finished"
        match["events"].append("OUTBREAK WINS: the horde consumed the evacuation zone")
    elif match["turn"] >= 32:
        match["status"] = "finished"
        match["events"].append("QUARANTINE COLLAPSED: turn limit reached")


@mcp.tool()
def submit_action(match_id: str, agent_id: str, agent_token: str, action: str, unit_id: str = "") -> dict[str, Any]:
    """Move one faction unit by one tile, push adjacent debris one tile, or wait. Optional unit_id selects a unit; otherwise the first ready unit is selected."""
    match = MATCHES.get(match_id)
    if not match:
        raise ValueError("Match not found")
    controller = match["players"].get(agent_id)
    if not controller:
        raise ValueError("Agent has not joined this match")
    supplied = hashlib.sha256(agent_token.encode()).hexdigest()
    if not secrets.compare_digest(controller["token_hash"], supplied):
        raise ValueError("Invalid agent token")
    if match["status"] != "running":
        raise ValueError("Match needs both faction controllers and must be running")
    if action not in ACTIONS:
        raise ValueError("Unsupported action")
    world = match["world"]
    side = world["humans"] if controller["role"] == "survivor" else world["zombies"]
    unit = next((a for a in side if a["id"] == unit_id), None) if unit_id else next((a for a in side if a["alive"] and not a["acted"]), None)
    if not unit or not unit["alive"]:
        raise ValueError("Unit not found or no longer active on your faction")
    if unit["acted"]:
        raise ValueError("Unit already acted this round")
    if action == "wait":
        unit["acted"] = True
        match["events"].append(f"{agent_id} ordered {unit['id']} to hold position")
    else:
        direction = action.split("_", 1)[1]
        dx, dy = DIRECTIONS[direction]
        x, y = unit["position"] % W, unit["position"] // W
        tx, ty = x + dx, y + dy
        if not (0 <= tx < W and 0 <= ty < H):
            raise ValueError("Illegal move: outside map")
        target = ty * W + tx
        if action.startswith("push_"):
            if target not in world["crates"]:
                raise ValueError("No movable obstacle adjacent in that direction")
            beyond_x, beyond_y = tx + dx, ty + dy
            if not (0 <= beyond_x < W and 0 <= beyond_y < H):
                raise ValueError("Cannot push obstacle outside map")
            beyond = beyond_y * W + beyond_x
            occupied = any(a["alive"] and a["position"] == beyond for a in world["humans"] + world["zombies"])
            if beyond in world["walls"] or beyond in world["crates"] or beyond in world["helipads"] or occupied:
                raise ValueError("Obstacle destination is blocked")
            world["crates"].remove(target)
            world["crates"].append(beyond)
            unit["acted"] = True
            match["events"].append(f"{unit['id']} pushed debris from {target} to {beyond}")
        else:
            if target in world["walls"] or target in world["crates"]:
                raise ValueError("Illegal move: blocked tile")
            opponent_side = world["zombies"] if controller["role"] == "survivor" else world["humans"]
            victim = next((a for a in opponent_side if a["alive"] and a["position"] == target), None)
            if victim:
                if controller["role"] != "infected":
                    raise ValueError("Tile occupied by another faction")
                victim["alive"] = False
                world["infected"] += 1
                new_id = f"Z{len(world['zombies'])+1}"
                world["zombies"].append({"id": new_id, "name": victim["name"] + " · turned",
                                         "position": target, "alive": True, "acted": False})
                match["events"].append(f"{victim['name']} was infected and joined the horde")
            elif any(a["alive"] and a["position"] == target for a in side):
                raise ValueError("Tile occupied by an ally")
            else:
                unit["position"] = target
            if controller["role"] == "survivor" and target in world["helipads"]:
                unit["alive"] = False
                unit["escaped"] = True
                world["escaped"] += 1
                match["events"].append(f"{unit['name']} escaped by helicopter")
            unit["acted"] = True
            match["events"].append(f"{unit['id']}: {action}")
    active = [a for a in world["humans"] + world["zombies"] if a["alive"]]
    if active and all(a["acted"] for a in active):
        match["turn"] += 1
        for actor in active:
            actor["acted"] = False
        match["events"].append(f"Round {match['turn']} begins")
    _finish_if_needed(match)
    return _public(match)


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    mcp.settings.host = "0.0.0.0"
    mcp.settings.port = port
    mcp.run(transport="streamable-http")

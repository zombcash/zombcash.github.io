import importlib.util
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "mcp-server"))
spec = importlib.util.spec_from_file_location("zombcash_mcp_server", ROOT / "mcp-server" / "server.py")
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)


class OutbreakServerTests(unittest.TestCase):
    def setUp(self):
        server.MATCHES.clear()

    def setup_match(self):
        created = server.create_match("QA outbreak")
        match_id = created["match_id"]
        survivor = server.join_match(match_id, "survivor-controller", "survivor")
        infected = server.join_match(match_id, "infected-controller", "infected")
        return match_id, survivor, infected

    def test_create_large_world_and_join_factions(self):
        match_id, survivor, infected = self.setup_match()
        state = server.get_match_state(match_id)
        self.assertEqual(state["status"], "running")
        self.assertEqual(state["map"]["width"], 18)
        self.assertEqual(state["map"]["height"], 14)
        self.assertEqual(len(state["units"]["survivors"]), 18)
        self.assertEqual(len(state["units"]["infected"]), 6)
        self.assertTrue(survivor["agent_token"])
        self.assertTrue(infected["agent_token"])

    def test_reject_invalid_role_action_and_token(self):
        match_id = server.create_match()["match_id"]
        with self.assertRaises(ValueError):
            server.join_match(match_id, "bad-agent", "neutral")
        survivor = server.join_match(match_id, "survivor-1", "survivor")
        server.join_match(match_id, "infected-1", "infected")
        with self.assertRaises(ValueError):
            server.submit_action(match_id, "survivor-1", survivor["agent_token"], "teleport")
        with self.assertRaises(ValueError):
            server.submit_action(match_id, "survivor-1", "wrong-token", "wait", "H1")

    def test_unit_moves_one_tile_and_cannot_act_twice(self):
        match_id, survivor, _ = self.setup_match()
        # H6 starts at x=6, y=0; east is an open adjacent tile.
        state = server.submit_action(match_id, "survivor-controller", survivor["agent_token"], "move_east", "H6")
        unit = next(a for a in state["units"]["survivors"] if a["id"] == "H7")
        self.assertEqual(unit["position"], 7)
        self.assertTrue(unit["acted"])
        with self.assertRaises(ValueError):
            server.submit_action(match_id, "survivor-controller", survivor["agent_token"], "wait", "H7")

    def test_infected_contact_converts_human(self):
        match_id, _, infected = self.setup_match()
        match = server.MATCHES[match_id]
        human = next(a for a in match["world"]["humans"] if a["id"] == "H1")
        zombie = next(a for a in match["world"]["zombies"] if a["id"] == "Z1")
        human["position"] = server._tile(4, 5)
        zombie["position"] = server._tile(3, 5)
        match["world"]["walls"] = [p for p in match["world"]["walls"] if p not in (server._tile(4, 5), server._tile(3, 5))]
        match["world"]["crates"] = [p for p in match["world"]["crates"] if p not in (server._tile(4, 5), server._tile(3, 5))]
        state = server.submit_action(match_id, "infected-controller", infected["agent_token"], "move_east", "Z1")
        self.assertEqual(state["score"]["infected"], 1)
        self.assertEqual(state["score"]["survivors_alive"], 17)
        self.assertEqual(len(state["units"]["infected"]), 7)

    def test_obstacle_can_be_pushed_one_tile(self):
        match_id, survivor, _ = self.setup_match()
        match = server.MATCHES[match_id]
        unit = next(a for a in match["world"]["humans"] if a["id"] == "H1")
        unit["position"] = 100
        match["world"]["crates"] = [101]
        match["world"]["walls"] = [p for p in match["world"]["walls"] if p not in (100, 101, 102)]
        state = server.submit_action(match_id, "survivor-controller", survivor["agent_token"], "push_east", "H1")
        self.assertIn(102, state["map"]["movable_obstacles"])
        self.assertNotIn(101, state["map"]["movable_obstacles"])
        self.assertEqual(unit["position"], 100)

    def test_survivor_escapes_by_helicopter(self):
        match_id, survivor, _ = self.setup_match()
        match = server.MATCHES[match_id]
        unit = next(a for a in match["world"]["humans"] if a["id"] == "H1")
        unit["position"] = server._tile(1, 0)
        match["world"]["walls"] = [p for p in match["world"]["walls"] if p != 0]
        state = server.submit_action(match_id, "survivor-controller", survivor["agent_token"], "move_west", "H1")
        self.assertEqual(state["score"]["escaped"], 1)
        self.assertFalse(next(a for a in state["units"]["survivors"] if a["id"] == "H1")["alive"])


if __name__ == "__main__":
    unittest.main()

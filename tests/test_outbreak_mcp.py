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

    def test_create_join_and_read_match(self):
        created = server.create_match("QA match")
        match_id = created["match_id"]
        server.join_match(match_id, "survivor-1", "survivor")
        state = server.join_match(match_id, "infected-1", "infected")
        self.assertEqual(state["status"], "running")
        self.assertEqual(len(state["players"]), 2)
        self.assertEqual(server.get_match_state(match_id)["turn"], 0)

    def test_reject_invalid_role_and_action(self):
        match_id = server.create_match()["match_id"]
        with self.assertRaises(ValueError):
            server.join_match(match_id, "bad-agent", "neutral")
        server.join_match(match_id, "survivor-1", "survivor")
        server.join_match(match_id, "infected-1", "infected")
        with self.assertRaises(ValueError):
            server.submit_action(match_id, "survivor-1", "teleport")

    def test_each_agent_can_act_once_per_turn(self):
        match_id = server.create_match()["match_id"]
        server.join_match(match_id, "survivor-1", "survivor")
        server.join_match(match_id, "infected-1", "infected")
        server.submit_action(match_id, "survivor-1", "wait")
        with self.assertRaises(ValueError):
            server.submit_action(match_id, "survivor-1", "wait")
        state = server.submit_action(match_id, "infected-1", "wait")
        self.assertEqual(state["turn"], 1)

    def test_illegal_move_does_not_change_position(self):
        match_id = server.create_match()["match_id"]
        server.join_match(match_id, "survivor-1", "survivor")
        server.join_match(match_id, "infected-1", "infected")
        before = server.get_match_state(match_id)["players"][0]["position"]
        with self.assertRaises(ValueError):
            server.submit_action(match_id, "survivor-1", "move_west")
        after = server.get_match_state(match_id)["players"][0]["position"]
        self.assertEqual(before, after)


if __name__ == "__main__":
    unittest.main()

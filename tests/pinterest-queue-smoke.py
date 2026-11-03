import copy
import importlib.util
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

SCRIPT = Path("scripts/export_pinterest_queue.py")
spec = importlib.util.spec_from_file_location("pinterest_queue", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def sample_item():
    return {
        "id": "ZOMBCASH/1234:0",
        "image": "https://cdn4.telesco.pe/file/example.jpg",
        "rights_status": "permission-confirmed",
        "alt_review_status": "visual-reviewed",
        "pinterest_board_id": "zombcash-board-1",
        "pinterest_board_category": "zombie-memes",
        "category_ids": ["zombie-memes"],
        "pinterest_title": "Zombie Cash After Dark",
        "pinterest_description": "A zombie meme from the ZombieCash community gallery.",
        "pinterest_alt": "A cartoon zombie checks a glowing chart in a dark room.",
        "pinterest_destination_url": "https://zombcash.github.io/gallery.html#gallery-image-1234-0",
        "pinterest_status": "ready",
        "anchor_id": "gallery-image-1234-0",
    }


valid = module.build_queue({"items": [sample_item()]})
assert valid["eligible_count"] == 1 and valid["blocked_count"] == 0

published_item = sample_item()
published_item.update({
    "pinterest_status": "published",
    "pinterest_pin_id": "620441286210443503",
    "pinterest_pin_url": "https://ch.pinterest.com/pin/620441286210443503/",
    "pinterest_published_at": "2026-11-03T21:36:57",
    "pinterest_published_destination": "https://t.me/ZOMBCASH/3583",
})
published_result = module.build_queue({"items": [published_item]})
assert published_result["published_count"] == 1
assert published_result["eligible_count"] == 0 and published_result["blocked_count"] == 0
assert published_result["published"][0]["pin_id"] == "620441286210443503"
pin = valid["eligible"][0]
assert pin["canonical_url"] == sample_item()["pinterest_destination_url"]
tracking = urlsplit(pin["destination_url"])
tracking_query = parse_qs(tracking.query)
assert tracking_query.get("utm_source") == ["pinterest"]
assert tracking_query.get("utm_medium") == ["social"]
assert tracking_query.get("utm_campaign") == ["undead_reach_2026"]
assert tracking_query.get("utm_content") == ["ZOMBCASH-1234-0"]
assert tracking.fragment == "gallery-image-1234-0"

gates = [
    ("rights_status", "review-required", "rights-review-required"),
    ("alt_review_status", "caption-derived-pending-visual-review", "visual-alt-review-required"),
    ("pinterest_board_id", None, "pinterest-board-not-assigned"),
    ("pinterest_board_category", "nightmare-horror", "invalid-board-category"),
    ("pinterest_title", "x" * 101, "pin-title-too-long"),
    ("pinterest_description", "x" * 501, "pin-description-too-long"),
    ("pinterest_alt", "x" * 501, "pin-alt-too-long"),
    ("pinterest_destination_url", "https://zombcash.github.io/gallery.html#wrong-anchor", "invalid-canonical-destination"),
    ("pinterest_status", "blocked-rights-review", "pin-not-approved"),
]

for field, value, expected_reason in gates:
    item = sample_item()
    item[field] = value
    result = module.build_queue({"items": [item]})
    assert result["eligible_count"] == 0
    assert expected_reason in result["blocked"][0]["reasons"], (field, result["blocked"][0]["reasons"])

duplicate = sample_item()
try:
    module.build_queue({"items": [duplicate, copy.deepcopy(duplicate)]})
except ValueError:
    pass
else:
    raise AssertionError("Duplicate gallery image IDs must fail closed")

print("Pinterest rights, ALT, board, metadata and stable-anchor gates passed.")

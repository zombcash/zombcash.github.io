#!/usr/bin/env python3
import json
from pathlib import Path

data = json.loads(Path("gallery-data.json").read_text(encoding="utf-8"))
items = data["items"]
ids = [item["id"] for item in items]

assert data.get("schema_version") == 2
assert len(items) == 50, f"Expected 50 current archive items, got {len(items)}"
assert len(set(ids)) == 50, "Duplicate gallery item IDs"
for required in ("ZOMBCASH/4176:0", "ZOMBCASH/4165:0", "ZOMBCASH/4146:0", "ZOMBCASH/4125:0"):
    assert required in ids, f"Required current/archive item missing: {required}"

assert all(item.get("rights_status") == "review-required" for item in items), "Rights review must remain required for every item"
reviewed = [item for item in items if item.get("alt_review_status") == "visual-reviewed"]
assert len(reviewed) == 50, f"Expected all 50 current items visually reviewed, got {len(reviewed)}"
methods = {item.get("alt_review_method") for item in reviewed}
assert methods == {"manual-visual-review", "manual-contact-sheet-review"}, methods
assert sum(item.get("alt_review_method") == "manual-visual-review" for item in reviewed) == 4
assert sum(item.get("alt_review_method") == "manual-contact-sheet-review" for item in reviewed) == 46
for item in reviewed:
    assert item.get("alt_text", "").strip(), f"Missing reviewed ALT text: {item['id']}"
    assert item.get("image_width") == 800 and item.get("image_height") == 800, f"Unexpected reviewed dimensions: {item['id']}"

individual = {item["id"] for item in reviewed if item.get("alt_review_method") == "manual-visual-review"}
assert individual == {"ZOMBCASH/4146:0", "ZOMBCASH/4125:0", "ZOMBCASH/4176:0", "ZOMBCASH/4165:0"}, individual

unreviewed = [item for item in items if item.get("alt_review_status") != "visual-reviewed"]
assert len(unreviewed) == 0, f"All current archive images should now have visual ALT review, got {len(unreviewed)}"
assert {item["id"] for item in unreviewed} == set()
assert all(item.get("rights_status") == "review-required" for item in unreviewed)

statuses = {item.get("pinterest_status") for item in items if item.get("pinterest_status")}
assert statuses <= {"published", "blocked-rights-review"}, f"Unexpected Pinterest queue state: {statuses}"
assert not any(item.get("pinterest_status") in {"queued", "pending", "scheduled"} for item in items)
published = [item for item in items if item.get("pinterest_status") == "published"]
assert all(item.get("pinterest_pin_id") and item.get("pinterest_pin_url") for item in published), "Published pin record lacks historical pin identifiers"

print("PASS: 50 current archive items preserved; all 50 have visual ALT review (46 contact-sheet, 4 individual); all rights remain review-required; no Pinterest queue entries.")

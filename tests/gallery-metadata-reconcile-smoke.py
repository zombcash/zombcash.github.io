#!/usr/bin/env python3
import json
from pathlib import Path

data = json.loads(Path("gallery-data.json").read_text(encoding="utf-8"))
items = data["items"]
ids = [item["id"] for item in items]

assert data.get("schema_version") == 2
assert 1 <= len(items) <= 150, f"Expected 1–150 current gallery items, got {len(items)}"
assert len(set(ids)) == len(items), "Duplicate gallery item IDs"
for required in ("ZOMBCASH/4176:0", "ZOMBCASH/4165:0", "ZOMBCASH/4146:0", "ZOMBCASH/4125:0"):
    assert required in ids, f"Required current/archive item missing: {required}"

assert all(item.get("rights_status") == "review-required" for item in items), "Rights review must remain required for every item"
reviewed = [item for item in items if item.get("alt_review_status") == "visual-reviewed"]
pending = [item for item in items if item.get("alt_review_status") == "pending-review"]
assert len(reviewed) + len(pending) == len(items), "Every item must have an explicit ALT review state"
methods = {item.get("alt_review_method") for item in reviewed}
assert methods <= {"manual-visual-review", "manual-contact-sheet-review"}, methods
for item in reviewed:
    assert item.get("alt_text", "").strip(), f"Missing reviewed ALT text: {item['id']}"
    assert item.get("image_width") == 800 and item.get("image_height") == 800, f"Unexpected reviewed dimensions: {item['id']}"
for item in pending:
    assert item.get("alt_review_method") == "not-reviewed", f"Pending item has an invalid review method: {item['id']}"
    assert item.get("pinterest_status") == "blocked-rights-review", f"Unreviewed item is not blocked from Pinterest: {item['id']}"

for item in items:
    width = item.get("image_width")
    height = item.get("image_height")
    assert isinstance(width, int) and 0 < width <= 10000, f"Missing/invalid intrinsic image width: {item['id']}"
    assert isinstance(height, int) and 0 < height <= 10000, f"Missing/invalid intrinsic image height: {item['id']}"

statuses = {item.get("pinterest_status") for item in items if item.get("pinterest_status")}
assert statuses <= {"published", "blocked-rights-review"}, f"Unexpected Pinterest queue state: {statuses}"
assert not any(item.get("pinterest_status") in {"queued", "pending", "scheduled"} for item in items)
published = [item for item in items if item.get("pinterest_status") == "published"]
assert all(item.get("pinterest_pin_id") and item.get("pinterest_pin_url") for item in published), "Published pin record lacks historical pin identifiers"

print(f"PASS: {len(items)} gallery items preserved; {len(reviewed)} ALT-reviewed, {len(pending)} pending; all items have intrinsic dimensions; rights review remains required; {len(published)} historical Pinterest pins retained and all other items remain blocked from Pinterest pending rights review.")

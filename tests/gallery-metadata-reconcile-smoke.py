#!/usr/bin/env python3
import json
import re
from pathlib import Path

data = json.loads(Path("gallery-data.json").read_text(encoding="utf-8"))
items = data["items"]
ids = [item["id"] for item in items]

assert data.get("schema_version") == 2
assert 1 <= len(items) <= 150, f"Expected 1–150 current gallery items, got {len(items)}"
assert len(set(ids)) == len(items), "Duplicate gallery item IDs"

def normalize_editorial_text(value):
    return re.sub(r"[\\W_]+", " ", str(value or "").lower(), flags=re.UNICODE).strip()

for item in items:
    description = normalize_editorial_text(item.get("description"))
    caption = normalize_editorial_text(item.get("caption"))
    title = normalize_editorial_text(item.get("title"))
    assert not description or (
        description != caption
        and description != title
        and not caption.startswith(description)
        and not description.startswith(caption)
        and not title.startswith(description)
        and not description.startswith(title)
    ), f"Description duplicates title/caption: {item['id']}"
# The Telegram archive is intentionally rolling: the sync keeps up to
# MAX_PER_CATEGORY newest images per recurring series. Do not pin old post IDs
# here, because a valid older post will eventually age out of that window.
sync_script = (Path(__file__).resolve().parents[1] / "scripts/sync_gallery.py").read_text(encoding="utf-8")
limit_match = re.search(r"^MAX_PER_CATEGORY\s*=\s*(\d+)", sync_script, re.M)
assert limit_match, "Gallery sync must declare its per-series rolling archive limit"
per_category_limit = int(limit_match.group(1))
patterns = {
    "nightmare-horror": re.compile(r"\bNIGHTMARE\s+DROP\b", re.I),
    "zombie-memes": re.compile(r"\bZOMBIE\s+MEME(?:\s+OF\s+THE\s+HOUR)?\b", re.I),
    "undead-after-dark": re.compile(r"\bUNDEAD\s+AFTER\s+DARK\b", re.I),
}
category_counts = {category: 0 for category in patterns}
for item in items:
    caption = str(item.get("caption") or "")
    matches = [category for category, pattern in patterns.items() if pattern.search(caption)]
    assert len(matches) == 1, f"Gallery item must match exactly one primary series: {item['id']}"
    category_counts[matches[0]] += 1
assert all(count > 0 for count in category_counts.values()), f"Expected current artwork in each primary series: {category_counts}"
assert all(count <= per_category_limit for count in category_counts.values()), f"Rolling archive exceeded per-series limit {per_category_limit}: {category_counts}"

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

print(f"PASS: {len(items)} gallery items follow the rolling archive policy ({category_counts}); {len(reviewed)} ALT-reviewed, {len(pending)} pending; all items have intrinsic dimensions; rights review remains required; {len(published)} historical Pinterest pins retained and all other items remain blocked from Pinterest pending rights review.")

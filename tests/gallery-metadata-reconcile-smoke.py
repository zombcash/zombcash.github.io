#!/usr/bin/env python3
import json
import re
from pathlib import Path

data = json.loads(Path("gallery-data.json").read_text(encoding="utf-8"))
items = data["items"]
ids = [item["id"] for item in items]

assert data.get("schema_version") == 2
assert 1 <= len(items), f"Expected a non-empty full gallery archive, got {len(items)}"
assert len(set(ids)) == len(items), "Duplicate gallery item IDs"

def normalize_editorial_text(value):
    return re.sub(r"[\W_]+", " ", str(value or "").lower(), flags=re.UNICODE).strip()

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
# Keep the full Telegram archive so the frontend can paginate it in 200-image batches.
sync_script = (Path(__file__).resolve().parents[1] / "scripts/sync_gallery.py").read_text(encoding="utf-8")
assert re.search(r"^PAGE_SIZE\\s*=\\s*200$", sync_script, re.M), "Gallery pages must contain 200 images"
dates = [str(item.get("date") or "") for item in items]
assert dates == sorted(dates, reverse=True), "Gallery archive must be sorted newest first"
patterns = {
    "nightmare-horror": re.compile(r"\bNIGHTMARE\s+DROP\b", re.I),
    "zombie-memes": re.compile(r"\bZOMBIE\s+MEME(?:\s+OF\s+THE\s+HOUR)?\b", re.I),
    "undead-after-dark": re.compile(r"\bUNDEAD\s+AFTER\s+DARK\b", re.I),
}
registered_categories = set(re.findall(r'^\s*"([^"]+)":\s*re\.compile', sync_script, re.M))
category_counts = {}
for item in items:
    caption = str(item.get("caption") or "")
    category_ids = item.get("category_ids") or []
    assert len(category_ids) == 1, f"Gallery item must have exactly one category: {item['id']}"
    category = category_ids[0]
    assert category != "site-transmissions", f"Removed Site Transmissions item returned: {item['id']}"
    assert category in registered_categories, f"Unregistered gallery category: {category}"
    assert item.get("series") == category, f"Series/category mismatch: {item['id']}"
    category_counts[category] = category_counts.get(category, 0) + 1
    assert not re.search(r"\bZOMBIECASH\s+SITE\s+TRANSMISSION\b", caption, re.I), f"Site screenshot returned: {item['id']}"
assert sum(category_counts.values()) == len(items), "Every archived image must belong to exactly one category"
assert not re.search(r'"site-transmissions"\s*:', sync_script), "Removed Site Transmissions category must not be registered in sync rules"
assert re.search(r"ZOMBIECASH\\s\+SITE\\s\+TRANSMISSION", sync_script), "Site screenshot posts must be explicitly excluded from future sync"

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

print(f"PASS: {len(items)} gallery items follow the full archive with 200-image pages ({category_counts}); {len(reviewed)} ALT-reviewed, {len(pending)} pending; all items have intrinsic dimensions; rights review remains required; {len(published)} historical Pinterest pins retained and all other items remain blocked from Pinterest pending rights review.")

#!/usr/bin/env python3
"""Build a safe Pinterest export queue; never publishes pins."""
import json
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "gallery-data.json"
OUTPUT_PATH = ROOT / "pinterest-queue.json"
LEDGER_PATH = ROOT / "pinterest-published-ledger.json"
APPROVED_RIGHTS = {"project-owned", "permission-confirmed"}
APPROVED_ALT = {"visual-reviewed"}
CANONICAL_PREFIX = "https://zombcash.github.io/gallery.html#"


def pinterest_tracking_url(canonical_url, stable_id):
    parts = urlsplit(canonical_url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query.update({
        "utm_source": "pinterest",
        "utm_medium": "social",
        "utm_campaign": "undead_reach_2026",
        "utm_content": stable_id.replace("/", "-").replace(":", "-"),
    })
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def build_queue(data, ledger=None):
    items = data.get("items", [])
    ledger = ledger or {"pins": []}
    ledger_items = ledger.get("pins", [])
    ledger_by_id = {}
    for entry in ledger_items:
        gallery_id = str(entry.get("gallery_id") or "")
        if not gallery_id or gallery_id in ledger_by_id:
            raise ValueError("Pinterest publication ledger IDs must be present and unique")
        if not entry.get("pin_id") or not entry.get("board_id") or not entry.get("pin_url"):
            raise ValueError(f"Pinterest ledger entry {gallery_id} is missing Pin/board metadata")
        ledger_by_id[gallery_id] = entry
    eligible = []
    blocked = []
    published = []
    seen_ids = set()
    seen_images = set()

    for item in items:
        stable_id = str(item.get("id") or "")
        image = str(item.get("image") or "")
        reasons = []

        if not stable_id or stable_id in seen_ids:
            raise ValueError("Gallery IDs must be present and unique")
        if not image or image in seen_images:
            raise ValueError("Gallery image URLs must be present and unique")
        seen_ids.add(stable_id)
        seen_images.add(image)

        if stable_id in ledger_by_id:
            entry = ledger_by_id[stable_id]
            published.append({
                "id": stable_id,
                "pin_id": str(entry["pin_id"]),
                "pin_url": str(entry["pin_url"]),
                "board_id": str(entry["board_id"]),
                "published_at": entry.get("published_at"),
                "destination_url": entry.get("original_destination_url"),
            })
            continue
        if item.get("pinterest_status") == "published":
            raise ValueError(f"Gallery item {stable_id} is marked published but missing from the durable Pinterest ledger")

        if item.get("rights_status") not in APPROVED_RIGHTS:
            reasons.append("rights-review-required")
        if item.get("alt_review_status") not in APPROVED_ALT:
            reasons.append("visual-alt-review-required")
        if not item.get("pinterest_board_id"):
            reasons.append("pinterest-board-not-assigned")
        if item.get("pinterest_board_category") not in (item.get("category_ids") or []):
            reasons.append("invalid-board-category")
        pin_title = str(item.get("pinterest_title") or "").strip()
        pin_description = str(item.get("pinterest_description") or "").strip()
        pin_alt = str(item.get("pinterest_alt") or "").strip()
        if not pin_title:
            reasons.append("missing-pin-title")
        elif len(pin_title) > 100:
            reasons.append("pin-title-too-long")
        if not pin_description:
            reasons.append("missing-pin-description")
        elif len(pin_description) > 500:
            reasons.append("pin-description-too-long")
        if not pin_alt:
            reasons.append("missing-pin-alt")
        elif len(pin_alt) > 500:
            reasons.append("pin-alt-too-long")
        if not image.startswith("https://"):
            reasons.append("image-url-not-https")
        destination = str(item.get("pinterest_destination_url") or "")
        anchor_id = str(item.get("anchor_id") or "")
        expected_destination = CANONICAL_PREFIX + anchor_id if anchor_id else ""
        if not anchor_id or destination != expected_destination:
            reasons.append("invalid-canonical-destination")
        if item.get("pinterest_status") != "ready":
            reasons.append("pin-not-approved")

        if reasons:
            blocked.append({"id": stable_id, "status": "blocked", "reasons": reasons})
        else:
            eligible.append({
                "id": stable_id,
                "title": pin_title,
                "description": pin_description,
                "alt_text": pin_alt,
                "image_url": image,
                "canonical_url": destination,
                "destination_url": pinterest_tracking_url(destination, stable_id),
                "board_id": str(item["pinterest_board_id"]),
                "category_id": item.get("pinterest_board_category"),
            })

    return {
        "schema_version": 1,
        "source": "gallery-data.json",
        "ledger_total_count": len(ledger_items),
        "published_count": len(published),
        "eligible_count": len(eligible),
        "blocked_count": len(blocked),
        "published": published,
        "eligible": eligible,
        "blocked": blocked,
    }


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    ledger = json.loads(LEDGER_PATH.read_text(encoding="utf-8")) if LEDGER_PATH.is_file() else {"pins": []}
    queue = build_queue(data, ledger)
    OUTPUT_PATH.write_text(json.dumps(queue, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Pinterest inventory: {queue['published_count']} already published, {queue['eligible_count']} eligible, {queue['blocked_count']} blocked. No new pins were published.")


if __name__ == "__main__":
    main()

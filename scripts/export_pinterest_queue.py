#!/usr/bin/env python3
"""Build a safe Pinterest export queue; never publishes pins."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "gallery-data.json"
OUTPUT_PATH = ROOT / "pinterest-queue.json"
APPROVED_RIGHTS = {"project-owned", "permission-confirmed"}
APPROVED_ALT = {"visual-reviewed"}
CANONICAL_PREFIX = "https://zombcash.github.io/gallery.html#"


def build_queue(data):
    items = data.get("items", [])
    eligible = []
    blocked = []
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
                "destination_url": destination,
                "board_id": str(item["pinterest_board_id"]),
                "category_id": item.get("pinterest_board_category"),
            })

    return {
        "schema_version": 1,
        "source": "gallery-data.json",
        "eligible_count": len(eligible),
        "blocked_count": len(blocked),
        "eligible": eligible,
        "blocked": blocked,
    }


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    queue = build_queue(data)
    OUTPUT_PATH.write_text(json.dumps(queue, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Pinterest queue: {queue['eligible_count']} eligible, {queue['blocked_count']} blocked. No pins were published.")


if __name__ == "__main__":
    main()

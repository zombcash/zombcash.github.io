#!/usr/bin/env python3
"""Sync recent public image posts from @ZOMBCASH into the static site gallery."""
import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

CHANNEL = "ZOMBCASH"
BASE_URL = f"https://t.me/s/{CHANNEL}"
OUTPUT = Path("gallery-data.json")
MAX_PAGES = 100
MAX_ITEMS = 50

# The gallery is an artwork archive, not a general feed. Keep only the three
# recurring visual series and continue paging backward until we have 50 images.
def is_gallery_artwork(caption):
    text = str(caption or "")
    return bool(
        re.search(r"\bNIGHTMARE\s+DROP\b", text, re.I)
        or re.search(r"\bZOMBIE\s+MEME(?:\s+OF\s+THE\s+HOUR)?\b", text, re.I)
        or re.search(r"\bUNDEAD\s+AFTER\s+DARK\b", text, re.I)
    )
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ZombieCashGalleryBot/1.0)"}


def image_urls(message):
    found = []
    for node in message.select(".tgme_widget_message_photo_wrap, .tgme_widget_message_video_thumb"):
        style = node.get("style", "")
        match = re.search(r"background-image\s*:\s*url\(['\"]?(.*?)['\"]?\)", style, re.I)
        if match:
            url = urljoin("https://t.me", match.group(1))
            if url.startswith("https://") and url not in found:
                found.append(url)
    for node in message.select(".tgme_widget_message_photo img, .tgme_widget_message_video_thumb img"):
        src = node.get("src") or node.get("data-src")
        if src and src.startswith("https://") and src not in found:
            found.append(src)
    return found


def parse_page(html):
    soup = BeautifulSoup(html, "html.parser")
    nodes = soup.select(".tgme_widget_message[data-post]")
    messages = []
    numeric_ids = []
    for node in nodes:
        post_id = node.get("data-post", "")
        match = re.search(r"/(\d+)$", post_id)
        if match:
            numeric_ids.append(int(match.group(1)))
        text_node = node.select_one(".tgme_widget_message_text")
        caption = text_node.get_text(" ", strip=True) if text_node else ""
        urls = image_urls(node)
        if not urls:
            continue
        date_node = node.select_one(".tgme_widget_message_date time")
        date = date_node.get("datetime") if date_node else None
        post_link = f"https://t.me/{post_id}" if post_id else f"https://t.me/{CHANNEL}"
        for index, image in enumerate(urls):
            messages.append({"id": f"{post_id}:{index}", "image": image, "caption": caption or "ZombieCash AI-generated artwork", "post_url": post_link, "date": date, "post_id": post_id})
    return messages, min(numeric_ids) if numeric_ids else None


def main():
    session = requests.Session()
    session.headers.update(HEADERS)
    all_items = {}
    before = None
    for _ in range(MAX_PAGES):
        response = session.get(BASE_URL, params={"before": before} if before else None, timeout=25)
        response.raise_for_status()
        items, oldest_id = parse_page(response.text)
        for item in items:
            if is_gallery_artwork(item.get("caption")):
                all_items[item["id"]] = item
        if len(all_items) >= MAX_ITEMS or not oldest_id or oldest_id <= 1:
            break
        next_before = oldest_id
        if before == next_before:
            break
        before = next_before
        time.sleep(0.35)
    items = sorted(all_items.values(), key=lambda item: (item.get("date") or "", item.get("post_id") or ""), reverse=True)[:MAX_ITEMS]

    # Preserve editorial metadata across scheduled Telegram syncs. The source
    # caption/image/post fields remain authoritative; enrichment fields survive
    # only when the stable Telegram image ID matches.
    previous = {}
    if OUTPUT.exists():
        try:
            old_payload = json.loads(OUTPUT.read_text(encoding="utf-8"))
            previous = {
                str(entry.get("id")): entry
                for entry in old_payload.get("items", [])
                if isinstance(entry, dict) and entry.get("id")
            }
        except (OSError, json.JSONDecodeError, AttributeError):
            previous = {}

    editorial_fields = (
        "title", "description", "alt_text", "category_ids", "series",
        "tags", "language", "credit", "rights_status", "alt_review_status", "localized",
        "metadata_version", "slug", "anchor_id", "pinterest_status", "pinterest_board_id",
        "pinterest_board_category", "pinterest_title", "pinterest_description", "pinterest_alt",
        "pinterest_destination_url",
    )
    for item in items:
        old = previous.get(str(item.get("id")), {})
        for field in editorial_fields:
            if field in old:
                item[field] = old[field]

        caption = str(item.get("caption") or "")
        if not item.get("series") or not item.get("category_ids"):
            if re.search(r"\bNIGHTMARE\s+DROP\b", caption, re.I):
                item.setdefault("series", "nightmare-drop")
                item.setdefault("category_ids", ["nightmare-horror"])
            elif re.search(r"\bUNDEAD\s+AFTER\s+DARK\b", caption, re.I):
                item.setdefault("series", "undead-after-dark")
                item.setdefault("category_ids", ["undead-after-dark"])
            elif re.search(r"\bZOMBIE\s+MEME(?:\s+OF\s+THE\s+HOUR)?\b", caption, re.I):
                categories = ["zombie-memes"]
                if re.search(r"\b(portfolio|trading|charts?|market|crypto|token|bags|candles|rug pull)\b", caption, re.I):
                    categories.append("crypto-apocalypse")
                item.setdefault("series", "zombie-meme")
                item.setdefault("category_ids", categories)
        item.setdefault("tags", list(dict.fromkeys(
            tag.lower() for tag in re.findall(r"#([\w]+)", caption, flags=re.UNICODE)
        )))
        item.setdefault("language", "en")
        item.setdefault("credit", "@ZOMBCASH")
        item.setdefault("rights_status", "review-required")
        item.setdefault("alt_review_status", "caption-derived-pending-visual-review")
        item.setdefault("metadata_version", 1)
        stable_id = str(item.get("id") or "")
        stable_match = re.fullmatch(r"ZOMBCASH/(\\d+):(\\d+)", stable_id)
        if stable_match:
            message_id, media_index = stable_match.groups()
            item.setdefault("slug", f"gallery-{message_id}-{media_index}")
            item.setdefault("anchor_id", f"gallery-image-{message_id}-{media_index}")
            item.setdefault("pinterest_status", "blocked-rights-review")
            item.setdefault("pinterest_board_id", None)
            item.setdefault("pinterest_board_category", (item.get("category_ids") or [None])[0])
            item.setdefault("pinterest_title", item.get("title") or caption[:80])
            item.setdefault("pinterest_description", item.get("description") or caption)
            item.setdefault("pinterest_alt", item.get("alt_text") or ("ZombieCash gallery artwork accompanying the story: " + caption))
            item.setdefault("pinterest_destination_url", "https://zombcash.github.io/gallery.html#" + item["anchor_id"])

    payload = {
        "source": f"https://t.me/{CHANNEL}",
        "updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "schema_version": 2,
        "items": items,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Synced {len(items)} image entries from @{CHANNEL} into {OUTPUT} (limit: {MAX_ITEMS})")


if __name__ == "__main__":
    main()

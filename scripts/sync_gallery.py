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


def jpeg_dimensions(url):
    """Read JPEG dimensions from the header so new gallery cards reserve space."""
    try:
        response = requests.get(url, headers=HEADERS, timeout=20, stream=True)
        response.raise_for_status()
        data = response.raw.read(200_000)
    except requests.RequestException:
        return None
    if not data.startswith(b"\xff\xd8"):
        return None
    sof_markers = {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}
    offset = 2
    while offset + 4 < len(data):
        if data[offset] != 0xFF:
            offset += 1
            continue
        while offset < len(data) and data[offset] == 0xFF:
            offset += 1
        if offset >= len(data):
            break
        marker = data[offset]
        offset += 1
        if marker in (0xD8, 0xD9, 0x01) or 0xD0 <= marker <= 0xD7:
            continue
        if offset + 2 > len(data):
            break
        segment_length = int.from_bytes(data[offset:offset + 2], "big")
        if segment_length < 2 or offset + segment_length > len(data):
            break
        if marker in sof_markers and segment_length >= 7:
            height = int.from_bytes(data[offset + 3:offset + 5], "big")
            width = int.from_bytes(data[offset + 5:offset + 7], "big")
            if 0 < width <= 10000 and 0 < height <= 10000:
                return width, height
            return None
        offset += segment_length
    return None


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

    # Preserve editorial review, ALT text, rights and Pinterest safeguards for
    # posts that remain in the rolling archive. New posts are never treated as
    # visually reviewed or cleared for distribution automatically.
    previous = {}
    if OUTPUT.exists():
        try:
            previous_data = json.loads(OUTPUT.read_text(encoding="utf-8"))
            previous = {str(item.get("id")): item for item in previous_data.get("items", []) if item.get("id")}
        except (OSError, ValueError, TypeError):
            previous = {}

    source_keys = {"id", "image", "caption", "post_url", "date", "post_id"}
    for item in items:
        prior = previous.get(str(item.get("id")))
        if prior:
            for key, value in prior.items():
                if key not in source_keys:
                    item[key] = value
            continue

        caption = re.sub(r"\s+", " ", str(item.get("caption") or "")).strip()
        slug = re.sub(r"[^a-z0-9]+", "-", str(item.get("id") or "gallery-item").lower()).strip("-")
        if re.search(r"\bNIGHTMARE\s+DROP\b", caption, re.I):
            category = "nightmare-horror"
        elif re.search(r"\bZOMBIE\s+MEME(?:\s+OF\s+THE\s+HOUR)?\b", caption, re.I):
            category = "zombie-memes"
        elif re.search(r"\bUNDEAD\s+AFTER\s+DARK\b", caption, re.I):
            category = "undead-after-dark"
        else:
            category = "community-creations"
        dimensions = jpeg_dimensions(str(item.get("image") or ""))
        if dimensions:
            item["image_width"], item["image_height"] = dimensions

        item.update({
            "rights_status": "review-required",
            "title": caption[:100] or "ZombieCash gallery artwork",
            "description": caption or "New artwork from the ZombieCash Telegram channel.",
            "alt_text": "ZombieCash gallery artwork — visual ALT review pending.",
            "category_ids": [category],
            "series": category,
            "tags": [],
            "language": "en",
            "pinterest_status": "blocked-rights-review",
            "slug": slug,
            "anchor_id": "gallery-image-" + re.sub(r"[^0-9:]", "", str(item.get("id") or "")).replace(":", "-"),
            "metadata_version": 2,
            "alt_review_status": "pending-review",
            "alt_review_method": "not-reviewed",
        })

    payload = {
        "schema_version": 2,
        "source": f"https://t.me/{CHANNEL}",
        "updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "items": items,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Synced {len(items)} image entries from @{CHANNEL} into {OUTPUT} (limit: {MAX_ITEMS})")


if __name__ == "__main__":
    main()

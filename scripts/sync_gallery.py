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
MAX_PAGES = 5
MAX_ITEMS = 50
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
    messages = []
    for node in soup.select(".tgme_widget_message[data-post]"):
        post_id = node.get("data-post", "")
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
    numeric_ids = []
    for item in messages:
        match = re.search(r"/(\d+)$", item.get("post_id", ""))
        if match:
            numeric_ids.append(int(match.group(1)))
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
            all_items[item["id"]] = item
        if not oldest_id or oldest_id <= 1:
            break
        if before == oldest_id:
            break
        before = oldest_id
        time.sleep(0.4)
    items = sorted(all_items.values(), key=lambda item: (item.get("date") or "", item.get("post_id") or ""), reverse=True)[:MAX_ITEMS]
    payload = {"source": f"https://t.me/{CHANNEL}", "updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "items": items}
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Synced {len(items)} image entries from @{CHANNEL} into {OUTPUT} (limit: {MAX_ITEMS})")


if __name__ == "__main__":
    main()

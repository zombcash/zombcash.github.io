#!/usr/bin/env python3
"""Sync recent public image posts from @ZOMBCASH into the static site gallery."""
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

CHANNEL = "ZOMBCASH"
BASE_URL = f"https://t.me/s/{CHANNEL}"
OUTPUT = Path("gallery-data.json")
MAX_PAGES = 300
PAGE_SIZE = 200
# Classify all attached image posts, not only the three legacy series headers.
# The order is intentional: explicit series/meme labels win over broad keywords.
CATEGORY_PATTERNS = {
    # Explicit editorial series always take priority over broad topic keywords.
    "nightmare-horror": re.compile(r"\bNIGHTMARE(?:\s+DROP|\s*&\s*HORROR)?\b|\bHORROR\b|\bHAUNTED\b|\bCREEPY\b|\bDREAD\b|🩸", re.I),
    "undead-after-dark": re.compile(r"\bUNDEAD\s+AFTER\s+DARK\b", re.I),
    "zombie-memes": re.compile(r"\bZOMBIECASH\s+MEMES?\b|\bZOMBIE\s+MEME(?:\s+OF\s+THE\s+HOUR)?\b|#ZombieCashMeme\b|😂", re.I),
    "zombie-characters": re.compile(r"\b(?:ZOMBIE|UNDEAD)\s+(?:GIRL|BOY|CHARACTER|WARRIOR|QUEEN|KING|HUNTER|PRINCESS)\b|\bZOMBIE\s+CHARACTERS?\b", re.I),
    # Crypto/market posts belong together even when they also use apocalypse language.
    "crypto-apocalypse": re.compile(r"\bCRYPTO\b|\bBITCOIN\b|\bSOLANA\b|\bMEMECOIN\b|\bTOKEN\b|\bWALLET\b|\bTRADING\b|\bPORTFOLIO\b|\bMARKET\b|\bCHARTS?\b|\bCANDLES?\b|\bHODL\b|\bBULL\b|\bBEAR\b|\bPUMP\b|\bDUMP\b", re.I),
    "apocalypse-survival": re.compile(r"\bAPOCALYPSE\s+SURVIVAL\b|\bSURVIVAL\b|\bWASTELAND\b|\bBUNKER\b|\bOUTBREAK\b|\bSCAVENGER\b|\bSHELTER\b|\bFALLOUT\b|\bEVACUATION\b|\bPOST[ -]APOCALYPTIC\b|\bSAFE\s+ZONE\b|\bSUPPLY\s+RUN\b", re.I),
    "community-creations": re.compile(r".+", re.S),
}

# Every attached image/video-thumbnail post can enter the archive. News-feed
# text-only updates are excluded even if Telegram's page contains shared media.
def category_for_caption(caption):
    text = str(caption or "").strip()
    for category, pattern in CATEGORY_PATTERNS.items():
        if pattern.search(text):
            return category
    return "community-creations"

def is_gallery_artwork(caption):
    text = str(caption or "").strip()
    # Site Spotlight is a promotional CTA, not a gallery artwork or community image.
    excluded = (
        r"\bZOMBIECASH\s+SITE\s+SPOTLIGHT\b",
        r"\bZOMBIECASH\s+SITE\s+TRANSMISSION\b",
        r"\bNEWS\s+UPDATE\b",
        r"\bORIGINAL\s+SOURCE\s*:",
    )
    return not any(re.search(pattern, text, re.I) for pattern in excluded)


def gallery_title(caption, limit=100):
    """Keep generated titles within the limit without cutting a word in half."""
    text = re.sub(r"\s+", " ", str(caption or "")).strip()
    if len(text) <= limit:
        return text or "ZombieCash gallery artwork"
    shortened = text[:limit - 1].rsplit(" ", 1)[0].rstrip()
    if not shortened:
        shortened = text[:limit - 1]
    return shortened + "…"
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
    category_counts = {category: 0 for category in CATEGORY_PATTERNS}
    before = None
    for _ in range(MAX_PAGES):
        response = session.get(BASE_URL, params={"before": before} if before else None, timeout=25)
        response.raise_for_status()
        page_items, oldest_id = parse_page(response.text)
        for item in page_items:
            caption = item.get("caption") or ""
            if not is_gallery_artwork(caption):
                continue
            category = category_for_caption(caption)
            item_id = item.get("id")
            if not item_id or item_id in all_items:
                continue
            all_items[item_id] = item
            category_counts[category] += 1
        if not oldest_id or oldest_id <= 1:
            break
        next_before = oldest_id
        if before == next_before:
            break
        before = next_before
        time.sleep(0.35)

    # Keep the full collected archive; the public gallery displays it in
    # chronological pages of PAGE_SIZE (200) images at a time.
    items = sorted(
        all_items.values(),
        key=lambda item: (item.get("date") or "", item.get("post_id") or ""),
        reverse=True,
    )

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
    new_items_for_dimensions = []
    for item in items:
        prior = previous.get(str(item.get("id")))
        if prior:
            for key, value in prior.items():
                if key not in source_keys:
                    item[key] = value
            # Keep reviewed ALT/rights metadata, but always refresh the category
            # from the current source caption so improved rules also fix old cards.
            category = category_for_caption(item.get("caption") or prior.get("caption") or "")
            item["category_ids"] = [category]
            item["series"] = category
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
            category = category_for_caption(caption)
        new_items_for_dimensions.append(item)
        item.update({
            "rights_status": "review-required",
            "title": gallery_title(caption),
            # Telegram provides a caption, not a separate editorial description.
            "description": "",
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

    # Probe image dimensions concurrently so a large archive does not
    # serialize dozens of CDN requests and hold the hourly sync open.
    with ThreadPoolExecutor(max_workers=12) as executor:
        dimension_jobs = {
            executor.submit(jpeg_dimensions, str(item.get("image") or "")): item
            for item in new_items_for_dimensions
        }
        for future in as_completed(dimension_jobs):
            item = dimension_jobs[future]
            try:
                dimensions = future.result()
            except Exception:
                dimensions = None
            if dimensions:
                item["image_width"], item["image_height"] = dimensions

    payload = {
        "schema_version": 2,
        "source": f"https://t.me/{CHANNEL}",
        "updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "items": items,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    final_counts = {category: sum(1 for item in items if category in (item.get("category_ids") or [])) for category in CATEGORY_PATTERNS}
    print(f"Synced {len(items)} image entries from @{CHANNEL} into {OUTPUT} (pages of {PAGE_SIZE}; counts: {final_counts})")


if __name__ == "__main__":
    main()

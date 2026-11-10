#!/usr/bin/env python3
import json
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

data = json.loads(Path("gallery-data.json").read_text(encoding="utf-8"))
items = data["items"]
ids = [item["id"] for item in items]
assert 1 <= len(items) <= 150 and len(set(ids)) == len(items)
primary_categories = {"zombie-memes", "nightmare-horror", "undead-after-dark"}
category_counts = {category: sum(1 for item in items if category in item.get("category_ids", [])) for category in primary_categories}
assert all(count <= 50 for count in category_counts.values()), f"Per-category gallery cap exceeded: {category_counts}"
assert all(item.get("rights_status") == "review-required" for item in items)
reviewed = [item for item in items if item.get("alt_review_status") == "visual-reviewed"]
pending = [item for item in items if item.get("alt_review_status") == "pending-review"]
assert len(reviewed) + len(pending) == len(items), "Every item must have an explicit ALT review state"
assert all(item.get("alt_review_method") in {"manual-visual-review", "manual-contact-sheet-review"} for item in reviewed)
assert all(item.get("alt_text", "").strip() for item in items), "Every card needs an ALT text value"
for item in reviewed:
    assert item.get("image_width") == 800 and item.get("image_height") == 800, f"Unexpected reviewed dimensions: {item['id']}"
missing_dimensions = []
for item in items:
    width = item.get("image_width")
    height = item.get("image_height")
    if width is None and height is None:
        # Telegram CDN dimension probes can fail transiently. The gallery CSS
        # reserves a square card before the image loads, so keep the card
        # crawlable without inventing intrinsic dimensions for the source.
        assert item.get("alt_review_status") == "pending-review", f"Missing dimensions on an already-reviewed image: {item['id']}"
        missing_dimensions.append(item["id"])
        continue
    assert isinstance(width, int) and 0 < width <= 10000, f"Missing/invalid image width: {item['id']}"
    assert isinstance(height, int) and 0 < height <= 10000, f"Missing/invalid image height: {item['id']}"
assert len(missing_dimensions) <= max(1, len(items) // 20), f"Too many gallery images are missing source dimensions: {missing_dimensions}"
for item in pending:
    assert item.get("alt_review_method") == "not-reviewed", f"Pending item has an invalid review method: {item['id']}"
    assert item.get("pinterest_status") == "blocked-rights-review", f"Unreviewed item is not blocked from Pinterest: {item['id']}"
assert all(item.get("anchor_id") for item in items)
assert not any(item.get("pinterest_status") in {"queued", "pending", "scheduled"} for item in items)

class Cards(HTMLParser):
    def __init__(self):
        super().__init__()
        self.cards = []
        self.current = None
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "article" and "gallery-card" in attrs.get("class", "").split():
            self.current = {"id": attrs.get("data-gallery-id"), "anchor": attrs.get("id"), "images": [], "likes": 0}
            self.cards.append(self.current)
        elif self.current is not None and tag == "img":
            self.current["images"].append(attrs)
        elif self.current is not None and tag == "button" and "gallery-like-button" in attrs.get("class", "").split():
            self.current["likes"] += 1
    def handle_endtag(self, tag):
        if tag == "article":
            self.current = None

html = Path("gallery.html").read_text(encoding="utf-8")
parser = Cards()
parser.feed(html)
assert len(parser.cards) == len(items), f"Expected {len(items)} static crawlable cards, got {len(parser.cards)}"
actual_ids = {card["id"] for card in parser.cards}
missing_ids = sorted(set(ids) - actual_ids)
extra_ids = sorted(actual_ids - set(ids))
assert actual_ids == set(ids), f"Gallery card ID mismatch: missing={missing_ids}, extra={extra_ids}, cards={len(parser.cards)}"
assert all(card["anchor"] for card in parser.cards)
assert all(len(card["images"]) == 1 for card in parser.cards)
assert all(card["images"][0].get("alt", "").strip() for card in parser.cards)
assert all(card["likes"] == 1 for card in parser.cards)
item_by_id = {item["id"]: item for item in items}
for card in parser.cards:
    item = item_by_id[card["id"]]
    image = card["images"][0]
    if item.get("image_width") is None and item.get("image_height") is None:
        assert image.get("width") is None and image.get("height") is None, f"Unverified dimensions were emitted for {card['id']}"
    else:
        assert image.get("width") == str(item["image_width"]), f"Static card width mismatch: {card['id']}"
        assert image.get("height") == str(item["image_height"]), f"Static card height mismatch: {card['id']}"
gallery_css = Path("gallery.css").read_text(encoding="utf-8")
assert ".gallery-card img{" in gallery_css and "aspect-ratio:1 / 1" in gallery_css, "Gallery images must reserve a square layout before loading"

NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9", "im": "http://www.google.com/schemas/sitemap-image/1.1"}
sitemap = ET.parse("sitemap-gallery-images.xml").getroot()
images = [node.text for node in sitemap.findall(".//im:loc", NS)]
assert len(images) == len(set(images)) == len({item["image"] for item in items})

for locale in ("de", "fr", "it", "ja", "zh-CN", "ru", "tr", "hi"):
    page = Path(locale, "gallery.html").read_text(encoding="utf-8")
    assert f'<html lang="{locale}">' in page or f'<html lang="{locale}"' in page
    assert f'<link rel="canonical" href="https://zombcash.github.io/{locale}/gallery.html">' in page
    assert 'id="gallery-collection-jsonld"' in page
    assert 'hreflang="x-default"' in page
    assert page.count('rel="alternate" hreflang=') == 10
    assert "AI-generated artwork from our Telegram channel" not in page, f"{locale} hero subtitle remained in English"
    assert "display=optional" in page, f"{locale} gallery fonts must not swap late"
assert "display=optional" in html, "Root gallery fonts must not swap late"
robots = Path("robots.txt").read_text(encoding="utf-8")
assert "https://zombcash.github.io/sitemap-gallery-pages.xml" in robots
language = Path("language.js").read_text(encoding="utf-8")
assert '"/gallery.html": ["de","fr","it","ja","zh-CN","ru","tr","hi"]' in language
assert language.count('"gallery.html"') >= 9
js = Path("gallery.js").read_text(encoding="utf-8")
for marker in ("gallery-toolbar", "gallery-lightbox-share", "/api/gallery/likes", "/api/gallery/like"):
    assert marker in js, marker
assert "window.ZombieCashTrack = send;" in Path("script.js").read_text(encoding="utf-8")

print(f"PASS: {len(items)} static gallery cards (up to 50 per primary category: {category_counts}), {len(reviewed)} visually reviewed, {len(pending)} pending review and Pinterest-blocked, {len(missing_dimensions)} CDN dimension fallback(s) protected by the square CSS ratio, rights safeguards, image sitemap, 8 localized pages, hreflang, language routing, discovery controls, share and likes.")

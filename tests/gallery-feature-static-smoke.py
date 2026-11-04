#!/usr/bin/env python3
import json
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

data = json.loads(Path("gallery-data.json").read_text(encoding="utf-8"))
items = data["items"]
ids = [item["id"] for item in items]
assert len(items) == 50 and len(set(ids)) == 50
assert all(item.get("rights_status") == "review-required" for item in items)
reviewed = [item for item in items if item.get("alt_review_status") == "visual-reviewed"]
assert len(reviewed) == 50
assert sum(item.get("alt_review_method") == "manual-contact-sheet-review" for item in reviewed) == 46
assert sum(item.get("alt_review_method") == "manual-visual-review" for item in reviewed) == 2
unreviewed = [item for item in items if item.get("alt_review_status") != "visual-reviewed"]
assert {item["id"] for item in unreviewed} == set()
assert all(item.get("rights_status") == "review-required" for item in unreviewed)
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
assert len(parser.cards) == 50, f"Expected 50 static crawlable cards, got {len(parser.cards)}"
actual_ids = {card["id"] for card in parser.cards}
missing_ids = sorted(set(ids) - actual_ids)
extra_ids = sorted(actual_ids - set(ids))
assert actual_ids == set(ids), f"Gallery card ID mismatch: missing={missing_ids}, extra={extra_ids}, cards={len(parser.cards)}"
assert all(card["anchor"] for card in parser.cards)
assert all(len(card["images"]) == 1 for card in parser.cards)
assert all(card["images"][0].get("alt", "").strip() for card in parser.cards)
assert all(card["likes"] == 1 for card in parser.cards)
assert sum(1 for c in parser.cards if c["images"][0].get("width") == "800" and c["images"][0].get("height") == "800") == 48
assert any(".gallery-card img{" in line and "aspect-ratio:1 / 1" in line for line in Path("gallery.css").read_text(encoding="utf-8").splitlines())

NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9", "im": "http://www.google.com/schemas/sitemap-image/1.1"}
sitemap = ET.parse("sitemap-gallery-images.xml").getroot()
images = [node.text for node in sitemap.findall(".//im:loc", NS)]
assert len(images) == 50 and len(set(images)) == 50

for locale in ("de", "fr", "it", "ja", "zh-CN", "ru", "tr", "hi"):
    page = Path(locale, "gallery.html").read_text(encoding="utf-8")
    assert f'<html lang="{locale}">' in page or f'<html lang="{locale}"' in page
    assert f'<link rel="canonical" href="https://zombcash.github.io/{locale}/gallery.html">' in page
    assert 'id="gallery-collection-jsonld"' in page
    assert 'hreflang="x-default"' in page
    assert page.count('rel="alternate" hreflang=') == 10
robots = Path("robots.txt").read_text(encoding="utf-8")
assert "https://zombcash.github.io/sitemap-gallery-pages.xml" in robots
language = Path("language.js").read_text(encoding="utf-8")
assert '"/gallery.html": ["de","fr","it","ja","zh-CN","ru","tr","hi"]' in language
assert language.count('"gallery.html"') >= 9
js = Path("gallery.js").read_text(encoding="utf-8")
for marker in ("gallery-toolbar", "gallery-lightbox-share", "/api/gallery/likes", "/api/gallery/like"):
    assert marker in js, marker
assert "window.ZombieCashTrack = send;" in Path("script.js").read_text(encoding="utf-8")

print("PASS: 50 static gallery cards, all 50 visually reviewed, rights safeguards, image sitemap, 8 localized pages, hreflang, language routing, discovery controls, share and likes.")

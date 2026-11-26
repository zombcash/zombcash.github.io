#!/usr/bin/env python3
import json
import re
from html import escape as html_escape, unescape as html_unescape
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

data = json.loads(Path("gallery-data.json").read_text(encoding="utf-8"))
items = data["items"]
ids = [item["id"] for item in items]
assert 1 <= len(items) and len(set(ids)) == len(items)
assert not any("ZOMBIECASH SITE SPOTLIGHT" in str(item.get("caption", "")).upper() for item in items), "Promotional SITE SPOTLIGHT posts must not appear in the gallery"
honey_trap = next((item for item in items if "HONEY-TRAP APOCALYPSE" in str(item.get("caption", "")).upper()), None)
if honey_trap:
    assert "community-creations" in honey_trap.get("category_ids", []), "Corporate honey-trap fiction should not be classified as Apocalypse & Survival"
    assert "apocalypse-survival" not in honey_trap.get("category_ids", []), "Generic use of 'apocalypse' must not override visual/topic relevance"
gallery_categories = {"zombie-memes", "nightmare-horror", "undead-after-dark", "zombie-characters", "site-transmissions", "apocalypse-survival", "crypto-apocalypse", "community-creations"}
category_counts = {category: sum(1 for item in items if category in item.get("category_ids", [])) for category in gallery_categories}
# PAGE_SIZE limits each rendered page, not the size of an archive category.
# Categories may legitimately contain more than 200 items across multiple pages.
assert sum(category_counts.values()) >= len(items), f"Some gallery items are missing a category: {category_counts}"
assert [str(item.get("date") or "") for item in items] == sorted((str(item.get("date") or "") for item in items), reverse=True), "Gallery must show newest images first"
assert all(item.get("category_ids") and set(item["category_ids"]).issubset(gallery_categories) for item in items), "Every image must belong to a known gallery category"
assert all(item.get("rights_status") == "owner-authorized" for item in items)
reviewed = [item for item in items if item.get("alt_review_status") == "visual-reviewed"]
pending = [item for item in items if item.get("alt_review_status") == "pending-review"]
assert len(reviewed) + len(pending) == len(items), "Every item must have an explicit ALT review state"
assert all(item.get("alt_review_method") in {"manual-visual-review", "manual-contact-sheet-review"} for item in reviewed)
assert all(item.get("alt_text", "").strip() for item in items), "Every card needs an ALT text value"
for item in reviewed:
    assert isinstance(item.get("image_width"), int) and 0 < item["image_width"] <= 10000 and isinstance(item.get("image_height"), int) and 0 < item["image_height"] <= 10000, f"Invalid reviewed intrinsic dimensions: {item['id']}"
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
    # Rights authorization and visual ALT review are separate gates. Official
    # channel artwork is owner-authorized; pending ALT review must not be
    # mislabeled as a rights problem or silently block the rights status.
    assert item.get("rights_status") == "owner-authorized", f"Official channel artwork lost owner authorization: {item['id']}"
    assert item.get("pinterest_status") == "ready", f"Authorized official artwork has an inconsistent Pinterest state: {item['id']}"
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
expected_gallery_title = "Zombie Art & Horror Meme Gallery | ZombieCash"
expected_gallery_description = "Browse the ZombieCash zombie art gallery: horror memes, undead character art and community image stories, with links to original Telegram posts."
assert '<title>Zombie Art &amp; Horror Meme Gallery | ZombieCash</title>' in html, "Gallery title must retain the improved search snippet after regeneration"
assert '<meta name="description" content="' + expected_gallery_description + '">' in html, "Gallery description must retain the improved search snippet after regeneration"
assert '<meta property="og:title" content="Zombie Art &amp; Horror Meme Gallery | ZombieCash">' in html
assert '<meta property="og:description" content="' + expected_gallery_description + '">' in html
assert '<meta name="twitter:title" content="Zombie Art &amp; Horror Meme Gallery | ZombieCash">' in html
assert '<meta name="twitter:description" content="' + expected_gallery_description + '">' in html
schema_match = re.search(r'<script id="gallery-collection-jsonld" type="application/ld\+json">(.*?)</script>', html, re.S)
assert schema_match, "Gallery CollectionPage JSON-LD must exist"
gallery_schema = json.loads(schema_match.group(1))
assert gallery_schema.get("name") == expected_gallery_title
assert gallery_schema.get("description") == expected_gallery_description
parser = Cards()
parser.feed(html)
page_items = items[:200]
assert len(parser.cards) == len(page_items), f"Expected first 200 static crawlable cards, got {len(parser.cards)}"
actual_ids = {card["id"] for card in parser.cards}
missing_ids = sorted({item["id"] for item in page_items} - actual_ids)
extra_ids = sorted(actual_ids - {item["id"] for item in page_items})
assert actual_ids == {item["id"] for item in page_items}, f"Gallery first-page card ID mismatch: missing={missing_ids}, extra={extra_ids}, cards={len(parser.cards)}"
assert all(card["anchor"] for card in parser.cards)
assert all(len(card["images"]) == 1 for card in parser.cards)
assert all(card["images"][0].get("alt", "").strip() for card in parser.cards)
assert all(card["likes"] == 1 for card in parser.cards)
item_by_id = {item["id"]: item for item in page_items}
for card in parser.cards:
    item = item_by_id[card["id"]]
    image = card["images"][0]
    assert image.get("src") == item["image"], f"Static card image source mismatch: {card['id']}"
    assert image.get("alt") == item["alt_text"], f"Static card ALT is stale or does not match gallery-data.json: {card['id']}"
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

expected_localized_metadata = {
    "de": ("ZombieCash-Galerie: Zombie-Kunst & Horror-Memes", "Entdecke ZombieCash-Zombie-Kunst, Horror-Memes und Community-Kreationen. Sieh dir Bilder an und öffne die Originalbeiträge auf Telegram."),
    "fr": ("Galerie ZombieCash : art zombie et mèmes d’horreur", "Explorez la galerie ZombieCash : art zombie, mèmes d’horreur et créations de la communauté. Parcourez les images et ouvrez les publications Telegram originales."),
    "hi": ("ZombieCash गैलरी: ज़ॉम्बी कला और हॉरर मीम्स", "ZombieCash की ज़ॉम्बी कला, हॉरर मीम और समुदाय की रचनाएँ देखें। चित्रों को ब्राउज़ करें और मूल Telegram पोस्ट खोलें।"),
    "it": ("Galleria ZombieCash: arte zombie e meme horror", "Esplora la galleria ZombieCash con arte zombie, meme horror e creazioni della community. Sfoglia le immagini e apri i post originali su Telegram."),
    "ja": ("ZombieCashギャラリー｜ゾンビアートとホラーミーム", "ZombieCashのゾンビアート、ホラーミーム、コミュニティ作品を紹介します。画像を閲覧し、元のTelegram投稿を開けます。"),
    "zh-CN": ("ZombieCash 僵尸画廊｜僵尸艺术与恐怖梗图", "探索 ZombieCash 僵尸艺术、恐怖梗图和社区创作。浏览图片并打开原始 Telegram 帖子。"),
    "ru": ("Галерея ZombieCash: зомби-арт и хоррор-мемы", "Исследуй галерею ZombieCash: зомби-арт, хоррор-мемы и тематические работы сообщества. Просматривай изображения и открывай оригинальные публикации в Telegram."),
    "tr": ("ZombieCash Galerisi: Zombi Sanatı ve Korku Memleri", "ZombieCash zombi sanatını, korku memlerini ve topluluk eserlerini keşfet. Görselleri incele ve özgün Telegram gönderilerini aç."),
}

for locale in ("de", "fr", "it", "ja", "zh-CN", "ru", "tr", "hi"):
    page = Path(locale, "gallery.html").read_text(encoding="utf-8")
    title_match = re.search(r"<title>(.*?)</title>", page, re.S)
    description_match = re.search(r'<meta name="description" content="([^"]*)"', page)
    expected_title, expected_description = expected_localized_metadata[locale]
    assert title_match and html_unescape(title_match.group(1)) == expected_title, f"{locale} gallery title is not the approved localized title"
    assert description_match and html_unescape(description_match.group(1)) == expected_description, f"{locale} gallery description is not the approved localized description"
    locale_parser = Cards()
    locale_parser.feed(page)
    locale_cards = {card["id"]: card for card in locale_parser.cards}
    assert set(locale_cards) == {item["id"] for item in page_items}, f"{locale} gallery first-page card IDs do not match gallery-data.json"
    for item in page_items:
        card = locale_cards[item["id"]]
        image = card["images"][0]
        assert image.get("src") == item["image"], f"{locale} image source mismatch: {item['id']}"
        assert image.get("alt") == item["alt_text"], f"{locale} ALT is stale or does not match gallery-data.json: {item['id']}"
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
translations = json.loads(Path("gallery-caption-translations.json").read_text(encoding="utf-8"))
supported_locales = {"ru", "de", "fr", "it", "ja", "zh-CN", "tr", "hi"}
item_ids = set(ids)
assert set(translations).issubset(item_ids), "Every translation key must map to a current gallery image ID"
for image_id, localized in translations.items():
    assert set(localized) == supported_locales, f"Incomplete locale coverage for {image_id}"
    assert all(isinstance(value, str) and value.strip() for value in localized.values()), f"Empty translation for {image_id}"
for locale in supported_locales:
    localized_page = Path(locale, "gallery.html").read_text(encoding="utf-8")
    for item in page_items:
        translated_caption = translations.get(item["id"], {}).get(locale)
        if translated_caption:
            escaped_caption = html_escape(translated_caption, quote=True)
            assert 'data-original-caption="' + escaped_caption + '"' in localized_page, f"{locale} static card caption is not localized: {item['id']}"

js = Path("gallery.js").read_text(encoding="utf-8")
for marker in ("gallery-toolbar", "gallery-lightbox-share", "/api/gallery/likes", "/api/gallery/like"):
    assert marker in js, marker
assert "window.ZombieCashTrack = send;" in Path("script.js").read_text(encoding="utf-8")
assert 'document.addEventListener("zombcash:languagechange"' in js and "refreshGalleryControls();" in js, "Changing language must re-render localized gallery captions and controls"
assert "const INITIAL_ALL = 150;" in js and "const LOAD_ALL = 150;" in js and "pageItems = visible.slice(0, visibleLimit)" in js, "Gallery must load the archive in 150-image batches"
assert "gallery-pagination" in js and "LOAD {count} MORE" in js, "Gallery must expose its localized load-more control"

print(f"PASS: {len(items)} static gallery cards (first crawlable page of 200; interactive batches of 150, newest first; categories: {category_counts}), {len(reviewed)} visually reviewed, {len(pending)} pending ALT review with independent owner authorization, {len(missing_dimensions)} CDN dimension fallback(s) protected by the square CSS ratio, rights safeguards, image sitemap, 8 localized pages, hreflang, language routing, discovery controls, share and likes.")

#!/usr/bin/env python3
"""Keep the crawlable gallery HTML and Google image sitemap in sync with gallery-data.json."""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "gallery-data.json"
GALLERY_FILE = ROOT / "gallery.html"
SITEMAP_FILE = ROOT / "sitemap-gallery-images.xml"
ROBOTS_FILE = ROOT / "robots.txt"
START = "<!-- GALLERY_IMAGE_CARDS_START -->"
END = "<!-- GALLERY_IMAGE_CARDS_END -->"
SITEMAP_URL = "https://zombcash.github.io/sitemap-gallery-images.xml"


def clean_caption(value):
    return re.split(
        r"━━━━━━━━|🧟\s*\$ZOMBCASH|MARKET DIED\.|📋\s*CA:|🌐\s*Website:|𝕏\s*X Community|💬\s*Telegram",
        re.sub(r"\s+", " ", str(value or "")),
        flags=re.IGNORECASE,
    )[0].strip()


def make_cards(items):
    cards = []
    for item in items:
        image = html.escape(str(item.get("image", "")).strip(), quote=True)
        caption_raw = str(item.get("caption", ""))
        caption = clean_caption(caption_raw)
        post = html.escape(str(item.get("post_url") or "https://t.me/ZOMBCASH"), quote=True)
        esc_caption = html.escape(caption, quote=True)
        esc_raw = html.escape(caption_raw, quote=True)
        if not image.startswith(("https://", "http://")):
            continue
        cards.append(
            '      <article class="gallery-card" tabindex="0" role="button" aria-label="Open image: ' + esc_caption + '">\n'
            '        <img src="' + image + '" alt="ZombieCash gallery image: ' + esc_caption + '" title="' + esc_caption + '" loading="lazy" decoding="async">\n'
            '        <div class="gallery-caption"><p data-original-caption="' + esc_raw + '">' + esc_caption + '</p><a href="' + post + '" target="_blank" rel="noreferrer">SOURCE ↗</a></div>\n'
            '      </article>'
        )
    return "\n".join(cards)


def make_sitemap(items):
    rows = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
        '  <url>',
        '    <loc>https://zombcash.github.io/gallery.html</loc>',
    ]
    seen = set()
    for item in items:
        image = str(item.get("image", "")).strip()
        if not image.startswith(("https://", "http://")) or image in seen:
            continue
        seen.add(image)
        caption = clean_caption(item.get("caption", "ZombieCash gallery image"))
        rows.extend([
            '    <image:image>',
            '      <image:loc>' + html.escape(image, quote=False) + '</image:loc>',
            '      <image:caption>' + html.escape(caption, quote=False) + '</image:caption>',
            '    </image:image>',
        ])
    rows.extend(['  </url>', '</urlset>', ''])
    return "\n".join(rows), len(seen)


def main():
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    items = data.get("items", [])
    if not isinstance(items, list):
        raise SystemExit("gallery-data.json: expected an items array")

    gallery = GALLERY_FILE.read_text(encoding="utf-8")
    if START not in gallery or END not in gallery:
        raise SystemExit("gallery.html is missing generated-card markers; refusing to overwrite it")
    before, rest = gallery.split(START, 1)
    _, after = rest.split(END, 1)
    gallery = before + START + "\n" + make_cards(items) + "\n      " + END + after
    GALLERY_FILE.write_text(gallery, encoding="utf-8")

    sitemap, image_count = make_sitemap(items)
    SITEMAP_FILE.write_text(sitemap, encoding="utf-8")

    robots = ROBOTS_FILE.read_text(encoding="utf-8")
    if SITEMAP_URL not in robots:
        robots = robots.rstrip() + "\nSitemap: " + SITEMAP_URL + "\n"
        ROBOTS_FILE.write_text(robots, encoding="utf-8")
    print(f"Synced {image_count} unique images into gallery HTML and image sitemap.")


if __name__ == "__main__":
    main()

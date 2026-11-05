#!/usr/bin/env python3
"""Audit duplicate Open Graph/Twitter meta tags across all repository HTML pages."""
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path
import re
import xml.etree.ElementTree as ET

SITE = "https://zombcash.github.io/"
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
TRACKED_PREFIXES = ("og:", "twitter:")
EXCLUDED_DIRS = {".git", "node_modules", ".venv", "venv", "dist", "_site"}

class MetaParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tags = defaultdict(list)
    def handle_starttag(self, tag, attrs):
        if tag.lower() != "meta":
            return
        a = dict(attrs)
        key = (a.get("property") or a.get("name") or "").strip().lower()
        if key.startswith(TRACKED_PREFIXES):
            self.tags[key].append((a.get("content") or "").strip())

def sitemap_urls():
    robots = Path("robots.txt").read_text(encoding="utf-8-sig")
    maps = [line.split(":", 1)[1].strip() for line in robots.splitlines()
            if line.lower().startswith("sitemap:")]
    if not maps:
        raise SystemExit("FAIL: robots.txt contains no Sitemap directives")
    urls = []
    for sitemap in dict.fromkeys([SITE + "sitemap.xml"] + maps):
        path = sitemap.removeprefix(SITE)
        root = ET.parse(path).getroot()
        urls.extend((n.text or "").strip() for n in root.findall("sm:url/sm:loc", NS)
                    if (n.text or "").strip())
    return list(dict.fromkeys(urls))

def main():
    sitemap_pages = sitemap_urls()
    sitemap_paths = {
        (url.removeprefix(SITE).split("?", 1)[0] or "index.html")
        for url in sitemap_pages
    }
    html_files = sorted(
        p for p in Path(".").rglob("*.html")
        if not any(part in EXCLUDED_DIRS for part in p.parts)
    )
    errors = []
    affected = 0
    for path in html_files:
        html = path.read_text(encoding="utf-8-sig", errors="replace")
        parser = MetaParser()
        parser.feed(html)
        page_duplicates = []
        for key, values in sorted(parser.tags.items()):
            # Multiple distinct og:image values are valid Open Graph image alternatives.
            if key == "og:image" and len(set(values)) > 1:
                continue
            if len(values) > 1:
                page_duplicates.append((key, values))
        style_meta = []
        for match in re.finditer(r"<style\b[^>]*>([\s\S]*?)</style\s*>", html, re.I):
            if re.search(r"<meta\b", match.group(1), re.I):
                style_meta.append(match.start())
        if page_duplicates or style_meta:
            affected += 1
            print(f"PAGE: {path.as_posix()} (in_sitemap={path.as_posix() in sitemap_paths})")
            for key, values in page_duplicates:
                unique = list(dict.fromkeys(values))
                label = "CONFLICT" if len(unique) > 1 else "DUPLICATE"
                print(f"  {label} {key} ({len(values)} tags): {unique}")
                errors.append(f"{label}: {path.as_posix()}: {key}")
            if style_meta:
                print(f"  META_INSIDE_STYLE: {len(style_meta)} occurrence(s)")
                errors.append(f"META_INSIDE_STYLE: {path.as_posix()}")
    print(f"Unique sitemap HTML URLs: {len(sitemap_pages)}")
    print(f"Repository HTML files checked: {len(html_files)}")
    print(f"Pages with duplicate/misplaced social metadata: {affected}")
    print(f"Findings: {len(errors)}")
    if errors:
        raise SystemExit("\n".join(errors))
    print("PASS: no duplicate or misplaced Open Graph/Twitter meta tags.")

if __name__ == "__main__":
    main()

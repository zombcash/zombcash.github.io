#!/usr/bin/env python3
"""SEO regression checks for the published Meridian of Ash edition and its working translations."""
from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://zombcash.github.io/"
BOOK_PATH = "the-meridian-of-ash.html"
LOCALES = ("de", "fr", "it", "ja", "zh-CN", "ru", "tr", "hi")
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


class SEOHeadParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.lang = ""
        self.title = ""
        self.description = ""
        self.robots = ""
        self.canonical = ""
        self.alternates: dict[str, str] = {}
        self.jsonld_chunks: list[str] = []
        self._in_title = False
        self._in_jsonld = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = dict(attrs)
        if tag == "html":
            self.lang = data.get("lang") or ""
        elif tag == "title":
            self._in_title = True
        elif tag == "meta":
            name = (data.get("name") or "").lower()
            if name == "description":
                self.description = data.get("content") or ""
            elif name in ("robots", "googlebot"):
                self.robots = data.get("content") or ""
        elif tag == "link":
            rel = (data.get("rel") or "").lower()
            if rel == "canonical":
                self.canonical = data.get("href") or ""
            elif rel == "alternate" and data.get("hreflang"):
                self.alternates[data["hreflang"]] = data.get("href") or ""
        elif tag == "script" and (data.get("type") or "").lower() == "application/ld+json":
            self._in_jsonld = True
            self.jsonld_chunks.append("")

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False
        elif tag == "script" and self._in_jsonld:
            self._in_jsonld = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data
        if self._in_jsonld and self.jsonld_chunks:
            self.jsonld_chunks[-1] += data


def inspect(path: str) -> tuple[str, SEOHeadParser]:
    full_path = ROOT / path
    if not full_path.is_file():
        raise AssertionError(f"Missing HTML file: {path}")
    parser = SEOHeadParser()
    parser.feed(full_path.read_text(encoding="utf-8"))
    parser.close()
    return full_path.read_text(encoding="utf-8"), parser


def graph_nodes(parser: SEOHeadParser) -> list[dict]:
    nodes: list[dict] = []
    for raw in parser.jsonld_chunks:
        if not raw.strip():
            continue
        data = json.loads(raw)
        if isinstance(data, dict) and isinstance(data.get("@graph"), list):
            nodes.extend(node for node in data["@graph"] if isinstance(node, dict))
        elif isinstance(data, dict):
            nodes.append(data)
    return nodes


sitemap_root = ET.parse(ROOT / "sitemap-zombie-fiction.xml").getroot()
sitemap_urls = {
    (node.text or "").strip()
    for node in sitemap_root.findall(".//sm:loc", NS)
    if (node.text or "").strip()
}
published_paths = sorted(
    url.removeprefix(BASE)
    for url in sitemap_urls
    if "the-meridian-of-ash" in url
)
assert len(published_paths) == 48, (
    f"Expected 48 published English book/section pages in the fiction sitemap; found {len(published_paths)}"
)
assert BOOK_PATH in published_paths

for path in published_paths:
    url = BASE + path
    _, page = inspect(path)
    assert page.title.strip(), f"Missing title: {path}"
    assert len(page.title.strip()) <= 65, f"Title too long ({len(page.title.strip())}): {path}"
    assert page.canonical == url, f"Canonical is not self-referential: {path}"
    assert page.lang == "en", f"Published fiction page has unexpected html lang: {path}"
    assert page.alternates.get("en") == url, f"Missing English self hreflang: {path}"
    assert page.alternates.get("x-default") == BASE + BOOK_PATH if path == BOOK_PATH else page.alternates.get("x-default") == url, (
        f"Unexpected x-default target: {path}"
    )
    nodes = graph_nodes(page)
    types = {node.get("@type") for node in nodes}
    if path == BOOK_PATH:
        assert "Book" in types, "Book landing page must expose Book JSON-LD"
    else:
        chapters = [node for node in nodes if node.get("@type") == "Chapter"]
        assert len(chapters) == 1, f"Expected exactly one Chapter node: {path}"
        assert chapters[0].get("isPartOf", {}).get("@id") == BASE + BOOK_PATH + "#book", (
            f"Chapter does not reference the canonical Book entity: {path}"
        )
        breadcrumbs = [node for node in nodes if node.get("@type") == "BreadcrumbList"]
        assert len(breadcrumbs) == 1, f"Expected one BreadcrumbList: {path}"
        items = breadcrumbs[0].get("itemListElement", [])
        assert len(items) == 2 and [item.get("position") for item in items] == [1, 2], (
            f"Invalid book/chapter breadcrumb: {path}"
        )

draft_count = 0
for locale in LOCALES:
    for english_path in published_paths:
        translated_path = f"{locale}/{english_path}"
        _, page = inspect(translated_path)
        robots = page.robots.lower().replace(" ", "")
        assert "noindex" in robots and "follow" in robots, (
            f"Working translation must remain noindex,follow: {translated_path}"
        )
        translated_url = BASE + translated_path
        assert page.canonical == translated_url, f"Draft translation canonical mismatch: {translated_path}"
        assert page.alternates.get(locale) == translated_url, f"Missing locale self hreflang: {translated_path}"
        assert page.alternates.get("en") == BASE + english_path, f"Missing English alternate: {translated_path}"
        assert translated_url not in sitemap_urls, f"Unfinished translation leaked into sitemap: {translated_path}"
        draft_count += 1

assert draft_count == 384, f"Expected 384 localized working drafts, found {draft_count}"
print(
    "PASS: 48 published English Meridian pages have concise titles and valid Book/Chapter/Breadcrumb JSON-LD; "
    "384 localized working translations remain self-canonical, noindex,follow and excluded from the sitemap."
)

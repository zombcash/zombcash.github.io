#!/usr/bin/env python3
"""Validate the complete multilingual Meridian of Ash page set and its sitemap entries."""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://zombcash.github.io/"
SITEMAP_PATH = ROOT / "sitemap-zombie-fiction.xml"
SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
XHTML_NS = "http://www.w3.org/1999/xhtml"
LANGUAGES = [
    ("en", ""),
    ("ru", "ru/"),
    ("de", "de/"),
    ("fr", "fr/"),
    ("it", "it/"),
    ("ja", "ja/"),
    ("zh-CN", "zh-CN/"),
    ("tr", "tr/"),
    ("hi", "hi/"),
]


class HeadParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.lang = None
        self.canonicals = []
        self.alternates = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag.lower() == "html":
            self.lang = attrs.get("lang")
        if tag.lower() == "link":
            rel = (attrs.get("rel") or "").lower().split()
            if "canonical" in rel and attrs.get("href"):
                self.canonicals.append(attrs["href"])
            if "alternate" in rel and attrs.get("hreflang") and attrs.get("href"):
                self.alternates.append((attrs["hreflang"], attrs["href"]))


def expected_slugs() -> list[str]:
    slugs = {
        path.name
        for path in ROOT.glob("the-meridian-of-ash*.html")
        if re.fullmatch(
            r"the-meridian-of-ash(?:-prologue|-chapter-\d{2})?\.html",
            path.name,
        )
    }
    if "the-meridian-of-ash.html" not in slugs:
        raise SystemExit("FAIL: English book contents page is missing.")
    if "the-meridian-of-ash-prologue.html" not in slugs:
        raise SystemExit("FAIL: English prologue page is missing.")

    chapter_numbers = sorted(
        int(match.group(1))
        for slug in slugs
        if (match := re.fullmatch(r"the-meridian-of-ash-chapter-(\d{2})\.html", slug))
    )
    if not chapter_numbers or chapter_numbers != list(range(1, chapter_numbers[-1] + 1)):
        raise SystemExit(f"FAIL: chapter files are missing or non-contiguous: {chapter_numbers}")
    return sorted(slugs)


def expected_alternates(slug: str) -> set[tuple[str, str]]:
    values = {
        (language, SITE + prefix + slug)
        for language, prefix in LANGUAGES
    }
    values.add(("x-default", SITE + slug))
    return values


def parse_page(path: Path, language: str, slug: str):
    parser = HeadParser()
    parser.feed(path.read_text(encoding="utf-8"))
    url = SITE + path.relative_to(ROOT).as_posix()
    if parser.lang != language:
        raise SystemExit(f"FAIL: {path.relative_to(ROOT)} html lang={parser.lang!r}; expected {language!r}")
    if parser.canonicals != [url]:
        raise SystemExit(f"FAIL: {path.relative_to(ROOT)} canonical mismatch: {parser.canonicals}")
    expected = expected_alternates(slug)
    actual = set(parser.alternates)
    if len(parser.alternates) != len(actual):
        raise SystemExit(f"FAIL: duplicate HTML hreflang entries in {path.relative_to(ROOT)}")
    if actual != expected:
        missing = sorted(expected - actual)
        extra = sorted(actual - expected)
        raise SystemExit(
            f"FAIL: HTML hreflang mismatch in {path.relative_to(ROOT)}; "
            f"missing={missing[:5]}, extra={extra[:5]}"
        )
    return url, expected


def main():
    slugs = expected_slugs()
    expected_urls = {}
    for slug in slugs:
        for language, prefix in LANGUAGES:
            path = ROOT / prefix / slug if prefix else ROOT / slug
            if not path.is_file():
                raise SystemExit(f"FAIL: translated book page is missing: {path.relative_to(ROOT)}")
            url, alternates = parse_page(path, language, slug)
            expected_urls[url] = alternates

    tree = ET.parse(SITEMAP_PATH)
    root = tree.getroot()
    if root.tag != f"{{{SITEMAP_NS}}}urlset":
        raise SystemExit(f"FAIL: unexpected sitemap root: {root.tag}")

    entries = {}
    for node in root.findall(f"{{{SITEMAP_NS}}}url"):
        loc_node = node.find(f"{{{SITEMAP_NS}}}loc")
        url = (loc_node.text or "").strip() if loc_node is not None else ""
        if not url:
            raise SystemExit("FAIL: sitemap entry is missing loc.")
        if url in entries:
            raise SystemExit(f"FAIL: duplicate sitemap URL: {url}")
        alternates = set()
        for link in node.findall(f"{{{XHTML_NS}}}link"):
            if (link.attrib.get("rel") or "").lower() == "alternate":
                alternates.add((
                    (link.attrib.get("hreflang") or "").strip(),
                    (link.attrib.get("href") or "").strip(),
                ))
        entries[url] = (node, alternates)

    missing = sorted(set(expected_urls) - set(entries))
    if missing:
        raise SystemExit(
            f"FAIL: {len(missing)} Meridian page(s) are missing from sitemap-zombie-fiction.xml: "
            + ", ".join(missing[:12])
        )

    for url, expected in expected_urls.items():
        node, actual = entries[url]
        if actual != expected:
            raise SystemExit(
                f"FAIL: sitemap hreflang mismatch for {url}; "
                f"missing={sorted(expected - actual)[:5]}, extra={sorted(actual - expected)[:5]}"
            )
        if node.find(f"{{{SITEMAP_NS}}}lastmod") is None:
            raise SystemExit(f"FAIL: missing lastmod for {url}")

    guide_urls = {
        SITE + prefix + "transmission-zombie-fiction-rpg-guide.html"
        for _, prefix in LANGUAGES
    }
    missing_guides = sorted(guide_urls - set(entries))
    if missing_guides:
        raise SystemExit(
            "FAIL: existing localized fiction-guide entries were removed: "
            + ", ".join(missing_guides)
        )

    print(
        "PASS: "
        f"{len(slugs)} Meridian pages × {len(LANGUAGES)} locales = {len(expected_urls)} URLs "
        "have canonical, reciprocal hreflang and x-default entries in sitemap-zombie-fiction.xml."
    )
    print(f"PASS: all {len(guide_urls)} localized Zombie Fiction RPG Guide sitemap entries remain.")
    print(f"PASS: sitemap-zombie-fiction.xml contains {len(entries)} unique URLs.")


if __name__ == "__main__":
    main()

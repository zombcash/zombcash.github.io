#!/usr/bin/env python3
"""Ensure every localized sitemap page is registered in all language route maps."""
from pathlib import Path
from urllib.parse import urlsplit
import re
import xml.etree.ElementTree as ET

SITE_HOST = "zombcash.github.io"
LOCALES = ("de", "fr", "it", "ja", "zh-CN", "ru", "tr", "hi")
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


def collect_sitemap_urls(path, seen=None):
    seen = seen or set()
    path = Path(path)
    if path in seen:
        return set()
    seen.add(path)
    root = ET.parse(path).getroot()
    if root.tag.endswith("sitemapindex"):
        result = set()
        for node in root.findall("sm:sitemap/sm:loc", NS):
            child = urlsplit((node.text or "").strip()).path.lstrip("/")
            result.update(collect_sitemap_urls(child, seen))
        return result
    if not root.tag.endswith("urlset"):
        raise SystemExit(f"FAIL: unexpected sitemap root in {path}: {root.tag}")
    return {
        (node.text or "").strip()
        for node in root.findall("sm:url/sm:loc", NS)
        if (node.text or "").strip()
    }


def parse_localized_editorial_map(source):
    start = source.index("const localizedEditorialPages = {")
    end = source.index("\n};", start)
    section = source[start:end]
    result = {}
    pattern = re.compile(r'"(/[^"]+\.html)"\s*:\s*\[([\s\S]*?)\]')
    for route, raw in pattern.findall(section):
        result[route] = set(re.findall(r'"([^"]+)"', raw))
    return result


def parse_locale_files_map(source):
    start = source.index("const localeFiles={")
    end = source.index("};", start) + 2
    section = source[start:end]
    result = {}
    for locale in LOCALES:
        match = re.search(r'"' + re.escape(locale) + r'":\[([^\]]*)\]', section)
        if not match:
            raise SystemExit(f"FAIL: language.js localeFiles entry missing: {locale}")
        result[locale] = set(re.findall(r'"([^"]+\.html)"', match.group(1)))
    return result


def parse_shared_nav_map(source):
    start = source.index("const localizedPagesByLocale = {")
    end = source.index("\n  };", start)
    section = source[start:end]
    result = {}
    for locale in LOCALES:
        pattern = re.compile(
            r"(?:'" + re.escape(locale) + r"'|" + re.escape(locale) + r"):"
            r"\s*new Set\(\[([^\]]*)\]\)"
        )
        match = pattern.search(section)
        if not match:
            raise SystemExit(f"FAIL: shared-nav.js localizedPagesByLocale entry missing: {locale}")
        result[locale] = set(re.findall(r'"([^"]+\.html)"', match.group(1)))
    return result


def main():
    robots = Path("robots.txt").read_text(encoding="utf-8-sig")
    feeds = [
        line.split(":", 1)[1].strip()
        for line in robots.splitlines()
        if line.lower().startswith("sitemap:")
    ]
    if not feeds:
        raise SystemExit("FAIL: robots.txt contains no Sitemap directives.")

    urls = set()
    for feed in feeds:
        path = urlsplit(feed).path.lstrip("/")
        urls.update(collect_sitemap_urls(path))

    source = Path("language.js").read_text(encoding="utf-8-sig")
    editorial = parse_localized_editorial_map(source)
    locale_files = parse_locale_files_map(source)
    nav_source = Path("shared-nav.js").read_text(encoding="utf-8-sig")
    nav_routes = parse_shared_nav_map(nav_source)
    checked = {locale: 0 for locale in LOCALES}
    errors = []

    for url in sorted(urls):
        parsed = urlsplit(url)
        if parsed.hostname != SITE_HOST:
            continue
        segments = [part for part in parsed.path.split("/") if part]
        if not segments or segments[0] not in LOCALES:
            continue
        locale = segments[0]
        file = segments[1] if len(segments) > 1 else "index.html"
        if not file.endswith(".html"):
            continue
        checked[locale] += 1
        if file not in locale_files[locale]:
            errors.append(f"{locale}/{file}: missing from language.js localeFiles")
        if file not in nav_routes[locale]:
            errors.append(f"{locale}/{file}: missing from shared-nav.js localizedPagesByLocale")
        if locale not in editorial.get("/" + file, set()):
            errors.append(f"{locale}/{file}: missing from localizedEditorialPages")

    print("Localized sitemap pages checked:", sum(checked.values()))
    for locale in LOCALES:
        print(f"  {locale}: {checked[locale]} pages")
    print("Routing mismatches:", len(errors))
    if errors:
        raise SystemExit("FAIL: localized sitemap routing is incomplete.\n" + "\n".join(errors))
    print("PASS: every localized sitemap page is registered in all three language route maps.")


if __name__ == "__main__":
    main()

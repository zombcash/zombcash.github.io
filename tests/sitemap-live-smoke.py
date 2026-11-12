#!/usr/bin/env python3
"""Check every HTML page exposed by every sitemap listed in robots.txt."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
import json
import sys
import time
import xml.etree.ElementTree as ET

import requests

SITE = "https://zombcash.github.io/"
ROBOTS = "robots.txt"
LANGUAGES = {"en", "de", "fr", "it", "ja", "zh-CN", "ru", "tr", "hi"}
NAMESPACE = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
HEADERS = {"User-Agent": "ZombieCash-Sitemap-Live-Audit/1.0"}


class HeadParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.lang = None
        self.canonicals = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag.lower() == "html":
            self.lang = attrs.get("lang")
        if tag.lower() == "link":
            rel = (attrs.get("rel") or "").lower().split()
            if "canonical" in rel and attrs.get("href"):
                self.canonicals.append(attrs["href"])


def sitemap_list_from_robots(text):
    urls = [
        line.split(":", 1)[1].strip()
        for line in text.splitlines()
        if line.lower().startswith("sitemap:")
    ]
    urls = list(dict.fromkeys(urls))
    if not urls:
        raise RuntimeError("robots.txt contains no Sitemap: directives")
    if any(not url.startswith(SITE) for url in urls):
        raise RuntimeError("robots.txt references a sitemap outside the configured site")
    return urls


def sitemap_page_urls(xml_bytes, source):
    root = ET.fromstring(xml_bytes)
    if root.tag.endswith("urlset"):
        urls = [
            (node.text or "").strip()
            for node in root.findall("sm:url/sm:loc", NAMESPACE)
            if (node.text or "").strip()
        ]
        if not urls:
            raise RuntimeError(f"No page URLs found in {source}")
        return urls
    if root.tag.endswith("sitemapindex"):
        return [
            (node.text or "").strip()
            for node in root.findall("sm:sitemap/sm:loc", NAMESPACE)
            if (node.text or "").strip()
        ]
    raise RuntimeError(f"Unexpected sitemap root in {source}: {root.tag}")


def read_local_sitemaps():
    local_robots = open(ROBOTS, encoding="utf-8").read()
    sitemap_urls = sitemap_list_from_robots(local_robots)
    pages_by_sitemap = {}
    for sitemap_url in sitemap_urls:
        path = sitemap_url.removeprefix(SITE)
        with open(path, "rb") as sitemap_file:
            urls = sitemap_page_urls(sitemap_file.read(), path)
        pages_by_sitemap[sitemap_url] = set(urls)
    return sitemap_urls, pages_by_sitemap


def read_live_sitemaps():
    robots_response = requests.get(SITE + ROBOTS, timeout=25, headers=HEADERS)
    robots_response.raise_for_status()
    sitemap_urls = sitemap_list_from_robots(robots_response.text)
    pages_by_sitemap = {}
    for sitemap_url in sitemap_urls:
        response = requests.get(sitemap_url, timeout=25, headers=HEADERS)
        response.raise_for_status()
        pages_by_sitemap[sitemap_url] = set(sitemap_page_urls(response.content, sitemap_url))
    return sitemap_urls, pages_by_sitemap


def expected_language(url):
    path = url.removeprefix(SITE)
    first = path.split("/", 1)[0]
    return first if first in LANGUAGES and first != "en" else "en"


def check_page(url):
    last_error = None
    response = None
    for attempt in range(3):
        try:
            response = requests.get(url, timeout=18, headers=HEADERS, allow_redirects=True)
            if response.status_code == 200:
                break
            last_error = f"HTTP {response.status_code}"
        except requests.RequestException as exc:
            last_error = f"{type(exc).__name__}: {exc}"
        time.sleep(1 + attempt)
    if response is None or response.status_code != 200:
        return {"url": url, "ok": False, "error": last_error or "No response"}

    content_type = response.headers.get("content-type", "").lower()
    parser = HeadParser()
    try:
        parser.feed(response.text)
    except Exception as exc:
        return {"url": url, "ok": False, "error": f"HTML parse: {exc}"}

    issues = []
    if "text/html" not in content_type:
        issues.append(f"unexpected Content-Type: {content_type or '(missing)'}")
    if response.url.rstrip("/") != url.rstrip("/"):
        issues.append(f"redirected to {response.url}")
    if not parser.lang:
        issues.append("missing html lang")
    elif parser.lang != expected_language(url):
        issues.append(f"html lang={parser.lang}, expected {expected_language(url)}")
    if len(parser.canonicals) != 1:
        issues.append(f"expected one canonical link, found {len(parser.canonicals)}")
    elif parser.canonicals[0].rstrip("/") != url.rstrip("/"):
        issues.append(f"canonical={parser.canonicals[0]}")

    return {
        "url": url,
        "ok": not issues,
        "status": response.status_code,
        "lang": parser.lang,
        "canonical": parser.canonicals[0] if parser.canonicals else None,
        "issues": issues,
    }


def main():
    local_sitemaps, local_pages = read_local_sitemaps()
    live_sitemaps, live_pages = read_live_sitemaps()

    if set(local_sitemaps) != set(live_sitemaps):
        raise SystemExit(json.dumps({
            "error": "Live robots.txt sitemap list differs from deployed commit",
            "local_only": sorted(set(local_sitemaps) - set(live_sitemaps)),
            "live_only": sorted(set(live_sitemaps) - set(local_sitemaps)),
        }, indent=2))

    for sitemap_url in local_sitemaps:
        if local_pages[sitemap_url] != live_pages[sitemap_url]:
            raise SystemExit(json.dumps({
                "error": "Live sitemap differs from deployed commit",
                "sitemap": sitemap_url,
                "local_only": sorted(local_pages[sitemap_url] - live_pages[sitemap_url])[:20],
                "live_only": sorted(live_pages[sitemap_url] - local_pages[sitemap_url])[:20],
            }, indent=2))

    all_urls = set().union(*local_pages.values())
    if not all_urls:
        raise SystemExit("FAIL: no HTML URLs found across robots.txt sitemaps")

    owners = {}
    for sitemap_url, urls in local_pages.items():
        for url in urls:
            owners.setdefault(url, []).append(sitemap_url)
    duplicates = {url: sorted(sources) for url, sources in owners.items() if len(sources) > 1}
    duplicate_entries = sum(len(sources) - 1 for sources in duplicates.values())
    # These overlaps are intentional: gallery.html is the page context for
    # the image sitemap, and the Japanese zombie-fiction edition belongs in
    # both the general site sitemap and the dedicated fiction sitemap.
    expected_overlaps = {
        "https://zombcash.github.io/gallery.html": {
            "https://zombcash.github.io/sitemap-gallery-images.xml",
            "https://zombcash.github.io/sitemap-gallery-pages.xml",
        },
        "https://zombcash.github.io/ja/transmission-zombie-fiction-rpg-guide.html": {
            "https://zombcash.github.io/sitemap.xml",
            "https://zombcash.github.io/sitemap-zombie-fiction.xml",
        },
    }
    expected_duplicates = {
        url: sorted(sources) for url, sources in expected_overlaps.items()
    }
    if duplicates != expected_duplicates:
        raise SystemExit(json.dumps({
            "error": "Unexpected cross-sitemap duplicate entries",
            "duplicates": duplicates,
            "expected": expected_duplicates,
        }, ensure_ascii=False, indent=2))
    print(f"Sitemaps: {len(local_sitemaps)}")
    print(f"Unique HTML page URLs: {len(all_urls)}")
    print(f"Cross-sitemap duplicate entries: {duplicate_entries} (two intentional gallery and fiction sitemap contexts)")

    results = []
    with ThreadPoolExecutor(max_workers=12) as pool:
        futures = [pool.submit(check_page, url) for url in sorted(all_urls)]
        for future in as_completed(futures):
            results.append(future.result())

    failures = sorted((item for item in results if not item["ok"]), key=lambda item: item["url"])
    print(f"HTTP 200 + canonical/lang checks passed: {len(results) - len(failures)}/{len(results)}")
    print(f"Failures: {len(failures)}")
    if failures:
        print(json.dumps(failures, ensure_ascii=False, indent=2))
        raise SystemExit(1)
    print("PASS: all pages from every robots.txt sitemap are reachable and have matching canonical and html lang.")


if __name__ == "__main__":
    main()

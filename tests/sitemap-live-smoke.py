#!/usr/bin/env python3
"""Check every public page listed in sitemap.xml after a successful Pages deployment."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
import json
import sys
import time
import xml.etree.ElementTree as ET

import requests

SITE = "https://zombcash.github.io/"
SITEMAP = SITE + "sitemap.xml"
LANGUAGES = {"en", "de", "fr", "it", "ja", "zh-CN", "ru", "tr", "hi"}
NAMESPACE = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


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


def read_sitemap(path):
    root = ET.parse(path).getroot()
    if not root.tag.endswith("urlset"):
        raise RuntimeError(f"Unexpected sitemap root: {root.tag}")
    return [node.findtext("sm:loc", namespaces=NAMESPACE) for node in root.findall("sm:url", NAMESPACE)]


def expected_language(url):
    path = url.removeprefix(SITE)
    first = path.split("/", 1)[0]
    return first if first in LANGUAGES and first != "en" else "en"


def check_page(url):
    last_error = None
    response = None
    for attempt in range(3):
        try:
            response = requests.get(
                url,
                timeout=18,
                headers={"User-Agent": "ZombieCash-Sitemap-Live-Audit/1.0"},
                allow_redirects=True,
            )
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
    local_urls = read_sitemap("sitemap.xml")
    live_sitemap = requests.get(SITEMAP, timeout=25, headers={"User-Agent": "ZombieCash-Sitemap-Live-Audit/1.0"})
    live_sitemap.raise_for_status()
    live_root = ET.fromstring(live_sitemap.content)
    live_urls = [
        node.findtext("sm:loc", namespaces=NAMESPACE)
        for node in live_root.findall("sm:url", NAMESPACE)
    ]
    if len(local_urls) != len(set(local_urls)):
        raise SystemExit("FAIL: duplicate URLs in repository sitemap")
    if set(local_urls) != set(live_urls):
        missing = sorted(set(local_urls) - set(live_urls))
        extra = sorted(set(live_urls) - set(local_urls))
        raise SystemExit(json.dumps({"error": "Live sitemap differs from deployed commit", "missing": missing[:20], "extra": extra[:20]}, indent=2))

    results = []
    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = [pool.submit(check_page, url) for url in local_urls]
        for future in as_completed(futures):
            results.append(future.result())

    failures = sorted((item for item in results if not item["ok"]), key=lambda item: item["url"])
    print(f"Sitemap URLs: {len(local_urls)}")
    print(f"HTTP 200 + canonical/lang checks passed: {len(results) - len(failures)}/{len(results)}")
    print(f"Failures: {len(failures)}")
    if failures:
        print(json.dumps(failures, ensure_ascii=False, indent=2))
        raise SystemExit(1)
    print("PASS: all sitemap pages are reachable and have one matching canonical and expected html lang.")


if __name__ == "__main__":
    main()

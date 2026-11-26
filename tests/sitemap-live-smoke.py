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
XHTML_NAMESPACE = {"xhtml": "http://www.w3.org/1999/xhtml"}
HEADERS = {"User-Agent": "ZombieCash-Sitemap-Live-Audit/1.0"}


class HeadParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_head = False
        self.in_title = False
        self.lang = None
        self.titles = []
        self.descriptions = []
        self.canonicals = []
        self.alternates = []
        self.robots_directives = []

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        attrs = dict(attrs)
        if tag == "html":
            self.lang = attrs.get("lang")
        if tag == "head":
            self.in_head = True
            return
        if not self.in_head:
            return
        if tag == "title":
            self.titles.append("")
            self.in_title = True
        if tag == "meta":
            name = (attrs.get("name") or "").strip().lower()
            content = (attrs.get("content") or "").strip()
            if name == "description":
                self.descriptions.append(content)
            if name in {"robots", "googlebot", "bingbot"} and content:
                self.robots_directives.append((name, content))
        if tag == "link":
            rel = (attrs.get("rel") or "").lower().split()
            if "canonical" in rel and attrs.get("href"):
                self.canonicals.append(attrs["href"])
            if "alternate" in rel and attrs.get("hreflang") and attrs.get("href"):
                self.alternates.append((attrs["hreflang"], attrs["href"]))

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag == "title" and self.in_head:
            self.in_title = False
        elif tag == "head":
            self.in_head = False

    def handle_data(self, data):
        if self.in_head and self.in_title and self.titles:
            self.titles[-1] += data


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


def read_hreflang_map(sitemap_urls, live=False):
    """Read hreflang alternate sets from every sitemap listed in robots.txt."""
    alternates_by_url = {}
    for sitemap_url in sitemap_urls:
        if live:
            response = requests.get(sitemap_url, timeout=25, headers=HEADERS)
            response.raise_for_status()
            xml_bytes = response.content
        else:
            path = sitemap_url.removeprefix(SITE)
            with open(path, "rb") as sitemap_file:
                xml_bytes = sitemap_file.read()

        root = ET.fromstring(xml_bytes)
        if not root.tag.endswith("urlset"):
            continue
        for node in root.findall("sm:url", NAMESPACE):
            loc_node = node.find("sm:loc", NAMESPACE)
            url = (loc_node.text or "").strip() if loc_node is not None else ""
            if not url:
                continue
            alternates = []
            for link in node.findall("xhtml:link", XHTML_NAMESPACE):
                rel = (link.attrib.get("rel") or "").lower().split()
                lang = (link.attrib.get("hreflang") or "").strip()
                href = (link.attrib.get("href") or "").strip()
                if "alternate" in rel and lang and href:
                    alternates.append((lang, href))
            if not alternates:
                continue
            previous = alternates_by_url.get(url)
            if previous and set(previous) != set(alternates):
                raise RuntimeError(
                    f"Conflicting hreflang sets for duplicate sitemap URL {url}"
                )
            if not previous or len(alternates) > len(previous):
                alternates_by_url[url] = alternates
    return alternates_by_url


def validate_hreflang_map(alternates_by_url, all_urls):
    """Check self references, valid targets, reciprocal links and x-default."""
    issues = []
    for url in sorted(all_urls):
        alternates = alternates_by_url.get(url, [])
        if not alternates:
            issues.append({"url": url, "issue": "missing sitemap hreflang alternates"})
            continue

        languages = [lang for lang, _ in alternates]
        if len(languages) != len(set(languages)):
            issues.append({"url": url, "issue": "duplicate hreflang language"})
        self_languages = [
            lang for lang, href in alternates
            if href == url and lang != "x-default"
        ]
        if len(self_languages) != 1:
            issues.append({
                "url": url,
                "issue": f"expected one self hreflang, found {len(self_languages)}",
            })
            continue
        self_language = self_languages[0]

        english = [href for lang, href in alternates if lang == "en"]
        x_defaults = [href for lang, href in alternates if lang == "x-default"]
        if len(english) != 1:
            issues.append({"url": url, "issue": f"expected one English alternate, found {len(english)}"})
        if len(x_defaults) != 1:
            issues.append({"url": url, "issue": f"expected one x-default alternate, found {len(x_defaults)}"})
        elif len(english) == 1 and x_defaults[0] != english[0]:
            issues.append({
                "url": url,
                "issue": "x-default does not point to the English version",
                "x-default": x_defaults[0],
                "english": english[0],
            })

        for language, target_url in alternates:
            if target_url not in all_urls:
                issues.append({
                    "url": url,
                    "issue": "hreflang target is absent from all sitemaps",
                    "language": language,
                    "target": target_url,
                })
                continue
            if language == "x-default":
                continue
            target_alternates = set(alternates_by_url.get(target_url, []))
            if (self_language, url) not in target_alternates:
                issues.append({
                    "url": url,
                    "issue": "hreflang target has no reciprocal alternate",
                    "language": language,
                    "target": target_url,
                    "expected": {"language": self_language, "href": url},
                })
    return issues


def expected_language(url):
    path = url.removeprefix(SITE)
    first = path.split("/", 1)[0]
    return first if first in LANGUAGES and first != "en" else "en"


def check_page(url, expected_alternates=None):
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
    if len(parser.titles) != 1:
        issues.append(f"expected one document title in head, found {len(parser.titles)}")
    title = parser.titles[0].strip() if parser.titles else ""
    if not title:
        issues.append("missing or empty document title in head")
    if len(parser.descriptions) != 1:
        issues.append(f"expected one meta description in head, found {len(parser.descriptions)}")
    description = parser.descriptions[0].strip() if parser.descriptions else ""
    if not description:
        issues.append("missing or empty meta description in head")
    if not parser.lang:
        issues.append("missing html lang")
    elif parser.lang != expected_language(url):
        issues.append(f"html lang={parser.lang}, expected {expected_language(url)}")

    def blocked_directives(value):
        normalized = value.lower().replace(";", ",").replace(":", ",")
        return {token.strip() for part in normalized.split(",") for token in part.split() if token.strip()}

    for crawler, value in parser.robots_directives:
        blocked = blocked_directives(value)
        if "noindex" in blocked or "none" in blocked:
            issues.append(f"{crawler} meta blocks indexing: {value}")
        if "nofollow" in blocked or "none" in blocked:
            issues.append(f"{crawler} meta blocks link following: {value}")

    x_robots_tag = response.headers.get("x-robots-tag", "").strip()
    if x_robots_tag:
        blocked = blocked_directives(x_robots_tag)
        if "noindex" in blocked or "none" in blocked:
            issues.append(f"X-Robots-Tag blocks indexing: {x_robots_tag}")
        if "nofollow" in blocked or "none" in blocked:
            issues.append(f"X-Robots-Tag blocks link following: {x_robots_tag}")

    if len(parser.canonicals) != 1:
        issues.append(f"expected one canonical link, found {len(parser.canonicals)}")
    elif parser.canonicals[0].rstrip("/") != url.rstrip("/"):
        issues.append(f"canonical={parser.canonicals[0]}")
    if expected_alternates is not None:
        actual_alternates = set(parser.alternates)
        expected_alternates = set(expected_alternates)
        if len(parser.alternates) != len(actual_alternates):
            issues.append("duplicate HTML hreflang alternate")
        if actual_alternates != expected_alternates:
            missing = sorted(expected_alternates - actual_alternates)
            unexpected = sorted(actual_alternates - expected_alternates)
            issues.append(f"HTML hreflang differs from sitemap: missing={missing[:5]}, unexpected={unexpected[:5]}")

    return {
        "url": url,
        "ok": not issues,
        "status": response.status_code,
        "lang": parser.lang,
        "title": title,
        "title_length": len(title),
        "description": description,
        "description_length": len(description),
        "canonical": parser.canonicals[0] if parser.canonicals else None,
        "robots_directives": parser.robots_directives,
        "x_robots_tag": x_robots_tag or None,
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

    local_hreflang = read_hreflang_map(local_sitemaps)
    live_hreflang = read_hreflang_map(live_sitemaps, live=True)
    if local_hreflang != live_hreflang:
        raise SystemExit(json.dumps({
            "error": "Live sitemap hreflang data differs from deployed commit",
            "local_only": sorted(set(local_hreflang) - set(live_hreflang))[:20],
            "live_only": sorted(set(live_hreflang) - set(local_hreflang))[:20],
            "changed": sorted(
                url for url in set(local_hreflang) & set(live_hreflang)
                if set(local_hreflang[url]) != set(live_hreflang[url])
            )[:20],
        }, ensure_ascii=False, indent=2))

    hreflang_issues = validate_hreflang_map(local_hreflang, all_urls)
    if hreflang_issues:
        raise SystemExit(json.dumps({
            "error": "Sitemap hreflang validation failed",
            "issues": hreflang_issues[:100],
            "issue_count": len(hreflang_issues),
        }, ensure_ascii=False, indent=2))
    print(f"Sitemap hreflang reciprocity + x-default checks passed: {len(local_hreflang)}/{len(all_urls)}")

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
        futures = [pool.submit(check_page, url, local_hreflang.get(url, [])) for url in sorted(all_urls)]
        for future in as_completed(futures):
            results.append(future.result())

    failures = sorted((item for item in results if not item["ok"]), key=lambda item: item["url"])
    title_warnings = sorted(
        (item for item in results if item.get("title_length", 0) > 80),
        key=lambda item: item.get("title_length", 0),
        reverse=True,
    )
    description_warnings = sorted(
        (item for item in results if item.get("description_length", 0) > 170),
        key=lambda item: item.get("description_length", 0),
        reverse=True,
    )
    print(f"HTTP 200 + canonical/lang/hreflang/title/description checks passed: {len(results) - len(failures)}/{len(results)}")
    print(f"Long titles (>80 characters; review only): {len(title_warnings)}")
    print(f"Long descriptions (>170 characters; review only): {len(description_warnings)}")
    for item in title_warnings[:20]:
        print(f"LONG_TITLE {item['title_length']} {item['url']} | {item['title']}")
    for item in description_warnings[:20]:
        print(f"LONG_DESCRIPTION {item['description_length']} {item['url']} | {item['description']}")
    print(f"Failures: {len(failures)}")
    if failures:
        print(json.dumps(failures, ensure_ascii=False, indent=2))
        raise SystemExit(1)
    print("PASS: all pages from every robots.txt sitemap are reachable and have matching canonical, html lang, reciprocal hreflang, one title and one meta description in the document head.")


if __name__ == "__main__":
    main()

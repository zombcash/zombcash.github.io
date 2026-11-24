#!/usr/bin/env python3
"""Audit inbound internal anchor links for every HTML URL in robots.txt sitemaps.

Hreflang <link> elements are deliberately excluded: they are language alternates,
not navigational/editorial links that help users discover a page.
"""
from collections import Counter, defaultdict
from html.parser import HTMLParser
import re
import csv
import json
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET

SITE = "https://zombcash.github.io/"
HOST = "zombcash.github.io"
ROBOTS = Path("robots.txt")
OUTPUT = Path("seo-orphan-page-audit")
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.scripts = []
        self.title = []
        self.title_count = 0
        self.descriptions = []
        self.in_head = False
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        attrs = dict(attrs)
        if tag == "head":
            self.in_head = True
        if tag == "a" and attrs.get("href"):
            self.links.append(attrs["href"].strip())
        elif tag == "script" and attrs.get("src"):
            self.scripts.append(attrs["src"])
        if self.in_head and tag == "title":
            self.title_count += 1
            self.in_title = True
        if self.in_head and tag == "meta":
            name = (attrs.get("name") or "").strip().lower()
            if name == "description":
                self.descriptions.append((attrs.get("content") or "").strip())

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag == "title" and self.in_head:
            self.in_title = False
        elif tag == "head":
            self.in_head = False

    def handle_data(self, data):
        if self.in_head and self.in_title:
            self.title.append(data)

def site_url(value, base=SITE):
    value = (value or "").strip()
    if not value or value.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
        return None
    absolute = urljoin(base, value)
    parsed = urlsplit(absolute)
    if parsed.scheme not in ("http", "https") or parsed.hostname != HOST:
        return None
    path = unquote(parsed.path or "/")
    if path == "/" or path.endswith("/"):
        path += "index.html"
    return "https://" + HOST + path


def local_file(url):
    path = urlsplit(url).path.lstrip("/")
    return Path(path or "index.html")


def sitemap_urls(sitemap_url, seen=None):
    seen = seen or set()
    if sitemap_url in seen:
        return set()
    seen.add(sitemap_url)
    path = local_file(sitemap_url)
    if not path.is_file():
        raise FileNotFoundError(f"Sitemap file is missing: {path}")
    root = ET.parse(path).getroot()
    if root.tag.endswith("sitemapindex"):
        children = [
            (node.text or "").strip()
            for node in root.findall("sm:sitemap/sm:loc", NS)
            if (node.text or "").strip()
        ]
        result = set()
        for child in children:
            normalized = site_url(child)
            if not normalized:
                raise ValueError(f"Off-site or invalid child sitemap: {child}")
            result.update(sitemap_urls(normalized, seen))
        return result
    if not root.tag.endswith("urlset"):
        raise ValueError(f"Unexpected sitemap root {root.tag} in {path}")
    return {
        normalized
        for node in root.findall("sm:url/sm:loc", NS)
        if (normalized := site_url(node.text or ""))
    }


def shared_navigation_targets():
    """Mirror the locale-aware destinations injected by shared-nav.js."""
    source = Path("shared-nav.js").read_text(encoding="utf-8")
    labels_match = re.search(r"const labels = \[(.*?)\n  \];", source, re.S)
    if not labels_match:
        raise ValueError("Could not parse shared navigation labels")
    nav_items = re.findall(
        r"\['([^']+)',\s*'([^']+)',\s*'([^']+)'\]",
        labels_match.group(1),
    )
    if not nav_items:
        raise ValueError("No shared navigation items were found")
    localized = {}
    for match in re.finditer(
        r"""['"]?([A-Za-z-]+)['"]?: new Set\(\[([^\]]*)\]\)""",
        source,
    ):
        locale, body = match.groups()
        localized[locale] = set(re.findall(r'"([^"]+)"', body))
    return nav_items, localized

def main():
    if not ROBOTS.is_file():
        raise FileNotFoundError("robots.txt is missing")
    feeds = []
    for line in ROBOTS.read_text(encoding="utf-8").splitlines():
        if line.lower().startswith("sitemap:"):
            normalized = site_url(line.split(":", 1)[1].strip())
            if not normalized:
                raise ValueError(f"Invalid or off-site sitemap directive: {line}")
            feeds.append(normalized)
    if not feeds:
        raise ValueError("robots.txt contains no Sitemap directives")

    urls = set()
    seen_sitemaps = set()
    for feed in feeds:
        urls.update(sitemap_urls(feed, seen_sitemaps))
    if not urls:
        raise ValueError("No page URLs found in sitemap feeds")

    inbound = Counter()
    outbound = Counter()
    inbound_sources = defaultdict(set)
    missing_files = []
    nav_items, localized_pages = shared_navigation_targets()
    shared_nav_pages = 0
    page_titles = {}
    page_descriptions = {}
    metadata_issues = []
    for source_url in sorted(urls):
        source_file = local_file(source_url)
        if not source_file.is_file():
            missing_files.append({"url": source_url, "file": str(source_file)})
            continue
        parser = PageParser()
        parser.feed(source_file.read_text(encoding="utf-8-sig", errors="replace"))
        title = " ".join(" ".join(parser.title).split())[:240]
        description = parser.descriptions[0] if parser.descriptions else ""
        page_titles[source_url] = title
        page_descriptions[source_url] = description
        if parser.title_count != 1 or not title:
            metadata_issues.append({
                "url": source_url,
                "issue": f"expected one non-empty title in head, found {parser.title_count}",
            })
        if len(parser.descriptions) != 1 or not description:
            metadata_issues.append({
                "url": source_url,
                "issue": f"expected one non-empty meta description in head, found {len(parser.descriptions)}",
            })
        if any("shared-nav.js" in src for src in parser.scripts):
            shared_nav_pages += 1
            path_parts = urlsplit(source_url).path.strip("/").split("/")
            locale = path_parts[0] if len(path_parts) > 1 and path_parts[0] in localized_pages else "en"
            for _label, href, _item_id in nav_items:
                key = urlsplit(href).path.strip("/").split("/")[-1] or "index.html"
                if locale != "en" and key in localized_pages.get(locale, set()):
                    nav_target = site_url("/" + locale + "/" + key)
                else:
                    nav_target = site_url(href)
                if nav_target and nav_target in urls and nav_target != source_url:
                    inbound[nav_target] += 1
                    inbound_sources[nav_target].add(source_url)
                    outbound[source_url] += 1
            # shared-nav.js also injects a locale-aware About link in the global footer.
            about_target = site_url(
                "/" + locale + "/about.html" if locale != "en" and "about.html" in localized_pages.get(locale, set())
                else "/about.html"
            )
            if about_target and about_target in urls and about_target != source_url:
                inbound[about_target] += 1
                inbound_sources[about_target].add(source_url)
                outbound[source_url] += 1
        for href in parser.links:
            target = site_url(href, source_url)
            if target and target in urls and target != source_url:
                inbound[target] += 1
                inbound_sources[target].add(source_url)
                outbound[source_url] += 1

    rows = []
    for url in sorted(urls):
        count = inbound[url]
        rows.append({
            "url": url,
            "title": page_titles.get(url, ""),
            "title_length": len(page_titles.get(url, "")),
            "meta_description": page_descriptions.get(url, ""),
            "description_length": len(page_descriptions.get(url, "")),
            "inbound_internal_links": count,
            "outbound_internal_links": outbound[url],
            "inbound_sources": sorted(inbound_sources[url]),
            "status": "ORPHAN" if count == 0 else "LOW_INBOUND" if count <= 2 else "LINKED",
        })

    OUTPUT.mkdir(exist_ok=True)
    (OUTPUT / "report.json").write_text(
        json.dumps({
            "site": SITE,
            "sitemap_feeds": feeds,
            "unique_sitemap_urls": len(urls),
            "html_pages_audited": len(page_titles),
            "shared_navigation_pages": shared_nav_pages,
            "missing_local_files": missing_files,
            "metadata_issue_count": len(metadata_issues),
            "metadata_issues": metadata_issues,
            "long_title_count": sum(row["title_length"] > 70 for row in rows),
            "long_description_count": sum(row["description_length"] > 170 for row in rows),
            "orphan_count": sum(row["status"] == "ORPHAN" for row in rows),
            "low_inbound_count": sum(row["status"] == "LOW_INBOUND" for row in rows),
            "pages": rows,
        }, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    with (OUTPUT / "report.csv").open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)

    orphans = [row for row in rows if row["status"] == "ORPHAN"]
    low = [row for row in rows if row["status"] == "LOW_INBOUND"]
    print(f"Sitemap feeds: {len(feeds)}")
    print(f"Unique HTML sitemap URLs: {len(urls)}")
    print(f"Local HTML pages read: {len(page_titles)}")
    print(f"Pages with locale-aware shared navigation: {shared_nav_pages}")
    print(f"Missing local files: {len(missing_files)}")
    print(f"Pages with one non-empty document-head title and meta description: {len(page_titles) - len(metadata_issues)}/{len(page_titles)}")
    print(f"Long titles (>70 characters; review only): {sum(row['title_length'] > 70 for row in rows)}")
    print(f"Long descriptions (>170 characters; review only): {sum(row['description_length'] > 170 for row in rows)}")
    for issue in metadata_issues:
        print(f"METADATA {issue['url']} | {issue['issue']}")
    for row in rows:
        if row["title_length"] > 70:
            print(f"LONG_TITLE {row['title_length']} {row['url']} | {row['title']}")
    print(f"Orphan pages (zero incoming anchor links): {len(orphans)}")
    print(f"Low inbound pages (one or two incoming links): {len(low)}")
    for row in orphans:
        print(f"ORPHAN {row['url']} | {row['title']}")
    for row in low:
        print(f"LOW_INBOUND {row['inbound_internal_links']} {row['url']} | {row['title']}")
    print(f"Reports written to {OUTPUT}/report.json and report.csv")
    if missing_files:
        raise SystemExit("FAIL: one or more sitemap pages have no corresponding repository HTML file.")
    if metadata_issues:
        raise SystemExit(f"FAIL: {len(metadata_issues)} sitemap page(s) have missing or duplicate document-head title/description metadata.")
    if orphans:
        raise SystemExit(
            f"FAIL: {len(orphans)} sitemap page(s) have no incoming internal anchor links. "
            "Add locale-aware navigation or contextual links, or document an intentional exception."
        )
    print("PASS: every sitemap page has at least one incoming internal anchor link.")


if __name__ == "__main__":
    main()

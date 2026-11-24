#!/usr/bin/env python3
"""Report title, meta-description, Open Graph and H1 coverage for every sitemap HTML page."""
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
import csv
import json
import re
import unicodedata
import xml.etree.ElementTree as ET

SITE = "https://zombcash.github.io/"
HOST = "zombcash.github.io"
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
OUTPUT = Path("sitemap-meta-audit")


def normalize(value):
    return " ".join(unicodedata.normalize("NFKC", value or "").split())


def key(value):
    return normalize(value).casefold()


def site_url(value, base=SITE):
    value = (value or "").strip()
    if not value:
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
        result = set()
        for node in root.findall("sm:sitemap/sm:loc", NS):
            child = site_url(node.text or "")
            if not child:
                raise ValueError(f"Invalid child sitemap: {node.text}")
            result.update(sitemap_urls(child, seen))
        return result
    if not root.tag.endswith("urlset"):
        raise ValueError(f"Unexpected sitemap root {root.tag} in {path}")
    return {u for node in root.findall("sm:url/sm:loc", NS) if (u := site_url(node.text or ""))}


class MetaParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title_parts = []
        self.h1_parts = []
        self.h1_values = []
        self.description = ""
        self.og_title = ""
        self.og_description = ""
        self.twitter_title = ""
        self.twitter_description = ""
        self.in_title = False
        self.in_h1 = False
        self._current_h1 = []

    def handle_starttag(self, tag, attrs):
        attrs = {str(k).lower(): (v or "").strip() for k, v in attrs}
        tag = tag.lower()
        if tag == "title":
            self.in_title = True
        elif tag == "h1":
            self.in_h1 = True
            self._current_h1 = []
        elif tag == "meta":
            name = attrs.get("name", "").lower()
            prop = attrs.get("property", "").lower()
            content = attrs.get("content", "")
            if name == "description":
                self.description = content
            elif prop == "og:title":
                self.og_title = content
            elif prop == "og:description":
                self.og_description = content
            elif name == "twitter:title":
                self.twitter_title = content
            elif name == "twitter:description":
                self.twitter_description = content

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag == "title":
            self.in_title = False
        elif tag == "h1" and self.in_h1:
            value = normalize(" ".join(self._current_h1))
            if value:
                self.h1_values.append(value)
            self.in_h1 = False
            self._current_h1 = []

    def handle_data(self, data):
        if self.in_title:
            self.title_parts.append(data)
        if self.in_h1:
            self._current_h1.append(data)


def duplicate_groups(rows, field):
    grouped = defaultdict(list)
    for row in rows:
        value = row[field]
        if value:
            grouped[key(value)].append(row["url"])
    return [
        {"value": rows_for_key[0][field], "urls": urls}
        for normalized, urls in grouped.items()
        if len(urls) > 1
        for rows_for_key in [[next(r for r in rows if r["url"] == urls[0])]]
    ]


def main():
    robots = Path("robots.txt")
    if not robots.is_file():
        raise FileNotFoundError("robots.txt is missing")
    feeds = [
        site_url(line.split(":", 1)[1].strip())
        for line in robots.read_text(encoding="utf-8").splitlines()
        if line.lower().startswith("sitemap:")
    ]
    feeds = [feed for feed in feeds if feed]
    if not feeds:
        raise ValueError("robots.txt contains no valid Sitemap directives")

    urls = set()
    seen = set()
    for feed in feeds:
        urls.update(sitemap_urls(feed, seen))
    if not urls:
        raise ValueError("No HTML URLs found in sitemap feeds")

    rows = []
    missing_files = []
    for url in sorted(urls):
        file = local_file(url)
        if not file.is_file():
            missing_files.append({"url": url, "file": str(file)})
            rows.append({"url": url, "file": str(file), "title": "", "title_length": 0,
                         "description": "", "description_length": 0, "og_title": "",
                         "og_description": "", "twitter_title": "", "twitter_description": "",
                         "h1_count": 0, "h1": "", "issues": ["missing_local_file"]})
            continue

        parser = MetaParser()
        parser.feed(file.read_text(encoding="utf-8-sig", errors="replace"))
        title = normalize(" ".join(parser.title_parts))
        description = normalize(parser.description)
        issues = []
        if not title:
            issues.append("missing_title")
        elif len(title) < 30:
            issues.append("title_short")
        elif len(title) > 65:
            issues.append("title_long")
        if not description:
            issues.append("missing_meta_description")
        elif len(description) < 70:
            issues.append("description_short")
        elif len(description) > 170:
            issues.append("description_long")
        if not parser.og_title:
            issues.append("missing_og_title")
        if not parser.og_description:
            issues.append("missing_og_description")
        if not parser.twitter_title:
            issues.append("missing_twitter_title")
        if not parser.twitter_description:
            issues.append("missing_twitter_description")
        if not parser.h1_values:
            issues.append("missing_h1")
        elif len(parser.h1_values) > 1:
            issues.append("multiple_h1")

        rows.append({
            "url": url,
            "file": str(file),
            "title": title,
            "title_length": len(title),
            "description": description,
            "description_length": len(description),
            "og_title": normalize(parser.og_title),
            "og_description": normalize(parser.og_description),
            "twitter_title": normalize(parser.twitter_title),
            "twitter_description": normalize(parser.twitter_description),
            "h1_count": len(parser.h1_values),
            "h1": parser.h1_values[0] if parser.h1_values else "",
            "issues": issues,
        })

    dup_titles = duplicate_groups(rows, "title")
    dup_descriptions = duplicate_groups(rows, "description")
    issue_counts = defaultdict(int)
    for row in rows:
        for issue in row["issues"]:
            issue_counts[issue] += 1

    OUTPUT.mkdir(exist_ok=True)
    report = {
        "site": SITE,
        "sitemap_feeds": feeds,
        "unique_sitemap_urls": len(urls),
        "pages_read": len(rows) - len(missing_files),
        "missing_local_files": missing_files,
        "issue_counts": dict(sorted(issue_counts.items())),
        "duplicate_title_groups": dup_titles,
        "duplicate_description_groups": dup_descriptions,
        "pages": rows,
    }
    (OUTPUT / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with (OUTPUT / "report.csv").open("w", encoding="utf-8-sig", newline="") as handle:
        fields = ["url", "file", "title", "title_length", "description", "description_length",
                  "og_title", "og_description", "twitter_title", "twitter_description",
                  "h1_count", "h1", "issues"]
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow({**row, "issues": ";".join(row["issues"])})

    print(f"Sitemap feeds: {len(feeds)}")
    print(f"Unique HTML sitemap URLs: {len(urls)}")
    print(f"Pages read: {len(rows) - len(missing_files)}")
    print(f"Missing local files: {len(missing_files)}")
    print(f"Missing titles: {issue_counts['missing_title']}")
    print(f"Missing meta descriptions: {issue_counts['missing_meta_description']}")
    print(f"Short/long titles: {issue_counts['title_short']}/{issue_counts['title_long']}")
    print(f"Short/long descriptions: {issue_counts['description_short']}/{issue_counts['description_long']}")
    print(f"Missing Open Graph title/description: {issue_counts['missing_og_title']}/{issue_counts['missing_og_description']}")
    print(f"Missing Twitter title/description: {issue_counts['missing_twitter_title']}/{issue_counts['missing_twitter_description']}")
    print(f"Missing/multiple H1: {issue_counts['missing_h1']}/{issue_counts['multiple_h1']}")
    print(f"Duplicate title groups: {len(dup_titles)}")
    print(f"Duplicate description groups: {len(dup_descriptions)}")
    print(f"Reports written to {OUTPUT}/report.json and report.csv")
    if missing_files:
        raise SystemExit("FAIL: some sitemap pages have no local HTML file.")
    print("PASS: sitemap metadata audit report generated (findings are diagnostic, not auto-fail).")


if __name__ == "__main__":
    main()

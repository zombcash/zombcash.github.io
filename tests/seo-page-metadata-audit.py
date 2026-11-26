#!/usr/bin/env python3
"""Audit title, description, canonical, language and indexability on sitemap HTML pages."""
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import re
import unicodedata
import xml.etree.ElementTree as ET

SITE = "https://zombcash.github.io/"
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
OUT = Path("seo-orphan-page-audit")
EXCLUDED_DIRS = {".git", "node_modules", ".venv", "venv", "dist", "_site"}

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title_parts = []
        self.description = []
        self.canonical = []
        self.lang = ""
        self.robots = []
        self.h1_parts = []
        self.h1_count = 0
        self.json_ld_count = 0
        self._in_title = False
        self._in_h1 = False
        self._in_head = False
        self._svg_depth = 0
        self.title_count = 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        tag = tag.lower()
        if tag == "head":
            self._in_head = True
        elif tag == "svg":
            self._svg_depth += 1
        elif tag == "html":
            self.lang = (a.get("lang") or "").strip()
        elif tag == "title" and self._in_head and self._svg_depth == 0:
            self._in_title = True
            self.title_count += 1
        elif tag == "h1":
            self._in_h1 = True
            self.h1_count += 1
        elif tag == "meta" and self._in_head:
            name = (a.get("name") or "").strip().lower()
            if name == "description":
                self.description.append((a.get("content") or "").strip())
            elif name in ("robots", "googlebot"):
                self.robots.append((a.get("content") or "").strip().lower())
        elif tag == "link" and self._in_head:
            rel = {x.lower() for x in (a.get("rel") or "").split()}
            if "canonical" in rel:
                self.canonical.append((a.get("href") or "").strip())
        elif tag == "script" and (a.get("type") or "").lower() == "application/ld+json":
            self.json_ld_count += 1
    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag == "title":
            self._in_title = False
        elif tag == "h1":
            self._in_h1 = False
        elif tag == "head":
            self._in_head = False
        elif tag == "svg":
            self._svg_depth = max(0, self._svg_depth - 1)
    def handle_data(self, data):
        if self._in_title:
            self.title_parts.append(data)
        if self._in_h1:
            self.h1_parts.append(data)

def sitemap_pages():
    robots = Path("robots.txt").read_text(encoding="utf-8-sig")
    feeds = [line.split(":", 1)[1].strip() for line in robots.splitlines()
             if line.lower().startswith("sitemap:")]
    if not feeds:
        raise SystemExit("FAIL: robots.txt contains no Sitemap directives")
    urls = set()
    for feed in dict.fromkeys([SITE + "sitemap.xml"] + feeds):
        if not feed.startswith(SITE):
            raise SystemExit(f"FAIL: external sitemap feed is not allowed: {feed}")
        local = Path(unquote(urlsplit(feed).path).lstrip("/"))
        root = ET.parse(local).getroot()
        if root.tag.endswith("urlset"):
            urls.update((n.text or "").strip() for n in root.findall("sm:url/sm:loc", NS)
                        if (n.text or "").strip())
        elif root.tag.endswith("sitemapindex"):
            for node in root.findall("sm:sitemap/sm:loc", NS):
                child = (node.text or "").strip()
                if not child.startswith(SITE):
                    raise SystemExit(f"FAIL: external nested sitemap is not allowed: {child}")
                child_path = Path(unquote(urlsplit(child).path).lstrip("/"))
                child_root = ET.parse(child_path).getroot()
                if not child_root.tag.endswith("urlset"):
                    raise SystemExit(f"FAIL: unsupported nested sitemap: {child}")
                urls.update((n.text or "").strip() for n in child_root.findall("sm:url/sm:loc", NS)
                            if (n.text or "").strip())
        else:
            raise SystemExit(f"FAIL: unexpected sitemap XML root: {root.tag}")
    return sorted(url for url in urls if url.startswith(SITE))

def local_path(url):
    path = unquote(urlsplit(url).path).lstrip("/")
    if not path:
        return Path("index.html")
    candidate = Path(path)
    if path.endswith("/"):
        return candidate / "index.html"
    if not candidate.suffix and candidate.is_dir():
        return candidate / "index.html"
    return candidate

def clean(value):
    return re.sub(r"\s+", " ", value).strip()

def search_display_units(value):
    """Approximate search-snippet width without penalizing CJK titles for fewer characters."""
    units = 0
    for char in value:
        if unicodedata.combining(char):
            continue
        units += 2 if unicodedata.east_asian_width(char) in {"W", "F"} else 1
    return units


def verify_display_width_metric():
    assert search_display_units("abc") == 3
    assert search_display_units("中文") == 4
    assert search_display_units("かな") == 4
    assert search_display_units("e\u0301") == 1


def main():
    verify_display_width_metric()
    urls = sitemap_pages()
    rows = []
    critical = []
    title_groups = defaultdict(list)
    description_groups = defaultdict(list)
    OUT.mkdir(exist_ok=True)

    for url in urls:
        path = local_path(url)
        if not path.is_file():
            critical.append(f"MISSING_FILE: {url} -> {path}")
            continue
        html = path.read_text(encoding="utf-8-sig", errors="replace")
        parser = PageParser()
        parser.feed(html)
        title = clean("".join(parser.title_parts))
        description = clean(parser.description[0]) if parser.description else ""
        canonical = parser.canonical[0] if parser.canonical else ""
        robots = " ".join(parser.robots)
        issues = []
        warnings = []

        if getattr(parser, "title_count", 0) != 1 or not title:
            issues.append(f"title_count={getattr(parser, 'title_count', 0)}")
        if len(parser.description) != 1 or not description:
            issues.append(f"description_count={len(parser.description)}")
        if not parser.lang:
            issues.append("missing_html_lang")
        if len(parser.canonical) != 1 or not canonical:
            issues.append(f"canonical_count={len(parser.canonical)}")
        elif canonical.rstrip("/") != url.rstrip("/"):
            issues.append(f"canonical_mismatch={canonical}")
        if "noindex" in robots:
            issues.append("noindex_on_sitemap_page")
        if parser.h1_count == 0:
            warnings.append("missing_h1")
        elif parser.h1_count > 1:
            warnings.append(f"multiple_h1={parser.h1_count}")
        title_units = search_display_units(title)
        description_units = search_display_units(description)
        if title and title_units < 30:
            warnings.append(f"short_title_units={title_units}")
        elif title and title_units > 65:
            warnings.append(f"long_title_units={title_units}")
        if description and description_units < 50:
            warnings.append(f"short_description_units={description_units}")
        elif description and description_units > 160:
            warnings.append(f"long_description_units={description_units}")
        if parser.json_ld_count == 0:
            warnings.append("no_json_ld")
        if title:
            title_groups[title.casefold()].append(url)
        if description:
            description_groups[description.casefold()].append(url)
        if issues:
            critical.extend(f"{issue}: {url}" for issue in issues)
        rows.append({
            "url": url,
            "file": path.as_posix(),
            "title": title,
            "title_length": len(title),
            "title_search_display_units": title_units,
            "description": description,
            "description_length": len(description),
            "description_search_display_units": description_units,
            "html_lang": parser.lang,
            "canonical": canonical,
            "robots": robots,
            "h1_count": parser.h1_count,
            "json_ld_count": parser.json_ld_count,
            "issues": issues,
            "warnings": warnings,
        })

    duplicate_titles = {k: v for k, v in title_groups.items() if len(v) > 1}
    duplicate_descriptions = {k: v for k, v in description_groups.items() if len(v) > 1}
    report = {
        "site": SITE,
        "sitemap_url_count": len(urls),
        "pages_parsed": len(rows),
        "critical_issue_count": len(critical),
        "duplicate_title_groups": duplicate_titles,
        "duplicate_description_groups": duplicate_descriptions,
        "pages_with_warnings": sum(bool(r["warnings"]) for r in rows),
        "critical_issues": critical,
        "pages": rows,
    }
    (OUT / "page-metadata-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print("Metadata length thresholds use approximate search display units (CJK wide/fullwidth characters count as 2).")
    print(f"Sitemap HTML URLs: {len(urls)}")
    print(f"Pages parsed: {len(rows)}")
    print(f"Critical metadata/indexability issues: {len(critical)}")
    print(f"Duplicate title groups: {len(duplicate_titles)}")
    print(f"Duplicate description groups: {len(duplicate_descriptions)}")
    print(f"Pages with non-blocking warnings: {report['pages_with_warnings']}")
    for issue in critical[:100]:
        print("CRITICAL " + issue)
    for row in rows:
        if row["warnings"]:
            print(f"WARNING {row['url']}: {', '.join(row['warnings'])}")
    if critical:
        raise SystemExit("FAIL: sitemap page metadata audit found critical issues.")
    if duplicate_titles or duplicate_descriptions:
        raise SystemExit("FAIL: sitemap pages contain duplicate titles or meta descriptions.")
    if report["pages_with_warnings"]:
        raise SystemExit("FAIL: sitemap pages contain title/description length or semantic metadata warnings.")
    print("PASS: all sitemap pages have unique, appropriately sized titles and descriptions, one canonical, a language tag, and no noindex directive.")

if __name__ == "__main__":
    main()

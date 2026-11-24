#!/usr/bin/env python3
"""Audit title, description, canonical, language and indexability on sitemap HTML pages."""
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import re
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

def main():
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
        if "noindex" in robots:
            issues.append("noindex_on_sitemap_page")
        if parser.h1_count == 0:
            warnings.append("missing_h1")
        elif parser.h1_count > 1:
            warnings.append(f"multiple_h1={parser.h1_count}")
        if title and len(title) < 30:
            warnings.append(f"short_title={len(title)}")
        elif title and len(title) > 65:
            warnings.append(f"long_title={len(title)}")
        if description and len(description) < 50:
            warnings.append(f"short_description={len(description)}")
        elif description and len(description) > 160:
            warnings.append(f"long_description={len(description)}")
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
            "description": description,
            "description_length": len(description),
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
    print("PASS: every sitemap page has one title, one meta description, language and canonical, with no noindex directive.")

if __name__ == "__main__":
    main()

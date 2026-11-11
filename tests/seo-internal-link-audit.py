#!/usr/bin/env python3
"""Audit internal anchor-link discovery across every URL in the live sitemap."""
from __future__ import annotations

import concurrent.futures
import json
import os
import re
import sys
import time
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit, unquote

import requests
from bs4 import BeautifulSoup

SITEMAP_URL = "https://zombcash.github.io/sitemap.xml"
HOST = "zombcash.github.io"
WORKERS = 6
TIMEOUT = 25
USER_AGENT = "ZombieCash-SEO-Link-Audit/1.0 (+https://zombcash.github.io/)"


def normalize(url: str) -> str | None:
    try:
        p = urlsplit(url.strip())
        if p.scheme not in ("http", "https") or (p.hostname or "").lower() != HOST:
            return None
        path = unquote(p.path or "/")
        # GitHub Pages serves /index.html as the canonical directory URL.
        if path == "/index.html":
            path = "/"
        elif path.endswith("/index.html"):
            path = path[:-len("index.html")]
        return urlunsplit(("https", HOST, path, "", ""))
    except Exception:
        return None


def fetch(url: str):
    try:
        r = requests.get(url, timeout=TIMEOUT, headers={"User-Agent": USER_AGENT}, allow_redirects=True)
        return url, r.status_code, r.url, r.text if "html" in r.headers.get("content-type", "").lower() else ""
    except Exception as exc:
        return url, 0, "", f"FETCH_ERROR: {type(exc).__name__}: {exc}"


def main():
    session = requests.Session()
    response = session.get(SITEMAP_URL, timeout=TIMEOUT, headers={"User-Agent": USER_AGENT})
    response.raise_for_status()
    root = ET.fromstring(response.content)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    sitemap_urls = list(dict.fromkeys(
        normalize(node.text or "")
        for node in root.findall("sm:url/sm:loc", ns)
        if normalize(node.text or "")
    ))
    known = set(sitemap_urls)
    inbound = Counter()
    inbound_nofollow = Counter()
    hreflang_inbound = Counter()
    outgoing = Counter()
    records = []
    failures = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = [pool.submit(fetch, url) for url in sitemap_urls]
        for future in concurrent.futures.as_completed(futures):
            url, status, final_url, body = future.result()
            record = {"url": url, "status": status, "final_url": final_url}
            if status != 200 or not body or body.startswith("FETCH_ERROR"):
                failures.append(record | {"error": body[:300]})
                records.append(record)
                continue

            soup = BeautifulSoup(body, "html.parser")
            title = soup.title.get_text(" ", strip=True) if soup.title else ""
            html_lang = (soup.html.get("lang") or "").strip() if soup.html else ""
            canonical_tag = soup.find("link", rel=lambda v: v and "canonical" in v)
            canonical = normalize(urljoin(final_url, canonical_tag.get("href", ""))) if canonical_tag and canonical_tag.get("href") else None
            h1_count = len(soup.find_all("h1"))
            internal_targets = set()

            for anchor in soup.find_all("a", href=True):
                target = normalize(urljoin(final_url, anchor["href"]))
                if target and target in known and target != normalize(url):
                    internal_targets.add(target)
                    rel = [str(x).lower() for x in (anchor.get("rel") or [])]
                    if "nofollow" in rel:
                        inbound_nofollow[target] += 1
                    else:
                        inbound[target] += 1

            for link in soup.find_all("link", href=True):
                rel = [str(x).lower() for x in (link.get("rel") or [])]
                if "alternate" in rel and link.get("hreflang"):
                    target = normalize(urljoin(final_url, link["href"]))
                    if target and target in known and target != normalize(url):
                        hreflang_inbound[target] += 1

            outgoing[url] = len(internal_targets)
            record.update({
                "title": title,
                "html_lang": html_lang,
                "canonical": canonical or "",
                "h1_count": h1_count,
                "unique_internal_outgoing": len(internal_targets),
            })
            records.append(record)

    records.sort(key=lambda x: x["url"])
    orphans = [
        r["url"] for r in records
        if r.get("status") == 200
        and inbound[r["url"]] == 0
        and hreflang_inbound[r["url"]] == 0
    ]
    no_outgoing = [r["url"] for r in records if r.get("status") == 200 and outgoing[r["url"]] == 0]
    missing_title = [r["url"] for r in records if r.get("status") == 200 and not r.get("title")]
    missing_h1 = [r["url"] for r in records if r.get("status") == 200 and r.get("h1_count", 0) == 0]
    multiple_h1 = [r["url"] for r in records if r.get("status") == 200 and r.get("h1_count", 0) > 1]
    lang_mismatch = [r for r in records if r.get("status") == 200 and not r.get("html_lang")]
    canonical_mismatch = [r for r in records if r.get("status") == 200 and r.get("canonical") != r["url"]]

    report = {
        "sitemap": SITEMAP_URL,
        "total_urls": len(sitemap_urls),
        "fetched_200": sum(1 for r in records if r.get("status") == 200),
        "fetch_failures": failures,
        "orphan_pages_no_anchor_or_hreflang_inbound": orphans,
        "pages_without_internal_outgoing_links": no_outgoing,
        "pages_missing_title": missing_title,
        "pages_missing_h1": missing_h1,
        "pages_with_multiple_h1": multiple_h1,
        "pages_missing_html_lang": [r["url"] for r in lang_mismatch],
        "pages_with_canonical_mismatch": canonical_mismatch,
        "pages_with_few_inbound_links_le_1": [
            {"url": r["url"], "anchor_inbound": inbound[r["url"]], "hreflang_inbound": hreflang_inbound[r["url"]]}
            for r in records if r.get("status") == 200 and inbound[r["url"]] <= 1 and hreflang_inbound[r["url"]] == 0
        ],
        "records": records,
    }
    Path("seo-internal-link-audit.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    summary = [
        "# ZombieCash internal-link discovery audit",
        "",
        f"- Sitemap URLs: **{len(sitemap_urls)}**",
        f"- Pages fetched with HTTP 200: **{report['fetched_200']}**",
        f"- Fetch failures: **{len(failures)}**",
        f"- Orphan pages (no incoming internal anchor or hreflang link): **{len(orphans)}**",
        f"- Pages with no outgoing internal sitemap links: **{len(no_outgoing)}**",
        f"- Missing title: **{len(missing_title)}**; missing H1: **{len(missing_h1)}**; multiple H1: **{len(multiple_h1)}**",
        f"- Missing HTML lang: **{len(lang_mismatch)}**; canonical mismatch: **{len(canonical_mismatch)}**",
        "",
    ]
    for heading, values in [
        ("Fetch failures", failures),
        ("Orphan pages", orphans),
        ("No outgoing internal links", no_outgoing),
        ("Missing title", missing_title),
        ("Missing H1", missing_h1),
        ("Multiple H1", multiple_h1),
        ("Missing html lang", [r["url"] for r in lang_mismatch]),
        ("Canonical mismatch", canonical_mismatch),
    ]:
        summary.extend([f"## {heading}", ""])
        if not values:
            summary.append("- None")
        else:
            for value in values[:100]:
                summary.append("- " + (value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)))
        summary.append("")

    Path(os.environ.get("GITHUB_STEP_SUMMARY", "seo-internal-link-audit.md")).write_text("\n".join(summary), encoding="utf-8")
    print("\n".join(summary[:16]))
    if failures:
        print(f"::warning::The audit found {len(failures)} fetch failures.")
    if orphans:
        print(f"::warning::The audit found {len(orphans)} orphan sitemap pages.")
    print(f"Audit complete: {len(sitemap_urls)} unique sitemap URLs.")

if __name__ == "__main__":
    main()

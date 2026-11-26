#!/usr/bin/env python3
"""Check every same-origin HTML link resolves to a file in the repository."""
from collections import Counter
from pathlib import Path
import re
from urllib.parse import unquote, urljoin, urlsplit
from bs4 import BeautifulSoup

BASE = "https://zombcash.github.io/"
HOST = "zombcash.github.io"
EXCLUDED_DIRS = {".git", "node_modules", ".venv", "venv", "dist", "_site"}

def target_file(url: str):
    parsed = urlsplit(url)
    if parsed.scheme not in ("http", "https") or parsed.hostname != HOST:
        return None
    path = unquote(parsed.path or "/")
    if path == "/" or path.endswith("/"):
        path += "index.html"
    candidate = Path(path.lstrip("/"))
    # Refuse paths that escape the repository root.
    if ".." in candidate.parts:
        return None
    # GitHub Pages serves directory URLs without a trailing slash by redirecting
    # to the directory's index.html (for example, /de -> /de/).
    if not candidate.suffix and candidate.is_dir():
        candidate = candidate / "index.html"
    return candidate

def main():
    pages = sorted(
        path for path in Path(".").rglob("*.html")
        if not any(part in EXCLUDED_DIRS for part in path.parts)
    )
    known_pages = {path.as_posix() for path in pages}
    missing = Counter()
    malformed_attributes = Counter()
    checked_links = 0
    external = 0

    for source in pages:
        html = source.read_text(encoding="utf-8-sig", errors="replace")
        for match in re.finditer(r'\\s[\\w:-]+=«[^»]*»', html):
            malformed_attributes[source.as_posix()] += 1
        soup = BeautifulSoup(html, "html.parser")
        source_url = urljoin(BASE, source.as_posix())
        for element in soup.find_all(href=True):
            href = (element.get("href") or "").strip()
            if not href or href.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
                continue
            absolute = urljoin(source_url, href)
            parsed = urlsplit(absolute)
            if parsed.hostname != HOST:
                external += 1
                continue
            target = target_file(absolute)
            if target is None:
                continue
            checked_links += 1
            if target.as_posix() not in known_pages and not target.is_file():
                missing[(source.as_posix(), href, target.as_posix())] += 1

    print(f"HTML files scanned: {len(pages)}")
    print(f"Same-origin links checked: {checked_links}")
    print(f"External/non-site links skipped: {external}")
    print(f"Broken same-origin links: {sum(missing.values())}")
    print(f"Malformed guillemet-quoted HTML attributes: {sum(malformed_attributes.values())}")
    for (source, href, target), count in sorted(missing.items())[:150]:
        print(f"BROKEN {source}: {href!r} -> {target} (occurrences: {count})")
    for source, count in sorted(malformed_attributes.items()):
        print(f"MALFORMED_ATTRIBUTES {source}: {count} attribute(s) use typographic guillemets instead of HTML quotes")
    if missing or malformed_attributes:
        raise SystemExit(
            f"FAIL: {sum(missing.values())} broken same-origin links across {len(missing)} targets; "
            f"{sum(malformed_attributes.values())} malformed HTML attributes across {len(malformed_attributes)} files."
        )
    print("PASS: all same-origin HTML links resolve and all scanned HTML attributes use valid quoting.")

if __name__ == "__main__":
    main()

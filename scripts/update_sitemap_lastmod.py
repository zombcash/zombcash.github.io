#!/usr/bin/env python3
"""Refresh <lastmod> values in the primary sitemap from Git history.

The sitemap is kept static in the repository, but its dates are derived from
the last commit that changed each corresponding HTML file. This avoids
advertising stale modification dates to search engines.
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

SITE_ORIGIN = "https://zombcash.github.io"
SITEMAP_PATH = Path("sitemap.xml")
URL_BLOCK_RE = re.compile(r"<url\b[^>]*>.*?</url>", re.DOTALL)
LOC_RE = re.compile(r"<loc>\s*(.*?)\s*</loc>", re.DOTALL)
LASTMOD_RE = re.compile(r"<lastmod>\s*(.*?)\s*</lastmod>", re.DOTALL)


def git_last_changed(path: Path) -> str:
    result = subprocess.run(
        ["git", "log", "-1", "--format=%cs", "--", path.as_posix()],
        check=True,
        capture_output=True,
        text=True,
    )
    date = result.stdout.strip()
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
        raise RuntimeError(f"No Git modification date found for {path}")
    return date


def local_html_path(url: str) -> Path:
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.netloc != "zombcash.github.io":
        raise RuntimeError(f"URL is outside the expected site: {url}")
    if parsed.query or parsed.fragment:
        raise RuntimeError(f"Sitemap URL must not contain query/fragment: {url}")

    relative = unquote(parsed.path).lstrip("/")
    if not relative or relative.endswith("/"):
        relative = relative + "index.html"
    path = Path(relative)
    if not path.is_file():
        raise RuntimeError(f"Sitemap URL has no matching repository file: {url} -> {path}")
    return path


def main() -> int:
    if not SITEMAP_PATH.is_file():
        raise SystemExit("ERROR: sitemap.xml was not found.")

    original = SITEMAP_PATH.read_text(encoding="utf-8")
    changed = 0
    checked = 0
    seen: set[str] = set()

    def update_block(match: re.Match[str]) -> str:
        nonlocal changed, checked
        block = match.group(0)
        loc_match = LOC_RE.search(block)
        if not loc_match:
            raise RuntimeError("A <url> entry is missing its <loc> element.")

        url = loc_match.group(1).strip()
        if url in seen:
            raise RuntimeError(f"Duplicate URL in primary sitemap: {url}")
        seen.add(url)

        path = local_html_path(url)
        date = git_last_changed(path)
        checked += 1
        current = LASTMOD_RE.search(block)
        if current:
            old = current.group(1).strip()
            if old == date:
                return block
            changed += 1
            return LASTMOD_RE.sub(f"<lastmod>{date}</lastmod>", block, count=1)

        changed += 1
        loc_end = loc_match.end()
        return block[:loc_end] + f"<lastmod>{date}</lastmod>" + block[loc_end:]

    updated = URL_BLOCK_RE.sub(update_block, original)
    if checked == 0:
        raise RuntimeError("No <url> entries were found in sitemap.xml.")

    if updated != original:
        SITEMAP_PATH.write_text(updated, encoding="utf-8", newline="")

    print(f"Checked sitemap URLs: {checked}")
    print(f"Updated lastmod values: {changed}")
    print(f"Result: {'CHANGES' if updated != original else 'ALREADY CURRENT'}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {type(exc).__name__}: {exc}", file=sys.stderr)
        raise SystemExit(1)

#!/usr/bin/env python3
"""Refresh sitemap.xml lastmod values from the latest Git commit for each page."""
from __future__ import annotations

import argparse
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urlparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITEMAP_PATH = ROOT / "sitemap.xml"
SITE_ORIGIN = "https://zombcash.github.io"
SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
XHTML_NS = "http://www.w3.org/1999/xhtml"

ET.register_namespace("", SITEMAP_NS)
ET.register_namespace("xhtml", XHTML_NS)


def local_path_for_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.netloc != "zombcash.github.io":
        raise ValueError(f"URL is outside the configured site: {url}")

    relative = unquote(parsed.path or "/").lstrip("/")
    if not relative or relative.endswith("/"):
        relative += "index.html"

    candidate = Path(relative)
    if candidate.is_absolute() or ".." in candidate.parts:
        raise ValueError(f"Unsafe sitemap path: {url}")

    local_file = ROOT / candidate
    if not local_file.is_file():
        raise FileNotFoundError(f"Sitemap URL has no matching local HTML file: {url} -> {candidate}")
    return candidate.as_posix()


def latest_git_date(relative_path: str) -> str:
    result = subprocess.run(
        ["git", "log", "-1", "--format=%cI", "--", relative_path],
        cwd=ROOT,
        capture_output=True,
        check=True,
        text=True,
    )
    timestamp = result.stdout.strip()
    if not timestamp:
        raise RuntimeError(f"No Git history found for sitemap page: {relative_path}")
    try:
        return datetime.fromisoformat(timestamp.replace("Z", "+00:00")).astimezone(timezone.utc).date().isoformat()
    except ValueError as error:
        raise RuntimeError(f"Invalid Git commit timestamp for {relative_path}: {timestamp}") from error


def sitemap_records():
    tree = ET.parse(SITEMAP_PATH)
    root = tree.getroot()
    if root.tag != f"{{{SITEMAP_NS}}}urlset":
        raise ValueError(f"Unexpected sitemap root: {root.tag}")

    records = []
    for url_node in root.findall(f"{{{SITEMAP_NS}}}url"):
        loc_node = url_node.find(f"{{{SITEMAP_NS}}}loc")
        if loc_node is None or not (loc_node.text or "").strip():
            raise ValueError("A sitemap URL entry is missing its loc value.")
        url = loc_node.text.strip()
        relative_path = local_path_for_url(url)
        expected = latest_git_date(relative_path)
        lastmod_node = url_node.find(f"{{{SITEMAP_NS}}}lastmod")
        actual = (lastmod_node.text or "").strip() if lastmod_node is not None else ""
        records.append((url_node, url, relative_path, lastmod_node, actual, expected))
    return tree, records


def refresh(check_only: bool = False) -> int:
    tree, records = sitemap_records()
    changed = []
    for url_node, url, relative_path, lastmod_node, actual, expected in records:
        if actual == expected:
            continue
        changed.append((url, relative_path, actual or "(missing)", expected))
        if not check_only:
            if lastmod_node is None:
                lastmod_node = ET.Element(f"{{{SITEMAP_NS}}}lastmod")
                loc_node = url_node.find(f"{{{SITEMAP_NS}}}loc")
                url_node.insert(list(url_node).index(loc_node) + 1, lastmod_node)
            lastmod_node.text = expected

    print(f"Sitemap HTML URLs: {len(records)}")
    print(f"lastmod values needing refresh: {len(changed)}")
    for url, relative_path, actual, expected in changed:
        print(f"{relative_path}: {actual} -> {expected} ({url})")

    if check_only:
        if changed:
            raise SystemExit(f"FAIL: {len(changed)} sitemap lastmod values do not match Git history.")
        print("PASS: every sitemap lastmod matches the latest Git commit for its HTML file.")
        return 0

    if changed:
        ET.indent(tree, space="  ")
        tree.write(SITEMAP_PATH, encoding="utf-8", xml_declaration=True)
        print(f"Updated {len(changed)} lastmod values in {SITEMAP_PATH.name}.")
    else:
        print("Sitemap lastmod values are already current.")
    return len(changed)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail if any sitemap lastmod differs from Git history.")
    args = parser.parse_args()
    refresh(check_only=args.check)

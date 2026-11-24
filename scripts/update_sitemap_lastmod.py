#!/usr/bin/env python3
"""Refresh managed sitemap lastmod values from the latest Git commit for each page."""
from __future__ import annotations

import argparse
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urlparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITEMAP_PATHS = (
    ROOT / "sitemap.xml",
    ROOT / "sitemap-zombie-fiction.xml",
)
SITE_ORIGIN = "https://zombcash.github.io"
SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"

ET.register_namespace("", SITEMAP_NS)
ET.register_namespace("xhtml", "http://www.w3.org/1999/xhtml")


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


def sitemap_records(sitemap_path: Path):
    tree = ET.parse(sitemap_path)
    root = tree.getroot()
    if root.tag != f"{{{SITEMAP_NS}}}urlset":
        raise ValueError(f"Unexpected sitemap root in {sitemap_path.name}: {root.tag}")

    records = []
    for url_node in root.findall(f"{{{SITEMAP_NS}}}url"):
        loc_node = url_node.find(f"{{{SITEMAP_NS}}}loc")
        if loc_node is None or not (loc_node.text or "").strip():
            raise ValueError(f"A sitemap URL entry is missing its loc value in {sitemap_path.name}.")
        url = loc_node.text.strip()
        relative_path = local_path_for_url(url)
        expected = latest_git_date(relative_path)
        lastmod_node = url_node.find(f"{{{SITEMAP_NS}}}lastmod")
        actual = (lastmod_node.text or "").strip() if lastmod_node is not None else ""
        records.append((url_node, url, relative_path, lastmod_node, actual, expected))
    return tree, records


def refresh(check_only: bool = False) -> int:
    total_records = 0
    total_changed = 0
    all_changes = []

    for sitemap_path in SITEMAP_PATHS:
        tree, records = sitemap_records(sitemap_path)
        changed = []
        total_records += len(records)

        for url_node, url, relative_path, lastmod_node, actual, expected in records:
            if actual == expected:
                continue
            changed.append((url_node, url, relative_path, lastmod_node, actual, expected))

        total_changed += len(changed)
        print(f"{sitemap_path.name} HTML URLs: {len(records)}")
        print(f"{sitemap_path.name} lastmod values needing refresh: {len(changed)}")

        for _, url, relative_path, _, actual, expected in changed:
            print(f"{sitemap_path.name}: {relative_path}: {actual or '(missing)'} -> {expected} ({url})")

        all_changes.extend((sitemap_path.name, relative_path, actual or "(missing)", expected) for _, _, relative_path, _, actual, expected in changed)

        if not check_only and changed:
            for url_node, _, _, lastmod_node, _, expected in changed:
                if lastmod_node is None:
                    lastmod_node = ET.Element(f"{{{SITEMAP_NS}}}lastmod")
                    loc_node = url_node.find(f"{{{SITEMAP_NS}}}loc")
                    url_node.insert(list(url_node).index(loc_node) + 1, lastmod_node)
                lastmod_node.text = expected

            ET.indent(tree, space="  ")
            tree.write(sitemap_path, encoding="utf-8", xml_declaration=True)
            print(f"Updated {len(changed)} lastmod values in {sitemap_path.name}.")

    print(f"Managed sitemap HTML URLs: {total_records}")
    print(f"Total lastmod values needing refresh: {total_changed}")

    if check_only:
        if all_changes:
            raise SystemExit(f"FAIL: {len(all_changes)} managed sitemap lastmod values do not match Git history.")
        print("PASS: every managed sitemap lastmod matches the latest Git commit for its HTML page.")
    elif total_changed:
        print(f"Updated {total_changed} lastmod values across {len(SITEMAP_PATHS)} managed sitemaps.")
    else:
        print("All managed sitemap lastmod values are already current.")

    return total_changed


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail if any managed sitemap lastmod differs from Git history.")
    args = parser.parse_args()
    refresh(check_only=args.check)

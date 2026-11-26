#!/usr/bin/env python3
"""Verify every main sitemap lastmod equals the latest Git commit for its HTML page."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from update_sitemap_lastmod import refresh

refresh(check_only=True)


# Fiction pages are maintained in the dedicated sitemap; avoid duplicate canonical URLs across sitemap feeds.
import xml.etree.ElementTree as ET

SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
main_urls = {node.text.strip() for node in ET.parse(ROOT / "sitemap.xml").getroot().findall(f"{{{SITEMAP_NS}}}url/{{{SITEMAP_NS}}}loc")}
fiction_urls = {node.text.strip() for node in ET.parse(ROOT / "sitemap-zombie-fiction.xml").getroot().findall(f"{{{SITEMAP_NS}}}url/{{{SITEMAP_NS}}}loc")}
fiction_duplicates = sorted(main_urls & fiction_urls)
if fiction_duplicates:
    raise SystemExit("FAIL: canonical URLs appear in both sitemap.xml and sitemap-zombie-fiction.xml: " + ", ".join(fiction_duplicates))
print("PASS: no canonical URLs duplicated between main and zombie-fiction sitemaps.")

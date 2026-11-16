from datetime import date
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
XHTML = "http://www.w3.org/1999/xhtml"
SOURCE_PATHS = [
    "gallery.html",
    "gallery-data.json",
    "gallery.css",
    "gallery.js",
    "scripts/generate_localized_gallery_pages.py",
    "scripts/sync_gallery_image_seo.py",
]

result = subprocess.run(
    ["git", "log", "-1", "--format=%cs", "--", *SOURCE_PATHS],
    cwd=ROOT,
    capture_output=True,
    check=True,
    text=True,
)
expected_lastmod = result.stdout.strip()
assert len(expected_lastmod) == 10, f"Expected a verified Git source date, got {expected_lastmod!r}"
date.fromisoformat(expected_lastmod)

tree = ET.parse(ROOT / "sitemap-gallery-pages.xml")
entries = tree.getroot().findall(f"{{{NS}}}url")
locations = [
    (entry.findtext(f"{{{NS}}}loc") or "").strip()
    for entry in entries
]
assert len(entries) == 9, f"Expected 9 localized gallery URLs, got {len(entries)}"
assert len(set(locations)) == 9, "Localized gallery sitemap contains duplicate URLs"

for entry in entries:
    loc = (entry.findtext(f"{{{NS}}}loc") or "").strip()
    lastmods = entry.findall(f"{{{NS}}}lastmod")
    assert len(lastmods) == 1, f"{loc} must have exactly one lastmod"
    actual = (lastmods[0].text or "").strip()
    assert actual == expected_lastmod, f"{loc} lastmod {actual!r} does not match verified source date {expected_lastmod!r}"
    assert date.fromisoformat(actual) <= date.today(), f"{loc} has a future lastmod date"

    alternates = entry.findall(f"{{{XHTML}}}link")
    languages = {node.attrib.get("hreflang") for node in alternates}
    assert len(alternates) == 10, f"{loc} must list 9 locales plus x-default"
    assert languages == {"en", "de", "fr", "it", "ja", "zh-CN", "ru", "tr", "hi", "x-default"}, f"{loc} has incomplete hreflang alternates"

generator = (ROOT / "scripts/generate_localized_gallery_pages.py").read_text(encoding="utf-8")
workflow = (ROOT / ".github/workflows/sync-gallery-image-seo.yml").read_text(encoding="utf-8")
assert "def latest_source_lastmod()" in generator, "Generator must derive lastmod from Git source history"
assert 'ET.SubElement(url, f"{{{NS}}}lastmod").text = lastmod' in generator, "Generator must write lastmod for every localized gallery URL"
assert "fetch-depth: 0" in workflow, "Scheduled gallery generation needs full Git history for stable source dates"

print(f"PASS: {len(entries)} localized gallery sitemap URLs have verified lastmod={expected_lastmod} and complete hreflang clusters.")

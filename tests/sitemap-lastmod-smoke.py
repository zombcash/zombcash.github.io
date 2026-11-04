from datetime import date
from pathlib import Path
import xml.etree.ElementTree as ET

SITEMAP = Path("sitemap.xml")
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
root = ET.parse(SITEMAP).getroot()
assert root.tag == "{http://www.sitemaps.org/schemas/sitemap/0.9}urlset", root.tag
entries = root.findall("sm:url", NS)
locs = []
missing = []
invalid = []
future = []
for entry in entries:
    locs_for_entry = entry.findall("sm:loc", NS)
    dates = entry.findall("sm:lastmod", NS)
    if len(locs_for_entry) != 1:
        missing.append("entry with invalid loc count")
        continue
    loc = (locs_for_entry[0].text or "").strip()
    locs.append(loc)
    if len(dates) != 1 or not (dates[0].text or "").strip():
        missing.append(loc)
        continue
    value = dates[0].text.strip()
    try:
        parsed = date.fromisoformat(value)
    except ValueError:
        invalid.append((loc, value))
        continue
    if parsed > date.today():
        future.append((loc, value))

assert len(entries) == 186, f"Expected 186 sitemap URLs, got {len(entries)}"
assert len(set(locs)) == len(locs), "Duplicate sitemap URLs"
assert not missing, f"Missing or duplicate lastmod values: {missing[:10]}"
assert not invalid, f"Invalid lastmod dates: {invalid[:10]}"
assert not future, f"Future lastmod dates: {future[:10]}"
print(f"PASS: {len(entries)} unique URLs; exactly one valid, non-future ISO lastmod per URL.")

#!/usr/bin/env python3
from collections import Counter
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

BASE = "https://zombcash.github.io/"
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}

def norm(url):
    p = urlsplit(url)
    if p.scheme not in ("http", "https") or p.hostname != "zombcash.github.io":
        return None
    path = unquote(p.path or "/")
    return "https://zombcash.github.io" + path

def local_path(url):
    path = urlsplit(url).path
    if path == "/" or path.endswith("/"):
        path += "index.html"
    return Path(path.lstrip("/"))

root = ET.parse("sitemap.xml").getroot()
urls = list(dict.fromkeys(norm(x.text or "") for x in root.findall("sm:url/sm:loc", NS)))
known = set(urls)
inbound = Counter()
outgoing = Counter()

for url in urls:
    path = local_path(url)
    if not path.is_file():
        continue
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
    for a in soup.find_all("a", href=True):
        target = norm(urljoin(url, a["href"]))
        if target in known and target != url:
            inbound[target] += 1
            outgoing[url] += 1

expected = {
    "https://zombcash.github.io/roulette.html": 1,
    "https://zombcash.github.io/survivor-challenge-001.html": 1,
    "https://zombcash.github.io/zombcash-market-data.html": 2,
}
errors = []
for url, minimum in expected.items():
    actual = inbound[url]
    print(f"INBOUND {actual} (expected >= {minimum}): {url}")
    if actual < minimum:
        errors.append(f"{url} has only {actual} incoming links")
maker = "https://zombcash.github.io/zombie-maker.html"
if outgoing[maker] < 1:
    errors.append("Zombie Maker has no outgoing internal sitemap links")
missing_files = [str(local_path(u)) for u in urls if not local_path(u).is_file()]
if missing_files:
    errors.append(f"{len(missing_files)} sitemap files are missing locally: {missing_files[:10]}")
if errors:
    raise SystemExit("\n".join(errors))
print(f"PASS: checked {len(urls)} sitemap URLs; target pages are linked and Zombie Maker links to canonical home.")

#!/usr/bin/env python3
"""Guard externalized Roulette page styles across all supported locales."""
from pathlib import Path
from html.parser import HTMLParser
import re

PAGES = [
    "roulette.html", "de/roulette.html", "fr/roulette.html", "hi/roulette.html",
    "it/roulette.html", "ja/roulette.html", "ru/roulette.html", "tr/roulette.html",
    "zh-CN/roulette.html",
]

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.style_tags = 0
        self.stylesheets = []
    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag.lower() == "style":
            self.style_tags += 1
        if tag.lower() == "link" and "stylesheet" in values.get("rel", "").lower().split():
            self.stylesheets.append(values.get("href", ""))

css = Path("roulette-page.css").read_text(encoding="utf-8")
no_comments = re.sub(r"/\*[\s\S]*?\*/", "", css)
assert no_comments.count("{") == no_comments.count("}"), "roulette-page.css has unbalanced braces"
for selector in [".roulette-wheel", ".roulette-panel", ".roulette-result", ".roulette-spin-button"]:
    assert selector in css, f"roulette stylesheet missing required selector: {selector}"

for page in PAGES:
    html = Path(page).read_text(encoding="utf-8")
    parser = Parser()
    parser.feed(html)
    assert parser.style_tags == 0, f"{page}: inline CSS remains"
    assert parser.stylesheets.count("/roulette-page.css?v=20261126-1") == 1, f"{page}: shared stylesheet missing/duplicated"
    assert f'<html lang="{("en" if page == "roulette.html" else page.split("/")[0])}">' in html, f"{page}: lang changed"
    print(f"PASS {page}: 0 inline style blocks; shared Roulette stylesheet loaded")
print("PASS all nine Roulette pages share one external CSS bundle.")

#!/usr/bin/env python3
"""Guard extracted Honey-Trap article CSS across all nine locales."""
from pathlib import Path
from html.parser import HTMLParser
import re

PAGES = [
    "corporate-espionage-honey-trap.html",
    "de/corporate-espionage-honey-trap.html",
    "fr/corporate-espionage-honey-trap.html",
    "hi/corporate-espionage-honey-trap.html",
    "it/corporate-espionage-honey-trap.html",
    "ja/corporate-espionage-honey-trap.html",
    "ru/corporate-espionage-honey-trap.html",
    "tr/corporate-espionage-honey-trap.html",
    "zh-CN/corporate-espionage-honey-trap.html",
]

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.styles = 0
        self.links = []
    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag.lower() == "style":
            self.styles += 1
        if tag.lower() == "link" and "stylesheet" in values.get("rel", "").lower().split():
            self.links.append(values.get("href", ""))

css = Path("corporate-espionage-honey-trap.css").read_text(encoding="utf-8")
no_comments = re.sub(r"/\*[\s\S]*?\*/", "", css)
assert no_comments.count("{") == no_comments.count("}"), "extracted CSS has unbalanced braces"
for selector in [".article-copy", ".poster", ".warning", ".zc-related-field-reports"]:
    assert selector in css, f"missing preserved selector: {selector}"

for page in PAGES:
    html = Path(page).read_text(encoding="utf-8")
    parser = Parser()
    parser.feed(html)
    assert parser.styles == 0, f"{page}: inline style blocks remain"
    assert parser.links.count("/corporate-espionage-honey-trap.css?v=20261126-1") == 1, f"{page}: shared stylesheet missing/duplicated"
    editorial = next((i for i, href in enumerate(parser.links) if href.endswith("editorial-atmosphere.css?v=20261114-honeytrap")), -1)
    shared = parser.links.index("/corporate-espionage-honey-trap.css?v=20261126-1")
    assert editorial >= 0 and shared > editorial, f"{page}: CSS cascade position changed"
    locale = "en" if page == "corporate-espionage-honey-trap.html" else page.split("/")[0]
    assert f'<html lang="{locale}">' in html, f"{page}: lang attribute changed"
    print(f"PASS {page}: 0 inline styles, shared CSS loaded in cascade order")
print("PASS all nine Honey-Trap article pages.")

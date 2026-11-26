#!/usr/bin/env python3
"""Guard externalized Survivor Field Manual CSS across all nine locales."""
from pathlib import Path
from html.parser import HTMLParser
import re

PAGES = [
    "survivor-field-manual.html",
    "de/survivor-field-manual.html",
    "fr/survivor-field-manual.html",
    "hi/survivor-field-manual.html",
    "it/survivor-field-manual.html",
    "ja/survivor-field-manual.html",
    "ru/survivor-field-manual.html",
    "tr/survivor-field-manual.html",
    "zh-CN/survivor-field-manual.html",
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

def css(path):
    text = Path(path).read_text(encoding="utf-8")
    no_comments = re.sub(r"/\*[\s\S]*?\*/", "", text)
    assert no_comments.count("{") == no_comments.count("}"), f"{path}: CSS braces are unbalanced"
    return text

base = css("survivor-field-manual-inline.css")
english = css("survivor-field-manual-english.css")
translated = css("survivor-field-manual-translated.css")
assert ".field-manual-grid" in base and ".field-manual-card" in base and ".field-manual-search" in base
assert ".book-cover-placeholder" in english and ".book-cover-placeholder" not in translated
assert ".outbreak-ad-unit" in translated and ".outbreak-ad-unit" not in english

for page in PAGES:
    html = Path(page).read_text(encoding="utf-8")
    parser = Parser()
    parser.feed(html)
    assert parser.styles == 0, f"{page}: inline CSS remains"
    if page == "survivor-field-manual.html":
        expected = ["/survivor-field-manual-inline.css?v=20261126-1", "/survivor-field-manual-english.css?v=20261126-1"]
    else:
        expected = ["../survivor-field-manual-inline.css?v=20261126-1", "../survivor-field-manual-translated.css?v=20261126-1"]
    assert all(parser.links.count(href) == 1 for href in expected), f"{page}: missing/duplicate extracted CSS links"
    assert parser.links.index(expected[0]) < parser.links.index("editorial-atmosphere.css?v=20261103-noir1"), f"{page}: cascade order changed"
    assert parser.links.index(expected[1]) < parser.links.index("editorial-atmosphere.css?v=20261103-noir1"), f"{page}: supplemental stylesheet order changed"
    assert f'<html lang="{("en" if page == "survivor-field-manual.html" else page.split("/")[0])}">' in html
    print(f"PASS {page}: 0 inline style blocks; shared + locale-specific CSS in preserved order")
print("PASS field manual CSS extraction, English cover rule, and translated ad rules.")

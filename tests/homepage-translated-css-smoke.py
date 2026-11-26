#!/usr/bin/env python3
"""Static guard for translated homepage CSS extraction and cascade order."""
from pathlib import Path
from html.parser import HTMLParser

PAGES = {
    "de/index.html": "de",
    "fr/index.html": "fr",
    "it/index.html": "it",
    "ja/index.html": "ja",
    "zh-CN/index.html": "zh-CN",
    "ru/index.html": "ru",
    "tr/index.html": "tr",
    "hi/index.html": "hi",
}

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stylesheets = []
        self.style_tags = 0
    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag.lower() == "style":
            self.style_tags += 1
        if tag.lower() == "link" and "stylesheet" in values.get("rel", "").lower().split():
            self.stylesheets.append(values.get("href", ""))

def read_css(path):
    css = Path(path).read_text(encoding="utf-8")
    without_comments = __import__("re").sub(r"/\*[\s\S]*?\*/", "", css)
    assert without_comments.count("{") == without_comments.count("}"), f"{path}: unbalanced CSS braces"
    return css

hero = read_css("homepage-translated-hero.css")
components = read_css("homepage-translated-components.css")
german = read_css("homepage-de-field-manual.css")
assert ".hero-layout" in hero and ".hero-content" in hero and "@media(max-width:680px)" in hero
assert ".zc-promo-video-shell" in components and ".zc-promo-player-wrap" in components
assert "text-wrap:balance" not in components, "German-only text balancing rule leaked into shared component CSS"
assert "text-wrap:balance" in german and "hyphens:auto" in german, "German typography refinements were not preserved"

for page, locale in PAGES.items():
    parser = PageParser()
    html = Path(page).read_text(encoding="utf-8")
    parser.feed(html)
    assert parser.style_tags == 0, f"{page}: inline style blocks remain"
    links = parser.stylesheets
    hero_link = "/homepage-translated-hero.css?v=20261126-1"
    component_link = "/homepage-translated-components.css?v=20261126-1"
    assert links.count(hero_link) == 1, f"{page}: hero CSS missing/duplicated"
    assert links.count(component_link) == 1, f"{page}: component CSS missing/duplicated"
    assert links.index(hero_link) < links.index("/site-polish.css?v=20261109-video-cards1"), f"{page}: hero cascade position changed"
    assert links.index("/site-polish.css?v=20261109-video-cards1") < links.index(component_link), f"{page}: component cascade position changed"
    assert links.index(component_link) < links.index("/homepage-visual.css?v=mobile-artwork-20261126-1"), f"{page}: visual CSS cascade position changed"
    if locale == "de":
        de_link = "/homepage-de-field-manual.css?v=20261126-1"
        assert links.count(de_link) == 1, "German spotlight stylesheet missing/duplicated"
        assert links.index(component_link) < links.index(de_link) < links.index("/homepage-visual.css?v=mobile-artwork-20261126-1"), "German-only CSS cascade position changed"
    else:
        assert any("homepage-de-field-manual.css" in link for link in links) is False, f"{page}: German-only CSS loaded"
    assert f'<html lang="{locale}">' in html, f"{page}: locale marker changed"
    print(f"PASS {page}: 0 inline styles; shared CSS loaded in preserved order")

english = PageParser()
english.feed(Path("index.html").read_text(encoding="utf-8"))
assert english.style_tags == 0, "English homepage must remain free of inline style blocks"
print("PASS English homepage remains externally styled; all extracted stylesheets are balanced and locale-scoped.")

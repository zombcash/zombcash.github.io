#!/usr/bin/env python3
"""Validate Book/Chapter structured data for the indexable English Meridian edition."""
from html.parser import HTMLParser
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BOOK_URL = "https://zombcash.github.io/the-meridian-of-ash.html"
BOOK_ID = BOOK_URL + "#book"


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.schemas = []
        self.headings = []
        self.titles = []
        self._schema = None
        self._heading = None
        self._title = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag.lower() == "script" and attrs.get("type", "").lower() == "application/ld+json":
            self._schema = []
        elif tag.lower() == "h1":
            self._heading = []
        elif tag.lower() == "title":
            self._title = []

    def handle_data(self, data):
        if self._schema is not None:
            self._schema.append(data)
        if self._heading is not None:
            self._heading.append(data)
        if self._title is not None:
            self._title.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "script" and self._schema is not None:
            self.schemas.append("".join(self._schema).strip())
            self._schema = None
        elif tag.lower() == "h1" and self._heading is not None:
            self.headings.append(" ".join("".join(self._heading).split()))
            self._heading = None
        elif tag.lower() == "title" and self._title is not None:
            self.titles.append(" ".join("".join(self._title).split()))
            self._title = None


def read_page(path):
    parser = PageParser()
    parser.feed(path.read_text(encoding="utf-8-sig", errors="replace"))
    objects = []
    for raw in parser.schemas:
        value = json.loads(raw)
        objects.extend(value if isinstance(value, list) else [value])
    return objects, parser.headings, parser.titles


def main():
    book_path = ROOT / "the-meridian-of-ash.html"
    book_objects, _, book_titles = read_page(book_path)
    books = [item for item in book_objects if item.get("@type") == "Book"]
    assert len(books) == 1, "Book landing page must contain exactly one Book schema"
    book = books[0]
    assert book.get("@id") == BOOK_ID
    assert book.get("name") == "The Meridian of Ash"
    assert book.get("bookEdition") == "Book I: The Outbreak"
    assert book.get("inLanguage") == "en"
    assert book.get("url") == BOOK_URL
    assert book.get("description"), "Book schema must include its existing factual synopsis"
    assert len(book_titles) == 1 and len(book_titles[0]) <= 65

    chapter_paths = [ROOT / "the-meridian-of-ash-prologue.html"] + [
        ROOT / f"the-meridian-of-ash-chapter-{number:02d}.html"
        for number in range(1, 47)
    ]
    for path in chapter_paths:
        objects, headings, titles = read_page(path)
        chapters = [item for item in objects if item.get("@type") == "Chapter"]
        assert len(chapters) == 1, f"{path.name}: expected exactly one Chapter schema"
        assert len(headings) == 1, f"{path.name}: expected exactly one visible H1"
        assert len(titles) == 1 and len(titles[0]) <= 65, f"{path.name}: search title exceeds 65 characters"
        assert "Meridian of Ash" in titles[0], f"{path.name}: search title omits book identity"
        chapter = chapters[0]
        expected_position = 0 if path.name.endswith("prologue.html") else int(
            path.name.split("chapter-")[1].split(".")[0]
        )
        canonical = f"https://zombcash.github.io/{path.name}"
        assert chapter.get("@id") == canonical + "#chapter", path.name
        assert chapter.get("url") == canonical, path.name
        assert chapter.get("isPartOf", {}).get("@id") == BOOK_ID, path.name
        assert chapter.get("position") == expected_position, path.name
        assert chapter.get("inLanguage") == "en", path.name
        assert chapter.get("name") == headings[0], path.name
        assert chapter.get("headline") == headings[0], path.name

    print("PASS: Book schema is valid and linked to all 47 English prologue/chapter pages.")
    print("PASS: all 48 indexable English Meridian pages have unique, valid Book/Chapter JSON-LD.")
    print("PASS: chapter names match visible H1 text; chapter order and canonical URLs are consistent.")


if __name__ == "__main__":
    main()

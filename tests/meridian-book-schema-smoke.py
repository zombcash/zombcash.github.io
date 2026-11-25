#!/usr/bin/env python3
"""Validate Book/Chapter structured data for the indexable English Meridian edition."""
from html import unescape
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
BOOK_URL = "https://zombcash.github.io/the-meridian-of-ash.html"
BOOK_ID = BOOK_URL + "#book"

def schema_objects(path):
    html = path.read_text(encoding="utf-8-sig", errors="replace")
    scripts = re.findall(
        r'<script\\b[^>]*type=["\\']application/ld\\+json["\\'][^>]*>([\\s\\S]*?)</script>',
        html,
        re.IGNORECASE,
    )
    objects = []
    for raw in scripts:
        value = json.loads(raw.strip())
        objects.extend(value if isinstance(value, list) else [value])
    return html, objects

def heading(html):
    match = re.search(r"<h1\\b[^>]*>([\\s\\S]*?)</h1>", html, re.IGNORECASE)
    if not match:
        raise AssertionError("Missing h1")
    return " ".join(unescape(re.sub(r"<[^>]+>", " ", match.group(1))).split())

def main():
    book_path = ROOT / "the-meridian-of-ash.html"
    book_html, book_objects = schema_objects(book_path)
    books = [item for item in book_objects if item.get("@type") == "Book"]
    assert len(books) == 1, "Book landing page must contain exactly one Book schema"
    book = books[0]
    assert book.get("@id") == BOOK_ID
    assert book.get("name") == "The Meridian of Ash"
    assert book.get("bookEdition") == "Book I: The Outbreak"
    assert book.get("inLanguage") == "en"
    assert book.get("url") == BOOK_URL
    assert book.get("description"), "Book schema must include its existing factual synopsis"

    chapter_paths = [ROOT / "the-meridian-of-ash-prologue.html"] + [
        ROOT / f"the-meridian-of-ash-chapter-{number:02d}.html"
        for number in range(1, 47)
    ]
    for path in chapter_paths:
        html, objects = schema_objects(path)
        chapters = [item for item in objects if item.get("@type") == "Chapter"]
        assert len(chapters) == 1, f"{path.name}: expected exactly one Chapter schema"
        chapter = chapters[0]
        expected_position = 0 if path.name.endswith("prologue.html") else int(
            re.search(r"chapter-(\\d+)", path.name).group(1)
        )
        canonical = f"https://zombcash.github.io/{path.name}"
        assert chapter.get("@id") == canonical + "#chapter", path.name
        assert chapter.get("url") == canonical, path.name
        assert chapter.get("isPartOf", {}).get("@id") == BOOK_ID, path.name
        assert chapter.get("position") == expected_position, path.name
        assert chapter.get("inLanguage") == "en", path.name
        assert chapter.get("name") == heading(html), path.name
        assert chapter.get("headline") == heading(html), path.name

    print("PASS: Book schema is valid and linked to all 47 English prologue/chapter pages.")
    print("PASS: all 48 indexable English Meridian pages have unique, valid Book/Chapter JSON-LD.")
    print("PASS: chapter names match visible H1 text; chapter order and canonical URLs are consistent.")

if __name__ == "__main__":
    main()

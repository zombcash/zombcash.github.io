from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOK_URL = "https://zombcash.github.io/the-meridian-of-ash.html"
BOOK_ID = BOOK_URL + "#book"
PAGES = [
    "the-meridian-of-ash.html",
    "the-meridian-of-ash-prologue.html",
    *[f"the-meridian-of-ash-chapter-{number:02d}.html" for number in range(1, 47)],
]


def extract(pattern: str, source: str, label: str) -> str:
    match = re.search(pattern, source, re.IGNORECASE | re.DOTALL)
    if not match:
        raise AssertionError(f"Missing {label}")
    return match.group(1).strip()


def main() -> None:
    failures: list[str] = []
    for filename in PAGES:
        path = ROOT / filename
        if not path.is_file():
            failures.append(f"{filename}: file missing")
            continue

        source = path.read_text(encoding="utf-8")
        title = extract(r"<title>(.*?)</title>", source, "title")
        canonical = extract(r'<link rel="canonical" href="([^"]+)"', source, "canonical")
        og_title = extract(r'<meta property="og:title" content="([^"]*)"', source, "og:title")
        twitter_title = extract(r'<meta name="twitter:title" content="([^"]*)"', source, "twitter:title")
        scripts = re.findall(
            r'<script type="application/ld\+json">(.*?)</script>',
            source,
            re.IGNORECASE | re.DOTALL,
        )

        if len(title) > 70:
            failures.append(f"{filename}: title too long ({len(title)} chars)")
        if title != og_title or title != twitter_title:
            failures.append(f"{filename}: title, Open Graph and Twitter titles differ")
        if len(scripts) != 1:
            failures.append(f"{filename}: expected exactly one JSON-LD block, found {len(scripts)}")
            continue

        try:
            schema = json.loads(scripts[0])
        except json.JSONDecodeError as exc:
            failures.append(f"{filename}: invalid JSON-LD ({exc})")
            continue

        if schema.get("@context") != "https://schema.org":
            failures.append(f"{filename}: wrong JSON-LD context")
        if schema.get("url") != canonical:
            failures.append(f"{filename}: JSON-LD URL does not match canonical")

        if filename == "the-meridian-of-ash.html":
            if schema.get("@type") != "Book":
                failures.append(f"{filename}: expected Book schema")
            if schema.get("@id") != BOOK_ID:
                failures.append(f"{filename}: Book @id does not match chapter references")
            if schema.get("bookEdition") != "Book I: The Outbreak":
                failures.append(f"{filename}: Book edition is missing")
        else:
            if schema.get("@type") != "Chapter":
                failures.append(f"{filename}: expected Chapter schema")
            if schema.get("isPartOf", {}).get("@id") != BOOK_ID:
                failures.append(f"{filename}: Chapter is not linked to the Book entity")
            if filename == "the-meridian-of-ash-prologue.html":
                if schema.get("position") != "Prologue":
                    failures.append(f"{filename}: Prologue position is missing")
            else:
                expected_position = int(re.search(r"chapter-(\d+)", filename).group(1))
                if schema.get("position") != expected_position:
                    failures.append(f"{filename}: incorrect chapter position")

    if failures:
        raise SystemExit("FAIL: Meridian of Ash SEO metadata\\n- " + "\\n- ".join(failures))
    print(f"PASS: {len(PAGES)} Meridian of Ash pages have concise synchronized titles and valid Book/Chapter JSON-LD.")


if __name__ == "__main__":
    main()

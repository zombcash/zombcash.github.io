# THE MERIDIAN OF ASH — Translation QA report

**Date:** 2026-11-24  
**Source:** approved English edition, Book I — The Outbreak  
**Status:** eight machine-translation editorial drafts; not approved for public release

## Structural completeness

- English source: 48 reader pages — title/contents page, prologue, and 46 chapters.
- English prose paragraphs across all 48 pages: 6,744.
- Target languages: RU, DE, FR, IT, JA, ZH-CN, TR, HI.
- Each of the eight final review branches contains all 48 expected pages.
- All 384 translated pages were fetched and compared against the English source.
- Paragraph-count comparison: zero mismatches; each language has 6,744 paragraphs.
- Exact protected-name audit: zero missing occurrences across all 384 pages.
- Protected book title is exactly THE MERIDIAN OF ASH in every language.
- The final QA gate checks html lang, canonical URL, hreflang alternates, noindex,follow, and the visible machine-translation draft banner on every page.
- No translated page has been merged into main; the live English edition, navigation, and existing sitemaps remain unchanged.

## Final review branches

| Language | Branch | Protected-term blocks | Already exact | Repaired | Unresolved |
|---|---|---:|---:|---:|---:|
| Russian | translation-tgemma-glossary/ru | 213 | 205 | 8 | 0 |
| German | translation-tgemma-glossary/de | 213 | 208 | 5 | 0 |
| French | translation-tgemma-glossary/fr | 213 | 209 | 4 | 0 |
| Italian | translation-tgemma-glossary/it | 213 | 205 | 8 | 0 |
| Japanese | translation-tgemma-glossary/ja | 213 | 199 | 14 | 0 |
| Simplified Chinese | translation-tgemma-glossary/zh-CN | 213 | 198 | 15 | 0 |
| Turkish | translation-tgemma-glossary/tr | 213 | 211 | 2 | 0 |
| Hindi | translation-tgemma-glossary/hi | 213 | 208 | 5 | 0 |

**Totals:** 1,704 protected-term content blocks checked; 61 repaired; 1,643 already exact; zero unresolved. Every per-language JSON QA report is stored as translations/glossary-qa-language.json in its review branch.

## Terminology and formatting

- Protected names and fictional service titles retain exact English spelling and source capitalization.
- Morrow is matched as a complete name, not as the substring inside the ordinary word tomorrow.
- The formatted Zombie Lab sample retains its original bold emphasis.
- The book title remains unchanged in English in all eight translations.
- All eight branches passed the independent exact-name scan.

## Editorial status and release gate

These are machine-translation drafts, not publication-ready literary editions. The glossary pass verifies protected names, structural parity, and page metadata; it does not replace professional literary editing.

Before public release:
1. Perform full literary review in each language for meaning, continuity, dialogue, idiom, tone, and grammar.
2. Review chapter headings and terminology in context.
3. Run the strict Word export workflow; it independently refuses to package a language if any protected name is missing or any glossary block remains unresolved.
4. Review the resulting DOCX files and perform rendered-page checks.
5. Only after editorial approval, deliberately update localized publication pages and the existing fiction sitemap.

The translated review branches are not published and must not be indexed.

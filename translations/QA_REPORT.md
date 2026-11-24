# THE MERIDIAN OF ASH — Translation QA checkpoint

**Date:** 2026-11-24  
**Source:** approved English edition, Book I — The Outbreak  
**Status:** machine translation drafts; not approved for public release

## Structural completeness

- English source: 48 HTML pages (contents, prologue, 46 chapters).
- English paragraphs in all 48 reader pages: 6,744 (2 title-page paragraphs, 84 prologue paragraphs, and 6,658 chapter paragraphs).
- Target languages: RU, DE, FR, IT, JA, ZH-CN, TR, HI.
- Each combined language branch contains all 48 expected pages.
- All 384 translated pages were fetched and checked against the source using the full .wrap p selector, including the title page and prologue.
- Paragraph-count comparison: zero mismatches across all 384 pages; every language has 6,744 paragraphs.
- Empty translated prose paragraphs: zero.
- Sampled page checks: locale `html[lang]`, canonical URL, `noindex,follow`, and visible machine-draft banner all present.
- No translated page has been merged into `main`; the English live edition and sitemap remain unchanged.

## Branches

| Language | Review branch |
|---|---|
| Russian | `translation-tgemma-combined/ru` |
| German | `translation-tgemma-combined/de` |
| French | `translation-tgemma-combined/fr` |
| Italian | `translation-tgemma-combined/it` |
| Japanese | `translation-tgemma-combined/ja` |
| Simplified Chinese | `translation-tgemma-combined/zh-CN` |
| Turkish | `translation-tgemma-combined/tr` |
| Hindi | `translation-tgemma-combined/hi` |

## Editorial issues still open

The structural audit does not establish literary quality. Targeted review of aligned source/translation paragraphs found that some glossary names and fictional service names are translated or transliterated inconsistently. Examples include The Core, The Auditor, Zombie Lab, Saint Oran's, and place names such as Bellwether. The current translation script did not enforce the protected-term list even though the glossary file exists.

A targeted protected-term normalization pass is being tested. It must preserve the exact English glossary spellings and inline emphasis, and must not overwrite a paragraph if the model changes or drops a marker. After the sample passes, the same pass can be run across the 217 source paragraphs containing protected terms in each language.

## Release gate

Do not merge or index the translations until:
1. glossary normalization is complete and checked;
2. literary review checks meaning, names, continuity, dialogue, and tone;
3. final per-language QA and rendered-page checks pass;
4. language alternates and the existing fiction sitemap are updated deliberately.

Google Search Console inspection remains pending after the site-level API returned HTTP 429 quota errors. This is separate from the translation branch checks.

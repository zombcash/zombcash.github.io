# THE MERIDIAN OF ASH — chapter translation workflow

The approved English edition is the source of truth: the book contents page, the opening section, and 46 individual chapter pages.

The GitHub Actions workflow **Draft Meridian translations (free offline)** uses Argos Translate and downloadable offline language models. It does not call DeepL, Gemini, OpenAI, GitHub Models, or any paid inference API.

Supported pairs verified in the Argos package index: en→ru, de, fr, it, ja, zh, tr, hi.

Run the workflow manually, select a language, and set chapter to all, prologue, or a chapter number (01–46). The all option generates the contents page, prologue, and all 46 chapters as separate localized HTML files.

## Editorial rule

Argos is an offline neural machine-translation engine. Its output is a **draft**, not a professional literary translation. The workflow creates or updates a translation-draft branch and opens a draft pull request. Generated pages are marked noindex and visibly labeled as machine-translation drafts. The live site and sitemap remain unchanged.

A draft must receive literary editing, terminology/continuity review, and QA before promotion to the live locale directory and inclusion in the fiction sitemap.

Protected names and project terms are listed in glossary.json.

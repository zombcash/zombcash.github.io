# THE MERIDIAN OF ASH — chapter translation workflow

The approved English edition is the source of truth: the contents page, opening section, and 46 individual chapter pages.

## Free offline translation engine

The GitHub Actions workflow **Draft Meridian translations (free offline TranslateGemma)** uses Google's translation-specialized TranslateGemma 4B model locally through llama.cpp. It uses the Q4_K_M GGUF build and does not call DeepL, Gemini APIs, OpenAI APIs, GitHub Models, or any paid inference service.

Model source: azmnc/translategemma-4b-it-Q4_K_M_GGUF  
Base model: google/translategemma-4b-it  
Runtime: llama-cpp-python CPU wheel  
Model terms: Gemma Terms of Use (not Apache 2.0). The model weights are downloaded only during GitHub Actions runs and are not committed to this repository.

TranslateGemma is specifically trained for translation across 55 languages, including all eight target languages used here.

## Run

Dispatch the workflow for each language with two ranges:

- 01-23: contents page, prologue, and chapters 01–23
- 24-46: chapters 24–46

The two batches run independently on separate branches to stay within GitHub Actions' six-hour job limit. The first range creates the contents and opening pages. After both ranges finish, run **Assemble complete Meridian translation draft** for that language. It combines the two branches into one complete review branch.

The sample mode translates the first three paragraphs of Chapter 01 for quality evaluation. It is not a published chapter.

## Protected-term normalization

After the two ranges are assembled, run **Normalize Meridian glossary terms** for each language. Its sample mode checks exact proper-name preservation; its all mode updates only content blocks that contain protected terms. It also covers the title page and prologue and preserves inline formatting. It writes to a separate branch:

- `translation-tgemma-glossary/<language>`

The shared protected-term list is `translations/glossary.json`. The current QA checkpoint is `translations/QA_REPORT.md`.

## Word export

After all eight glossary branches are ready, run **Build Word manuscripts — THE MERIDIAN OF ASH**. It validates all 48 pages against the English source, verifies 6,744 paragraphs and draft-only safeguards, then creates one DOCX per language plus the shared glossary and QA report. The workflow packages all ten Word files into one ZIP artifact.

## Editorial and publishing rule

Model output is a translation draft, not a professionally proofread final edition. Draft pages are marked noindex and visibly labeled as machine drafts. The live site and sitemap remain unchanged.

Before publication, each language must receive literary editing, name and terminology consistency checks, chapter continuity review, and final QA. Only then should the combined draft be merged and its URLs added to the existing fiction sitemap.

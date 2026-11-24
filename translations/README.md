# THE MERIDIAN OF ASH — chapter translation workflow

The approved English edition is the source of truth: the contents page, opening section, and 46 individual chapter pages.

## Free offline translation engine

The GitHub Actions workflow **Draft Meridian translations (free offline TranslateGemma)** uses Google's translation-specialized TranslateGemma 4B model locally through llama.cpp. It uses the Q4_K_M GGUF build and does not call DeepL, Gemini APIs, OpenAI APIs, GitHub Models, or any paid inference service.

Model source: azmnc/translategemma-4b-it-Q4_K_M_GGUF  
Base model: google/translategemma-4b-it  
Runtime: llama-cpp-python CPU wheel  
Model terms: Gemma Terms of Use (not Apache 2.0). The model weights are downloaded only during the GitHub Actions run and are not committed to this repository.

TranslateGemma is specifically trained for translation across 55 languages, including all eight target languages used here.

## Run

Dispatch the workflow manually and choose:

- language: ru, de, fr, it, ja, zh-CN, tr, hi
- chapter: sample, all, prologue, or 01–46

The sample mode translates the first three paragraphs of Chapter 01 for quality evaluation. The all mode creates the contents page, prologue, and all 46 chapters as separate localized HTML pages.

## Editorial and publishing rule

Model output is a translation draft, not a professionally proofread final edition. Each run pushes to a separate translation-tgemma-draft branch. Draft pages are marked noindex and visibly labeled as machine drafts. The live site and sitemap remain unchanged.

Before publication, each language must receive literary editing, name and terminology consistency checks, chapter continuity review, and final QA. Only then should the draft be merged and its URLs added to the fiction sitemap.

# THE MERIDIAN OF ASH — chapter translation workflow

The approved English edition is the source of truth. It consists of the book contents page, the opening section, and 46 individual chapter pages.

## Free offline translation engine

The GitHub Actions workflow **Draft Meridian translations (free offline Qwen3)** uses Qwen3-4B-Instruct-2507 locally through llama.cpp. The selected GGUF quantization is Q5_K_M. The base model is published under Apache 2.0 and supports multilingual instruction following and translation across 100+ languages.

Model source: bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF  
Base model: Qwen/Qwen3-4B-Instruct-2507  
Runtime: llama-cpp-python CPU wheel  
No DeepL, Gemini, OpenAI, GitHub Models, paid API, or paid inference service is used.

## Run

Dispatch the workflow manually and choose:

- language: ru, de, fr, it, ja, zh-CN, tr, hi
- chapter: sample, all, prologue, or 01–46

The sample mode translates the first three paragraphs of Chapter 01 for quality evaluation. The all mode creates the contents page, prologue, and all 46 chapters as separate localized HTML pages.

## Editorial and publishing rule

Model output is a translation draft, not a professionally proofread final edition. Each run pushes to a separate translation-qwen-draft branch. Draft pages are marked noindex and visibly labeled as machine drafts. The live site and sitemap remain unchanged.

Before publication, each language must receive literary editing, name and terminology consistency checks, chapter continuity review, and final QA. Only then should the draft be merged and its URLs added to the fiction sitemap.

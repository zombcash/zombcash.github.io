#!/usr/bin/env python3
"""Targeted protected-term normalization for TranslateGemma book drafts."""
from __future__ import annotations
import argparse, json, os, re
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Comment, Tag
from huggingface_hub import hf_hub_download
from llama_cpp import Llama

ROOT = Path(__file__).resolve().parents[1]
MODEL_REPO = "azmnc/translategemma-4b-it-Q4_K_M_GGUF"
MODEL_FILE = "translategemma-4b-it-Q4_K_M_GGUF.gguf"
LANGUAGES = {
    "ru": ("ru", "Russian"), "de": ("de", "German"), "fr": ("fr", "French"),
    "it": ("it", "Italian"), "ja": ("ja", "Japanese"), "zh-CN": ("zh", "Simplified Chinese"),
    "tr": ("tr", "Turkish"), "hi": ("hi", "Hindi"),
}
PROTECTED_TERMS = json.loads((ROOT / "translations/glossary.json").read_text(encoding="utf-8"))["protected_terms"]
INLINE_TAGS = {"strong", "em", "b", "i", "a", "span"}

def load_model():
    path = hf_hub_download(repo_id=MODEL_REPO, filename=MODEL_FILE)
    return Llama(model_path=path, n_ctx=2048, n_threads=min(4, max(2, os.cpu_count() or 2)),
                 n_batch=256, use_mmap=True, verbose=False)

def serialize_inline(node, inline_map):
    if isinstance(node, Comment):
        return ""
    if isinstance(node, NavigableString):
        return str(node)
    if isinstance(node, Tag):
        if node.name in INLINE_TAGS:
            index = len(inline_map) // 2
            op, cl = f"ZXQINLINEOPEN{index:03d}QZX", f"ZXQINLINECLOSE{index:03d}QZX"
            inline_map[op] = str(node).split(">", 1)[0] + ">"
            inline_map[cl] = f"</{node.name}>"
            return op + "".join(serialize_inline(c, inline_map) for c in node.contents) + cl
        return "".join(serialize_inline(c, inline_map) for c in node.contents)
    return ""

def protect_terms(text):
    protected = {}
    value = text
    for term in sorted(PROTECTED_TERMS, key=len, reverse=True):
        pattern = re.compile(re.escape(term), re.IGNORECASE)
        def repl(match):
            token = f"ZXQTERM{len(protected):03d}QZX"
            protected[token] = match.group(0)
            return token
        value = pattern.sub(repl, value)
    return value, protected

def translate_protected(model, source_text, target_code):
    inline_map = {}
    serialized = "".join(serialize_inline(c, inline_map) for c in source_text.contents)
    marked, term_map = protect_terms(serialized)
    all_markers = {**term_map, **inline_map}
    if not term_map:
        return None, "no_terms"
    prompt = f"en[sprt]{target_code}[sprt]{marked}"
    response = model.create_chat_completion(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1, top_p=0.95, repeat_penalty=1.0, max_tokens=1400, seed=42
    )
    output = response["choices"][0]["message"]["content"] or ""
    output = re.sub(r"<think>[\s\S]*?</think>", "", output).strip()
    for token in all_markers:
        if output.count(token) != 1:
            return None, f"marker_failure:{token}"
    for token, original in all_markers.items():
        output = output.replace(token, original)
    return output, None

def translate_segment(model, text, target_code):
    if not text or not text.strip():
        return text, None
    # A standalone protected name is already the desired target output.
    if any(re.fullmatch(re.escape(term), text.strip(), re.I) for term in PROTECTED_TERMS):
        return text, None
    marked, term_map = protect_terms(text)
    prompt = f"en[sprt]{target_code}[sprt]{marked}"
    response = model.create_chat_completion(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1, top_p=0.95, repeat_penalty=1.0, max_tokens=512, seed=42
    )
    output = response["choices"][0]["message"]["content"] or ""
    output = re.sub(r"<think>[\\s\\S]*?</think>", "", output).strip()
    for token, original in term_map.items():
        if output.count(token) != 1:
            return None, f"segment_marker_failure:{token}"
        output = output.replace(token, original)
    return output, None

def translate_inline_preserving_terms(model, source_paragraph, target_code):
    # Keep original inline tags/attributes; translate text nodes independently.
    fragment = BeautifulSoup(str(source_paragraph), "html.parser")
    paragraph = fragment.find(source_paragraph.name)
    for node in list(paragraph.find_all(string=True)):
        if isinstance(node, Comment) or not isinstance(node, NavigableString):
            continue
        raw = str(node)
        if not raw.strip():
            continue
        translated, error = translate_segment(model, raw, target_code)
        if error:
            return None, error
        node.replace_with(translated)
    return str(paragraph), None

def set_paragraph_html(paragraph, fragment):
    parsed = BeautifulSoup(fragment, "html.parser")
    paragraph.clear()
    for child in list(parsed.contents):
        paragraph.append(child)

def process_sample(model, lang, target_code, target_name):
    source = ROOT / "the-meridian-of-ash-chapter-01.html"
    soup = BeautifulSoup(source.read_text(encoding="utf-8"), "html.parser")
    out = [f"# Glossary protection test — {target_name}", "",
           "The source proper nouns are wrapped in unique markers during translation and restored exactly after inference.",
           "This sample is not a published chapter.", ""]
    count = 0
    for p in soup.select(".wrap h1, .wrap h2, .wrap h3, .wrap p, .wrap blockquote"):
        if not any(re.search(re.escape(t), p.get_text(" ", strip=True), re.I) for t in PROTECTED_TERMS):
            continue
        translated, error = translate_protected(model, p, target_code)
        if error:
            out += [f"## SKIPPED — {error}", p.get_text(" ", strip=True), ""]
            continue
        count += 1
        out += [f"## Example {count} — English", p.get_text(" ", strip=True), "",
                f"## Example {count} — {target_name}", BeautifulSoup(translated, "html.parser").get_text(" ", strip=True), ""]
        if count >= 5:
            break
    # Explicitly test the one source paragraph that contains inline emphasis and a protected name.
    formatted_page = BeautifulSoup((ROOT / "the-meridian-of-ash-chapter-32.html").read_text(encoding="utf-8"), "html.parser")
    formatted = next((p for p in formatted_page.select(".wrap p")
                      if p.find(["strong", "em", "b", "i"]) and
                      any(re.search(re.escape(t), p.get_text(" ", strip=True), re.I) for t in PROTECTED_TERMS)), None)
    if formatted:
        translated, error = translate_inline_preserving_terms(model, formatted, target_code)
        if error:
            out += [f"## FORMATTED INLINE TEST SKIPPED — {error}", formatted.get_text(" ", strip=True), ""]
        else:
            count += 1
            out += ["## Formatted inline test — English", str(formatted), "",
                    f"## Formatted inline test — {target_name}", translated, ""]
    dest = ROOT / "translations" / "samples" / f"glossary-protection-{lang}.md"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text("\n".join(out), encoding="utf-8")
    print(json.dumps({"mode":"sample","language":lang,"successful_examples":count,"output":str(dest.relative_to(ROOT))},ensure_ascii=False),flush=True)

def process_all(model, lang, target_code):
    files = ["the-meridian-of-ash.html", "the-meridian-of-ash-prologue.html"] + [
        f"the-meridian-of-ash-chapter-{i:02d}.html" for i in range(1,47)
    ]
    updated = candidates = skipped = 0
    per_term = {term: 0 for term in PROTECTED_TERMS}
    for filename in files:
        source_path = ROOT / filename
        target_path = ROOT / lang / filename
        if not source_path.exists() or not target_path.exists():
            raise FileNotFoundError(f"Missing source or translated page: {filename}")
        source_soup = BeautifulSoup(source_path.read_text(encoding="utf-8"), "html.parser")
        target_soup = BeautifulSoup(target_path.read_text(encoding="utf-8"), "html.parser")
        # Include the title page and prologue, which use .wrap blocks rather than .chapter-copy.
        selector = ".wrap h1, .wrap h2, .wrap h3, .wrap p, .wrap blockquote"
        source_ps = source_soup.select(selector)
        target_ps = target_soup.select(selector)
        if len(source_ps) != len(target_ps):
            raise RuntimeError(f"Content-block count mismatch in {filename}: {len(source_ps)} vs {len(target_ps)}")
        page_changed = False
        for source_p, target_p in zip(source_ps, target_ps):
            source_text = source_p.get_text(" ", strip=True)
            hits = [term for term in PROTECTED_TERMS if re.search(re.escape(term), source_text, re.I)]
            if not hits:
                continue
            candidates += 1
            for term in hits:
                per_term[term] += 1
            if source_p.find(list(INLINE_TAGS)):
                translated, error = translate_inline_preserving_terms(model, source_p, target_code)
            else:
                translated, error = translate_protected(model, source_p, target_code)
            if error:
                skipped += 1
                print(f"SKIP {filename}: {error}", flush=True)
                continue
            set_paragraph_html(target_p, translated)
            updated += 1
            page_changed = True
        if page_changed:
            target_path.write_text(str(target_soup), encoding="utf-8")
            print(f"UPDATED {lang}/{filename}", flush=True)
    report = {"mode":"all","language":lang,"pages":len(files),"candidate_paragraphs":candidates,
              "updated_paragraphs":updated,"skipped_paragraphs":skipped,"source_term_hits":per_term,
              "status":"draft_only_requires_editorial_review"}
    print(json.dumps(report,ensure_ascii=False),flush=True)

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--language",required=True,choices=sorted(LANGUAGES))
    parser.add_argument("--mode",required=True,choices=["sample","all"])
    args=parser.parse_args()
    target_code,target_name=LANGUAGES[args.language]
    model=load_model()
    if args.mode=="sample":
        process_sample(model,args.language,target_code,target_name)
    else:
        process_all(model,args.language,target_code)

if __name__=="__main__":
    main()

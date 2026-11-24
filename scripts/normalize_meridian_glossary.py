#!/usr/bin/env python3
"""Targeted protected-term normalization for TranslateGemma book drafts."""
from __future__ import annotations
import argparse, json, os, re
import requests
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

def term_pattern(term):
    return re.compile(r"(?<![A-Za-z0-9])" + re.escape(term) + r"(?![A-Za-z0-9])", re.I)

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
        pattern = term_pattern(term)
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
            if inline_map:
                return None, f"marker_failure:{token}"
            return translate_with_explicit_glossary(model, source_text.get_text(" ", strip=True), target_code, term_map.values())
    for token, original in all_markers.items():
        output = output.replace(token, original)
    return output, None

def translate_with_explicit_glossary(model, text, target_code, protected_names):
    names = list(dict.fromkeys(protected_names))
    marked_text = text
    for name in sorted(names, key=len, reverse=True):
        pattern = term_pattern(name)
        marked_text = pattern.sub(lambda match: "⟦" + match.group(0) + "⟧", marked_text)
    prompt = (
        f"Translate the following English text into {target_code}. "
        "Copy every phrase enclosed in the special brackets ⟦ and ⟧ exactly as written. "
        "Do not translate, transliterate, respell, or change capitalization inside those brackets. "
        "Keep the brackets in the output. Output only the translated text.\n\nTEXT:\n" + marked_text
    )
    response = model.create_chat_completion(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1, top_p=0.95, repeat_penalty=1.0, max_tokens=1400, seed=42
    )
    output = response["choices"][0]["message"]["content"] or ""
    output = re.sub(r"<think>[\s\S]*?</think>", "", output).strip()
    for name in names:
        bracketed = re.compile("⟦" + re.escape(name) + "⟧", re.I)
        if bracketed.search(output):
            output = bracketed.sub(lambda match: name, output)
            continue
        plain = term_pattern(name)
        if plain.search(output):
            output = plain.sub(lambda match: name, output)
            continue
        return None, f"bracketed_glossary_missing:{name}"
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
    output = re.sub(r"<think>[\s\S]*?</think>", "", output).strip()
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

def normalize_inline_terms(model, source_paragraph, target_paragraph, target_code):
    # Keep the existing translated sentence. Replace only the protected name inside matching inline tags.
    source_tags = [tag for tag in source_paragraph.find_all(list(INLINE_TAGS))
                   if not tag.find(list(INLINE_TAGS))]
    target_tags = [tag for tag in target_paragraph.find_all(list(INLINE_TAGS))
                   if not tag.find(list(INLINE_TAGS))]
    if len(source_tags) != len(target_tags):
        return None, "inline_tag_count_mismatch"
    changed = False
    for source_tag, target_tag in zip(source_tags, target_tags):
        source_text = source_tag.get_text(" ", strip=True)
        hits = [term for term in PROTECTED_TERMS if term_pattern(term).search(source_text)]
        if not hits:
            continue
        if any(re.fullmatch(re.escape(term), source_text, re.I) for term in hits):
            normalized = source_text
        else:
            normalized, error = translate_segment(model, source_text, target_code)
            if error:
                return None, error
        target_tag.clear()
        target_tag.append(normalized)
        changed = True
    if not changed:
        return None, "no_protected_inline_term"
    return str(target_paragraph), None

def translate_full_block_with_inline_terms(model, source_paragraph, target_code):
    # Translate the full sentence for natural syntax while protecting proper nouns.
    source_text = source_paragraph.get_text(" ", strip=True)
    marked, term_map = protect_terms(source_text)
    if not term_map:
        return None, "no_terms"
    prompt = f"en[sprt]{target_code}[sprt]{marked}"
    response = model.create_chat_completion(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1, top_p=0.95, repeat_penalty=1.0, max_tokens=1400, seed=42
    )
    output = response["choices"][0]["message"]["content"] or ""
    output = re.sub(r"<think>[\s\S]*?</think>", "", output).strip()
    marker_failed = any(output.count(token) != 1 for token in term_map)
    if marker_failed:
        output, error = translate_with_explicit_glossary(model, source_text, target_code, term_map.values())
        if error:
            return None, f"inline_block_{error}"
    else:
        for token, original in term_map.items():
            output = output.replace(token, original)
    # Reapply the original inline tag to the corresponding protected term.
    for source_tag in source_paragraph.find_all(list(INLINE_TAGS)):
        tag_text = source_tag.get_text(" ", strip=True)
        hits = [term for term in PROTECTED_TERMS if term_pattern(term).search(tag_text)]
        for term in hits:
            match = term_pattern(term).search(tag_text)
            exact = match.group(0) if match else term
            open_tag = str(source_tag).split(">", 1)[0] + ">"
            close_tag = f"</{source_tag.name}>"
            pattern = term_pattern(exact)
            output, count = pattern.subn(open_tag + exact + close_tag, output, count=1)
            if count != 1:
                return None, f"inline_term_reinsert_failure:{exact}"
            break
    return output, None

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
        if not any(term_pattern(t).search(p.get_text(" ", strip=True)) for t in PROTECTED_TERMS):
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
    # Explicitly test the one source paragraph that contains inline formatting and a protected name.
    import copy
    formatted_page = BeautifulSoup((ROOT / "the-meridian-of-ash-chapter-32.html").read_text(encoding="utf-8"), "html.parser")
    formatted_items = formatted_page.select(".wrap p")
    formatted_index = next((i for i,p in enumerate(formatted_items)
                            if p.find(list(INLINE_TAGS)) and
                            any(term_pattern(t).search(p.get_text(" ", strip=True)) for t in PROTECTED_TERMS)), None)
    if formatted_index is not None:
        target_url = f"https://raw.githubusercontent.com/zombcash/zombcash.github.io/translation-tgemma-combined/{lang}/{lang}/the-meridian-of-ash-chapter-32.html"
        target_response = requests.get(target_url, timeout=40)
        if not target_response.ok:
            out += [f"## FORMATTED INLINE TEST SKIPPED — target page HTTP {target_response.status_code}", ""]
        else:
            target_page = BeautifulSoup(target_response.text, "html.parser")
            target_items = target_page.select(".wrap p")
            if formatted_index >= len(target_items):
                out += ["## FORMATTED INLINE TEST SKIPPED — paragraph index mismatch", ""]
            else:
                target_paragraph = BeautifulSoup(str(target_items[formatted_index]), "html.parser").find("p")
                translated, error = translate_full_block_with_inline_terms(model, formatted_items[formatted_index], target_code)
                if error:
                    out += [f"## FORMATTED INLINE TEST SKIPPED — {error}", ""]
                else:
                    count += 1
                    out += ["## Formatted inline test — English", str(formatted_items[formatted_index]), "",
                            "## Existing translated paragraph before glossary normalization", str(target_items[formatted_index]), "",
                            f"## {target_name} full-context correction", translated, ""]
    dest = ROOT / "translations" / "samples" / f"glossary-protection-{lang}.md"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text("\n".join(out), encoding="utf-8")
    print(json.dumps({"mode":"sample","language":lang,"successful_examples":count,"output":str(dest.relative_to(ROOT))},ensure_ascii=False),flush=True)

def process_all(model, lang, target_code):
    files = ["the-meridian-of-ash.html", "the-meridian-of-ash-prologue.html"] + [
        f"the-meridian-of-ash-chapter-{i:02d}.html" for i in range(1,47)
    ]
    updated = candidates = skipped = already_ok = 0
    per_term = {term: 0 for term in PROTECTED_TERMS}
    skipped_items = []
    for filename in files:
        source_path = ROOT / filename
        target_path = ROOT / lang / filename
        if not source_path.exists() or not target_path.exists():
            raise FileNotFoundError(f"Missing source or translated page: {filename}")
        source_soup = BeautifulSoup(source_path.read_text(encoding="utf-8"), "html.parser")
        target_soup = BeautifulSoup(target_path.read_text(encoding="utf-8"), "html.parser")
        selector = ".wrap h1, .wrap h2, .wrap h3, .wrap p, .wrap blockquote"
        source_ps = source_soup.select(selector)
        target_ps = target_soup.select(selector)
        if len(source_ps) != len(target_ps):
            raise RuntimeError(f"Content-block count mismatch in {filename}: {len(source_ps)} vs {len(target_ps)}")
        page_changed = False
        for block_index, (source_p, target_p) in enumerate(zip(source_ps, target_ps)):
            source_text = source_p.get_text(" ", strip=True)
            hits = []
            for term in PROTECTED_TERMS:
                matches = [match.group(0) for match in term_pattern(term).finditer(source_text)]
                if matches:
                    per_term[term] += 1
                    hits.extend(matches)
            if not hits:
                continue
            candidates += 1
            # The title is a protected publication name, not a translatable phrase.
            is_book_title = filename == "the-meridian-of-ash.html" and source_p.name == "h1" and source_text.strip().upper() == "THE MERIDIAN OF ASH"
            if not is_book_title:
                target_text = target_p.get_text(" ", strip=True)
                if all(term_pattern(term).search(target_text) for term in hits):
                    already_ok += 1
                    continue
            if is_book_title:
                translated, error = "THE MERIDIAN<br/>OF ASH", None
            elif source_p.find(list(INLINE_TAGS)):
                translated, error = translate_full_block_with_inline_terms(model, source_p, target_code)
            else:
                translated, error = translate_protected(model, source_p, target_code)
            if error:
                skipped += 1
                skipped_items.append({"file": filename, "block_index": block_index, "source": source_text[:240], "error": error})
                print(f"SKIP {filename} block={block_index}: {error}", flush=True)
                continue
            set_paragraph_html(target_p, translated)
            updated += 1
            page_changed = True
        if page_changed:
            target_path.write_text(str(target_soup), encoding="utf-8")
            print(f"UPDATED {lang}/{filename}", flush=True)
    report = {"mode":"incremental_repair","language":lang,"pages":len(files),"candidate_blocks":candidates,
              "already_normalized_blocks":already_ok,"repaired_blocks":updated,"skipped_blocks":skipped,
              "skipped_items":skipped_items,"source_term_hits":per_term,
              "status":"draft_only_requires_editorial_review"}
    report_path = ROOT / "translations" / f"glossary-qa-{lang}.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
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

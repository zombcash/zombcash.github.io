#!/usr/bin/env python3
"""Generate Qwen3 offline translation drafts for THE MERIDIAN OF ASH."""
from __future__ import annotations
import argparse, html, json, os, re, time
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Comment, Tag
from huggingface_hub import hf_hub_download
from llama_cpp import Llama

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://zombcash.github.io"
MODEL_REPO = "bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF"
MODEL_FILE = "Qwen_Qwen3-4B-Instruct-2507-Q5_K_M.gguf"
LANGUAGES = {
    "ru": "Russian",
    "de": "German",
    "fr": "French",
    "it": "Italian",
    "ja": "Japanese",
    "zh-CN": "Simplified Chinese",
    "tr": "Turkish",
    "hi": "Hindi",
}
GLOSSARY = json.loads((ROOT / "translations/glossary.json").read_text(encoding="utf-8"))["protected_terms"]
SYSTEM_STYLE = (
    "You are a senior literary translator working on a complete post-apocalyptic speculative-fiction novel. "
    "Translate faithfully into the requested target language. Preserve meaning, subtext, imagery, atmosphere, "
    "narrative tense, pacing, sentence rhythm, paragraph order, dialogue formatting, and distinct character voices. "
    "Use natural, idiomatic, publishable literary prose; avoid literal calques and generic machine-translation phrasing. "
    "Do not summarize, omit, simplify, censor, explain, or add anything. Keep all character names, place names, "
    "and protected fictional terms exactly as provided. Any token beginning with ZXQ and ending with QZX is a "
    "structural marker: copy it exactly, unchanged, once, and in its original position. Return only the translation."
)

def load_model():
    model_path = hf_hub_download(repo_id=MODEL_REPO, filename=MODEL_FILE)
    print(f"Loaded model file: {MODEL_FILE}", flush=True)
    return Llama(
        model_path=model_path,
        n_ctx=8192,
        n_threads=min(4, max(2, os.cpu_count() or 2)),
        n_batch=512,
        use_mmap=True,
        verbose=False,
    )

def protect_terms(text):
    protected = {}
    value = text
    for term_index, term in enumerate(sorted(GLOSSARY, key=len, reverse=True)):
        pattern = re.compile(re.escape(term), re.IGNORECASE)
        def repl(match, i=term_index):
            token = f"ZXQTERM{i:02d}X{len(protected):03d}QZX"
            protected[token] = match.group(0)
            return token
        value = pattern.sub(repl, value)
    return value, protected

def restore_terms(text, protected):
    for token, original in protected.items():
        if text.count(token) != 1:
            raise RuntimeError(f"Model changed or lost protected term marker {token}")
        text = text.replace(token, original)
    return text

def chat(model, messages, max_tokens=4096):
    response = model.create_chat_completion(
        messages=messages,
        temperature=0.15,
        top_p=0.9,
        repeat_penalty=1.05,
        max_tokens=max_tokens,
        stop=["<|im_end|>", "<|endoftext|>"],
        seed=42,
    )
    output = response["choices"][0]["message"]["content"] or ""
    output = re.sub(r"<think>[\s\S]*?</think>", "", output).strip()
    tick = chr(96)
    output = output.replace(tick * 3 + "text", "").replace(tick * 3, "").strip()
    return output

def translate_text(model, text, target_language):
    if not text or not text.strip():
        return text
    value, protected = protect_terms(text)
    prompt = f"Translate this English text into {target_language}. Return only the translation.\n\n{value}"
    output = chat(model, [
        {"role": "system", "content": SYSTEM_STYLE},
        {"role": "user", "content": prompt},
    ], max_tokens=2048)
    return restore_terms(output, protected)

def serialize_inline(node, inline_map):
    if isinstance(node, Comment):
        return ""
    if isinstance(node, NavigableString):
        return str(node)
    if isinstance(node, Tag):
        if node.name in {"strong", "em", "b", "i"}:
            i = len(inline_map)
            open_token = f"ZXQINLINEOPEN{i:03d}QZX"
            close_token = f"ZXQINLINECLOSE{i:03d}QZX"
            inline_map[open_token] = f"<{node.name}>"
            inline_map[close_token] = f"</{node.name}>"
            return open_token + "".join(serialize_inline(c, inline_map) for c in node.contents) + close_token
        return "".join(serialize_inline(c, inline_map) for c in node.contents)
    return ""

def translate_paragraph_group(model, paragraphs, target_language):
    inline_maps, term_maps, markers, lines = [], [], [], []
    for index, paragraph in enumerate(paragraphs):
        inline_map = {}
        raw = "".join(serialize_inline(child, inline_map) for child in paragraph.contents)
        protected, term_map = protect_terms(raw)
        marker = f"ZXQPARA{index:04d}QZX"
        markers.append(marker)
        inline_maps.append(inline_map)
        term_maps.append(term_map)
        lines.append(marker + "\n" + protected)

    user_prompt = (
        f"Translate the following English literary passage into {target_language}. "
        "Keep every ZXQ marker exactly unchanged, once, and in the same order. "
        "Preserve the paragraph boundaries. Return only the translated passage.\n\n"
        + "\n\n".join(lines)
    )
    output = chat(model, [
        {"role": "system", "content": SYSTEM_STYLE},
        {"role": "user", "content": user_prompt},
    ], max_tokens=4096)

    found = list(re.finditer(r"ZXQPARA(\d{4})QZX", output))
    ids = [int(m.group(1)) for m in found]
    expected = list(range(len(paragraphs)))
    if ids != expected:
        raise RuntimeError(f"Paragraph markers changed: expected {expected}, got {ids}")

    translated_items = []
    for i, match in enumerate(found):
        end = found[i + 1].start() if i + 1 < len(found) else len(output)
        value = re.sub(r"\s+", " ", output[match.end():end].strip())
        value = restore_terms(value, term_maps[i])
        for token, original in inline_maps[i].items():
            if value.count(token) != 1:
                raise RuntimeError(f"Inline marker lost or duplicated: {token}")
            value = value.replace(token, original)
        translated_items.append(value)
    return translated_items

def chunk_paragraphs(paragraphs, max_words=700):
    group, words = [], 0
    for paragraph in paragraphs:
        count = len(paragraph.get_text(" ", strip=True).split())
        if group and words + count > max_words:
            yield group
            group, words = [], 0
        group.append(paragraph)
        words += count
    if group:
        yield group

def replace_paragraph_html(paragraph, translated):
    fragment = html.escape(translated, quote=False)
    for tag in ("strong", "em", "b", "i"):
        fragment = fragment.replace(f"&lt;{tag}&gt;", f"<{tag}>")
        fragment = fragment.replace(f"&lt;/{tag}&gt;", f"</{tag}>")
    parsed = BeautifulSoup(fragment, "html.parser")
    paragraph.clear()
    for child in list(parsed.contents):
        paragraph.append(child)

def translate_page(model, source_path, target_path, locale, target_language, available_files):
    soup = BeautifulSoup(source_path.read_text(encoding="utf-8"), "html.parser")
    prose = soup.select(".chapter-copy p")
    translated_count = 0
    for group_index, group in enumerate(chunk_paragraphs(prose), 1):
        try:
            translated = translate_paragraph_group(model, group, target_language)
        except Exception:
            if len(group) == 1:
                raise
            translated = []
            for paragraph in group:
                translated.extend(translate_paragraph_group(model, [paragraph], target_language))
        if len(translated) != len(group):
            raise RuntimeError("Paragraph count mismatch after translation")
        for paragraph, value in zip(group, translated):
            replace_paragraph_html(paragraph, value)
            translated_count += 1
        if group_index % 10 == 0:
            print(f"{source_path.name}: translated {translated_count}/{len(prose)} prose paragraphs", flush=True)

    if soup.body:
        for node in list(soup.body.find_all(string=True)):
            if isinstance(node, Comment) or not isinstance(node, NavigableString):
                continue
            if node.parent and node.parent.name in {"script", "style"}:
                continue
            if node.find_parent(class_="chapter-copy"):
                continue
            raw = str(node)
            if not raw.strip():
                continue
            leading = raw[:len(raw) - len(raw.lstrip())]
            trailing = raw[len(raw.rstrip()):]
            node.replace_with(leading + translate_text(model, raw.strip(), target_language) + trailing)

    title = soup.find("title")
    if title and title.string:
        title.string.replace_with(translate_text(model, str(title.string), target_language))
    for meta in soup.find_all("meta"):
        key, prop = meta.get("name", "").lower(), meta.get("property", "").lower()
        if meta.get("content") and (key in {"description", "twitter:title"} or prop in {"og:title", "og:description"}):
            meta["content"] = translate_text(model, meta["content"], target_language)

    if soup.html:
        soup.html["lang"] = locale
    for anchor in soup.select("a[href]"):
        href = anchor.get("href", "")
        if href.startswith("/the-meridian-of-ash"):
            filename = href.lstrip("/")
            if filename in available_files or (ROOT / locale / filename).exists():
                anchor["href"] = f"/{locale}{href}"

    filename = source_path.name
    english_url = f"{BASE_URL}/{filename}"
    localized_url = f"{BASE_URL}/{locale}/{filename}"
    head = soup.head
    if head:
        for link in list(head.find_all("link", rel=True)):
            rel = link.get("rel", [])
            if "canonical" in rel or "alternate" in rel:
                link.decompose()
        head.append(soup.new_tag("link", rel="canonical", href=localized_url))
        hreflang = "zh-Hans" if locale == "zh-CN" else locale
        for language_code, url in [("en", english_url), (hreflang, localized_url), ("x-default", english_url)]:
            head.append(soup.new_tag("link", rel="alternate", hreflang=language_code, href=url))
        og_url = head.find("meta", attrs={"property": "og:url"})
        if og_url:
            og_url["content"] = localized_url
        robots = head.find("meta", attrs={"name": "robots"})
        if robots:
            robots["content"] = "noindex,follow"
        else:
            head.append(soup.new_tag("meta", attrs={"name": "robots", "content": "noindex,follow"}))
        description = head.find("meta", attrs={"name": "description"})
        og_desc = head.find("meta", attrs={"property": "og:description"})
        if not description:
            head.append(soup.new_tag("meta", attrs={"name": "description", "content": og_desc.get("content", "") if og_desc else ""}))
        style = head.find("style")
        if style:
            style.append("\n.translation-draft-banner{margin:14px auto 0;padding:10px 14px;max-width:1080px;border:1px solid #68757d;border-radius:8px;background:#202a31;color:#e0e6e9;font:600 12px/1.5 system-ui,sans-serif;letter-spacing:.08em;text-align:center}\n")
    if soup.body:
        banner = soup.new_tag("div", attrs={"class": "translation-draft-banner", "role": "note"})
        banner.string = translate_text(model, "MACHINE TRANSLATION DRAFT — EDITORIAL REVIEW REQUIRED", target_language)
        soup.body.insert(0, banner)

    target_path.parent.mkdir(parents=True, exist_ok=True)
    target_path.write_text(str(soup), encoding="utf-8")
    return translated_count

def translate_sample(model, locale, target_language):
    source = ROOT / "the-meridian-of-ash-chapter-01.html"
    soup = BeautifulSoup(source.read_text(encoding="utf-8"), "html.parser")
    paragraphs = soup.select(".chapter-copy p")[:3]
    translated = translate_paragraph_group(model, paragraphs, target_language)
    out = [
        f"# Qwen3 literary translation sample — {target_language}",
        "",
        "Model: Qwen3-4B-Instruct-2507, Q5_K_M, offline CPU inference.",
        "This is a quality sample only; it is not a published chapter.",
        "",
    ]
    for i, (p, t) in enumerate(zip(paragraphs, translated), 1):
        out += [f"## Paragraph {i} — English", p.get_text(" ", strip=True), "", f"## Paragraph {i} — {target_language}", t, ""]
    path = ROOT / "translations" / "samples" / f"{locale}-chapter-01.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(out), encoding="utf-8")
    print(f"Created {path.relative_to(ROOT)}", flush=True)

def select_files(chapter):
    if chapter == "all":
        return ["the-meridian-of-ash.html", "the-meridian-of-ash-prologue.html"] + [f"the-meridian-of-ash-chapter-{i:02d}.html" for i in range(1,47)]
    if chapter == "prologue":
        return ["the-meridian-of-ash-prologue.html"]
    if re.fullmatch(r"\d{1,2}", chapter) and 1 <= int(chapter) <= 46:
        return [f"the-meridian-of-ash-chapter-{int(chapter):02d}.html"]
    raise ValueError("chapter must be sample, all, prologue, or a number from 01 to 46")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--language", required=True, choices=sorted(LANGUAGES))
    parser.add_argument("--chapter", default="sample")
    args = parser.parse_args()
    locale, target_language = args.language, LANGUAGES[args.language]
    model = load_model()
    if args.chapter == "sample":
        translate_sample(model, locale, target_language)
        return
    files = select_files(args.chapter)
    available_files = set(files)
    output_dir = ROOT / locale
    sample_path = ROOT / "translations" / "samples" / f"{locale}-chapter-01.md"
    if sample_path.exists():
        sample_path.unlink()
    started = time.time()
    pages, paragraphs = 0, 0
    for filename in files:
        source = ROOT / filename
        if not source.exists():
            raise FileNotFoundError(source)
        count = translate_page(model, source, output_dir / filename, locale, target_language, available_files)
        pages += 1
        paragraphs += count
        print(f"Created {locale}/{filename} ({count} prose paragraphs)", flush=True)
    print(json.dumps({
        "language": locale,
        "files": pages,
        "translated_prose_paragraphs": paragraphs,
        "elapsed_seconds": round(time.time() - started, 1),
        "status": "machine_draft_requires_literary_review"
    }, ensure_ascii=False), flush=True)

if __name__ == "__main__":
    main()

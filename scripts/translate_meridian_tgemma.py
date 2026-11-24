#!/usr/bin/env python3
"""Generate TranslateGemma offline translation drafts for THE MERIDIAN OF ASH."""
from __future__ import annotations
import argparse, json, os, re, time
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Comment
from huggingface_hub import hf_hub_download
from llama_cpp import Llama

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://zombcash.github.io"
MODEL_REPO = "azmnc/translategemma-4b-it-Q4_K_M_GGUF"
MODEL_FILE = "translategemma-4b-it-Q4_K_M_GGUF.gguf"
LANGUAGES = {
    "ru": ("ru", "Russian"),
    "de": ("de", "German"),
    "fr": ("fr", "French"),
    "it": ("it", "Italian"),
    "ja": ("ja", "Japanese"),
    "zh-CN": ("zh", "Simplified Chinese"),
    "tr": ("tr", "Turkish"),
    "hi": ("hi", "Hindi"),
}

def load_model():
    model_path = hf_hub_download(repo_id=MODEL_REPO, filename=MODEL_FILE)
    print(f"Loaded TranslateGemma model: {MODEL_FILE}", flush=True)
    return Llama(
        model_path=model_path,
        n_ctx=2048,
        n_threads=min(4, max(2, os.cpu_count() or 2)),
        n_batch=256,
        use_mmap=True,
        verbose=False,
    )

def translate_text(model, text, target_code):
    if not text or not text.strip():
        return text
    # TranslateGemma's documented input format is source-code[sprt]target-code[sprt]text.
    prompt = f"en[sprt]{target_code}[sprt]{text}"
    response = model.create_chat_completion(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        top_p=0.95,
        repeat_penalty=1.0,
        max_tokens=1024,
        seed=42,
    )
    output = response["choices"][0]["message"]["content"] or ""
    output = re.sub(r"<think>[\s\S]*?</think>", "", output).strip()
    return output

def translate_paragraph(model, paragraph, target_code):
    # Translate a plain paragraph as one unit to retain its sentence context.
    # If inline emphasis exists, translate each text segment and keep the HTML tags untouched.
    if paragraph.find(["strong", "em", "b", "i"]):
        for node in list(paragraph.find_all(string=True)):
            if isinstance(node, Comment) or not isinstance(node, NavigableString):
                continue
            raw = str(node)
            if raw.strip():
                leading = raw[:len(raw) - len(raw.lstrip())]
                trailing = raw[len(raw.rstrip()):]
                node.replace_with(leading + translate_text(model, raw.strip(), target_code) + trailing)
    else:
        source_text = paragraph.get_text(" ", strip=True)
        paragraph.clear()
        paragraph.append(translate_text(model, source_text, target_code))
    return paragraph

def chunk_paragraphs(paragraphs, max_words=250):
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

def translate_page(model, source_path, target_path, locale, target_code, available_files):
    soup = BeautifulSoup(source_path.read_text(encoding="utf-8"), "html.parser")
    prose = soup.select(".chapter-copy p")
    translated_count = 0
    for paragraph in prose:
        translate_paragraph(model, paragraph, target_code)
        translated_count += 1
        if translated_count % 50 == 0:
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
            node.replace_with(leading + translate_text(model, raw.strip(), target_code) + trailing)

    title = soup.find("title")
    if title and title.string:
        title.string.replace_with(translate_text(model, str(title.string), target_code))
    for meta in soup.find_all("meta"):
        key, prop = meta.get("name", "").lower(), meta.get("property", "").lower()
        if meta.get("content") and (key in {"description", "twitter:title"} or prop in {"og:title", "og:description"}):
            meta["content"] = translate_text(model, meta["content"], target_code)

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
        banner.string = "MACHINE TRANSLATION DRAFT — EDITORIAL REVIEW REQUIRED"
        soup.body.insert(0, banner)

    target_path.parent.mkdir(parents=True, exist_ok=True)
    target_path.write_text(str(soup), encoding="utf-8")
    return translated_count

def translate_sample(model, locale, target_code, target_name):
    source = ROOT / "the-meridian-of-ash-chapter-01.html"
    soup = BeautifulSoup(source.read_text(encoding="utf-8"), "html.parser")
    paragraphs = soup.select(".chapter-copy p")[:3]
    translated = [translate_text(model, p.get_text(" ", strip=True), target_code) for p in paragraphs]
    out = [
        f"# TranslateGemma quality sample — {target_name}",
        "",
        "Model: Google TranslateGemma 4B, Q4_K_M, offline CPU inference.",
        "This is a quality sample only; it is not a published chapter.",
        "",
    ]
    for i, (p, t) in enumerate(zip(paragraphs, translated), 1):
        out += [f"## Paragraph {i} — English", p.get_text(" ", strip=True), "", f"## Paragraph {i} — {target_name}", t, ""]
    path = ROOT / "translations" / "samples" / f"tgemma-{locale}-chapter-01.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(out), encoding="utf-8")
    print(f"Created {path.relative_to(ROOT)}", flush=True)

def select_files(chapter):
    if chapter == "all":
        return ["the-meridian-of-ash.html", "the-meridian-of-ash-prologue.html"] + [f"the-meridian-of-ash-chapter-{i:02d}.html" for i in range(1,47)]
    if chapter == "prologue":
        return ["the-meridian-of-ash-prologue.html"]
    if re.fullmatch(r"\d{2}-\d{2}", chapter):
        start, end = [int(x) for x in chapter.split("-")]
        if not (1 <= start <= end <= 46):
            raise ValueError("chapter range must be within 01-46")
        files = []
        if start == 1:
            files.extend(["the-meridian-of-ash.html", "the-meridian-of-ash-prologue.html"])
        files.extend([f"the-meridian-of-ash-chapter-{i:02d}.html" for i in range(start, end + 1)])
        return files
    if re.fullmatch(r"\d{1,2}", chapter) and 1 <= int(chapter) <= 46:
        return [f"the-meridian-of-ash-chapter-{int(chapter):02d}.html"]
    raise ValueError("chapter must be sample, all, prologue, a number 01-46, or a range such as 01-23")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--language", required=True, choices=sorted(LANGUAGES))
    parser.add_argument("--chapter", default="sample")
    args = parser.parse_args()
    locale, (target_code, target_name) = args.language, LANGUAGES[args.language]
    model = load_model()
    if args.chapter == "sample":
        translate_sample(model, locale, target_code, target_name)
        return
    files = select_files(args.chapter)
    available_files = set(files)
    output_dir = ROOT / locale
    sample_path = ROOT / "translations" / "samples" / f"tgemma-{locale}-chapter-01.md"
    if sample_path.exists():
        sample_path.unlink()
    started = time.time()
    pages, paragraphs = 0, 0
    for filename in files:
        source = ROOT / filename
        if not source.exists():
            raise FileNotFoundError(source)
        count = translate_page(model, source, output_dir / filename, locale, target_code, available_files)
        pages += 1
        paragraphs += count
        print(f"Created {locale}/{filename} ({count} prose paragraphs)", flush=True)
    print(json.dumps({"language":locale,"files":pages,"translated_prose_paragraphs":paragraphs,"elapsed_seconds":round(time.time()-started,1),"status":"machine_draft_requires_literary_review"},ensure_ascii=False),flush=True)

if __name__ == "__main__":
    main()

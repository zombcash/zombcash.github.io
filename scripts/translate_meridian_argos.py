#!/usr/bin/env python3
"""Create reviewed-later, offline Argos translation drafts for THE MERIDIAN OF ASH."""
from __future__ import annotations
import argparse, json, re, time
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Comment
import argostranslate.package
import argostranslate.translate

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://zombcash.github.io"
LOCALES = {
    "ru": ("ru", "ru"), "de": ("de", "de"), "fr": ("fr", "fr"),
    "it": ("it", "it"), "ja": ("ja", "ja"), "zh-CN": ("zh", "zh-Hans"),
    "tr": ("tr", "tr"), "hi": ("hi", "hi"),
}
GLOSSARY = json.loads((ROOT / "translations/glossary.json").read_text(encoding="utf-8"))["protected_terms"]

def install_engine(target_code):
    argostranslate.package.update_package_index()
    installed = argostranslate.translate.get_installed_languages()
    source = next((x for x in installed if x.code == "en"), None)
    target = next((x for x in installed if x.code == target_code), None)
    if source is None or target is None or source.get_translation(target) is None:
        packages = argostranslate.package.get_available_packages()
        package = next((x for x in packages if x.from_code == "en" and x.to_code == target_code), None)
        if package is None:
            raise RuntimeError(f"No Argos package found for en->{target_code}")
        print(f"Downloading Argos model en->{target_code}", flush=True)
        argostranslate.package.install_from_path(package.download())
        installed = argostranslate.translate.get_installed_languages()
        source = next(x for x in installed if x.code == "en")
        target = next(x for x in installed if x.code == target_code)
    return source.get_translation(target)

def make_translator(engine):
    cache = {}
    terms = sorted(GLOSSARY, key=len, reverse=True)
    def translate(text):
        if not text or not text.strip(): return text
        if text in cache: return cache[text]
        protected = {}
        value = text
        for term_index, term in enumerate(terms):
            pattern = re.compile(re.escape(term), re.IGNORECASE)
            def replace(match, i=term_index):
                token = f"ZXQTERM{i:02d}X{len(protected):03d}QZX"
                protected[token] = match.group(0)
                return token
            value = pattern.sub(replace, value)
        translated = engine.translate(value)
        for token, original in protected.items():
            translated = translated.replace(token, original)
        cache[text] = translated
        return translated
    return translate, cache

def select_files(chapter):
    if chapter == "all":
        return ["the-meridian-of-ash.html", "the-meridian-of-ash-prologue.html"] + [f"the-meridian-of-ash-chapter-{i:02d}.html" for i in range(1,47)]
    if chapter == "prologue": return ["the-meridian-of-ash-prologue.html"]
    if re.fullmatch(r"\d{1,2}", chapter) and 1 <= int(chapter) <= 46:
        return [f"the-meridian-of-ash-chapter-{int(chapter):02d}.html"]
    raise ValueError("chapter must be all, prologue, or a number from 01 to 46")

def translate_page(source_path, target_path, locale, translate):
    soup = BeautifulSoup(source_path.read_text(encoding="utf-8"), "html.parser")
    count = 0
    for node in list(soup.body.find_all(string=True)) if soup.body else []:
        if isinstance(node, Comment) or not isinstance(node, NavigableString): continue
        if node.parent and node.parent.name in {"script","style"}: continue
        raw = str(node)
        if not raw.strip(): continue
        leading = raw[:len(raw)-len(raw.lstrip())]
        trailing = raw[len(raw.rstrip()):]
        node.replace_with(leading + translate(raw.strip()) + trailing)
        count += 1
        if count % 100 == 0: print(f"{source_path.name}: translated {count} text nodes", flush=True)

    title = soup.find("title")
    if title and title.string: title.string.replace_with(translate(str(title.string)))
    for meta in soup.find_all("meta"):
        key, prop = meta.get("name","").lower(), meta.get("property","").lower()
        if meta.get("content") and (key in {"description","twitter:title"} or prop in {"og:title","og:description"}):
            meta["content"] = translate(meta["content"])

    if soup.html: soup.html["lang"] = locale
    for anchor in soup.select("a[href]"):
        href = anchor.get("href","")
        if href.startswith("/the-meridian-of-ash"): anchor["href"] = f"/{locale}{href}"

    filename = source_path.name
    english_url = f"{BASE_URL}/{filename}"
    localized_url = f"{BASE_URL}/{locale}/{filename}"
    head = soup.head
    if head:
        for link in list(head.find_all("link", rel=True)):
            rel = link.get("rel", [])
            if "canonical" in rel or "alternate" in rel: link.decompose()
        head.append(soup.new_tag("link", rel="canonical", href=localized_url))
        for hreflang, url in [("en",english_url),(LOCALES[locale][1],localized_url),("x-default",english_url)]:
            head.append(soup.new_tag("link", rel="alternate", hreflang=hreflang, href=url))
        og_url = head.find("meta", attrs={"property":"og:url"})
        if og_url: og_url["content"] = localized_url
        robots = head.find("meta", attrs={"name":"robots"})
        if robots: robots["content"] = "noindex,follow"
        else: head.append(soup.new_tag("meta", attrs={"name":"robots","content":"noindex,follow"}))
        description = head.find("meta", attrs={"name":"description"})
        og_desc = head.find("meta", attrs={"property":"og:description"})
        if not description:
            head.append(soup.new_tag("meta", attrs={"name":"description","content":og_desc.get("content","") if og_desc else ""}))
        style = head.find("style")
        if style: style.append("\n.translation-draft-banner{margin:14px auto 0;padding:10px 14px;max-width:1080px;border:1px solid #68757d;border-radius:8px;background:#202a31;color:#e0e6e9;font:600 12px/1.5 system-ui,sans-serif;letter-spacing:.08em;text-align:center}\n")
    if soup.body:
        banner = soup.new_tag("div", attrs={"class":"translation-draft-banner","role":"note"})
        banner.string = translate("MACHINE TRANSLATION DRAFT — EDITORIAL REVIEW REQUIRED")
        soup.body.insert(0,banner)
    target_path.parent.mkdir(parents=True,exist_ok=True)
    target_path.write_text(str(soup),encoding="utf-8")
    return count

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--language",required=True,choices=sorted(LOCALES))
    parser.add_argument("--chapter",default="all")
    args=parser.parse_args()
    locale=args.language
    files=select_files(args.chapter)
    engine=install_engine(LOCALES[locale][0])
    translate,cache=make_translator(engine)
    output_dir=ROOT/locale
    started=time.time()
    total=0
    for filename in files:
        source=ROOT/filename
        if not source.exists(): raise FileNotFoundError(source)
        total+=translate_page(source,output_dir/filename,locale,translate)
        print(f"Created {locale}/{filename}",flush=True)
    print(json.dumps({"language":locale,"files":len(files),"translated_text_nodes":total,"unique_segments":len(cache),"elapsed_seconds":round(time.time()-started,1),"status":"machine_draft_requires_literary_review"},ensure_ascii=False),flush=True)

if __name__=="__main__": main()

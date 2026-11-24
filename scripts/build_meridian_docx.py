#!/usr/bin/env python3
"""Build a formatted Word manuscript from one complete localized Meridian reader branch."""
from __future__ import annotations
import argparse
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Tag, Comment
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path.cwd()
FILES = ["the-meridian-of-ash.html", "the-meridian-of-ash-prologue.html"] + [
    f"the-meridian-of-ash-chapter-{i:02d}.html" for i in range(1, 47)
]
LANG_NAMES = {"ru":"Russian","de":"German","fr":"French","it":"Italian","ja":"Japanese",
              "zh-CN":"Simplified Chinese","tr":"Turkish","hi":"Hindi"}

def page_soup(lang, filename):
    path = ROOT / lang / filename
    if not path.exists() or path.stat().st_size == 0:
        raise FileNotFoundError(path)
    return BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")

def visible_title(soup):
    h1 = soup.select_one(".wrap h1")
    return h1.get_text(" ", strip=True) if h1 else (soup.title.get_text(" ", strip=True) if soup.title else "")

def add_page_number(paragraph):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar"); begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText"); instr.set(qn("xml:space"), "preserve"); instr.text = " PAGE "
    separate = OxmlElement("w:fldChar"); separate.set(qn("w:fldCharType"), "separate")
    text = OxmlElement("w:t"); text.text = "1"
    end = OxmlElement("w:fldChar"); end.set(qn("w:fldCharType"), "end")
    for node in (begin, instr, separate, text, end):
        run._r.append(node)

def add_inline(paragraph, node, bold=False, italic=False):
    if isinstance(node, Comment):
        return
    if isinstance(node, NavigableString):
        if str(node):
            run = paragraph.add_run(str(node))
            run.bold = bold
            run.italic = italic
        return
    if not isinstance(node, Tag):
        return
    if node.name == "br":
        paragraph.add_run().add_break()
        return
    next_bold = bold or node.name in {"strong", "b"}
    next_italic = italic or node.name in {"em", "i"}
    for child in node.contents:
        add_inline(paragraph, child, next_bold, next_italic)

def add_html_paragraph(doc, element, style=None):
    p = doc.add_paragraph(style=style)
    if element.name == "blockquote":
        p.paragraph_format.left_indent = Inches(0.35)
        p.paragraph_format.right_indent = Inches(0.25)
        p.paragraph_format.space_before = Pt(5)
        p.paragraph_format.space_after = Pt(8)
    for child in element.contents:
        add_inline(p, child, italic=(element.name == "blockquote"))
    return p

def set_document_styles(doc):
    section = doc.sections[0]
    section.page_width = Inches(8.27)
    section.page_height = Inches(11.69)
    section.top_margin = Inches(0.82)
    section.bottom_margin = Inches(0.82)
    section.left_margin = Inches(0.9)
    section.right_margin = Inches(0.82)
    normal = doc.styles["Normal"]
    normal.font.name = "Georgia"
    normal.font.size = Pt(10.5)
    normal.paragraph_format.line_spacing = 1.15
    normal.paragraph_format.space_after = Pt(6)
    for name, size in [("Title", 26), ("Heading 1", 17), ("Heading 2", 13)]:
        style = doc.styles[name]
        style.font.name = "Georgia"
        style.font.size = Pt(size)
        style.font.bold = True
    footer = section.footer.paragraphs[0]
    add_page_number(footer)

def build(lang, output_dir):
    doc = Document()
    set_document_styles(doc)
    title_soup = page_soup(lang, FILES[0])
    book_title = visible_title(title_soup) or "THE MERIDIAN OF ASH"
    subtitle = title_soup.select_one(".wrap .subtitle")
    dek = title_soup.select_one(".wrap .dek")
    epigraph = title_soup.select_one(".wrap blockquote")

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Inches(2.2)
    r = p.add_run(book_title); r.bold = True; r.font.name = "Georgia"; r.font.size = Pt(26)
    if subtitle:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(subtitle.get_text(" ", strip=True)); r.font.name = "Georgia"; r.font.size = Pt(15)
    if dek:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.left_indent = Inches(0.6)
        p.paragraph_format.right_indent = Inches(0.6)
        r = p.add_run(dek.get_text(" ", strip=True)); r.italic = True; r.font.size = Pt(10.5)
    if epigraph:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Inches(0.9)
        r = p.add_run(epigraph.get_text(" ", strip=True)); r.italic = True; r.font.size = Pt(11)
    doc.add_page_break()

    toc_heading = title_soup.select_one(".wrap h2")
    doc.add_heading(toc_heading.get_text(" ", strip=True) if toc_heading else "Contents", level=1)
    prologue_soup = page_soup(lang, FILES[1])
    prologue_title = visible_title(prologue_soup)
    doc.add_paragraph(prologue_title, style="List Number")
    chapter_titles = []
    for filename in FILES[2:]:
        soup = page_soup(lang, filename)
        chapter_titles.append(visible_title(soup))
    for chapter_title in chapter_titles:
        doc.add_paragraph(chapter_title, style="List Number")
    doc.add_page_break()

    # Prologue: all reader paragraphs are included, not just chapter-copy elements.
    doc.add_heading(prologue_title, level=1)
    for element in prologue_soup.select(".wrap p, .wrap blockquote"):
        add_html_paragraph(doc, element)

    for filename in FILES[2:]:
        soup = page_soup(lang, filename)
        heading = visible_title(soup)
        doc.add_page_break()
        doc.add_heading(heading, level=1)
        for element in soup.select(".wrap p, .wrap blockquote"):
            add_html_paragraph(doc, element)

    props = doc.core_properties
    props.title = book_title
    props.subject = f"Book I — The Outbreak | {LANG_NAMES[lang]} translation draft"
    props.author = "ZombieCash Fiction"
    props.comments = "Machine-translated editorial draft. Not approved for public release."
    output_dir.mkdir(parents=True, exist_ok=True)
    target = output_dir / f"THE_MERIDIAN_OF_ASH_Book_I_{lang}.docx"
    doc.save(target)
    print(f"CREATED {target} bytes={target.stat().st_size}", flush=True)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--language", required=True, choices=sorted(LANG_NAMES))
    parser.add_argument("--output", default="dist")
    args = parser.parse_args()
    build(args.language, Path(args.output))

if __name__ == "__main__":
    main()

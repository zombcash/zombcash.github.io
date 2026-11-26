#!/usr/bin/env python3
"""Inventory inline style blocks/attributes across HTML files without changing source."""
from pathlib import Path
from html.parser import HTMLParser

class StyleCounter(HTMLParser):
    def __init__(self):
        super().__init__()
        self.blocks = 0
        self.block_bytes = 0
        self.inline_attrs = 0
    def handle_starttag(self, tag, attrs):
        self.blocks += int(tag.lower() == "style")
        self.inline_attrs += sum(1 for key, value in attrs if key.lower() == "style" and value is not None)
    def handle_endtag(self, tag):
        pass

results = []
for path in sorted(Path(".").rglob("*.html")):
    if any(part in {".git", "node_modules"} for part in path.parts):
        continue
    text = path.read_text(encoding="utf-8", errors="replace")
    parser = StyleCounter()
    parser.feed(text)
    if parser.blocks or parser.inline_attrs:
        blocks = list(__import__("re").finditer(r"<style\\b[^>]*>([\\s\\S]*?)</style>", text, __import__("re").I))
        results.append((parser.blocks, parser.inline_attrs, sum(len(m.group(1)) for m in blocks), path.as_posix(), [len(m.group(1)) for m in blocks]))

print(f"HTML files scanned: {len(list(Path('.').rglob('*.html')))}")
print(f"Pages with inline style tags or attributes: {len(results)}")
print(f"Inline style blocks: {sum(row[0] for row in results)}")
print(f"Inline style attributes: {sum(row[1] for row in results)}")
print("Largest inline CSS bundles:")
for row in sorted(results, key=lambda x: x[2], reverse=True)[:25]:
    print(f"  {row[3]}: blocks={row[0]}, style-attrs={row[1]}, css-bytes={row[2]}, block-sizes={row[4]}")

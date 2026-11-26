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
        self.current_style = False
        self.block_sizes = []
    def handle_starttag(self, tag, attrs):
        if tag.lower() == "style":
            self.blocks += 1
            self.current_style = True
            self.block_sizes.append(0)
        self.inline_attrs += sum(1 for key, value in attrs if key.lower() == "style" and value is not None)
    def handle_data(self, data):
        if self.current_style and self.block_sizes:
            size = len(data.encode("utf-8"))
            self.block_sizes[-1] += size
            self.block_bytes += size
    def handle_endtag(self, tag):
        if tag.lower() == "style":
            self.current_style = False

results = []
for path in sorted(Path(".").rglob("*.html")):
    if any(part in {".git", "node_modules"} for part in path.parts):
        continue
    text = path.read_text(encoding="utf-8", errors="replace")
    parser = StyleCounter()
    parser.feed(text)
    if parser.blocks or parser.inline_attrs:
        results.append((parser.blocks, parser.inline_attrs, parser.block_bytes, path.as_posix(), parser.block_sizes))

print(f"HTML files scanned: {len(list(Path('.').rglob('*.html')))}")
print(f"Pages with inline style tags or attributes: {len(results)}")
print(f"Inline style blocks: {sum(row[0] for row in results)}")
print(f"Inline style attributes: {sum(row[1] for row in results)}")
print("Largest inline CSS bundles:")
for row in sorted(results, key=lambda x: x[2], reverse=True)[:25]:
    print(f"  {row[3]}: blocks={row[0]}, style-attrs={row[1]}, css-bytes={row[2]}, block-sizes={row[4]}")

#!/usr/bin/env python3
"""Build a labeled contact sheet from Playwright's per-image gallery evidence."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / "gallery-visual-audit"
REPORT = AUDIT / "report.json"
OUTPUT = AUDIT / "contact-sheet.jpg"
TILE_W, TILE_H = 250, 245
COLUMNS = 5
BACKGROUND = (7, 13, 9)
PANEL = (15, 25, 18)
TEXT = (220, 235, 220)
MUTED = (145, 170, 145)
WARNING = (255, 145, 110)


def font(size):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def fit_text(draw, text, selected_font, max_width):
    text = str(text or "")
    while text and draw.textbbox((0, 0), text, font=selected_font)[2] > max_width:
        text = text[:-2] + "…"
    return text


def main():
    report = json.loads(REPORT.read_text(encoding="utf-8"))
    images = report.get("images", [])
    if not images:
        raise SystemExit("No gallery image audit records were found.")

    rows = (len(images) + COLUMNS - 1) // COLUMNS
    sheet = Image.new("RGB", (COLUMNS * TILE_W, rows * TILE_H), BACKGROUND)
    draw = ImageDraw.Draw(sheet)
    title_font = font(13)
    id_font = font(10)
    status_font = font(11)

    for index, item in enumerate(images):
        x = (index % COLUMNS) * TILE_W
        y = (index // COLUMNS) * TILE_H
        draw.rectangle((x + 5, y + 5, x + TILE_W - 5, y + TILE_H - 5), fill=PANEL, outline=(48, 76, 52))
        image_path = AUDIT / str(item.get("screenshot") or "")
        if image_path.is_file():
            with Image.open(image_path) as source:
                source = source.convert("RGB")
                source.thumbnail((TILE_W - 24, 170))
                px = x + (TILE_W - source.width) // 2
                py = y + 12 + (170 - source.height) // 2
                sheet.paste(source, (px, py))
        else:
            draw.rectangle((x + 14, y + 14, x + TILE_W - 14, y + 182), fill=(28, 14, 12))
            draw.text((x + 24, y + 85), "IMAGE NOT LOADED", font=status_font, fill=WARNING)

        title = fit_text(draw, item.get("title") or "(untitled)", title_font, TILE_W - 24)
        image_id = fit_text(draw, item.get("id") or "(no id)", id_font, TILE_W - 24)
        draw.text((x + 12, y + 188), title, font=title_font, fill=TEXT)
        draw.text((x + 12, y + 208), image_id, font=id_font, fill=MUTED)
        status = "FALLBACK" if item.get("fallbackApplied") else (
            "LOADED" if item.get("naturalWidth", 0) > 0 else "FAILED"
        )
        status_color = WARNING if status != "LOADED" else (135, 225, 120)
        draw.text((x + 12, y + 225), status, font=status_font, fill=status_color)

    sheet.save(OUTPUT, quality=88, optimize=True)
    print(json.dumps({
        "contact_sheet": str(OUTPUT.relative_to(ROOT)),
        "total": report.get("total", len(images)),
        "loaded": report.get("loaded", 0),
        "fallback": report.get("fallback", 0),
        "failed": len(report.get("failed", [])),
    }))


if __name__ == "__main__":
    main()

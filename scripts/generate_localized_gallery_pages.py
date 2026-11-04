#!/usr/bin/env python3
"""Generate dedicated localized gallery URLs, canonical/hreflang tags and sitemap."""
from html import escape
from pathlib import Path
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://zombcash.github.io"
ROOT_PAGE = ROOT / "gallery.html"
SITEMAP_PATH = ROOT / "sitemap-gallery-pages.xml"
ROBOTS_PATH = ROOT / "robots.txt"

LOCALES = {
    "en": {
        "subtitle": "AI-generated artwork from our Telegram channel. Browse the archive and open any image full size.",
        "title": "Zombie Gallery — ZombieCash",
        "description": "Explore the ZombieCash gallery of zombie art, horror memes and undead transmissions from the community. Browse image stories and open original Telegram posts.",
        "og_locale": "en_US",
    },
    "de": {
        "subtitle": "KI-generierte Kunst aus unserem Telegram-Kanal. Durchsuche das Archiv und öffne jedes Bild in voller Größe.",
        "title": "Zombie-Galerie — ZombieCash",
        "description": "Entdecke die ZombieCash-Galerie mit Zombie-Kunst, Horror-Memes und Untoten-Übertragungen aus der Community. Sieh dir Bildgeschichten an und öffne die ursprünglichen Telegram-Beiträge.",
        "og_locale": "de_DE",
    },
    "fr": {
        "subtitle": "Œuvres générées par IA depuis notre canal Telegram. Parcourez les archives et ouvrez chaque image en plein format.",
        "title": "Galerie Zombie — ZombieCash",
        "description": "Explorez la galerie ZombieCash : art zombie, mèmes d’horreur et transmissions des morts-vivants de la communauté. Parcourez les images et ouvrez les publications Telegram originales.",
        "og_locale": "fr_FR",
    },
    "it": {
        "subtitle": "Opere generate dall’IA dal nostro canale Telegram. Esplora l’archivio e apri ogni immagine a grandezza naturale.",
        "title": "Galleria Zombie — ZombieCash",
        "description": "Esplora la galleria ZombieCash con arte zombie, meme horror e trasmissioni dei non morti della community. Sfoglia le immagini e apri i post originali su Telegram.",
        "og_locale": "it_IT",
    },
    "ja": {
        "subtitle": "TelegramチャンネルのAI生成アートです。アーカイブを閲覧し、画像をフルサイズで開けます。",
        "title": "ゾンビギャラリー — ZombieCash",
        "description": "ZombieCashのゾンビアート、ホラーミーム、コミュニティからのアンデッド通信を紹介。画像を閲覧し、元のTelegram投稿を開けます。",
        "og_locale": "ja_JP",
    },
    "zh-CN": {
        "subtitle": "来自 Telegram 频道的 AI 生成作品。浏览档案并打开任意图片查看大图。",
        "title": "僵尸画廊 — ZombieCash",
        "description": "探索 ZombieCash 僵尸艺术、恐怖梗图和社区不死者广播。浏览图片故事并打开原始 Telegram 帖子。",
        "og_locale": "zh_CN",
    },
    "ru": {
        "subtitle": "Работы, созданные ИИ для нашего Telegram-канала. Просматривай архив и открывай любое изображение в полном размере.",
        "title": "Галерея зомби — ZombieCash",
        "description": "Исследуй галерею ZombieCash: зомби-арт, хоррор-мемы и передачи нежити от сообщества. Просматривай изображения и открывай оригинальные публикации в Telegram.",
        "og_locale": "ru_RU",
    },
    "tr": {
        "subtitle": "Telegram kanalımızdan yapay zekâ ile oluşturulan eserler. Arşivi keşfet ve herhangi bir görseli tam boyutunda aç.",
        "title": "Zombi Galerisi — ZombieCash",
        "description": "ZombieCash zombi sanatını, korku memlerini ve topluluktan gelen yaşayan ölü yayınlarını keşfet. Görselleri incele ve özgün Telegram gönderilerini aç.",
        "og_locale": "tr_TR",
    },
    "hi": {
        "subtitle": "हमारे Telegram चैनल की AI-निर्मित कलाकृतियाँ। संग्रह ब्राउज़ करें और किसी भी चित्र को पूर्ण आकार में खोलें。",
        "title": "ज़ॉम्बी गैलरी — ZombieCash",
        "description": "ZombieCash की ज़ॉम्बी कला, हॉरर मीम और समुदाय की अनडेड प्रसारण गैलरी देखें। चित्रों को ब्राउज़ करें और मूल Telegram पोस्ट खोलें।",
        "og_locale": "hi_IN",
    },
}
ROOT_ASSETS = (
    "zombcash-hand-logo.svg",
    "style.css",
    "gallery.css",
    "site-polish.css",
    "script.js",
    "gallery.js",
    "shared-nav.js",
    "language.js",
    "survivor-auth.js",
    "survivor-activity.js",
)
NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
XHTML = "http://www.w3.org/1999/xhtml"
ET.register_namespace("", NS)
ET.register_namespace("xhtml", XHTML)



CATEGORY_LABELS = {
    "en": {"zombie-memes": "Zombie Memes", "nightmare-horror": "Nightmare & Horror", "undead-after-dark": "Undead After Dark", "zombie-characters": "Zombie Characters", "apocalypse-survival": "Apocalypse & Survival", "crypto-apocalypse": "Crypto Apocalypse", "community-creations": "Community Creations"},
    "ru": {"zombie-memes": "Зомби-мемы", "nightmare-horror": "Кошмары и хоррор", "undead-after-dark": "Нежить после заката", "zombie-characters": "Персонажи-зомби", "apocalypse-survival": "Апокалипсис и выживание", "crypto-apocalypse": "Криптоапокалипсис", "community-creations": "Работы сообщества"},
    "de": {"zombie-memes": "Zombie-Memes", "nightmare-horror": "Albtraum & Horror", "undead-after-dark": "Untote nach Einbruch der Dunkelheit", "zombie-characters": "Zombie-Charaktere", "apocalypse-survival": "Apokalypse & Überleben", "crypto-apocalypse": "Krypto-Apokalypse", "community-creations": "Community-Kreationen"},
    "fr": {"zombie-memes": "Mèmes zombies", "nightmare-horror": "Cauchemar et horreur", "undead-after-dark": "Morts-vivants après la nuit", "zombie-characters": "Personnages zombies", "apocalypse-survival": "Apocalypse et survie", "crypto-apocalypse": "Crypto-apocalypse", "community-creations": "Créations de la communauté"},
    "it": {"zombie-memes": "Meme zombie", "nightmare-horror": "Incubo e horror", "undead-after-dark": "Non morti dopo il tramonto", "zombie-characters": "Personaggi zombie", "apocalypse-survival": "Apocalisse e sopravvivenza", "crypto-apocalypse": "Crypto-apocalisse", "community-creations": "Creazioni della community"},
    "ja": {"zombie-memes": "ゾンビミーム", "nightmare-horror": "悪夢とホラー", "undead-after-dark": "夜更けのアンデッド", "zombie-characters": "ゾンビキャラクター", "apocalypse-survival": "終末とサバイバル", "crypto-apocalypse": "暗号資産アポカリプス", "community-creations": "コミュニティ作品"},
    "zh-CN": {"zombie-memes": "僵尸梗图", "nightmare-horror": "噩梦与恐怖", "undead-after-dark": "午夜不死者", "zombie-characters": "僵尸角色", "apocalypse-survival": "末日与生存", "crypto-apocalypse": "加密末日", "community-creations": "社区创作"},
    "tr": {"zombie-memes": "Zombi Memleri", "nightmare-horror": "Kâbus ve Korku", "undead-after-dark": "Gece Sonrası Yaşayan Ölüler", "zombie-characters": "Zombi Karakterleri", "apocalypse-survival": "Kıyamet ve Hayatta Kalma", "crypto-apocalypse": "Kripto Kıyameti", "community-creations": "Topluluk Eserleri"},
    "hi": {"zombie-memes": "ज़ॉम्बी मीम", "nightmare-horror": "दुःस्वप्न और हॉरर", "undead-after-dark": "रात के बाद अनडेड", "zombie-characters": "ज़ॉम्बी किरदार", "apocalypse-survival": "प्रलय और उत्तरजीविता", "crypto-apocalypse": "क्रिप्टो प्रलय", "community-creations": "समुदाय की कलाकृतियाँ"},
}


def localize_category_tags(page, locale):
    labels = CATEGORY_LABELS.get(locale, CATEGORY_LABELS["en"])

    def replace_card(match):
        card = match.group(0)
        categories_match = re.search(r'data-categories="([^"]*)"', card)
        categories = categories_match.group(1).split() if categories_match else []
        tags = "".join(
            '<span class="gallery-category-tag">' + escape(labels.get(category, category)) + '</span>'
            for category in categories
        )
        return re.sub(
            r'<div class="gallery-card-tags">.*?</div>',
            '<div class="gallery-card-tags">' + tags + '</div>',
            card,
            count=1,
            flags=re.I | re.S,
        )

    return re.sub(r'<article class="gallery-card".*?</article>', replace_card, page, flags=re.I | re.S)


def page_url(locale):
    return f"{BASE_URL}/gallery.html" if locale == "en" else f"{BASE_URL}/{locale}/gallery.html"


def replace_tag(source, pattern, replacement):
    updated, count = re.subn(pattern, replacement, source, count=1, flags=re.I | re.S)
    if count != 1:
        raise ValueError(f"Expected one match for pattern: {pattern}")
    return updated


def set_meta(source, pattern, tag):
    return replace_tag(source, pattern, tag)


def build_page(base, locale):
    meta = LOCALES[locale]
    url = page_url(locale)
    page = base
    page = localize_category_tags(page, locale)
    page = replace_tag(page, r'<html lang="[^"]+"', f'<html lang="{escape(locale)}"')
    page = set_meta(page, r'<meta name="description" content="[^"]*">',
                    f'<meta name="description" content="{escape(meta["description"], quote=True)}">')
    # Localize the visible hero subtitle by structure, not by a brittle English
    # sentence match: the source copy has changed across gallery revisions.
    page = re.sub(
        r'(<section class="gallery-hero">.*?<h1>.*?</h1>\s*<p>).*?(</p>)',
        lambda match: match.group(1) + escape(meta["subtitle"]) + match.group(2),
        page,
        count=1,
        flags=re.I | re.S,
    )
    page = set_meta(page, r'<title>.*?</title>', f'<title>{escape(meta["title"])}</title>')
    page = set_meta(page, r'<meta property="og:title" content="[^"]*">',
                    f'<meta property="og:title" content="{escape(meta["title"], quote=True)}">')
    page = set_meta(page, r'<meta property="og:description" content="[^"]*">',
                    f'<meta property="og:description" content="{escape(meta["description"], quote=True)}">')
    page = set_meta(page, r'<meta property="og:url" content="[^"]*">',
                    f'<meta property="og:url" content="{url}">')
    page = set_meta(page, r'<meta name="twitter:title" content="[^"]*">',
                    f'<meta name="twitter:title" content="{escape(meta["title"], quote=True)}">')
    page = set_meta(page, r'<meta name="twitter:description" content="[^"]*">',
                    f'<meta name="twitter:description" content="{escape(meta["description"], quote=True)}">')

    page = re.sub(r'\s*<meta property="og:locale" content="[^"]*">', "", page, flags=re.I)
    page = page.replace('<meta property="og:type" content="website">',
                        '<meta property="og:type" content="website">\n'
                        f'<meta property="og:locale" content="{meta["og_locale"]}">')

    alternates = []
    for alternate_locale in LOCALES:
        alternates.append(
            f'<link rel="alternate" hreflang="{escape(alternate_locale)}" href="{page_url(alternate_locale)}">'
        )
    alternates.append(f'<link rel="alternate" hreflang="x-default" href="{page_url("en")}">')
    canonical_block = (
        f'<link rel="canonical" href="{url}">\n'
        + "\n".join(alternates)
    )
    page = replace_tag(page, r'<link rel="canonical" href="[^"]*">(?:\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*">)*',
                      canonical_block)

    schema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": meta["title"],
        "description": meta["description"],
        "url": url,
        "inLanguage": locale,
        "isPartOf": {
            "@type": "WebSite",
            "name": "ZombieCash",
            "url": BASE_URL + "/",
        },
    }
    schema_json = json.dumps(schema, ensure_ascii=False, separators=(",", ":"))
    schema_json = schema_json.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    schema_tag = '<script id="gallery-collection-jsonld" type="application/ld+json">' + schema_json + '</script>'
    page = re.sub(r'\s*<script id="gallery-collection-jsonld" type="application/ld\+json">.*?</script>', "", page, flags=re.I | re.S)
    page = page.replace("</head>", schema_tag + "\n</head>", 1)

    if locale != "en":
        asset_pattern = re.compile(r'\b(href|src)="([^"]+)"')
        assets = set(ROOT_ASSETS)

        def rewrite_asset(match):
            attr, value = match.groups()
            clean = value.split("?", 1)[0]
            if clean in assets:
                return f'{attr}="../{value}"'
            return match.group(0)

        page = asset_pattern.sub(rewrite_asset, page)
    return page


def build_sitemap():
    root = ET.Element(f"{{{NS}}}urlset")
    for locale in LOCALES:
        url = ET.SubElement(root, f"{{{NS}}}url")
        ET.SubElement(url, f"{{{NS}}}loc").text = page_url(locale)
        for alternate_locale in LOCALES:
            ET.SubElement(url, f"{{{XHTML}}}link", {
                "rel": "alternate",
                "hreflang": alternate_locale,
                "href": page_url(alternate_locale),
            })
        ET.SubElement(url, f"{{{XHTML}}}link", {
            "rel": "alternate",
            "hreflang": "x-default",
            "href": page_url("en"),
        })
        ET.SubElement(url, f"{{{NS}}}changefreq").text = "monthly"
        ET.SubElement(url, f"{{{NS}}}priority").text = "0.6"
    ET.indent(root, space="  ")
    ET.ElementTree(root).write(SITEMAP_PATH, encoding="utf-8", xml_declaration=True)


def update_robots():
    lines = ROBOTS_PATH.read_text(encoding="utf-8").splitlines()
    sitemap_line = f"Sitemap: {BASE_URL}/sitemap-gallery-pages.xml"
    if sitemap_line not in lines:
        lines.append(sitemap_line)
    ROBOTS_PATH.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main():
    base = ROOT_PAGE.read_text(encoding="utf-8")
    for locale in LOCALES:
        page = build_page(base, locale)
        if locale == "en":
            ROOT_PAGE.write_text(page, encoding="utf-8")
        else:
            target = ROOT / locale / "gallery.html"
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(page, encoding="utf-8")
    build_sitemap()
    update_robots()
    print(f"Generated {len(LOCALES)} localized gallery URLs and hreflang sitemap.")


if __name__ == "__main__":
    main()

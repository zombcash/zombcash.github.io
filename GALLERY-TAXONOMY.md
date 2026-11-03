# ZombieCash Gallery — Taxonomy & Metadata Specification

## Editorial principle
The gallery is an art archive first. Categories describe what is visibly in the image and help people discover related work. Existing recurring series remain intact as series labels. One image may have multiple categories.

## Initial category system

| ID | Public label (EN) | What belongs here | Examples / boundaries |
|---|---|---|---|
| `zombie-memes` | Zombie Memes | Original jokes, meme scenes, crypto/portfolio humor, reaction images and shareable templates. | Keep market jokes here; use `crypto-apocalypse` as an additional tag where relevant. |
| `nightmare-horror` | Nightmare & Horror | Suspense, monsters, haunted locations, disturbing atmosphere, cinematic horror scenes. | Existing NIGHTMARE DROP series maps here. |
| `undead-after-dark` | Undead After Dark | Fashion, nightlife, glamorous undead characters, stylized portraits and adult-safe dark glamour. | Existing UNDEAD AFTER DARK series maps here. Exclude explicit sexual content. |
| `zombie-characters` | Zombie Characters & Avatars | Individual zombie/survivor characters, portraits, profile images and character concepts. | Can overlap with horror or after-dark. |
| `apocalypse-survival` | Apocalypse & Survival | Wasteland settings, shelters, survival gear, ruined cities, scavenging and post-apocalyptic scenes. | Use only when survival/apocalypse is a meaningful visual subject. |
| `crypto-apocalypse` | Crypto Apocalypse | Images explicitly about crypto culture, Solana, charts, trading, wallets, market humor or token culture. | Not every image with a ZombieCash watermark qualifies. |
| `community-creations` | Community Creations | Artwork submitted by community members with permission to display and distribute. | Requires creator attribution and explicit publishing permission. |

## Series mapping
- `ZOMBIE MEME` and `ZOMBIE MEME OF THE HOUR` → `series: zombie-meme`, category `zombie-memes`.
- `NIGHTMARE DROP` → `series: nightmare-drop`, category `nightmare-horror`.
- `UNDEAD AFTER DARK` → `series: undead-after-dark`, category `undead-after-dark`.

Series are not a substitute for categories. A character portrait may also be tagged `zombie-characters`; a market joke may also be tagged `crypto-apocalypse`.

## Backward-compatible metadata fields
Keep current source fields unchanged:
- `id`, `image`, `caption`, `post_url`, `date`, `post_id`

Add fields without deleting the original:
- `title`: concise unique display title, preferably 3–8 words.
- `description`: useful human-written one/two-sentence description; retain the original joke/story.
- `alt_text`: image-specific accessibility description; describe visible content, not SEO keyword lists.
- `alt_review_status`: `visual-reviewed` only after inspecting the source image; otherwise `caption-derived-pending-visual-review`.
- `alt_reviewed_at` and `alt_review_method`: audit trail for manually reviewed ALT text; preserve through scheduled Telegram sync.
- `category_ids`: array of one or more category IDs.
- `series`: stable recurring-series ID or null.
- `tags`: 3–8 natural descriptive tags, no repetitive keyword stuffing.
- `language`: source language of the caption/description.
- `credit`: original creator/source attribution where known.
- `rights_status`: `project-owned`, `permission-confirmed`, or `review-required`.
- `metadata_version`: integer schema version.
- `slug` and `anchor_id`: stable per-image website destination anchors.
- `pinterest_status`, `pinterest_board_id`, `pinterest_board_category`, `pinterest_title`, `pinterest_description`, `pinterest_alt`, `pinterest_destination_url`: controlled publishing metadata; default to blocked until rights and visual ALT review are approved.

Localized fields should be additive and structured, e.g. `localized.en.title`, `localized.ru.title`; never overwrite the original source caption. If a localized field is absent, use the source language as a clearly understood fallback.

## Caption-writing standard
1. Start with a clear subject or scene.
2. Keep the distinctive ZombieCash voice: dark humor, survival-horror atmosphere and crypto-native jokes where relevant.
3. Do not force $ZOMBCASH, contract address or links into every gallery caption.
4. Avoid repeating a series label as the entire description.
5. Keep descriptions readable, useful and distinct; do not keyword-stuff.
6. Keep social captions separate from accessibility ALT text.
7. ALT text should identify the main visible subject, action, setting and important visual detail in one natural sentence.
8. Preserve the original Telegram caption and source URL for attribution.

## Gallery interaction rules
- Filters: category chips with multi-select or one-category-at-a-time behavior; default All.
- Search: title, description, tags and series; debounce and provide clear reset.
- Sorting: newest, oldest, most liked (most-liked only once likes exist).
- Cards: title, concise caption, category chips, like count and source link.
- Detail/lightbox: full image, title, description, tags, source attribution, like action and (after launch) comments.
- Guests may browse and share. Guests may not like/comment; show a localized Telegram login prompt.
- Filters must work with keyboard and touch and must not cause layout overflow.
- Only canonical category landing pages with meaningful unique editorial text may be indexable. Arbitrary filter combinations stay noindex/client-side.

## Pinterest board mapping
- Zombie Memes → Zombie Memes
- Nightmare & Horror → Zombie Horror Art
- Undead After Dark → Undead Characters & Dark Glamour
- Zombie Characters & Avatars → Zombie Characters & Avatars
- Apocalypse & Survival → Apocalypse Survival Art
- Crypto Apocalypse → Crypto Apocalypse
- Community Creations → Community Creations (only with creator permission)

Every pin must have an image-specific title, natural description, image alt text, relevant board, canonical site destination and stable gallery image ID in the export ledger.


## Current branch implementation snapshot — 2026-11-03
- gallery-data.json is now schema version 2. All 50 entries preserve the six original Telegram source fields and include series, category_ids[], tags[], language and metadata_version.
- Provisional category assignments from series/caption only: zombie-memes 17; crypto-apocalypse 17; nightmare-horror 16; undead-after-dark 17. The crypto overlap is based on explicit portfolio/market/trading wording in captions.
- Search, category chips and newest/oldest sorting are implemented on the feature branch with localized labels for en, de, fr, it, ja, zh-CN, ru, tr and hi.
- These categories are not a substitute for visual editorial review. title, description and alt_text remain unfilled until the actual image content has been inspected. Rights status and creator permission must also be reviewed before Pinterest distribution.


## Pinterest export gate
The repository includes `scripts/export_pinterest_queue.py`. It never publishes. An image is export-eligible only when rights are `project-owned` or `permission-confirmed`, ALT is `visual-reviewed`, a board ID exists, all Pin metadata is present, and `pinterest_status` is `ready`. Current queue: 0 eligible / 50 blocked. All 50 remain blocked pending visual and rights review and dedicated board assignment.

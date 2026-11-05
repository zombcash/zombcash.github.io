# ZombieCash Website — Visual Style Requirements

Status: working design specification, updated 2026-11-05.
Scope: public website `zombcash.github.io`. This guide documents the current visual direction and the requirements to preserve during future page work. It does not authorize changing site functionality, localization, SEO, advertising integrations, or navigation behavior.

## 1. Brand direction

ZombieCash is a post-apocalyptic Solana community project. The visual language combines:
- post-outbreak / overgrown-world atmosphere;
- survival-terminal and tactical-interface cues;
- crypto-market telemetry and community signals;
- irreverent meme energy, without turning every page into a noisy meme collage.

The site should feel like one coherent world, not a collection of unrelated templates. Fallout / Umbrella-style survival-fiction references are mood references only: do not copy protected logos, artwork, UI screens, or distinctive assets.

## 2. Core visual palette

The current production CSS uses a near-black, deep green foundation and a bright toxic-lime accent. Treat these as the core reference values, not as permission to introduce unrelated palettes.

| Role | Reference | Usage |
|---|---|---|
| Primary accent | `#9BFF45` | Main CTA, active states, key metrics, signal highlights |
| Deep page background | `#080B11` and near-black green variants | Main canvas and large dark surfaces |
| Dark panel | `#080D0A`, `#09110C` | Cards, hero panels, navigation surfaces |
| Primary text | `#EEF8F0` / soft off-white | Headings and important copy |
| Secondary text | muted grey-green | Supporting copy, metadata, labels |
| Supporting signal colors | restrained purple and amber | Separate community / market / warning categories only |

Rules:
- Lime is the primary brand signal; do not use every accent color with equal visual weight.
- Purple and amber are category signals, not replacement brand colors.
- Keep text/background contrast strong. Never put small muted text on a busy image without a dark backing or overlay.
- Avoid large areas of pure neon, excessive glow, and gradients that reduce legibility.

## 3. Typography

Current site typefaces:
- **Orbitron** — display headings, compact technical labels, section identifiers and selected navigation labels.
- **Rajdhani** — body copy, descriptions, stats and readable interface text.

Rules:
- Preserve the existing font roles and weights when extending a page.
- Use clear heading hierarchy; do not render long paragraphs in Orbitron or tiny all-caps.
- Body copy should remain comfortable to read on mobile.
- Token addresses, IDs and technical values should use a stable, legible treatment and must remain selectable/copyable.

## 4. Layout and component language

- Use a consistent shared header/navigation and the existing site-wide language selector.
- Keep the existing navigation order and page-specific Back to Home behavior; do not create competing local headers.
- Use aligned content widths, deliberate spacing, consistent borders and restrained corner radii.
- Dark cards/panels may use subtle green borders, inner contrast and limited ambient shadows.
- Use tactical labels, status chips, thin dividers and telemetry motifs as supporting details, not decoration on every element.
- Prefer clear section composition and useful whitespace over stacking many bordered boxes.
- Primary actions must be visually obvious; secondary actions must not compete with them.
- Do not add new floating widgets or sticky controls that obscure content, controls, or advertising placements.

## 5. Imagery and art direction

Preferred imagery:
- cinematic post-apocalyptic environments, overgrown urban locations, abandoned infrastructure, survival outposts and original ZombieCash artwork;
- darkened/graded images that support the lime-green identity and retain foreground text contrast;
- consistent image crops and aspect ratios within the same component family.

Requirements:
- Use real image assets for image slots; do not leave visible placeholder copy such as “IMAGE SLOT” or “ARTWORK WILL BE PLACED HERE” in finished production UI.
- Track source and license for externally sourced imagery. Prefer project-owned or appropriately licensed assets.
- Do not use random stock art, unrelated cyberpunk imagery, or multiple conflicting art styles on one page.
- Do not use generated imagery for news posts where the publishing requirement says not to generate news images.
- Do not replace official logos or redraw/distort brand marks.

## 6. Motion and effects

- Motion should communicate signal, activity or navigation, not distract.
- Marquees/tickers must be readable, pause on hover/focus where appropriate, and respect `prefers-reduced-motion`.
- Avoid continuous movement in dense reading areas.
- No flashing effects or motion that blocks interaction.
- Keep hover/focus/active states visible and consistent.

## 7. Responsive and accessibility requirements

- Validate at minimum 320, 360/390, 430, 768, 1024 and 1440 px widths.
- No horizontal page overflow; no clipped headings, navigation controls, language menu, buttons, cards or ad reservations.
- Mobile navigation must remain collapsed until activated; menu and language controls must be usable by touch and keyboard.
- Maintain visible keyboard focus, meaningful labels, semantic headings and sufficient contrast.
- Respect reduced-motion preferences.
- Preserve reserved ad dimensions and placement at each breakpoint; an unavailable ad creative must not collapse the layout or overlap the Sponsor Zone fallback.

## 8. Localization and content integrity

Supported homepage locales: English, German, French, Italian, Japanese, Simplified Chinese, Russian, Turkish and Hindi.
- Visual changes must not hard-code English-only copy into shared components.
- Allow for longer translated labels and different line lengths; do not truncate or overlap translated navigation.
- Preserve each page's `lang`, canonical URL and reciprocal hreflang links.
- Do not remove or rename navigation destinations, games, market panels, registration, analytics, or community features as part of a visual-only task.

## 9. Non-negotiable change controls

- Work only in `zombcash/zombcash.github.io`; do not modify `zombcash-world`.
- Do not change working bot/site functionality during a visual-only task.
- Keep visual changes scoped and additive where possible; avoid accumulating emergency overrides.
- Before merging: inspect desktop and mobile screenshots, run JavaScript checks, all localized homepage checks, navigation/language tests, and ad-fallback/reserved-slot checks.
- Fix confirmed regressions before merging. A green structural check alone is not proof of visual quality.
- Keep a concise change log and record image licenses.

## 10. Current audit notes (2026-11-05)

Observed on the Russian homepage screenshots at 1440×900 and 390×844:
- The dark survival-world base, lime accents, shared navigation and three categorized signal ribbons are visually consistent with the direction above.
- Desktop hero composition is two-column; mobile hero stacks the copy and actions.
- The right-side sponsor area still contains a tactical-image placeholder. Replace it with a real, licensed or project-owned asset before treating the hero as visually complete.
- Ad reservation behavior needs a clean passing regression run at mobile, tablet and desktop widths. Do not merge the visual refresh until that check passes.
- This guide describes requirements; it does not claim the outstanding visual QA has passed.

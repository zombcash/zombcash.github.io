# ZombieCash Website — Visual Style Requirements

Updated: 2026-11-05
Scope: public website `zombcash.github.io`. This is a working visual specification, not authorization to alter functionality, SEO, localization, navigation or advertising integrations.

## Brand direction
ZombieCash is a post-apocalyptic Solana community project. The visual language combines an overgrown outbreak world, survival-terminal interfaces, crypto-market telemetry and irreverent meme energy. The site should feel like one coherent world rather than unrelated page templates. Fallout / Umbrella-style references are mood references only; do not copy protected logos, artwork or distinctive UI.

## Core palette
| Role | Reference | Use |
|---|---|---|
| Primary signal | `#9BFF45` | Primary CTA, active states, key metrics and highlights |
| Deep background | `#080B11` and deep green-black variants | Page canvas and major surfaces |
| Dark panels | `#080D0A`, `#09110C` | Cards, navigation and hero surfaces |
| Main text | `#EEF8F0` / soft off-white | Headings and important copy |
| Secondary text | Muted grey-green | Body copy, metadata and labels |
| Supporting signals | Restrained purple / amber | Community and market categories only |

Lime is the brand anchor. Purple and amber are secondary category signals. Maintain strong contrast; do not place small muted text directly on busy imagery. Avoid excessive glow, pure-neon surfaces and competing accent palettes.

## Typography
- **Orbitron:** display headings, short technical labels and section identifiers.
- **Rajdhani:** body copy, descriptions, statistics and readable interface text.
- Keep long paragraphs out of Orbitron. Maintain comfortable mobile text sizes and clear heading hierarchy. Technical values must remain selectable and copyable.

## Layout and components
- Use the shared navigation and language selector; preserve the existing navigation order and page-specific Back to Home behavior.
- Align content widths, spacing, borders and corner radii across component families.
- Use dark panels, subtle green borders, thin dividers and restrained shadows.
- Tactical labels, status chips and telemetry motifs are supporting details, not decoration for every element.
- Primary actions must be obvious; secondary actions must not compete.
- Avoid floating/sticky controls that obscure content, navigation or ad placements.

## Imagery
Preferred themes: overgrown cities, abandoned infrastructure, survival outposts, contaminated landscapes and original ZombieCash artwork.
- Prefer project-owned or appropriately licensed images. Record source and license.
- Apply consistent crops and dark overlays where text readability requires them.
- Finished production UI must not contain visible placeholder copy such as “IMAGE SLOT”.
- Avoid unrelated stock art, mixed art directions and distorted official logos.
- Do not generate images for news posts when the publishing requirement says not to.

## Motion
- Motion should communicate activity or signal, not distract.
- Tickers pause on hover/focus where appropriate and respect `prefers-reduced-motion`.
- Avoid continuous motion in reading areas and all flashing effects.
- Keep focus, hover and active states visible.

## Responsive and accessibility
- Validate 320, 360/390, 430, 768, 1024 and 1440 px widths.
- No horizontal page overflow, clipped text, controls, language menus or ad reservations.
- Mobile navigation stays collapsed until activated and works by touch and keyboard.
- Use semantic headings, meaningful labels, visible keyboard focus and sufficient contrast.
- Duplicated decorative ticker content must be hidden from screen readers.
- If ad creatives fail to load, reserved dimensions and Sponsor Zone fallback remain stable and must not overlap.

## Localization and SEO
Supported homepage locales: English, German, French, Italian, Japanese, Simplified Chinese, Russian, Turkish and Hindi.
- Localize shared copy; allow translated strings to wrap without collisions or truncation.
- Preserve each page's `lang`, canonical URL and reciprocal hreflang set.
- Do not remove navigation destinations, games, market panels, registration, analytics or community features during visual-only work.

## Change controls
- Work only in `zombcash/zombcash.github.io`; never modify `zombcash-world`.
- Keep visual changes scoped and avoid accumulating emergency CSS overrides.
- Before merging, inspect screenshots and run JS syntax, all nine homepage structural checks, viewport/ad-fallback tests, localized article checks, Field Manual checks and language persistence tests.
- A green structural check alone is not proof of visual quality. Fix confirmed regressions before merge and record image licenses.

## Current refinement notes — 2026-11-05
- The first visual refresh with three localized signal ribbons and cinematic backgrounds was merged in PR #352.
- The sponsor artwork placeholder is being replaced with the existing project-owned `assets/zombcash-survivor-v13.jpg` across all nine locales.
- Ticker accessibility and Hindi market copy are being refined.
- Ad fallback geometry is being tested across mobile and desktop widths.
- This document records the requirements; do not treat the latest refinement as deployed until its PR is merged.

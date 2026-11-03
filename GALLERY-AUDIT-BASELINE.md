# Gallery Baseline Audit — 2026-11-03

Repository inspected: `zombcash/zombcash.github.io` (main) and backend repository `vovik777-beep/zombcash-bot`.
Work branch: `growth-gallery-roadmap-2026-11`.

## Findings confirmed from source

### Current gallery content and pipeline
- `gallery-data.json` contains 50 items.
- All 50 entries have unique `id`, `image`, `caption`, `post_url`, `date`, and `post_id`; no duplicate image URLs or duplicate IDs were found in this 50-item snapshot.
- Distribution by existing caption series:
  - Zombie Meme: 17
  - Undead After Dark: 17
  - Nightmare Drop: 16
- `scripts/sync_gallery.py` scrapes the public Telegram channel and retains only those three caption series. It pages backward until 50 entries or its page limit. This means any future category outside those series will currently be excluded unless the filter is deliberately expanded.
- `gallery.js` repeats the same three-series caption filter in the browser. Changing only the scraper will not be enough; the client-side filter must also be updated.
- The gallery currently renders one grid and a lightbox. No category controls, gallery search, sort, comments or likes were found in the inspected gallery code.
- The gallery is English-rooted. JavaScript contains nine-language labels and translates the three series labels, but that is not a full localized category/detail experience.
- Current card ALT/title are derived from the short series caption. The generated SEO cards use the generic prefix “ZombieCash gallery image:”; this is not sufficiently descriptive for individual images.
- The gallery HTML has generated-card markers. Do not manually edit content between those markers; `scripts/sync_gallery_image_seo.py` regenerates it from `gallery-data.json`.
- `scripts/sync_gallery_image_seo.py` also generates `sitemap-gallery-images.xml` and adds its Sitemap line to `robots.txt`.
- Workflows: Telegram gallery data sync runs hourly; generated gallery HTML/image sitemap sync runs every six hours and on data changes.

### Authentication and backend
- The site already has Telegram-based Survivor registration in `survivor-auth.js`.
- The bot API verifies Telegram's signed login payload, issues a signed seven-day session token, and resolves the Telegram ID from the verified token on the server.
- The API uses `SUPABASE_SERVICE_ROLE_KEY` server-side. It is not exposed to browser JavaScript.
- Existing Supabase schema has `survivor_profiles` and `survivor_activity`; RLS is enabled and direct `anon`/ `authenticated` table access is revoked.
- Existing API routes cover profile, presence, activity, referrals and game/maker activity. No gallery comment or like endpoints were found in the route registry.
- Therefore likes/comments can reuse the verified Survivor session and server-side Supabase access, but require new tables, API endpoints, moderation/rate controls and tests. Do not connect the browser directly to service-role tables.

## Risks and design decisions
1. Expand taxonomy without losing existing three recurring series.
2. Preserve original Telegram caption/source data; add normalized title/description/ALT/tags as separate fields.
3. Keep image IDs stable and use the existing Telegram post/image ID as a stable source key, with a deterministic fallback for any non-Telegram uploads.
4. Introduce comments and likes only through authenticated backend endpoints; server derives the user identity from the signed session.
5. Keep comments unindexed initially and render as text to prevent XSS and low-quality indexable content.
6. Pinterest export must be deduplicated and tracked per image; do not publish automatically until account/integration and permissions are confirmed.
7. No production UI changes were made during this baseline audit.

## Phase 0 status
- [x] Repository and gallery source files inspected.
- [x] Existing image count, series distribution, unique IDs and URLs checked.
- [x] Gallery sync and image SEO workflows inspected.
- [x] Existing Telegram authentication and Supabase schema inspected.
- [ ] Visual audit of every image on desktop/mobile.
- [ ] Verify image URL response, dimensions, formats and source rights.
- [ ] Confirm live gallery appearance and responsive behavior.
- [ ] Confirm current Pinterest integration provider/account and authorization route.

## Next implementation step
Finalize the taxonomy and backward-compatible metadata schema, then add category browsing and improve per-image title/description/ALT generation. Likes/comments and Pinterest publishing follow after stable IDs and metadata are in place.

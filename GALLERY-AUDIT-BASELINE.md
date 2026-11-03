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

## Work update — 2026-11-03

- Added schema version 2 and conservative series/category metadata to all 50 current entries. Existing Telegram source fields were preserved.
- Added 50 unique editorial titles and 50 concise story descriptions derived strictly from the original Telegram captions. All 50 entries carry rights_status=review-required and alt_review_status=caption-derived-pending-visual-review; the ALT text is explicitly contextual/caption-derived, not claimed as a verified visual description.
- Current provisional category coverage (based on existing series labels and caption semantics, not yet visual-confirmed): zombie-memes 17, crypto-apocalypse 17, nightmare-horror 16, undead-after-dark 17. Multi-category assignment is intentional.
- Updated scripts/sync_gallery.py so future scheduled syncs preserve editorial fields by stable Telegram image ID instead of silently wiping them.
- Added localized category chips, text search (title/caption/description/series/tags), newest/oldest/most-liked sorting and clear-filter action in gallery.js; all nine locale dictionaries include control and category labels.
- Expanded the lightbox to show title, caption-derived description, category labels and the original Telegram source link.
- Added responsive toolbar styling in gallery.css, refreshed gallery asset cache versions, and regenerated the branch's crawlable 50-card HTML plus 50-image sitemap from the current JSON.
- Updated the SEO generator to use editorial title/ALT/description fields when supplied and to retain stable image/category attributes in generated cards.
- JavaScript syntax compilation passed for gallery.js and the Playwright smoke-test script. JSON consistency checks passed: 50 entries, 50 unique IDs/URLs/titles, all records have categories, titles and descriptions; 50 generated cards and 50 sitemap image entries. A GitHub Actions PR smoke-test run has started; its final result is pending. No production branch deployment or live-site change has been made.
- Implemented card and lightbox like controls on the feature branch, wired to the Survivor API contract. These controls are not live until the companion backend PR is merged and deployed.
- Added stable per-image anchors for all 50 cards and a gated Pinterest queue exporter. Current queue: 0 eligible, 50 blocked because rights confirmation, visual ALT review and board assignment are still outstanding. No Pins have been published.
- Visual audit of the actual artwork, final image-specific ALT, image URL/dimension checks and screenshot evidence are still pending. Direct CDN downloads are blocked in the current runtime; do not infer visual details from captions. TinyFish visual browser run could not start because its wallet is below zero; no retry was attempted.

## Phase 0 status
- [x] Repository and gallery source files inspected.
- [x] Existing image count, series distribution, unique IDs and URLs checked.
- [x] Gallery sync and image SEO workflows inspected.
- [x] Existing Telegram authentication and Supabase schema inspected.
- [ ] Visual audit of every image on desktop/mobile. Actual artwork content has not yet been verified image-by-image; do not write final ALT text from captions alone.
- [ ] Verify image URL response, dimensions, formats and source rights.
- [ ] Confirm live gallery appearance and responsive behavior. Public HTML and 50 source cards are readable, but browser screenshot/responsive verification remains pending.
- [x] Identify Pinterest publishing connector: Zernio. Pinterest account session is present; Zernio is currently waiting for a default board selection. The available boards are unrelated to ZombieCash, so do not select them or publish until dedicated ZombieCash boards are created.\n

## Security and community feature progress — 2026-11-03
- Inspected the live ZombieCash Supabase project and found the five-argument `record_survivor_arcade_score` SECURITY DEFINER overload executable through PUBLIC. Revoked PUBLIC/anon/authenticated execution and retained service_role access. Verified anon=false, authenticated=false, service_role=true.
- Added the `gallery_likes` table with RLS, service-role-only table grants, unique `(telegram_id, image_id)` constraint, and SECURITY INVOKER RPCs. Verified no anon/authenticated table or RPC access; no test user rows were inserted.
- Companion backend API is drafted in `vovik777-beep/zombcash-bot` PR #53. It validates the signed Survivor session, ignores client-supplied Telegram IDs and applies a 30/minute per-account rate limit. Not deployed.

## Phase 1 implementation status (feature branch only)
- [x] Additive taxonomy fields (series, category_ids, tags, language, metadata_version) added to all 50 records.
- [x] Preserve editorial metadata across hourly Telegram syncs by stable item ID.
- [x] Add category chips, search and newest/oldest sorting with nine-language labels.
- [x] Add responsive styling and regenerate crawlable HTML/image sitemap in the feature branch.
- [ ] Complete per-image visual review before finalizing titles, descriptions, ALT, rights status or Pinterest eligibility.
- [ ] Add likes/comments only after backend/API design, security review and tests.

## Next implementation step
Finalize the taxonomy and backward-compatible metadata schema, then add category browsing and improve per-image title/description/ALT generation. Likes/comments and Pinterest publishing follow after stable IDs and metadata are in place.

# Gallery Baseline Audit — 2026-11-03

Repository inspected: `zombcash/zombcash.github.io` (main) and backend repository `vovik777-beep/zombcash-bot`.
Work branch: `growth-gallery-roadmap-2026-11`.

## Current verified status — 2026-11-04

- The feature branch contains the new gallery experience and all nine locale pages. No production deployment has occurred; the separate repository zombcash-world remains untouched.
- All 50 source images were reviewed using the full-resolution contact sheet. All 50 now have image-specific ALT text with alt_review_status=visual-reviewed. Rights status intentionally remains review-required for all 50.
- Browser image delivery is intermittently affected by Chromium net::ERR_BLOCKED_BY_ORB for one CDN request at a time. The failing request changes between runs; direct recovery requests return HTTP 200 image/jpeg. Do not replace source URLs based on these transient browser failures.
- Gallery tests cover all eight non-English URLs, 50 cards per locale, canonical/hreflang, localized CollectionPage JSON-LD, asset-cache parity, language switching, category/search/sort, stable sharing, and mobile lightbox controls.
- The mobile lightbox caption height was increased so Like/Share controls remain visible; a viewport-bound assertion was added.
- The Pinterest account @ZOMBCASH was reconciled directly: 97 total Pins on the account; 50/50 current gallery Telegram posts already exist exactly once on the three ZombieCash public boards. All 50 existing Pin IDs, board IDs, URLs, timestamps and original destinations are now recorded in gallery-data.json. No Pins were created during this audit.
- The Pinterest queue is now an existing-publication ledger: 50 published, 0 eligible for new publishing, 0 blocked. The rights-review status remains unchanged and is not treated as permission to create more Pins.
- The three ZombieCash board IDs are:
  - ZombieCash Memes | Crypto Humor — 620441354855296934
  - Undead After Dark | Zombie Art — 620441354855296935
  - Nightmare & Horror | Zombie Stories — 620441354855296933
- The two legacy secret Pinterest boards (Трактори, Швидке збереження) are not used.
- Pinterest domain zombcash.github.io is verified, but the account website field still points to http://zombcash.github.io and an old unverified Google+ URL remains as a second website. This profile cleanup is still pending.
- Backend PR #53 remains draft/undeployed. Likes are not live; comments are not implemented. No changes have been deployed to production.

## Historical baseline before the feature-branch implementation

The following findings describe the pre-change main-branch state and are retained as an audit trail. The current implementation status is recorded in the sections below.

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
- Added stable per-image anchors for all 50 cards and a gated Pinterest queue exporter.
- Added aggregate first-party tracking for gallery image opens, category filters, search use (without recording query text), sort changes, filter resets, like/unlike success and Telegram source opens.
- Added dedicated gallery URLs for all eight non-English locales, each with translated page metadata, self-canonical URL, the complete 9-language hreflang set, root-relative assets, a matching 9-URL hreflang sitemap, and localized schema.org CollectionPage JSON-LD. robots.txt now references the gallery-pages sitemap. The gallery language switcher routes to locale URLs instead of lang query variants. The API allowlist change is in backend PR #53; events contain no user IDs, IPs, wallets or search text. Current queue: 0 eligible, 50 blocked because rights confirmation, visual ALT review and board assignment are still outstanding. No Pins have been published.
- Localized UI and metadata URLs are in place; gallery item titles/descriptions remain English source-derived until translated and visually reviewed. Desktop/mobile/Russian screenshot artifacts from CI were downloaded and visually inspected. An earlier run reported 49/50 original images loaded; the subsequent full locale run loaded 50/50 with zero fallbacks, so the first failure appears transient. The full-resolution contact sheet was inspected. 48/50 source images loaded and received unique visual ALT descriptions. Two items, ZOMBCASH/3623:0 and ZOMBCASH/3621:0, triggered `net::ERR_BLOCKED_BY_ORB`; their original URLs are retained in the report and ALT remains pending. All 50 rights statuses remain `review-required`. Actual image-by-image semantic classification, final ALT and rights checks remain pending. No TinyFish or Browser Use sessions are used.

## Phase 0 status

- [x] Repository and gallery source files inspected.
- [x] Existing image count, series distribution, unique IDs and URLs checked.
- [x] Gallery sync and image SEO workflows inspected.
- [x] Existing Telegram authentication and Supabase schema inspected.
- [x] Desktop/mobile screenshots and full-resolution contact sheet reviewed.
- [x] All 50 images visually reviewed and assigned image-specific ALT text.
- [x] Natural dimensions and source image response evidence captured for all 50; intermittent Chromium ORB errors were verified recoverable with direct HTTP 200 JPEG responses.
- [x] Responsive layout, mobile lightbox controls, locale routing and language switching covered by Playwright.
- [x] Pinterest inventory reconciled: 50/50 current gallery images already published exactly once; 0 missing and 0 duplicate.
- [ ] Confirm rights/ownership or permission for all 50 images before any future new Pinterest publication.
- [ ] Update Pinterest profile website field to canonical HTTPS URL and remove the stale unverified Google+ URL.

## Security and community feature progress — 2026-11-03
- Inspected the live ZombieCash Supabase project and found the five-argument `record_survivor_arcade_score` SECURITY DEFINER overload executable through PUBLIC. Revoked PUBLIC/anon/authenticated execution and retained service_role access. Verified anon=false, authenticated=false, service_role=true.
- Added the `gallery_likes` table with RLS, service-role-only table grants, unique `(telegram_id, image_id)` constraint, and SECURITY INVOKER RPCs. Verified no anon/authenticated table or RPC access; no test user rows were inserted.
- Companion backend API is drafted in `vovik777-beep/zombcash-bot` PR #53. It validates the signed Survivor session, ignores client-supplied Telegram IDs and applies a 30/minute per-account rate limit. Not deployed.

## Phase 1 implementation status (feature branch only)

- [x] Additive taxonomy fields and stable anchors added to all 50 records; original Telegram source fields retained.
- [x] Preserve editorial metadata across hourly Telegram syncs by stable item ID.
- [x] Add localized category chips, search, newest/oldest/most-liked sorting and clear filters.
- [x] Add responsive styling, crawlable card HTML and 50-image sitemap generation.
- [x] Add dedicated gallery URLs for all nine locales, localized metadata, self-canonical, reciprocal hreflang, JSON-LD and sitemap.
- [x] Add aggregate first-party analytics hooks without search text or personal identifiers.
- [x] Complete image-by-image visual review and unique ALT text for all 50 images.
- [x] Add localized stable image sharing and mobile-visible lightbox controls.
- [x] Record 50 existing Pinterest Pins and exact board IDs; queue prevents republishing.
- [ ] Deploy backend PR #53 only after review/security checks, then verify live like/unlike.
- [ ] Design and implement comments only after moderation, abuse-prevention and rate-limit decisions.


## Next implementation steps

1. Complete the final CI run after the lightbox category/source-link polish and Pinterest ledger update.
2. Review backend PR #53 and deploy only after security review; then test live likes end-to-end.
3. Finish wider SEO/indexing and Core Web Vitals checks; validate Search Console data after the next full reporting window.
4. Update the Pinterest profile website field to https://zombcash.github.io and remove the stale unverified Google+ website entry.
5. Build comments as a separate moderation-protected feature. Do not create or publish additional Pins for the current 50-image gallery; all 50 are already published.

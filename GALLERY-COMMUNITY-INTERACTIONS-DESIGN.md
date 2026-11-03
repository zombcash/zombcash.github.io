# ZombieCash Gallery — Likes & Comments Security Design

**Status:** likes foundation implemented in a feature branch; comments are design-only and must not be exposed yet.

## Existing identity boundary

- The browser uses the existing Telegram Survivor login and stores a short-lived signed session token.
- The API server validates the token with _read_survivor_session() and derives telegram_id from its signed sub claim.
- Never accept a Telegram ID, public display name, like count, or moderation role from the request body as an authority.
- Supabase access stays server-side. The browser must never receive the Supabase secret/service-role key.
- Public profile display is limited to the existing public_display_name / safe fallback and optional photo_url; never return Telegram ID, auth token, or private account fields.

## Likes — current implementation

- Table: public.gallery_likes.
- Identity: composite primary key (telegram_id, image_id) prevents duplicate likes.
- image_id must match the stable Telegram image ID format ZOMBCASH/<message-id>:<media-index>.
- RLS is enabled. Direct table grants are revoked from PUBLIC, anon, and authenticated; the server role has the minimum table access.
- Aggregate and toggle RPCs use SECURITY INVOKER; execution is granted only to service_role.
- API endpoints:
  - GET /api/gallery/likes?ids=<comma-separated-ids> returns public counts and, if a valid Survivor session is present, the current user's liked state.
  - POST /api/gallery/like accepts { imageId, liked }; the server derives the account identity from the signed token.
- Per-account rate limit: 30 like changes per minute.
- Likes do not award Survival Points.
- Front-end cards and lightbox have like controls on the website feature branch. The API is in vovik777-beep/zombcash-bot PR #53 and is not deployed yet.

## Comments — proposed schema

gallery_comments:
- id bigint generated identity primary key
- image_id text not null with the same stable-ID validation as likes
- telegram_id bigint not null references survivor_profiles(telegram_id) on delete cascade
- body text not null, 1–500 characters after trim
- status text not null default visible, constrained to visible, pending, hidden, removed
- created_at, updated_at, edited_at timestamps
- Optional moderation audit fields: moderated_at, moderated_by (internal numeric account ID), moderation_reason

gallery_comment_reports:
- id bigint generated identity primary key
- comment_id bigint not null references gallery_comments(id) on delete cascade
- reporter_telegram_id bigint not null references survivor_profiles(telegram_id) on delete cascade
- reason text not null, maximum 300 characters
- status text not null default open, constrained to open, reviewed, dismissed
- created_at
- Unique (comment_id, reporter_telegram_id) so one account cannot report the same comment repeatedly.

Both tables must have RLS enabled, direct browser-role grants revoked, and explicit server-role grants only. New tables must not assume automatic Data API exposure.

## Proposed API contract

- GET /api/gallery/comments?image_id=...&limit=20
  - Public read of visible comments only; newest first; hard maximum 50.
  - Response contains comment ID, body, timestamps, safe public display name and optional avatar only.
  - Never expose telegram_id, auth data, moderation notes or reporter identities.
- POST /api/gallery/comments
  - Requires valid signed Survivor session and exact website Origin.
  - Request: { imageId, body }; identity comes only from the signed token.
  - Trim, normalize line endings, reject empty text, control characters, links and markup; 500-character maximum.
  - Initial limits: 3 comments/minute and 15/day per account; use durable server/database enforcement, not only browser timers.
- PATCH /api/gallery/comments/{id}
  - Requires the owner session; server filters by the token-derived account ID.
  - Allow edits only within 15 minutes of creation; re-run all body validation.
- POST /api/gallery/comments/{id}/delete
  - Owner-only soft removal; preserve the audit record, hide the body from public output.
- POST /api/gallery/comments/{id}/report
  - Requires login; unique report per account/comment; reason required.
- Admin moderation endpoint:
  - Requires account ID in ZOMBCASH_ADMIN_IDS, checked server-side.
  - Hide/restore/remove and record moderator/time/reason.
  - Never accept an admin role from a browser payload.

## Rendering and indexing

- Render comment text as text, never innerHTML; no Markdown or HTML.
- Escape names and URLs; validate avatar URLs before rendering.
- Add localized labels, empty states, errors and login prompts in all nine locales.
- Add keyboard and touch support; preserve the established gallery visual system.
- Comments remain noindex / excluded from structured SEO content initially. Reconsider only after moderation quality is demonstrated.
- No Survival Points for likes or comments at launch.

## Required tests before release

- Anonymous users can read visible comments but cannot create, edit, delete or report.
- Invalid/expired session is rejected.
- Request-supplied Telegram IDs are ignored.
- User A cannot edit/delete User B's comment (BOLA/IDOR).
- 500-character limit, whitespace-only input, link/markup rejection and XSS payloads.
- Edit window, duplicate reports and per-account rate limits.
- Admin moderation allow/deny cases and audit trail.
- Database RLS/grants and function EXECUTE privileges reviewed with Supabase security advisors.

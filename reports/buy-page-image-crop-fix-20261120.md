# Buy ZOMBCASH page — hero image crop fix

- Date: 2026-11-20
- Page: https://zombcash.github.io/buy-zombcash.html
- Scope: `buy-zombcash.html` only; no wallet, Jupiter, swap, token, navigation, localization, or production behavior changes.

## Finding
The hero image `/images/buy-survivor-process.webp` was forced into a fixed responsive height with `object-fit: cover`. On desktop this cropped the original 1672×941 composition vertically. A separate mobile media rule forced a 250px height, causing the same issue on narrow screens.

## Fix
- Set the hero image to `height: auto` and `max-height: none`.
- Use `object-fit: contain` and centered positioning.
- Removed the fixed 250px mobile height override.
- Preserved the existing image asset, alt text, intrinsic width/height attributes, caption, and lazy loading.

## Source validation
- Confirmed the desktop crop rule is absent on the fix branch.
- Confirmed the mobile fixed-height crop rule is absent.
- Confirmed desktop and mobile rules preserve natural image proportions.
- Confirmed the original hero asset reference remains present.
- PR #558 was squash-merged into `main` on 2026-11-20.
- Verified the merged `main` file contains the natural-height desktop and mobile rules and no longer contains either fixed-height crop rule.
- Live browser visual validation is still pending. An attempt to fetch the published GitHub Pages URL from this environment failed (cache miss / network DNS unavailable), so deployment and rendered appearance are not claimed as verified.

## Files
- `buy-zombcash.html` — hero image sizing only.
- `reports/buy-page-image-crop-fix-20261120.md` — this report.

## Safety
No transaction was signed, no wallet connected, no swap executed, no production deployment triggered, and `zombcash-world` was not modified.

## Git
- Branch: `fix/buy-page-full-image-20261120`
- PR: [#558](https://github.com/zombcash/zombcash.github.io/pull/558) — merged
- Merge commit on `main`: `01f937b707e8466acf41bee813e7bbdf103f6d7e`
- Verified `main` file blob: `73a390a259ef3dd0ed453bb0e24e15582b162297`
